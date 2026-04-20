export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number; // minutes
  price: number;    // cents
  active: boolean;
  sort_order: number;
}

export interface Appointment {
  id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  status: 'confirmed' | 'cancelled';
  notes: string | null;
  cancel_token: string;
  created_at: string;
  services?: Service;
}

export interface BlockedTime {
  id: string;
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  reason: string | null;
  created_at: string;
}

export interface TimeSlot {
  start: string; // HH:MM
  end: string;   // HH:MM
  available: boolean;
}

export interface BookingFormData {
  service_id: string;
  date: string;
  start_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes?: string;
}
