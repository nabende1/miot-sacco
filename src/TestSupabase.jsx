// src/TestSupabase.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function TestSupabase() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    async function check() {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1);

      if (error) {
        setStatus("❌ Error: " + error.message);
      } else {
        setStatus("✅ Connected to Supabase!");
      }
    }
    check();
  }, []);

  return <div style={{ padding: 20 }}>{status}</div>;
}
