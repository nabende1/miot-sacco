// scripts/create-auth-users.js
// Run with: node scripts/create-auth-users.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env');
  process.exit(1);
}

// Your real user IDs
const USERS = {
  gm: 'e6e4e884-7b9f-407c-b8fb-4a776afe5d52',
  bm: '9425b25c-9429-4c46-8a7e-2a593ba6d342',
  fac: 'ddc8a6a8-7700-4f1c-8754-d209e5a9c635'
};

async function createAuthUser(id, email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id,
      email,
      password,
      email_confirm: true
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to create ${email}: ${error.message || response.statusText}`);
  }

  const user = await response.json();
  console.log(`✅ Created ${email} (ID: ${user.user.id})`);
}

async function main() {
  console.log('🌱 Creating authenticated users with password: Test1234');

  try {
    await createAuthUser(USERS.gm, 'briannabende1@gmail.com', 'Test1234');
    await createAuthUser(USERS.bm, 'briannabende1@outlook.com', 'Test1234');
    await createAuthUser(USERS.fac, 'briannabende1@aol.com', 'Test1234');

    console.log('\n🎉 All users created! You can now log in with:');
    console.log('- GM: briannabende1@gmail.com / Test1234');
    console.log('- BM: briannabende1@outlook.com / Test1234');
    console.log('- Facilitator: briannabende1@aol.com / Test1234');
  } catch (err) {
    console.error('\n💥 Error:', err.message);
    process.exit(1);
  }
}

main();