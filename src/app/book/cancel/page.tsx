'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatTime } from '@/lib/constants';

type AppointmentPreview = {
  id: string;
  status: 'confirmed' | 'cancelled';
  date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  services: { name: string; duration: number } | null;
};

type PageState = 'loading' | 'ready' | 'confirming' | 'cancelled' | 'already_cancelled' | 'error';

function CancelPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [appointment, setAppointment] = useState<AppointmentPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid cancellation link.');
      setPageState('error');
      return;
    }

    fetch(`/api/appointments/cancel?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setErrorMsg(data.error);
          setPageState('error');
          return;
        }
        setAppointment(data);
        if (data.status === 'cancelled') {
          setPageState('already_cancelled');
        } else {
          setPageState('ready');
        }
      })
      .catch(() => {
        setErrorMsg('Something went wrong. Please try again.');
        setPageState('error');
      });
  }, [token]);

  async function handleCancel() {
    if (!token) return;
    setPageState('confirming');

    const res = await fetch('/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error || 'Failed to cancel. Please try again.');
      setPageState('error');
      return;
    }

    setPageState('cancelled');
  }

  return (
    <div className="min-h-screen bg-jolly-cream">
      <header className="bg-jolly-dark text-white py-5 px-4 border-b-4 border-jolly-pink">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-black tracking-tight uppercase">✂ The Jolly Barber</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        {/* Loading */}
        {pageState === 'loading' && (
          <p className="text-stone-400 font-medium text-center">Loading your appointment…</p>
        )}

        {/* Error */}
        {pageState === 'error' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto text-2xl">✕</div>
            <h2 className="text-xl font-black uppercase">Something went wrong</h2>
            <p className="text-stone-500">{errorMsg}</p>
            <Link href="/book" className="inline-block mt-4 text-brand-500 font-black underline">
              Book a new appointment
            </Link>
          </div>
        )}

        {/* Already cancelled */}
        {pageState === 'already_cancelled' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-2xl">✕</div>
            <h2 className="text-xl font-black uppercase">Already cancelled</h2>
            <p className="text-stone-500">This appointment has already been cancelled.</p>
            <Link href="/book" className="inline-block mt-4 text-brand-500 font-black underline">
              Book a new appointment
            </Link>
          </div>
        )}

        {/* Ready to cancel */}
        {(pageState === 'ready' || pageState === 'confirming') && appointment && (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-2xl">
                ✂
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Cancel appointment?</h2>
              <p className="text-stone-400 mt-1">This can&apos;t be undone.</p>
            </div>

            {/* Appointment details */}
            <div className="bg-white rounded-2xl border-2 border-pink-100 divide-y divide-pink-50 mb-8">
              <Row label="Customer" value={appointment.customer_name} />
              {appointment.services && (
                <Row label="Service" value={appointment.services.name} />
              )}
              <Row label="Date" value={formatDate(appointment.date)} />
              <Row
                label="Time"
                value={`${formatTime(appointment.start_time)} – ${formatTime(appointment.end_time)}`}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCancel}
                disabled={pageState === 'confirming'}
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-sm hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {pageState === 'confirming' ? 'Cancelling…' : 'Yes, cancel my appointment'}
              </button>
              <Link
                href="/book"
                className="block w-full text-center py-4 rounded-2xl border-2 border-pink-200 text-brand-500 font-black uppercase tracking-widest text-sm hover:bg-pink-50 transition-colors"
              >
                Keep my appointment
              </Link>
            </div>
          </div>
        )}

        {/* Success */}
        {pageState === 'cancelled' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-2xl">✓</div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Appointment cancelled</h2>
            <p className="text-stone-500">
              Your appointment has been cancelled. Hope to see you again soon!
            </p>
            <Link
              href="/book"
              className="inline-block mt-6 px-6 py-3 rounded-2xl bg-brand-500 text-white font-black uppercase tracking-wide text-sm hover:bg-brand-600 transition-colors"
            >
              Book a new appointment
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-jolly-cream flex items-center justify-center">
          <p className="text-stone-400 font-medium">Loading…</p>
        </div>
      }
    >
      <CancelPageInner />
    </Suspense>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 flex justify-between text-sm">
      <span className="text-stone-400 font-black uppercase tracking-wide text-xs">{label}</span>
      <span className="font-bold text-jolly-dark text-right">{value}</span>
    </div>
  );
}
