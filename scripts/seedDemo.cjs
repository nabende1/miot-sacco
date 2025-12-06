// scripts/seedDemo.cjs
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;


if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// 👉 REPLACE WITH REAL USER IDs FROM SUPABASE AUTH → USERS
const USERS = {
  gm: 'e6e4e884-7b9f-407c-b8fb-4a776afe5d52',
  bm: '9425b25c-9429-4c46-8a7e-2a593ba6d342',
  fac: 'ddc8a6a8-7700-4f1c-8754-d209e5a9c635'
};

// Helper to safely get single record
async function insertAndGet(table, data) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert into ${table}: ${error.message}`);
  }
  if (!result) {
    throw new Error(`No data returned from ${table} insert`);
  }
  return result;
}

async function seed() {
  console.log('🌱 Seeding...');

  // 1. Create Branch
  const branch = await insertAndGet('branches', {
    name: 'Sironko',
    region: 'Eastern'
  });
  console.log('✅ Branch created:', branch.name);

  // 2. Create users_meta
  for (const [role, id] of Object.entries(USERS)) {
    let assigned_branch = null;
    if (role === 'bm' || role === 'fac') assigned_branch = branch.id;

    await supabase.from('users_meta').upsert({
      id,
      full_name: `${role.toUpperCase()} User`,
      role: role.toUpperCase().replace('GM', 'GENERAL_MANAGER').replace('BM', 'BRANCH_MANAGER').replace('FAC', 'FACILITATOR'),
      assigned_branch,
      pin: role === 'gm' ? '0000' : role === 'bm' ? '1111' : '2222'
    });
  }
  console.log('✅ User roles created');

  // 3. Create Members
  const members = [];
  for (let i = 1; i <= 8; i++) {
    const member = await insertAndGet('members', {
      member_number: `SIR-${100 + i}`,
      branch_id: branch.id,
      group_name: 'Village-Center-A',
      full_name: `Member ${i}`,
      phone: `+256700000${i}`,
      id_no: `ID${1000 + i}`,
      opening_balance: 0,
      registration_balance: 20000,
      created_by: USERS.fac
    });
    members.push(member);
  }
  console.log('✅ Created', members.length, 'members');

  // 4. Group Loan Request
  const req = await insertAndGet('group_loan_requests', {
    group_id: 'Village-Center-A',
    requested_amount: 500000,
    requested_by: USERS.fac,
    eligible_member_count: 5
  });

  // 5. Group Loan
  const gl = await insertAndGet('group_loans', {
    request_id: req.id,
    group_id: req.group_id,
    principal: req.requested_amount,
    date_approved: new Date().toISOString(),
    approved_by: USERS.bm,
    status: 'APPROVED',
    outstanding_balance: req.requested_amount
  });

  // 6. Distributions
  const amt = 500000 / 5;
  for (let i = 0; i < 5; i++) {
    await supabase.from('loan_distributions').insert({
      group_loan_id: gl.id,
      member_id: members[i].id,
      requested_amount: amt,
      allocated_amount: amt,
      submitted_by: USERS.fac
    });
  }

  console.log('✅ SEED SUCCESSFUL!');
}

seed().catch(err => {
  console.error('💥 SEED FAILED:', err.message);
  console.error('💡 Did you replace USERS with real auth.user IDs from Supabase?');
  process.exit(1);
});