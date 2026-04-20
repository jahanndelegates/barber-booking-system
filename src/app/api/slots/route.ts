import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateTimeSlots, addMinutes } from '@/lib/constants';
import type { TimeSlot } from '@/types';

/**
 * GET /api/slots?date=YYYY-MM-DD&duration=30
 *
 * Returns all possible time slots for the day, each marked available or not.
 * A slot is unavailable if:
 *  - It overlaps a confirmed appointment
 *  - It overlaps a blocked time
 *  - The slot + duration would exceed business hours
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get('date');
  const durationParam = searchParams.get('duration');
  const nowParam = searchParams.get('now'); // HH:MM local time from client (only sent for today)

  if (!date || !durationParam) {
    return NextResponse.json(
      { error: 'date and duration are required' },
      { status: 400 }
    );
  }

  const duration = parseInt(durationParam, 10);
  if (isNaN(duration) || duration <= 0) {
    return NextResponse.json({ error: 'invalid duration' }, { status: 400 });
  }

  const supabase = createClient();

  // Fetch confirmed appointments for this date
  const { data: appointments, error: apptError } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('date', date)
    .eq('status', 'confirmed');

  if (apptError) {
    return NextResponse.json({ error: apptError.message }, { status: 500 });
  }

  // Fetch blocked times for this date
  const { data: blockedTimes, error: blockError } = await supabase
    .from('blocked_times')
    .select('start_time, end_time')
    .eq('date', date);

  if (blockError) {
    return NextResponse.json({ error: blockError.message }, { status: 500 });
  }

  const possibleStarts = generateTimeSlots(duration);

  /** Convert HH:MM or HH:MM:SS to total minutes since midnight */
  function toMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  /** Check if [aStart, aEnd) overlaps [bStart, bEnd) */
  function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
    return aStart < bEnd && aEnd > bStart;
  }

  // If the client sent their current local time, slots before it are in the past
  const nowMinutes = nowParam ? toMinutes(nowParam) : null;

  const slots: TimeSlot[] = possibleStarts.map((start) => {
    const end = addMinutes(start, duration);
    const slotStart = toMinutes(start);
    const slotEnd = toMinutes(end);

    const inThePast = nowMinutes !== null && slotStart <= nowMinutes;

    const blockedByAppt = appointments?.some((a) =>
      overlaps(slotStart, slotEnd, toMinutes(a.start_time), toMinutes(a.end_time))
    );

    const blockedByBlock = blockedTimes?.some((b) =>
      overlaps(slotStart, slotEnd, toMinutes(b.start_time), toMinutes(b.end_time))
    );

    return {
      start,
      end,
      available: !inThePast && !blockedByAppt && !blockedByBlock,
    };
  });

  return NextResponse.json(slots);
}
