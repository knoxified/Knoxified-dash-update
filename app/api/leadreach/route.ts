const N8N_BASE_URL = "https://n8n.knoxified.org";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetch(`${N8N_BASE_URL}/webhook/leadreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);
    return Response.json(data, { status: res.status });
  } catch (error) {
    console.error("LeadReach webhook proxy error:", error);
    return Response.json({ error: "Failed to reach LeadReach automation" }, { status: 502 });
  }
}
