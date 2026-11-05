// Shared by the reschedule dialog (live preview) and the server action (the
// email that is actually sent), so what the owner previews is what goes out.

export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

// "Friday, November 6 at 2:00 PM GMT+1"
export function formatAppointmentTime(iso: string | Date, timeZone: string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const tz = safeTimeZone(timeZone);
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: tz }).format(d);
  return `${day} at ${time}`;
}

export function firstNameOf(name: string | null | undefined): string {
  const first = String(name || "").trim().split(/\s+/)[0];
  return first || "there";
}

export function cleanReason(s: string | null | undefined): string {
  return String(s || "").replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "").slice(0, 200);
}

export function buildRescheduleMessage(opts: {
  firstName: string;
  reasonForBooking: string | null | undefined;
  when: string;
  ownerReason?: string | null;
  businessName?: string | null;
}): { subject: string; body: string } {
  const booking = cleanReason(opts.reasonForBooking);
  const why = cleanReason(opts.ownerReason);
  const appt = booking ? `your ${booking} appointment` : "your appointment";
  const sentence =
    `Hi ${opts.firstName}, we apologize for this as we are seriously considering shifting ${appt} to ${opts.when}` +
    (why ? ` due to ${why}.` : ".");
  const body =
    `${sentence}\n\n` +
    `If this new time doesn't suit you, just reply to this email and we'll find another that does.\n\n` +
    `Kind regards,\n${cleanReason(opts.businessName) || "The team"}`;
  return { subject: "A change to your appointment", body };
}
