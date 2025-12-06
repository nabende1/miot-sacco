import { supabase } from "../supabaseClient";

export async function finalizeDistributionRPC(groupLoanId){
  return supabase.rpc('finalize_distribution', { p_group_loan_id: groupLoanId, p_processor_id: supabase.auth.getUser().id });
}

export async function applyWeeklyPenaltiesRPC(){
  return supabase.rpc('apply_weekly_penalties');
}

export async function buildBranchPL(branchId){
  return supabase.rpc('build_branch_pl', { branch_id: branchId });
}
