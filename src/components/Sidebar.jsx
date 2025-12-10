import React from 'react';
import { 
    BarChart3, 
    Users, 
    Building2, 
    CreditCard, 
    DollarSign, 
    Download, 
    Eye, 
    Settings, 
    Shield, 
    LogOut, 
    ChevronLeft, 
    ChevronRight,
    X,
    Menu,
    PieChart,
    Calendar,
    TrendingUp,
    FileText,
    UserCog,
    Home,
    Bell,
    Briefcase,
    Receipt,
    HelpCircle
} from 'lucide-react';
import '../styles/components/Layout/Sidebar.css';

// Define menu configurations for different roles
const MENU_CONFIGS = {
    SUPER_ADMIN: [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
        { id: 'users', label: 'User Management', icon: <Users size={20} /> },
        { id: 'branches', label: 'Branch Management', icon: <Building2 size={20} /> },
        { id: 'loans', label: 'Loans', icon: <CreditCard size={20} /> },
        { id: 'transactions', label: 'Transactions', icon: <DollarSign size={20} /> },
        { id: 'reports', label: 'Reports', icon: <Download size={20} /> },
        { id: 'audit', label: 'Audit Logs', icon: <Eye size={20} /> },
        { id: 'settings', label: 'System Settings', icon: <Settings size={20} /> },
    ],
    GENERAL_MANAGER: [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
        { id: 'branches', label: 'Branch Overview', icon: <Building2 size={20} /> },
        { id: 'daily', label: 'Daily Operations', icon: <Calendar size={20} /> },
        { id: 'loans', label: 'Loan Management', icon: <CreditCard size={20} /> },
        { id: 'groups', label: 'Groups & Members', icon: <Users size={20} /> },
        { id: 'staff', label: 'Staff Management', icon: <UserCog size={20} /> },
        { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
        { id: 'performance', label: 'Performance', icon: <TrendingUp size={20} /> },
    ],
    BRANCH_MANAGER: [
        { id: 'dashboard', label: 'Branch Dashboard', icon: <Home size={20} /> },
        { id: 'members', label: 'Members', icon: <Users size={20} /> },
        { id: 'loans', label: 'Loans', icon: <CreditCard size={20} /> },
        { id: 'savings', label: 'Savings', icon: <DollarSign size={20} /> },
        { id: 'staff', label: 'Staff', icon: <UserCog size={20} /> },
        { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
        { id: 'alerts', label: 'Alerts', icon: <Bell size={20} /> },
    ],
    FACILITATOR: [
        { id: 'dashboard', label: 'My Dashboard', icon: <Home size={20} /> },
        { id: 'members', label: 'My Members', icon: <Users size={20} /> },
        { id: 'collections', label: 'Collections', icon: <DollarSign size={20} /> },
        { id: 'loans', label: 'Loans', icon: <CreditCard size={20} /> },
        { id: 'reports', label: 'Daily Reports', icon: <FileText size={20} /> },
        { id: 'help', label: 'Help', icon: <HelpCircle size={20} /> },
    ]
};

// Define role-based themes
const ROLE_THEMES = {
    SUPER_ADMIN: {
        sidebarBg: 'linear-gradient(180deg, #1a237e 0%, #283593 100%)',
        activeColor: '#4fc3f7',
        logoSubtitle: 'Super Admin Panel'
    },
    GENERAL_MANAGER: {
        sidebarBg: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
        activeColor: '#60a5fa',
        logoSubtitle: 'General Manager Panel'
    },
    BRANCH_MANAGER: {
        sidebarBg: 'linear-gradient(180deg, #065f46 0%, #047857 100%)',
        activeColor: '#34d399',
        logoSubtitle: 'Branch Manager Panel'
    },
    FACILITATOR: {
        sidebarBg: 'linear-gradient(180deg, #7c3aed 0%, #8b5cf6 100%)',
        activeColor: '#c4b5fd',
        logoSubtitle: 'Facilitator Panel'
    }
};

const Sidebar = ({ 
    isCollapsed, 
    onToggle, 
    activeTab, 
    setActiveTab, 
    onLogout,
    userInfo = {
        name: 'User',
        role: 'SUPER_ADMIN',
        avatar: <Shield size={24} />
    },
    isMobileOpen,
    onMobileToggle,
    customMenuItems = null
}) => {
    // Support icon names passed as strings in `customMenuItems`
    const ICON_MAP = {
        BarChart3,
        Users,
        Building2,
        CreditCard,
        DollarSign,
        Download,
        Eye,
        Settings,
        Shield,
        ChevronLeft,
        ChevronRight,
        X,
        Menu,
        PieChart,
        Calendar,
        TrendingUp,
        FileText,
        UserCog,
        Home,
        Bell,
        Briefcase,
        Receipt,
        HelpCircle,
    };
    // Get menu items based on user role
    const getMenuItems = () => {
        if (customMenuItems) return customMenuItems;
        return MENU_CONFIGS[userInfo.role] || MENU_CONFIGS.SUPER_ADMIN;
    };

    // Get role theme
    const getRoleTheme = () => {
        return ROLE_THEMES[userInfo.role] || ROLE_THEMES.SUPER_ADMIN;
    };

    const menuItems = getMenuItems();
    const theme = getRoleTheme();

    const handleMenuItemClick = (itemId) => {
        setActiveTab(itemId);
        if (isMobileOpen) {
            onMobileToggle(); // Close sidebar on mobile after selection
        }
    };

    const getRoleAvatar = () => {
        if (userInfo.avatar) return userInfo.avatar;
        
        switch(userInfo.role) {
            case 'SUPER_ADMIN': return <Shield size={24} />;
            case 'GENERAL_MANAGER': return <UserCog size={24} />;
            case 'BRANCH_MANAGER': return <Building2 size={24} />;
            case 'FACILITATOR': return <Users size={24} />;
            default: return <Shield size={24} />;
        }
    };

    return (
        <>
            <div 
                className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}
                style={{ background: theme.sidebarBg }}
            >
                <div className="sidebar-content">
                    {/* Header */}
                    <div className="sidebar-header">
                        {!isCollapsed ? (
                            <>
                                <div className="logo">
                                    <div className="logo-icon">
                                        {getRoleAvatar()}
                                    </div>
                                    <div className="logo-text">
                                        <h2>MIOT SACCO</h2>
                                        <p className="sidebar-subtitle">{theme.logoSubtitle}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="logo collapsed-logo">
                                {getRoleAvatar()}
                            </div>
                        )}
                        
                        {/* Desktop toggle button */}
                        <button 
                            className="sidebar-toggle desktop-toggle"
                            onClick={onToggle}
                            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            style={{
                                background: 'white',
                                border: `2px solid ${theme.activeColor}`,
                                color: theme.activeColor
                            }}
                        >
                            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                        
                        {/* Mobile close button */}
                        {isMobileOpen && (
                            <button 
                                className="sidebar-toggle mobile-close"
                                onClick={onMobileToggle}
                                aria-label="Close sidebar"
                                style={{
                                    background: 'white',
                                    border: `2px solid ${theme.activeColor}`,
                                    color: theme.activeColor
                                }}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Scrollable Menu Area */}
                    <div className="sidebar-menu">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => handleMenuItemClick(item.id)}
                                data-tooltip={isCollapsed ? item.label : undefined}
                                aria-label={item.label}
                                style={{
                                    borderLeftColor: activeTab === item.id ? theme.activeColor : 'transparent'
                                }}
                            >
                                <span className="menu-icon">
                                    {typeof item.icon === 'string'
                                        ? (() => {
                                            const IconComp = ICON_MAP[item.icon];
                                            return IconComp ? <IconComp size={20} /> : item.icon;
                                        })()
                                        : item.icon}
                                </span>
                                {(!isCollapsed || isMobileOpen) && <span className="menu-label">{item.label}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Footer - Fixed at bottom */}
                    <div className="sidebar-footer">
                        <div className="user-info">
                            <div 
                                className="user-avatar"
                                style={{
                                    background: `rgba(255, 255, 255, 0.2)`,
                                    border: `1px solid ${theme.activeColor}`
                                }}
                            >
                                {getRoleAvatar()}
                            </div>
                            {(!isCollapsed || isMobileOpen) && (
                                <div className="user-details">
                                    <p className="user-name">{userInfo.name}</p>
                                    <p className="user-role" style={{ color: theme.activeColor }}>
                                        {userInfo.role?.replace('_', ' ')}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            className="btn-logout"
                            onClick={onLogout}
                            data-tooltip={isCollapsed ? "Logout" : undefined}
                            aria-label="Logout"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: `1px solid ${theme.activeColor}`
                            }}
                        >
                            <span className="logout-icon">
                                <LogOut size={18} />
                            </span>
                            {(!isCollapsed || isMobileOpen) && <span className="logout-text">Logout</span>}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div 
                    className="sidebar-overlay" 
                    onClick={onMobileToggle}
                    aria-label="Close sidebar"
                />
            )}
        </>
    );
};

// Default props for backward compatibility
Sidebar.defaultProps = {
    userInfo: {
        name: 'User',
        role: 'SUPER_ADMIN',
        avatar: null
    }
};

export default Sidebar;