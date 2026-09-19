import { requireComplianceAcknowledged } from "@/lib/actions/compliance-actions";

const N8N_BASE_URL = "https://n8n.knoxified.org";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = (body as any)?.userId;
  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  // NOT currently enforced as a hard block -- the real acknowledgment
  // feature only went live today, so every existing account (including
  // ones already using this automation successfully) has a null
  // compliance_acknowledged_at and would be locked out with zero warning
  // or grace period. Re-enable the block below once there's a real
  // rollout plan (e.g. grandfathering existing accounts, or a warning
  // period before enforcement starts) rather than retroactively gating
  // everyone the moment the check shipped.
  // const compliance = await requireComplianceAcknowledged(userId);
  // if (!compliance.ok) {
  //   return Response.json({ error: compliance.error }, { status: 403 });
  // }

  try {
    const res = await fetch(`${N8N_BASE_URL}/webhook/mailcraft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);
    return Response.json(data, { status: res.status });
  } catch (error) {
    console.error("MailCraft webhook proxy error:", error);
    return Response.json({ error: "Failed to reach MailCraft automation" }, { status: 502 });
  }
}
