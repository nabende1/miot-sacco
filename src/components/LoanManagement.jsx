// src/components/LoanManagement.jsx
import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Users, 
  DollarSign, 
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Download,
  BarChart3
} from 'lucide-react';
import supabase from '../supabaseClient';

export default function LoanManagement() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    loanType: 'all',
    branch: 'all'
  });
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchLoans();
    fetchSummary();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('group_loans')
        .select(`
          *,
          group:group_loan_requests(*),
          branch:branches(name),
          facilitator:users_meta(auth_users(email))
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    const [
      total,
      active,
      pending,
      overdue,
      amount
    ] = await Promise.all([
      supabase.from('group_loans').select('id', { count: 'exact' }),
      supabase.from('group_loans').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('group_loan_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('member_loans').select('id', { count: 'exact' }).lt('due_date', new Date().toISOString()),
      supabase.from('group_loans').select('approved_amount')
    ]);

    const totalAmount = amount.data?.reduce((sum, loan) => sum + (loan.approved_amount || 0), 0) || 0;

    setSummary({
      total: total.count || 0,
      active: active.count || 0,
      pending: pending.count || 0,
      overdue: overdue.count || 0,
      totalAmount
    });
  };

  const handleApproveLoan = async (loanId) => {
    try {
      await supabase
        .from('group_loans')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', loanId);
      
      fetchLoans();
      fetchSummary();
    } catch (error) {
      console.error('Error approving loan:', error);
    }
  };

  const handleRejectLoan = async (loanId) => {
    try {
      await supabase
        .from('group_loans')
        .update({ status: 'rejected', rejected_at: new Date().toISOString() })
        .eq('id', loanId);
      
      fetchLoans();
      fetchSummary();
    } catch (error) {
      console.error('Error rejecting loan:', error);
    }
  };

  return (
    <div className="loan-management">
      <div className="page-header">
        <h2><CreditCard size={24} /> Loan Management</h2>
        <button className="btn btn-secondary">
          <Download size={18} /> Export Report
        </button>
      </div>

      <div className="loan-summary-cards">
        <div className="summary-card">
          <div className="summary-icon total">
            <CreditCard size={20} />
          </div>
          <div className="summary-info">
            <h3>{summary.total.toLocaleString()}</h3>
            <p>Total Loans</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon active">
            <CheckCircle size={20} />
          </div>
          <div className="summary-info">
            <h3>{summary.active.toLocaleString()}</h3>
            <p>Active Loans</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon pending">
            <Calendar size={20} />
          </div>
          <div className="summary-info">
            <h3>{summary.pending.toLocaleString()}</h3>
            <p>Pending Approval</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon amount">
            <DollarSign size={20} />
          </div>
          <div className="summary-info">
            <h3>UGX {summary.totalAmount.toLocaleString()}</h3>
            <p>Total Amount</p>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Status</label>
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search loans..." />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading loans...</div>
      ) : (
        <div className="loans-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Group</th>
                <th>Branch</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td className="loan-id">#{loan.id.substring(0, 8)}</td>
                  <td>{loan.group?.group_name || 'N/A'}</td>
                  <td>{loan.branch?.name || 'N/A'}</td>
                  <td className="amount">KES {loan.approved_amount?.toLocaleString() || '0'}</td>
                  <td>
                    <span className={`status-badge ${loan.status}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td>{new Date(loan.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon view" title="View Details">
                        <Eye size={16} />
                      </button>
                      {loan.status === 'pending' && (
                        <>
                          <button 
                            className="btn-icon approve" 
                            onClick={() => handleApproveLoan(loan.id)}
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            className="btn-icon reject"
                            onClick={() => handleRejectLoan(loan.id)}
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}