import React from "react";
import { Link } from "react-router-dom";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  return (
    <>
      <div className="sidebar">
        <h3 style={{textAlign:'center', paddingTop:8}}>MIOT SACCO</h3>
        <nav style={{padding:16}}>
          <div><Link to="/" style={{color:'white'}}>Dashboard</Link></div>
          <div style={{marginTop:8}}><Link to="/members" style={{color:'white'}}>Members</Link></div>
          <div style={{marginTop:8}}><Link to="/loans" style={{color:'white'}}>Loans</Link></div>
          <div style={{marginTop:8}}><Link to="/weekly" style={{color:'white'}}>Weekly Entry</Link></div>
          <div style={{marginTop:8}}><Link to="/reports" style={{color:'white'}}>Reports</Link></div>
        </nav>
      </div>
      <div className="topbar"><Topbar /></div>
      <main className="main"><div style={{paddingTop:16}}>{children}</div></main>
    </>
  );
}
