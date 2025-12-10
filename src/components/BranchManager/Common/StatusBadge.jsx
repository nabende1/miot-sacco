import React from 'react';
import PropTypes from 'prop-types';
import { 
  CheckCircle2, Clock, AlertCircle, X, 
  AlertTriangle, Circle, Building2, Users, DollarSign 
} from 'lucide-react';

const StatusBadge = ({ status, label, showIcon = true, size = 'md' }) => {
  const statusConfig = {
    submitted: { 
      icon: <Clock size={12} />, 
      color: 'warning', 
      defaultLabel: 'Submitted' 
    },
    reviewed: { 
      icon: <CheckCircle2 size={12} />, 
      color: 'success', 
      defaultLabel: 'Reviewed' 
    },
    flagged: { 
      icon: <AlertCircle size={12} />, 
      color: 'danger', 
      defaultLabel: 'Flagged' 
    },
    pending_branch_manager: { 
      icon: <Clock size={12} />, 
      color: 'warning', 
      defaultLabel: 'Pending Review' 
    },
    pending_general_manager: { 
      icon: <Clock size={12} />, 
      color: 'info', 
      defaultLabel: 'Pending GM' 
    },
    approved: { 
      icon: <CheckCircle2 size={12} />, 
      color: 'success', 
      defaultLabel: 'Approved' 
    },
    rejected: { 
      icon: <X size={12} />, 
      color: 'danger', 
      defaultLabel: 'Rejected' 
    },
    correction_required: { 
      icon: <AlertCircle size={12} />, 
      color: 'warning', 
      defaultLabel: 'Needs Correction' 
    },
    active: { 
      icon: <CheckCircle2 size={12} />, 
      color: 'success', 
      defaultLabel: 'Active' 
    },
    inactive: { 
      icon: <X size={12} />, 
      color: 'danger', 
      defaultLabel: 'Inactive' 
    },
    default: { 
      icon: <AlertTriangle size={12} />, 
      color: 'danger', 
      defaultLabel: 'Default' 
    },
    excellent: { 
      icon: <CheckCircle2 size={12} />, 
      color: 'success', 
      defaultLabel: 'Excellent' 
    },
    good: { 
      icon: <Circle size={12} />, 
      color: 'info', 
      defaultLabel: 'Good' 
    },
    average: { 
      icon: <AlertCircle size={12} />, 
      color: 'warning', 
      defaultLabel: 'Average' 
    },
    poor: { 
      icon: <X size={12} />, 
      color: 'danger', 
      defaultLabel: 'Poor' 
    }
  };

  const config = statusConfig[status] || { 
    icon: <Circle size={12} />, 
    color: 'neutral', 
    defaultLabel: status 
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <span className={`status-badge ${config.color} ${sizeClasses[size]}`}>
      {showIcon && config.icon}
      {label || config.defaultLabel}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  label: PropTypes.string,
  showIcon: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default StatusBadge;