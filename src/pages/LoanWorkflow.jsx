// src/pages/LoanWorkflow.jsx
import React, { useEffect, useState } from "react";
import supabase from '../supabaseClient';

export default function LoanWorkflow() {
  const [groupLoans, setGroupLoans] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from('group_loans')
      .select('*')
      .order('date_approved', { ascending: false })
      .limit(50);
    setGroupLoans(data || []);
  }

  async function loadDistributions(loanId) {
    setSelectedLoan(loanId);
    const { data } = await supabase
      .from('loan_distributions')
      .select('*, members(*)')
      .eq('group_loan_id', loanId);
    setDistributions(data || []);
    setAllocations(
      (data || []).map(d => ({
        id: d.id,
        member_id: d.member_id,
        allocated_amount: d.allocated_amount || 0,
      }))
    );
  }

  function updateAlloc(id, value) {
    setAllocations(prev =>
      prev.map(a => (a.id === id ? { ...a, allocated_amount: Number(value) } : a))
    );
  }

  async function saveAllocations() {
    for (const a of allocations) {
      await supabase
        .from('loan_distributions')
        .update({ allocated_amount: a.allocated_amount })
        .eq('id', a.id);
    }
    alert('Allocations saved');
    loadDistributions(selectedLoan);
  }

  // ✅ Call Edge Function directly (no extra service file needed for now)
  async function finalize() {
    if (!selectedLoan) {
      alert('No loan selected');
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_EDGE_FINALIZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupLoanId: selectedLoan }),
      });

      const result = await response.json();

      if (result.ok) {
        alert('✅ Distribution finalized!');
        load(); // Refresh group loans list
        setSelectedLoan(null); // Close panel
        setDistributions([]);
        setAllocations([]);
      } else {
        alert('❌ Error: ' + (result.error?.message || result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Finalize failed:', err);
      alert('💥 Network error: ' + err.message);
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2>Loan Workflow</h2>
      <div className="card" style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
        <h3>Group Loans</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Group</th>
              <th style={tableHeaderStyle}>Principal</th>
              <th style={tableHeaderStyle}>Approved</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupLoans.map(gl => (
              <tr key={gl.id} style={tableRowStyle}>
                <td>{gl.group_id}</td>
                <td>{gl.principal?.toLocaleString()}</td>
                <td>{gl.date_approved ? new Date(gl.date_approved).toLocaleDateString() : '—'}</td>
                <td>
                  <button
                    onClick={() => loadDistributions(gl.id)}
                    style={buttonStyle}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLoan && (
        <div
          className="card"
          style={{
            marginTop: '24px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <h3>Distributions for {selectedLoan}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Member</th>
                <th style={tableHeaderStyle}>Allocated (UGX)</th>
              </tr>
            </thead>
            <tbody>
              {distributions.map(d => (
                <tr key={d.id} style={tableRowStyle}>
                  <td>{d.members?.full_name || d.member_id}</td>
                  <td>
                    <input
                      type="number"
                      defaultValue={d.allocated_amount || 0}
                      onChange={e => updateAlloc(d.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '16px' }}>
            <button onClick={saveAllocations} style={buttonStyle}>
              Save Allocations
            </button>
            <button
              onClick={finalize}
              style={{ ...buttonStyle, backgroundColor: '#28a745', marginLeft: '12px' }}
            >
              Finalize Distribution
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple inline styles for clarity (replace with Tailwind/CSS modules later)
const tableHeaderStyle = {
  backgroundColor: '#f8f9fa',
  padding: '10px',
  textAlign: 'left',
  borderBottom: '2px solid #dee2e6',
};
const tableRowStyle = {
  borderBottom: '1px solid #eee',
};
const buttonStyle = {
  padding: '6px 12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};