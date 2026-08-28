/**
 * Cloudflare Worker test script to verify service bindings
 * This script should be deployed as a separate Worker to test the service bindings
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/test-voice-agent') {
      return await testVoiceAgent(env);
    }
    
    if (url.pathname === '/test-oauth') {
      return await testOAuth(env);
    }
    
    if (url.pathname === '/test-all') {
      return await testAll(env);
    }
    
    return new Response(`
      <h1>Service Binding Tests</h1>
      <p>Use the following endpoints to test service bindings:</p>
      <ul>
        <li><a href="/test-voice-agent">/test-voice-agent</a> - Test voice agent binding</li>
        <li><a href="/test-oauth">/test-oauth</a> - Test OAuth binding</li>
        <li><a href="/test-all">/test-all</a> - Test all bindings</li>
      </ul>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
};

async function testVoiceAgent(env) {
  try {
    // Test the VOICE_AGENTS service binding
    const response = await env.VOICE_AGENTS.fetch('https://voice-agent-beta.internal/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      service: 'VOICE_AGENTS',
      status: response.status,
      data: data
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      service: 'VOICE_AGENTS',
      error: error.message
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

async function testOAuth(env) {
  try {
    // Test the OAUTH service binding
    const response = await env.OAUTH.fetch('https://knoxified-auth.internal/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      service: 'OAUTH',
      status: response.status,
      data: data
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      service: 'OAUTH',
      error: error.message
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

async function testAll(env) {
  const results = [];
  
  // Test VOICE_AGENTS
  try {
    const voiceResponse = await env.VOICE_AGENTS.fetch('https://voice-agent-beta.internal/health', {
      method: 'GET'
    });
    results.push({
      service: 'VOICE_AGENTS',
      success: voiceResponse.ok,
      status: voiceResponse.status
    });
  } catch (error) {
    results.push({
      service: 'VOICE_AGENTS',
      success: false,
      error: error.message
    });
  }
  
  // Test OAUTH
  try {
    const oauthResponse = await env.OAUTH.fetch('https://knoxified-auth.internal/health', {
      method: 'GET'
    });
    results.push({
      service: 'OAUTH',
      success: oauthResponse.ok,
      status: oauthResponse.status
    });
  } catch (error) {
    results.push({
      service: 'OAUTH',
      success: false,
      error: error.message
    });
  }
  
  const allSuccess = results.every(r => r.success);
  
  return new Response(JSON.stringify({
    success: allSuccess,
    results: results
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
    status: allSuccess ? 200 : 500
  });
}