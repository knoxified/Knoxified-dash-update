// Billing period helpers. A customer's usage (voice minutes) is counted from the
// start of their current monthly window, which is anchored to the date of their last
// successful payment (users.billing_period_start, set by the payment webhook).
// Customers without a stored date yet fall back to the calendar month, which is what
// the voice agent has always enforced, so nothing changes for them until their next payment.

export type BillingWindow = {
  usageStart: Date;        // start of the current monthly usage window
  usageEnd: Date;          // when the window resets (next monthly anniversary)
  renewsAt: Date | null;   // next charge date, only when known for certain
  estimated: boolean;      // true when falling back to the calendar month
};

// Adds whole months in UTC, clamping the day (Jan 31 + 1 month = Feb 28/29).
export function addMonthsUTC(anchor: Date, months: number): Date {
  const target = new Date(Date.UTC(
    anchor.getUTCFullYear(),
    anchor.getUTCMonth() + months,
    1,
    anchor.getUTCHours(),
    anchor.getUTCMinutes(),
    anchor.getUTCSeconds(),
    anchor.getUTCMilliseconds()
  ));
  const daysInMonth = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(anchor.getUTCDate(), daysInMonth));
  return target;
}

// Start/end of a paid billing period for a charge made at `paidAt`.
export function billingPeriodFor(paidAt: Date, interval?: string | null): { start: Date; end: Date } {
  const yearly = /year|annual/i.test(interval ?? "");
  return { start: paidAt, end: addMonthsUTC(paidAt, yearly ? 12 : 1) };
}

export function getBillingWindow(opts: {
  periodStart?: string | null;
  periodEnd?: string | null;
  now?: Date;
}): BillingWindow {
  const now = opts.now ?? new Date();
  const anchor = opts.periodStart ? new Date(opts.periodStart) : null;

  if (!anchor || isNaN(anchor.getTime()) || anchor.getTime() > now.getTime()) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return { usageStart: start, usageEnd: addMonthsUTC(start, 1), renewsAt: null, estimated: true };
  }

  let k = (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (now.getUTCMonth() - anchor.getUTCMonth());
  while (k > 0 && addMonthsUTC(anchor, k).getTime() > now.getTime()) k--;
  while (addMonthsUTC(anchor, k + 1).getTime() <= now.getTime()) k++;

  const end = opts.periodEnd ? new Date(opts.periodEnd) : null;
  return {
    usageStart: addMonthsUTC(anchor, k),
    usageEnd: addMonthsUTC(anchor, k + 1),
    renewsAt: end && !isNaN(end.getTime()) && end.getTime() > now.getTime() ? end : null,
    estimated: false,
  };
}
