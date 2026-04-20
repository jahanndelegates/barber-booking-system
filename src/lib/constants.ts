// Business hours: 11 AM – 9 PM, Mon–Sat
export const BUSINESS_HOURS = {
  start: 11,  // 11:00 AM
  end: 21,    // 9:00 PM
};

export const SLOT_INTERVAL_MINUTES = 60;

// Days the barber is closed (0 = Sunday, 6 = Saturday)
export const CLOSED_DAYS: number[] = [0]; // Closed Sundays

/** Generate all possible HH:MM slots for a given duration within business hours */
export function generateTimeSlots(durationMinutes: number): string[] {
  const slots: string[] = [];
  const totalMinutes = (BUSINESS_HOURS.end - BUSINESS_HOURS.start) * 60;
  for (let offset = 0; offset + durationMinutes <= totalMinutes; offset += SLOT_INTERVAL_MINUTES) {
    const totalStartMinutes = BUSINESS_HOURS.start * 60 + offset;
    const h = Math.floor(totalStartMinutes / 60);
    const m = totalStartMinutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
}

/** Format HH:MM to 12-hour display, e.g. "09:00" → "9:00 AM" */
export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m} ${period}`;
}

/** Format cents to PHP display, e.g. 3000 → "₱30" */
export function formatPrice(cents: number): string {
  return `₱${(cents / 100).toFixed(0)}`;
}

/** Add minutes to HH:MM, returns HH:MM */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Convert a Date to a YYYY-MM-DD string in local time */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format YYYY-MM-DD to a human-readable date, e.g. "Monday, April 10" */
export function formatDate(dateStr: string): string {
  // Parse as local date to avoid UTC offset issues
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
