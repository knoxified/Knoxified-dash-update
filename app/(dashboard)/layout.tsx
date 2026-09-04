import { Sidebar } from '@/components/Sidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { Header } from '@/components/Header';
import { CommandMenu } from '@/components/CommandMenu';
import { InactivityLogout } from '@/components/InactivityLogout';
import { createClient } from '@/lib/supabase/server';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isLocked = false;
  if (user) {
    const { data: userRow } = await supabase
      .from('users')
      .select('credits_locked')
      .eq('id', user.id)
      .maybeSingle();
    isLocked = Boolean(userRow?.credits_locked);
  }

  return (
    <>
      <InactivityLogout />
      <CommandMenu />
      <Sidebar />
      <main className="md:pl-60 min-h-screen flex flex-col">
        <Header />
        <MobileHeader />
        {isLocked && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 md:px-8 py-2.5 flex items-center justify-center gap-2 text-center">
            <Lock size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-[13px] text-amber-700 dark:text-amber-300">
              You can browse everything, but calls and automation runs are paused on this account.{' '}
              <Link href="/billing" className="font-semibold underline underline-offset-2 hover:opacity-80">
                Upgrade to unlock
              </Link>
            </p>
          </div>
        )}
        <div className="flex-1 p-5 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </div>
      </main>
    </>
  );
}
