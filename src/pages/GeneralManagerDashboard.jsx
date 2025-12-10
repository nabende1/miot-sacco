import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Building2, Users, CreditCard, BarChart3,
    DollarSign, TrendingUp, Shield, FileText,
    Calendar, Download, RefreshCw, AlertCircle,
    CheckCircle, X, Menu, TrendingDown,
    Banknote, Percent, Group, UserPlus,
    Wallet, Activity, Target
} from 'lucide-react';
import supabase from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import BranchOverview from '../components/GeneralManager/BranchOverview/BranchOverview';
import StaffManagement from '../components/GeneralManager/StaffManagement/StaffManagement';
import DailyOperations from '../components/GeneralManager/DailyOperations/DailyOperations';
import LoanManagement from '../components/GeneralManager/LoanManagement/LoanManagement';
import GroupManagement from '../components/GeneralManager/GroupManagement/GroupManagement';
import Reports from '../components/GeneralManager/Reports/Reports';
import PerformanceAnalytics from '../components/GeneralManager/PerformanceAnalytics/PerformanceAnalytics';
import '../styles/components/Layout/DashboardLayout.css';
import '../styles/pages/GeneralManager/GeneralManagerDashboard.css';

export default function GeneralManagerDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [userMeta, setUserMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    
    // Dashboard statistics
    const [stats, setStats] = useState({
        totalBranches: 0, activeBranches: 0, inactiveBranches: 0,
        totalMembers: 0, activeMembers: 0, newMembersToday: 0, membersInGroups: 0,
        totalSavings: 0, savingsToday: 0, savingsThisMonth: 0,
        totalLoans: 0, activeLoans: 0, overdueLoans: 0, pendingApprovals: 0,
        totalRepayments: 0, repaymentsToday: 0, avgRepaymentRate: 0,
        branchInterestIncome: 0, processingFees: 0, defaultRate: 0,
        totalStaff: 0, branchManagers: 0, facilitators: 0,
        totalGroups: 0, activeGroups: 0, groupsWithLoans: 0,
        todaysProfit: 0, weeklyGrowth: 0, memberSatisfaction: 0,
        operationalEfficiency: 0, totalLoanPortfolio: 0,
        totalMemberSavings: 0, totalSocialFund: 0, totalProcessingFees: 0
    });

    // Daily operations for quick view
    const [dailyOperations, setDailyOperations] = useState({
        todaySavings: 0, todayFines: 0, todaySocialFund: 0,
        todayLoanRepayments: 0, todayNewLoans: 0, todayExpenses: 0,
        netProfitToday: 0, cashFlowBalance: 0
    });

    // Recent activities for dashboard
    const [recentActivities, setRecentActivities] = useState([]);

    // Top branches for performance comparison
    const [topBranches, setTopBranches] = useState([]);

    // GM-specific menu items
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
        { id: 'branches', label: 'Branch Overview', icon: <Building2 size={20} /> },
        { id: 'daily', label: 'Daily Operations', icon: <Calendar size={20} /> },
        { id: 'loans', label: 'Loan Management', icon: <CreditCard size={20} /> },
        { id: 'groups', label: 'Groups & Members', icon: <Users size={20} /> },
        { id: 'staff', label: 'Staff Management', icon: <Shield size={20} /> },
        { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
        { id: 'performance', label: 'Performance Analytics', icon: <TrendingUp size={20} /> },
    ];

    // Load user data and verify GM role
    useEffect(() => {
        loadUserData();
    }, []);

    // Load dashboard data when active tab changes
    useEffect(() => {
        if (userMeta) {
            if (activeTab === 'dashboard') {
                loadDashboardData();
            } else if (activeTab === 'performance') {
                // Performance tab handles its own data loading
                setLoading(false);
            } else {
                setLoading(false);
            }
        }
    }, [activeTab, userMeta]);

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
            
            if (userMetaData.role !== 'GENERAL_MANAGER' && userMetaData.role !== 'SUPER_ADMIN') {
                const redirectPaths = {
                    'BRANCH_MANAGER': '/branch-dashboard',
                    'FACILITATOR': '/facilitator-dashboard'
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

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            await Promise.all([
                loadSaccoStats(),
                loadDailyOperations(),
                loadRecentActivities(),
                loadTopBranches()
            ]);
            
            setLastUpdated(new Date());
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setRecentActivities([{
                id: 'error',
                action: 'error',
                description: 'Error loading recent activities',
                timestamp: new Date().toISOString(),
                icon: 'error'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const loadSaccoStats = async () => {
        try {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);

            // Use Promise.allSettled to handle partial failures gracefully
            const promises = [
                supabase.from('branches').select('id, name, is_active'),
                supabase.from('members').select('id, status, branch_id, date_joined, group_id, total_shares, social_fund_balance, loan_repayment_rate, performance_score'),
                supabase.from('groups').select('id, group_name, branch_id, is_active, facilitator_id'),
                supabase.from('member_loans').select('id, principal, loan_status, remaining_balance, processing_fee, interest_amount, member_id, issued_date'),
                supabase.from('group_loans').select('id, principal, loan_status, outstanding_balance'),
                supabase.from('member_savings').select('amount, created_at').gte('created_at', startOfDay.toISOString()),
                supabase.from('member_savings').select('amount, created_at').gte('created_at', startOfMonth.toISOString()),
                supabase.from('loan_repayments').select('amount_paid, payment_date').gte('payment_date', startOfDay.toISOString()),
                supabase.from('users_meta').select('id, role, status, assigned_branch')
                    .in('role', ['BRANCH_MANAGER', 'FACILITATOR']).eq('status', 'ACTIVE'),
                supabase.from('member_processing_fees').select('amount, date_recorded').gte('date_recorded', startOfDay.toISOString()),
                supabase.from('members').select('id, created_at').gte('created_at', startOfDay.toISOString()),
                supabase.from('branch_profit_ledger').select('amount, date_recorded').order('date_recorded', { ascending: false }).limit(1)
            ];

            const results = await Promise.allSettled(promises);

            // Extract data with fallbacks
            const [
                branchesResult, membersResult, groupsResult, memberLoansResult,
                groupLoansResult, todaySavingsResult, monthSavingsResult, 
                todayRepaymentsResult, staffResult, processingFeesResult,
                newMembersTodayResult, cashFlowResult
            ] = results.map(result => 
                result.status === 'fulfilled' ? result.value : { data: null, error: result.reason }
            );

            // Log any errors but continue with available data
            const errors = results
                .filter((result, index) => result.status === 'rejected')
                .map((result, index) => ({ index, error: result.reason }));
            
            if (errors.length > 0) {
                console.warn('Partial data errors:', errors);
            }

            // Use data with fallbacks
            const branches = branchesResult?.data || [];
            const members = membersResult?.data || [];
            const groups = groupsResult?.data || [];
            const memberLoans = memberLoansResult?.data || [];
            const groupLoans = groupLoansResult?.data || [];
            const todaySavings = todaySavingsResult?.data || [];
            const monthSavings = monthSavingsResult?.data || [];
            const todayRepayments = todayRepaymentsResult?.data || [];
            const staff = staffResult?.data || [];
            const processingFees = processingFeesResult?.data || [];
            const newMembersToday = newMembersTodayResult?.data || [];
            const cashFlowData = cashFlowResult?.data || [];

            // Calculate statistics with safe parsing
            const totalBranches = branches.length;
            const activeBranches = branches.filter(b => b.is_active === true).length;
            
            const totalMembers = members.length;
            const activeMembers = members.filter(m => m.status === 'ACTIVE').length;
            const newMembersTodayCount = newMembersToday.length;
            const membersInGroups = members.filter(m => m.group_id).length;
            
            const totalGroups = groups.length;
            const activeGroups = groups.filter(g => g.is_active === true).length;
            
            const totalMemberLoans = memberLoans.length;
            const activeMemberLoans = memberLoans.filter(l => l.loan_status === 'ACTIVE').length;
            const overdueMemberLoans = memberLoans.filter(l => l.loan_status === 'OVERDUE').length;
            
            const totalGroupLoans = groupLoans.length;
            const activeGroupLoans = groupLoans.filter(l => l.loan_status === 'APPROVED').length;
            
            const totalLoans = totalMemberLoans + totalGroupLoans;
            const activeLoans = activeMemberLoans + activeGroupLoans;
            
            const savingsToday = todaySavings.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
            const savingsThisMonth = monthSavings.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
            const repaymentsToday = todayRepayments.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0);
            
            const totalLoanPortfolio = memberLoans.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0) + 
                                     groupLoans.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0);
            
            const totalMemberSavings = members.reduce((sum, m) => sum + (parseFloat(m.total_shares) || 0), 0);
            const totalSocialFund = members.reduce((sum, m) => sum + (parseFloat(m.social_fund_balance) || 0), 0);
            const totalProcessingFees = processingFees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
            
            const avgRepaymentRate = members.length > 0 
                ? Math.round(members.reduce((sum, m) => sum + (parseFloat(m.loan_repayment_rate) || 0), 0) / members.length)
                : 0;
            
            const defaultRate = totalMemberLoans > 0 ? Math.round((overdueMemberLoans / totalMemberLoans) * 100) : 0;
            
            const branchManagers = staff.filter(s => s.role === 'BRANCH_MANAGER').length;
            const facilitators = staff.filter(s => s.role === 'FACILITATOR').length;
            
            const groupsWithLoans = groups.filter(g => {
                const groupMembers = members.filter(m => m.group_id === g.id);
                const memberIds = groupMembers.map(m => m.id);
                const groupMemberLoans = memberLoans.filter(ml => memberIds.includes(ml.member_id));
                return groupMemberLoans.length > 0;
            }).length;
            
            const branchInterestIncome = memberLoans.reduce((sum, l) => sum + (parseFloat(l.interest_amount) || 0), 0);
            const todaysProfit = savingsToday + repaymentsToday + totalProcessingFees;
            const cashFlowBalance = cashFlowData[0]?.amount || 0;
            
            const memberSatisfaction = members.length > 0 
                ? Math.round(members.reduce((sum, m) => sum + (parseFloat(m.performance_score) || 0), 0) / members.length)
                : 0;
            
            const operationalEfficiency = Math.min(100, Math.round(
                (activeMembers / Math.max(totalMembers, 1)) * 100 * 0.4 +
                (avgRepaymentRate * 0.3) +
                ((totalGroups > 0 ? groupsWithLoans / totalGroups : 0) * 100 * 0.3)
            ));

            const weeklyGrowth = savingsThisMonth > 0 ? Math.round((savingsToday / savingsThisMonth) * 100 * 7) : 0;

            setStats({
                totalBranches,
                activeBranches,
                inactiveBranches: totalBranches - activeBranches,
                totalMembers,
                activeMembers,
                newMembersToday: newMembersTodayCount,
                membersInGroups,
                totalSavings: totalMemberSavings,
                savingsToday,
                savingsThisMonth,
                totalLoans,
                activeLoans,
                overdueLoans: overdueMemberLoans,
                pendingApprovals: 0,
                totalRepayments: repaymentsToday * 30,
                repaymentsToday,
                avgRepaymentRate,
                branchInterestIncome,
                processingFees: totalProcessingFees,
                defaultRate,
                totalStaff: branchManagers + facilitators,
                branchManagers,
                facilitators,
                totalGroups,
                activeGroups,
                groupsWithLoans,
                todaysProfit,
                weeklyGrowth,
                memberSatisfaction,
                operationalEfficiency,
                totalLoanPortfolio,
                totalMemberSavings,
                totalSocialFund,
                totalProcessingFees
            });

            setDailyOperations(prev => ({
                ...prev,
                cashFlowBalance
            }));
            
        } catch (error) {
            console.error('Error loading SACCO stats:', error);
            // Set default values instead of throwing
            setStats({
                totalBranches: 0, activeBranches: 0, inactiveBranches: 0,
                totalMembers: 0, activeMembers: 0, newMembersToday: 0, membersInGroups: 0,
                totalSavings: 0, savingsToday: 0, savingsThisMonth: 0,
                totalLoans: 0, activeLoans: 0, overdueLoans: 0, pendingApprovals: 0,
                totalRepayments: 0, repaymentsToday: 0, avgRepaymentRate: 0,
                branchInterestIncome: 0, processingFees: 0, defaultRate: 0,
                totalStaff: 0, branchManagers: 0, facilitators: 0,
                totalGroups: 0, activeGroups: 0, groupsWithLoans: 0,
                todaysProfit: 0, weeklyGrowth: 0, memberSatisfaction: 0,
                operationalEfficiency: 0, totalLoanPortfolio: 0,
                totalMemberSavings: 0, totalSocialFund: 0, totalProcessingFees: 0
            });
        }
    };

    const loadDailyOperations = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const [
                { data: todaySavings = [] },
                { data: todayRepayments = [] },
                { data: todayFines = [] },
                { data: newLoansToday = [] },
                { data: dailySubmissions = [] },
                { data: todayExpenses = [] },
                { data: cashFlowData = [] }
            ] = await Promise.all([
                supabase.from('member_savings').select('amount').gte('created_at', today.toISOString()),
                supabase.from('loan_repayments').select('amount_paid').gte('payment_date', today.toISOString()),
                supabase.from('member_fines').select('amount').eq('imposed_date', today.toISOString().split('T')[0]).eq('status', 'paid'),
                supabase.from('member_loans').select('principal').gte('issued_date', today.toISOString()).eq('loan_status', 'ACTIVE'),
                supabase.from('daily_submissions').select('total_social_fund, total_fines').eq('submission_date', today.toISOString().split('T')[0]),
                supabase.from('expenses').select('amount').gte('expense_date', today.toISOString()),
                supabase.from('branch_profit_ledger').select('amount').order('date_recorded', { ascending: false }).limit(1)
            ]);

            const savingsAmount = todaySavings.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
            const repaymentAmount = todayRepayments.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0);
            const finesAmount = todayFines.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
            const newLoansAmount = newLoansToday.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0);
            const socialFundAmount = dailySubmissions.reduce((sum, d) => sum + (parseFloat(d.total_social_fund) || 0), 0);
            const additionalFines = dailySubmissions.reduce((sum, d) => sum + (parseFloat(d.total_fines) || 0), 0);
            const expensesAmount = todayExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            
            const netProfitToday = savingsAmount + repaymentAmount + finesAmount + additionalFines - expensesAmount;
            const cashFlowBalance = cashFlowData[0]?.amount || 0;

            setDailyOperations({
                todaySavings: savingsAmount,
                todayFines: finesAmount + additionalFines,
                todaySocialFund: socialFundAmount,
                todayLoanRepayments: repaymentAmount,
                todayNewLoans: newLoansAmount,
                todayExpenses: expensesAmount,
                netProfitToday,
                cashFlowBalance
            });
            
        } catch (error) {
            console.error('Error loading daily operations:', error);
        }
    };

    const loadRecentActivities = async () => {
        try {
            const activities = [];
            
            // Load multiple activity sources in parallel
            const [
                { data: recentLoanApprovals = [] },
                { data: recentMembers = [] },
                { data: recentRepayments = [] },
                { data: recentSubmissions = [] }
            ] = await Promise.all([
                supabase.from('member_loans')
                    .select('id, principal, issued_date, member:members(full_name)')
                    .eq('loan_status', 'ACTIVE')
                    .order('issued_date', { ascending: false })
                    .limit(3),
                supabase.from('members')
                    .select('id, full_name, date_joined, branch:branches(name)')
                    .order('date_joined', { ascending: false })
                    .limit(2),
                supabase.from('loan_repayments')
                    .select('id, amount_paid, payment_date, member:members(full_name)')
                    .order('payment_date', { ascending: false })
                    .limit(2),
                supabase.from('daily_submissions')
                    .select('id, submission_date, total_collections, group:groups(group_name)')
                    .order('submission_date', { ascending: false })
                    .limit(2)
            ]);

            recentLoanApprovals.forEach(loan => {
                activities.push({
                    id: loan.id,
                    action: 'loan_approved',
                    description: `Loan ${formatCurrency(loan.principal)} approved for ${loan.member?.full_name || 'member'}`,
                    timestamp: loan.issued_date,
                    icon: 'loan_approved'
                });
            });
            
            recentMembers.forEach(member => {
                activities.push({
                    id: member.id,
                    action: 'member_registered',
                    description: `New member registered: ${member.full_name} (${member.branch?.name || 'No branch'})`,
                    timestamp: member.date_joined + 'T00:00:00Z',
                    icon: 'member_registered'
                });
            });
            
            recentRepayments.forEach(repayment => {
                activities.push({
                    id: repayment.id,
                    action: 'loan_repayment',
                    description: `Loan repayment ${formatCurrency(repayment.amount_paid)} from ${repayment.member?.full_name || 'member'}`,
                    timestamp: repayment.payment_date,
                    icon: 'loan_repayment'
                });
            });
            
            recentSubmissions.forEach(submission => {
                activities.push({
                    id: submission.id,
                    action: 'daily_submission',
                    description: `Daily submission: ${formatCurrency(submission.total_collections)} from ${submission.group?.group_name || 'group'}`,
                    timestamp: submission.submission_date + 'T00:00:00Z',
                    icon: 'daily_submission'
                });
            });
            
            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setRecentActivities(activities.slice(0, 5));
            
        } catch (error) {
            console.error('Error loading recent activities:', error);
            setRecentActivities([]);
        }
    };

    const loadTopBranches = async () => {
        try {
            const { data: branches = [], error } = await supabase
                .from('branches')
                .select('id, name, location, is_active');
            
            if (error) {
                console.error('Error loading branches:', error);
                setTopBranches([]);
                return;
            }

            if (!branches || branches.length === 0) {
                setTopBranches([]);
                return;
            }

            const branchesWithPerformance = await Promise.all(
                branches.map(async (branch) => {
                    try {
                        const { data: branchMembers = [] } = await supabase
                            .from('members')
                            .select('id, status, total_shares, loan_repayment_rate, performance_score')
                            .eq('branch_id', branch.id);
                        
                        const memberIds = branchMembers.map(m => m.id);
                        const { data: branchLoans = [] } = memberIds.length > 0 
                            ? await supabase
                                .from('member_loans')
                                .select('id, principal, loan_status, remaining_balance')
                                .in('member_id', memberIds)
                            : { data: [] };
                        
                        const memberCount = branchMembers.length;
                        const activeMembers = branchMembers.filter(m => m.status === 'ACTIVE').length;
                        const totalLoans = branchLoans.length;
                        const activeLoans = branchLoans.filter(l => l.loan_status === 'ACTIVE').length;
                        const repaidLoans = branchLoans.filter(l => l.loan_status === 'REPAID').length;
                        const repaymentRate = totalLoans > 0 ? (repaidLoans / totalLoans) * 100 : 0;
                        
                        const totalSavings = branchMembers.reduce((sum, m) => sum + (parseFloat(m.total_shares) || 0), 0);
                        const avgMemberPerformance = memberCount > 0 
                            ? branchMembers.reduce((sum, m) => sum + (parseFloat(m.performance_score) || 0), 0) / memberCount
                            : 0;
                        
                        const performanceScore = Math.round(
                            (repaymentRate * 0.4) + 
                            ((activeMembers / Math.max(memberCount, 1)) * 100 * 0.3) + 
                            (avgMemberPerformance * 0.3)
                        );
                        
                        return {
                            ...branch,
                            memberCount,
                            activeMembers,
                            loanCount: totalLoans,
                            activeLoans,
                            repaymentRate: Math.round(repaymentRate),
                            performanceScore: Math.min(100, Math.max(0, performanceScore)),
                            totalSavings: formatCurrency(totalSavings)
                        };
                    } catch (err) {
                        console.error(`Error loading branch ${branch.name}:`, err);
                        return {
                            ...branch,
                            memberCount: 0, activeMembers: 0, loanCount: 0,
                            activeLoans: 0, repaymentRate: 0, performanceScore: 0,
                            totalSavings: formatCurrency(0)
                        };
                    }
                })
            );
            
            const validBranches = branchesWithPerformance.filter(b => b.performanceScore > 0);
            validBranches.sort((a, b) => b.performanceScore - a.performanceScore);
            setTopBranches(validBranches.slice(0, 3));
            
        } catch (error) {
            console.error('Error loading top branches:', error);
            setTopBranches([]);
        }
    };

    const handleRefresh = async () => {
        await loadDashboardData();
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

    const getPageTitle = () => {
        const titles = {
            'dashboard': 'General Manager Dashboard',
            'branches': 'Branch Overview',
            'daily': 'Daily Operations',
            'loans': 'Loan Management',
            'groups': 'Groups & Members',
            'staff': 'Staff Management',
            'reports': 'Reports',
            'performance': 'Performance Analytics'
        };
        return titles[activeTab] || 'MIOT SACCO - General Manager';
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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return renderDashboard();
            case 'branches':
                return <div className="tab-content full-width"><BranchOverview /></div>;
            case 'daily':
                return <div className="tab-content full-width"><DailyOperations /></div>;
            case 'loans':
                return <div className="tab-content full-width"><LoanManagement /></div>;
            case 'groups':
                return <div className="tab-content full-width"><GroupManagement /></div>;
            case 'staff':
                return <div className="tab-content full-width"><StaffManagement /></div>;
            case 'reports':
                return <div className="tab-content full-width"><Reports /></div>;
            case 'performance':
                return <PerformanceAnalytics />;
            default:
                return (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>{getPageTitle()}</h2>
                            <p>Feature coming soon - focused on core functionality first</p>
                        </div>
                    </div>
                );
        }
    };

    const renderDashboard = () => {
        return (
            <div className="dashboard-content">
                {/* Welcome Header */}
                <div className="welcome-header">
                    <div>
                        <h1>General Manager Dashboard</h1>
                        <p className="welcome-subtitle">
                            {lastUpdated ? `Last updated: ${formatDate(lastUpdated)}` : 'Loading...'}
                            {loading && ' (Refreshing...)'}
                        </p>
                    </div>
                    <div className="header-actions">
                        <button 
                            className="btn btn-primary" 
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <RefreshCw size={18} /> 
                            {loading ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                        <button className="btn btn-secondary">
                            <Download size={18} /> Export Dashboard
                        </button>
                    </div>
                </div>

                {/* Key Performance Indicators */}
                <div className="stats-grid">
                    {/* Branch KPIs */}
                    {renderStatCard('Total Branches', stats.totalBranches, Building2, 'branches', `${stats.activeBranches} active`, 'primary')}
                    {renderStatCard('Active Members', stats.activeMembers.toLocaleString(), Users, 'members', `${stats.newMembersToday} new today`, 'success')}
                    {renderStatCard('Total Groups', stats.totalGroups, Group, 'groups', `${stats.activeGroups} active`, 'info')}
                    {renderStatCard('Total Savings', formatCurrency(stats.totalSavings), DollarSign, 'savings', formatCurrency(stats.savingsToday), 'success')}
                    
                    {/* Loan KPIs */}
                    {renderStatCard('Total Loans', stats.totalLoans, CreditCard, 'loans', `${stats.activeLoans} active`, 'warning')}
                    {renderStatCard('Overdue Loans', stats.overdueLoans, AlertCircle, 'overdue', `${stats.defaultRate}% rate`, stats.overdueLoans > 0 ? 'danger' : 'success')}
                    {renderStatCard('Processing Fees', formatCurrency(stats.processingFees), Wallet, 'fees', 'collected today', 'info')}
                    {renderStatCard('Avg. Repayment', `${stats.avgRepaymentRate}%`, Percent, 'repayment', 'member average', stats.avgRepaymentRate > 80 ? 'success' : stats.avgRepaymentRate > 60 ? 'warning' : 'danger')}
                    
                    {/* Financial KPIs */}
                    {renderStatCard('Loan Portfolio', formatCurrency(stats.totalLoanPortfolio), TrendingUp, 'portfolio', 'total outstanding', 'primary')}
                    {renderStatCard('Social Fund', formatCurrency(stats.totalSocialFund), Banknote, 'social', 'member contributions', 'success')}
                    {renderStatCard('Total Staff', stats.totalStaff, Shield, 'staff', `${stats.branchManagers} BMs, ${stats.facilitators} Fac`, 'primary')}
                    {renderStatCard('Cash Flow', formatCurrency(dailyOperations.cashFlowBalance), DollarSign, 'cashflow', 'available balance', dailyOperations.cashFlowBalance > 0 ? 'success' : 'danger')}
                </div>

                {/* Main Content Area */}
                <div className="content-grid">
                    {/* Daily Operations Summary */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3><Calendar size={20} /> Today's Operations</h3>
                            <button className="btn btn-sm" onClick={() => setActiveTab('daily')}>
                                View Details
                            </button>
                        </div>
                        <div className="daily-summary">
                            <div className="daily-stats">
                                <div className="daily-stat">
                                    <span>Savings Collected</span>
                                    <strong>{formatCurrency(dailyOperations.todaySavings)}</strong>
                                </div>
                                <div className="daily-stat">
                                    <span>Loan Repayments</span>
                                    <strong>{formatCurrency(dailyOperations.todayLoanRepayments)}</strong>
                                </div>
                                <div className="daily-stat">
                                    <span>New Loans Issued</span>
                                    <strong>{formatCurrency(dailyOperations.todayNewLoans)}</strong>
                                </div>
                                <div className="daily-stat">
                                    <span>Net Profit Today</span>
                                    <strong className="profit">{formatCurrency(dailyOperations.netProfitToday)}</strong>
                                </div>
                            </div>
                            <div className="secondary-stats">
                                <div className="secondary-stat">
                                    <span>Fines Collected</span>
                                    <small>{formatCurrency(dailyOperations.todayFines)}</small>
                                </div>
                                <div className="secondary-stat">
                                    <span>Social Fund</span>
                                    <small>{formatCurrency(dailyOperations.todaySocialFund)}</small>
                                </div>
                                <div className="secondary-stat">
                                    <span>Expenses</span>
                                    <small>{formatCurrency(dailyOperations.todayExpenses)}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branch Performance Overview */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3><Building2 size={20} /> Top Performing Branches</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setActiveTab('branches')}>
                                View All Branches
                            </button>
                        </div>
                        <div className="branch-overview">
                            {topBranches.length > 0 ? (
                                <>
                                    <div className="top-branches-list">
                                        {topBranches.map((branch, index) => (
                                            <div key={branch.id} className="branch-performance-item">
                                                <div className="branch-rank">
                                                    <span className="rank-number">{index + 1}</span>
                                                    <div className="branch-info">
                                                        <strong>{branch.name}</strong>
                                                        <small>{branch.location || 'No location'}</small>
                                                    </div>
                                                </div>
                                                <div className="branch-metrics">
                                                    <div className="metric">
                                                        <span>Repayment Rate</span>
                                                        <strong>{branch.repaymentRate}%</strong>
                                                    </div>
                                                    <div className="metric">
                                                        <span>Members</span>
                                                        <strong>{branch.memberCount}</strong>
                                                    </div>
                                                    <div className="metric">
                                                        <span>Performance</span>
                                                        <strong className="performance-score">{branch.performanceScore}/100</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {topBranches.length > 0 && topBranches[topBranches.length - 1]?.performanceScore < 60 && (
                                        <div className="attention-alert">
                                            <AlertCircle size={16} />
                                            <span>
                                                <strong>{topBranches[topBranches.length - 1].name}</strong> needs attention 
                                                ({topBranches[topBranches.length - 1].performanceScore}% performance score)
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="no-branches">
                                    <Building2 size={32} />
                                    <p>No branch performance data available</p>
                                    <small>Check if branches and members are properly linked</small>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3><Activity size={20} /> Recent Activities</h3>
                            {recentActivities.length > 0 && (
                                <button className="btn btn-sm" onClick={() => setActiveTab('daily')}>
                                    View All
                                </button>
                            )}
                        </div>
                        <div className="activities-list">
                            {recentActivities.length > 0 ? (
                                recentActivities.map((activity) => (
                                    <div key={activity.id} className="activity-item">
                                        <div className="activity-icon">
                                            {activity.icon === 'loan_approved' && <CheckCircle size={16} />}
                                            {activity.icon === 'member_registered' && <UserPlus size={16} />}
                                            {activity.icon === 'loan_repayment' && <DollarSign size={16} />}
                                            {activity.icon === 'daily_submission' && <FileText size={16} />}
                                            {activity.icon === 'error' && <AlertCircle size={16} />}
                                        </div>
                                        <div className="activity-details">
                                            <p className="activity-description">{activity.description}</p>
                                            <span className="activity-meta">
                                                {formatDate(activity.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-activities">
                                    <Activity size={32} />
                                    <p>No recent activities</p>
                                    <small>Activities will appear here as they occur</small>
                                </div>
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
                                onClick={() => setActiveTab('daily')}
                            >
                                <Calendar size={20} />
                                <span>Daily Operations</span>
                                <small>View today's transactions</small>
                            </button>
                            <button 
                                className="action-btn success"
                                onClick={() => setActiveTab('staff')}
                            >
                                <Shield size={20} />
                                <span>Manage Staff</span>
                                <small>{stats.totalStaff} staff members</small>
                            </button>
                            <button 
                                className="action-btn info"
                                onClick={() => setActiveTab('branches')}
                            >
                                <Building2 size={20} />
                                <span>View Branches</span>
                                <small>{stats.totalBranches} branches</small>
                            </button>
                            <button 
                                className="action-btn warning"
                                onClick={handleRefresh}
                            >
                                <RefreshCw size={20} />
                                <span>Refresh Data</span>
                                <small>Update dashboard</small>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                {stats.operationalEfficiency > 0 && (
                    <div className="performance-metrics-section">
                        <h3><BarChart3 size={24} /> Performance Metrics</h3>
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <div className="metric-header">
                                    <h4>Operational Efficiency</h4>
                                    <span className="metric-value">{stats.operationalEfficiency}%</span>
                                </div>
                                <div className="metric-progress">
                                    <div 
                                        className="progress-bar" 
                                        style={{ width: `${stats.operationalEfficiency}%` }}
                                    />
                                </div>
                                <div className="metric-footer">
                                    <span className="metric-trend">
                                        {stats.operationalEfficiency > 80 ? 'Excellent' : 
                                         stats.operationalEfficiency > 60 ? 'Good' : 'Needs Improvement'}
                                    </span>
                                    <small>Based on active members & groups</small>
                                </div>
                            </div>
                            
                            <div className="metric-card">
                                <div className="metric-header">
                                    <h4>Member Satisfaction</h4>
                                    <span className="metric-value">{stats.memberSatisfaction}%</span>
                                </div>
                                <div className="metric-progress">
                                    <div 
                                        className="progress-bar success" 
                                        style={{ width: `${stats.memberSatisfaction}%` }}
                                    />
                                </div>
                                <div className="metric-footer">
                                    <span className="metric-trend">
                                        {stats.memberSatisfaction > 80 ? 'High' : 
                                         stats.memberSatisfaction > 60 ? 'Moderate' : 'Low'}
                                    </span>
                                    <small>Average member performance score</small>
                                </div>
                            </div>
                            
                            <div className="metric-card">
                                <div className="metric-header">
                                    <h4>Financial Health</h4>
                                    <span className="metric-value">
                                        {stats.totalSavings > stats.totalLoanPortfolio ? 'Good' : 'Monitor'}
                                    </span>
                                </div>
                                <div className="metric-progress">
                                    <div 
                                        className="progress-bar warning" 
                                        style={{ 
                                            width: `${Math.min(100, (stats.totalSavings / Math.max(stats.totalLoanPortfolio, 1)) * 100)}%` 
                                        }}
                                    />
                                </div>
                                <div className="metric-footer">
                                    <span className="metric-trend">
                                        {stats.totalSavings > stats.totalLoanPortfolio ? 'Healthy' : 'Watch'}
                                    </span>
                                    <small>Savings vs Loan portfolio</small>
                                </div>
                            </div>
                            
                            <div className="metric-card">
                                <div className="metric-header">
                                    <h4>Default Risk</h4>
                                    <span className="metric-value">{stats.defaultRate}%</span>
                                </div>
                                <div className="metric-progress">
                                    <div 
                                        className="progress-bar danger" 
                                        style={{ width: `${stats.defaultRate}%` }}
                                    />
                                </div>
                                <div className="metric-footer">
                                    <span className="metric-trend">
                                        {stats.defaultRate < 5 ? 'Low' : 
                                         stats.defaultRate < 10 ? 'Moderate' : 'High'}
                                    </span>
                                    <small>Overdue loan percentage</small>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Performance Analytics Promotion */}
                <div className="performance-tab-link">
                    <div className="link-content">
                        <TrendingUp size={24} />
                        <div>
                            <h4>Need deeper insights?</h4>
                            <p>Access comprehensive performance analytics with detailed metrics and trends</p>
                        </div>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setActiveTab('performance')}
                    >
                        Go to Performance Analytics
                    </button>
                </div>
            </div>
        );
    };

    const renderStatCard = (title, value, Icon, iconClass, subtitle, status = 'neutral') => {
        return (
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
    };

    if (loading && !userMeta) {
        return (
            <div className="loading-fullscreen">
                <RefreshCw className="loading-spinner" size={32} />
                <p>Loading General Manager Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container gm-dashboard">
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
                    name: userMeta?.full_name || user?.email || 'General Manager',
                    role: 'GENERAL_MANAGER',
                    avatar: <Shield size={24} />
                }}
                customMenuItems={menuItems}
            />

            {/* Main Content */}
            <div className="main-content">
                {renderTabContent()}
            </div>
        </div>
    );
}