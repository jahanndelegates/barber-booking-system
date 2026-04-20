import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-jolly-cream">
      <header className="bg-jolly-dark text-white px-4 py-4 border-b-4 border-jolly-pink">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✂</span>
            <div>
              <h1 className="font-black text-lg uppercase tracking-tight leading-none">
                The Jolly Barber
              </h1>
              <p className="text-brand-300 text-xs uppercase tracking-widest font-bold">
                Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-stone-400 text-xs hidden sm:block font-medium">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
