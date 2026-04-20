'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-jolly-dark flex items-center justify-center px-4">
      {/* Decorative pink circle */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-jolly-pink rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-600 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block rounded-full overflow-hidden shadow-2xl shadow-brand-900 border-4 border-jolly-pink mb-4">
            <Image
              src="/logo.png"
              alt="The Jolly Barber"
              width={160}
              height={160}
              className="block"
              priority
            />
          </div>
          <p className="text-brand-300 text-xs uppercase tracking-widest font-bold">
            Barber dashboard
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-8 shadow-2xl space-y-4"
        >
          <h2 className="text-lg font-black uppercase tracking-tight text-jolly-dark mb-4">
            Sign in
          </h2>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border-2 border-red-100 text-red-600 text-sm font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="barber@example.com"
              className="w-full p-3 rounded-2xl border-2 border-pink-100 bg-white focus:border-brand-400 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full p-3 rounded-2xl border-2 border-pink-100 bg-white focus:border-brand-400 focus:outline-none font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-brand-500 text-white font-black uppercase tracking-widest text-sm hover:bg-brand-600 disabled:opacity-60 transition-colors shadow-lg shadow-brand-200 mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
      </div>
    </div>
  );
}
