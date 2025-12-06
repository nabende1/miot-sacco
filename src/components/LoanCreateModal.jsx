// LoanCreateModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function LoanCreateModal({ onClose }) {
  const [groupId, setGroupId] = useState("");
  const [requestedAmount, setRequestedAmount] = useState(0);
  const [eligibleMembers, setEligibleMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadMembers() {
    const { data } = await supabase.from("members").select("id,full_name").limit(200);
    setEligibleMembers(data || []);
  }

  useEffect(()=>{ loadMembers(); }, []);

  async function submitRequest() {
    setLoading(true);
    const payload = {
      group_id: groupId,
      requested_amount: Number(requestedAmount),
      requested_by: supabase.auth.getUser()?.id || null,
      eligible_member_count: eligibleMembers.length,
      status: 'PENDING'
    };
    const { data, error } = await supabase.from("group_loan_requests").insert([payload]);
    if (error) { setLoading(false); return alert(error.message); }
    const requestId = data[0].id;
    // create group_loan row (optional after approval) OR wait BM approval.
    alert("Request created. Please have BM approve it.");
    setLoading(false);
    if (onClose) onClose();
  }

  return (
    <div className="card" style={{maxWidth:800}}>
      <h3>Create Group Loan Request</h3>
      <div><label>Group ID</label><input value={groupId} onChange={e=>setGroupId(e.target.value)} style={{width:'100%', padding:8}}/></div>
      <div><label>Requested Amount</label><input type="number" value={requestedAmount} onChange={e=>setRequestedAmount(e.target.value)} style={{width:'100%', padding:8}}/></div>
      <div style={{marginTop:8}}>
        <button onClick={submitRequest} disabled={loading}>Submit Request</button>
        <button onClick={onClose} style={{marginLeft:8}}>Close</button>
      </div>
    </div>
  );
}
