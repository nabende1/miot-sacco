import React from 'react';
import PropTypes from 'prop-types';

const StatCard = ({ title, value, icon: Icon, status = 'neutral', subtitle, onClick, loading = false }) => {
  const statusClasses = {
    primary: 'primary',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info',
    neutral: 'neutral'
  };

  const statusColors = {
    primary: { bg: '#e3f2fd', color: '#3498db', border: '#3498db' },
    success: { bg: '#d5f4e6', color: '#27ae60', border: '#27ae60' },
    warning: { bg: '#fef9e7', color: '#f39c12', border: '#f39c12' },
    danger: { bg: '#fdedec', color: '#e74c3c', border: '#e74c3c' },
    info: { bg: '#e3f2fd', color: '#3498db', border: '#3498db' },
    neutral: { bg: '#edf2f7', color: '#4a5568', border: '#4a5568' }
  };

  const colors = statusColors[status] || statusColors.neutral;

  return (
    <div 
      className={`stat-card ${statusClasses[status]}`}
      style={{ 
        borderLeft: `4px solid ${colors.border}`,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <div 
        className="stat-icon"
        style={{ background: colors.bg, color: colors.color }}
      >
        {Icon && <Icon size={24} />}
      </div>
      <div className="stat-info">
        {loading ? (
          <div className="loading-skeleton" style={{ width: '80px', height: '24px' }}></div>
        ) : (
          <h3>{value}</h3>
        )}
        <p>{title}</p>
        {subtitle && <small className="stat-subtitle">{subtitle}</small>}
      </div>
      {onClick && (
        <div className="stat-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      )}
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  status: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info', 'neutral']),
  subtitle: PropTypes.string,
  onClick: PropTypes.func,
  loading: PropTypes.bool
};

export default StatCard;