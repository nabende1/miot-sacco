import React from 'react';
import PropTypes from 'prop-types';
import { Menu, X, RefreshCw, Bell } from 'lucide-react';

const MobileHeader = ({ 
  onToggleSidebar, 
  isSidebarOpen,
  pageTitle,
  onRefresh,
  loading = false,
  unreadNotifications = 0
}) => {
  return (
    <div className="mobile-header">
      <button 
        className="hamburger" 
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <div className="page-title">
        <h2>{pageTitle}</h2>
      </div>
      
      <div className="mobile-actions">
        <div className="notification-badge">
          <button className="btn-icon">
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="badge">{unreadNotifications}</span>
            )}
          </button>
        </div>
        
        <button 
          className="btn-icon" 
          onClick={onRefresh}
          aria-label="Refresh"
          disabled={loading}
        >
          <RefreshCw size={20} />
        </button>
      </div>
    </div>
  );
};

MobileHeader.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
  isSidebarOpen: PropTypes.bool.isRequired,
  pageTitle: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  unreadNotifications: PropTypes.number
};

export default MobileHeader;