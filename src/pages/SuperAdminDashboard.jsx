import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, 
    Shield, 
    BarChart3, 
    Building2,
    CreditCard,
    DollarSign,
    AlertCircle,
    Plus,
    Edit,
    Trash2,
    Eye,
    Download,
    RefreshCw,
    CheckCircle,
    Menu,
    X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import UserManagement from './UserManagement';
import supabase from '../supabaseClient';

// Import components
import Sidebar from '../components/Sidebar';
import BranchManagementComponent from '../components/BranchManagement';
import LoanManagementComponent from '../components/LoanManagement';
import TransactionManagementComponent from '../components/TransactionManagement';
import SystemSettingsComponent from '../components/SystemSettings';
import ReportsDashboardComponent from '../components/ReportsDashboard';
import AuditLogsComponent from '../components/AuditLogs';

// Import CSS
import '../styles/components/Layout/DashboardLayout.css';
import '../styles/pages/SuperAdmin/SuperAdminDashboard.css';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const {
        fetchDashboardStats,
        fetchData,
        clearCache,
        isLoading: checkIsLoading 
    } = useData();

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBranches: 0,
        totalMembers: 0,
        totalLoans: 0,
        activeLoans: 0,
        pendingApprovals: 0,
        todayTransactions: 0,
        systemHealth: 'Good'
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [systemIssues, setSystemIssues] = useState([]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [roleDistribution, setRoleDistribution] = useState({
        super_admin: 0,
        general_manager: 0,
        branch_manager: 0,
        facilitator: 0,
        total: 0
    });

    // Handle logout
    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Logout error:', error.message);
                alert('Failed to log out: ' + error.message);
            } else {
                navigate('/login');
            }
        } catch (e) {
            console.error('Unexpected logout error:', e);
            alert('An unexpected error occurred during logout.');
        }
    };
    
    // FIXED: Fetch users from users_meta table (same as UserManagement.jsx)
    const fetchUsersData = useCallback(async () => {
        try {
            console.log('Fetching users from users_meta table...');
            
            // Use the EXACT same query as UserManagement.jsx
            const { data: users, error } = await supabase
                .from('users_meta')
                .select('role, status')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching from users_meta:', error);
                return { total: 0, distribution: { super_admin: 0, general_manager: 0, branch_manager: 0, facilitator: 0 } };
            }
            
            console.log('Users data from users_meta:', users);
            
            if (!users || users.length === 0) {
                console.log('No users found in users_meta');
                return { total: 0, distribution: { super_admin: 0, general_manager: 0, branch_manager: 0, facilitator: 0 } };
            }
            
            // FIXED: Use EXACT same logic as UserManagement.jsx calculateStats function
            const distribution = {
                super_admin: users.filter(u => u.role && u.role.includes('SUPER_ADMIN')).length,
                general_manager: users.filter(u => u.role && u.role.includes('GENERAL_MANAGER')).length,
                branch_manager: users.filter(u => u.role && u.role.includes('BRANCH_MANAGER')).length,
                facilitator: users.filter(u => u.role && u.role.includes('FACILITATOR')).length
            };
            
            console.log('Calculated role distribution:', distribution);
            
            return {
                total: users.length,
                distribution
            };
            
        } catch (error) {
            console.error('Error in fetchUsersData:', error);
            return { total: 0, distribution: { super_admin: 0, general_manager: 0, branch_manager: 0, facilitator: 0 } };
        }
    }, []);
    
    // Fetch dashboard data
    const fetchDashboardData = useCallback(async (forceRefresh = false) => {
        try {
            setLocalLoading(true);
            
            console.log('Loading dashboard data...');
            
            // 1. Fetch users data FIRST using the corrected function
            const usersData = await fetchUsersData();
            console.log('Users data fetched:', usersData);
            
            // 2. Fetch dashboard stats from DataContext
            const dashboardStats = await fetchDashboardStats(forceRefresh);
            console.log('Dashboard stats fetched:', dashboardStats);
            
            // 3. Update stats with combined data
            setStats({
                totalUsers: usersData.total || dashboardStats?.totalUsers || 0,
                totalBranches: dashboardStats?.totalBranches || 0,
                totalMembers: dashboardStats?.totalMembers || 0,
                totalLoans: dashboardStats?.totalLoans || 0,
                activeLoans: dashboardStats?.activeLoans || 0,
                pendingApprovals: dashboardStats?.pendingApprovals || 0,
                todayTransactions: dashboardStats?.todayTransactions || 0,
                systemHealth: 'Good'
            });
            
            // 4. Set role distribution from usersData
            setRoleDistribution({
                ...usersData.distribution,
                total: usersData.total
            });
            
            setLastUpdated(new Date());
            
            // 5. Fetch recent activities
            try {
                const activities = await fetchData('audit_logs', {
                    select: '*',
                    order: { column: 'created_at', ascending: false },
                    limit: 10,
                    cacheKey: 'recentActivities',
                    cacheTime: 30000,
                    forceRefresh
                });
                setRecentActivities(activities || []);
            } catch (activityError) {
                console.warn('Could not fetch activities:', activityError);
                setRecentActivities([]);
            }
            
            // 6. Fetch system issues
            try {
                const issues = await fetchData('system_issues', {
                    select: '*',
                    filters: { status: 'open' },
                    order: { column: 'priority', ascending: false },
                    limit: 5,
                    cacheKey: 'systemIssues',
                    cacheTime: 60000,
                    forceRefresh
                });
                setSystemIssues(issues || []);
            } catch (issuesError) {
                console.warn('Could not fetch system issues:', issuesError);
                setSystemIssues([]);
            }
            
            console.log('Dashboard data loaded successfully');
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLocalLoading(false);
        }
    }, [fetchDashboardStats, fetchData, fetchUsersData]);

    // Load data on mount and when activeTab changes to dashboard
    useEffect(() => {
        if (activeTab === 'dashboard') {
            console.log('Dashboard tab active, loading data...');
            fetchDashboardData();
        }
    }, [activeTab, fetchDashboardData]);

    // Handle manual refresh
    const handleRefresh = async () => {
        if (activeTab === 'dashboard') {
            await fetchDashboardData(true);
        } else {
            clearCache(activeTab);
            window.dispatchEvent(new CustomEvent('refreshData', { detail: { tab: activeTab } }));
        }
    };

    // Handle mobile sidebar toggle
    const handleMobileSidebarToggle = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    // Get page title based on active tab
    const getPageTitle = () => {
        const titles = {
            'dashboard': 'Dashboard',
            'users': 'User Management',
            'branches': 'Branch Management',
            'loans': 'Loan Management',
            'transactions': 'Transactions',
            'reports': 'Reports',
            'audit': 'Audit Logs',
            'settings': 'System Settings'
        };
        return titles[activeTab] || 'MIOT SACCO';
    };

    const handleResolveIssue = async (issueId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                await supabase
                    .from('system_issues')
                    .update({ 
                        status: 'resolved', 
                        resolved_at: new Date().toISOString(),
                        resolved_by: user.id 
                    })
                    .eq('id', issueId);
                
                setSystemIssues(systemIssues.filter(issue => issue.id !== issueId));
                clearCache('systemIssues');
            }
        } catch (error) {
            console.error('Error resolving issue:', error);
        }
    };

    const handleSystemAction = async (action) => {
        try {
            switch (action) {
                case 'refreshCache':
                    clearCache();
                    await fetchDashboardData(true);
                    alert('Cache cleared and data refreshed');
                    break;
                    
                case 'forceSync':
                    await fetchDashboardData(true);
                    alert('Data refreshed');
                    break;
                    
                default:
                    console.log('Action not implemented:', action);
            }
        } catch (error) {
            console.error('System action failed:', error);
            alert(`Action failed: ${error.message}`);
        }
    };

    // Format date helper
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
            
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `${diffDays}d ago`;
            
            return date.toLocaleDateString();
        } catch (e) {
            return 'Invalid date';
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'users':
                return <UserManagement />;
            case 'branches':
                return <BranchManagementComponent />;
            case 'loans':
                return <LoanManagementComponent />;
            case 'transactions':
                return <TransactionManagementComponent />;
            case 'settings':
                return <SystemSettingsComponent />;
            case 'reports':
                return <ReportsDashboardComponent />;
            case 'audit':
                return <AuditLogsComponent />;
            default:
                return renderMainDashboard();
        }
    };

    const renderMainDashboard = () => {
        const dashboardLoading = checkIsLoading ? checkIsLoading('dashboardStats') : false;
        
        return (
            <div className="dashboard-content">
                {/* Welcome Header */}
                <div className="welcome-header">
                    <div>
                        <h1>Super Admin Dashboard</h1>
                        <p className="welcome-subtitle">
                            {lastUpdated ? `Last updated: ${formatDate(lastUpdated)}` : 'Loading...'}
                            {dashboardLoading && ' (Refreshing...)'}
                        </p>
                    </div>
                    <div className="header-actions">
                        <button 
                            className="btn btn-primary" 
                            onClick={handleRefresh}
                            disabled={localLoading || dashboardLoading}
                        >
                            <RefreshCw size={18} /> 
                            {localLoading || dashboardLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button className="btn btn-secondary">
                            <Download size={18} /> Export
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    {renderStatCard('Total Users', stats.totalUsers, Users, 'users', '↑ 12%', 'positive')}
                    {renderStatCard('Branches', stats.totalBranches, Building2, 'branches', '→', 'neutral')}
                    {renderStatCard('Members', stats.totalMembers.toLocaleString(), Users, 'members', '↑ 8%', 'positive')}
                    {renderStatCard('Total Loans', stats.totalLoans.toLocaleString(), CreditCard, 'loans', '↑ 15%', 'positive', `${stats.activeLoans} active`)}
                    {renderStatCard('Pending Approvals', stats.pendingApprovals, AlertCircle, 'pending', '↑ 5', 'negative')}
                    {renderStatCard("Today's Transactions", stats.todayTransactions.toLocaleString(), DollarSign, 'transactions', '↑ 22%', 'positive')}
                    
                    <div className="stat-card system-health">
                        <div className="stat-icon health">
                            <Shield size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>System Health</h3>
                            <p className={`health-status ${stats.systemHealth.toLowerCase()}`}>
                                {stats.systemHealth}
                            </p>
                        </div>
                        <button 
                            className="btn btn-sm" 
                            onClick={() => handleSystemAction('refreshCache')}
                            disabled={localLoading}
                        >
                            Clear Cache
                        </button>
                    </div>

                    <div className="stat-card quick-actions">
                        <h3>Quick Actions</h3>
                        <div className="action-buttons">
                            <button 
                                className="btn btn-sm btn-primary" 
                                onClick={() => setActiveTab('users')}
                            >
                                <Plus size={16} /> Add User
                            </button>
                            <button 
                                className="btn btn-sm btn-secondary"
                                onClick={() => setActiveTab('reports')}
                            >
                                <Download size={16} /> Reports
                            </button>
                            <button 
                                className="btn btn-sm btn-warning" 
                                onClick={() => handleSystemAction('forceSync')}
                            >
                                <RefreshCw size={16} /> Sync Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="content-grid">
                    {/* Recent Activities */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3><Eye size={20} /> Recent Activities</h3>
                            <button className="btn btn-sm" onClick={() => setActiveTab('audit')}>
                                View All
                            </button>
                        </div>
                        <div className="activities-list">
                            {recentActivities.length > 0 ? (
                                recentActivities.map((activity, index) => (
                                    <div key={activity.id || index} className="activity-item">
                                        <div className="activity-icon">
                                            {activity.action_type === 'login' && <Shield size={16} />}
                                            {activity.action_type === 'create' && <Plus size={16} />}
                                            {activity.action_type === 'update' && <Edit size={16} />}
                                            {activity.action_type === 'delete' && <Trash2 size={16} />}
                                        </div>
                                        <div className="activity-details">
                                            <p className="activity-description">{activity.description}</p>
                                            <span className="activity-meta">
                                                {activity.user_email || 'System'} • {formatDate(activity.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No recent activities</p>
                            )}
                        </div>
                    </div>

                    {/* System Issues */}
                    <div className="content-card issues-card">
                        <div className="card-header">
                            <h3><AlertCircle size={20} /> System Issues</h3>
                            <span className="badge badge-danger">{systemIssues.length} Open</span>
                        </div>
                        <div className="issues-list">
                            {systemIssues.length > 0 ? (
                                systemIssues.map((issue) => (
                                    <div key={issue.id} className="issue-item">
                                        <div className="issue-severity">
                                            <span className={`severity-dot ${issue.priority}`}></span>
                                        </div>
                                        <div className="issue-content">
                                            <h4>{issue.title}</h4>
                                            <p>{issue.description}</p>
                                            <div className="issue-meta">
                                                <span className="issue-source">{issue.source}</span>
                                                <span className="issue-time">
                                                    {formatDate(issue.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <button 
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleResolveIssue(issue.id)}
                                            disabled={localLoading}
                                        >
                                            <CheckCircle size={16} /> Resolve
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="no-issues">
                                    <CheckCircle size={32} />
                                    <p>No open issues</p>
                                    <small>All systems operational</small>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Charts */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3><BarChart3 size={20} /> Performance Overview</h3>
                            <select className="period-select" defaultValue="7">
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last quarter</option>
                            </select>
                        </div>
                        <div className="chart-placeholder">
                            <div className="chart-row">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                    <div key={day} className="chart-bar" style={{ height: `${60 + Math.random() * 40}%` }}>
                                        <span>{day}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="chart-label">User Activity (Last 7 days)</p>
                        </div>
                    </div>

                    {/* User Management Preview - FIXED WITH REAL DATA */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3><Users size={20} /> User Management</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setActiveTab('users')}>
                                Manage Users
                            </button>
                        </div>
                        <div className="user-preview">
                            <p>Total active users: <strong>{roleDistribution.total || stats.totalUsers}</strong></p>
                            <div className="role-distribution">
                                <div className="role-item">
                                    <span className="role-dot super-admin"></span>
                                    <span>Super Admins: {roleDistribution.super_admin}</span>
                                </div>
                                <div className="role-item">
                                    <span className="role-dot gm"></span>
                                    <span>General Managers: {roleDistribution.general_manager}</span>
                                </div>
                                <div className="role-item">
                                    <span className="role-dot bm"></span>
                                    <span>Branch Managers: {roleDistribution.branch_manager}</span>
                                </div>
                                <div className="role-item">
                                    <span className="role-dot facilitator"></span>
                                    <span>Facilitators: {roleDistribution.facilitator}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-container">
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
            />

            {/* Main Content */}
            <div className="main-content">
                {localLoading && activeTab === 'dashboard' ? (
                    <div className="loading-container">
                        <RefreshCw className="loading-spinner" size={32} />
                        <p>Loading dashboard data...</p>
                    </div>
                ) : (
                    renderTabContent()
                )}
            </div>
        </div>
    );
}

// Helper component
function renderStatCard(title, value, Icon, iconClass, trend, trendClass, subtitle = '') {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${iconClass}`}>
                <Icon size={24} />
            </div>
            <div className="stat-info">
                <h3>{value}</h3>
                <p>{title}</p>
                {subtitle && <small className="active-loans">{subtitle}</small>}
            </div>
            <div className={`stat-trend ${trendClass}`}>{trend}</div>
        </div>
    );
}