import React from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, FileText, Bell, HelpCircle, User } from 'lucide-react';

const Header = ({ 
  title, 
  subtitle, 
  onRefresh, 
  loading = false,
  onGenerateReport,
  user,
  notifications = [],
  unreadNotifications = 0
}) => {
  return (
    <div className="dashboard-header">
      <div className="header-left">
        <div>
          <h1>{title}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
      </div>
      
      <div className="header-right">
        <div className="header-actions">
          <button 
            className="btn btn-primary" 
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={18} /> 
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button 
            className="btn btn-success"
            onClick={onGenerateReport}
          >
            <FileText size={18} /> Generate Report
          </button>
          
          <div className="notification-badge">
            <button className="btn-icon">
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="badge">{unreadNotifications}</span>
              )}
            </button>
          </div>
          
          <button className="btn-icon">
            <HelpCircle size={20} />
          </button>
          
          <div className="user-profile">
            <div className="user-avatar">
              <User size={24} />
            </div>
            <div className="user-info">
              <strong>{user?.name || 'User'}</strong>
              <small>{user?.role || 'Branch Manager'}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onGenerateReport: PropTypes.func,
  user: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string
  }),
  notifications: PropTypes.array,
  unreadNotifications: PropTypes.number
};

export default Header;