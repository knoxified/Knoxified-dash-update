import type {Metadata} from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Knoxified | Enterprise AI OS',
  description: 'Manage your Enterprise AI Systems and Automations.',
};

import { Sidebar } from '@/components/Sidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { Header } from '@/components/Header';
import { CommandMenu } from '@/components/CommandMenu';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-[#EDEDED] font-sans antialiased min-h-screen selection:bg-sky-200 dark:selection:bg-[#00E5FF]/30 selection:text-slate-900 dark:selection:text-white`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Toaster position="bottom-right" richColors />
          <CommandMenu />
          <Sidebar />
          <main className="md:pl-60 min-h-screen flex flex-col">
            <Header />
            <MobileHeader />
            <div className="flex-1 p-5 md:p-8 max-w-[1400px] w-full mx-auto">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
