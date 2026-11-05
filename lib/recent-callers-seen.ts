"use client";

import { createClient } from "@/lib/supabase/client";

// "Recent callers" on the Overview behaves like a notification: it appears when
// someone has called since you last looked, and goes away once you've seen it.
// The last-seen time is kept in this browser, per account.

const KEY = (userId: string) => `knoxified:recent-callers-seen:${userId}`;

export async function getSeenAt(): Promise<{ userId: string | null; seenAt: number | null }> {
  try {
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) return { userId: null, seenAt: null };
    const raw = window.localStorage.getItem(KEY(user.id));
    const n = raw ? Number(raw) : NaN;
    return { userId: user.id, seenAt: Number.isFinite(n) ? n : null };
  } catch {
    return { userId: null, seenAt: null };
  }
}

export async function markCallersSeen(): Promise<void> {
  try {
    const { data: { user } } = await createClient().auth.getUser();
    if (user) window.localStorage.setItem(KEY(user.id), String(Date.now()));
  } catch {
    /* storage unavailable: the card just reappears next visit */
  }
}
