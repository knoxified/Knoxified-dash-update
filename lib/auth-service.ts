import { getCloudflareContext } from "@opennextjs/cloudflare";

// Calls knoxified-auth through the service binding with the shared CONNECT_API_KEY.
// Deliberately NOT in a "use server" file: exporting it from one would make it
// callable from the browser with any path.
export async function callAuth(path: string, body: unknown): Promise<{ status: number; json: any }> {
  const { env } = getCloudflareContext() as any;
  const key = env?.CONNECT_API_KEY || process.env.CONNECT_API_KEY;
  if (!key) return { status: 503, json: { error: "not_configured" } };
  try {
    const res = await env.OAUTH.fetch(`https://knoxified-auth.internal${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-connect-key": key },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  } catch {
    return { status: 502, json: { error: "auth_unavailable" } };
  }
}
