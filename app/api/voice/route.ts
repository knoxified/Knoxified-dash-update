import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/\/(api|internal)\/voice/, "") || "/";

  try {
    const response = await env.VOICE_AGENTS.fetch(
      "https://voice-agent-beta.internal/voice" + targetPath,
      { method: request.method, headers: request.headers, body: request.body }
    );
    return new Response(response.body, {
      status: response.status, statusText: response.statusText, headers: response.headers,
    });
  } catch (error) {
    console.error("Voice agent service binding error:", error);
    return Response.json({ error: "Failed to reach voice agent service" }, { status: 502 });
  }
}
