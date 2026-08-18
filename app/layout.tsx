import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: 'Knoxified | Enterprise AI OS',
  description: 'Manage your Enterprise AI Systems and Automations.',
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-slate-50 dark:bg-[#060d19] text-slate-900 dark:text-[#e2e8f0] font-sans antialiased min-h-screen`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Toaster 
            position="bottom-right" 
            richColors 
            toastOptions={{
              style: {
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }
            }}
          />
          {children}
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var accent = localStorage.getItem('knoxified-accent');
                if (accent) {
                  document.documentElement.style.setProperty('--accent', accent);
                  var r = parseInt(accent.slice(1,3),16);
                  var g = parseInt(accent.slice(3,5),16);
                  var b = parseInt(accent.slice(5,7),16);
                  document.documentElement.style.setProperty('--accent-dim', 'rgba(' + r + ',' + g + ',' + b + ',0.15)');
                  document.documentElement.style.setProperty('--accent-glow', 'rgba(' + r + ',' + g + ',' + b + ',0.4)');
                  document.documentElement.style.setProperty('--accent-muted', 'rgba(' + r + ',' + g + ',' + b + ',0.08)');
                }
              } catch(e) {}
            })();
          `
        }} />
      </body>
    </html>
  );
}
