// MemberForm.jsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function MemberForm({ onSaved }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNo, setIdNo] = useState("");
  const [groupName, setGroupName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const payload = {
      member_number: `M-${Date.now().toString().slice(-6)}`,
      branch_id: branchId || null,
      group_name: groupName,
      full_name: fullName,
      phone,
      gender: "",
      id_no: idNo,
      opening_balance: 0,
      registration_fee_paid: 0,
      registration_balance: 20000,
      created_by: supabase.auth.getUser()?.id || null
    };
    const { data, error } = await supabase.from("members").insert([payload]);
    setLoading(false);
    if (error) return alert(error.message);
    alert("Member created");
    if (onSaved) onSaved(data[0]);
    setFullName(""); setPhone(""); setIdNo(""); setGroupName("");
  }

  return (
    <div className="card" style={{maxWidth:700}}>
      <h3>Add Member</h3>
      <div>
        <label>Full name</label>
        <input value={fullName} onChange={e=>setFullName(e.target.value)} style={{width:'100%', padding:8}} />
      </div>
      <div>
        <label>Phone</label>
        <input value={phone} onChange={e=>setPhone(e.target.value)} style={{width:'100%', padding:8}} />
      </div>
      <div>
        <label>ID No</label>
        <input value={idNo} onChange={e=>setIdNo(e.target.value)} style={{width:'100%', padding:8}} />
      </div>
      <div>
        <label>Group / Center</label>
        <input value={groupName} onChange={e=>setGroupName(e.target.value)} style={{width:'100%', padding:8}} />
      </div>
      <div style={{marginTop:8}}>
        <button onClick={handleSave} disabled={loading}>Create Member</button>
      </div>
    </div>
  );
}
