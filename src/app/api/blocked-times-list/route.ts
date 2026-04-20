import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/blocked-times-list?date=YYYY-MM-DD
 * Public read of blocked times for a given date (used by the dashboard UI).
 */
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  if (!date) {
    return NextResponse.json({ error: 'date required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('date', date)
    .order('start_time');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
