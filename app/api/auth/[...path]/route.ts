import { getCloudflareContext } from "@opennextjs/cloudflare";

async function proxyToOAuth(request: Request) {
  const { env } = getCloudflareContext();
  const url = new URL(request.url);
  const targetPath = url.pathname.replace("/api/auth", "") || "/";
  const targetUrl = "https://knoxified-auth.internal" + targetPath + url.search;

  try {
    const response = await env.OAUTH.fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    });
    return new Response(response.body, {
      status: response.status, statusText: response.statusText, headers: response.headers,
    });
  } catch (error) {
    console.error("OAuth service binding error:", error);
    return Response.json({ error: "Failed to reach authentication service" }, { status: 502 });
  }
}

export const GET = proxyToOAuth;
export const POST = proxyToOAuth;
export const PUT = proxyToOAuth;
export const PATCH = proxyToOAuth;
export const DELETE = proxyToOAuth;
