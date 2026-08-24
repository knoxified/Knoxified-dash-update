import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Proxy route for voice-agent-beta via service binding (VOICE_AGENTS).
 * Requests to /api/voice/* are forwarded internally to the voice-agent-beta Worker.
 * No public internet call — goes directly through Cloudflare's network.
 */
export async function POST(request: Request) {
  const { env } = getCloudflareContext();

  const url = new URL(request.url);
  // Forward the path after /api/voice to the voice agent
  const targetPath = url.pathname.replace("/api/voice", "") || "/";

  try {
    const response = await env.VOICE_AGENTS.fetch(
      `https://voice-agent-beta.internal${targetPath}`,
      {
        method: request.method,
        headers: request.headers,
        body: request.body,
      }
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Voice agent service binding error:", error);
    return Response.json(
      { error: "Failed to reach voice agent service" },
      { status: 502 }
    );
  }
}

export async function GET(request: Request) {
  const { env } = getCloudflareContext();

  const url = new URL(request.url);
  const targetPath = url.pathname.replace("/api/voice", "") || "/";

  try {
    const response = await env.VOICE_AGENTS.fetch(
      `https://voice-agent-beta.internal${targetPath}`,
      {
        method: "GET",
        headers: request.headers,
      }
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Voice agent service binding error:", error);
    return Response.json(
      { error: "Failed to reach voice agent service" },
      { status: 502 }
    );
  }
}
