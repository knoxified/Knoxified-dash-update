import { getCloudflareContext } from "@opennextjs/cloudflare";

async function proxyToVoiceAgent(request: Request) {
  const { env } = getCloudflareContext();
  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/\/(api|internal)\/voice/, "") || "/";
  const targetUrl = "https://voice-agent-beta.internal/voice" + targetPath + url.search;

  try {
    const response = await env.VOICE_AGENTS.fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
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
