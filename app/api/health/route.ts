export async function GET() {
  return new Response('OK', { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/plain',
    }
  });
}

export async function HEAD() {
  return new Response(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
    }
  });
}