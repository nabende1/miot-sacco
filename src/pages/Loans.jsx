import React, {useEffect, useState} from "react";
import supabase from '../supabaseClient';

export default function Loans(){
  const [requests, setRequests] = useState([]);
  useEffect(()=>{ load(); },[]);
  async function load(){
    const { data } = await supabase.from('group_loan_requests').select('*').order('date_requested', { ascending:false }).limit(200);
    setRequests(data || []);
  }

  return (
    <div>
      <h2>Group Loan Requests</h2>
      <div className="card">
        <table style={{width:'100%'}}>
          <thead><tr><th>Group</th><th>Amount</th><th>Requested by</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {requests.map(r=>(
              <tr key={r.id}>
                <td>{r.group_id}</td>
                <td>{r.requested_amount}</td>
                <td>{r.requested_by}</td>
                <td>{new Date(r.date_requested).toLocaleDateString()}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
