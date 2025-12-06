// src/pages/MemberDetail.jsx
import React, { useEffect, useState } from "react";
import supabase from '../supabaseClient';
import { exportPDF } from "../services/reportExports";

export default function MemberDetail({ memberId }) {
  const [member, setMember] = useState(null);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(()=>{ if(memberId) load(); }, [memberId]);

  async function load(){
    const { data: m } = await supabase.from('members').select('*').eq('id', memberId).single();
    const { data: l } = await supabase.from('member_loans').select('*').eq('member_id', memberId);
    const { data: t } = await supabase.from('weekly_transactions').select('*').eq('member_id', memberId).order('date_recorded',{ascending:false}).limit(200);
    setMember(m); setLoans(l||[]); setTransactions(t||[]);
  }

  function printStatement(){
    const rows = [
      ['Member', member.full_name],
      ['Phone', member.phone],
      ['', ''],
      ['Loans', ...loans.map(x=>`${x.principal} - Rem:${x.remaining_balance}`)],
      ['', ''],
      ['Recent Transactions', ...transactions.slice(0,20).map(tx=>`${new Date(tx.date_recorded).toLocaleDateString()} : ${tx.shares_value || 0} + ${tx.loan_repayment || 0}`)]
    ];
    exportPDF(`Statement_${member.full_name}`, rows.flat());
  }

  if(!member) return <div>Pick a member</div>;
  return (
    <div>
      <h2>{member.full_name}</h2>
      <div className="card">
        <div><strong>Phone:</strong> {member.phone}</div>
        <div><strong>Opening Balance:</strong> {member.opening_balance}</div>
        <div style={{marginTop:8}}><button onClick={printStatement}>Print Statement (PDF)</button></div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <h3>Loans</h3>
        <table><thead><tr><th>Principal</th><th>Remaining</th><th>Status</th></tr></thead>
        <tbody>{loans.map(l=>(
          <tr key={l.id}><td>{l.principal}</td><td>{l.remaining_balance}</td><td>{l.status}</td></tr>
        ))}</tbody></table>
      </div>

      <div className="card" style={{marginTop:12}}>
        <h3>Recent Transactions</h3>
        <table><thead><tr><th>Date</th><th>Shares</th><th>Loan Repay</th></tr></thead>
          <tbody>{transactions.map(t=>(<tr key={t.id}><td>{new Date(t.date_recorded).toLocaleDateString()}</td><td>{t.shares_value}</td><td>{t.loan_repayment}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
