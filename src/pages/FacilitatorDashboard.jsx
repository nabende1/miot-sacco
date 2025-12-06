export default function FacilitatorDashboard() {
  return (
    <div>
      <h1>Facilitator Dashboard</h1>
      <p>Your groups: [Group A, Group B]</p>
      <button onClick={() => navigate('/loan-workflow')}>Loan Workflow</button>
      <button onClick={() => navigate('/weekly-entry')}>Weekly Entry</button>
    </div>
  );
}