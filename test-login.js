// Standalone Supabase auth test — bypasses Next.js entirely.
// Run with: node test-login.js

const { createClient } = require('@supabase/supabase-js');

// Fill these in from your .env.local — use the real anon key, NOT the service role key.
const SUPABASE_URL = 'https://elpljgrwrzaugsunoidf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscGxqZ3J3cnphdWdzdW5vaWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDQ1MDgsImV4cCI6MjA5NDg4MDUwOH0.EgtwchNRNDURhZUAkdsy3QfDOqZMnSFVjSZv7PZ0p-M';

// Use a real test account's credentials.
const TEST_EMAIL = 'knoxfavour29@gmail.com';
const TEST_PASSWORD = 'knoxifieD#777';

async function main() {
  console.log('Connecting to:', SUPABASE_URL);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (error) {
      console.log('❌ Supabase returned an error (this means the network call WORKED, credentials/config are the issue):');
      console.log(error);
      return;
    }

    console.log('✅ SUCCESS — network path to Supabase is fine, login worked.');
    console.log('User ID:', data.user?.id);
  } catch (err) {
    console.log('❌ FAILED — the network call itself did not complete. Full error below:');
    console.log(err);
    if (err.cause) {
      console.log('--- Underlying cause (this is the important part) ---');
      console.log(err.cause);
    }
  }
}

main();