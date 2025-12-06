import React, {useEffect, useState} from "react";
import supabase from '../supabaseClient';
import KPIcard from "../components/KPIcard";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Dashboard(){
  const [summary, setSummary] = useState({});
  useEffect(()=>{ (async ()=>{
    // fetch counts (use RPC for production)
    const { count: membersCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
    const { count: loansCount } = await supabase.from('member_loans').select('*', { count: 'exact', head: true });
    setSummary({members: membersCount || 0, loans: loansCount || 0});
  })(); },[]);

  const data = {
    labels:['Jan','Feb','Mar','Apr','May'],
    datasets:[{label:'Savings (UGX)', data:[120000,150000,170000,210000,250000]}]
  };

  return (
    <div>
      <h2>Branch Dashboard</h2>
      <div className="grid">
        <KPIcard title="Total Members" value={summary.members} />
        <KPIcard title="Total Loans" value={summary.loans} />
        <KPIcard title="Total Savings (est)" value="UGX 24,000,000" />
        <KPIcard title="Branch Profit" value="UGX 1,250,000" />
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>Savings Trend</h3>
        <Bar data={data} />
      </div>
    </div>
  );
}
