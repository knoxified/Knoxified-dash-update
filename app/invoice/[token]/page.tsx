import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/server";
import { displayStatus, money, type InvoiceItem } from "@/lib/invoices";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fmtDate = (d: string) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID_RE.test(token)) notFound();

  const { data: inv } = await supabaseAdmin
    .from("invoices")
    .select("id, user_id, number, status, issue_date, due_date, currency, items, subtotal, tax_rate, tax_amount, total, notes, viewed_at, invoice_clients(name, company, email, address)")
    .eq("public_token", token)
    .maybeSingle();

  // Drafts are private until sent.
  if (!inv || inv.status === "draft") notFound();

  const { data: biz } = await supabaseAdmin
    .from("invoice_settings")
    .select("business_name, business_email, business_address, tax_id, payment_instructions")
    .eq("user_id", inv.user_id)
    .maybeSingle();

  if (!inv.viewed_at && inv.status === "sent") {
    await supabaseAdmin.from("invoices").update({ viewed_at: new Date().toISOString() }).eq("id", inv.id).is("viewed_at", null);
  }

  const client: any = Array.isArray((inv as any).invoice_clients) ? (inv as any).invoice_clients[0] : (inv as any).invoice_clients;
  const items = (inv.items as InvoiceItem[]) || [];
  const status = displayStatus(inv.status, inv.due_date);
  const badge =
    status === "paid" ? "bg-green-100 text-green-800"
    : status === "overdue" ? "bg-red-100 text-red-800"
    : status === "void" ? "bg-slate-200 text-slate-600"
    : "bg-blue-100 text-blue-800";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex justify-end print:hidden">
          <PrintButton />
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm sm:p-10 print:rounded-none print:shadow-none">
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold">{biz?.business_name || "Invoice"}</h1>
              {biz?.business_address && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{biz.business_address}</p>}
              {biz?.business_email && <p className="text-sm text-slate-600">{biz.business_email}</p>}
              {biz?.tax_id && <p className="text-sm text-slate-600">Tax ID: {biz.tax_id}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-semibold">Invoice</p>
              <p className="text-sm text-slate-600">{inv.number}</p>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium uppercase ${badge}`}>{status}</span>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Billed to</p>
              <p className="mt-1 font-medium">{client?.name}</p>
              {client?.company && <p className="text-sm text-slate-600">{client.company}</p>}
              {client?.address && <p className="whitespace-pre-line text-sm text-slate-600">{client.address}</p>}
              {client?.email && <p className="text-sm text-slate-600">{client.email}</p>}
            </div>
            <div className="sm:text-right text-sm">
              <p><span className="text-slate-500">Issued:</span> {fmtDate(inv.issue_date)}</p>
              <p><span className="text-slate-500">Due:</span> {fmtDate(inv.due_date)}</p>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2 text-right">Price</th>
                  <th className="py-2 pl-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 pr-2">{it.description}</td>
                    <td className="py-2 px-2 text-right">{it.quantity}</td>
                    <td className="py-2 px-2 text-right">{money(it.unit_price, inv.currency)}</td>
                    <td className="py-2 pl-2 text-right">{money(it.quantity * it.unit_price, inv.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(Number(inv.subtotal), inv.currency)}</span></div>
            {Number(inv.tax_rate) > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">Tax ({Number(inv.tax_rate)}%)</span><span>{money(Number(inv.tax_amount), inv.currency)}</span></div>
            )}
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-semibold">
              <span>Total</span><span>{money(Number(inv.total), inv.currency)}</span>
            </div>
          </div>

          {biz?.payment_instructions && (
            <div className="mt-8">
              <p className="text-xs font-medium uppercase text-slate-500">How to pay</p>
              <p className="mt-1 whitespace-pre-line text-sm">{biz.payment_instructions}</p>
            </div>
          )}
          {inv.notes && (
            <div className="mt-6">
              <p className="text-xs font-medium uppercase text-slate-500">Notes</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{inv.notes}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
