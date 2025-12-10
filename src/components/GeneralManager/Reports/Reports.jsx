// src/components/GeneralManager/Reports/Reports.jsx
import { useState, useEffect, useRef } from 'react';
import { 
    FileText, Download, Filter, Calendar, RefreshCw, Search,
    BarChart3, PieChart, TrendingUp, TrendingDown, Users,
    CreditCard, DollarSign, Percent, Building2, Activity,
    AlertCircle, CheckCircle, Printer, Eye, X, ChevronDown,
    ChevronUp, FileSpreadsheet, FileType, FilePieChart,
    FileBarChart, File, Layers, Shield, Briefcase,
    Clock, Target, Award, TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon
} from 'lucide-react';
import supabase from '../../../supabaseClient';
import './Reports.css';

// Import charting libraries
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

export default function Reports() {
    const [loading, setLoading] = useState(false);
    const [activeReport, setActiveReport] = useState('loan_book');
    const [dateRange, setDateRange] = useState('month');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [branchFilter, setBranchFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // All reports data state
    const [reports, setReports] = useState({
        loanBook: {
            loans: [],
            summary: {
                totalLoans: 0,
                totalPrincipal: 0,
                totalOutstanding: 0,
                totalInterest: 0,
                avgLoanSize: 0,
                defaultRate: 0
            }
        },
        agingReport: {
            categories: [],
            overdueLoans: [],
            summary: {
                current: 0,
                days30: 0,
                days60: 0,
                days90: 0,
                over90: 0,
                totalOverdue: 0
            }
        },
        performanceReport: {
            branches: [],
            facilitators: [],
            summary: {
                overallPerformance: 0,
                memberGrowth: 0,
                savingsGrowth: 0,
                repaymentRate: 0
            }
        },
        financialReport: {
            income: [],
            expenses: [],
            summary: {
                totalIncome: 0,
                totalExpenses: 0,
                netProfit: 0,
                savingsGrowth: 0,
                loanPortfolioGrowth: 0
            }
        },
        memberReport: {
            members: [],
            statistics: {
                totalMembers: 0,
                activeMembers: 0,
                newMembers: 0,
                membersWithLoans: 0,
                avgSavings: 0,
                avgRepaymentRate: 0
            }
        },
        branchReport: {
            branches: [],
            summary: {
                bestPerforming: null,
                worstPerforming: null,
                totalCashFlow: 0,
                avgPerformance: 0
            }
        }
    });

    const [allBranches, setAllBranches] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    const [chartData, setChartData] = useState({});
    
    const reportRef = useRef();

    // Report types with descriptions
    const reportTypes = [
        { id: 'loan_book', label: 'Loan Book Report', icon: <FileText size={20} />, description: 'Complete loan portfolio with status and details' },
        { id: 'aging_report', label: 'Aging Report', icon: <Clock size={20} />, description: 'Overdue loans categorized by aging periods' },
        { id: 'performance', label: 'Performance Report', icon: <BarChart3 size={20} />, description: 'Branch and facilitator performance metrics' },
        { id: 'financial', label: 'Financial Report', icon: <DollarSign size={20} />, description: 'Income, expenses, and profitability analysis' },
        { id: 'member', label: 'Member Report', icon: <Users size={20} />, description: 'Member statistics and demographics' },
        { id: 'branch', label: 'Branch Report', icon: <Building2 size={20} />, description: 'Branch-wise performance and comparison' },
        { id: 'portfolio', label: 'Portfolio Report', icon: <Briefcase size={20} />, description: 'Investment portfolio and asset allocation' },
        { id: 'compliance', label: 'Compliance Report', icon: <Shield size={20} />, description: 'Regulatory compliance and audit trail' }
    ];

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    // Load data when filters change
    useEffect(() => {
        if (allBranches.length > 0) {
            loadReportData();
        }
    }, [activeReport, dateRange, startDate, endDate, branchFilter]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [branchesData] = await Promise.all([
                supabase.from('branches').select('id, name, is_active').order('name')
            ]);
            
            setAllBranches(branchesData.data || []);
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadReportData = async () => {
        try {
            setLoading(true);
            
            switch (activeReport) {
                case 'loan_book':
                    await loadLoanBookReport();
                    break;
                case 'aging_report':
                    await loadAgingReport();
                    break;
                case 'performance':
                    await loadPerformanceReport();
                    break;
                case 'financial':
                    await loadFinancialReport();
                    break;
                case 'member':
                    await loadMemberReport();
                    break;
                case 'branch':
                    await loadBranchReport();
                    break;
                case 'portfolio':
                    await loadPortfolioReport();
                    break;
                case 'compliance':
                    await loadComplianceReport();
                    break;
            }
            
        } catch (error) {
            console.error(`Error loading ${activeReport} data:`, error);
        } finally {
            setLoading(false);
        }
    };

    const loadLoanBookReport = async () => {
        try {
            const query = supabase
                .from('member_loans')
                .select(`
                    id, loan_number, principal, interest_rate, loan_status, remaining_balance,
                    processing_fee, issued_date, due_date, purpose,
                    member:members(full_name, member_number, phone, branch_id),
                    branch:branches(name),
                    repayments:loan_repayments(amount_paid, payment_date)
                `)
                .order('issued_date', { ascending: false });

            // Apply filters
            if (branchFilter !== 'all') {
                query.eq('member.branch_id', branchFilter);
            }

            if (dateRange === 'custom') {
                query.gte('issued_date', startDate + 'T00:00:00')
                     .lte('issued_date', endDate + 'T23:59:59');
            } else if (dateRange === 'month') {
                const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                query.gte('issued_date', start.toISOString());
            } else if (dateRange === 'quarter') {
                const start = new Date();
                start.setMonth(start.getMonth() - 3);
                query.gte('issued_date', start.toISOString());
            }

            const { data: loans, error } = await query;

            if (error) throw error;

            const processedLoans = (loans || []).map(loan => {
                const totalPaid = loan.repayments?.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0) || 0;
                const principal = parseFloat(loan.principal) || 0;
                const outstanding = parseFloat(loan.remaining_balance) || 0;
                const totalInterest = principal * (parseFloat(loan.interest_rate) || 0) / 100;
                const repaymentRate = principal > 0 ? ((principal - outstanding) / principal) * 100 : 0;
                
                return {
                    ...loan,
                    totalPaid,
                    outstanding,
                    totalInterest,
                    repaymentRate: Math.round(repaymentRate),
                    daysOverdue: loan.loan_status === 'OVERDUE' ? 
                        Math.floor((new Date() - new Date(loan.due_date)) / (1000 * 60 * 60 * 24)) : 0
                };
            });

            const totalLoans = processedLoans.length;
            const totalPrincipal = processedLoans.reduce((sum, loan) => sum + (parseFloat(loan.principal) || 0), 0);
            const totalOutstanding = processedLoans.reduce((sum, loan) => sum + (loan.outstanding || 0), 0);
            const totalInterest = processedLoans.reduce((sum, loan) => sum + (loan.totalInterest || 0), 0);
            const overdueLoans = processedLoans.filter(loan => loan.loan_status === 'OVERDUE').length;
            const defaultRate = totalLoans > 0 ? (overdueLoans / totalLoans) * 100 : 0;

            setReports(prev => ({
                ...prev,
                loanBook: {
                    loans: processedLoans,
                    summary: {
                        totalLoans,
                        totalPrincipal,
                        totalOutstanding,
                        totalInterest,
                        avgLoanSize: totalLoans > 0 ? totalPrincipal / totalLoans : 0,
                        defaultRate
                    }
                }
            }));

            // Prepare chart data
            const statusDistribution = {
                ACTIVE: processedLoans.filter(l => l.loan_status === 'ACTIVE').length,
                OVERDUE: processedLoans.filter(l => l.loan_status === 'OVERDUE').length,
                REPAID: processedLoans.filter(l => l.loan_status === 'REPAID').length,
                DEFAULTED: processedLoans.filter(l => l.loan_status === 'DEFAULTED').length
            };

            setChartData({
                statusDistribution: {
                    labels: Object.keys(statusDistribution),
                    datasets: [{
                        data: Object.values(statusDistribution),
                        backgroundColor: [
                            'rgba(52, 152, 219, 0.8)',
                            'rgba(231, 76, 60, 0.8)',
                            'rgba(46, 204, 113, 0.8)',
                            'rgba(149, 165, 166, 0.8)'
                        ]
                    }]
                }
            });

        } catch (error) {
            console.error('Error loading loan book report:', error);
        }
    };

    const loadAgingReport = async () => {
        try {
            const { data: loans, error } = await supabase
                .from('member_loans')
                .select(`
                    id, loan_number, principal, remaining_balance, issued_date, due_date,
                    loan_status, member:members(full_name, member_number, phone),
                    branch:branches(name),
                    repayments:loan_repayments(amount_paid, payment_date)
                `)
                .in('loan_status', ['ACTIVE', 'OVERDUE'])
                .order('due_date');

            if (error) throw error;

            const today = new Date();
            const agingCategories = {
                current: [],
                days30: [],
                days60: [],
                days90: [],
                over90: []
            };

            const overdueLoans = [];

            (loans || []).forEach(loan => {
                const dueDate = new Date(loan.due_date);
                const daysPastDue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
                const outstanding = parseFloat(loan.remaining_balance) || 0;
                
                const loanWithAging = {
                    ...loan,
                    daysPastDue: Math.max(0, daysPastDue),
                    outstanding
                };

                if (daysPastDue <= 0) {
                    agingCategories.current.push(loanWithAging);
                } else if (daysPastDue <= 30) {
                    agingCategories.days30.push(loanWithAging);
                    overdueLoans.push(loanWithAging);
                } else if (daysPastDue <= 60) {
                    agingCategories.days60.push(loanWithAging);
                    overdueLoans.push(loanWithAging);
                } else if (daysPastDue <= 90) {
                    agingCategories.days90.push(loanWithAging);
                    overdueLoans.push(loanWithAging);
                } else {
                    agingCategories.over90.push(loanWithAging);
                    overdueLoans.push(loanWithAging);
                }
            });

            setReports(prev => ({
                ...prev,
                agingReport: {
                    categories: [
                        {
                            name: 'Current (0-30 days)',
                            loans: agingCategories.current,
                            amount: agingCategories.current.reduce((sum, l) => sum + l.outstanding, 0),
                            count: agingCategories.current.length
                        },
                        {
                            name: '31-60 Days Overdue',
                            loans: agingCategories.days30,
                            amount: agingCategories.days30.reduce((sum, l) => sum + l.outstanding, 0),
                            count: agingCategories.days30.length
                        },
                        {
                            name: '61-90 Days Overdue',
                            loans: agingCategories.days60,
                            amount: agingCategories.days60.reduce((sum, l) => sum + l.outstanding, 0),
                            count: agingCategories.days60.length
                        },
                        {
                            name: '91+ Days Overdue',
                            loans: agingCategories.days90.concat(agingCategories.over90),
                            amount: agingCategories.days90.concat(agingCategories.over90).reduce((sum, l) => sum + l.outstanding, 0),
                            count: agingCategories.days90.length + agingCategories.over90.length
                        }
                    ],
                    overdueLoans: overdueLoans.sort((a, b) => b.daysPastDue - a.daysPastDue),
                    summary: {
                        current: agingCategories.current.length,
                        days30: agingCategories.days30.length,
                        days60: agingCategories.days60.length,
                        days90: agingCategories.days90.length,
                        over90: agingCategories.over90.length,
                        totalOverdue: overdueLoans.length
                    }
                }
            }));

            // Aging chart data
            const agingData = {
                labels: ['Current', '31-60 Days', '61-90 Days', '91+ Days'],
                datasets: [{
                    label: 'Number of Loans',
                    data: [
                        agingCategories.current.length,
                        agingCategories.days30.length,
                        agingCategories.days60.length,
                        agingCategories.days90.length + agingCategories.over90.length
                    ],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(241, 196, 15, 0.8)',
                        'rgba(231, 76, 60, 0.8)'
                    ]
                }]
            };

            setChartData({ agingData });

        } catch (error) {
            console.error('Error loading aging report:', error);
        }
    };

    const loadPerformanceReport = async () => {
        try {
            const [
                { data: branches },
                { data: facilitators },
                { data: members },
                { data: loans }
            ] = await Promise.all([
                supabase.from('branches').select('id, name, location'),
                supabase.from('users_meta')
                    .select('id, full_name, role, assigned_branch')
                    .eq('role', 'FACILITATOR')
                    .eq('status', 'ACTIVE'),
                supabase.from('members').select('id, branch_id, facilitator_id, total_shares, loan_repayment_rate, performance_score'),
                supabase.from('member_loans').select('id, member_id, loan_status, principal, remaining_balance')
            ]);

            const branchPerformance = (branches || []).map(branch => {
                const branchMembers = (members || []).filter(m => m.branch_id === branch.id);
                const memberIds = branchMembers.map(m => m.id);
                const branchLoans = (loans || []).filter(l => memberIds.includes(l.member_id));
                
                const activeMembers = branchMembers.filter(m => m.performance_score > 0).length;
                const totalMembers = branchMembers.length;
                const totalSavings = branchMembers.reduce((sum, m) => sum + (parseFloat(m.total_shares) || 0), 0);
                const activeLoans = branchLoans.filter(l => l.loan_status === 'ACTIVE').length;
                const overdueLoans = branchLoans.filter(l => l.loan_status === 'OVERDUE').length;
                const totalLoanAmount = branchLoans.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0);
                const outstandingAmount = branchLoans.reduce((sum, l) => sum + (parseFloat(l.remaining_balance) || 0), 0);
                
                const repaymentRate = totalLoanAmount > 0 ? ((totalLoanAmount - outstandingAmount) / totalLoanAmount) * 100 : 0;
                const avgPerformance = totalMembers > 0 ? 
                    branchMembers.reduce((sum, m) => sum + (parseFloat(m.performance_score) || 0), 0) / totalMembers : 0;
                
                const performanceScore = Math.round(
                    (repaymentRate * 0.4) +
                    ((activeMembers / Math.max(totalMembers, 1)) * 100 * 0.3) +
                    (avgPerformance * 0.3)
                );

                return {
                    ...branch,
                    totalMembers,
                    activeMembers,
                    totalSavings,
                    activeLoans,
                    overdueLoans,
                    totalLoanAmount,
                    outstandingAmount,
                    repaymentRate: Math.round(repaymentRate),
                    performanceScore,
                    status: performanceScore >= 80 ? 'Excellent' : performanceScore >= 60 ? 'Good' : 'Needs Improvement'
                };
            });

            const facilitatorPerformance = (facilitators || []).map(facilitator => {
                const facilitatorMembers = (members || []).filter(m => m.facilitator_id === facilitator.id);
                const memberIds = facilitatorMembers.map(m => m.id);
                const facilitatorLoans = (loans || []).filter(l => memberIds.includes(l.member_id));
                
                const totalMembers = facilitatorMembers.length;
                const newMembers = facilitatorMembers.filter(m => {
                    const joinDate = new Date(m.date_joined || m.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return joinDate > thirtyDaysAgo;
                }).length;
                
                const totalSavings = facilitatorMembers.reduce((sum, m) => sum + (parseFloat(m.total_shares) || 0), 0);
                const activeLoans = facilitatorLoans.filter(l => l.loan_status === 'ACTIVE').length;
                const overdueLoans = facilitatorLoans.filter(l => l.loan_status === 'OVERDUE').length;
                const repaymentRate = totalMembers > 0 ? 
                    facilitatorMembers.reduce((sum, m) => sum + (parseFloat(m.loan_repayment_rate) || 0), 0) / totalMembers : 0;
                
                const performanceScore = Math.round(
                    (repaymentRate * 0.4) +
                    ((newMembers / Math.max(totalMembers, 1)) * 100 * 0.3) +
                    ((totalSavings / Math.max(totalMembers, 1)) * 0.3)
                );

                return {
                    ...facilitator,
                    totalMembers,
                    newMembers,
                    totalSavings,
                    activeLoans,
                    overdueLoans,
                    repaymentRate: Math.round(repaymentRate),
                    performanceScore,
                    status: performanceScore >= 80 ? 'Excellent' : performanceScore >= 60 ? 'Good' : 'Needs Improvement'
                };
            });

            branchPerformance.sort((a, b) => b.performanceScore - a.performanceScore);
            facilitatorPerformance.sort((a, b) => b.performanceScore - a.performanceScore);

            const overallPerformance = branchPerformance.length > 0 ? 
                branchPerformance.reduce((sum, b) => sum + b.performanceScore, 0) / branchPerformance.length : 0;
            
            const totalMembers = members?.length || 0;
            const newMembers = members?.filter(m => {
                const joinDate = new Date(m.date_joined || m.created_at);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return joinDate > thirtyDaysAgo;
            }).length || 0;
            
            const totalSavings = members?.reduce((sum, m) => sum + (parseFloat(m.total_shares) || 0), 0) || 0;
            const avgRepaymentRate = totalMembers > 0 ? 
                members.reduce((sum, m) => sum + (parseFloat(m.loan_repayment_rate) || 0), 0) / totalMembers : 0;

            setReports(prev => ({
                ...prev,
                performanceReport: {
                    branches: branchPerformance,
                    facilitators: facilitatorPerformance,
                    summary: {
                        overallPerformance: Math.round(overallPerformance),
                        memberGrowth: totalMembers > 0 ? Math.round((newMembers / totalMembers) * 100) : 0,
                        savingsGrowth: totalSavings,
                        repaymentRate: Math.round(avgRepaymentRate)
                    }
                }
            }));

            // Performance chart data
            const branchChartData = {
                labels: branchPerformance.map(b => b.name),
                datasets: [{
                    label: 'Performance Score',
                    data: branchPerformance.map(b => b.performanceScore),
                    backgroundColor: 'rgba(52, 152, 219, 0.8)'
                }]
            };

            setChartData({ branchChartData });

        } catch (error) {
            console.error('Error loading performance report:', error);
        }
    };

    const loadFinancialReport = async () => {
        try {
            const date = new Date();
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const startOfYear = new Date(date.getFullYear(), 0, 1);

            const [
                { data: savings },
                { data: repayments },
                { data: processingFees },
                { data: fines },
                { data: expenses },
                { data: socialFund },
                { data: loanIssued },
                { data: cashFlow }
            ] = await Promise.all([
                supabase.from('member_savings')
                    .select('amount, created_at')
                    .gte('created_at', startOfMonth.toISOString()),
                
                supabase.from('loan_repayments')
                    .select('amount_paid, payment_date')
                    .gte('payment_date', startOfMonth.toISOString()),
                
                supabase.from('member_processing_fees')
                    .select('amount, date_recorded')
                    .gte('date_recorded', startOfMonth.toISOString()),
                
                supabase.from('member_fines')
                    .select('amount, imposed_date')
                    .eq('status', 'paid')
                    .gte('imposed_date', startOfMonth.toISOString().split('T')[0]),
                
                supabase.from('expenses')
                    .select('amount, category, expense_date')
                    .gte('expense_date', startOfMonth.toISOString()),
                
                supabase.from('daily_submissions')
                    .select('total_social_fund, submission_date')
                    .gte('submission_date', startOfMonth.toISOString().split('T')[0]),
                
                supabase.from('member_loans')
                    .select('principal, issued_date')
                    .gte('issued_date', startOfMonth.toISOString()),
                
                supabase.from('branch_profit_ledger')
                    .select('amount, transaction_type, description, date_recorded')
                    .gte('date_recorded', startOfYear.toISOString())
                    .order('date_recorded')
            ]);

            // Calculate income
            const incomeSavings = savings?.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0) || 0;
            const incomeRepayments = repayments?.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0) || 0;
            const incomeProcessingFees = processingFees?.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) || 0;
            const incomeFines = fines?.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) || 0;
            const incomeSocialFund = socialFund?.reduce((sum, s) => sum + (parseFloat(s.total_social_fund) || 0), 0) || 0;

            // Calculate expenses
            const expensesTotal = expenses?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;
            const loansIssued = loanIssued?.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0) || 0;

            // Categorize expenses
            const expenseCategories = {};
            expenses?.forEach(expense => {
                const category = expense.category || 'Other';
                if (!expenseCategories[category]) {
                    expenseCategories[category] = 0;
                }
                expenseCategories[category] += parseFloat(expense.amount) || 0;
            });

            const totalIncome = incomeSavings + incomeRepayments + incomeProcessingFees + incomeFines + incomeSocialFund;
            const totalExpenses = expensesTotal + loansIssued;
            const netProfit = totalIncome - totalExpenses;

            // Cash flow analysis
            const monthlyCashFlow = Array(12).fill(0).map((_, index) => {
                const monthStart = new Date(date.getFullYear(), index, 1);
                const monthEnd = new Date(date.getFullYear(), index + 1, 0);
                
                const monthData = cashFlow?.filter(c => {
                    const recordDate = new Date(c.date_recorded);
                    return recordDate >= monthStart && recordDate <= monthEnd;
                }) || [];
                
                const monthIncome = monthData
                    .filter(c => c.transaction_type === 'income')
                    .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
                
                const monthExpenses = monthData
                    .filter(c => c.transaction_type === 'expense')
                    .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
                
                return monthIncome - monthExpenses;
            });

            setReports(prev => ({
                ...prev,
                financialReport: {
                    income: [
                        { category: 'Member Savings', amount: incomeSavings, percentage: totalIncome > 0 ? (incomeSavings / totalIncome) * 100 : 0 },
                        { category: 'Loan Repayments', amount: incomeRepayments, percentage: totalIncome > 0 ? (incomeRepayments / totalIncome) * 100 : 0 },
                        { category: 'Processing Fees', amount: incomeProcessingFees, percentage: totalIncome > 0 ? (incomeProcessingFees / totalIncome) * 100 : 0 },
                        { category: 'Fines & Penalties', amount: incomeFines, percentage: totalIncome > 0 ? (incomeFines / totalIncome) * 100 : 0 },
                        { category: 'Social Fund', amount: incomeSocialFund, percentage: totalIncome > 0 ? (incomeSocialFund / totalIncome) * 100 : 0 }
                    ],
                    expenses: Object.entries(expenseCategories).map(([category, amount]) => ({
                        category,
                        amount,
                        percentage: expensesTotal > 0 ? (amount / expensesTotal) * 100 : 0
                    })),
                    summary: {
                        totalIncome,
                        totalExpenses,
                        netProfit,
                        savingsGrowth: 0, // Would need historical data
                        loanPortfolioGrowth: 0 // Would need historical data
                    }
                }
            }));

            // Financial chart data
            const financialChartData = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                    {
                        label: 'Monthly Profit',
                        data: monthlyCashFlow,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true
                    }
                ]
            };

            setChartData({ financialChartData });

        } catch (error) {
            console.error('Error loading financial report:', error);
        }
    };

    const loadMemberReport = async () => {
        try {
            const { data: members, error } = await supabase
                .from('members')
                .select(`
                    id, full_name, member_number, phone, date_joined, status,
                    total_shares, social_fund_balance, loan_repayment_rate, performance_score,
                    branch:branches(name),
                    facilitator:users_meta(full_name),
                    loans:member_loans(id, principal, loan_status, remaining_balance)
                `)
                .order('date_joined', { ascending: false });

            if (error) throw error;

            const processedMembers = (members || []).map(member => {
                const activeLoans = member.loans?.filter(l => l.loan_status === 'ACTIVE') || [];
                const totalLoanAmount = activeLoans.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0);
                const totalOutstanding = activeLoans.reduce((sum, l) => sum + (parseFloat(l.remaining_balance) || 0), 0);
                
                return {
                    ...member,
                    activeLoans: activeLoans.length,
                    totalLoanAmount,
                    totalOutstanding,
                    repaymentProgress: totalLoanAmount > 0 ? ((totalLoanAmount - totalOutstanding) / totalLoanAmount) * 100 : 0,
                    membershipDuration: Math.floor((new Date() - new Date(member.date_joined)) / (1000 * 60 * 60 * 24 * 30))
                };
            });

            const totalMembers = processedMembers.length;
            const activeMembers = processedMembers.filter(m => m.status === 'ACTIVE').length;
            const newMembers = processedMembers.filter(m => {
                const joinDate = new Date(m.date_joined);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return joinDate > thirtyDaysAgo;
            }).length;
            
            const membersWithLoans = processedMembers.filter(m => m.activeLoans > 0).length;
            const avgSavings = totalMembers > 0 ? 
                processedMembers.reduce((sum, m) => sum + (parseFloat(m.total_shares) || 0), 0) / totalMembers : 0;
            
            const avgRepaymentRate = totalMembers > 0 ? 
                processedMembers.reduce((sum, m) => sum + (parseFloat(m.loan_repayment_rate) || 0), 0) / totalMembers : 0;

            setReports(prev => ({
                ...prev,
                memberReport: {
                    members: processedMembers,
                    statistics: {
                        totalMembers,
                        activeMembers,
                        newMembers,
                        membersWithLoans,
                        avgSavings,
                        avgRepaymentRate: Math.round(avgRepaymentRate)
                    }
                }
            }));

        } catch (error) {
            console.error('Error loading member report:', error);
        }
    };

    const loadBranchReport = async () => {
        try {
            const { data: branches, error } = await supabase
                .from('branches')
                .select(`
                    id, name, location, opening_date, is_active,
                    manager:users_meta!branches_manager_id_fkey(full_name, phone),
                    members(count),
                    groups(count)
                `)
                .order('name');

            if (error) throw error;

            const branchDetails = await Promise.all(
                (branches || []).map(async (branch) => {
                    try {
                        const { data: branchMembers } = await supabase
                            .from('members')
                            .select('total_shares, loan_repayment_rate')
                            .eq('branch_id', branch.id);
                        
                        const { data: branchLoans } = await supabase
                            .from('member_loans')
                            .select('principal, remaining_balance, loan_status')
                            .eq('member.branch_id', branch.id);
                        
                        const totalSavings = branchMembers?.reduce((sum, m) => sum + (parseFloat(m.total_shares) || 0), 0) || 0;
                        const totalLoans = branchLoans?.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0) || 0;
                        const outstandingLoans = branchLoans?.reduce((sum, l) => sum + (parseFloat(l.remaining_balance) || 0), 0) || 0;
                        const overdueLoans = branchLoans?.filter(l => l.loan_status === 'OVERDUE').length || 0;
                        
                        const avgRepaymentRate = branchMembers?.length > 0 ? 
                            branchMembers.reduce((sum, m) => sum + (parseFloat(m.loan_repayment_rate) || 0), 0) / branchMembers.length : 0;
                        
                        const performanceScore = Math.round(
                            ((totalLoans - outstandingLoans) / Math.max(totalLoans, 1)) * 100 * 0.6 +
                            avgRepaymentRate * 0.4
                        );

                        return {
                            ...branch,
                            totalMembers: branch.members?.[0]?.count || 0,
                            totalGroups: branch.groups?.[0]?.count || 0,
                            totalSavings,
                            totalLoans,
                            outstandingLoans,
                            overdueLoans,
                            performanceScore,
                            cashFlow: totalSavings - outstandingLoans,
                            status: performanceScore >= 80 ? 'Excellent' : performanceScore >= 60 ? 'Good' : 'Needs Improvement'
                        };
                    } catch (err) {
                        console.error(`Error loading branch ${branch.name} details:`, err);
                        return {
                            ...branch,
                            totalMembers: 0,
                            totalGroups: 0,
                            totalSavings: 0,
                            totalLoans: 0,
                            outstandingLoans: 0,
                            overdueLoans: 0,
                            performanceScore: 0,
                            cashFlow: 0,
                            status: 'Inactive'
                        };
                    }
                })
            );

            branchDetails.sort((a, b) => b.performanceScore - a.performanceScore);

            const bestPerforming = branchDetails.length > 0 ? branchDetails[0] : null;
            const worstPerforming = branchDetails.length > 0 ? branchDetails[branchDetails.length - 1] : null;
            const totalCashFlow = branchDetails.reduce((sum, b) => sum + b.cashFlow, 0);
            const avgPerformance = branchDetails.length > 0 ? 
                branchDetails.reduce((sum, b) => sum + b.performanceScore, 0) / branchDetails.length : 0;

            setReports(prev => ({
                ...prev,
                branchReport: {
                    branches: branchDetails,
                    summary: {
                        bestPerforming,
                        worstPerforming,
                        totalCashFlow,
                        avgPerformance: Math.round(avgPerformance)
                    }
                }
            }));

        } catch (error) {
            console.error('Error loading branch report:', error);
        }
    };

    const loadPortfolioReport = async () => {
        // Placeholder for portfolio report
        console.log('Loading portfolio report...');
    };

    const loadComplianceReport = async () => {
        // Placeholder for compliance report
        console.log('Loading compliance report...');
    };

    const toggleRowExpand = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const exportToPDF = async () => {
        try {
            setExportLoading(true);
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${activeReport}_report_${new Date().toISOString().split('T')[0]}.pdf`);
            
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Error exporting to PDF: ' + error.message);
        } finally {
            setExportLoading(false);
        }
    };

    const exportToExcel = () => {
        try {
            let dataToExport = [];
            let fileName = '';
            
            switch (activeReport) {
                case 'loan_book':
                    dataToExport = reports.loanBook.loans.map(loan => ({
                        'Loan Number': loan.loan_number,
                        'Member Name': loan.member?.full_name,
                        'Member Number': loan.member?.member_number,
                        'Principal': loan.principal,
                        'Interest Rate': loan.interest_rate,
                        'Outstanding Balance': loan.outstanding,
                        'Loan Status': loan.loan_status,
                        'Issued Date': loan.issued_date,
                        'Due Date': loan.due_date,
                        'Purpose': loan.purpose,
                        'Branch': loan.branch?.name
                    }));
                    fileName = 'loan_book';
                    break;
                    
                case 'aging_report':
                    dataToExport = reports.agingReport.overdueLoans.map(loan => ({
                        'Loan Number': loan.loan_number,
                        'Member Name': loan.member?.full_name,
                        'Member Number': loan.member?.member_number,
                        'Days Overdue': loan.daysPastDue,
                        'Outstanding Balance': loan.outstanding,
                        'Due Date': loan.due_date,
                        'Branch': loan.branch?.name
                    }));
                    fileName = 'aging_report';
                    break;
                    
                case 'member':
                    dataToExport = reports.memberReport.members.map(member => ({
                        'Member Number': member.member_number,
                        'Full Name': member.full_name,
                        'Phone': member.phone,
                        'Join Date': member.date_joined,
                        'Total Savings': member.total_shares,
                        'Active Loans': member.activeLoans,
                        'Repayment Rate': member.loan_repayment_rate,
                        'Performance Score': member.performance_score,
                        'Branch': member.branch?.name
                    }));
                    fileName = 'member_report';
                    break;
                    
                default:
                    dataToExport = [];
            }

            if (dataToExport.length > 0) {
                const ws = XLSX.utils.json_to_sheet(dataToExport);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Report');
                XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
            } else {
                alert('No data available to export');
            }
            
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Error exporting to Excel: ' + error.message);
        }
    };

    const exportToCSV = () => {
        try {
            let dataToExport = [];
            let fileName = '';
            
            switch (activeReport) {
                case 'loan_book':
                    dataToExport = reports.loanBook.loans;
                    fileName = 'loan_book';
                    break;
                    
                case 'aging_report':
                    dataToExport = reports.agingReport.overdueLoans;
                    fileName = 'aging_report';
                    break;
                    
                case 'member':
                    dataToExport = reports.memberReport.members;
                    fileName = 'member_report';
                    break;
                    
                default:
                    dataToExport = [];
            }

            if (dataToExport.length > 0) {
                const headers = Object.keys(dataToExport[0]).join(',');
                const rows = dataToExport.map(item => 
                    Object.values(item).map(val => 
                        typeof val === 'string' ? `"${val}"` : val
                    ).join(',')
                );
                const csv = [headers, ...rows].join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                alert('No data available to export');
            }
            
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            alert('Error exporting to CSV: ' + error.message);
        }
    };

    const exportToWord = () => {
        try {
            const content = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        h1 { color: #2c3e50; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>${reportTypes.find(r => r.id === activeReport)?.label}</h1>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    <p>Date Range: ${startDate} to ${endDate}</p>
                    
                    <h2>Summary</h2>
                    ${getReportSummaryHTML()}
                    
                    ${getReportDetailsHTML()}
                </body>
                </html>
            `;
            
            const blob = new Blob([content], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Error exporting to Word:', error);
            alert('Error exporting to Word: ' + error.message);
        }
    };

    const getReportSummaryHTML = () => {
        switch (activeReport) {
            case 'loan_book':
                const lb = reports.loanBook.summary;
                return `
                    <table>
                        <tr><td>Total Loans</td><td>${lb.totalLoans}</td></tr>
                        <tr><td>Total Principal</td><td>${formatCurrency(lb.totalPrincipal)}</td></tr>
                        <tr><td>Total Outstanding</td><td>${formatCurrency(lb.totalOutstanding)}</td></tr>
                        <tr><td>Default Rate</td><td>${lb.defaultRate.toFixed(2)}%</td></tr>
                    </table>
                `;
            case 'aging_report':
                const ar = reports.agingReport.summary;
                return `
                    <table>
                        <tr><td>Current Loans</td><td>${ar.current}</td></tr>
                        <tr><td>31-60 Days Overdue</td><td>${ar.days30}</td></tr>
                        <tr><td>61-90 Days Overdue</td><td>${ar.days60}</td></tr>
                        <tr><td>91+ Days Overdue</td><td>${ar.days90 + ar.over90}</td></tr>
                        <tr><td>Total Overdue</td><td>${ar.totalOverdue}</td></tr>
                    </table>
                `;
            default:
                return '<p>No summary available</p>';
        }
    };

    const getReportDetailsHTML = () => {
        switch (activeReport) {
            case 'loan_book':
                if (reports.loanBook.loans.length === 0) return '<p>No loans found</p>';
                return `
                    <h2>Loan Details</h2>
                    <table>
                        <tr>
                            <th>Loan #</th>
                            <th>Member</th>
                            <th>Principal</th>
                            <th>Outstanding</th>
                            <th>Status</th>
                            <th>Issued Date</th>
                        </tr>
                        ${reports.loanBook.loans.map(loan => `
                            <tr>
                                <td>${loan.loan_number}</td>
                                <td>${loan.member?.full_name || 'N/A'}</td>
                                <td>${formatCurrency(loan.principal)}</td>
                                <td>${formatCurrency(loan.outstanding)}</td>
                                <td>${loan.loan_status}</td>
                                <td>${new Date(loan.issued_date).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </table>
                `;
            default:
                return '';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Invalid date';
        }
    };

    const renderReportContent = () => {
        switch (activeReport) {
            case 'loan_book':
                return renderLoanBookReport();
            case 'aging_report':
                return renderAgingReport();
            case 'performance':
                return renderPerformanceReport();
            case 'financial':
                return renderFinancialReport();
            case 'member':
                return renderMemberReport();
            case 'branch':
                return renderBranchReport();
            case 'portfolio':
                return renderPortfolioReport();
            case 'compliance':
                return renderComplianceReport();
            default:
                return <div>Select a report type</div>;
        }
    };

    const renderLoanBookReport = () => {
        const { loans, summary } = reports.loanBook;
        
        return (
            <div className="report-content" ref={reportRef}>
                <div className="report-header">
                    <h2><FileText size={24} /> Loan Book Report</h2>
                    <div className="report-summary-cards">
                        <div className="summary-card">
                            <div className="summary-icon">
                                <CreditCard size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.totalLoans}</h3>
                                <p>Total Loans</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <DollarSign size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{formatCurrency(summary.totalPrincipal)}</h3>
                                <p>Total Principal</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <TrendingDown size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{formatCurrency(summary.totalOutstanding)}</h3>
                                <p>Total Outstanding</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <Percent size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.defaultRate.toFixed(2)}%</h3>
                                <p>Default Rate</p>
                            </div>
                        </div>
                    </div>
                </div>

                {chartData.statusDistribution && (
                    <div className="chart-section">
                        <h3>Loan Status Distribution</h3>
                        <div className="chart-container">
                            <Pie 
                                data={chartData.statusDistribution}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: 'bottom' },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => {
                                                    const label = context.label || '';
                                                    const value = context.raw || 0;
                                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                    const percentage = Math.round((value / total) * 100);
                                                    return `${label}: ${value} (${percentage}%)`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="data-table-section">
                    <h3>Loan Details</h3>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Loan #</th>
                                    <th>Member</th>
                                    <th>Member #</th>
                                    <th>Principal</th>
                                    <th>Outstanding</th>
                                    <th>Interest Rate</th>
                                    <th>Status</th>
                                    <th>Issued Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loans.length > 0 ? (
                                    loans.map(loan => (
                                        <>
                                            <tr key={loan.id}>
                                                <td>{loan.loan_number}</td>
                                                <td>
                                                    <div className="member-info">
                                                        <strong>{loan.member?.full_name || 'N/A'}</strong>
                                                        <small>{loan.member?.phone || 'No phone'}</small>
                                                    </div>
                                                </td>
                                                <td>{loan.member?.member_number || 'N/A'}</td>
                                                <td>{formatCurrency(loan.principal)}</td>
                                                <td className={loan.outstanding > 0 ? 'danger' : 'success'}>
                                                    {formatCurrency(loan.outstanding)}
                                                </td>
                                                <td>{loan.interest_rate}%</td>
                                                <td>
                                                    <span className={`status-badge ${loan.loan_status?.toLowerCase()}`}>
                                                        {loan.loan_status}
                                                    </span>
                                                </td>
                                                <td>{formatDate(loan.issued_date)}</td>
                                                <td>
                                                    <button 
                                                        className="btn-icon"
                                                        onClick={() => toggleRowExpand(loan.id)}
                                                        title="View Details"
                                                    >
                                                        {expandedRows[loan.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRows[loan.id] && (
                                                <tr className="expanded-row">
                                                    <td colSpan="9">
                                                        <div className="loan-details">
                                                            <div className="detail-section">
                                                                <h4>Loan Information</h4>
                                                                <div className="detail-grid">
                                                                    <div className="detail-item">
                                                                        <span>Purpose</span>
                                                                        <strong>{loan.purpose || 'Not specified'}</strong>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <span>Due Date</span>
                                                                        <strong>{formatDate(loan.due_date)}</strong>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <span>Processing Fee</span>
                                                                        <strong>{formatCurrency(loan.processing_fee)}</strong>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <span>Branch</span>
                                                                        <strong>{loan.branch?.name || 'N/A'}</strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="detail-section">
                                                                <h4>Repayment Summary</h4>
                                                                <div className="detail-grid">
                                                                    <div className="detail-item">
                                                                        <span>Total Paid</span>
                                                                        <strong className="success">{formatCurrency(loan.totalPaid)}</strong>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <span>Repayment Rate</span>
                                                                        <strong>{loan.repaymentRate}%</strong>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <span>Days Overdue</span>
                                                                        <strong className={loan.daysOverdue > 0 ? 'danger' : 'success'}>
                                                                            {loan.daysOverdue}
                                                                        </strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="no-data">
                                            <FileText size={32} />
                                            <p>No loans found for the selected criteria</p>
                                            <small>Try adjusting your filters</small>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderAgingReport = () => {
        const { categories, overdueLoans, summary } = reports.agingReport;
        
        return (
            <div className="report-content" ref={reportRef}>
                <div className="report-header">
                    <h2><Clock size={24} /> Aging Report</h2>
                    <div className="report-summary-cards">
                        <div className="summary-card">
                            <div className="summary-icon">
                                <CheckCircle size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.current}</h3>
                                <p>Current Loans</p>
                            </div>
                        </div>
                        <div className="summary-card warning">
                            <div className="summary-icon">
                                <AlertCircle size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.days30}</h3>
                                <p>31-60 Days</p>
                            </div>
                        </div>
                        <div className="summary-card danger">
                            <div className="summary-icon">
                                <AlertCircle size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.days60 + summary.days90 + summary.over90}</h3>
                                <p>61+ Days</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <CreditCard size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.totalOverdue}</h3>
                                <p>Total Overdue</p>
                            </div>
                        </div>
                    </div>
                </div>

                {chartData.agingData && (
                    <div className="chart-section">
                        <h3>Aging Distribution</h3>
                        <div className="chart-container">
                            <Bar 
                                data={chartData.agingData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => `${context.raw} loans`
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: { stepSize: 1 }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="aging-categories">
                    <h3>Aging Categories</h3>
                    <div className="categories-grid">
                        {categories.map((category, index) => (
                            <div key={index} className="category-card">
                                <div className="category-header">
                                    <h4>{category.name}</h4>
                                    <span className="loan-count">{category.count} loans</span>
                                </div>
                                <div className="category-body">
                                    <div className="category-amount">
                                        {formatCurrency(category.amount)}
                                    </div>
                                    <div className="category-loans">
                                        {category.loans.slice(0, 3).map(loan => (
                                            <div key={loan.id} className="loan-item">
                                                <span>{loan.member?.full_name}</span>
                                                <strong>{formatCurrency(loan.outstanding)}</strong>
                                            </div>
                                        ))}
                                        {category.loans.length > 3 && (
                                            <div className="more-loans">
                                                + {category.loans.length - 3} more loans
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overdue-loans-section">
                    <h3>Overdue Loans Detail</h3>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Loan #</th>
                                    <th>Member</th>
                                    <th>Days Overdue</th>
                                    <th>Outstanding</th>
                                    <th>Due Date</th>
                                    <th>Branch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overdueLoans.length > 0 ? (
                                    overdueLoans.map(loan => (
                                        <tr key={loan.id}>
                                            <td>{loan.loan_number}</td>
                                            <td>{loan.member?.full_name}</td>
                                            <td className="danger">{loan.daysPastDue}</td>
                                            <td>{formatCurrency(loan.outstanding)}</td>
                                            <td>{formatDate(loan.due_date)}</td>
                                            <td>{loan.branch?.name}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data">
                                            <CheckCircle size={32} />
                                            <p>No overdue loans found</p>
                                            <small>Great job on collections!</small>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderPerformanceReport = () => {
        const { branches, facilitators, summary } = reports.performanceReport;
        
        return (
            <div className="report-content" ref={reportRef}>
                <div className="report-header">
                    <h2><BarChart3 size={24} /> Performance Report</h2>
                    <div className="report-summary-cards">
                        <div className="summary-card">
                            <div className="summary-icon">
                                <Award size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.overallPerformance}/100</h3>
                                <p>Overall Performance</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <Users size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.memberGrowth}%</h3>
                                <p>Member Growth</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <DollarSign size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{formatCurrency(summary.savingsGrowth)}</h3>
                                <p>Total Savings</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <Percent size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.repaymentRate}%</h3>
                                <p>Avg. Repayment Rate</p>
                            </div>
                        </div>
                    </div>
                </div>

                {chartData.branchChartData && (
                    <div className="chart-section">
                        <h3>Branch Performance Comparison</h3>
                        <div className="chart-container">
                            <Bar 
                                data={chartData.branchChartData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => `Score: ${context.raw}`
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: 100,
                                            ticks: { stepSize: 20 }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="performance-tables">
                    <div className="table-section">
                        <h3>Branch Performance</h3>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Branch</th>
                                        <th>Members</th>
                                        <th>Savings</th>
                                        <th>Loans</th>
                                        <th>Repayment Rate</th>
                                        <th>Performance</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branches.map(branch => (
                                        <tr key={branch.id}>
                                            <td>
                                                <div className="branch-info">
                                                    <strong>{branch.name}</strong>
                                                    <small>{branch.location}</small>
                                                </div>
                                            </td>
                                            <td>{branch.totalMembers}</td>
                                            <td>{formatCurrency(branch.totalSavings)}</td>
                                            <td>{branch.activeLoans}</td>
                                            <td>{branch.repaymentRate}%</td>
                                            <td>
                                                <div className="performance-score">
                                                    <div className="score-bar">
                                                        <div 
                                                            className="score-fill"
                                                            style={{ width: `${branch.performanceScore}%` }}
                                                        />
                                                    </div>
                                                    <span>{branch.performanceScore}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${branch.status?.toLowerCase().replace(' ', '-')}`}>
                                                    {branch.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="table-section">
                        <h3>Facilitator Performance</h3>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Facilitator</th>
                                        <th>Members</th>
                                        <th>New Members</th>
                                        <th>Savings</th>
                                        <th>Repayment Rate</th>
                                        <th>Performance</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facilitators.map(facilitator => (
                                        <tr key={facilitator.id}>
                                            <td>{facilitator.full_name}</td>
                                            <td>{facilitator.totalMembers}</td>
                                            <td>{facilitator.newMembers}</td>
                                            <td>{formatCurrency(facilitator.totalSavings)}</td>
                                            <td>{facilitator.repaymentRate}%</td>
                                            <td>
                                                <div className="performance-score">
                                                    <div className="score-bar">
                                                        <div 
                                                            className="score-fill"
                                                            style={{ width: `${facilitator.performanceScore}%` }}
                                                        />
                                                    </div>
                                                    <span>{facilitator.performanceScore}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${facilitator.status?.toLowerCase().replace(' ', '-')}`}>
                                                    {facilitator.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFinancialReport = () => {
        const { income, expenses, summary } = reports.financialReport;
        
        return (
            <div className="report-content" ref={reportRef}>
                <div className="report-header">
                    <h2><DollarSign size={24} /> Financial Report</h2>
                    <div className="report-summary-cards">
                        <div className="summary-card success">
                            <div className="summary-icon">
                                <TrendingUpIcon size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{formatCurrency(summary.totalIncome)}</h3>
                                <p>Total Income</p>
                            </div>
                        </div>
                        <div className="summary-card danger">
                            <div className="summary-icon">
                                <TrendingDownIcon size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{formatCurrency(summary.totalExpenses)}</h3>
                                <p>Total Expenses</p>
                            </div>
                        </div>
                        <div className={`summary-card ${summary.netProfit >= 0 ? 'success' : 'danger'}`}>
                            <div className="summary-icon">
                                {summary.netProfit >= 0 ? <TrendingUpIcon size={20} /> : <TrendingDownIcon size={20} />}
                            </div>
                            <div className="summary-info">
                                <h3>{formatCurrency(summary.netProfit)}</h3>
                                <p>Net Profit</p>
                            </div>
                        </div>
                    </div>
                </div>

                {chartData.financialChartData && (
                    <div className="chart-section">
                        <h3>Monthly Profit Trend</h3>
                        <div className="chart-container">
                            <Line 
                                data={chartData.financialChartData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: 'top' },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => `${formatCurrency(context.raw)}`
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            ticks: {
                                                callback: (value) => formatCurrency(value)
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="financial-breakdown">
                    <div className="breakdown-section">
                        <h3>Income Breakdown</h3>
                        <div className="breakdown-cards">
                            {income.map((item, index) => (
                                <div key={index} className="breakdown-card">
                                    <div className="breakdown-header">
                                        <h4>{item.category}</h4>
                                        <span className="percentage">{item.percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="breakdown-amount">
                                        {formatCurrency(item.amount)}
                                    </div>
                                    <div className="breakdown-bar">
                                        <div 
                                            className="bar-fill"
                                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="breakdown-section">
                        <h3>Expense Breakdown</h3>
                        <div className="breakdown-cards">
                            {expenses.map((item, index) => (
                                <div key={index} className="breakdown-card">
                                    <div className="breakdown-header">
                                        <h4>{item.category}</h4>
                                        <span className="percentage">{item.percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="breakdown-amount">
                                        {formatCurrency(item.amount)}
                                    </div>
                                    <div className="breakdown-bar">
                                        <div 
                                            className="bar-fill danger"
                                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderMemberReport = () => {
        const { members, statistics } = reports.memberReport;
        
        return (
            <div className="report-content" ref={reportRef}>
                <div className="report-header">
                    <h2><Users size={24} /> Member Report</h2>
                    <div className="report-summary-cards">
                        <div className="summary-card">
                            <div className="summary-icon">
                                <Users size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{statistics.totalMembers}</h3>
                                <p>Total Members</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <CheckCircle size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{statistics.activeMembers}</h3>
                                <p>Active Members</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <UserPlus size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{statistics.newMembers}</h3>
                                <p>New Members</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <CreditCard size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{statistics.membersWithLoans}</h3>
                                <p>With Loans</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="member-statistics">
                    <div className="stat-grid">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <DollarSign size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>{formatCurrency(statistics.avgSavings)}</h3>
                                <p>Average Savings</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <Percent size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>{statistics.avgRepaymentRate}%</h3>
                                <p>Avg. Repayment Rate</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="member-list-section">
                    <h3>Member Details</h3>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Member #</th>
                                    <th>Full Name</th>
                                    <th>Phone</th>
                                    <th>Join Date</th>
                                    <th>Total Savings</th>
                                    <th>Active Loans</th>
                                    <th>Repayment Rate</th>
                                    <th>Performance</th>
                                    <th>Branch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(member => (
                                    <tr key={member.id}>
                                        <td>{member.member_number}</td>
                                        <td>
                                            <div className="member-info">
                                                <strong>{member.full_name}</strong>
                                                <small>{member.phone}</small>
                                            </div>
                                        </td>
                                        <td>{member.phone}</td>
                                        <td>{formatDate(member.date_joined)}</td>
                                        <td className="success">{formatCurrency(member.total_shares)}</td>
                                        <td>{member.activeLoans}</td>
                                        <td>
                                            <div className="repayment-rate">
                                                <div className="rate-bar">
                                                    <div 
                                                        className="rate-fill"
                                                        style={{ width: `${member.loan_repayment_rate}%` }}
                                                    />
                                                </div>
                                                <span>{member.loan_repayment_rate}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="performance-score">
                                                <div className="score-bar">
                                                    <div 
                                                        className="score-fill"
                                                        style={{ width: `${member.performance_score}%` }}
                                                    />
                                                </div>
                                                <span>{member.performance_score}</span>
                                            </div>
                                        </td>
                                        <td>{member.branch?.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderBranchReport = () => {
        const { branches, summary } = reports.branchReport;
        
        return (
            <div className="report-content" ref={reportRef}>
                <div className="report-header">
                    <h2><Building2 size={24} /> Branch Report</h2>
                    <div className="report-summary-cards">
                        <div className="summary-card">
                            <div className="summary-icon">
                                <Award size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.bestPerforming?.name || 'N/A'}</h3>
                                <p>Best Performing</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <Target size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{summary.avgPerformance}/100</h3>
                                <p>Avg. Performance</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon">
                                <DollarSign size={20} />
                            </div>
                            <div className="summary-info">
                                <h3>{formatCurrency(summary.totalCashFlow)}</h3>
                                <p>Total Cash Flow</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="branch-comparison">
                    <h3>Branch Performance Comparison</h3>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Branch</th>
                                    <th>Manager</th>
                                    <th>Members</th>
                                    <th>Groups</th>
                                    <th>Total Savings</th>
                                    <th>Total Loans</th>
                                    <th>Outstanding</th>
                                    <th>Cash Flow</th>
                                    <th>Performance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branches.map(branch => (
                                    <tr key={branch.id}>
                                        <td>
                                            <div className="branch-info">
                                                <strong>{branch.name}</strong>
                                                <small>{branch.location}</small>
                                            </div>
                                        </td>
                                        <td>{branch.manager?.full_name || 'N/A'}</td>
                                        <td>{branch.totalMembers}</td>
                                        <td>{branch.totalGroups}</td>
                                        <td className="success">{formatCurrency(branch.totalSavings)}</td>
                                        <td>{formatCurrency(branch.totalLoans)}</td>
                                        <td className="warning">{formatCurrency(branch.outstandingLoans)}</td>
                                        <td className={branch.cashFlow >= 0 ? 'success' : 'danger'}>
                                            {formatCurrency(branch.cashFlow)}
                                        </td>
                                        <td>
                                            <div className="performance-score">
                                                <div className="score-bar">
                                                    <div 
                                                        className="score-fill"
                                                        style={{ width: `${branch.performanceScore}%` }}
                                                    />
                                                </div>
                                                <span>{branch.performanceScore}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${branch.status?.toLowerCase().replace(' ', '-')}`}>
                                                {branch.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderPortfolioReport = () => {
        return (
            <div className="report-content" ref={reportRef}>
                <div className="report-header">
                    <h2><Briefcase size={24} /> Portfolio Report</h2>
                    <p className="coming-soon">Coming Soon - This report is under development</p>
                </div>
            </div>
        );
    };

    const renderComplianceReport = () => {
        return (
            <div className="report-content" ref={reportRef}>
                <div className="report-header">
                    <h2><Shield size={24} /> Compliance Report</h2>
                    <p className="coming-soon">Coming Soon - This report is under development</p>
                </div>
            </div>
        );
    };

    return (
        <div className="reports-container">
            {/* Header */}
            <div className="page-header">
                <h1><FileText size={28} /> Reports & Analytics</h1>
                <p>Generate comprehensive reports for SACCO management and decision making</p>
            </div>

            {/* Controls Section */}
            <div className="controls-section">
                <div className="report-type-selector">
                    <div className="report-tabs">
                        {reportTypes.map(report => (
                            <button
                                key={report.id}
                                className={`report-tab ${activeReport === report.id ? 'active' : ''}`}
                                onClick={() => setActiveReport(report.id)}
                                disabled={loading}
                            >
                                <span className="tab-icon">{report.icon}</span>
                                <span className="tab-label">{report.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="report-controls">
                    <div className="date-range-controls">
                        <div className="date-range-selector">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="form-select"
                                disabled={loading}
                            >
                                <option value="month">This Month</option>
                                <option value="quarter">Last Quarter</option>
                                <option value="year">This Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        
                        {dateRange === 'custom' && (
                            <div className="custom-date-range">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="form-control"
                                    disabled={loading}
                                />
                                <span>to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="form-control"
                                    disabled={loading}
                                />
                            </div>
                        )}
                        
                        <div className="branch-filter">
                            <select
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                className="form-select"
                                disabled={loading}
                            >
                                <option value="all">All Branches</option>
                                {allBranches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <button 
                            className="btn btn-primary" 
                            onClick={loadReportData}
                            disabled={loading}
                        >
                            <RefreshCw size={18} /> {loading ? 'Loading...' : 'Generate Report'}
                        </button>
                    </div>

                    <div className="export-controls">
                        <div className="export-buttons">
                            <button 
                                className="btn btn-secondary"
                                onClick={exportToPDF}
                                disabled={exportLoading || loading}
                                title="Export to PDF"
                            >
                                <File size={18} /> PDF
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={exportToExcel}
                                disabled={exportLoading || loading}
                                title="Export to Excel"
                            >
                                <FileSpreadsheet size={18} /> Excel
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={exportToCSV}
                                disabled={exportLoading || loading}
                                title="Export to CSV"
                            >
                                <FileType size={18} /> CSV
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={exportToWord}
                                disabled={exportLoading || loading}
                                title="Export to Word"
                            >
                                <FileText size={18} /> Word
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => window.print()}
                                disabled={exportLoading || loading}
                                title="Print Report"
                            >
                                <Printer size={18} /> Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <div className="report-main-content">
                {loading ? (
                    <div className="loading-indicator">
                        <RefreshCw className="loading-spinner" size={32} />
                        <p>Generating report...</p>
                    </div>
                ) : (
                    renderReportContent()
                )}
            </div>
        </div>
    );
}