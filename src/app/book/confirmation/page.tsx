'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Appointment } from '@/types';
import { formatDate, formatTime, formatPrice } from '@/lib/constants';

function ConfirmationPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) { setError('No appointment ID found.'); setLoading(false); return; }
    const supabase = createClient();
    supabase
      .from('appointments')
      .select('*, services(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError('Appointment not found.');
        else setAppointment(data as Appointment);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-jolly-cream flex items-center justify-center">
        <p className="text-stone-400 font-bold">Loading…</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-jolly-cream flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-red-500 font-bold">{error || 'Something went wrong.'}</p>
        <Link href="/book" className="text-brand-500 font-black underline">Book again</Link>
      </div>
    );
  }

  const svc = appointment.services!;

  return (
    <div className="min-h-screen bg-jolly-cream">
      <header className="bg-jolly-dark text-white py-5 px-4 border-b-4 border-jolly-pink">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-black tracking-tight uppercase">✂ The Jolly Barber</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10">
        {/* Success */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 rounded-full bg-jolly-pink flex items-center justify-center mb-4 text-4xl shadow-lg">
            ✂
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-jolly-dark">
            You&apos;re booked!
          </h2>
          <p className="text-stone-400 mt-2 font-medium">
            See you soon — please arrive a few minutes early.
          </p>
        </div>

        {/* Confirmation card */}
        <div className="bg-white rounded-2xl border-2 border-pink-100 divide-y divide-pink-50 mb-6 overflow-hidden">
          <div className="px-5 py-4 bg-brand-500">
            <p className="text-xs uppercase tracking-widest text-pink-200 font-black mb-0.5">
              Confirmation
            </p>
            <p className="text-white font-black text-lg font-mono">
              {appointment.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Row label="Service" value={svc.name} />
          <Row label="Date" value={formatDate(appointment.date)} />
          <Row label="Time" value={`${formatTime(appointment.start_time)} – ${formatTime(appointment.end_time)}`} />
          <Row label="Duration" value={`${svc.duration} min`} />
          <Row label="Price" value={formatPrice(svc.price)} />
          <Row label="Name" value={appointment.customer_name} />
          <Row label="Phone" value={appointment.customer_phone} />
          {appointment.notes && <Row label="Notes" value={appointment.notes} />}
        </div>

        <Link
          href="/book"
          className="block w-full text-center py-3 rounded-2xl border-2 border-pink-200 text-brand-500 font-black uppercase tracking-wide hover:bg-pink-50 transition-colors"
        >
          Book another appointment
        </Link>
      </main>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-jolly-cream flex items-center justify-center">
          <p className="text-stone-400 font-bold">Loading…</p>
        </div>
      }
    >
      <ConfirmationPageInner />
    </Suspense>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 flex justify-between text-sm">
      <span className="text-stone-400 font-black uppercase tracking-wide text-xs">{label}</span>
      <span className="font-bold text-jolly-dark text-right max-w-[60%]">{value}</span>
    </div>
  );
}
