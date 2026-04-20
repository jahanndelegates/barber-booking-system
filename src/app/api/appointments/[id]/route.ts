import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { addMinutes } from '@/lib/constants';

/**
 * PATCH /api/appointments/[id]
 * Body: { status?: 'cancelled', date?: string, start_time?: string }
 * Auth required.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { status?: string; date?: string; start_time?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.status === 'cancelled') {
    updates.status = 'cancelled';
  }

  if (body.date && body.start_time) {
    // Need service duration to compute new end_time
    const { data: appt } = await supabase
      .from('appointments')
      .select('service_id, services(duration)')
      .eq('id', params.id)
      .single();

    if (!appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const services = appt.services as unknown as { duration: number } | null;
    const duration = services?.duration;
    if (!duration) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    updates.date = body.date;
    updates.start_time = body.start_time;
    updates.end_time = addMinutes(body.start_time, duration);
    updates.status = 'confirmed';
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', params.id)
    .select('*, services(*)')
    .single();

  if (error) {
    if (error.code === '23P01' || error.message.includes('no_overlap')) {
      return NextResponse.json(
        { error: 'That time slot is already booked. Please choose another.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
