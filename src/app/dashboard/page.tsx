'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Appointment, BlockedTime, TimeSlot } from '@/types';
import {
  formatDate,
  formatTime,
  formatPrice,
  toDateString,
  generateTimeSlots,
  addMinutes,
} from '@/lib/constants';

const TABS = ['appointments', 'block'] as const;
type Tab = (typeof TABS)[number];

export default function DashboardPage() {
  const today = toDateString(new Date());
  const [tab, setTab] = useState<Tab>('appointments');
  const [selectedDate, setSelectedDate] = useState(today);

  return (
    <div>
      {/* Date picker */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wide">
            Viewing date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 rounded-lg border border-stone-300 bg-white text-stone-900 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <p className="text-stone-500 text-sm pt-4 sm:pt-5">{formatDate(selectedDate)}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-stone-200 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t === 'appointments' ? 'Appointments' : 'Block Time'}
          </button>
        ))}
      </div>

      {tab === 'appointments' ? (
        <AppointmentsPanel date={selectedDate} />
      ) : (
        <BlockTimePanel date={selectedDate} />
      )}
    </div>
  );
}

// ============================================================
// Appointments panel
// ============================================================
function AppointmentsPanel({ date }: { date: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduling, setRescheduling] = useState<string | null>(null);

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`/api/dashboard/appointments?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
        else setError(data.error || 'Failed to load appointments');
      })
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function cancelAppointment(id: string) {
    if (!confirm('Cancel this appointment?')) return;
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (res.ok) {
      fetchAppointments();
    } else {
      const d = await res.json();
      alert(d.error || 'Failed to cancel');
    }
  }

  const confirmed = appointments.filter((a) => a.status === 'confirmed');
  const cancelled = appointments.filter((a) => a.status === 'cancelled');

  if (loading) return <p className="text-stone-500">Loading appointments…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-stone-700 mb-3">
          Confirmed ({confirmed.length})
        </h2>
        {confirmed.length === 0 ? (
          <p className="text-stone-400 text-sm">No confirmed appointments for this day.</p>
        ) : (
          <ul className="space-y-3">
            {confirmed.map((appt) => (
              <li key={appt.id}>
                <AppointmentCard
                  appointment={appt}
                  onCancel={cancelAppointment}
                  onReschedule={() => setRescheduling(appt.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {cancelled.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-stone-400 mb-3">
            Cancelled ({cancelled.length})
          </h2>
          <ul className="space-y-3 opacity-60">
            {cancelled.map((appt) => (
              <li key={appt.id}>
                <AppointmentCard appointment={appt} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {rescheduling && (
        <RescheduleModal
          appointmentId={rescheduling}
          currentDate={date}
          appointment={appointments.find((a) => a.id === rescheduling)!}
          onClose={() => setRescheduling(null)}
          onSuccess={() => {
            setRescheduling(null);
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
}

function AppointmentCard({
  appointment,
  onCancel,
  onReschedule,
}: {
  appointment: Appointment;
  onCancel?: (id: string) => void;
  onReschedule?: () => void;
}) {
  const svc = appointment.services;
  return (
    <div
      className={`bg-white rounded-xl border p-4 ${
        appointment.status === 'cancelled' ? 'border-stone-200' : 'border-stone-200 shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-stone-900">
            {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
          </p>
          <p className="text-sm text-stone-700 mt-0.5">
            {appointment.customer_name} · {appointment.customer_phone}
          </p>
          {svc && (
            <p className="text-sm text-stone-500 mt-0.5">
              {svc.name} · {svc.duration} min · {formatPrice(svc.price)}
            </p>
          )}
          {appointment.notes && (
            <p className="text-xs text-stone-400 mt-1 italic">
              &ldquo;{appointment.notes}&rdquo;
            </p>
          )}
        </div>
        {appointment.status === 'confirmed' && onCancel && onReschedule && (
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={onReschedule}
              className="text-xs px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Reschedule
            </button>
            <button
              onClick={() => onCancel(appointment.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        {appointment.status === 'cancelled' && (
          <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full shrink-0">
            Cancelled
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Reschedule modal
// ============================================================
function RescheduleModal({
  appointmentId,
  currentDate,
  appointment,
  onClose,
  onSuccess,
}: {
  appointmentId: string;
  currentDate: string;
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newDate, setNewDate] = useState(currentDate);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const duration = appointment.services?.duration ?? 30;
  const today = toDateString(new Date());

  useEffect(() => {
    if (!newDate) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    fetch(`/api/slots?date=${newDate}&duration=${duration}`)
      .then((r) => r.json())
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [newDate, duration]);

  async function handleSave() {
    if (!selectedSlot) return;
    setSaving(true);
    setError('');
    const res = await fetch(`/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate, start_time: selectedSlot }),
    });
    setSaving(false);
    if (res.ok) {
      onSuccess();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to reschedule');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h3 className="font-semibold text-stone-900">Reschedule appointment</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">New date</label>
            <input
              type="date"
              value={newDate}
              min={today}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          {loadingSlots && <p className="text-stone-500 text-sm">Loading slots…</p>}

          {!loadingSlots && slots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">New time</label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.start)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      !slot.available
                        ? 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
                        : selectedSlot === slot.start
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-brand-400'
                    }`}
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
        <div className="p-6 border-t border-stone-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-stone-300 text-stone-600 text-sm font-medium hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedSlot || saving}
            className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Block time panel
// ============================================================
function BlockTimePanel({ date }: { date: string }) {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const allSlots = generateTimeSlots(30);
  const endSlots =
    allSlots.length > 0
      ? [...allSlots.slice(1), addMinutes(allSlots[allSlots.length - 1], 30)]
      : [];

  const fetchBlocked = useCallback(() => {
    setLoading(true);
    fetch(`/api/blocked-times-list?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setBlockedTimes(d);
      })
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  async function handleBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!startTime || !endTime) return;
    if (endTime <= startTime) {
      setError('End time must be after start time');
      return;
    }
    setSaving(true);
    setError('');
    const res = await fetch('/api/blocked-times', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, start_time: startTime, end_time: endTime, reason }),
    });
    setSaving(false);
    if (res.ok) {
      setStartTime('');
      setEndTime('');
      setReason('');
      fetchBlocked();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to block time');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this blocked time?')) return;
    const res = await fetch(`/api/blocked-times?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchBlocked();
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {/* Form */}
      <div>
        <h2 className="text-base font-semibold text-stone-700 mb-4">Block off time</h2>
        <form
          onSubmit={handleBlock}
          className="bg-white rounded-xl border border-stone-200 p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Start time</label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select start time</option>
              {allSlots.map((s) => (
                <option key={s} value={s}>
                  {formatTime(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">End time</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select end time</option>
              {endSlots.map((s) => (
                <option key={s} value={s}>
                  {formatTime(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Reason <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Lunch break, personal errand…"
              className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Block this time'}
          </button>
        </form>
      </div>

      {/* List */}
      <div>
        <h2 className="text-base font-semibold text-stone-700 mb-4">
          Blocked times for {formatDate(date)}
        </h2>
        {loading ? (
          <p className="text-stone-500 text-sm">Loading…</p>
        ) : blockedTimes.length === 0 ? (
          <p className="text-stone-400 text-sm">No blocked times for this day.</p>
        ) : (
          <ul className="space-y-2">
            {blockedTimes.map((b) => (
              <li
                key={b.id}
                className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  </p>
                  {b.reason && <p className="text-xs text-stone-500">{b.reason}</p>}
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-xs text-red-500 hover:text-red-700 ml-4"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
