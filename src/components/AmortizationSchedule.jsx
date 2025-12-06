// AmortizationSchedule.jsx
import React from "react";

export default function AmortizationSchedule({ principal=100000, interestPct=10, weeks=10 }) {
  const interest = Math.round(principal * interestPct / 100);
  const weeklyPrincipal = Math.round(principal / weeks);
  const weeklyInterest = Math.round(interest / weeks);
  const rows = Array.from({length: weeks}).map((_,i) => {
    const week = i+1;
    const principalPaid = weeklyPrincipal;
    const interestPaid = weeklyInterest;
    const total = principalPaid + interestPaid;
    const remaining = principal - weeklyPrincipal * week;
    return { week, principalPaid, interestPaid, total, remaining: Math.max(0, remaining) };
  });

  return (
    <div className="card">
      <h4>Amortization ({weeks} weeks)</h4>
      <div>Principal: {principal} | Interest: {interest} | Weekly Principal: {weeklyPrincipal}</div>
      <table style={{width:'100%', marginTop:8}}>
        <thead><tr><th>Week</th><th>Principal</th><th>Interest</th><th>Total</th><th>Remaining</th></tr></thead>
        <tbody>
          {rows.map(r => <tr key={r.week}><td>{r.week}</td><td>{r.principalPaid}</td><td>{r.interestPaid}</td><td>{r.total}</td><td>{r.remaining}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
