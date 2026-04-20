'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Service, TimeSlot } from '@/types';
import {
  formatPrice,
  formatTime,
  formatDate,
  toDateString,
  CLOSED_DAYS,
} from '@/lib/constants';

type Step = 'service' | 'datetime' | 'details' | 'confirm';

export default function BookPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const today = toDateString(new Date());

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then(setServices)
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetch(`/api/slots?date=${selectedDate}&duration=${selectedService.duration}`)
      .then((r) => r.json())
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedService]);

  function handleServiceSelect(svc: Service) {
    setSelectedService(svc);
    setSelectedDate('');
    setSelectedSlot(null);
    setStep('datetime');
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedDate(e.target.value);
    setSelectedSlot(null);
  }

  function isDateDisabled(dateStr: string): boolean {
    const [y, m, d] = dateStr.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return CLOSED_DAYS.includes(day);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedSlot) return;
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: selectedService.id,
        date: selectedDate,
        start_time: selectedSlot.start,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        notes,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || 'Something went wrong. Please try again.');
      if (res.status === 409) {
        setSelectedSlot(null);
        setStep('datetime');
        fetch(`/api/slots?date=${selectedDate}&duration=${selectedService.duration}`)
          .then((r) => r.json())
          .then(setSlots);
      }
      return;
    }

    router.push(`/book/confirmation?id=${data.id}`);
  }

  const stepIndex = ['service', 'datetime', 'details', 'confirm'].indexOf(step);
  const stepLabels = ['Service', 'Date & Time', 'Your Info', 'Confirm'];

  return (
    <div className="min-h-screen bg-jolly-cream">
      {/* Header */}
      <header className="bg-jolly-dark text-white py-5 px-4 border-b-4 border-jolly-pink">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              ✂ The Jolly Barber
            </h1>
            <p className="text-brand-300 text-xs mt-0.5 tracking-widest uppercase">
              Book your appointment
            </p>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b-2 border-jolly-pink/30">
        <div className="max-w-xl mx-auto px-4 py-3 flex gap-2 text-xs font-bold tracking-wider uppercase">
          {stepLabels.map((label, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className="w-4 h-px bg-pink-200" />}
                <span className={active ? 'text-brand-600' : done ? 'text-pink-300' : 'text-stone-300'}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* ---- STEP 1: Choose service ---- */}
        {step === 'service' && (
          <section>
            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Choose a service</h2>
            <p className="text-stone-400 text-sm mb-5">What are we doing today?</p>
            {loadingServices ? (
              <p className="text-stone-400">Loading services…</p>
            ) : (
              <ul className="space-y-3">
                {services.map((svc) => (
                  <li key={svc.id}>
                    <button
                      onClick={() => handleServiceSelect(svc)}
                      className="w-full text-left p-4 rounded-2xl border-2 border-pink-100 bg-white hover:border-brand-400 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-jolly-dark group-hover:text-brand-600 transition-colors">
                            {svc.name}
                          </p>
                          {svc.description && (
                            <p className="text-sm text-stone-400 mt-0.5">{svc.description}</p>
                          )}
                          <p className="text-xs text-stone-300 mt-1 uppercase tracking-wide font-bold">
                            {svc.duration} min
                          </p>
                        </div>
                        <span className="font-black text-brand-500 ml-4 text-lg whitespace-nowrap group-hover:text-brand-600">
                          {formatPrice(svc.price)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ---- STEP 2: Date & Time ---- */}
        {step === 'datetime' && selectedService && (
          <section>
            <button
              onClick={() => setStep('service')}
              className="text-sm text-brand-400 hover:text-brand-600 mb-5 flex items-center gap-1 font-bold"
            >
              ← Back
            </button>

            <div className="bg-white rounded-2xl border-2 border-pink-100 p-4 mb-6">
              <p className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1">Selected</p>
              <p className="font-black text-jolly-dark">{selectedService.name}</p>
              <p className="text-sm text-stone-400">
                {selectedService.duration} min · {formatPrice(selectedService.price)}
              </p>
            </div>

            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Pick a date</h2>
            <p className="text-stone-400 text-sm mb-4">We&apos;re open Mon–Sat, 11am–9pm</p>
            <input
              type="date"
              value={selectedDate}
              min={today}
              onChange={handleDateChange}
              className="w-full p-3 rounded-2xl border-2 border-pink-100 bg-white focus:border-brand-400 focus:outline-none text-jolly-dark font-medium mb-6 appearance-none [color-scheme:light]"
              style={{ colorScheme: 'light', color: '#1a1a1a' }}
            />

            {selectedDate && (
              <>
                {isDateDisabled(selectedDate) ? (
                  <div className="p-4 rounded-2xl bg-pink-50 border-2 border-pink-200 text-brand-600 font-bold text-sm">
                    We&apos;re closed that day — pick another date!
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-black uppercase tracking-tight mb-4">
                      {formatDate(selectedDate)}
                    </h2>
                    {loadingSlots ? (
                      <p className="text-stone-400">Loading times…</p>
                    ) : slots.length === 0 ? (
                      <p className="text-stone-400">No times available.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot.start}
                            disabled={!slot.available}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setStep('details');
                            }}
                            className={`py-2 px-3 rounded-xl text-sm font-bold border-2 transition-all ${
                              !slot.available
                                ? 'border-pink-50 bg-pink-50 text-pink-200 cursor-not-allowed'
                                : selectedSlot?.start === slot.start
                                ? 'border-brand-500 bg-brand-500 text-white'
                                : 'border-pink-100 bg-white text-jolly-dark hover:border-brand-400 hover:text-brand-600'
                            }`}
                          >
                            {formatTime(slot.start)}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        )}

        {/* ---- STEP 3: Customer details ---- */}
        {step === 'details' && selectedService && selectedSlot && (
          <section>
            <button
              onClick={() => setStep('datetime')}
              className="text-sm text-brand-400 hover:text-brand-600 mb-5 flex items-center gap-1 font-bold"
            >
              ← Back
            </button>

            <div className="bg-white rounded-2xl border-2 border-pink-100 p-4 mb-6">
              <p className="font-black text-jolly-dark">{selectedService.name}</p>
              <p className="text-sm text-stone-400">
                {formatDate(selectedDate)} at {formatTime(selectedSlot.start)}
              </p>
              <p className="text-xs text-stone-300 font-bold uppercase tracking-wide mt-1">
                {selectedService.duration} min · {formatPrice(selectedService.price)}
              </p>
            </div>

            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Your info</h2>
            <p className="text-stone-400 text-sm mb-5">Almost there — just a couple details</p>

            <form
              onSubmit={(e) => { e.preventDefault(); setStep('confirm'); }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-black text-stone-500 uppercase tracking-widest mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="John Smith"
                  className="w-full p-3 rounded-2xl border-2 border-pink-100 bg-white focus:border-brand-400 focus:outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-stone-500 uppercase tracking-widest mb-1">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="(555) 123-4567"
                  className="w-full p-3 rounded-2xl border-2 border-pink-100 bg-white focus:border-brand-400 focus:outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-stone-500 uppercase tracking-widest mb-1">
                  Email <span className="text-stone-300 font-medium normal-case">(for confirmation)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full p-3 rounded-2xl border-2 border-pink-100 bg-white focus:border-brand-400 focus:outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-stone-500 uppercase tracking-widest mb-1">
                  Notes <span className="text-stone-300 font-medium normal-case">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special requests…"
                  className="w-full p-3 rounded-2xl border-2 border-pink-100 bg-white focus:border-brand-400 focus:outline-none resize-none font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-jolly-dark text-white font-black uppercase tracking-wide hover:bg-brand-600 transition-colors border-2 border-jolly-dark hover:border-brand-600"
              >
                Review booking →
              </button>
            </form>
          </section>
        )}

        {/* ---- STEP 4: Confirm ---- */}
        {step === 'confirm' && selectedService && selectedSlot && (
          <section>
            <button
              onClick={() => setStep('details')}
              className="text-sm text-brand-400 hover:text-brand-600 mb-5 flex items-center gap-1 font-bold"
            >
              ← Back
            </button>

            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Review booking</h2>
            <p className="text-stone-400 text-sm mb-5">Looks good? Let&apos;s lock it in.</p>

            <div className="bg-white rounded-2xl border-2 border-pink-100 divide-y divide-pink-50 mb-6">
              <Row label="Service" value={selectedService.name} />
              <Row label="Date" value={formatDate(selectedDate)} />
              <Row label="Time" value={`${formatTime(selectedSlot.start)} – ${formatTime(selectedSlot.end)}`} />
              <Row label="Duration" value={`${selectedService.duration} min`} />
              <Row label="Price" value={formatPrice(selectedService.price)} />
              <Row label="Name" value={customerName} />
              <Row label="Phone" value={customerPhone} />
              {customerEmail && <Row label="Email" value={customerEmail} />}
              {notes && <Row label="Notes" value={notes} />}
            </div>

            {error && <p className="text-red-600 text-sm font-bold mb-4">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-brand-500 text-white font-black uppercase tracking-widest text-sm hover:bg-brand-600 disabled:opacity-60 transition-colors shadow-lg shadow-brand-200"
            >
              {submitting ? 'Booking…' : '✂ Confirm appointment'}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 flex justify-between text-sm">
      <span className="text-stone-400 font-bold uppercase tracking-wide text-xs">{label}</span>
      <span className="font-bold text-jolly-dark text-right max-w-[60%]">{value}</span>
    </div>
  );
}
