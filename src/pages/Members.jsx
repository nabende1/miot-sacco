import React, {useEffect, useState} from "react";
import supabase from '../supabaseClient';

export default function Members(){
  const [rows,setRows] = useState([]);
  useEffect(()=>{ load(); },[]);
  async function load(){
    const { data, error } = await supabase.from('members').select('*').order('date_joined',{ascending:false}).limit(200);
    if(error) return alert(error.message);
    setRows(data || []);
  }

  return (
    <div>
      <h2>Members</h2>
      <div style={{marginBottom:12}}><a href="/members/new">Add member</a></div>
      <div className="card">
        <table style={{width:'100%'}}>
          <thead><tr><th>No</th><th>Name</th><th>Phone</th><th>ID No</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={r.id}><td>{i+1}</td><td>{r.full_name}</td><td>{r.phone}</td><td>{r.id_no}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
