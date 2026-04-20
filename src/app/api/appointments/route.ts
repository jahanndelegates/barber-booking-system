import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { addMinutes } from '@/lib/constants';
import { sendBookingConfirmation } from '@/lib/email';

/**
 * POST /api/appointments
 * Body: { service_id, date, start_time, customer_name, customer_phone, customer_email, notes? }
 *
 * Books an appointment. If the slot is already taken the DB exclusion constraint
 * fires and we return a 409.
 */
export async function POST(request: NextRequest) {
  let body: {
    service_id: string;
    date: string;
    start_time: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { service_id, date, start_time, customer_name, customer_phone, customer_email, notes } = body;

  if (!service_id || !date || !start_time || !customer_name || !customer_phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const phone = customer_phone.replace(/\D/g, '');
  if (phone.length < 10) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('duration')
    .eq('id', service_id)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const end_time = addMinutes(start_time, service.duration);

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      service_id,
      date,
      start_time,
      end_time,
      customer_name: customer_name.trim(),
      customer_phone: phone,
      customer_email: customer_email?.trim().toLowerCase() || null,
      notes: notes?.trim() || null,
      status: 'confirmed',
    })
    .select('*, services(*)')
    .single();

  if (error) {
    if (error.code === '23P01' || error.message.includes('no_overlap')) {
      return NextResponse.json(
        { error: 'That time slot is no longer available. Please choose another.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send confirmation email — fire and forget (don't block the response)
  if (data.customer_email) {
    sendBookingConfirmation(data).catch((err) =>
      console.error('Failed to send confirmation email:', err)
    );
  }

  return NextResponse.json(data, { status: 201 });
}
