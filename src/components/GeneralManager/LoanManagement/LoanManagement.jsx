// src/components/GeneralManager/LoanManagement/LoanManagement.jsx
import { useState, useEffect } from 'react';
import { 
    CreditCard, Filter, Search, RefreshCw, CheckCircle, X, 
    AlertCircle, Eye, Download, Calendar, User, DollarSign,
    TrendingUp, TrendingDown, Clock, FileText, Percent
} from 'lucide-react';
import supabase from '../../../supabaseClient';
import './LoanManagement.css';

export default function LoanManagement() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        branch: 'all',
        dateRange: 'all'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadLoans();
    }, []);

    const loadLoans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('loans')
                .select(`
                    *,
                    member:members(full_name, member_id),
                    branch:branches(name),
                    facilitator:users_meta(full_name)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setLoans(data || []);
        } catch (error) {
            console.error('Error loading loans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveLoan = async (loanId) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('loans')
                .update({ 
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: (await supabase.auth.getUser()).data.user?.id
                })
                .eq('id', loanId);
            
            if (error) throw error;
            await loadLoans();
        } catch (error) {
            console.error('Error approving loan:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRejectLoan = async (loanId) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('loans')
                .update({ 
                    status: 'rejected',
                    rejected_at: new Date().toISOString(),
                    rejected_by: (await supabase.auth.getUser()).data.user?.id
                })
                .eq('id', loanId);
            
            if (error) throw error;
            await loadLoans();
        } catch (error) {
            console.error('Error rejecting loan:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="loan-management">
            <div className="page-header">
                <h1><CreditCard size={28} /> Loan Management</h1>
                <p>Approve, monitor, and manage all SACCO loans</p>
            </div>

            {/* Filters and Search */}
            <div className="controls-section">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search loans by member name, ID, or amount..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filters">
                    <select 
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="active">Active</option>
                        <option value="overdue">Overdue</option>
                        <option value="repaid">Repaid</option>
                    </select>
                    <button className="btn btn-primary" onClick={loadLoans} disabled={loading}>
                        <RefreshCw size={18} /> Refresh
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="loan-stats">
                <div className="stat-card">
                    <CreditCard size={24} />
                    <div>
                        <h3>{loans.length}</h3>
                        <p>Total Loans</p>
                    </div>
                </div>
                <div className="stat-card pending">
                    <Clock size={24} />
                    <div>
                        <h3>{loans.filter(l => l.status === 'pending').length}</h3>
                        <p>Pending Approval</p>
                    </div>
                </div>
                <div className="stat-card active">
                    <TrendingUp size={24} />
                    <div>
                        <h3>{loans.filter(l => l.status === 'active').length}</h3>
                        <p>Active Loans</p>
                    </div>
                </div>
                <div className="stat-card overdue">
                    <AlertCircle size={24} />
                    <div>
                        <h3>{loans.filter(l => l.status === 'overdue').length}</h3>
                        <p>Overdue</p>
                    </div>
                </div>
            </div>

            {/* Loans Table */}
            <div className="loans-table-container">
                <table className="loans-table">
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Loan Amount</th>
                            <th>Status</th>
                            <th>Branch</th>
                            <th>Date Applied</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map(loan => (
                            <tr key={loan.id}>
                                <td>
                                    <div className="member-info">
                                        <User size={16} />
                                        <span>{loan.member?.full_name || 'N/A'}</span>
                                    </div>
                                </td>
                                <td>
                                    <strong>{formatCurrency(loan.loan_amount)}</strong>
                                </td>
                                <td>
                                    <span className={`status-badge ${loan.status}`}>
                                        {loan.status}
                                    </span>
                                </td>
                                <td>{loan.branch?.name || 'N/A'}</td>
                                <td>{formatDate(loan.created_at)}</td>
                                <td>
                                    <div className="actions">
                                        <button 
                                            className="btn-icon"
                                            onClick={() => {
                                                setSelectedLoan(loan);
                                                setShowDetails(true);
                                            }}
                                            title="View Details"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        {loan.status === 'pending' && (
                                            <>
                                                <button 
                                                    className="btn-icon success"
                                                    onClick={() => handleApproveLoan(loan.id)}
                                                    title="Approve Loan"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                                <button 
                                                    className="btn-icon danger"
                                                    onClick={() => handleRejectLoan(loan.id)}
                                                    title="Reject Loan"
                                                >
                                                    <X size={16} />
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
        </div>
    );
}