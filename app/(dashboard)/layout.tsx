import { Sidebar } from '@/components/Sidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { Header } from '@/components/Header';
import { CommandMenu } from '@/components/CommandMenu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommandMenu />
      <Sidebar />
      <main className="md:pl-60 min-h-screen flex flex-col">
        <Header />
        <MobileHeader />
        <div className="flex-1 p-5 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </div>
      </main>
    </>
  );
}
