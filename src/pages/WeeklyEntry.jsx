import React, {useState} from "react";
import supabase from '../supabaseClient';

export default function WeeklyEntry(){
  const [memberId,setMemberId] = useState("");
  const [sharesCount,setSharesCount] = useState(0);
  const [loanRepay,setLoanRepay] = useState(0);

  async function submit(){
    const payload = {
      week_number: new Date().toISOString().slice(0,10),
      group_id: "example-group",
      member_id: memberId || null,
      member_name: "",
      opening_balance: 0,
      shares_count: Number(sharesCount),
      shares_value: Number(sharesCount)*2000,
      excess_to_opening: 0,
      auto_fine_applied: 0,
      fines_paid: 0,
      social_fund: (sharesCount>0?1000:0),
      loan_repayment: Number(loanRepay),
      recorded_by: null,
      notes: ""
    };
    const { data, error } = await supabase.from('weekly_transactions').insert(payload);
    if(error) return alert(error.message);
    alert("Saved");
  }

  return (
    <div>
      <h2>Weekly Entry</h2>
      <div className="card" style={{maxWidth:600}}>
        <label>Member ID</label><input value={memberId} onChange={e=>setMemberId(e.target.value)} style={{width:'100%',padding:8}} />
        <label>Shares count</label><input type="number" value={sharesCount} onChange={e=>setSharesCount(e.target.value)} style={{width:'100%',padding:8}} />
        <label>Loan repayment</label><input type="number" value={loanRepay} onChange={e=>setLoanRepay(e.target.value)} style={{width:'100%',padding:8}} />
        <button onClick={submit} style={{marginTop:12}}>Record</button>
      </div>
    </div>
  );
}
