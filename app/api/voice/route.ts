import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// Proxy to voice-agent-beta using Cloudflare service binding
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Forward the request to voice-agent-beta via service binding
    const url = new URL(request.url);
    const pathname = url.pathname.replace('/api/voice', '');
    const targetUrl = `https://voice-agent-beta.internal${pathname}`;

    const body = await request.text();
    const headers = new Headers(request.headers);
    headers.set('Content-Type', 'application/json');

    // In a Cloudflare Worker context, you would use:
    // const response = await env.VOICE_AGENTS.fetch(targetUrl, {
    //   method: request.method,
    //   headers,
    //   body,
    // });

    // For now, we'll proxy to the public URL (to be replaced with service binding)
    const response = await fetch(`https://voice-agent-beta.roofing-dashboard.workers.dev${pathname}`, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Voice API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}