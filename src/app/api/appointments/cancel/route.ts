import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/appointments/cancel
 * Body: { token: string }
 *
 * Public endpoint — no auth required. Cancels the appointment matching
 * the cancel_token. Returns 404 if not found, 409 if already cancelled.
 */
export async function POST(request: NextRequest) {
  let body: { token: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token } = body;
  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  const supabase = createClient();

  // Look up by cancel token
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('id, status, date, start_time, customer_name')
    .eq('cancel_token', token)
    .single();

  if (fetchError || !appointment) {
    return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
  }

  if (appointment.status === 'cancelled') {
    return NextResponse.json(
      { error: 'This appointment has already been cancelled.' },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointment.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * GET /api/appointments/cancel?token=...
 * Fetches appointment details for the cancel confirmation page.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('appointments')
    .select('id, status, date, start_time, end_time, customer_name, services(name, duration)')
    .eq('cancel_token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
  }

  return NextResponse.json(data);
}
