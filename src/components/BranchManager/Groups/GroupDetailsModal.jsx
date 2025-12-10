import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Building2, Users, DollarSign, CreditCard, Calendar, 
  MapPin, Phone, Mail, TrendingUp, AlertCircle 
} from 'lucide-react';
import Modal from '../Common/Modal';
import StatusBadge from '../Common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const GroupDetailsModal = ({ 
  group, 
  isOpen, 
  onClose, 
  onReassign,
  onUpdate,
  loading = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    meeting_day: group?.meeting_day || '',
    meeting_time: group?.meeting_time || '',
    meeting_location: group?.meeting_location || '',
    is_active: group?.is_active || true,
    facilitator_id: group?.facilitator_id || ''
  });

  if (!group) return null;

  const totalMembers = group.members?.length || 0;
  const totalSavings = group.group_savings?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
  const activeLoans = group.group_loans?.filter(loan => loan.status === 'active').length || 0;
  const totalLoanBalance = group.group_loans
    ?.filter(loan => loan.status === 'active')
    .reduce((sum, loan) => sum + (loan.remaining_balance || 0), 0) || 0;

  const handleSave = () => {
    onUpdate(group.id, formData);
    setIsEditing(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Group: ${group.group_name}`}
      size="lg"
    >
      <div className="group-details-modal">
        {/* Group Header */}
        <div className="group-header">
          <div className="group-title">
            <Building2 size={24} />
            <div>
              <h3>{group.group_name}</h3>
              <p className="group-code">{group.group_code}</p>
            </div>
          </div>
          <div className="group-status">
            <StatusBadge status={group.is_active ? 'active' : 'inactive'} />
            {group.has_defaulted && (
              <StatusBadge status="default" label="Has Defaulted" />
            )}
          </div>
        </div>

        {/* Group Info Tabs */}
        <div className="tabs">
          <div className="tab active">Overview</div>
          <div className="tab">Members</div>
          <div className="tab">Loans</div>
          <div className="tab">Savings</div>
          <div className="tab">Performance</div>
        </div>

        {/* Overview Content */}
        <div className="overview-content">
          {/* Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              <Users size={20} />
              <div>
                <label>Total Members</label>
                <strong>{totalMembers}</strong>
              </div>
            </div>
            
            <div className="stat-card">
              <DollarSign size={20} />
              <div>
                <label>Total Savings</label>
                <strong className="success">{formatCurrency(totalSavings)}</strong>
              </div>
            </div>
            
            <div className="stat-card">
              <CreditCard size={20} />
              <div>
                <label>Active Loans</label>
                <strong>{activeLoans}</strong>
              </div>
            </div>
            
            <div className="stat-card">
              <DollarSign size={20} />
              <div>
                <label>Loan Balance</label>
                <strong className="warning">{formatCurrency(totalLoanBalance)}</strong>
              </div>
            </div>
          </div>

          {/* Group Details */}
          <div className="details-section">
            <h4>Group Details</h4>
            <div className="details-grid">
              {isEditing ? (
                <>
                  <div className="form-group">
                    <label>Meeting Day</label>
                    <select
                      value={formData.meeting_day}
                      onChange={(e) => setFormData({...formData, meeting_day: e.target.value})}
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
                    <label>Meeting Time</label>
                    <input
                      type="time"
                      value={formData.meeting_time}
                      onChange={(e) => setFormData({...formData, meeting_time: e.target.value})}
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Meeting Location</label>
                    <input
                      type="text"
                      value={formData.meeting_location}
                      onChange={(e) => setFormData({...formData, meeting_location: e.target.value})}
                      className="form-control"
                      placeholder="Enter meeting location"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="detail-item">
                    <Calendar size={16} />
                    <div>
                      <label>Meeting Day</label>
                      <strong>{group.meeting_day}s</strong>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <Calendar size={16} />
                    <div>
                      <label>Meeting Time</label>
                      <strong>{group.meeting_time}</strong>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <MapPin size={16} />
                    <div>
                      <label>Location</label>
                      <strong>{group.meeting_location || 'Not specified'}</strong>
                    </div>
                  </div>
                </>
              )}
              
              <div className="detail-item">
                <Users size={16} />
                <div>
                  <label>Facilitator</label>
                  <strong>{group.facilitators?.full_name || 'Unassigned'}</strong>
                  {group.facilitators?.email && (
                    <small>{group.facilitators.email}</small>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="performance-section">
            <h4>Performance Metrics</h4>
            <div className="metrics-grid">
              <div className="metric">
                <div className="metric-label">Attendance Rate</div>
                <div className="metric-value success">92%</div>
              </div>
              <div className="metric">
                <div className="metric-label">Collection Rate</div>
                <div className="metric-value warning">85%</div>
              </div>
              <div className="metric">
                <div className="metric-label">Savings Growth</div>
                <div className="metric-value success">+15%</div>
              </div>
              <div className="metric">
                <div className="metric-label">Loan Performance</div>
                <div className="metric-value success">Good</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-section">
            <h4>Recent Activity</h4>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon success">
                  <DollarSign size={14} />
                </div>
                <div className="activity-details">
                  <p>Daily collection submitted</p>
                  <small>Today at 2:30 PM • UGX 250,000 collected</small>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon info">
                  <CreditCard size={14} />
                </div>
                <div className="activity-details">
                  <p>Loan repayment received</p>
                  <small>Yesterday • UGX 50,000 from 2 members</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <div className="left-actions">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
            <button
              className="btn btn-info"
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Group'}
            </button>
          </div>
          
          <div className="right-actions">
            {isEditing ? (
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                Save Changes
              </button>
            ) : (
              <>
                <button
                  className="btn btn-warning"
                  onClick={() => onReassign(group.id)}
                  disabled={loading}
                >
                  Reassign Facilitator
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => onUpdate(group.id, { is_active: !group.is_active })}
                  disabled={loading}
                >
                  {group.is_active ? 'Deactivate Group' : 'Activate Group'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

GroupDetailsModal.propTypes = {
  group: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onReassign: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default GroupDetailsModal;