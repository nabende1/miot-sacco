import React from "react";
import supabase from '../supabaseClient';
import { exportPDF, exportCSV, exportExcel, exportDOC } from "../services/reportExports";

export default function Reports(){
  async function exportMembersCSV(){
    const { data, error } = await supabase.from('members').select('member_number,full_name,phone,id_no');
    if(error) return alert(error.message);
    const rows = data.map(r => [r.member_number, r.full_name, r.phone, r.id_no]);
    exportCSV('members_report', [['MemberNumber','Name','Phone','ID'], ...rows]);
  }

  async function generateBranchPL(){
    // call RPC 'build_branch_pl' you created in Supabase SQL earlier
    const { data, error } = await supabase.rpc('build_branch_pl', { branch_id: null });
    if(error) return alert(error.message);
    // data will be array of objects; create doc or CSV
    exportPDF('branch_pl', data.map(d=>JSON.stringify(d)));
  }

  return (
    <div>
      <h2>Reports</h2>
      <div className="card">
        <button onClick={exportMembersCSV}>Export Members (CSV)</button>
        <button onClick={generateBranchPL} style={{marginLeft:8}}>Generate Branch P&L (PDF)</button>
      </div>
    </div>
  );
}
