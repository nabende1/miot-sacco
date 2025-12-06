// scripts/seedDemo.cjs
// Run with: node scripts/seedDemo.cjs

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// === CONFIG ===
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === USER IDs (MUST BE REAL auth.users.id FROM SUPABASE DASHBOARD) ===
const USERS = {
  gm: 'e6e4e884-7b9f-407c-b8fb-4a776afe5d52',  // ← REPLACE WITH REAL ID
  bm: '9425b25c-9429-4c46-8a7e-2a593ba6d342',  // ← REPLACE WITH REAL ID
  fac: 'ddc8a6a8-7700-4f1c-8754-d209e5a9c635'  // ← REPLACE WITH REAL ID
};

// === HELPERS ===
async function insertOne(table, data) {
  const { data: result, error } = await supabase
    .from(table)
    .insert([data])
    .select()
    .single();
  if (error) throw new Error(`${table} insert failed: ${error.message}`);
  return result;
}

async function upsertOne(table, data, key = 'id') {
  const { error } = await supabase
    .from(table)
    .upsert([data], { onConflict: key });
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
}

// === SEED LOGIC ===
async function seed() {
  console.log('🌱 Starting seed...');

  // 1. Branch
  const branch = await insertOne('branches', {
    name: 'Sironko',
    region: 'Eastern'
  });
  console.log('✅ Branch created:', branch.name);

  // 2. users_meta
  await Promise.all([
    upsertOne('users_meta', {
      id: USERS.gm,
      full_name: 'General Manager',
      role: 'GENERAL_MANAGER',
      assigned_branch: null,
      pin: '0000'
    }),
    upsertOne('users_meta', {
      id: USERS.bm,
      full_name: 'Branch Manager Sironko',
      role: 'BRANCH_MANAGER',
      assigned_branch: branch.id,
      pin: '1111'
    }),
    upsertOne('users_meta', {
      id: USERS.fac,
      full_name: 'Facilitator A',
      role: 'FACILITATOR',
      assigned_branch: branch.id,
      pin: '2222'
    })
  ]);
  console.log('✅ User roles created');

  // 3. Members
  const members = [];
  for (let i = 1; i <= 8; i++) {
    const member = await insertOne('members', {
      member_number: `SIR-${100 + i}`,
      branch_id: branch.id,
      group_name: 'Village-Center-A',
      full_name: `Member ${i}`,
      phone: `+2567${1000000 + i}`,
      id_no: `ID${1000 + i}`,
      opening_balance: 0,
      registration_balance: 20000,
      created_by: USERS.fac
    });
    members.push(member);
  }
  console.log('✅ Created', members.length, 'members');

  // 4. Group Loan Request
  const req = await insertOne('group_loan_requests', {
    group_id: 'Village-Center-A',
    requested_amount: 500000,
    requested_by: USERS.fac,
    eligible_member_count: 5
  });
  console.log('✅ Group loan request created');

  // 5. Group Loan
  const gl = await insertOne('group_loans', {
    request_id: req.id,
    group_id: req.group_id,
    principal: req.requested_amount,
    date_approved: new Date().toISOString(),
    approved_by: USERS.bm,
    status: 'APPROVED',
    outstanding_balance: req.requested_amount
  });
  console.log('✅ Group loan approved');

  // 6. Loan Distributions (first 5 members)
  const allocations = 500000 / 5;
  for (let i = 0; i < 5; i++) {
    await insertOne('loan_distributions', {
      group_loan_id: gl.id,
      member_id: members[i].id,
      requested_amount: allocations,
      allocated_amount: allocations,
      submitted_by: USERS.fac
    });
  }
  console.log('✅ Created 5 loan distributions');

  console.log('\n🎉 SEED SUCCESSFUL!');
  console.log('👉 Log in as facilitator and visit /loan-workflow to finalize.');
}

// === RUN ===
seed().catch(err => {
  console.error('\n💥 SEED FAILED:', err.message);
  process.exit(1);
});