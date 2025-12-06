import React, {useEffect, useState} from "react";
import supabase from '../supabaseClient';

export default function TestSupabase(){
  const [status,setStatus] = useState("Checking...");
  useEffect(()=>{ (async ()=>{
    const { data, error } = await supabase.from("system_settings").select("*").limit(1);
    if(error) setStatus("Error: "+error.message); else setStatus("Connected: rows="+(data?.length||0));
  })(); },[]);
  return <div className="card">{status}</div>;
}
