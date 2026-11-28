// Shared (client + server) invoice helpers. No server-only imports here.

export type InvoiceItem = { description: string; quantity: number; unit_price: number };
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export type DisplayStatus = InvoiceStatus | "overdue";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function cleanItems(raw: unknown): InvoiceItem[] {
  if (!Array.isArray(raw)) return [];
  const out: InvoiceItem[] = [];
  for (const r of raw.slice(0, 50)) {
    const description = String((r as any)?.description ?? "").trim().slice(0, 300);
    const quantity = Number((r as any)?.quantity);
    const unit_price = Number((r as any)?.unit_price);
    if (!description) continue;
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000) continue;
    if (!Number.isFinite(unit_price) || unit_price < 0 || unit_price > 100000000) continue;
    out.push({ description, quantity: round2(quantity), unit_price: round2(unit_price) });
  }
  return out;
}

export function calcTotals(items: InvoiceItem[], taxRate: number) {
  const subtotal = round2(items.reduce((s, i) => s + i.quantity * i.unit_price, 0));
  const rate = Number.isFinite(taxRate) ? Math.min(Math.max(taxRate, 0), 100) : 0;
  const tax_amount = round2((subtotal * rate) / 100);
  return { subtotal, tax_rate: rate, tax_amount, total: round2(subtotal + tax_amount) };
}

export function displayStatus(status: InvoiceStatus, dueDate: string): DisplayStatus {
  if (status !== "sent") return status;
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today ? "overdue" : "sent";
}

export function money(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
