import React from "react";
import supabase from '../supabaseClient';

export default function Topbar() {
  async function signOut() {
    await supabase.auth.signOut();
    location.href = "/login";
  }
  return (
    <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
      <div style={{display:'flex', gap:12, alignItems:'center'}}><strong>Branch: Sironko</strong></div>
      <div style={{display:'flex', gap:12, alignItems:'center'}}>
        <button onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}
