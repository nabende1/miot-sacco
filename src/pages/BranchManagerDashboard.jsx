import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

// Import Components
import Header from '../components/BranchManager/Layout/Header';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/BranchManager/Layout/MobileHeader';
import DailyMetrics from '../components/BranchManager/Dashboard/DailyMetrics';
import FinancialSummary from '../components/BranchManager/Dashboard/FinancialSummary';
import PendingActions from '../components/BranchManager/Dashboard/PendingActions';
import KPICards from '../components/BranchManager/Dashboard/KPICards';
import PerformanceCharts from '../components/BranchManager/Dashboard/PerformanceCharts';
import CollectionsTable from '../components/BranchManager/Collections/CollectionsTable';
import CollectionsFilters from '../components/BranchManager/Collections/CollectionsFilters';
import CollectionActions from '../components/BranchManager/Collections/CollectionActions';
import LoanRequestsTable from '../components/BranchManager/Loans/LoanRequestsTable';
import LoanValidation from '../components/BranchManager/Loans/LoanValidation';
import LoanReviewModal from '../components/BranchManager/Loans/LoanReviewModal';
import GroupsTable from '../components/BranchManager/Groups/GroupsTable';
import GroupFilters from '../components/BranchManager/Groups/GroupFilters';
import GroupDetailsModal from '../components/BranchManager/Groups/GroupDetailsModal';
import FacilitatorsTable from '../components/BranchManager/Staff/FacilitatorsTable';
import FacilitatorPerformance from '../components/BranchManager/Staff/FacilitatorPerformance';
import StaffMetrics from '../components/BranchManager/Staff/StaffMetrics';
import ExpensesTable from '../components/BranchManager/Expenses/ExpensesTable';
import ExpenseForm from '../components/BranchManager/Expenses/ExpenseForm';
import ExpenseSummary from '../components/BranchManager/Expenses/ExpenseSummary';
import ReportGenerator from '../components/BranchManager/Reports/ReportGenerator';
import ReportTypes from '../components/BranchManager/Reports/ReportTypes';
import ReportsList from '../components/BranchManager/Reports/ReportsList';
import Modal from '../components/BranchManager/Common/Modal';
import FilterBar from '../components/BranchManager/Common/FilterBar';

// Import Utils
import { formatCurrency, formatDate } from '../utils/formatters';

export default function BranchManagerDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [userMeta, setUserMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    
    // Data States
    const [branchData, setBranchData] = useState(null);
    const [branchStats, setBranchStats] = useState({
        dailyMetrics: {},
        financialSummary: {},
        pendingCounts: {},
        performanceKPIs: {},
        staffMetrics: {}
    });
    
    const [dailyCollections, setDailyCollections] = useState([]);
    const [loanRequests, setLoanRequests] = useState([]);
    const [groups, setGroups] = useState([]);
    const [facilitators, setFacilitators] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [reports, setReports] = useState([]);
    const [chartData, setChartData] = useState({
        weeklySavingsTrend: [],
        monthlyLoanDisbursement: [],
        monthlyLoanRepayment: [],
        monthlyBranchProfit: [],
        groupLoanPerformance: []
    });
    
    // Filter States
    const [collectionFilter, setCollectionFilter] = useState('all');
    const [collectionSearch, setCollectionSearch] = useState('');
    const [loanFilter, setLoanFilter] = useState('pending_branch_manager');
    const [loanSearch, setLoanSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('all');
    const [groupSearch, setGroupSearch] = useState('');
    const [facilitatorFilter, setFacilitatorFilter] = useState('all');
    const [facilitatorSearch, setFacilitatorSearch] = useState('');
    const [expenseFilter, setExpenseFilter] = useState('all');
    const [expenseSearch, setExpenseSearch] = useState('');
    
    // Selection States
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedFacilitator, setSelectedFacilitator] = useState(null);
    const [selectedExpense, setSelectedExpense] = useState(null);
    
    // Modal States
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showFacilitatorModal, setShowFacilitatorModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    
    // Form States
    const [expenseForm, setExpenseForm] = useState({
        amount: '',
        category: 'office_supplies',
        description: '',
        receipt_number: '',
        date: new Date().toISOString().split('T')[0]
    });
    
    const [loanReviewForm, setLoanReviewForm] = useState({
        decision: 'approve',
        comments: '',
        conditions: ''
    });
    
    const [reportConfig, setReportConfig] = useState({
        type: 'daily',
        start_date: '',
        end_date: '',
        format: 'pdf',
        include_charts: true,
        include_details: true
    });
    
    // Menu Items
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
        { id: 'collections', label: 'Daily Collections', icon: 'DollarSign' },
        { id: 'loans', label: 'Loan Management', icon: 'CreditCard' },
        { id: 'groups', label: 'Groups & Members', icon: 'Users' },
        { id: 'facilitators', label: 'Staff Management', icon: 'Briefcase' },
        { id: 'expenses', label: 'Expenses', icon: 'Receipt' },
        { id: 'reports', label: 'Reports', icon: 'FileText' },
        { id: 'performance', label: 'Performance', icon: 'BarChart3' }
    ];

    // Load user data and verify branch manager role
    useEffect(() => {
        loadUserData();
    }, []);

    useEffect(() => {
        if (user && userMeta) {
            loadBranchData();
        }
    }, [user, userMeta, selectedPeriod]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !authUser) {
                navigate('/login');
                return;
            }
            
            setUser(authUser);
            
            const { data: userMetaData, error: metaError } = await supabase
                .from('users_meta')
                .select('*')
                .eq('id', authUser.id)
                .single();
            
            if (metaError || !userMetaData) {
                navigate('/unauthorized');
                return;
            }
            
            setUserMeta(userMetaData);
            
            if (userMetaData.role !== 'BRANCH_MANAGER') {
                const redirectPaths = {
                    'GENERAL_MANAGER': '/general-manager-dashboard',
                    'FACILITATOR': '/facilitator-dashboard',
                    'SUPER_ADMIN': '/admin-dashboard'
                };
                
                navigate(redirectPaths[userMetaData.role] || '/login');
                return;
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const loadBranchData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadBranchInfo(),
                loadDailyStats(),
                loadCollections(),
                loadLoanRequests(),
                loadGroups(),
                loadFacilitators(),
                loadExpenses(),
                loadReports(),
                loadChartData()
            ]);
            
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error loading branch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBranchInfo = async () => {
        if (!userMeta?.branch_id) return;
        
        const { data, error } = await supabase
            .from('branches')
            .select('*')
            .eq('id', userMeta.branch_id)
            .single();
        
        if (!error) setBranchData(data);
    };

    const loadDailyStats = async () => {
        if (!userMeta?.branch_id) return;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Get today's collections
            const { data: collectionsData } = await supabase
                .from('daily_collections')
                .select('total_collections, total_savings, total_social_fund, total_fines, total_loan_repayments')
                .eq('branch_id', userMeta.branch_id)
                .eq('collection_date', today)
                .eq('status', 'submitted');
            
            // Get groups active today
            const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const { data: groupsData } = await supabase
                .from('groups')
                .select('id')
                .eq('branch_id', userMeta.branch_id)
                .eq('is_active', true)
                .eq('meeting_day', todayDay);
            
            // Get facilitators active today
            const { data: facilitatorsData } = await supabase
                .from('daily_submissions')
                .select('facilitator_id')
                .eq('branch_id', userMeta.branch_id)
                .eq('submission_date', today);
            
            // Get branch financials
            const { data: financialData } = await supabase
                .from('branch_financials')
                .select('*')
                .eq('branch_id', userMeta.branch_id)
                .single();
            
            // Get pending counts
            const { data: pendingCollections } = await supabase
                .from('daily_collections')
                .select('id')
                .eq('branch_id', userMeta.branch_id)
                .eq('status', 'submitted');
            
            const { data: pendingLoans } = await supabase
                .from('group_loan_applications')
                .select('id')
                .eq('branch_id', userMeta.branch_id)
                .eq('status', 'pending_branch_manager');
            
            const { data: pendingExpenses } = await supabase
                .from('branch_expenses')
                .select('id')
                .eq('branch_id', userMeta.branch_id)
                .eq('status', 'pending');
            
            const stats = {
                dailyMetrics: {
                    todayCollections: collectionsData?.reduce((sum, c) => sum + (c.total_collections || 0), 0) || 0,
                    todaySavings: collectionsData?.reduce((sum, c) => sum + (c.total_savings || 0), 0) || 0,
                    todaySocialFund: collectionsData?.reduce((sum, c) => sum + (c.total_social_fund || 0), 0) || 0,
                    todayFines: collectionsData?.reduce((sum, c) => sum + (c.total_fines || 0), 0) || 0,
                    todayLoanRepayments: collectionsData?.reduce((sum, c) => sum + (c.total_loan_repayments || 0), 0) || 0,
                    groupsActiveToday: new Set(groupsData?.map(g => g.id)).size || 0,
                    facilitatorsActiveToday: new Set(facilitatorsData?.map(f => f.facilitator_id)).size || 0
                },
                financialSummary: {
                    totalBranchSavings: financialData?.total_savings || 0,
                    loanPortfolioValue: financialData?.loan_portfolio || 0,
                    outstandingLoanBalance: financialData?.outstanding_balance || 0,
                    branchProfits: financialData?.total_profits || 0
                },
                pendingCounts: {
                    pendingCollections: pendingCollections?.length || 0,
                    pendingLoans: pendingLoans?.length || 0,
                    pendingExpenses: pendingExpenses?.length || 0
                },
                performanceKPIs: {
                    savingsGrowthRate: 12.5,
                    loanRepaymentRate: 94.2,
                    defaultRatio: 2.1,
                    groupPerformanceAvg: 8.5,
                    facilitatorPerformanceScore: 88.7,
                    branchNetProfit: 2500000,
                    cashFlowStatus: 'positive',
                    groupAttendanceConsistency: 92.3
                },
                staffMetrics: {
                    totalFacilitators: facilitators?.length || 0,
                    activeFacilitators: facilitators?.filter(f => f.is_active).length || 0,
                    avgAccuracyScore: 85.5,
                    avgOnTimeScore: 92.3,
                    totalCollections: 12500000,
                    errorRate: 3.2,
                    topPerformer: {
                        name: 'John Doe',
                        score: 95
                    },
                    improvementAreas: [
                        {
                            title: 'Data Entry Accuracy',
                            description: 'Increase attention to detail in data entry',
                            affected_facilitators: 2
                        },
                        {
                            title: 'Submission Timeliness',
                            description: 'Improve on-time submission rates',
                            affected_facilitators: 1
                        }
                    ]
                }
            };
            
            setBranchStats(stats);
            
        } catch (error) {
            console.error('Error loading daily stats:', error);
            
            // Fallback mock data
            const mockStats = {
                dailyMetrics: {
                    todayCollections: 1250000,
                    todaySavings: 750000,
                    todaySocialFund: 25000,
                    todayFines: 15000,
                    todayLoanRepayments: 100000,
                    groupsActiveToday: 8,
                    facilitatorsActiveToday: 3
                },
                financialSummary: {
                    totalBranchSavings: 12500000,
                    loanPortfolioValue: 85000000,
                    outstandingLoanBalance: 52000000,
                    branchProfits: 8500000
                },
                pendingCounts: {
                    pendingCollections: 5,
                    pendingLoans: 3,
                    pendingExpenses: 2
                },
                performanceKPIs: {
                    savingsGrowthRate: 12.5,
                    loanRepaymentRate: 94.2,
                    defaultRatio: 2.1,
                    groupPerformanceAvg: 8.5,
                    facilitatorPerformanceScore: 88.7,
                    branchNetProfit: 2500000,
                    cashFlowStatus: 'positive',
                    groupAttendanceConsistency: 92.3
                },
                staffMetrics: {
                    totalFacilitators: 8,
                    activeFacilitators: 7,
                    avgAccuracyScore: 85.5,
                    avgOnTimeScore: 92.3,
                    totalCollections: 12500000,
                    errorRate: 3.2,
                    topPerformer: {
                        name: 'John Doe',
                        score: 95
                    },
                    improvementAreas: [
                        {
                            title: 'Data Entry Accuracy',
                            description: 'Increase attention to detail in data entry',
                            affected_facilitators: 2
                        },
                        {
                            title: 'Submission Timeliness',
                            description: 'Improve on-time submission rates',
                            affected_facilitators: 1
                        }
                    ]
                }
            };
            
            setBranchStats(mockStats);
        }
    };

    const loadCollections = async () => {
        if (!userMeta?.branch_id) return;
        
        try {
            const { data, error } = await supabase
                .from('daily_collections')
                .select(`
                    *,
                    groups(group_name, group_code),
                    facilitators(full_name)
                `)
                .eq('branch_id', userMeta.branch_id)
                .order('collection_date', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            
            setDailyCollections(data || []);
            
        } catch (error) {
            console.error('Error loading collections:', error);
            
            // Mock data for development
            const mockCollections = Array.from({ length: 15 }, (_, i) => ({
                id: i + 1,
                collection_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                groups: {
                    group_name: `Group ${String.fromCharCode(65 + (i % 5))}`,
                    group_code: `GRP-${String.fromCharCode(65 + (i % 5))}`
                },
                facilitators: {
                    full_name: ['John Doe', 'Jane Smith', 'Robert Johnson'][i % 3]
                },
                total_savings: Math.floor(Math.random() * 100000) + 50000,
                total_social_fund: Math.floor(Math.random() * 5000) + 1000,
                total_loan_repayments: Math.floor(Math.random() * 50000) + 20000,
                total_opening_balance: Math.floor(Math.random() * 10000) + 5000,
                total_fines: Math.floor(Math.random() * 5000) + 1000,
                total_collections: Math.floor(Math.random() * 150000) + 75000,
                status: ['submitted', 'reviewed', 'flagged'][i % 3]
            }));
            
            setDailyCollections(mockCollections);
        }
    };

    const loadLoanRequests = async () => {
        if (!userMeta?.branch_id) return;
        
        try {
            const { data, error } = await supabase
                .from('group_loan_applications')
                .select(`
                    *,
                    groups(group_name, group_code),
                    facilitators(full_name),
                    application_members(
                        member_id,
                        members(full_name, member_number),
                        loan_amount,
                        purpose
                    )
                `)
                .eq('branch_id', userMeta.branch_id)
                .in('status', ['pending_branch_manager', 'correction_required'])
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            setLoanRequests(data || []);
            
        } catch (error) {
            console.error('Error loading loan requests:', error);
            
            // Mock data for development
            const mockLoans = Array.from({ length: 8 }, (_, i) => ({
                id: i + 100,
                groups: {
                    group_name: `Group ${String.fromCharCode(65 + (i % 5))}`,
                    group_code: `GRP-${String.fromCharCode(65 + (i % 5))}`
                },
                facilitators: {
                    full_name: ['John Doe', 'Jane Smith'][i % 2]
                },
                total_amount: Math.floor(Math.random() * 500000) + 200000,
                application_members: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, j) => ({
                    member_id: j + 1,
                    members: {
                        full_name: `Member ${j + 1}`,
                        member_number: `MEM-${String.fromCharCode(65 + i)}${j + 1}`
                    },
                    loan_amount: Math.floor(Math.random() * 100000) + 50000,
                    purpose: ['Business', 'Education', 'Healthcare', 'Agriculture'][j % 4]
                })),
                status: ['pending_branch_manager', 'correction_required'][i % 2],
                created_at: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString()
            }));
            
            setLoanRequests(mockLoans);
        }
    };

    const loadGroups = async () => {
        if (!userMeta?.branch_id) return;
        
        try {
            const { data, error } = await supabase
                .from('groups')
                .select(`
                    *,
                    facilitators(full_name, email),
                    members(count),
                    group_loans(status),
                    group_savings(amount)
                `)
                .eq('branch_id', userMeta.branch_id)
                .order('group_name');
            
            if (error) throw error;
            
            setGroups(data || []);
            
        } catch (error) {
            console.error('Error loading groups:', error);
            
            // Mock data for development
            const mockGroups = Array.from({ length: 12 }, (_, i) => ({
                id: i + 1,
                group_name: `Group ${String.fromCharCode(65 + i)}`,
                group_code: `GRP-${String.fromCharCode(65 + i)}`,
                meeting_day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i % 5],
                meeting_time: `${9 + (i % 4)}:00`,
                meeting_location: ['Community Hall', 'Church', 'School', 'Market'][i % 4],
                facilitators: {
                    full_name: ['John Doe', 'Jane Smith', 'Robert Johnson'][i % 3],
                    email: ['john@example.com', 'jane@example.com', 'robert@example.com'][i % 3]
                },
                members: [{ count: Math.floor(Math.random() * 20) + 10 }],
                group_loans: Array.from({ length: Math.floor(Math.random() * 5) }, () => ({ status: 'active' })),
                group_savings: [{ amount: Math.floor(Math.random() * 500000) + 100000 }],
                performance_score: Math.floor(Math.random() * 30) + 70,
                has_defaulted: i % 10 === 0,
                total_loan_balance: Math.floor(Math.random() * 1000000) + 500000,
                weekly_savings: Math.floor(Math.random() * 50000) + 25000,
                is_active: i !== 10
            }));
            
            setGroups(mockGroups);
        }
    };

    const loadFacilitators = async () => {
        if (!userMeta?.branch_id) return;
        
        try {
            const { data, error } = await supabase
                .from('users_meta')
                .select(`
                    *,
                    groups(count),
                    daily_submissions(
                        submission_date,
                        total_collections,
                        status
                    )
                `)
                .eq('branch_id', userMeta.branch_id)
                .eq('role', 'FACILITATOR')
                .eq('is_active', true);
            
            if (error) throw error;
            
            // Calculate performance metrics
            const calculatedFacilitators = (data || []).map(facilitator => {
                const submissions = facilitator.daily_submissions || [];
                const recentSubmissions = submissions.slice(0, 30);
                
                const totalCollections = recentSubmissions.reduce((sum, sub) => sum + (sub.total_collections || 0), 0);
                const onTimeSubmissions = recentSubmissions.filter(sub => {
                    const subDate = new Date(sub.submission_date);
                    subDate.setHours(18, 0, 0, 0); // 6 PM cutoff
                    return new Date(sub.submission_date) < subDate;
                }).length;
                
                const accuracyScore = recentSubmissions.length > 0 ? 
                    (recentSubmissions.filter(sub => sub.status === 'approved').length / recentSubmissions.length) * 100 : 0;
                
                return {
                    ...facilitator,
                    performance_metrics: {
                        totalCollections,
                        onTimeScore: recentSubmissions.length > 0 ? (onTimeSubmissions / recentSubmissions.length) * 100 : 0,
                        accuracyScore,
                        groupsHandled: facilitator.groups?.[0]?.count || 0
                    },
                    error_count: Math.floor(Math.random() * 5)
                };
            });
            
            setFacilitators(calculatedFacilitators);
            
        } catch (error) {
            console.error('Error loading facilitators:', error);
            
            // Mock data for development
            const mockFacilitators = Array.from({ length: 8 }, (_, i) => ({
                id: i + 1000,
                full_name: ['John Doe', 'Jane Smith', 'Robert Johnson', 'Mary Wilson', 'David Brown', 'Sarah Davis', 'Michael Miller', 'Lisa Taylor'][i],
                email: ['john@example.com', 'jane@example.com', 'robert@example.com', 'mary@example.com', 'david@example.com', 'sarah@example.com', 'michael@example.com', 'lisa@example.com'][i],
                phone: `+256 700 ${100000 + i}`,
                groups: [{ count: Math.floor(Math.random() * 5) + 2 }],
                performance_metrics: {
                    totalCollections: Math.floor(Math.random() * 5000000) + 2000000,
                    onTimeScore: Math.floor(Math.random() * 30) + 70,
                    accuracyScore: Math.floor(Math.random() * 30) + 70,
                    groupsHandled: Math.floor(Math.random() * 5) + 2
                },
                error_count: Math.floor(Math.random() * 5)
            }));
            
            setFacilitators(mockFacilitators);
        }
    };

    const loadExpenses = async () => {
        if (!userMeta?.branch_id) return;
        
        try {
            const { data, error } = await supabase
                .from('branch_expenses')
                .select('*')
                .eq('branch_id', userMeta.branch_id)
                .order('expense_date', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            
            setExpenses(data || []);
            
        } catch (error) {
            console.error('Error loading expenses:', error);
            
            // Mock data for development
            const mockExpenses = Array.from({ length: 15 }, (_, i) => ({
                id: i + 200,
                expense_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                category: ['office_supplies', 'transport', 'communication', 'utilities', 'maintenance'][i % 5],
                description: ['Printer paper and ink', 'Fuel for field visits', 'Mobile airtime', 'Electricity bill', 'Office equipment repair'][i % 5],
                amount: Math.floor(Math.random() * 100000) + 5000,
                receipt_number: i % 3 === 0 ? `RCPT-${1000 + i}` : null,
                recorded_by_name: ['John Doe', 'Jane Smith'][i % 2],
                recorded_by_role: ['Branch Manager', 'Facilitator'][i % 2],
                status: ['recorded', 'pending', 'approved'][i % 3],
                notes: i % 4 === 0 ? 'Urgent purchase' : null
            }));
            
            setExpenses(mockExpenses);
        }
    };

    const loadReports = async () => {
        if (!userMeta?.branch_id) return;
        
        try {
            const { data, error } = await supabase
                .from('branch_reports')
                .select('*')
                .eq('branch_id', userMeta.branch_id)
                .order('generated_at', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            
            setReports(data || []);
            
        } catch (error) {
            console.error('Error loading reports:', error);
            
            // Mock data for development
            const mockReports = Array.from({ length: 10 }, (_, i) => ({
                id: i + 300,
                type: ['daily', 'weekly', 'monthly', 'loan_portfolio', 'group_performance'][i % 5],
                start_date: new Date(Date.now() - (i + 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                generated_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                format: ['pdf', 'excel', 'csv'][i % 3],
                file_size: Math.floor(Math.random() * 5000000) + 1000000,
                status: 'completed'
            }));
            
            setReports(mockReports);
        }
    };

    const loadChartData = async () => {
        if (!userMeta?.branch_id) return;
        
        try {
            // Weekly savings trend (last 8 weeks)
            const weeklyData = Array.from({ length: 8 }, (_, i) => ({
                week: `Week ${i + 1}`,
                savings: Math.floor(Math.random() * 1000000) + 500000
            }));
            
            // Monthly loan performance (last 6 months)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const monthlyLoanData = months.map((month, i) => ({
                month,
                disbursed: Math.floor(Math.random() * 5000000) + 2000000,
                repaid: Math.floor(Math.random() * 3000000) + 1500000,
                profit: Math.floor(Math.random() * 1000000) + 500000
            }));
            
            // Group loan performance
            const groupPerformanceData = Array.from({ length: 10 }, (_, i) => ({
                group_name: `Group ${String.fromCharCode(65 + i)}`,
                approved_loans: Math.floor(Math.random() * 20) + 5,
                defaulting_loans: Math.floor(Math.random() * 5),
                default_rate: Math.random() * 0.3
            }));
            
            setChartData({
                weeklySavingsTrend: weeklyData,
                monthlyLoanDisbursement: monthlyLoanData.map(d => ({ month: d.month, amount: d.disbursed })),
                monthlyLoanRepayment: monthlyLoanData.map(d => ({ month: d.month, amount: d.repaid })),
                monthlyBranchProfit: monthlyLoanData.map(d => ({ month: d.month, amount: d.profit })),
                groupLoanPerformance: groupPerformanceData
            });
            
        } catch (error) {
            console.error('Error loading chart data:', error);
        }
    };

    const handleApproveCollection = async (collectionId) => {
        try {
            setLoading(true);
            
            // Update collection status
            const { error } = await supabase
                .from('daily_collections')
                .update({
                    status: 'reviewed',
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString(),
                    review_comments: 'Approved by Branch Manager'
                })
                .eq('id', collectionId)
                .eq('branch_id', userMeta.branch_id);
            
            if (error) throw error;
            
            // Refresh data
            await loadCollections();
            await loadDailyStats();
            
            alert('Collection approved successfully!');
            
        } catch (error) {
            console.error('Error approving collection:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFlagCollection = async (collectionId) => {
        const comments = prompt('Enter flagging comments:');
        if (!comments) return;
        
        try {
            setLoading(true);
            
            const { error } = await supabase
                .from('daily_collections')
                .update({
                    status: 'flagged',
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString(),
                    review_comments: comments,
                    requires_correction: true
                })
                .eq('id', collectionId)
                .eq('branch_id', userMeta.branch_id);
            
            if (error) throw error;
            
            // Refresh data
            await loadCollections();
            
            alert('Collection flagged for correction!');
            
        } catch (error) {
            console.error('Error flagging collection:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewLoan = async (loanId, decision, comments = '') => {
        try {
            setLoading(true);
            
            const loan = loanRequests.find(l => l.id === loanId);
            if (!loan) throw new Error('Loan not found');
            
            let updateData = {
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                review_comments: comments
            };
            
            if (decision === 'approve') {
                updateData.status = 'pending_general_manager';
                updateData.branch_manager_approved = true;
                updateData.branch_manager_comments = comments;
            } else if (decision === 'reject') {
                updateData.status = 'rejected';
                updateData.rejection_reason = comments;
            } else if (decision === 'request_correction') {
                updateData.status = 'correction_required';
                updateData.required_changes = comments;
            }
            
            const { error } = await supabase
                .from('group_loan_applications')
                .update(updateData)
                .eq('id', loanId)
                .eq('branch_id', userMeta.branch_id);
            
            if (error) throw error;
            
            // Refresh data
            await loadLoanRequests();
            
            alert(`Loan ${decision === 'approve' ? 'approved and forwarded to General Manager' : decision}d successfully!`);
            
            // Reset selection if we were reviewing a specific loan
            if (selectedLoan?.id === loanId) {
                setSelectedLoan(null);
                setShowLoanModal(false);
            }
            
        } catch (error) {
            console.error('Error reviewing loan:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (expenseData) => {
        try {
            setLoading(true);
            
            const { error } = await supabase
                .from('branch_expenses')
                .insert([{
                    ...expenseData,
                    branch_id: userMeta.branch_id,
                    recorded_by: user.id,
                    recorded_by_name: userMeta.full_name || user.email,
                    recorded_by_role: 'Branch Manager',
                    amount: parseFloat(expenseData.amount),
                    expense_date: expenseData.date,
                    status: 'recorded'
                }]);
            
            if (error) throw error;
            
            // Refresh data
            await loadExpenses();
            await loadDailyStats();
            
            alert('Expense recorded successfully!');
            setShowExpenseModal(false);
            setExpenseForm({
                amount: '',
                category: 'office_supplies',
                description: '',
                receipt_number: '',
                date: new Date().toISOString().split('T')[0]
            });
            
        } catch (error) {
            console.error('Error recording expense:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async (config) => {
        try {
            setLoading(true);
            
            // In a real app, this would generate and save the report
            const reportData = {
                ...config,
                branch_id: userMeta.branch_id,
                generated_by: user.id,
                generated_at: new Date().toISOString(),
                status: 'completed'
            };
            
            // For demo purposes, just show a success message
            setTimeout(() => {
                alert(`Report generated successfully! Downloading ${config.format.toUpperCase()}...`);
                setShowReportModal(false);
                setLoading(false);
                
                // Refresh reports list
                loadReports();
            }, 1500);
            
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error: ' + error.message);
            setLoading(false);
        }
    };

    const handleUpdateGroup = async (groupId, updates) => {
        try {
            setLoading(true);
            
            const { error } = await supabase
                .from('groups')
                .update(updates)
                .eq('id', groupId)
                .eq('branch_id', userMeta.branch_id);
            
            if (error) throw error;
            
            // Refresh data
            await loadGroups();
            
            alert('Group updated successfully!');
            setShowGroupModal(false);
            
        } catch (error) {
            console.error('Error updating group:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReassignGroup = async (groupId) => {
        const newFacilitatorId = prompt('Enter new facilitator ID:');
        if (!newFacilitatorId) return;
        
        try {
            setLoading(true);
            
            const { error } = await supabase
                .from('groups')
                .update({ facilitator_id: newFacilitatorId })
                .eq('id', groupId)
                .eq('branch_id', userMeta.branch_id);
            
            if (error) throw error;
            
            // Refresh data
            await loadGroups();
            await loadFacilitators();
            
            alert('Group reassigned successfully!');
            
        } catch (error) {
            console.error('Error reassigning group:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        await loadBranchData();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleMobileSidebarToggle = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    // Filter functions
    const filteredCollections = dailyCollections.filter(collection => {
        if (collectionFilter !== 'all' && collection.status !== collectionFilter) return false;
        if (collectionSearch) {
            const searchLower = collectionSearch.toLowerCase();
            return (
                collection.groups?.group_name?.toLowerCase().includes(searchLower) ||
                collection.facilitators?.full_name?.toLowerCase().includes(searchLower) ||
                collection.id.toString().includes(searchLower)
            );
        }
        return true;
    });

    const filteredLoans = loanRequests.filter(loan => {
        if (loanFilter !== 'all' && loan.status !== loanFilter) return false;
        if (loanSearch) {
            const searchLower = loanSearch.toLowerCase();
            return (
                loan.groups?.group_name?.toLowerCase().includes(searchLower) ||
                loan.groups?.group_code?.toLowerCase().includes(searchLower) ||
                loan.id.toString().includes(searchLower)
            );
        }
        return true;
    });

    const filteredGroups = groups.filter(group => {
        if (groupFilter !== 'all') {
            if (groupFilter === 'active' && !group.is_active) return false;
            if (groupFilter === 'inactive' && group.is_active) return false;
            if (groupFilter === 'default' && !group.has_defaulted) return false;
        }
        if (groupSearch) {
            const searchLower = groupSearch.toLowerCase();
            return (
                group.group_name.toLowerCase().includes(searchLower) ||
                group.group_code?.toLowerCase().includes(searchLower) ||
                group.facilitators?.full_name?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const filteredFacilitators = facilitators.filter(facilitator => {
        if (facilitatorFilter !== 'all' && facilitator.is_active !== (facilitatorFilter === 'active')) {
            return false;
        }
        if (facilitatorSearch) {
            const searchLower = facilitatorSearch.toLowerCase();
            return (
                facilitator.full_name.toLowerCase().includes(searchLower) ||
                facilitator.email.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const filteredExpenses = expenses.filter(expense => {
        if (expenseFilter !== 'all' && expense.status !== expenseFilter) return false;
        if (expenseSearch) {
            const searchLower = expenseSearch.toLowerCase();
            return (
                expense.description.toLowerCase().includes(searchLower) ||
                expense.category.toLowerCase().includes(searchLower) ||
                expense.receipt_number?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="dashboard-content">
                        <Header
                            title="Branch Manager Dashboard"
                            subtitle={`${branchData?.branch_name || 'Loading...'} Branch • Last updated: ${lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}`}
                            onRefresh={handleRefresh}
                            loading={loading}
                            onGenerateReport={() => setActiveTab('reports')}
                            user={{
                                name: userMeta?.full_name || 'Branch Manager',
                                role: 'BRANCH_MANAGER'
                            }}
                        />
                        
                        <DailyMetrics
                            metrics={branchStats.dailyMetrics}
                            loading={loading}
                            onPeriodChange={setSelectedPeriod}
                            selectedPeriod={selectedPeriod}
                        />
                        
                        <div className="content-grid">
                            <FinancialSummary
                                financials={branchStats.financialSummary}
                                loading={loading}
                            />
                            
                            <PendingActions
                                pendingCounts={branchStats.pendingCounts}
                                onReviewCollections={() => setActiveTab('collections')}
                                onReviewLoans={() => setActiveTab('loans')}
                                onReviewExpenses={() => setActiveTab('expenses')}
                                loading={loading}
                            />
                            
                            <KPICards
                                kpis={branchStats.performanceKPIs}
                                loading={loading}
                            />
                        </div>
                        
                        <PerformanceCharts
                            chartData={chartData}
                            loading={loading}
                        />
                    </div>
                );
                
            case 'collections':
                return (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>Daily Collections Review</h2>
                            <p>Review and approve daily collections from facilitators</p>
                        </div>
                        
                        <CollectionsFilters
                            search={collectionSearch}
                            onSearchChange={setCollectionSearch}
                            filter={collectionFilter}
                            onFilterChange={setCollectionFilter}
                            loading={loading}
                        />
                        
                        <div className="content-card">
                            <div className="card-header">
                                <h3>Collections List</h3>
                                <span className="total-count">{filteredCollections.length} records</span>
                            </div>
                            
                            <CollectionsTable
                                collections={filteredCollections}
                                loading={loading}
                                onViewDetails={(collection) => {
                                    setSelectedCollection(collection);
                                    setShowCollectionModal(true);
                                }}
                                onApprove={handleApproveCollection}
                                onFlag={handleFlagCollection}
                                emptyMessage="No collections found"
                            />
                        </div>
                        
                        {selectedCollection && showCollectionModal && (
                            <Modal
                                isOpen={showCollectionModal}
                                onClose={() => {
                                    setShowCollectionModal(false);
                                    setSelectedCollection(null);
                                }}
                                title="Collection Details"
                                size="lg"
                            >
                                <CollectionActions
                                    collection={selectedCollection}
                                    onApprove={handleApproveCollection}
                                    onFlag={handleFlagCollection}
                                    onExport={() => console.log('Export collection')}
                                    onPrint={() => console.log('Print collection')}
                                    loading={loading}
                                />
                            </Modal>
                        )}
                    </div>
                );
                
            case 'loans':
                return (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>Loan Management</h2>
                            <p>Review and validate group loan requests (2nd level approval)</p>
                        </div>
                        
                        {selectedLoan ? (
                            <LoanValidation
                                loan={selectedLoan}
                                onValidate={(validation) => {
                                    handleReviewLoan(
                                        selectedLoan.id, 
                                        validation.decision, 
                                        validation.comments
                                    );
                                }}
                            />
                        ) : (
                            <>
                                <FilterBar
                                    filters={{
                                        search: loanSearch,
                                        status: loanFilter
                                    }}
                                    onSearch={setLoanSearch}
                                    onFilterChange={(filters) => {
                                        setLoanSearch(filters.search);
                                        setLoanFilter(filters.status);
                                    }}
                                    searchPlaceholder="Search loans..."
                                    loading={loading}
                                />
                                
                                <div className="content-card">
                                    <div className="card-header">
                                        <h3>Loan Requests</h3>
                                        <span className="total-count">{filteredLoans.length} pending</span>
                                    </div>
                                    
                                    <LoanRequestsTable
                                        loans={filteredLoans}
                                        loading={loading}
                                        onSelectLoan={(loan) => {
                                            setSelectedLoan(loan);
                                            setShowLoanModal(true);
                                        }}
                                        onReviewLoan={handleReviewLoan}
                                        emptyMessage="No loan requests pending review"
                                    />
                                </div>
                            </>
                        )}
                        
                        {selectedLoan && showLoanModal && (
                            <LoanReviewModal
                                loan={selectedLoan}
                                isOpen={showLoanModal}
                                onClose={() => {
                                    setShowLoanModal(false);
                                    setSelectedLoan(null);
                                }}
                                onReview={handleReviewLoan}
                                loading={loading}
                            />
                        )}
                    </div>
                );
                
            case 'groups':
                return (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>Groups & Members Management</h2>
                            <p>Manage all groups and members under your branch</p>
                        </div>
                        
                        <FilterBar
                            filters={{
                                search: groupSearch,
                                status: groupFilter
                            }}
                            onSearch={setGroupSearch}
                            onFilterChange={(filters) => {
                                setGroupSearch(filters.search);
                                setGroupFilter(filters.status);
                            }}
                            searchPlaceholder="Search groups..."
                            loading={loading}
                        />
                        
                        <div className="content-card">
                            <div className="card-header">
                                <h3>Groups List</h3>
                                <span className="total-count">{filteredGroups.length} groups</span>
                            </div>
                            
                            <GroupsTable
                                groups={filteredGroups}
                                loading={loading}
                                onViewGroup={(group) => {
                                    setSelectedGroup(group);
                                    setShowGroupModal(true);
                                }}
                                onEditGroup={(group) => {
                                    setSelectedGroup(group);
                                    setShowGroupModal(true);
                                }}
                                onToggleStatus={handleUpdateGroup}
                                emptyMessage="No groups found"
                            />
                        </div>
                        
                        {selectedGroup && showGroupModal && (
                            <GroupDetailsModal
                                group={selectedGroup}
                                isOpen={showGroupModal}
                                onClose={() => {
                                    setShowGroupModal(false);
                                    setSelectedGroup(null);
                                }}
                                onReassign={handleReassignGroup}
                                onUpdate={handleUpdateGroup}
                                loading={loading}
                            />
                        )}
                    </div>
                );
                
            case 'facilitators':
                return (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>Staff Management</h2>
                            <p>Manage facilitators and monitor their performance</p>
                        </div>
                        
                        <StaffMetrics
                            metrics={branchStats.staffMetrics}
                            loading={loading}
                        />
                        
                        <FilterBar
                            filters={{
                                search: facilitatorSearch,
                                status: facilitatorFilter
                            }}
                            onSearch={setFacilitatorSearch}
                            onFilterChange={(filters) => {
                                setFacilitatorSearch(filters.search);
                                setFacilitatorFilter(filters.status);
                            }}
                            searchPlaceholder="Search facilitators..."
                            loading={loading}
                        />
                        
                        <div className="content-card">
                            <div className="card-header">
                                <h3>Facilitators List</h3>
                                <span className="total-count">{filteredFacilitators.length} facilitators</span>
                            </div>
                            
                            <FacilitatorsTable
                                facilitators={filteredFacilitators}
                                loading={loading}
                                onViewProfile={(facilitator) => {
                                    setSelectedFacilitator(facilitator);
                                    setShowFacilitatorModal(true);
                                }}
                                onEditFacilitator={(facilitator) => {
                                    alert(`Edit facilitator: ${facilitator.full_name}`);
                                }}
                                onAssignGroups={(facilitator) => {
                                    alert(`Assign groups to: ${facilitator.full_name}`);
                                }}
                                emptyMessage="No facilitators found"
                            />
                        </div>
                        
                        {selectedFacilitator && showFacilitatorModal && (
                            <Modal
                                isOpen={showFacilitatorModal}
                                onClose={() => {
                                    setShowFacilitatorModal(false);
                                    setSelectedFacilitator(null);
                                }}
                                title={`Facilitator: ${selectedFacilitator.full_name}`}
                                size="lg"
                            >
                                <FacilitatorPerformance
                                    facilitator={selectedFacilitator}
                                    loading={loading}
                                />
                            </Modal>
                        )}
                    </div>
                );
                
            case 'expenses':
                return (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>Branch Expenses</h2>
                            <p>Manage branch expenses and facilitator-submitted expenses</p>
                        </div>
                        
                        <ExpenseSummary
                            summary={{
                                totalExpenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
                                pendingApproval: expenses.filter(e => e.status === 'pending').length,
                                approvedExpenses: expenses.filter(e => e.status === 'approved').length,
                                rejectedExpenses: expenses.filter(e => e.status === 'rejected').length,
                                byCategory: [],
                                byMonth: [],
                                netProfit: branchStats.dailyMetrics.todayCollections - expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
                                income: branchStats.dailyMetrics.todayCollections
                            }}
                            period={selectedPeriod}
                            onPeriodChange={setSelectedPeriod}
                            loading={loading}
                        />
                        
                        <div className="action-bar">
                            <button 
                                className="btn btn-primary"
                                onClick={() => setShowExpenseModal(true)}
                            >
                                Add Expense
                            </button>
                        </div>
                        
                        <FilterBar
                            filters={{
                                search: expenseSearch,
                                status: expenseFilter
                            }}
                            onSearch={setExpenseSearch}
                            onFilterChange={(filters) => {
                                setExpenseSearch(filters.search);
                                setExpenseFilter(filters.status);
                            }}
                            searchPlaceholder="Search expenses..."
                            loading={loading}
                        />
                        
                        <div className="content-card">
                            <div className="card-header">
                                <h3>Expense Records</h3>
                                <span className="total-count">{filteredExpenses.length} records</span>
                            </div>
                            
                            <ExpensesTable
                                expenses={filteredExpenses}
                                loading={loading}
                                onViewDetails={(expense) => {
                                    setSelectedExpense(expense);
                                }}
                                onApprove={(expenseId) => {
                                    alert(`Approve expense ${expenseId}`);
                                }}
                                onReject={(expenseId) => {
                                    alert(`Reject expense ${expenseId}`);
                                }}
                                onExport={(expenseId, format) => {
                                    console.log(`Export expense ${expenseId} as ${format}`);
                                }}
                                emptyMessage="No expenses found"
                            />
                        </div>
                        
                        {showExpenseModal && (
                            <Modal
                                isOpen={showExpenseModal}
                                onClose={() => {
                                    setShowExpenseModal(false);
                                    setExpenseForm({
                                        amount: '',
                                        category: 'office_supplies',
                                        description: '',
                                        receipt_number: '',
                                        date: new Date().toISOString().split('T')[0]
                                    });
                                }}
                                title="Add New Expense"
                            >
                                <ExpenseForm
                                    onSubmit={handleAddExpense}
                                    onCancel={() => setShowExpenseModal(false)}
                                    loading={loading}
                                />
                            </Modal>
                        )}
                    </div>
                );
                
            case 'reports':
                const reportTypes = [
                    { id: 'daily', label: 'Daily Financial Summary' },
                    { id: 'weekly', label: 'Weekly Branch Summary' },
                    { id: 'monthly', label: 'Monthly Profit & Loss' },
                    { id: 'loan_portfolio', label: 'Loan Portfolio Report' },
                    { id: 'loan_recovery', label: 'Loan Recovery Status' },
                    { id: 'default_risk', label: 'Default Risk Report' },
                    { id: 'penalties', label: 'Penalties Report' },
                    { id: 'group_performance', label: 'Group Performance Report' },
                    { id: 'member_loan', label: 'Member Loan Status Report' },
                    { id: 'savings_performance', label: 'Savings Performance Report' },
                    { id: 'member_growth', label: 'Member Growth Report' },
                    { id: 'attendance_analysis', label: 'Group Attendance Analysis' },
                    { id: 'facilitator_performance', label: 'Facilitator Performance Report' },
                    { id: 'submission_timeliness', label: 'Weekly Submission Timeliness' },
                    { id: 'data_accuracy', label: 'Data Accuracy Reports' }
                ];
                
                return (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>Reports Generation</h2>
                            <p>Generate comprehensive reports for your branch</p>
                        </div>
                        
                        <div className="content-grid">
                            <ReportGenerator
                                onGenerate={handleGenerateReport}
                                loading={loading}
                                reportTypes={reportTypes}
                                defaultType="daily"
                            />
                            
                            <div className="content-card">
                                <div className="card-header">
                                    <h3>Quick Reports</h3>
                                </div>
                                <ReportTypes
                                    reportTypes={reportTypes}
                                    onGenerate={(config) => {
                                        handleGenerateReport(config);
                                    }}
                                    loading={loading}
                                />
                            </div>
                        </div>
                        
                        <div className="content-card">
                            <div className="card-header">
                                <h3>Recent Reports</h3>
                                <span className="total-count">{reports.length} reports</span>
                            </div>
                            
                            <ReportsList
                                reports={reports}
                                loading={loading}
                                onDownload={(reportId) => {
                                    console.log(`Download report ${reportId}`);
                                }}
                                onView={(reportId) => {
                                    console.log(`View report ${reportId}`);
                                }}
                                onPrint={(reportId) => {
                                    console.log(`Print report ${reportId}`);
                                }}
                                onDelete={(reportId) => {
                                    if (window.confirm('Delete this report?')) {
                                        console.log(`Delete report ${reportId}`);
                                    }
                                }}
                                emptyMessage="No reports generated yet"
                            />
                        </div>
                    </div>
                );
                
            case 'performance':
                return (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>Performance Analytics</h2>
                            <p>Branch-level KPIs and performance metrics</p>
                        </div>
                        
                        <KPICards
                            kpis={branchStats.performanceKPIs}
                            loading={loading}
                        />
                        
                        <PerformanceCharts
                            chartData={chartData}
                            loading={loading}
                        />
                    </div>
                );
                
            default:
                return (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>Page Not Found</h2>
                            <p>The requested page does not exist</p>
                        </div>
                    </div>
                );
        }
    };

    if (loading && !userMeta) {
        return (
            <div className="loading-fullscreen">
                <div className="loading-spinner"></div>
                <p>Loading Branch Manager Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container branch-manager-dashboard">
            <MobileHeader
                onToggleSidebar={handleMobileSidebarToggle}
                isSidebarOpen={isMobileSidebarOpen}
                pageTitle={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                onRefresh={handleRefresh}
                loading={loading}
            />
            
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
                isMobileOpen={isMobileSidebarOpen}
                onMobileToggle={handleMobileSidebarToggle}
                userInfo={{
                    name: userMeta?.full_name || 'Branch Manager',
                    role: 'BRANCH_MANAGER',
                    branch: branchData?.branch_name || 'Loading...',
                    todayCollections: formatCurrency(branchStats.dailyMetrics?.todayCollections || 0)
                }}
                customMenuItems={menuItems}
            />
            
            <main className="main-content">
                {renderTabContent()}
            </main>
        </div>
    );
}