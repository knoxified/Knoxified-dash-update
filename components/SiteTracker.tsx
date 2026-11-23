'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/track';

// Funnel arrival tracking for the marketing-to-dashboard handoff.
// Records every login-page view, plus only the FIRST page view of each browser session
// for signed-in use, so existing customers do not flood the funnel table.
export function SiteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/login')) {
      track('page_view');
      return;
    }
    try {
      if (window.sessionStorage.getItem('kx_dash_seen')) return;
      window.sessionStorage.setItem('kx_dash_seen', '1');
    } catch {}
    track('page_view');
  }, [pathname]);

  return null;
}
