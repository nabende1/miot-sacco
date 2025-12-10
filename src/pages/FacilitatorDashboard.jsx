// src/pages/FacilitatorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Component imports
import WeeklyCollection from '../components/Facilitator/WeeklyCollection/WeeklyCollection';
import GroupLoanRequest from '../components/GeneralManager/LoanManagement/GroupLoanRequest';
import LoanApproval from '../components/GeneralManager/LoanManagement/LoanApproval';
import LoanMonitoring from '../components/GeneralManager/LoanMonitoring/LoanMonitoring';
import Sidebar from '../components/Sidebar';

// Supabase client
import supabase from '../supabaseClient';

// CSS imports
import '../styles/pages/GeneralManager/LoanManagement.css';
import '../styles/pages/Facilitator/WeeklyCollection.css';
import '../styles/components/Layout/DashboardLayout.css';
import '../styles/pages/Facilitator/FacilitatorDashboard.css';

// Icon imports
import { 
    Users, DollarSign, TrendingUp, Calendar, Download, RefreshCw,
    AlertCircle, CheckCircle, X, Menu, LogOut, Filter, Activity,
    Target, Clock, TrendingDown, Banknote, Percent, FileText,
    Home, Shield, CreditCard, PieChart, BarChart3, Building2,
    Plus, UserPlus, Briefcase, Wallet, TrendingUp as ChartUp,
    Award, Eye, Edit, Trash2, Phone, Mail, ChevronRight,
    ChevronLeft, Star, Clock as ClockIcon, DollarSign as Money,
    BarChart as ChartBar, Filter as FilterIcon, Search,
    Download as DownloadIcon, Upload, Check, X as XIcon,
    ArrowRightCircle, CheckCircle2, Circle, ListChecks, Layers,
    Calculator, Info
} from 'lucide-react';

// Menu items configuration
const MENU_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'daily-schedule', label: 'Daily Schedule', icon: <ListChecks size={20} /> },
    { id: 'collection', label: 'Weekly Collection', icon: <DollarSign size={20} /> },
    { id: 'members', label: 'Members', icon: <Users size={20} /> },
    { id: 'loans', label: 'Member Loans', icon: <CreditCard size={20} /> },
    { id: 'group-loans', label: 'Group Loans', icon: <Briefcase size={20} /> },
    { id: 'attendance', label: 'Attendance', icon: <Calendar size={20} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
    { id: 'group', label: 'Group Overview', icon: <Building2 size={20} /> },
    { id: 'create-group', label: 'Create Group', icon: <Plus size={20} /> },
    { id: 'commissions', label: 'Commissions', icon: <Wallet size={20} /> },
    { id: 'performance', label: 'Performance', icon: <ChartBar size={20} /> },
    { id: 'loan-requests', label: 'Loan Requests', icon: <FileText size={20} /> },
    { id: 'loan-approvals', label: 'Loan Approvals', icon: <CheckCircle size={20} /> },
    { id: 'loan-monitoring', label: 'Loan Monitoring', icon: <Activity size={20} /> },
];

export default function FacilitatorDashboard() {
    const navigate = useNavigate();
    
    // State management
    const [user, setUser] = useState(null);
    const [userMeta, setUserMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Group management states
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [todayGroups, setTodayGroups] = useState([]);
    const [dailyCompletion, setDailyCompletion] = useState({});
    const [groupProgress, setGroupProgress] = useState({});
    const [allGroups, setAllGroups] = useState([]);
    
    // Form states
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showLoanApplication, setShowLoanApplication] = useState(false);
    const [showExpense, setShowExpense] = useState(false);
    const [performanceView, setPerformanceView] = useState('daily');
    const [selectedMember, setSelectedMember] = useState(null);
    
    // Commission states
    const [commissionPeriod, setCommissionPeriod] = useState('daily');
    const [commissionData, setCommissionData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        summary: {},
        detailed: null
    });
    
    // Form data states
    const [newGroupForm, setNewGroupForm] = useState({
        group_name: '',
        meeting_day: 'Monday',
        meeting_time: '10:00',
        meeting_location: '',
        savings_target: '',
        is_active: true
    });
    
    const [newMemberForm, setNewMemberForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        national_id: '',
        gender: 'Male',
        date_of_birth: '',
        occupation: '',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        opening_balance: 0,
        savings_frequency: 'weekly'
    });
    
    const [expenseForm, setExpenseForm] = useState({
        amount: '',
        category: 'transport',
        description: '',
        receipt_number: '',
        date: new Date().toISOString().split('T')[0]
    });
    
    const [loanApplicationData, setLoanApplicationData] = useState({
        loanAmount: '',
        memberLoans: [],
        purpose: '',
        repaymentPeriod: 6
    });
    
    // Data states
    const [stats, setStats] = useState({
        totalMembers: 0,
        presentToday: 0,
        absentToday: 0,
        savedToday: 0,
        membersWithLoans: 0,
        totalSavings: 0,
        savingsToday: 0,
        totalSocialFund: 0,
        socialFundToday: 0,
        totalFines: 0,
        finesToday: 0,
        totalLoanRepayments: 0,
        repaymentsToday: 0,
        totalRegistration: 0,
        registrationToday: 0,
        activeLoans: 0,
        overdueLoans: 0,
        totalOutstanding: 0,
        averageRepayment: 0,
        collectionProgress: 0,
        expectedCollection: 0,
        actualCollection: 0,
        variance: 0,
        totalGroups: 0,
        completedToday: 0,
        pendingToday: 0,
        upcomingGroups: 0,
        todayGroupsCount: 0,
        commissionEarned: 0,
        commissionThisMonth: 0,
        totalGroupsCreated: 0,
        activeGroups: 0,
        topSavers: [],
        memberPerformance: {
            excellent: 0,
            good: 0,
            average: 0,
            poor: 0
        }
    });
    
    const [dailyCollection, setDailyCollection] = useState({
        totalCollected: 0,
        membersNotSaved: 0,
        membersBelowMinimum: 0,
        membersMissingRepayment: 0,
        attendanceRate: 0,
        collectionRate: 0,
        expectedToday: 0
    });
    
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [memberFilter, setMemberFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [recentActivities, setRecentActivities] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [performanceData, setPerformanceData] = useState({
        daily: [],
        weekly: [],
        monthly: []
    });
    const [loanApplications, setLoanApplications] = useState([]);
    
    // Load user data on mount
    useEffect(() => {
        loadUserData();
    }, []);
    
    // Load facilitator data when user is set
    useEffect(() => {
        if (user) {
            loadFacilitatorData();
        }
    }, [user, selectedDate]);
    
    // Load group data when selected group changes
    useEffect(() => {
        if (selectedGroup) {
            loadGroupData(selectedGroup);
        }
    }, [selectedGroup, selectedDate]);
    
    // Filter members when search term or filter changes
    useEffect(() => {
        filterMembers();
    }, [members, searchTerm, memberFilter]);
    
    const filterMembers = () => {
        let filtered = members;
        
        if (searchTerm) {
            filtered = filtered.filter(member => 
                member.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.member_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.phone.includes(searchTerm)
            );
        }
        
        if (memberFilter !== 'all') {
            filtered = filtered.filter(member => {
                if (memberFilter === 'not_saved') return member.status_summary === 'NOT SAVED TODAY';
                if (memberFilter === 'below_minimum') return member.status_summary === 'BELOW MINIMUM SAVINGS';
                if (memberFilter === 'missing_repayment') return member.status_summary === 'MISSING LOAN REPAYMENT';
                if (memberFilter === 'has_loan') return member.has_active_loan;
                return true;
            });
        }
        
        setFilteredMembers(filtered);
    };
    
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
                console.error('Error fetching user metadata:', metaError);
                navigate('/unauthorized');
                return;
            }
            
            setUserMeta(userMetaData);
            
            // Verify user is Facilitator
            if (userMetaData.role !== 'FACILITATOR') {
                const redirectPaths = {
                    'GENERAL_MANAGER': '/general-manager-dashboard',
                    'BRANCH_MANAGER': '/branch-dashboard',
                    'SUPER_ADMIN': '/admin-dashboard'
                };
                
                const redirectPath = redirectPaths[userMetaData.role] || '/login';
                navigate(redirectPath);
                return;
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };
    
    const loadFacilitatorData = async () => {
        try {
            await Promise.all([
                loadAllGroups(),
                loadTodayGroups(),
                loadFacilitatorStats(),
                loadRecentActivities(),
                loadCommissionData(),
                loadExpenses(),
                loadPerformanceData()
            ]);
            
            setLastUpdated(new Date());
            
        } catch (error) {
            console.error('Error loading facilitator data:', error);
        }
    };
    
    const loadGroupData = async (groupId) => {
        try {
            if (!groupId) return;
            
            await Promise.all([
                loadGroupMembers(groupId),
                loadGroupCollection(groupId),
                loadLoanApplicationsForGroup(groupId),
                loadGroupProgress(groupId)
            ]);
            
        } catch (error) {
            console.error('Error loading group data:', error);
        }
    };
    
    const loadTodayGroups = async () => {
        try {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            
            const { data: groupsData, error } = await supabase
                .from('groups')
                .select(`
                    *,
                    members(count),
                    daily_submissions(submission_date, status)
                `)
                .eq('facilitator_id', user.id)
                .eq('is_active', true)
                .eq('meeting_day', today);
            
            if (error) throw error;
            
            const sortedGroups = (groupsData || []).sort((a, b) => {
                return a.meeting_time.localeCompare(b.meeting_time);
            });
            
            setTodayGroups(sortedGroups);
            
            const completionStatus = {};
            const progressStatus = {};
            
            sortedGroups.forEach(group => {
                const todaySubmission = group.daily_submissions?.find(
                    sub => new Date(sub.submission_date).toDateString() === new Date().toDateString()
                );
                
                completionStatus[group.id] = todaySubmission?.status === 'submitted' || false;
                progressStatus[group.id] = 0;
            });
            
            setDailyCompletion(completionStatus);
            setGroupProgress(progressStatus);
            
            if (sortedGroups.length > 0 && !selectedGroup) {
                setSelectedGroup(sortedGroups[0].id);
            }
            
        } catch (error) {
            console.error('Error loading today\'s groups:', error);
        }
    };
    
    const loadAllGroups = async () => {
        try {
            const { data: groupsData, error } = await supabase
                .from('groups')
                .select(`
                    *,
                    members(count),
                    group_loans(status),
                    daily_submissions(submission_date, status)
                `)
                .eq('facilitator_id', user.id)
                .eq('is_active', true)
                .order('meeting_day', { ascending: true })
                .order('meeting_time', { ascending: true });
            
            if (error) throw error;
            
            setAllGroups(groupsData || []);
            
        } catch (error) {
            console.error('Error loading all groups:', error);
        }
    };
    
    const loadCommissionData = async () => {
        try {
            const { data: commissions, error } = await supabase
                .from('facilitator_commissions')
                .select('*')
                .eq('facilitator_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            const mockCommissionData = {
                daily: commissions.filter(c => {
                    const date = new Date(c.created_at);
                    const today = new Date();
                    return date.toDateString() === today.toDateString();
                }).map(c => ({
                    id: c.id,
                    calculation_date: c.created_at,
                    total_loans_issued: Math.floor(Math.random() * 5000000) + 1000000,
                    total_interest_generated: Math.floor(Math.random() * 500000) + 100000,
                    processing_fee_generated: Math.floor(Math.random() * 100000) + 20000,
                    commission_eligible_amount: c.amount || 0,
                    group_id: c.group_id
                })),
                weekly: [],
                monthly: [],
                summary: {
                    total_commission_earned: commissions
                        .filter(c => c.status === 'approved')
                        .reduce((sum, c) => sum + (c.amount || 0), 0),
                    total_members_served: 0,
                    total_processing_fees: 0
                },
                detailed: {
                    groups_data: JSON.stringify([
                        {
                            group_name: "Sample Group 1",
                            members_count: 3,
                            total_requested: 600000,
                            total_interest: 60000,
                            total_processing_fees: 30000,
                            facilitator_commission: 300,
                            member_details: [
                                {
                                    member_name: "Member 1",
                                    requested_amount: 100000,
                                    interest_deduction: 10000,
                                    processing_fee: 10000,
                                    savings_deposit: 10000,
                                    net_amount: 80000
                                },
                                {
                                    member_name: "Member 2",
                                    requested_amount: 200000,
                                    interest_deduction: 20000,
                                    processing_fee: 10000,
                                    savings_deposit: 20000,
                                    net_amount: 170000
                                },
                                {
                                    member_name: "Member 3",
                                    requested_amount: 300000,
                                    interest_deduction: 30000,
                                    processing_fee: 10000,
                                    savings_deposit: 30000,
                                    net_amount: 260000
                                }
                            ]
                        }
                    ])
                }
            };
            
            setCommissionData(mockCommissionData);
            setCommissions(commissions || []);
            
        } catch (error) {
            console.error('Error loading commission data:', error);
        }
    };
    
    const loadGroupMembers = async (groupId) => {
        try {
            const { data: membersData, error } = await supabase
                .from('members')
                .select(`
                    *,
                    member_loans(status, remaining_balance),
                    weekly_transactions(date_recorded, shares_value)
                `)
                .eq('group_id', groupId)
                .eq('is_active', true)
                .order('full_name');
            
            if (error) throw error;
            
            const today = new Date().toISOString().split('T')[0];
            const processedMembers = membersData.map(member => {
                const todayTransaction = member.weekly_transactions?.find(
                    tx => tx.date_recorded.split('T')[0] === today
                );
                const hasActiveLoan = member.member_loans?.some(loan => loan.status === 'active');
                const loanBalance = member.member_loans
                    ?.filter(loan => loan.status === 'active')
                    .reduce((sum, loan) => sum + (loan.remaining_balance || 0), 0) || 0;
                
                return {
                    member_id: member.id,
                    member_name: member.full_name,
                    member_number: member.member_number,
                    phone: member.phone,
                    has_active_loan: hasActiveLoan,
                    loan_balance: loanBalance,
                    saved_today: !!todayTransaction,
                    today_savings: todayTransaction?.shares_value || 0,
                    status_summary: todayTransaction ? 'OK' : 'NOT SAVED TODAY',
                    attendance_status: 'present'
                };
            });
            
            setMembers(processedMembers);
            setFilteredMembers(processedMembers);
            
        } catch (error) {
            console.error('Error loading group members:', error);
        }
    };
    
    const loadGroupCollection = async (groupId) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data: transactions, error: txError } = await supabase
                .from('weekly_transactions')
                .select('shares_value, loan_repayment')
                .eq('group_id', groupId)
                .gte('date_recorded', today)
                .lt('date_recorded', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            
            if (txError) throw txError;
            
            const totalCollected = transactions?.reduce((sum, tx) => 
                sum + (tx.shares_value || 0) + (tx.loan_repayment || 0), 0) || 0;
            
            const { data: members, error: membersError } = await supabase
                .from('members')
                .select('id')
                .eq('group_id', groupId)
                .eq('is_active', true);
            
            if (membersError) throw membersError;
            
            const memberCount = members?.length || 0;
            
            const { data: savedMembers, error: savedError } = await supabase
                .from('weekly_transactions')
                .select('member_id')
                .eq('group_id', groupId)
                .gte('date_recorded', today)
                .lt('date_recorded', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            
            const savedMemberIds = new Set(savedMembers?.map(tx => tx.member_id) || []);
            const membersNotSaved = memberCount - savedMemberIds.size;
            
            const expectedToday = memberCount * 2000;
            
            setDailyCollection({
                totalCollected,
                membersNotSaved,
                membersBelowMinimum: 0,
                membersMissingRepayment: 0,
                attendanceRate: memberCount > 0 ? Math.round(((memberCount - membersNotSaved) / memberCount) * 100) : 0,
                collectionRate: expectedToday > 0 ? Math.round((totalCollected / expectedToday) * 100) : 0,
                expectedToday
            });
            
        } catch (error) {
            console.error('Error loading group collection:', error);
        }
    };
    
    const loadGroupProgress = async (groupId) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data: membersData, error: membersError } = await supabase
                .from('members')
                .select('id')
                .eq('group_id', groupId)
                .eq('is_active', true);
            
            if (membersError) throw membersError;
            
            const { data: savedData, error: savedError } = await supabase
                .from('weekly_transactions')
                .select('member_id')
                .eq('group_id', groupId)
                .gte('date_recorded', today)
                .lt('date_recorded', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            
            if (!savedError) {
                const totalMembers = membersData?.length || 0;
                const savedCount = new Set(savedData?.map(tx => tx.member_id)).size || 0;
                const progress = totalMembers > 0 ? Math.round((savedCount / totalMembers) * 100) : 0;
                
                setGroupProgress(prev => ({
                    ...prev,
                    [groupId]: progress
                }));
            }
            
        } catch (error) {
            console.error('Error loading group progress:', error);
        }
    };
    
    const loadFacilitatorStats = async () => {
        try {
            let totalMembers = 0;
            let totalSavings = 0;
            let totalTodaySavings = 0;
            let activeLoansCount = 0;
            let totalOutstanding = 0;
            
            for (const group of allGroups) {
                const { data: membersData } = await supabase
                    .from('members')
                    .select('id')
                    .eq('group_id', group.id)
                    .eq('is_active', true);
                
                totalMembers += membersData?.length || 0;
                
                const { data: savingsData } = await supabase
                    .from('group_savings')
                    .select('amount')
                    .eq('group_id', group.id);
                
                totalSavings += savingsData?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
                
                const today = new Date().toISOString().split('T')[0];
                const { data: todayData } = await supabase
                    .from('weekly_transactions')
                    .select('shares_value')
                    .eq('group_id', group.id)
                    .gte('date_recorded', today)
                    .lt('date_recorded', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                
                totalTodaySavings += todayData?.reduce((sum, tx) => sum + (tx.shares_value || 0), 0) || 0;
                
                if (membersData?.length > 0) {
                    const { data: loansData } = await supabase
                        .from('member_loans')
                        .select('remaining_balance')
                        .eq('status', 'active')
                        .in('member_id', membersData.map(m => m.id));
                    
                    activeLoansCount += loansData?.length || 0;
                    totalOutstanding += loansData?.reduce((sum, loan) => sum + (loan.remaining_balance || 0), 0) || 0;
                }
            }
            
            const completedToday = Object.values(dailyCompletion).filter(status => status).length;
            const pendingToday = todayGroups.length - completedToday;
            
            const { data: commissionData } = await supabase
                .from('facilitator_commissions')
                .select('amount, status, created_at')
                .eq('facilitator_id', user.id)
                .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
            
            const thisMonthCommission = commissionData
                ?.filter(c => c.status === 'approved')
                .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
            
            setStats(prev => ({
                ...prev,
                totalMembers,
                presentToday: totalMembers - dailyCollection.membersNotSaved,
                absentToday: dailyCollection.membersNotSaved,
                savedToday: Math.floor(totalMembers * 0.8),
                membersWithLoans: activeLoansCount,
                totalSavings,
                savingsToday: totalTodaySavings,
                totalSocialFund: Math.floor(totalTodaySavings * 0.05),
                socialFundToday: Math.floor(totalTodaySavings * 0.05),
                totalFines: Math.floor(totalMembers * 100),
                finesToday: Math.floor(totalMembers * 100),
                totalLoanRepayments: Math.floor(totalOutstanding * 0.1),
                repaymentsToday: Math.floor(totalOutstanding * 0.1),
                totalRegistration: Math.floor(totalMembers * 5000),
                registrationToday: Math.floor(totalMembers * 5000),
                activeLoans: activeLoansCount,
                overdueLoans: Math.floor(activeLoansCount * 0.1),
                totalOutstanding,
                averageRepayment: activeLoansCount > 0 ? Math.floor(totalOutstanding / activeLoansCount) : 0,
                collectionProgress: dailyCollection.collectionRate || 0,
                expectedCollection: totalMembers * 2000,
                actualCollection: totalTodaySavings,
                variance: (totalMembers * 2000) - totalTodaySavings,
                totalGroups: allGroups.length,
                completedToday,
                pendingToday,
                upcomingGroups: allGroups.length - todayGroups.length,
                todayGroupsCount: todayGroups.length,
                commissionEarned: prev.commissionEarned || 0,
                commissionThisMonth: thisMonthCommission,
                totalGroupsCreated: allGroups.length,
                activeGroups: allGroups.filter(g => g.is_active).length
            }));
            
        } catch (error) {
            console.error('Error loading facilitator stats:', error);
        }
    };
    
    const loadRecentActivities = async () => {
        try {
            const { data: transactions, error } = await supabase
                .from('weekly_transactions')
                .select(`
                    *,
                    members(full_name, member_number),
                    groups(group_name)
                `)
                .eq('facilitator_id', user.id)
                .gte('date_recorded', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .order('date_recorded', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            
            const activities = (transactions || []).map(tx => ({
                id: tx.id,
                action: tx.shares_value > 0 ? 'savings' : tx.loan_repayment > 0 ? 'loan_repayment' : 'other',
                description: `${tx.members?.full_name} - ${tx.shares_value > 0 ? `Saved UGX ${tx.shares_value}` : `Repaid UGX ${tx.loan_repayment}`}`,
                user: `Member: ${tx.members?.member_number}`,
                group: tx.groups?.group_name,
                timestamp: tx.date_recorded
            }));
            
            setRecentActivities(activities);
            
        } catch (error) {
            console.error('Error loading recent activities:', error);
        }
    };
    
    const loadExpenses = async () => {
        try {
            const { data, error } = await supabase
                .from('facilitator_expenses')
                .select('*')
                .eq('facilitator_id', user.id)
                .order('date', { ascending: false });
            
            if (error) throw error;
            
            setExpenses(data || []);
            
        } catch (error) {
            console.error('Error loading expenses:', error);
        }
    };
    
    const loadPerformanceData = async () => {
        try {
            const mockDailyData = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                savings: Math.floor(Math.random() * 1000000) + 500000,
                attendance: Math.floor(Math.random() * 30) + 70,
                loans_processed: Math.floor(Math.random() * 5)
            }));
            
            const mockWeeklyData = Array.from({ length: 12 }, (_, i) => ({
                week: `Week ${i + 1}`,
                total_savings: Math.floor(Math.random() * 5000000) + 2000000,
                avg_attendance: Math.floor(Math.random() * 20) + 75,
                new_members: Math.floor(Math.random() * 10) + 5
            }));
            
            const mockMonthlyData = Array.from({ length: 6 }, (_, i) => ({
                month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
                total_savings: Math.floor(Math.random() * 20000000) + 10000000,
                commission_earned: Math.floor(Math.random() * 500000) + 200000,
                groups_active: Math.floor(Math.random() * 5) + 3
            }));
            
            setPerformanceData({
                daily: mockDailyData,
                weekly: mockWeeklyData,
                monthly: mockMonthlyData
            });
            
        } catch (error) {
            console.error('Error loading performance data:', error);
        }
    };
    
    const loadLoanApplicationsForGroup = async (groupId) => {
        try {
            const { data, error } = await supabase
                .from('group_loan_applications')
                .select(`
                    *,
                    groups(group_name),
                    application_members(
                        member_id,
                        members(full_name, member_number),
                        loan_amount,
                        purpose
                    )
                `)
                .eq('group_id', groupId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            setLoanApplications(data || []);
            
        } catch (error) {
            console.error('Error loading loan applications:', error);
        }
    };
    
    // Utility functions
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid date';
        }
    };
    
    const getPageTitle = () => {
        const titles = {
            'dashboard': 'Facilitator Dashboard',
            'daily-schedule': 'Daily Schedule',
            'collection': 'Daily Collection',
            'members': 'Member Management',
            'loans': 'Member Loans',
            'attendance': 'Attendance Tracking',
            'reports': 'Daily Report',
            'group': 'Group Overview',
            'create-group': 'Create New Group',
            'group-loans': 'Group Loans',
            'commissions': 'Commissions & Earnings',
            'performance': 'Performance Analytics',
            'member-profile': 'Member Profile',
            'loan-requests': 'Loan Requests',
            'loan-approvals': 'Loan Approvals',
            'loan-monitoring': 'Loan Monitoring'
        };
        return titles[activeTab] || 'MIOT SACCO - Facilitator';
    };
    
    // Action handlers
    const handleRefresh = async () => {
        setLoading(true);
        await loadFacilitatorData();
        setLoading(false);
    };
    
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            localStorage.clear();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
    
    const handleMobileSidebarToggle = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };
    
    const switchToNextGroup = () => {
        if (todayGroups.length === 0) return;
        
        const currentIndex = todayGroups.findIndex(g => g.id === selectedGroup);
        const nextIndex = (currentIndex + 1) % todayGroups.length;
        setSelectedGroup(todayGroups[nextIndex].id);
    };
    
    const handleSubmitDaily = async () => {
        try {
            if (!selectedGroup) {
                alert('Please select a group first');
                return;
            }
            
            if (dailyCollection.membersNotSaved > 0) {
                const confirmSubmit = window.confirm(
                    `${dailyCollection.membersNotSaved} members have not saved today. Are you sure you want to submit?`
                );
                if (!confirmSubmit) return;
            }
            
            await markGroupAsCompleted(selectedGroup);
            
        } catch (error) {
            console.error('Error submitting daily collection:', error);
            alert('Error submitting: ' + error.message);
        }
    };
    
    const markGroupAsCompleted = async (groupId) => {
        try {
            const group = todayGroups.find(g => g.id === groupId);
            if (!group) return;
            
            const today = new Date().toISOString().split('T')[0];
            
            const { error } = await supabase
                .from('daily_submissions')
                .upsert({
                    group_id: groupId,
                    facilitator_id: user.id,
                    submission_date: today,
                    total_collections: dailyCollection.totalCollected,
                    total_savings: dailyCollection.totalCollected,
                    total_loan_repayments: 0,
                    total_social_fund: Math.floor(dailyCollection.totalCollected * 0.05),
                    total_fines: 0,
                    total_registration: 0,
                    attendance_count: members.length - dailyCollection.membersNotSaved,
                    status: 'submitted',
                    submitted_at: new Date().toISOString()
                }, {
                    onConflict: 'group_id,submission_date'
                });
            
            if (error) throw error;
            
            setDailyCompletion(prev => ({
                ...prev,
                [groupId]: true
            }));
            
            await loadFacilitatorStats();
            
            alert(`Group "${group.group_name}" marked as completed for today!`);
            
            const incompleteGroups = todayGroups.filter(g => !dailyCompletion[g.id]);
            if (incompleteGroups.length > 0) {
                const nextGroup = incompleteGroups.find(g => g.id !== groupId) || incompleteGroups[0];
                
                if (nextGroup && nextGroup.id !== groupId) {
                    setTimeout(() => {
                        setSelectedGroup(nextGroup.id);
                        alert(`Switched to next group: ${nextGroup.group_name}`);
                    }, 1000);
                }
            }
            
        } catch (error) {
            console.error('Error marking group as completed:', error);
            alert('Error: ' + error.message);
        }
    };
    
    const handleCreateGroup = async () => {
        try {
            if (!newGroupForm.group_name.trim()) {
                alert('Group name is required');
                return;
            }
            
            const { data, error } = await supabase
                .from('groups')
                .insert([{
                    ...newGroupForm,
                    facilitator_id: user.id,
                    created_at: new Date().toISOString(),
                    is_active: true
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            await supabase
                .from('facilitator_commissions')
                .insert({
                    facilitator_id: user.id,
                    commission_type: 'group_creation',
                    amount: 5000,
                    description: `Commission for creating group: ${newGroupForm.group_name}`,
                    status: 'pending',
                    group_id: data.id
                });
            
            alert('Group created successfully!');
            setShowCreateGroup(false);
            setNewGroupForm({
                group_name: '',
                meeting_day: 'Monday',
                meeting_time: '10:00',
                meeting_location: '',
                savings_target: '',
                is_active: true
            });
            
            await loadAllGroups();
            await loadTodayGroups();
            
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Error creating group: ' + error.message);
        }
    };
    
    const handleAddMember = async () => {
        try {
            if (!selectedGroup) {
                alert('Please select a group first');
                return;
            }
            
            const memberCount = members.length;
            const memberNumber = `MEM${String(memberCount + 1).padStart(4, '0')}`;
            
            const { data, error } = await supabase
                .from('members')
                .insert([{
                    ...newMemberForm,
                    group_id: selectedGroup,
                    member_number: memberNumber,
                    facilitator_id: user.id,
                    created_at: new Date().toISOString(),
                    is_active: true,
                    opening_balance: parseFloat(newMemberForm.opening_balance) || 0
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            alert('Member added successfully!');
            setShowAddMember(false);
            setNewMemberForm({
                full_name: '',
                phone: '',
                email: '',
                national_id: '',
                gender: 'Male',
                date_of_birth: '',
                occupation: '',
                address: '',
                emergency_contact: '',
                emergency_phone: '',
                opening_balance: 0,
                savings_frequency: 'weekly'
            });
            
            await loadGroupMembers(selectedGroup);
            await loadFacilitatorStats();
            
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Error adding member: ' + error.message);
        }
    };
    
    const handleApplyForLoan = async () => {
        try {
            if (!selectedGroup) {
                alert('Please select a group first');
                return;
            }
            
            if (loanApplicationData.memberLoans.length === 0) {
                alert('Please add at least one member loan');
                return;
            }
            
            const totalAmount = loanApplicationData.memberLoans.reduce((sum, loan) => sum + parseFloat(loan.amount || 0), 0);
            
            const { data: loanApp, error: loanError } = await supabase
                .from('group_loan_applications')
                .insert([{
                    group_id: selectedGroup,
                    facilitator_id: user.id,
                    total_amount: totalAmount,
                    purpose: loanApplicationData.purpose,
                    repayment_period: loanApplicationData.repaymentPeriod,
                    status: 'pending_branch_manager',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (loanError) throw loanError;
            
            const memberLoansData = loanApplicationData.memberLoans.map(loan => ({
                loan_application_id: loanApp.id,
                member_id: loan.memberId,
                loan_amount: loan.amount,
                purpose: loan.purpose,
                status: 'pending'
            }));
            
            const { error: memberLoansError } = await supabase
                .from('application_members')
                .insert(memberLoansData);
            
            if (memberLoansError) throw memberLoansError;
            
            alert('Loan application submitted successfully!');
            setShowLoanApplication(false);
            setLoanApplicationData({
                loanAmount: '',
                memberLoans: [],
                purpose: '',
                repaymentPeriod: 6
            });
            
            await loadLoanApplicationsForGroup(selectedGroup);
            
        } catch (error) {
            console.error('Error applying for loan:', error);
            alert('Error applying for loan: ' + error.message);
        }
    };
    
    const handleRecordExpense = async () => {
        try {
            const { error } = await supabase
                .from('facilitator_expenses')
                .insert([{
                    ...expenseForm,
                    facilitator_id: user.id,
                    amount: parseFloat(expenseForm.amount),
                    date: expenseForm.date,
                    status: 'recorded'
                }]);
            
            if (error) throw error;
            
            alert('Expense recorded successfully!');
            setShowExpense(false);
            setExpenseForm({
                amount: '',
                category: 'transport',
                description: '',
                receipt_number: '',
                date: new Date().toISOString().split('T')[0]
            });
            
            await loadExpenses();
            
        } catch (error) {
            console.error('Error recording expense:', error);
            alert('Error recording expense: ' + error.message);
        }
    };
    
    const viewMemberProfile = async (memberId) => {
        try {
            const { data: memberData, error } = await supabase
                .from('members')
                .select(`
                    *,
                    member_savings(*),
                    member_loans(*),
                    weekly_transactions(*)
                `)
                .eq('id', memberId)
                .single();
            
            if (error) throw error;
            
            setSelectedMember(memberData);
            setActiveTab('member-profile');
            
        } catch (error) {
            console.error('Error loading member profile:', error);
        }
    };
    
    const handleSaveMember = async (memberId, formData) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await supabase
                .from('weekly_transactions')
                .insert([{
                    member_id: memberId,
                    group_id: selectedGroup,
                    facilitator_id: user.id,
                    shares_value: parseInt(formData.shares) * 2000 || 0,
                    loan_repayment: parseFloat(formData.loanRepayment) || 0,
                    registration_payment: parseFloat(formData.registration) || 0,
                    attendance_status: formData.attendance,
                    notes: formData.notes,
                    date_recorded: today,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            await Promise.all([
                loadGroupMembers(selectedGroup),
                loadGroupCollection(selectedGroup),
                loadGroupProgress(selectedGroup),
                loadFacilitatorStats()
            ]);
            
            return { success: true, data };
            
        } catch (error) {
            console.error('Error saving member transaction:', error);
            return { success: false, error: error.message };
        }
    };
    
    // Helper Components
    const StatCard = ({ title, value, Icon, iconClass, subtitle, status = 'neutral' }) => (
        <div className={`stat-card ${status}`}>
            <div className={`stat-icon ${iconClass}`}>
                <Icon size={24} />
            </div>
            <div className="stat-info">
                <h3>{value}</h3>
                <p>{title}</p>
                {subtitle && <small className="stat-subtitle">{subtitle}</small>}
            </div>
            <div className={`stat-trend ${status}`}>
                {status === 'success' ? '↑' : status === 'danger' ? '↓' : '→'}
            </div>
        </div>
    );
    
    // Render Functions
    const renderDashboard = () => {
        const currentGroup = todayGroups.find(g => g.id === selectedGroup) || allGroups.find(g => g.id === selectedGroup);
        
        return (
            <div className="dashboard-content">
                {/* Welcome Header */}
                <div className="welcome-header">
                    <div>
                        <h1>Facilitator Dashboard</h1>
                        <p className="welcome-subtitle">
                            {todayGroups.length > 0 ? `${todayGroups.length} groups today` : 'No groups scheduled today'} • 
                            {lastUpdated ? ` Last updated: ${formatDate(lastUpdated)}` : ' Loading...'}
                            {loading && ' (Refreshing...)'}
                        </p>
                    </div>
                    <div className="header-actions">
                        <div className="group-selector">
                            <select 
                                value={selectedGroup || ''}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="form-select"
                            >
                                <option value="">Select Active Group</option>
                                {todayGroups.length > 0 && (
                                    <optgroup label="Today's Groups">
                                        {todayGroups.map(group => (
                                            <option key={group.id} value={group.id}>
                                                {group.group_name} ({group.meeting_time}) 
                                                {dailyCompletion[group.id] ? ' ✓' : ` (${groupProgress[group.id] || 0}%)`}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                <optgroup label="All Groups">
                                    {allGroups.filter(g => !todayGroups.find(tg => tg.id === g.id)).map(group => (
                                        <option key={group.id} value={group.id}>
                                            {group.group_name} ({group.meeting_day}s)
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <button 
                            className="btn btn-primary" 
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <RefreshCw size={18} /> 
                            {loading ? 'Refreshing...' : 'Refresh All'}
                        </button>
                        <button 
                            className="btn btn-success"
                            onClick={handleSubmitDaily}
                            disabled={!selectedGroup || dailyCompletion[selectedGroup]}
                        >
                            <CheckCircle size={18} /> {dailyCompletion[selectedGroup] ? 'Completed' : 'Complete Group'}
                        </button>
                        {todayGroups.length > 1 && (
                            <button 
                                className="btn btn-info"
                                onClick={switchToNextGroup}
                            >
                                <ArrowRightCircle size={18} /> Next Group
                            </button>
                        )}
                    </div>
                </div>

                {/* Group Management Bar */}
                {todayGroups.length > 0 && (
                    <div className="group-management-bar">
                        <div className="group-summary">
                            <h3><Layers size={20} /> Today's Schedule</h3>
                            <div className="group-status-summary">
                                <span className="status-item completed">
                                    <CheckCircle2 size={14} />
                                    {stats.completedToday} Completed
                                </span>
                                <span className="status-item in-progress">
                                    <ClockIcon size={14} />
                                    {stats.pendingToday} In Progress
                                </span>
                                <span className="status-item upcoming">
                                    <Calendar size={14} />
                                    {stats.upcomingGroups} Upcoming
                                </span>
                            </div>
                        </div>
                        
                        {/* Today's Groups Progress */}
                        <div className="today-groups-progress">
                            {todayGroups.map(group => (
                                <div 
                                    key={group.id} 
                                    className={`group-progress-item ${selectedGroup === group.id ? 'active' : ''} ${dailyCompletion[group.id] ? 'completed' : ''}`}
                                    onClick={() => setSelectedGroup(group.id)}
                                >
                                    <div className="group-progress-header">
                                        <span className="group-name">{group.group_name}</span>
                                        <span className="group-time">{group.meeting_time}</span>
                                        {dailyCompletion[group.id] && (
                                            <span className="completion-badge">
                                                <CheckCircle2 size={12} /> Completed
                                            </span>
                                        )}
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ width: `${groupProgress[group.id] || 0}%` }}
                                        ></div>
                                    </div>
                                    <div className="progress-stats">
                                        <span>{group.members?.[0]?.count || 0} members</span>
                                        <span>{groupProgress[group.id] || 0}% collected</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Key Performance Indicators */}
                <div className="stats-grid">
                    {/* Current Group KPIs */}
                    <div className="stat-card primary">
                        <div className="stat-icon">
                            <Building2 size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{currentGroup?.group_name || 'No Group'}</h3>
                            <p>Current Group</p>
                            <small className="stat-subtitle">
                                {currentGroup ? `${currentGroup.meeting_time} • ${members.length} members` : 'Select a group'}
                            </small>
                        </div>
                    </div>
                    
                    <StatCard 
                        title="Collection Progress" 
                        value={`${dailyCollection.collectionRate}%`} 
                        Icon={Percent}
                        iconClass="collection"
                        subtitle={`${members.length - dailyCollection.membersNotSaved}/${members.length} members`}
                        status="info"
                    />
                    
                    <StatCard 
                        title="Savings Today" 
                        value={formatCurrency(dailyCollection.totalCollected)} 
                        Icon={DollarSign}
                        iconClass="savings"
                        subtitle={`${dailyCollection.collectionRate}% collected`}
                        status="success"
                    />
                    
                    <StatCard 
                        title="Attendance" 
                        value={`${dailyCollection.attendanceRate}%`} 
                        Icon={Users}
                        iconClass="attendance"
                        subtitle={`${stats.presentToday} present`}
                        status="warning"
                    />
                    
                    {/* Today's Summary KPIs */}
                    <StatCard 
                        title="Groups Completed" 
                        value={`${stats.completedToday}/${todayGroups.length}`} 
                        Icon={CheckCircle2}
                        iconClass="groups-completed"
                        subtitle="for today"
                        status="success"
                    />
                    
                    <StatCard 
                        title="Total Members" 
                        value={stats.totalMembers} 
                        Icon={Users}
                        iconClass="total-members"
                        subtitle="across all groups"
                        status="primary"
                    />
                    
                    <StatCard 
                        title="Total Savings Today" 
                        value={formatCurrency(stats.savingsToday)} 
                        Icon={DollarSign}
                        iconClass="total-savings"
                        subtitle="across all groups"
                        status="success"
                    />
                    
                    <StatCard 
                        title="Commission" 
                        value={formatCurrency(stats.commissionThisMonth)} 
                        Icon={Wallet}
                        iconClass="commission"
                        subtitle="this month"
                        status="warning"
                    />
                </div>

                {/* Main Content Area */}
                <div className="content-grid">
                    {/* Current Group Summary */}
                    {currentGroup && (
                        <div className="content-card">
                            <div className="card-header">
                                <h3><Building2 size={20} /> Current Group: {currentGroup.group_name}</h3>
                                <div className="group-actions">
                                    <button 
                                        className="btn btn-sm btn-primary" 
                                        onClick={() => setActiveTab('collection')}
                                    >
                                        <DollarSign size={16} /> Record Collection
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-success" 
                                        onClick={() => setActiveTab('attendance')}
                                    >
                                        <Users size={16} /> Take Attendance
                                    </button>
                                </div>
                            </div>
                            <div className="daily-summary">
                                <div className="daily-stats">
                                    <div className="daily-stat">
                                        <span>Members</span>
                                        <strong>{members.length}</strong>
                                    </div>
                                    <div className="daily-stat">
                                        <span>Saved Today</span>
                                        <strong>{members.length - dailyCollection.membersNotSaved}</strong>
                                    </div>
                                    <div className="daily-stat">
                                        <span>Collection Rate</span>
                                        <strong>{dailyCollection.collectionRate}%</strong>
                                    </div>
                                    <div className="daily-stat">
                                        <span>Status</span>
                                        <strong className={dailyCompletion[currentGroup.id] ? 'success' : 'warning'}>
                                            {dailyCompletion[currentGroup.id] ? 'Completed' : 'In Progress'}
                                        </strong>
                                    </div>
                                </div>
                                <div className="collection-issues">
                                    {dailyCollection.membersNotSaved > 0 && (
                                        <div className="issue-item warning">
                                            <AlertCircle size={16} />
                                            <span>{dailyCollection.membersNotSaved} members not saved</span>
                                        </div>
                                    )}
                                    {dailyCollection.membersMissingRepayment > 0 && (
                                        <div className="issue-item danger">
                                            <AlertCircle size={16} />
                                            <span>{dailyCollection.membersMissingRepayment} missing repayments</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Group Switching */}
                    {todayGroups.length > 0 && (
                        <div className="content-card">
                            <div className="card-header">
                                <h3><ArrowRightCircle size={20} /> Quick Group Switch</h3>
                                <button 
                                    className="btn btn-sm btn-secondary" 
                                    onClick={() => setActiveTab('daily-schedule')}
                                >
                                    View Full Schedule
                                </button>
                            </div>
                            <div className="group-switch-grid">
                                {todayGroups.slice(0, 3).map(group => (
                                    <button
                                        key={group.id}
                                        className={`group-switch-btn ${selectedGroup === group.id ? 'active' : ''} ${dailyCompletion[group.id] ? 'completed' : ''}`}
                                        onClick={() => setSelectedGroup(group.id)}
                                    >
                                        <div className="group-switch-info">
                                            <h4>{group.group_name}</h4>
                                            <p>{group.meeting_time} • {group.members?.[0]?.count || 0} members</p>
                                        </div>
                                        <div className="group-switch-status">
                                            {dailyCompletion[group.id] ? (
                                                <span className="status-badge success">✓ Completed</span>
                                            ) : (
                                                <span className="status-badge warning">{groupProgress[group.id] || 0}%</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {todayGroups.length > 3 && (
                                <div className="view-all-groups">
                                    <button 
                                        className="btn btn-sm"
                                        onClick={() => setActiveTab('daily-schedule')}
                                    >
                                        View all {todayGroups.length} groups for today
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recent Activities */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3><Activity size={20} /> Recent Transactions</h3>
                            <button className="btn btn-sm" onClick={() => setActiveTab('reports')}>
                                View All
                            </button>
                        </div>
                        <div className="activities-list">
                            {recentActivities.length > 0 ? (
                                recentActivities.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="activity-item">
                                        <div className="activity-icon">
                                            {activity.action === 'savings' && <DollarSign size={16} />}
                                            {activity.action === 'loan_repayment' && <Banknote size={16} />}
                                            {activity.action === 'other' && <FileText size={16} />}
                                        </div>
                                        <div className="activity-details">
                                            <p className="activity-description">{activity.description}</p>
                                            <span className="activity-meta">
                                                {activity.group} • {formatDate(activity.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No recent transactions</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="content-card quick-actions-card">
                        <div className="card-header">
                            <h3><Target size={20} /> Quick Actions</h3>
                        </div>
                        <div className="action-buttons-grid">
                            <button 
                                className="action-btn primary"
                                onClick={() => setActiveTab('collection')}
                                disabled={!selectedGroup}
                            >
                                <DollarSign size={20} />
                                <span>Record Collection</span>
                                <small>Current group savings</small>
                            </button>
                            <button 
                                className="action-btn success"
                                onClick={() => setActiveTab('create-group')}
                            >
                                <Plus size={20} />
                                <span>Create Group</span>
                                <small>Start new group</small>
                            </button>
                            <button 
                                className="action-btn warning"
                                onClick={switchToNextGroup}
                                disabled={todayGroups.length <= 1}
                            >
                                <ArrowRightCircle size={20} />
                                <span>Next Group</span>
                                <small>Switch to next group</small>
                            </button>
                            <button 
                                className="action-btn info"
                                onClick={handleSubmitDaily}
                                disabled={!selectedGroup || dailyCompletion[selectedGroup]}
                            >
                                <CheckCircle size={20} />
                                <span>Complete Group</span>
                                <small>Finish current group</small>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Performance Overview */}
                {todayGroups.length > 0 && (
                    <div className="charts-section">
                        <h3><BarChart3 size={24} /> Today's Progress</h3>
                        <div className="charts-grid">
                            <div className="chart-placeholder">
                                <div className="chart-header">
                                    <h4>Group Completion Status</h4>
                                </div>
                                <div className="chart-content">
                                    <div className="completion-chart">
                                        {todayGroups.map((group, index) => (
                                            <div key={group.id} className="completion-bar">
                                                <div className="bar-label">{group.group_name}</div>
                                                <div className="bar-container">
                                                    <div 
                                                        className={`bar-fill ${dailyCompletion[group.id] ? 'completed' : 'in-progress'}`}
                                                        style={{ width: `${groupProgress[group.id] || 0}%` }}
                                                    >
                                                        <span className="bar-percentage">{groupProgress[group.id] || 0}%</span>
                                                    </div>
                                                </div>
                                                <div className="bar-time">{group.meeting_time}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="chart-placeholder">
                                <div className="chart-header">
                                    <h4>Collection Summary</h4>
                                </div>
                                <div className="chart-content">
                                    <div className="summary-stats">
                                        <div className="summary-stat">
                                            <div className="stat-value">{stats.completedToday}</div>
                                            <div className="stat-label">Groups Completed</div>
                                        </div>
                                        <div className="summary-stat">
                                            <div className="stat-value">{formatCurrency(stats.savingsToday)}</div>
                                            <div className="stat-label">Total Collected</div>
                                        </div>
                                        <div className="summary-stat">
                                            <div className="stat-value">{stats.totalMembers}</div>
                                            <div className="stat-label">Total Members</div>
                                        </div>
                                        <div className="summary-stat">
                                            <div className="stat-value">{stats.savedToday}</div>
                                            <div className="stat-label">Members Saved</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    const renderDailyScheduleTab = () => {
        const groupsByDay = allGroups.reduce((acc, group) => {
            const day = group.meeting_day;
            if (!acc[day]) acc[day] = [];
            acc[day].push(group);
            return acc;
        }, {});

        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><ListChecks size={28} /> Weekly Schedule</h2>
                    <p>Manage your groups by day of the week</p>
                </div>
                
                <div className="schedule-controls">
                    <div className="date-selector">
                        <label>Selected Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    <div className="today-indicator">
                        <span className="today-badge">
                            Today: {today}
                        </span>
                    </div>
                </div>
                
                {/* Today's Priority Section */}
                <div className="content-card priority-card">
                    <div className="card-header">
                        <h3><Target size={20} /> Today's Priority ({today})</h3>
                        <span className="completion-summary">
                            {stats.completedToday} of {todayGroups.length} completed
                        </span>
                    </div>
                    
                    {todayGroups.length > 0 ? (
                        <div className="priority-groups">
                            {todayGroups.map((group, index) => {
                                const isCurrent = selectedGroup === group.id;
                                const isCompleted = dailyCompletion[group.id];
                                const progress = groupProgress[group.id] || 0;
                                
                                return (
                                    <div 
                                        key={group.id} 
                                        className={`priority-group-item ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                                        onClick={() => {
                                            setSelectedGroup(group.id);
                                            setActiveTab('collection');
                                        }}
                                    >
                                        <div className="priority-group-header">
                                            <div className="group-sequence">
                                                <span className="sequence-number">{index + 1}</span>
                                            </div>
                                            <div className="group-details">
                                                <h4>{group.group_name}</h4>
                                                <div className="group-meta">
                                                    <span className="meta-item">
                                                        <ClockIcon size={12} /> {group.meeting_time}
                                                    </span>
                                                    <span className="meta-item">
                                                        <Users size={12} /> {group.members?.[0]?.count || 0} members
                                                    </span>
                                                    <span className="meta-item">
                                                        <Building2 size={12} /> {group.meeting_location || 'Location not set'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="group-actions">
                                                {isCompleted ? (
                                                    <span className="status-badge success">
                                                        <CheckCircle2 size={14} /> Completed
                                                    </span>
                                                ) : (
                                                    <span className="status-badge warning">
                                                        <ClockIcon size={14} /> {progress}% collected
                                                    </span>
                                                )}
                                                <button 
                                                    className="btn btn-sm btn-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedGroup(group.id);
                                                        setActiveTab('collection');
                                                    }}
                                                >
                                                    <ArrowRightCircle size={14} /> Go to Group
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="progress-container">
                                            <div className="progress-labels">
                                                <span>Collection Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div 
                                                    className={`progress-fill ${isCompleted ? 'completed' : 'in-progress'}`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        
                                        <div className="group-quick-stats">
                                            <div className="quick-stat">
                                                <span>Members</span>
                                                <strong>{group.members?.[0]?.count || 0}</strong>
                                            </div>
                                            <div className="quick-stat">
                                                <span>Avg Savings</span>
                                                <strong>{formatCurrency(group.avg_savings || 0)}</strong>
                                            </div>
                                            <div className="quick-stat">
                                                <span>Active Loans</span>
                                                <strong>{group.active_loans || 0}</strong>
                                            </div>
                                            <div className="quick-stat">
                                                <span>Status</span>
                                                <strong className={isCompleted ? 'success' : 'warning'}>
                                                    {isCompleted ? 'Completed' : 'In Progress'}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-groups-today">
                            <Calendar size={48} />
                            <h4>No groups scheduled for today</h4>
                            <p>You have no groups scheduled for {today}. Check other days or create a new group.</p>
                        </div>
                    )}
                </div>
                
                {/* Weekly Schedule */}
                <div className="content-card">
                    <div className="card-header">
                        <h3><Calendar size={20} /> Weekly Schedule</h3>
                        <span className="total-groups">{allGroups.length} total groups</span>
                    </div>
                    
                    <div className="weekly-schedule">
                        {daysOrder.map(day => {
                            const dayGroups = groupsByDay[day] || [];
                            const isToday = day === today;
                            
                            return (
                                <div key={day} className={`schedule-day ${isToday ? 'today' : ''}`}>
                                    <div className="day-header">
                                        <h4>{day} {isToday && <span className="today-indicator">Today</span>}</h4>
                                        <span className="group-count">{dayGroups.length} groups</span>
                                    </div>
                                    
                                    {dayGroups.length > 0 ? (
                                        <div className="day-groups">
                                            {dayGroups.map(group => {
                                                const isSelected = selectedGroup === group.id;
                                                const isCompleted = dailyCompletion[group.id];
                                                const isTodayGroup = todayGroups.some(g => g.id === group.id);
                                                
                                                return (
                                                    <div 
                                                        key={group.id} 
                                                        className={`day-group-item ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''} ${isTodayGroup ? 'today-group' : ''}`}
                                                        onClick={() => {
                                                            setSelectedGroup(group.id);
                                                            setActiveTab('collection');
                                                        }}
                                                    >
                                                        <div className="group-time">
                                                            {group.meeting_time}
                                                        </div>
                                                        <div className="group-info">
                                                            <strong>{group.group_name}</strong>
                                                            <small>{group.members?.[0]?.count || 0} members</small>
                                                        </div>
                                                        <div className="group-status">
                                                            {isCompleted ? (
                                                                <span className="status-dot completed"></span>
                                                            ) : isTodayGroup ? (
                                                                <span className="status-dot today"></span>
                                                            ) : (
                                                                <span className="status-dot pending"></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="no-groups-day">
                                            <p>No groups scheduled</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Quick Stats */}
                <div className="content-card">
                    <div className="card-header">
                        <h3>Schedule Statistics</h3>
                    </div>
                    <div className="schedule-stats">
                        <div className="stat-item">
                            <div className="stat-value">{allGroups.length}</div>
                            <div className="stat-label">Total Groups</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{todayGroups.length}</div>
                            <div className="stat-label">Today's Groups</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{stats.completedToday}</div>
                            <div className="stat-label">Completed Today</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{allGroups.reduce((sum, g) => sum + (g.members?.[0]?.count || 0), 0)}</div>
                            <div className="stat-label">Total Members</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderDailyCollection = () => {
        const currentGroup = allGroups.find(g => g.id === selectedGroup);
        
        if (!selectedGroup) {
            return (
                <div className="tab-content">
                    <div className="tab-header">
                        <h2><DollarSign size={28} /> Daily Collection</h2>
                        <p>Please select a group to start recording collections</p>
                    </div>
                    <div className="no-group-selected">
                        <Building2 size={48} />
                        <h3>No Group Selected</h3>
                        <p>Select a group from the dashboard or daily schedule to start recording collections.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <ArrowRightCircle size={18} /> Go to Dashboard
                        </button>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><DollarSign size={28} /> Daily Collection - {currentGroup?.group_name}</h2>
                    <p>Record daily savings, loan repayments, and attendance for {currentGroup?.group_name}</p>
                </div>
                
                {/* Collection Summary */}
                <div className="content-card">
                    <div className="card-header">
                        <h3><DollarSign size={20} /> Today's Collection Summary</h3>
                        <div className="collection-status">
                            <span className={`status-badge ${dailyCompletion[selectedGroup] ? 'success' : 'warning'}`}>
                                {dailyCompletion[selectedGroup] ? 'Completed' : 'In Progress'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="collection-summary-stats">
                        <div className="summary-stat">
                            <div className="stat-value">{formatCurrency(dailyCollection.totalCollected)}</div>
                            <div className="stat-label">Total Collected Today</div>
                        </div>
                        <div className="summary-stat">
                            <div className="stat-value">{dailyCollection.collectionRate}%</div>
                            <div className="stat-label">Collection Rate</div>
                        </div>
                        <div className="summary-stat">
                            <div className="stat-value">{members.length - dailyCollection.membersNotSaved}/{members.length}</div>
                            <div className="stat-label">Members Saved</div>
                        </div>
                        <div className="summary-stat">
                            <div className="stat-value">{formatCurrency(dailyCollection.expectedToday)}</div>
                            <div className="stat-label">Expected Today</div>
                        </div>
                    </div>
                    
                    {dailyCollection.membersNotSaved > 0 && (
                        <div className="collection-alert warning">
                            <AlertCircle size={20} />
                            <div>
                                <strong>{dailyCollection.membersNotSaved} members haven't saved today</strong>
                                <p>Remind these members to make their savings contributions</p>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Members Collection Table */}
                <div className="content-card">
                    <div className="card-header">
                        <h3><Users size={20} /> Member Collection Records</h3>
                        <div className="collection-filters">
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-control"
                            />
                            <select
                                value={memberFilter}
                                onChange={(e) => setMemberFilter(e.target.value)}
                                className="form-select"
                            >
                                <option value="all">All Members</option>
                                <option value="not_saved">Not Saved Today</option>
                                <option value="has_loan">Has Active Loan</option>
                                <option value="below_minimum">Below Minimum</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="members-collection-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member Name</th>
                                    <th>Member Number</th>
                                    <th>Savings Today</th>
                                    <th>Loan Repayment</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.length > 0 ? (
                                    filteredMembers.map((member) => (
                                        <tr key={member.member_id}>
                                            <td>
                                                <div className="member-info">
                                                    <strong>{member.member_name}</strong>
                                                    <small>{member.phone}</small>
                                                </div>
                                            </td>
                                            <td>{member.member_number}</td>
                                            <td>
                                                {member.saved_today ? (
                                                    <span className="success">{formatCurrency(member.today_savings)}</span>
                                                ) : (
                                                    <span className="danger">Not Saved</span>
                                                )}
                                            </td>
                                            <td>
                                                {member.has_active_loan ? (
                                                    <span className="warning">Balance: {formatCurrency(member.loan_balance)}</span>
                                                ) : (
                                                    <span>No Loan</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${member.saved_today ? 'success' : 'danger'}`}>
                                                    {member.status_summary}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => {
                                                        alert(`Record transaction for ${member.member_name}`);
                                                    }}
                                                >
                                                    <Edit size={14} /> Record
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data">
                                            No members found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Quick Actions */}
                <div className="content-card">
                    <div className="card-header">
                        <h3><Target size={20} /> Collection Actions</h3>
                    </div>
                    <div className="action-buttons">
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmitDaily}
                            disabled={dailyCompletion[selectedGroup]}
                        >
                            <CheckCircle size={18} /> Submit Daily Collection
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => alert('Mark all as saved feature')}
                        >
                            <Check size={18} /> Mark All as Saved
                        </button>
                        <button
                            className="btn btn-warning"
                            onClick={() => setActiveTab('attendance')}
                        >
                            <Users size={18} /> Take Attendance
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderMemberManagement = () => {
        const currentGroup = allGroups.find(g => g.id === selectedGroup);
        
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><Users size={28} /> Member Management</h2>
                    <p>Manage members for {currentGroup?.group_name || 'selected group'}</p>
                </div>
                
                {/* Member Statistics */}
                <div className="stats-grid">
                    <StatCard 
                        title="Total Members" 
                        value={members.length} 
                        Icon={Users}
                        status="primary"
                    />
                    
                    <StatCard 
                        title="Total Group Savings" 
                        value={formatCurrency(stats.totalSavings)} 
                        Icon={DollarSign}
                        status="success"
                    />
                    
                    <StatCard 
                        title="Members with Loans" 
                        value={stats.membersWithLoans} 
                        Icon={CreditCard}
                        status="warning"
                    />
                    
                    <StatCard 
                        title="Saved Today" 
                        value={stats.savedToday} 
                        Icon={TrendingUp}
                        status="info"
                    />
                </div>
                
                {/* Member List */}
                <div className="content-card">
                    <div className="card-header">
                        <h3><Users size={20} /> Member List</h3>
                        <div className="member-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddMember(true)}
                            >
                                <UserPlus size={16} /> Add Member
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => alert('Export feature')}
                            >
                                <Download size={16} /> Export
                            </button>
                        </div>
                    </div>
                    
                    <div className="members-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member #</th>
                                    <th>Full Name</th>
                                    <th>Phone</th>
                                    <th>Savings Balance</th>
                                    <th>Loan Status</th>
                                    <th>Last Activity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.slice(0, 10).map((member) => (
                                    <tr key={member.member_id}>
                                        <td>{member.member_number}</td>
                                        <td>
                                            <div className="member-info">
                                                <strong>{member.member_name}</strong>
                                                <small>Member</small>
                                            </div>
                                        </td>
                                        <td>{member.phone}</td>
                                        <td>
                                            <span className="success">{formatCurrency(member.today_savings)}</span>
                                        </td>
                                        <td>
                                            {member.has_active_loan ? (
                                                <span className="warning">Active Loan</span>
                                            ) : (
                                                <span className="success">No Loan</span>
                                            )}
                                        </td>
                                        <td>
                                            {member.saved_today ? (
                                                <span className="success">Today</span>
                                            ) : (
                                                <span className="danger">Not Today</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => viewMemberProfile(member.member_id)}
                                                    title="View Profile"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => alert(`Edit ${member.member_name}`)}
                                                    title="Edit"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                            </div>
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
    
    const renderLoanManagement = () => {
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><CreditCard size={28} /> Member Loans</h2>
                    <p>Manage and track member loans</p>
                </div>
                
                {/* Loan Statistics */}
                <div className="stats-grid">
                    <StatCard 
                        title="Active Loans" 
                        value={stats.activeLoans} 
                        Icon={CreditCard}
                        status="primary"
                    />
                    
                    <StatCard 
                        title="Overdue Loans" 
                        value={stats.overdueLoans} 
                        Icon={AlertCircle}
                        status="warning"
                    />
                    
                    <StatCard 
                        title="Total Outstanding" 
                        value={formatCurrency(stats.totalOutstanding)} 
                        Icon={DollarSign}
                        status="success"
                    />
                    
                    <StatCard 
                        title="Average Repayment" 
                        value={formatCurrency(stats.averageRepayment)} 
                        Icon={TrendingUp}
                        status="info"
                    />
                </div>
                
                {/* Loan Applications */}
                <div className="content-card">
                    <div className="card-header">
                        <h3><FileText size={20} /> Recent Loan Applications</h3>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowLoanApplication(true)}
                        >
                            <Plus size={16} /> New Application
                        </button>
                    </div>
                    
                    <div className="loan-applications">
                        {loanApplications.length > 0 ? (
                            loanApplications.map((application) => (
                                <div key={application.id} className="loan-application-item">
                                    <div className="application-info">
                                        <h4>Application #{application.id}</h4>
                                        <div className="application-details">
                                            <span>Amount: {formatCurrency(application.total_amount)}</span>
                                            <span>Purpose: {application.purpose}</span>
                                            <span>Status: {application.status}</span>
                                        </div>
                                    </div>
                                    <div className="application-actions">
                                        <button className="btn btn-sm">View Details</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">No loan applications</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };
    
    const renderAttendanceTracking = () => {
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><Calendar size={28} /> Attendance Tracking</h2>
                    <p>Record and track member attendance</p>
                </div>
                
                <div className="content-card">
                    <div className="card-header">
                        <h3><Users size={20} /> Today's Attendance - {allGroups.find(g => g.id === selectedGroup)?.group_name}</h3>
                        <div className="attendance-summary">
                            <span className="attendance-rate">{dailyCollection.attendanceRate}% Present</span>
                        </div>
                    </div>
                    
                    <div className="attendance-grid">
                        {members.map((member) => (
                            <div key={member.member_id} className="attendance-card">
                                <div className="member-avatar">
                                    <Users size={24} />
                                </div>
                                <div className="member-details">
                                    <h5>{member.member_name}</h5>
                                    <small>{member.member_number}</small>
                                </div>
                                <div className="attendance-status">
                                    <select className="form-select" defaultValue="present">
                                        <option value="present">Present</option>
                                        <option value="absent">Absent</option>
                                        <option value="excused">Excused</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="attendance-actions">
                        <button className="btn btn-primary">
                            <Check size={18} /> Save Attendance
                        </button>
                        <button className="btn btn-secondary">
                            <Download size={18} /> Export Report
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderDailyReport = () => {
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><FileText size={28} /> Daily Report</h2>
                    <p>View and generate daily reports</p>
                </div>
                
                <div className="content-card">
                    <div className="card-header">
                        <h3><Calendar size={20} /> Today's Summary</h3>
                        <button className="btn btn-primary">
                            <Download size={16} /> Download Report
                        </button>
                    </div>
                    
                    <div className="report-summary">
                        <div className="report-section">
                            <h4>Collection Summary</h4>
                            <div className="report-stats">
                                <div className="report-stat">
                                    <span>Total Collected:</span>
                                    <strong>{formatCurrency(dailyCollection.totalCollected)}</strong>
                                </div>
                                <div className="report-stat">
                                    <span>Collection Rate:</span>
                                    <strong>{dailyCollection.collectionRate}%</strong>
                                </div>
                                <div className="report-stat">
                                    <span>Members Saved:</span>
                                    <strong>{members.length - dailyCollection.membersNotSaved}/{members.length}</strong>
                                </div>
                            </div>
                        </div>
                        
                        <div className="report-section">
                            <h4>Recent Transactions</h4>
                            <div className="transactions-list">
                                {recentActivities.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="transaction-item">
                                        <div className="transaction-icon">
                                            {activity.action === 'savings' && <DollarSign size={16} />}
                                            {activity.action === 'loan_repayment' && <Banknote size={16} />}
                                        </div>
                                        <div className="transaction-details">
                                            <p>{activity.description}</p>
                                            <small>{formatDate(activity.timestamp)}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderGroupOverview = () => {
        const currentGroup = allGroups.find(g => g.id === selectedGroup);
        
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><Building2 size={28} /> Group Overview</h2>
                    <p>Detailed overview of {currentGroup?.group_name || 'selected group'}</p>
                </div>
                
                {currentGroup && (
                    <>
                        <div className="content-card">
                            <div className="card-header">
                                <h3><Building2 size={20} /> {currentGroup.group_name}</h3>
                                <div className="group-meta">
                                    <span>{currentGroup.meeting_day}s at {currentGroup.meeting_time}</span>
                                </div>
                            </div>
                            
                            <div className="group-details">
                                <div className="detail-item">
                                    <span>Meeting Location:</span>
                                    <strong>{currentGroup.meeting_location || 'Not specified'}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Members Count:</span>
                                    <strong>{members.length} members</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Total Savings:</span>
                                    <strong className="success">{formatCurrency(stats.totalSavings)}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Active Loans:</span>
                                    <strong className="warning">{stats.activeLoans}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Today's Status:</span>
                                    <strong className={dailyCompletion[currentGroup.id] ? 'success' : 'warning'}>
                                        {dailyCompletion[currentGroup.id] ? 'Completed' : 'In Progress'}
                                    </strong>
                                </div>
                            </div>
                        </div>
                        
                        <div className="content-card">
                            <div className="card-header">
                                <h3><TrendingUp size={20} /> Performance Metrics</h3>
                            </div>
                            <div className="performance-metrics">
                                <div className="metric">
                                    <div className="metric-label">Attendance Rate</div>
                                    <div className="metric-value">{dailyCollection.attendanceRate}%</div>
                                </div>
                                <div className="metric">
                                    <div className="metric-label">Collection Rate</div>
                                    <div className="metric-value">{dailyCollection.collectionRate}%</div>
                                </div>
                                <div className="metric">
                                    <div className="metric-label">Savings Growth</div>
                                    <div className="metric-value">+12%</div>
                                </div>
                                <div className="metric">
                                    <div className="metric-label">Member Retention</div>
                                    <div className="metric-value">95%</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };
    
    const renderCreateGroupTab = () => {
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><Plus size={28} /> Create New Group</h2>
                    <p>Start a new SACCO group</p>
                </div>
                
                <div className="content-card">
                    <div className="card-header">
                        <h3><Building2 size={20} /> Group Information</h3>
                    </div>
                    
                    <div className="form-group">
                        <label>Group Name *</label>
                        <input
                            type="text"
                            value={newGroupForm.group_name}
                            onChange={(e) => setNewGroupForm({...newGroupForm, group_name: e.target.value})}
                            className="form-control"
                            placeholder="Enter group name"
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Meeting Day *</label>
                            <select
                                value={newGroupForm.meeting_day}
                                onChange={(e) => setNewGroupForm({...newGroupForm, meeting_day: e.target.value})}
                                className="form-select"
                            >
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                                <option value="Sunday">Sunday</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Meeting Time *</label>
                            <input
                                type="time"
                                value={newGroupForm.meeting_time}
                                onChange={(e) => setNewGroupForm({...newGroupForm, meeting_time: e.target.value})}
                                className="form-control"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Meeting Location</label>
                        <input
                            type="text"
                            value={newGroupForm.meeting_location}
                            onChange={(e) => setNewGroupForm({...newGroupForm, meeting_location: e.target.value})}
                            className="form-control"
                            placeholder="Enter meeting location"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Monthly Savings Target (UGX)</label>
                        <input
                            type="number"
                            value={newGroupForm.savings_target}
                            onChange={(e) => setNewGroupForm({...newGroupForm, savings_target: e.target.value})}
                            className="form-control"
                            placeholder="Enter target amount"
                        />
                    </div>
                    
                    <div className="form-actions">
                        <button className="btn btn-primary" onClick={handleCreateGroup}>
                            <Plus size={18} /> Create Group
                        </button>
                        <button className="btn btn-secondary" onClick={() => setShowCreateGroup(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderGroupLoansTab = () => {
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><Briefcase size={28} /> Group Loans</h2>
                    <p>Manage group loan applications and disbursements</p>
                </div>
                
                <div className="content-card">
                    <div className="card-header">
                        <h3><FileText size={20} /> Group Loan Applications</h3>
                        <button className="btn btn-primary">
                            <Plus size={16} /> New Group Loan
                        </button>
                    </div>
                    
                    <div className="loan-applications-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Application #</th>
                                    <th>Group</th>
                                    <th>Amount</th>
                                    <th>Purpose</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loanApplications.map((app) => (
                                    <tr key={app.id}>
                                        <td>#{app.id}</td>
                                        <td>{app.groups?.group_name}</td>
                                        <td>{formatCurrency(app.total_amount)}</td>
                                        <td>{app.purpose}</td>
                                        <td>
                                            <span className={`status-badge ${app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td>{new Date(app.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-sm">View</button>
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
    
    const renderCommissionsTab = () => {
        const currentPeriodData = commissionData[commissionPeriod] || [];
        const { summary } = commissionData;
        
        // Calculate period totals
        const periodTotalLoans = currentPeriodData.reduce((sum, calc) => sum + (calc.total_loans_issued || 0), 0);
        const periodTotalInterest = currentPeriodData.reduce((sum, calc) => sum + (calc.total_interest_generated || 0), 0);
        const periodTotalFees = currentPeriodData.reduce((sum, calc) => sum + (calc.processing_fee_generated || 0), 0);
        const periodTotalCommission = currentPeriodData.reduce((sum, calc) => sum + (calc.commission_eligible_amount || 0), 0);
        
        // Calculate member-level example
        const calculateMemberExample = (loanAmount) => {
            const interest = loanAmount * 0.10;
            const processingFee = 10000;
            const savingsDeposit = loanAmount * 0.10;
            const netAmount = loanAmount - interest - processingFee;
            
            return { interest, processingFee, savingsDeposit, netAmount };
        };
        
        const example100k = calculateMemberExample(100000);
        const example200k = calculateMemberExample(200000);
        const example300k = calculateMemberExample(300000);
        
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><Wallet size={28} /> Loan Processing Commissions</h2>
                    <p>Track your commissions from loan processing fees (1% of 10,000 UGX per member)</p>
                </div>
                
                {/* Loan Calculation Example */}
                <div className="content-card example-card">
                    <div className="card-header">
                        <h3><Calculator size={20} /> Loan Disbursement Example</h3>
                        <small>How loan amounts are calculated for members</small>
                    </div>
                    
                    <div className="loan-example">
                        <div className="example-header">
                            <h4>Example: 3 Members Requesting Loans</h4>
                            <p>Total Group Loan: 600,000 UGX</p>
                        </div>
                        
                        <div className="example-grid">
                            {/* Member 1: 100,000 UGX */}
                            <div className="example-member">
                                <div className="member-header">
                                    <h5>Member 1</h5>
                                    <span className="requested-amount">Requests: 100,000 UGX</span>
                                </div>
                                <div className="deductions-list">
                                    <div className="deduction-item">
                                        <span>SACCO Interest (10%)</span>
                                        <span className="deduction-amount danger">-10,000 UGX</span>
                                    </div>
                                    <div className="deduction-item">
                                        <span>Processing Fee</span>
                                        <span className="deduction-amount warning">-10,000 UGX</span>
                                    </div>
                                    <div className="deduction-item">
                                        <span>Savings Deposit (10%)</span>
                                        <span className="deduction-amount success">+10,000 UGX</span>
                                    </div>
                                    <div className="net-amount">
                                        <span>Member Receives</span>
                                        <strong>{formatCurrency(example100k.netAmount)}</strong>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Member 2: 200,000 UGX */}
                            <div className="example-member">
                                <div className="member-header">
                                    <h5>Member 2</h5>
                                    <span className="requested-amount">Requests: 200,000 UGX</span>
                                </div>
                                <div className="deductions-list">
                                    <div className="deduction-item">
                                        <span>SACCO Interest (10%)</span>
                                        <span className="deduction-amount danger">-20,000 UGX</span>
                                    </div>
                                    <div className="deduction-item">
                                        <span>Processing Fee</span>
                                        <span className="deduction-amount warning">-10,000 UGX</span>
                                    </div>
                                    <div className="deduction-item">
                                        <span>Savings Deposit (10%)</span>
                                        <span className="deduction-amount success">+20,000 UGX</span>
                                    </div>
                                    <div className="net-amount">
                                        <span>Member Receives</span>
                                        <strong>{formatCurrency(example200k.netAmount)}</strong>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Member 3: 300,000 UGX */}
                            <div className="example-member">
                                <div className="member-header">
                                    <h5>Member 3</h5>
                                    <span className="requested-amount">Requests: 300,000 UGX</span>
                                </div>
                                <div className="deductions-list">
                                    <div className="deduction-item">
                                        <span>SACCO Interest (10%)</span>
                                        <span className="deduction-amount danger">-30,000 UGX</span>
                                    </div>
                                    <div className="deduction-item">
                                        <span>Processing Fee</span>
                                        <span className="deduction-amount warning">-10,000 UGX</span>
                                    </div>
                                    <div className="deduction-item">
                                        <span>Savings Deposit (10%)</span>
                                        <span className="deduction-amount success">+30,000 UGX</span>
                                    </div>
                                    <div className="net-amount">
                                        <span>Member Receives</span>
                                        <strong>{formatCurrency(example300k.netAmount)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="example-summary">
                            <div className="summary-item">
                                <span>Total SACCO Interest Earned</span>
                                <strong className="success">60,000 UGX</strong>
                            </div>
                            <div className="summary-item">
                                <span>Total Processing Fees</span>
                                <strong className="warning">30,000 UGX</strong>
                            </div>
                            <div className="summary-item">
                                <span>Your Commission (1%)</span>
                                <strong className="primary">300 UGX</strong>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Commission Period Selector */}
                <div className="commission-period-selector">
                    <div className="period-buttons">
                        <button
                            className={`period-btn ${commissionPeriod === 'daily' ? 'active' : ''}`}
                            onClick={() => setCommissionPeriod('daily')}
                        >
                            <Calendar size={16} /> Daily
                        </button>
                        <button
                            className={`period-btn ${commissionPeriod === 'weekly' ? 'active' : ''}`}
                            onClick={() => setCommissionPeriod('weekly')}
                        >
                            <Calendar size={16} /> Weekly
                        </button>
                        <button
                            className={`period-btn ${commissionPeriod === 'monthly' ? 'active' : ''}`}
                            onClick={() => setCommissionPeriod('monthly')}
                        >
                            <Calendar size={16} /> Monthly
                        </button>
                    </div>
                </div>
                
                {/* Performance Summary Cards */}
                <div className="stats-grid">
                    <StatCard 
                        title="SACCO Interest Earned" 
                        value={formatCurrency(periodTotalInterest)} 
                        Icon={TrendingUp}
                        subtitle="10% from all member loans"
                        status="success"
                    />
                    
                    <StatCard 
                        title="Total Processing Fees" 
                        value={formatCurrency(periodTotalFees)} 
                        Icon={DollarSign}
                        subtitle="10,000 UGX per member"
                        status="warning"
                    />
                    
                    <StatCard 
                        title="Your Commission" 
                        value={formatCurrency(periodTotalCommission)} 
                        Icon={Wallet}
                        subtitle="1% of processing fees"
                        status="primary"
                    />
                    
                    <StatCard 
                        title="Members Served" 
                        value={Math.round(periodTotalFees / 10000)} 
                        Icon={Users}
                        subtitle="Received loans this period"
                        status="info"
                    />
                </div>
                
                {/* Current Period Breakdown */}
                <div className="content-card">
                    <div className="card-header">
                        <h3>{commissionPeriod.charAt(0).toUpperCase() + commissionPeriod.slice(1)} Commission Breakdown</h3>
                        <div className="period-totals">
                            <span className="total-item">
                                <span>Members:</span>
                                <strong>{Math.round(periodTotalFees / 10000)}</strong>
                            </span>
                            <span className="total-item">
                                <span>Fees:</span>
                                <strong>{formatCurrency(periodTotalFees)}</strong>
                            </span>
                            <span className="total-item">
                                <span>Your Cut:</span>
                                <strong>{formatCurrency(periodTotalCommission)}</strong>
                            </span>
                        </div>
                    </div>
                    
                    {/* Commission Calculation */}
                    <div className="commission-calculation">
                        <h4>Commission Calculation Formula</h4>
                        <div className="calculation-formula">
                            <div className="formula-step">
                                <span className="step-number">1</span>
                                <div className="step-content">
                                    <p>Processing Fee per Member = <strong>10,000 UGX</strong></p>
                                </div>
                            </div>
                            <div className="formula-step">
                                <span className="step-number">2</span>
                                <div className="step-content">
                                    <p>Total Processing Fees = Members × 10,000 UGX</p>
                                    <code>{Math.round(periodTotalFees / 10000)} members × 10,000 = {formatCurrency(periodTotalFees)}</code>
                                </div>
                            </div>
                            <div className="formula-step">
                                <span className="step-number">3</span>
                                <div className="step-content">
                                    <p>Your Commission = Total Fees × 1%</p>
                                    <code>{formatCurrency(periodTotalFees)} × 1% = {formatCurrency(periodTotalCommission)}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Detailed Transactions */}
                    <div className="transactions-table">
                        <h4>Detailed Loan Transactions</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Group</th>
                                    <th>Members</th>
                                    <th>Total Loans</th>
                                    <th>SACCO Interest</th>
                                    <th>Processing Fees</th>
                                    <th>Your Commission</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentPeriodData.length > 0 ? (
                                    currentPeriodData.map((calculation) => {
                                        const membersCount = calculation.processing_fee_generated / 10000;
                                        
                                        return (
                                            <tr key={calculation.id}>
                                                <td>
                                                    {new Date(calculation.calculation_date).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    {calculation.group_id ? 
                                                        allGroups.find(g => g.id === calculation.group_id)?.group_name || 
                                                        'Multiple Groups' : 
                                                        'All Groups'}
                                                </td>
                                                <td>{membersCount}</td>
                                                <td>{formatCurrency(calculation.total_loans_issued)}</td>
                                                <td className="success">
                                                    {formatCurrency(calculation.total_interest_generated)}
                                                </td>
                                                <td className="warning">
                                                    {formatCurrency(calculation.processing_fee_generated)}
                                                </td>
                                                <td className="primary">
                                                    {formatCurrency(calculation.commission_eligible_amount)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="no-data">
                                            No loan transactions this period
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
    
    const renderPerformanceTab = () => {
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><ChartBar size={28} /> Performance Analytics</h2>
                    <p>Track your performance metrics and analytics</p>
                </div>
                
                <div className="content-card">
                    <div className="card-header">
                        <h3><TrendingUp size={20} /> Performance Overview</h3>
                        <div className="view-selector">
                            <select
                                value={performanceView}
                                onChange={(e) => setPerformanceView(e.target.value)}
                                className="form-select"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="performance-stats">
                        <div className="performance-stat">
                            <h4>Total Savings Collected</h4>
                            <div className="stat-value">{formatCurrency(stats.totalSavings)}</div>
                            <div className="stat-trend success">↑ 12% from last month</div>
                        </div>
                        
                        <div className="performance-stat">
                            <h4>Members Growth</h4>
                            <div className="stat-value">{stats.totalMembers}</div>
                            <div className="stat-trend success">↑ 8% from last month</div>
                        </div>
                        
                        <div className="performance-stat">
                            <h4>Commission Earned</h4>
                            <div className="stat-value">{formatCurrency(stats.commissionThisMonth)}</div>
                            <div className="stat-trend warning">→ Same as last month</div>
                        </div>
                        
                        <div className="performance-stat">
                            <h4>Groups Managed</h4>
                            <div className="stat-value">{stats.totalGroups}</div>
                            <div className="stat-trend success">↑ 2 new groups</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderMemberProfile = () => {
        if (!selectedMember) {
            return (
                <div className="tab-content">
                    <div className="tab-header">
                        <h2><Users size={28} /> Member Profile</h2>
                        <p>No member selected</p>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="tab-content">
                <div className="tab-header">
                    <h2><Users size={28} /> Member Profile</h2>
                    <p>Detailed information about {selectedMember.full_name}</p>
                </div>
                
                <div className="content-card">
                    <div className="card-header">
                        <h3><Users size={20} /> {selectedMember.full_name}</h3>
                        <div className="member-status">
                            <span className="status-badge success">Active Member</span>
                        </div>
                    </div>
                    
                    <div className="member-details">
                        <div className="detail-section">
                            <h4>Personal Information</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span>Member Number:</span>
                                    <strong>{selectedMember.member_number}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Phone:</span>
                                    <strong>{selectedMember.phone}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Email:</span>
                                    <strong>{selectedMember.email || 'Not provided'}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>National ID:</span>
                                    <strong>{selectedMember.national_id}</strong>
                                </div>
                            </div>
                        </div>
                        
                        <div className="detail-section">
                            <h4>Financial Information</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span>Total Savings:</span>
                                    <strong className="success">{formatCurrency(selectedMember.total_savings || 0)}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Active Loans:</span>
                                    <strong className="warning">{selectedMember.active_loans || 0}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Last Activity:</span>
                                    <strong>{formatDate(selectedMember.last_transaction_date)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderTabContent = () => {
        const tabComponents = {
            'dashboard': renderDashboard,
            'daily-schedule': renderDailyScheduleTab,
            'collection': () => (
                <div className="tab-content full-width">
                    <WeeklyCollection />
                </div>
            ),
            'members': renderMemberManagement,
            'loans': renderLoanManagement,
            'attendance': renderAttendanceTracking,
            'reports': renderDailyReport,
            'group': renderGroupOverview,
            'create-group': renderCreateGroupTab,
            'group-loans': renderGroupLoansTab,
            'commissions': renderCommissionsTab,
            'performance': renderPerformanceTab,
            'member-profile': renderMemberProfile,
            'loan-requests': () => (
                <div className="tab-content full-width">
                    <GroupLoanRequest />
                </div>
            ),
            'loan-approvals': () => (
                <div className="tab-content full-width">
                    <LoanApproval />
                </div>
            ),
            'loan-monitoring': () => (
                <div className="tab-content full-width">
                    <LoanMonitoring />
                </div>
            )
        };
        
        const renderFunction = tabComponents[activeTab] || tabComponents.dashboard;
        return renderFunction();
    };
    
    // Loading state
    if (loading && !userMeta) {
        return (
            <div className="loading-fullscreen">
                <RefreshCw className="loading-spinner" size={32} />
                <p>Loading Facilitator Dashboard...</p>
            </div>
        );
    }
    
    return (
        <div className="dashboard-container facilitator-dashboard">
            {/* Mobile Header */}
            <div className="mobile-header">
                <button 
                    className="hamburger" 
                    onClick={handleMobileSidebarToggle}
                    aria-label="Toggle sidebar"
                >
                    {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="page-title">{getPageTitle()}</div>
                <div className="mobile-actions">
                    <button 
                        className="btn-icon" 
                        onClick={handleRefresh}
                        aria-label="Refresh"
                        disabled={loading}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Sidebar Component */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
                isMobileOpen={isMobileSidebarOpen}
                onMobileToggle={handleMobileSidebarToggle}
                userInfo={{
                    name: userMeta?.full_name || user?.email || 'Facilitator',
                    role: 'FACILITATOR',
                    avatar: <Users size={24} />,
                    group: selectedGroup ? allGroups.find(g => g.id === selectedGroup)?.group_name : 'No group selected',
                    commission: formatCurrency(stats.commissionThisMonth),
                    todayGroups: todayGroups.length
                }}
                customMenuItems={MENU_ITEMS}
            />

            {/* Main Content */}
            <main className="main-content">
                {renderTabContent()}
            </main>
        </div>
    );
}