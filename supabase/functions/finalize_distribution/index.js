import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PROJECT_URL = Deno.env.get("PROJECT_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "POST required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { groupLoanId } = await req.json();
    if (!groupLoanId) {
      return new Response(JSON.stringify({ ok: false, error: "groupLoanId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);
    const { data, error } = await supabase.rpc("finalize_distribution", {
      p_group_loan_id: groupLoanId,
      p_processor_id: null
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});