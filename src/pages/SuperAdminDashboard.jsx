// src/pages/SuperAdminDashboard.jsx - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Settings, 
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
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import UserManagement from './UserManagement';
import supabase from '../supabaseClient';
import '../styles/SuperAdminDashboard.css';

// Import external components with different names
import BranchManagementComponent from '../components/BranchManagement';
import LoanManagementComponent from '../components/LoanManagement';
import TransactionManagementComponent from '../components/TransactionManagement';
import SystemSettingsComponent from '../components/SystemSettings';
import ReportsDashboardComponent from '../components/ReportsDashboard';
import AuditLogsComponent from '../components/AuditLogs';

export default function SuperAdminDashboard() {
  const {
    fetchDashboardStats,
    fetchData,
    clearCache,
    loading,
    cache,
    isLoading: checkIsLoading // Renamed to avoid conflict
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
  const [localLoading, setLocalLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard data using DataContext
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setLocalLoading(true);
      
      console.log('Loading dashboard data...');
      
      // Fetch dashboard stats from DataContext
      const dashboardStats = await fetchDashboardStats(forceRefresh);
      
      if (dashboardStats) {
        setStats({
          totalUsers: dashboardStats.totalUsers || 0,
          totalBranches: dashboardStats.totalBranches || 0,
          totalMembers: dashboardStats.totalMembers || 0,
          totalLoans: dashboardStats.totalLoans || 0,
          activeLoans: dashboardStats.activeLoans || 0,
          pendingApprovals: dashboardStats.pendingApprovals || 0,
          todayTransactions: dashboardStats.todayTransactions || 0,
          systemHealth: 'Good'
        });
        setLastUpdated(new Date(dashboardStats.lastUpdated));
        
        // Fetch recent activities
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
        
        // Fetch system issues
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
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [fetchDashboardStats, fetchData]);

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
      await fetchDashboardData(true); // Force refresh
    } else {
      // Refresh cache for the current tab
      clearCache(activeTab);
      // Trigger a refresh for the specific component
      window.dispatchEvent(new CustomEvent('refreshData', { detail: { tab: activeTab } }));
    }
  };

  const handleResolveIssue = async (issueId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update issue status
        await supabase
          .from('system_issues')
          .update({ 
            status: 'resolved', 
            resolved_at: new Date().toISOString(),
            resolved_by: user.id 
          })
          .eq('id', issueId);
        
        // Update local state
        setSystemIssues(systemIssues.filter(issue => issue.id !== issueId));
        
        // Clear cache for system issues
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
          
        case 'backupDatabase':
          alert('Backup functionality requires setup of Supabase Edge Functions');
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

          {/* User Management Preview */}
          <div className="content-card">
            <div className="card-header">
              <h3><Users size={20} /> User Management</h3>
              <button className="btn btn-sm btn-primary" onClick={() => setActiveTab('users')}>
                Manage Users
              </button>
            </div>
            <div className="user-preview">
              <p>Total system users: <strong>{stats.totalUsers}</strong></p>
              <div className="role-distribution">
                <div className="role-item">
                  <span className="role-dot super-admin"></span>
                  <span>Super Admins: {Math.min(1, stats.totalUsers)}</span>
                </div>
                <div className="role-item">
                  <span className="role-dot gm"></span>
                  <span>General Managers: {Math.max(0, Math.floor(stats.totalUsers * 0.1))}</span>
                </div>
                <div className="role-item">
                  <span className="role-dot bm"></span>
                  <span>Branch Managers: {Math.max(0, Math.floor(stats.totalUsers * 0.2))}</span>
                </div>
                <div className="role-item">
                  <span className="role-dot facilitator"></span>
                  <span>Facilitators: {Math.max(0, stats.totalUsers - Math.floor(stats.totalUsers * 0.3) - 1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="super-admin-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isSidebarCollapsed && (
            <>
              <div className="logo">
                <Shield size={32} />
                <h2>MIOT SACCO</h2>
              </div>
              <p className="sidebar-subtitle">Super Admin Panel</p>
            </>
          )}
          <button 
            className="sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <div className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={20} /> Dashboard
          </button>
          <button 
            className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} /> User Management
          </button>
          <button 
            className={`menu-item ${activeTab === 'branches' ? 'active' : ''}`}
            onClick={() => setActiveTab('branches')}
          >
            <Building2 size={20} /> Branches
          </button>
          <button 
            className={`menu-item ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => setActiveTab('loans')}
          >
            <CreditCard size={20} /> Loans
          </button>
          <button 
            className={`menu-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <DollarSign size={20} /> Transactions
          </button>
          <button 
            className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <Download size={20} /> Reports
          </button>
          <button 
            className={`menu-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <Eye size={20} /> Audit Logs
          </button>
          <button 
            className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} /> System Settings
          </button>
        </div>

        <div className="sidebar-footer">
          {!isSidebarCollapsed && (
            <>
              <div className="user-info">
                <div className="user-avatar">
                  <Shield size={24} />
                </div>
                <div>
                  <p className="user-name">Super Admin</p>
                  <p className="user-role">System Administrator</p>
                </div>
              </div>
              <button 
                className="btn btn-sm btn-logout"
                onClick={() => supabase.auth.signOut()}
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          )}
        </div>
      </div>

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