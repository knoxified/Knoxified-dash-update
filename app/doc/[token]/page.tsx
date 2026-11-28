import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/server";
import PrintButton from "@/app/invoice/[token]/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Document", robots: { index: false, follow: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PublicDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID_RE.test(token)) notFound();

  const { data: doc } = await supabaseAdmin
    .from("generated_documents")
    .select("id, user_id, title, body, status, sent_at, viewed_at")
    .eq("public_token", token)
    .maybeSingle();
  if (!doc || doc.status === "draft") notFound();

  const { data: biz } = await supabaseAdmin.from("invoice_settings").select("business_name").eq("user_id", doc.user_id).maybeSingle();

  if (!doc.viewed_at && doc.status === "sent") {
    await supabaseAdmin.from("generated_documents").update({ viewed_at: new Date().toISOString() }).eq("id", doc.id).is("viewed_at", null);
  }

  const blocks = String(doc.body).split(/\r?\n/);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
        <div className="rounded-xl bg-white p-6 shadow-sm sm:p-10 print:rounded-none print:shadow-none">
          {biz?.business_name && <p className="mb-6 text-sm text-slate-500">{biz.business_name}</p>}
          {doc.status === "void" && (
            <p className="mb-6 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">This document has been withdrawn by the sender.</p>
          )}
          {blocks.map((line, i) => {
            if (line.startsWith("## ")) return <h3 key={i} className="mt-6 mb-1 text-base font-semibold">{line.slice(3)}</h3>;
            if (line.startsWith("# ")) return <h1 key={i} className="mb-4 text-2xl font-semibold">{line.slice(2)}</h1>;
            if (!line.trim()) return <div key={i} className="h-3" />;
            return <p key={i} className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">{line}</p>;
          })}
        </div>
      </div>
    </main>
  );
}
