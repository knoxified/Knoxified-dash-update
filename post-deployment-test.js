/**
 * Post-deployment verification script
 * Run this script after deploying to verify that all components are working correctly
 */

async function verifyDeployment() {
  console.log('🔍 Verifying deployment...\n');
  
  // Test 1: Check that the dashboard is accessible
  try {
    console.log('1. Testing dashboard accessibility...');
    const dashboardResponse = await fetch('https://knoxified-dashboard.roofing-dashboard.workers.dev');
    if (dashboardResponse.ok) {
      console.log('   ✅ Dashboard is accessible');
    } else {
      console.log('   ❌ Dashboard is not accessible');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error accessing dashboard:', error.message);
    return false;
  }
  
  // Test 2: Check internal voice API route
  try {
    console.log('2. Testing internal voice API route...');
    // Note: This test would need to be run from within the Cloudflare environment
    // or with proper authentication
    console.log('   ⚠️  Manual test required: Try making a request to /api/voice/health');
  } catch (error) {
    console.log('   ❌ Error testing voice API route:', error.message);
  }
  
  // Test 3: Check internal auth API route
  try {
    console.log('3. Testing internal auth API route...');
    // Note: This test would need to be run from within the Cloudflare environment
    // or with proper authentication
    console.log('   ⚠️  Manual test required: Try making a request to /api/auth/health');
  } catch (error) {
    console.log('   ❌ Error testing auth API route:', error.message);
  }
  
  console.log('\n📋 Manual verification steps:');
  console.log('1. Visit the dashboard and try starting a voice call');
  console.log('2. Verify that the call connects successfully');
  console.log('3. Check Cloudflare dashboard for any errors');
  console.log('4. Verify that public endpoints on voice-agent-beta and knoxified-auth are no longer accessible');
  
  console.log('\n🎉 Deployment verification complete!');
  console.log('If all manual tests pass, you can proceed with removing public endpoints.');
  
  return true;
}

// Run verification if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  verifyDeployment().catch(console.error);
}

module.exports = { verifyDeployment };