import { useState, useEffect } from 'react';
import supabase from '../../../supabaseClient';
import {
    BarChart3, TrendingUp, TrendingDown, Users,
    DollarSign, Percent, Calendar, Download,
    Filter, AlertCircle, Building2, Group,
    CreditCard, Target, Activity, Trophy,
    Award, CheckCircle, Eye, RefreshCw,
    Shield, Wallet
} from 'lucide-react';
import './PerformanceAnalytics.css';

export default function PerformanceAnalytics() {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month');
    const [performanceData, setPerformanceData] = useState({
        branches: [],
        branchComparison: [],
        financialMetrics: {
            totalSavings: 0,
            savingsGrowth: 0,
            totalLoans: 0,
            loanGrowth: 0,
            repaymentRate: 0,
            defaultRate: 0,
            processingFees: 0,
            netProfit: 0,
            operationalCosts: 0,
            roi: 0
        },
        memberStats: {
            totalMembers: 0,
            activeMembers: 0,
            newMembers: 0,
            avgSavings: 0
        },
        kpis: {
            operationalEfficiency: 0,
            memberEngagement: 0,
            financialHealth: 0,
            riskExposure: 0,
            growthIndex: 0
        },
        alerts: [],
        opportunities: []
    });

    const [viewMode, setViewMode] = useState('overview');
    const [selectedBranch, setSelectedBranch] = useState('all');

    // Available time ranges
    const timeRanges = [
        { id: 'day', label: 'Today' },
        { id: 'week', label: 'Last 7 Days' },
        { id: 'month', label: 'This Month' },
        { id: 'quarter', label: 'This Quarter' },
        { id: 'year', label: 'This Year' },
        { id: 'all', label: 'All Time' }
    ];

    // Available view modes
    const viewModes = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
        { id: 'branches', label: 'Branches', icon: <Building2 size={16} /> },
        { id: 'financial', label: 'Financial', icon: <DollarSign size={16} /> }
    ];

    // Load performance data
    useEffect(() => {
        loadPerformanceData();
    }, [timeRange]);

    const loadPerformanceData = async () => {
        try {
            setLoading(true);
            
            await Promise.all([
                loadBranchPerformance(),
                loadFinancialMetrics(),
                loadMemberStats(),
                loadKpisAndAlerts()
            ]);
            
        } catch (error) {
            console.error('Error loading performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBranchPerformance = async () => {
        try {
            const { data: branches = [] } = await supabase
                .from('branches')
                .select('id, name, region, created_at, branch_manager_id, is_active')
                .eq('is_active', true);

            const branchPerformance = await Promise.all(
                branches.map(async (branch) => {
                    // Get branch members
                    const { data: members = [] } = await supabase
                        .from('members')
                        .select('id, status, total_shares, loan_repayment_rate, performance_score')
                        .eq('branch_id', branch.id);

                    // Get branch manager info
                    const { data: manager = null } = branch.branch_manager_id 
                        ? await supabase
                            .from('users_meta')
                            .select('full_name')
                            .eq('id', branch.branch_manager_id)
                            .single()
                            .catch(() => ({ data: null }))
                        : { data: null };

                    // Calculate metrics
                    const memberCount = members.length;
                    const activeMembers = members.filter(m => m.status === 'ACTIVE').length;
                    const totalSavings = members.reduce((sum, m) => sum + (parseFloat(m.total_shares) || 0), 0);
                    
                    const avgPerformanceScore = memberCount > 0 
                        ? members.reduce((sum, m) => sum + (parseFloat(m.performance_score) || 0), 0) / memberCount
                        : 0;

                    // Calculate performance score (0-100)
                    const performanceScore = Math.min(100, Math.max(0, Math.round(
                        ((activeMembers / Math.max(memberCount, 1)) * 100 * 0.6) +
                        (avgPerformanceScore * 0.4)
                    )));

                    return {
                        id: branch.id,
                        name: branch.name,
                        region: branch.region || 'Not specified',
                        manager: manager?.full_name || 'Not Assigned',
                        metrics: {
                            memberCount,
                            activeMembers,
                            totalSavings,
                            avgSavings: memberCount > 0 ? totalSavings / memberCount : 0,
                            performanceScore,
                            memberEngagement: Math.round((activeMembers / Math.max(memberCount, 1)) * 100)
                        }
                    };
                })
            );

            setPerformanceData(prev => ({
                ...prev,
                branches: branchPerformance,
                branchComparison: branchPerformance.sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore)
            }));

        } catch (error) {
            console.error('Error loading branch performance:', error);
        }
    };

    const loadFinancialMetrics = async () => {
        try {
            // Get date range based on timeRange
            const dateRange = getDateRange(timeRange);
            
            const [
                { data: savings = [] },
                { data: loans = [] },
                { data: repayments = [] },
                { data: processingFees = [] },
                { data: expenses = [] }
            ] = await Promise.all([
                supabase.from('member_savings')
                    .select('amount, created_at')
                    .gte('created_at', dateRange.start)
                    .lte('created_at', dateRange.end),
                supabase.from('member_loans')
                    .select('principal, interest_amount, processing_fee, issued_date')
                    .gte('issued_date', dateRange.start),
                supabase.from('loan_repayments')
                    .select('amount_paid, payment_date')
                    .gte('payment_date', dateRange.start)
                    .lte('payment_date', dateRange.end),
                supabase.from('member_processing_fees')
                    .select('amount, date_recorded')
                    .gte('date_recorded', dateRange.start)
                    .lte('date_recorded', dateRange.end),
                supabase.from('expenses')
                    .select('amount, expense_date')
                    .gte('expense_date', dateRange.start)
                    .lte('expense_date', dateRange.end)
            ]);

            // Calculate metrics
            const totalSavings = savings.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
            const totalLoans = loans.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0);
            const totalRepayments = repayments.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0);
            const totalProcessingFees = processingFees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
            const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            
            const interestIncome = loans.reduce((sum, l) => sum + (parseFloat(l.interest_amount) || 0), 0);
            
            const netProfit = totalSavings + totalRepayments + totalProcessingFees + interestIncome - totalExpenses;
            
            // Get all loans for portfolio quality
            const { data: allLoans = [] } = await supabase
                .from('member_loans')
                .select('loan_status, remaining_balance, principal');

            const activeLoans = allLoans.filter(l => l.loan_status === 'ACTIVE');
            const overdueLoans = allLoans.filter(l => l.loan_status === 'OVERDUE');
            const repaidLoans = allLoans.filter(l => l.loan_status === 'REPAID');
            
            const totalLoanPortfolio = allLoans.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0);
            const overduePortfolio = overdueLoans.reduce((sum, l) => sum + (parseFloat(l.remaining_balance) || 0), 0);
            
            const repaymentRate = totalLoanPortfolio > 0
                ? (repaidLoans.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0) / totalLoanPortfolio) * 100
                : 0;
            
            const defaultRate = totalLoanPortfolio > 0
                ? (overduePortfolio / totalLoanPortfolio) * 100
                : 0;

            const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : netProfit > 0 ? 100 : 0;

            setPerformanceData(prev => ({
                ...prev,
                financialMetrics: {
                    totalSavings,
                    savingsGrowth: 0, // Simplified for now
                    totalLoans,
                    loanGrowth: 0, // Simplified for now
                    repaymentRate: Math.round(repaymentRate),
                    defaultRate: Math.round(defaultRate),
                    processingFees: totalProcessingFees,
                    interestIncome,
                    netProfit,
                    operationalCosts: totalExpenses,
                    roi: Math.round(roi),
                    loanPortfolio: {
                        total: totalLoanPortfolio,
                        active: activeLoans.reduce((sum, l) => sum + (parseFloat(l.remaining_balance) || 0), 0),
                        overdue: overduePortfolio,
                        repaid: repaidLoans.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0)
                    }
                }
            }));

        } catch (error) {
            console.error('Error loading financial metrics:', error);
        }
    };

    const loadMemberStats = async () => {
        try {
            const { data: members = [] } = await supabase
                .from('members')
                .select('id, status, total_shares, performance_score, date_joined');

            const totalMembers = members.length;
            const activeMembers = members.filter(m => m.status === 'ACTIVE').length;
            
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const newMembers = members.filter(m => {
                const joinDate = new Date(m.date_joined);
                return joinDate > thirtyDaysAgo;
            }).length;
            
            const totalSavings = members.reduce((sum, m) => sum + (parseFloat(m.total_shares) || 0), 0);
            const avgSavings = totalMembers > 0 ? totalSavings / totalMembers : 0;
            
            const avgPerformanceScore = totalMembers > 0
                ? members.reduce((sum, m) => sum + (parseFloat(m.performance_score) || 0), 0) / totalMembers
                : 0;

            setPerformanceData(prev => ({
                ...prev,
                memberStats: {
                    totalMembers,
                    activeMembers,
                    newMembers,
                    avgSavings: Math.round(avgSavings),
                    satisfactionScore: Math.round(avgPerformanceScore),
                    activePercentage: Math.round((activeMembers / totalMembers) * 100)
                }
            }));

        } catch (error) {
            console.error('Error loading member stats:', error);
        }
    };

    const loadKpisAndAlerts = async () => {
        try {
            // Calculate KPIs
            const operationalEfficiency = calculateOperationalEfficiency();
            const memberEngagement = performanceData.memberStats.activePercentage || 0;
            const financialHealth = calculateFinancialHealth();
            const riskExposure = performanceData.financialMetrics.defaultRate || 0;

            // Load alerts from system issues
            const { data: issues = [] } = await supabase
                .from('system_issues')
                .select('title, description, priority, status')
                .eq('status', 'open')
                .order('priority', { ascending: false })
                .limit(5)
                .catch(() => ({ data: [] }));

            // Identify opportunities
            const opportunities = identifyOpportunities();

            setPerformanceData(prev => ({
                ...prev,
                kpis: {
                    operationalEfficiency,
                    memberEngagement,
                    financialHealth,
                    riskExposure,
                    growthIndex: Math.round((memberEngagement + (100 - riskExposure)) / 2)
                },
                alerts: issues,
                opportunities
            }));

        } catch (error) {
            console.error('Error loading KPIs and alerts:', error);
        }
    };

    const calculateOperationalEfficiency = () => {
        const { branches } = performanceData;
        
        if (branches.length === 0) return 0;
        
        const avgBranchPerformance = branches.length > 0
            ? branches.reduce((sum, b) => sum + (b.metrics?.performanceScore || 0), 0) / branches.length
            : 0;
        
        return Math.round(avgBranchPerformance);
    };

    const calculateFinancialHealth = () => {
        const { financialMetrics, memberStats } = performanceData;
        
        if (financialMetrics.totalSavings === 0 && memberStats.totalSavings === 0) return 0;
        
        const savingsToLoanRatio = financialMetrics.totalLoans > 0
            ? (financialMetrics.totalSavings / financialMetrics.totalLoans) * 100
            : 100;
        
        const repaymentHealth = financialMetrics.repaymentRate;
        const defaultRisk = 100 - financialMetrics.defaultRate;
        
        return Math.round((savingsToLoanRatio * 0.4) + (repaymentHealth * 0.4) + (defaultRisk * 0.2));
    };

    const identifyOpportunities = () => {
        const opportunities = [];
        
        // Identify underperforming branches
        const underperformingBranches = performanceData.branches
            .filter(b => b.metrics?.performanceScore < 60)
            .slice(0, 3);
        
        underperformingBranches.forEach(branch => {
            opportunities.push({
                type: 'branch_improvement',
                title: `Improve ${branch.name} Performance`,
                description: `Performance score: ${branch.metrics.performanceScore}%`,
                potentialImpact: 'Medium',
                estimatedEffort: '2-4 weeks'
            });
        });
        
        // Identify opportunities for loan growth
        const { financialMetrics } = performanceData;
        if (financialMetrics.loanGrowth < 10) {
            opportunities.push({
                type: 'loan_growth',
                title: 'Increase Loan Disbursement',
                description: `Current loan portfolio: ${formatCurrency(financialMetrics.totalLoans)}`,
                potentialImpact: 'High',
                estimatedEffort: '1 month'
            });
        }
        
        return opportunities.slice(0, 3);
    };

    const getDateRange = (range) => {
        const now = new Date();
        const start = new Date();
        
        switch (range) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
            case 'all':
                start.setFullYear(2020);
                break;
            default:
                start.setMonth(now.getMonth() - 1);
        }
        
        return { start: start.toISOString(), end: now.toISOString() };
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num || 0);
    };

    const getTrendIcon = (value) => {
        if (value > 0) return <TrendingUp className="trend-up" size={16} />;
        if (value < 0) return <TrendingDown className="trend-down" size={16} />;
        return <Activity className="trend-neutral" size={16} />;
    };

    const getPerformanceColor = (score) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'danger';
    };

    const renderOverview = () => {
        const data = performanceData;
        
        return (
            <div className="performance-overview">
                {/* KPI Dashboard */}
                <div className="kpi-dashboard">
                    <div className="kpi-card primary">
                        <div className="kpi-header">
                            <BarChart3 size={24} />
                            <h3>Operational Efficiency</h3>
                        </div>
                        <div className="kpi-value">{data.kpis.operationalEfficiency}%</div>
                        <div className="kpi-progress">
                            <div 
                                className="progress-bar" 
                                style={{ width: `${data.kpis.operationalEfficiency}%` }}
                            />
                        </div>
                        <div className="kpi-trend">
                            {getTrendIcon(data.kpis.operationalEfficiency - 70)}
                            <span>Overall SACCO Performance</span>
                        </div>
                    </div>
                    
                    <div className="kpi-card success">
                        <div className="kpi-header">
                            <Users size={24} />
                            <h3>Member Engagement</h3>
                        </div>
                        <div className="kpi-value">{data.kpis.memberEngagement}%</div>
                        <div className="kpi-progress">
                            <div 
                                className="progress-bar" 
                                style={{ width: `${data.kpis.memberEngagement}%` }}
                            />
                        </div>
                        <div className="kpi-trend">
                            {getTrendIcon(data.kpis.memberEngagement - 70)}
                            <span>Active Member Percentage</span>
                        </div>
                    </div>
                    
                    <div className="kpi-card warning">
                        <div className="kpi-header">
                            <DollarSign size={24} />
                            <h3>Financial Health</h3>
                        </div>
                        <div className="kpi-value">{data.kpis.financialHealth}%</div>
                        <div className="kpi-progress">
                            <div 
                                className="progress-bar" 
                                style={{ width: `${data.kpis.financialHealth}%` }}
                            />
                        </div>
                        <div className="kpi-trend">
                            {getTrendIcon(data.kpis.financialHealth - 70)}
                            <span>Financial Stability Score</span>
                        </div>
                    </div>
                    
                    <div className="kpi-card info">
                        <div className="kpi-header">
                            <TrendingUp size={24} />
                            <h3>Growth Index</h3>
                        </div>
                        <div className="kpi-value">{data.kpis.growthIndex}%</div>
                        <div className="kpi-progress">
                            <div 
                                className="progress-bar" 
                                style={{ width: `${data.kpis.growthIndex}%` }}
                            />
                        </div>
                        <div className="kpi-trend">
                            {getTrendIcon(data.kpis.growthIndex - 70)}
                            <span>Overall Growth Rate</span>
                        </div>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="top-performers-section">
                    <div className="performers-card">
                        <div className="card-header">
                            <h3><Trophy size={20} /> Top Performing Branches</h3>
                            <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => setViewMode('branches')}
                            >
                                View All
                            </button>
                        </div>
                        <div className="performers-list">
                            {data.branchComparison.slice(0, 3).map((branch, index) => (
                                <div key={branch.id} className="performer-item">
                                    <div className="performer-rank">
                                        <div className={`rank-badge rank-${index + 1}`}>
                                            {index + 1}
                                        </div>
                                        <div className="performer-info">
                                            <h4>{branch.name}</h4>
                                            <small>{branch.region} • {branch.manager}</small>
                                        </div>
                                    </div>
                                    <div className="performer-metrics">
                                        <div className="metric">
                                            <span>Performance</span>
                                            <strong className={`score-${getPerformanceColor(branch.metrics.performanceScore)}`}>
                                                {branch.metrics.performanceScore}%
                                            </strong>
                                        </div>
                                        <div className="metric">
                                            <span>Members</span>
                                            <strong>{branch.metrics.memberCount}</strong>
                                        </div>
                                        <div className="metric">
                                            <span>Engagement</span>
                                            <strong>{branch.metrics.memberEngagement}%</strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="financial-summary">
                    <div className="card-header">
                        <h3><DollarSign size={20} /> Financial Performance Summary</h3>
                        <span className="time-range">{timeRanges.find(t => t.id === timeRange)?.label}</span>
                    </div>
                    <div className="financial-metrics">
                        <div className="financial-metric">
                            <div className="metric-label">
                                <DollarSign size={18} />
                                <span>Total Savings</span>
                            </div>
                            <div className="metric-value">
                                {formatCurrency(data.financialMetrics.totalSavings)}
                            </div>
                        </div>
                        
                        <div className="financial-metric">
                            <div className="metric-label">
                                <CreditCard size={18} />
                                <span>Total Loans</span>
                            </div>
                            <div className="metric-value">
                                {formatCurrency(data.financialMetrics.totalLoans)}
                            </div>
                        </div>
                        
                        <div className="financial-metric">
                            <div className="metric-label">
                                <Percent size={18} />
                                <span>Repayment Rate</span>
                            </div>
                            <div className="metric-value">
                                {data.financialMetrics.repaymentRate}%
                                <div className="metric-trend">
                                    <span className={data.financialMetrics.repaymentRate >= 90 ? 'positive' : 'negative'}>
                                        {data.financialMetrics.repaymentRate >= 90 ? 'Excellent' : 'Needs Attention'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="financial-metric">
                            <div className="metric-label">
                                <AlertCircle size={18} />
                                <span>Default Rate</span>
                            </div>
                            <div className="metric-value">
                                {data.financialMetrics.defaultRate}%
                                <div className="metric-trend">
                                    <span className={data.financialMetrics.defaultRate <= 5 ? 'positive' : 'negative'}>
                                        {data.financialMetrics.defaultRate <= 5 ? 'Low Risk' : 'High Risk'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="financial-metric">
                            <div className="metric-label">
                                <Wallet size={18} />
                                <span>Net Profit</span>
                            </div>
                            <div className="metric-value">
                                {formatCurrency(data.financialMetrics.netProfit)}
                                <div className="metric-trend">
                                    <span className={data.financialMetrics.roi >= 20 ? 'positive' : 'negative'}>
                                        ROI: {data.financialMetrics.roi}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts and Opportunities */}
                <div className="alerts-opportunities-section">
                    <div className="alerts-card">
                        <div className="card-header">
                            <h3><AlertCircle size={20} /> System Alerts</h3>
                            <span className="badge danger">{data.alerts.length}</span>
                        </div>
                        <div className="alerts-list">
                            {data.alerts.length > 0 ? (
                                data.alerts.map((alert, index) => (
                                    <div key={index} className="alert-item">
                                        <div className="alert-icon">
                                            <AlertCircle size={16} />
                                        </div>
                                        <div className="alert-content">
                                            <h4>{alert.title}</h4>
                                            <p>{alert.description}</p>
                                            <div className="alert-meta">
                                                <span className={`priority ${alert.priority}`}>
                                                    {alert.priority}
                                                </span>
                                                <span className="status">{alert.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-alerts">
                                    <CheckCircle size={32} />
                                    <p>No active alerts</p>
                                    <small>All systems are operating normally</small>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="opportunities-card">
                        <div className="card-header">
                            <h3><Target size={20} /> Growth Opportunities</h3>
                            <span className="badge success">{data.opportunities.length}</span>
                        </div>
                        <div className="opportunities-list">
                            {data.opportunities.length > 0 ? (
                                data.opportunities.map((opp, index) => (
                                    <div key={index} className="opportunity-item">
                                        <div className="opportunity-icon">
                                            <Target size={16} />
                                        </div>
                                        <div className="opportunity-content">
                                            <h4>{opp.title}</h4>
                                            <p>{opp.description}</p>
                                            <div className="opportunity-meta">
                                                <span className="impact">{opp.potentialImpact} Impact</span>
                                                <span className="effort">{opp.estimatedEffort}</span>
                                            </div>
                                        </div>
                                        <button className="btn btn-sm btn-primary">
                                            <Eye size={14} /> View
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="no-opportunities">
                                    <Target size={32} />
                                    <p>No opportunities identified</p>
                                    <small>All areas are performing optimally</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBranchPerformance = () => {
        const data = performanceData;
        
        return (
            <div className="branch-performance-view">
                <div className="view-header">
                    <h2><Building2 size={24} /> Branch Performance Analysis</h2>
                    <p>Detailed performance metrics for all branches</p>
                </div>
                
                <div className="branch-performance-grid">
                    {data.branchComparison.map(branch => (
                        <div key={branch.id} className="branch-performance-card">
                            <div className="branch-header">
                                <h3>{branch.name}</h3>
                                <span className={`performance-badge ${getPerformanceColor(branch.metrics.performanceScore)}`}>
                                    {branch.metrics.performanceScore}%
                                </span>
                            </div>
                            
                            <div className="branch-info">
                                <div className="info-item">
                                    <span>Region</span>
                                    <strong>{branch.region}</strong>
                                </div>
                                <div className="info-item">
                                    <span>Manager</span>
                                    <strong>{branch.manager}</strong>
                                </div>
                                <div className="info-item">
                                    <span>Status</span>
                                    <strong className="status-active">Active</strong>
                                </div>
                            </div>
                            
                            <div className="branch-metrics-grid">
                                <div className="metric-item">
                                    <div className="metric-label">
                                        <Users size={14} />
                                        <span>Total Members</span>
                                    </div>
                                    <div className="metric-value">{branch.metrics.memberCount}</div>
                                    <div className="metric-subtitle">
                                        {branch.metrics.activeMembers} active ({branch.metrics.memberEngagement}%)
                                    </div>
                                </div>
                                
                                <div className="metric-item">
                                    <div className="metric-label">
                                        <DollarSign size={14} />
                                        <span>Total Savings</span>
                                    </div>
                                    <div className="metric-value">{formatCurrency(branch.metrics.totalSavings)}</div>
                                    <div className="metric-subtitle">
                                        Avg: {formatCurrency(branch.metrics.avgSavings)}
                                    </div>
                                </div>
                                
                                <div className="metric-item">
                                    <div className="metric-label">
                                        <BarChart3 size={14} />
                                        <span>Performance Score</span>
                                    </div>
                                    <div className="metric-value">{branch.metrics.performanceScore}/100</div>
                                    <div className="metric-subtitle">
                                        Overall branch performance
                                    </div>
                                </div>
                            </div>
                            
                            <div className="branch-actions">
                                <button className="btn btn-sm btn-primary">
                                    <Eye size={14} /> View Details
                                </button>
                                <button className="btn btn-sm btn-secondary">
                                    <Download size={14} /> Export
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderFinancialPerformance = () => {
        const data = performanceData;
        const financial = data.financialMetrics;
        
        return (
            <div className="financial-performance-view">
                <div className="view-header">
                    <h2><DollarSign size={24} /> Financial Performance Analysis</h2>
                    <p>Detailed financial metrics and trends</p>
                </div>
                
                <div className="financial-metrics-grid">
                    <div className="financial-summary-card">
                        <h3>Income Summary</h3>
                        <div className="income-items">
                            <div className="income-item">
                                <span>Member Savings</span>
                                <strong>{formatCurrency(financial.totalSavings)}</strong>
                            </div>
                            <div className="income-item">
                                <span>Loan Interest</span>
                                <strong>{formatCurrency(financial.interestIncome)}</strong>
                            </div>
                            <div className="income-item">
                                <span>Processing Fees</span>
                                <strong>{formatCurrency(financial.processingFees)}</strong>
                            </div>
                            <div className="income-item total">
                                <span>Total Income</span>
                                <strong>
                                    {formatCurrency(
                                        financial.totalSavings + 
                                        financial.interestIncome + 
                                        financial.processingFees
                                    )}
                                </strong>
                            </div>
                        </div>
                    </div>
                    
                    <div className="financial-summary-card">
                        <h3>Expenses Summary</h3>
                        <div className="expense-items">
                            <div className="expense-item">
                                <span>Operational Costs</span>
                                <strong>{formatCurrency(financial.operationalCosts)}</strong>
                            </div>
                            <div className="expense-item total">
                                <span>Total Expenses</span>
                                <strong>
                                    {formatCurrency(financial.operationalCosts)}
                                </strong>
                            </div>
                        </div>
                    </div>
                    
                    <div className="financial-summary-card">
                        <h3>Profitability</h3>
                        <div className="profitability-items">
                            <div className="profitability-item">
                                <span>Net Profit</span>
                                <strong className={financial.netProfit >= 0 ? 'positive' : 'negative'}>
                                    {formatCurrency(financial.netProfit)}
                                </strong>
                            </div>
                            <div className="profitability-item">
                                <span>ROI</span>
                                <strong className={financial.roi >= 20 ? 'positive' : financial.roi >= 10 ? 'warning' : 'negative'}>
                                    {financial.roi}%
                                </strong>
                            </div>
                        </div>
                    </div>
                    
                    <div className="financial-summary-card">
                        <h3>Loan Portfolio Quality</h3>
                        <div className="portfolio-items">
                            <div className="portfolio-item">
                                <span>Total Portfolio</span>
                                <strong>{formatCurrency(financial.loanPortfolio?.total || 0)}</strong>
                            </div>
                            <div className="portfolio-item">
                                <span>Active Loans</span>
                                <strong>{formatCurrency(financial.loanPortfolio?.active || 0)}</strong>
                            </div>
                            <div className="portfolio-item">
                                <span>Repaid Loans</span>
                                <strong>{formatCurrency(financial.loanPortfolio?.repaid || 0)}</strong>
                            </div>
                            <div className="portfolio-item">
                                <span>Overdue Loans</span>
                                <strong className="negative">
                                    {formatCurrency(financial.loanPortfolio?.overdue || 0)}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Risk Metrics */}
                <div className="risk-metrics-section">
                    <h3><AlertCircle size={20} /> Risk Metrics</h3>
                    <div className="risk-metrics">
                        <div className="risk-metric">
                            <div className="risk-label">
                                <span>Default Rate</span>
                                <small>Percentage of overdue loans</small>
                            </div>
                            <div className={`risk-value ${financial.defaultRate <= 5 ? 'positive' : financial.defaultRate <= 10 ? 'warning' : 'negative'}`}>
                                {financial.defaultRate}%
                            </div>
                        </div>
                        
                        <div className="risk-metric">
                            <div className="risk-label">
                                <span>Repayment Rate</span>
                                <small>Percentage of repaid loans</small>
                            </div>
                            <div className={`risk-value ${financial.repaymentRate >= 90 ? 'positive' : financial.repaymentRate >= 80 ? 'warning' : 'negative'}`}>
                                {financial.repaymentRate}%
                            </div>
                        </div>
                        
                        <div className="risk-metric">
                            <div className="risk-label">
                                <span>Portfolio Health</span>
                                <small>Overall loan portfolio quality</small>
                            </div>
                            <div className={`risk-value ${data.kpis.financialHealth >= 70 ? 'positive' : data.kpis.financialHealth >= 60 ? 'warning' : 'negative'}`}>
                                {data.kpis.financialHealth}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderViewMode = () => {
        switch (viewMode) {
            case 'overview':
                return renderOverview();
            case 'branches':
                return renderBranchPerformance();
            case 'financial':
                return renderFinancialPerformance();
            default:
                return renderOverview();
        }
    };

    if (loading) {
        return (
            <div className="loading-fullscreen">
                <RefreshCw className="loading-spinner" size={32} />
                <p>Loading Performance Analytics...</p>
            </div>
        );
    }

    return (
        <div className="performance-analytics">
            {/* Header with Controls */}
            <div className="analytics-header">
                <div className="header-left">
                    <h1><BarChart3 size={28} /> Performance Analytics</h1>
                    <p>Comprehensive performance metrics and insights for SACCO management</p>
                </div>
                <div className="header-right">
                    <button 
                        className="btn btn-primary"
                        onClick={loadPerformanceData}
                        disabled={loading}
                    >
                        <RefreshCw size={18} /> 
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                    <button className="btn btn-secondary">
                        <Download size={18} /> Export Report
                    </button>
                </div>
            </div>

            {/* Controls Panel */}
            <div className="controls-panel">
                <div className="time-range-selector">
                    <label><Calendar size={16} /> Time Range:</label>
                    <div className="time-range-buttons">
                        {timeRanges.map(range => (
                            <button
                                key={range.id}
                                className={`time-range-btn ${timeRange === range.id ? 'active' : ''}`}
                                onClick={() => setTimeRange(range.id)}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="view-selector">
                    <label><Eye size={16} /> View Mode:</label>
                    <div className="view-mode-buttons">
                        {viewModes.map(mode => (
                            <button
                                key={mode.id}
                                className={`view-mode-btn ${viewMode === mode.id ? 'active' : ''}`}
                                onClick={() => setViewMode(mode.id)}
                            >
                                {mode.icon}
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="branch-filter">
                    <label><Building2 size={16} /> Filter by Branch:</label>
                    <select 
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="branch-select"
                    >
                        <option value="all">All Branches</option>
                        {performanceData.branches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Performance Content */}
            <div className="performance-content">
                {renderViewMode()}
            </div>

            {/* Summary Footer */}
            <div className="summary-footer">
                <div className="summary-item">
                    <span className="summary-label">Total Performance Score:</span>
                    <span className="summary-value">
                        {performanceData.kpis.operationalEfficiency}%
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Financial Health:</span>
                    <span className={`summary-value ${performanceData.kpis.financialHealth >= 70 ? 'positive' : 'negative'}`}>
                        {performanceData.kpis.financialHealth >= 70 ? 'Healthy' : 'Needs Attention'}
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Risk Level:</span>
                    <span className={`summary-value ${performanceData.kpis.riskExposure <= 5 ? 'positive' : performanceData.kpis.riskExposure <= 10 ? 'warning' : 'negative'}`}>
                        {performanceData.kpis.riskExposure <= 5 ? 'Low' : performanceData.kpis.riskExposure <= 10 ? 'Medium' : 'High'}
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Growth Trend:</span>
                    <span className={`summary-value ${performanceData.kpis.growthIndex >= 60 ? 'positive' : performanceData.kpis.growthIndex >= 40 ? 'warning' : 'negative'}`}>
                        {performanceData.kpis.growthIndex >= 60 ? 'Growing' : 'Stable'}
                    </span>
                </div>
            </div>
        </div>
    );
}