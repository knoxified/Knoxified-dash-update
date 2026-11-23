// First-party funnel tracking. Sends each event to /api/track (stored in Supabase
// site_events) and mirrors it to GTM's dataLayer as "kx_<event>" for GA4.
// Never throws and never blocks the page. Keep the dashboard copy of this file in sync.

// Events are stored by the marketing site (same Supabase project, one funnel table).
export const TRACK_ENDPOINT = 'https://knoxified.org/api/track';

const UUID = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

const COOKIE = 'kx_aid';
const MAX_AGE = 60 * 60 * 24 * 180;

function readCookie(name: string): string | null {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(name + '='));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

function visitorId(): string {
  let id = readCookie(COOKIE);
  if (!id) {
    id = UUID();
    const host = window.location.hostname;
    const domain = host === 'knoxified.org' || host.endsWith('.knoxified.org') ? '; domain=.knoxified.org' : '';
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE}=${encodeURIComponent(id)}; max-age=${MAX_AGE}; path=/${domain}; SameSite=Lax${secure}`;
  }
  return id;
}

type Ctx = { sessionId: string; referrer: string | null; utm: Record<string, string> };

function sessionContext(): Ctx {
  try {
    const saved = window.sessionStorage.getItem('kx_ctx');
    if (saved) return JSON.parse(saved);
  } catch {}
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const v = params.get(k);
    if (v) utm[k] = v.slice(0, 100);
  }
  let referrer: string | null = null;
  try {
    if (document.referrer && new URL(document.referrer).hostname.replace(/^www\./, '') !== window.location.hostname.replace(/^www\./, '')) {
      referrer = document.referrer.slice(0, 500);
    }
  } catch {}
  const ctx: Ctx = { sessionId: UUID(), referrer, utm };
  try { window.sessionStorage.setItem('kx_ctx', JSON.stringify(ctx)); } catch {}
  return ctx;
}

export function track(event: string, props: Record<string, string | number | boolean | null> = {}) {
  if (typeof window === 'undefined') return;
  try {
    (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event: `kx_${event}`, ...props });

    const ctx = sessionContext();
    const body = JSON.stringify({
      event,
      props,
      path: window.location.pathname,
      host: window.location.hostname,
      visitorId: visitorId(),
      sessionId: ctx.sessionId,
      referrer: ctx.referrer,
      utm: ctx.utm,
    });
    // text/plain keeps this a "simple" request (no CORS preflight), also from the dashboard.
    if (navigator.sendBeacon && navigator.sendBeacon(TRACK_ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
    fetch(TRACK_ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  } catch {
    // tracking must never affect the page
  }
}
