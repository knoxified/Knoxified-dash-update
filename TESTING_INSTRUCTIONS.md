# How to Test Your Service Binding Setup

## ✅ Simple Testing Steps (No Scripts Needed)

Since you're using OpenNext with Cloudflare, here's how to verify your setup is working:

### 1. **Dashboard Functionality Test**
1. Go to your dashboard: https://dashboard.knoxified.org/
2. Try these actions:
   - Start a voice call (look for "Start Call" button)
   - Log in/logout to test authentication
   - Navigate through different sections of the dashboard

### 2. **Check Service Bindings are Working**
1. Go to Cloudflare Dashboard → Workers & Pages → knoxified-dashboard → Settings → Bindings
2. Verify these bindings exist:
   - VOICE_AGENTS → voice-agent-beta
   - OAUTH → knoxified-auth
   - WORKER_SELF_REFERENCE → knoxified-dashboard

### 3. **Check API Routes**
1. Visit: https://dashboard.knoxified.org/api/voice/health (if this endpoint exists)
2. Try: https://dashboard.knoxified.org/api/voice/health
3. Check if it returns a successful response (200 OK)

### 4. **Security Check**
1. Try accessing voice-agent-beta directly: 
   https://voice-agent-beta.roofing-dashboard.workers.dev/health
   (Should return 404 or redirect - not publicly accessible)
   
2. Try accessing OAuth endpoint directly:
   https://knoxified-auth.roofing-dashboard.workers.dev/verify
   (Should also be inaccessible)

### 4. **Optional: Run the Test Script**
If you want to run the test script:
1. Make sure you have Node.js installed
2. Run: `npm run test:bindings`
3. It will show you a summary of what to check

## ✅ What Success Looks Like

✅ Your dashboard works normally  
✅ Voice calls connect successfully  
✅ OAuth authentication works  
✅ You can remove public endpoints from voice-agent-beta and knoxified-auth for better security