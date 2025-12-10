// src/components/GeneralManager/BranchOverview/BranchOverview.jsx
import React, { useState, useEffect } from 'react';
import { 
    Building2, 
    Users, 
    DollarSign, 
    TrendingUp, 
    TrendingDown,
    MapPin,
    BarChart3,
    Download,
    Filter,
    Search,
    Eye,
    Edit,
    MoreVertical,
    CheckCircle,
    AlertCircle,
    Calendar,
    RefreshCw
} from 'lucide-react';
import supabase from '../../../supabaseClient';
import './BranchOverview.css';

const BranchOverview = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRegion, setFilterRegion] = useState('all');
    const [filterPerformance, setFilterPerformance] = useState('all');
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [regions, setRegions] = useState([]);
    const [branchStats, setBranchStats] = useState({
        totalBranches: 0,
        activeBranches: 0,
        totalMembers: 0,
        totalSavings: 0,
        totalLoans: 0,
        avgRepaymentRate: 0,
        totalStaff: 0
    });

    // Load all branches and their data
    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        try {
            setLoading(true);
            
            // FIX: Removed invalid nested selects (members:members(count), loans:loans(count), staff:staff(count))
            // These relationships likely don't exist directly on the 'branches' table, causing the PGRST200 error.
            // We rely entirely on the calculateBranchStats function for aggregate data.
            const { data: branchesData, error: branchesError } = await supabase
                .from('branches')
                .select(`
                    *,
                    branch_manager:branch_manager_id(*)
                `)
                .order('name');
            
            if (branchesError) throw branchesError;
            
            // Process branch data
            const processedBranches = await Promise.all(
                (branchesData || []).map(async (branch) => {
                    // Get branch-specific stats using individual queries (which is correct)
                    const stats = await calculateBranchStats(branch.id);
                    
                    return {
                        ...branch,
                        ...stats,
                        performance: calculatePerformance(stats),
                        status: branch.is_active ? 'active' : 'inactive'
                    };
                })
            );
            
            setBranches(processedBranches);
            
            // Extract unique regions
            const uniqueRegions = [...new Set(processedBranches.map(b => b.region).filter(Boolean))];
            setRegions(uniqueRegions);
            
            // Calculate overall stats
            calculateOverallStats(processedBranches);
            
        } catch (error) {
            console.error('Error loading branches:', error);
            // Optionally set an error state here
        } finally {
            setLoading(false);
        }
    };

    const calculateBranchStats = async (branchId) => {
        try {
            // Get members count (Correctly linked by branch_id)
            const { count: membersCount } = await supabase
                .from('members')
                .select('*', { count: 'exact', head: true })
                .eq('branch_id', branchId)
                .eq('status', 'active');
            
            // Get total savings for this branch (Correctly linked by branch_id)
            const { data: savingsData } = await supabase
                .from('member_savings')
                .select('amount')
                .eq('branch_id', branchId);
            
            const totalSavings = savingsData?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
            
            // Get loan stats (Correctly linked by branch_id)
            const { data: loansData } = await supabase
                .from('loans')
                .select('amount, status, branch_id')
                .eq('branch_id', branchId);
            
            const totalLoans = loansData?.length || 0;
            const activeLoans = loansData?.filter(l => l.status === 'active').length || 0;
            const overdueLoans = loansData?.filter(l => l.status === 'overdue').length || 0;
            
            // Calculate repayment rate (simplified)
            const repaymentRate = totalLoans > 0 
                ? Math.round(((totalLoans - overdueLoans) / totalLoans) * 100)
                : 0;
            
            // Get staff count (Correctly linked by assigned_branch)
            const { count: staffCount } = await supabase
                .from('users_meta')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_branch', branchId)
                .in('role', ['BRANCH_MANAGER', 'FACILITATOR']);
            
            // Calculate branch profit (10% of active loans)
            const branchProfit = activeLoans * 0.1; // Simplified calculation
            
            return {
                membersCount: membersCount || 0,
                totalSavings,
                totalLoans,
                activeLoans,
                overdueLoans,
                repaymentRate,
                staffCount: staffCount || 0,
                branchProfit
            };
        } catch (error) {
            // Log the error for debugging, but return defaults to prevent crashing the map
            console.error(`Error calculating branch stats for ID ${branchId}:`, error);
            return {
                membersCount: 0,
                totalSavings: 0,
                totalLoans: 0,
                activeLoans: 0,
                overdueLoans: 0,
                repaymentRate: 0,
                staffCount: 0,
                branchProfit: 0
            };
        }
    };

    const calculatePerformance = (stats) => {
        const score = 
            (stats.repaymentRate * 0.4) + 
            ((stats.membersCount > 100 ? 100 : stats.membersCount) * 0.3) +
            ((stats.totalSavings / 1000000) * 0.3); // Normalize savings
        
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'average';
        return 'poor';
    };

    const calculateOverallStats = (branches) => {
        const totalBranches = branches.length;
        const activeBranches = branches.filter(b => b.status === 'active').length;
        
        // Ensure you are using the computed aggregated fields here
        const totalMembers = branches.reduce((sum, b) => sum + b.membersCount, 0);
        const totalSavings = branches.reduce((sum, b) => sum + b.totalSavings, 0);
        const totalLoans = branches.reduce((sum, b) => sum + b.totalLoans, 0);
        
        const avgRepaymentRate = branches.length > 0
            ? Math.round(branches.reduce((sum, b) => sum + b.repaymentRate, 0) / branches.length)
            : 0;
            
        const totalStaff = branches.reduce((sum, b) => sum + b.staffCount, 0);
        
        setBranchStats({
            totalBranches,
            activeBranches,
            totalMembers,
            totalSavings,
            totalLoans,
            avgRepaymentRate,
            totalStaff
        });
    };

    const filteredBranches = branches.filter(branch => {
        // Search filter
        const matchesSearch = !searchTerm || 
            branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.code?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Region filter
        const matchesRegion = filterRegion === 'all' || branch.region === filterRegion;
        
        // Performance filter
        const matchesPerformance = filterPerformance === 'all' || branch.performance === filterPerformance;
        
        return matchesSearch && matchesRegion && matchesPerformance;
    });

    const exportBranchData = () => {
        const data = filteredBranches.map(branch => ({
            'Branch Code': branch.code || 'N/A',
            'Branch Name': branch.name,
            'Location': branch.location || 'N/A',
            'Region': branch.region || 'N/A',
            'Status': branch.status,
            'Total Members': branch.membersCount,
            'Total Savings': `UGX ${branch.totalSavings.toLocaleString()}`,
            'Total Loans': branch.totalLoans,
            'Active Loans': branch.activeLoans,
            'Overdue Loans': branch.overdueLoans,
            'Repayment Rate': `${branch.repaymentRate}%`,
            'Performance': branch.performance,
            'Staff Count': branch.staffCount,
            'Branch Manager': branch.branch_manager?.full_name || 'Not assigned',
            'Opening Date': branch.opening_date ? new Date(branch.opening_date).toLocaleDateString() : 'N/A'
        }));
        
        const csv = convertToCSV(data);
        downloadCSV(csv, 'branch_overview_export.csv');
    };

    const convertToCSV = (data) => {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => 
            headers.map(header => JSON.stringify(row[header] || '')).join(',')
        );
        return [headers.join(','), ...rows].join('\n');
    };

    const downloadCSV = (csv, filename) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const getPerformanceColor = (performance) => {
        switch(performance) {
            case 'excellent': return '#10b981';
            case 'good': return '#3b82f6';
            case 'average': return '#f59e0b';
            case 'poor': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getPerformanceIcon = (performance) => {
        switch(performance) {
            case 'excellent': return <TrendingUp size={16} />;
            case 'good': return <TrendingUp size={16} />;
            case 'average': return <TrendingUp size={16} />;
            case 'poor': return <TrendingDown size={16} />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <RefreshCw className="loading-spinner" size={32} />
                <p>Loading branch data...</p>
            </div>
        );
    }

    return (
        <div className="branch-overview-container">
            {/* Header */}
            <div className="branch-header">
                <div>
                    <h1><Building2 size={28} /> Branch Overview</h1>
                    <p className="subtitle">Monitor and compare all branch performance</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={exportBranchData}>
                        <Download size={18} /> Export Report
                    </button>
                    <button className="btn btn-secondary" onClick={loadBranches}>
                        <RefreshCw size={18} /> Refresh
                    </button>
                </div>
            </div>

            {/* Overall Stats */}
            <div className="overall-stats-grid">
                <div className="overall-stat-card">
                    <div className="stat-icon" style={{background: '#667eea'}}>
                        <Building2 size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{branchStats.totalBranches}</h3>
                        <p>Total Branches</p>
                        <small>{branchStats.activeBranches} active</small>
                    </div>
                </div>

                <div className="overall-stat-card">
                    <div className="stat-icon" style={{background: '#4caf50'}}>
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{branchStats.totalMembers.toLocaleString()}</h3>
                        <p>Total Members</p>
                        <small>Across all branches</small>
                    </div>
                </div>

                <div className="overall-stat-card">
                    <div className="stat-icon" style={{background: '#ff9800'}}>
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>UGX {Math.round(branchStats.totalSavings).toLocaleString()}</h3>
                        <p>Total Savings</p>
                        <small>Combined savings</small>
                    </div>
                </div>

                <div className="overall-stat-card">
                    <div className="stat-icon" style={{background: '#2196f3'}}>
                        <BarChart3 size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{branchStats.avgRepaymentRate}%</h3>
                        <p>Avg. Repayment Rate</p>
                        <small>Branch average</small>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-panel">
                <div className="filters-header">
                    <h3><Filter size={20} /> Filter Branches</h3>
                    <span className="badge">{filteredBranches.length} branches found</span>
                </div>
                
                <div className="filters-grid">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by branch name, location, or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>Region</label>
                        <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
                            <option value="all">All Regions</option>
                            {regions.map(region => (
                                <option key={region} value={region}>{region}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>Performance</label>
                        <select value={filterPerformance} onChange={(e) => setFilterPerformance(e.target.value)}>
                            <option value="all">All Performance</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="average">Average</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Branches Grid/Table */}
            <div className="branches-container">
                {filteredBranches.length === 0 ? (
                    <div className="no-data">
                        <Building2 size={48} />
                        <p>No branches found matching your criteria</p>
                    </div>
                ) : (
                    <div className="branches-grid">
                        {filteredBranches.map((branch) => (
                            <div key={branch.id} className="branch-card">
                                <div className="branch-card-header">
                                    <div className="branch-basic-info">
                                        <div className="branch-icon">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h3>{branch.name}</h3>
                                            <div className="branch-meta">
                                                <span className="branch-code">{branch.code || 'N/A'}</span>
                                                <span className="branch-location">
                                                    <MapPin size={12} /> {branch.location || 'Not specified'}
                                                </span>
                                                {branch.region && (
                                                    <span className="branch-region">{branch.region}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="branch-performance">
                                        <span 
                                            className="performance-badge"
                                            style={{backgroundColor: getPerformanceColor(branch.performance)}}
                                        >
                                            {getPerformanceIcon(branch.performance)}
                                            {branch.performance}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="branch-stats">
                                    <div className="stat-item">
                                        <strong>{branch.membersCount.toLocaleString()}</strong>
                                        <small>Members</small>
                                    </div>
                                    <div className="stat-item">
                                        <strong>UGX {Math.round(branch.totalSavings).toLocaleString()}</strong>
                                        <small>Savings</small>
                                    </div>
                                    <div className="stat-item">
                                        <strong>{branch.totalLoans}</strong>
                                        <small>Loans</small>
                                    </div>
                                    <div className="stat-item">
                                        <strong>{branch.repaymentRate}%</strong>
                                        <small>Repayment</small>
                                    </div>
                                </div>
                                
                                <div className="branch-details">
                                    <div className="detail-row">
                                        <span>Active Loans:</span>
                                        <strong>{branch.activeLoans}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Overdue:</span>
                                        <strong className="overdue">{branch.overdueLoans}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Staff:</span>
                                        <strong>{branch.staffCount}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Branch Manager:</span>
                                        <strong>{branch.branch_manager?.full_name || 'Not assigned'}</strong>
                                    </div>
                                </div>
                                
                                <div className="branch-actions">
                                    <button 
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setSelectedBranch(branch)}
                                    >
                                        <Eye size={14} /> View Details
                                    </button>
                                    <button className="btn btn-sm btn-primary">
                                        <BarChart3 size={14} /> Performance
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Performance Summary */}
            <div className="performance-summary">
                <h3><BarChart3 size={20} /> Performance Summary</h3>
                <div className="performance-grid">
                    <div className="performance-card">
                        <h4>Top Performing Branches</h4>
                        <ul>
                            {branches
                                .filter(b => b.performance === 'excellent')
                                .slice(0, 3)
                                .map(branch => (
                                    <li key={branch.id}>
                                        <span>{branch.name}</span>
                                        <span className="performance-score">95%</span>
                                    </li>
                                ))}
                        </ul>
                    </div>
                    
                    <div className="performance-card">
                        <h4>Needs Attention</h4>
                        <ul>
                            {branches
                                .filter(b => b.performance === 'poor' || b.overdueLoans > 5)
                                .slice(0, 3)
                                .map(branch => (
                                    <li key={branch.id}>
                                        <span>{branch.name}</span>
                                        <span className="attention-score">{branch.overdueLoans} overdue</span>
                                    </li>
                                ))}
                        </ul>
                    </div>
                    
                    <div className="performance-card">
                        <h4>Quick Stats</h4>
                        <div className="quick-stats">
                            <div className="quick-stat">
                                <span>Highest Savings:</span>
                                <strong>
                                    UGX {Math.max(...branches.map(b => b.totalSavings)).toLocaleString()}
                                </strong>
                            </div>
                            <div className="quick-stat">
                                <span>Highest Members:</span>
                                <strong>
                                    {Math.max(...branches.map(b => b.membersCount)).toLocaleString()}
                                </strong>
                            </div>
                            <div className="quick-stat">
                                <span>Best Repayment:</span>
                                <strong>
                                    {Math.max(...branches.map(b => b.repaymentRate))}%
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BranchOverview;