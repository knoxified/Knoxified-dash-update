<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Knoxified Dashboard

This is the main dashboard application for the Knoxified platform, now deployed with Cloudflare service bindings for improved security and performance.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the required environment variables in `.env.local`:
   - `GEMINI_API_KEY` - Your Gemini API key
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key
3. Run the app:
   `npm run dev`

## Deploy to Cloudflare

This application is deployed to Cloudflare Workers using OpenNext. The deployment includes service bindings for secure communication between services.

### Service Bindings

The application now uses Cloudflare service bindings for secure internal communication:
- `VOICE_AGENTS` → voice-agent-beta (voice processing service)
- `OAUTH` → knoxified-auth (authentication service)
- `WORKER_SELF_REFERENCE` → knoxified-dashboard (self-reference for internal routing)

### Internal API Routes

All communication with the voice agent and OAuth services now goes through internal API routes:
- Voice agent requests: `/api/voice/*` → forwarded to voice-agent-beta via service binding
- OAuth requests: `/api/auth/*` → forwarded to knoxified-auth via service binding

### Security Improvements

With service bindings, the voice agent and OAuth services no longer need public endpoints, which significantly improves security by preventing direct external access to these services.
