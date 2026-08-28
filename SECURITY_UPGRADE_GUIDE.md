# Security Upgrade Guide

This guide explains how to remove public endpoints from the voice-agent-beta and knoxified-auth services now that they are accessible through service bindings.

## Overview

With the new service binding setup, your dashboard can communicate with the voice agent and OAuth services through Cloudflare's internal network instead of the public internet. This means you can remove the public endpoints from these services for improved security.

## Steps to Remove Public Endpoints

### 1. Voice Agent Service (voice-agent-beta)

1. **Locate the public route handlers** in your voice-agent-beta codebase
2. **Remove or comment out** the public route handlers that are no longer needed
3. **Keep only the internal routes** that are accessed through the service binding
4. **Update any CORS configurations** to remove public domain allowances
5. **Deploy the updated voice-agent-beta** service

Example of what to remove:
```javascript
// Remove public routes like these:
export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Remove this public route handler:
    if (url.pathname.startsWith('/public/')) {
      return handlePublicRequest(request, env);
    }
    
    // Keep internal routes:
    if (url.pathname.startsWith('/internal/')) {
      return handleInternalRequest(request, env);
    }
    
    return new Response('Not found', { status: 404 });
  }
};
```

### 2. OAuth Service (knoxified-auth)

1. **Locate the public route handlers** in your knoxified-auth codebase
2. **Remove or comment out** the public route handlers that are no longer needed
3. **Keep only the internal routes** that are accessed through the service binding
4. **Update any CORS configurations** to remove public domain allowances
5. **Deploy the updated knoxified-auth** service

### 3. Verify the Changes

After removing the public endpoints:

1. **Test the dashboard** to ensure all voice and auth functionality still works
2. **Verify that public URLs** no longer respond to requests
3. **Check Cloudflare logs** to confirm all requests are going through service bindings

## Benefits of This Change

- **Improved Security**: Services are no longer directly accessible from the public internet
- **Better Performance**: Internal routing through Cloudflare's network is faster
- **Reduced Attack Surface**: Fewer public endpoints to secure
- **Simplified Authentication**: No need for public API keys or tokens

## Rollback Plan

If you need to temporarily restore public access:

1. **Re-add the public route handlers** in both services
2. **Restore CORS configurations** for public domains
3. **Deploy the updated services**
4. **Update the dashboard** to use public URLs again (if needed temporarily)

Note: This should only be done as a temporary measure while investigating issues.