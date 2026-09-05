const N8N_BASE_URL = "https://n8n.knoxified.org";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // The LeadReach n8n webhook is registered for GET, not POST (confirmed
    // via curl against the real production URL) -- a GET request can't carry
    // a JSON body, so this forwards the payload as a query string instead.
    // Knox is adding a Code node right after the webhook trigger in n8n to
    // turn $json.query.* back into the $json.body.* shape the rest of that
    // workflow already reads from, so nothing downstream needs to change.
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null) params.set(key, String(value));
    }

    const res = await fetch(`${N8N_BASE_URL}/webhook/leadreach?${params.toString()}`, {
      method: "GET",
    });

    const data = await res.json().catch(() => null);
    return Response.json(data, { status: res.status });
  } catch (error) {
    console.error("LeadReach webhook proxy error:", error);
    return Response.json({ error: "Failed to reach LeadReach automation" }, { status: 502 });
  }
}
