import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const PROJECT_URL = Deno.env.get("PROJECT_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    const { userId } = await req.json();
    if (!userId) throw new Error("userId required");

    // 1. Delete from users_meta
    await fetch(`${PROJECT_URL}/rest/v1/users_meta?id=eq.${userId}`, {
      method: "DELETE",
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    // 2. Delete from auth.users (via Admin API)
    await fetch(`${PROJECT_URL}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
});