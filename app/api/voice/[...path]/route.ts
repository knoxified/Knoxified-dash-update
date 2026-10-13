import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@/lib/supabase/server";

// Worker routes that act on a userId sent in the body. For browser requests the
// userId is taken from the logged-in session, never from what the browser says.
const USER_BOUND_PATHS = new Set(["/web-call/start", "/token"]);

async function proxyToVoiceAgent(request: Request) {
  const { env } = getCloudflareContext();
  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/\/(api|internal)\/voice/, "") || "/";
  const targetUrl = "https://voice-agent-beta.internal/voice" + targetPath + url.search;

  try {
    let headers = request.headers;
    let body: BodyInit | null | undefined = ["GET", "HEAD"].includes(request.method) ? undefined : request.body;

    if (request.method === "POST" && url.pathname.startsWith("/api/voice") && USER_BOUND_PATHS.has(targetPath)) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
      const parsed = await request.json().catch(() => ({}));
      body = JSON.stringify({ ...parsed, userId: user.id });
      headers = new Headers(request.headers);
      headers.delete("content-length");
      headers.set("content-type", "application/json");
    }

    const response = await env.VOICE_AGENTS.fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });
    return new Response(response.body, {
      status: response.status, statusText: response.statusText, headers: response.headers,
    });
  } catch (error) {
    console.error("Voice agent service binding error:", error);
    return Response.json({ error: "Failed to reach voice agent service" }, { status: 502 });
  }
}

export const GET = proxyToVoiceAgent;
export const POST = proxyToVoiceAgent;
export const PUT = proxyToVoiceAgent;
export const PATCH = proxyToVoiceAgent;
export const DELETE = proxyToVoiceAgent;
