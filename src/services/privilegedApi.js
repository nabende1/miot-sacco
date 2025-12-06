// src/services/privilegedApi.js
// Replace EDGE_FN_URL with your deployed Supabase Edge Function URL
const EDGE_FN_URL = import.meta.env.VITE_EDGE_FN_URL || "https://<your-edge-fn-url>";

export async function finalizeDistribution(groupLoanId, authToken) {
  // authToken: bearer token from user (optional) — Edge fn should validate user authorization
  const res = await fetch(`${EDGE_FN_URL}/finalize_distribution`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: JSON.stringify({ groupLoanId })
  });
  return res.json();
}

export async function applyWeeklyPenalties(authToken) {
  const res = await fetch(`${EDGE_FN_URL}/apply_weekly_penalties`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    body: JSON.stringify({})
  });
  return res.json();
}
