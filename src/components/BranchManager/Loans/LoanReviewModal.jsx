import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Users, DollarSign, FileText, Clock, AlertCircle } from 'lucide-react';
import Modal from '../Common/Modal';
import StatusBadge from '../Common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const LoanReviewModal = ({ 
  loan, 
  isOpen, 
  onClose, 
  onReview,
  loading = false 
}) => {
  const [reviewComments, setReviewComments] = useState('');
  const [decision, setDecision] = useState('approve');

  if (!loan) return null;

  const handleSubmit = () => {
    if (decision === 'reject' && !reviewComments.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    onReview(loan.id, decision, reviewComments);
    setReviewComments('');
    setDecision('approve');
  };

  const totalLoanAmount = loan.total_amount || 0;
  const memberCount = loan.application_members?.length || 0;
  const averageLoan = memberCount > 0 ? totalLoanAmount / memberCount : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Loan Application Review"
      size="lg"
    >
      <div className="loan-review-modal">
        {/* Loan Summary */}
        <div className="loan-summary">
          <div className="summary-header">
            <div>
              <h3>Loan #{loan.id}</h3>
              <p>Group: {loan.groups?.group_name}</p>
            </div>
            <StatusBadge status={loan.status} />
          </div>
          
          <div className="summary-grid">
            <div className="summary-item">
              <DollarSign size={18} />
              <div>
                <label>Total Amount</label>
                <strong>{formatCurrency(totalLoanAmount)}</strong>
              </div>
            </div>
            
            <div className="summary-item">
              <Users size={18} />
              <div>
                <label>Members</label>
                <strong>{memberCount} members</strong>
              </div>
            </div>
            
            <div className="summary-item">
              <DollarSign size={18} />
              <div>
                <label>Average per Member</label>
                <strong>{formatCurrency(averageLoan)}</strong>
              </div>
            </div>
            
            <div className="summary-item">
              <Clock size={18} />
              <div>
                <label>Submitted</label>
                <strong>{formatDate(loan.created_at)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="members-section">
          <h4>Member Loan Details</h4>
          <div className="members-list">
            {loan.application_members?.map((member, index) => (
              <div key={index} className="member-item">
                <div className="member-info">
                  <strong>{member.members?.full_name}</strong>
                  <small>{member.members?.member_number}</small>
                </div>
                <div className="loan-details">
                  <span>{formatCurrency(member.loan_amount)}</span>
                  <small>{member.purpose || 'General use'}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group History */}
        <div className="group-history">
          <h4>Group Loan History</h4>
          <div className="history-stats">
            <div className="stat-item">
              <span>Previous Loans</span>
              <strong>5</strong>
            </div>
            <div className="stat-item">
              <span>Total Repaid</span>
              <strong className="success">{formatCurrency(2500000)}</strong>
            </div>
            <div className="stat-item">
              <span>Default Rate</span>
              <strong className="warning">2.5%</strong>
            </div>
            <div className="stat-item">
              <span>Performance</span>
              <strong className="success">Good</strong>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="review-form">
          <div className="form-group">
            <label>Decision *</label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="form-select"
              disabled={loading}
            >
              <option value="approve">Approve & Forward to GM</option>
              <option value="request_correction">Request Corrections</option>
              <option value="reject">Reject Application</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Comments / Conditions</label>
            <textarea
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder="Enter your comments, conditions, or reasons..."
              rows={3}
              className="form-control"
              disabled={loading}
              required={decision === 'reject'}
            />
            <small className="form-text">
              {decision === 'approve' ? 'These comments will be visible to the General Manager' :
               decision === 'reject' ? 'Reason for rejection is required' :
               'Specify what corrections are needed'}
            </small>
          </div>
          
          {decision === 'request_correction' && (
            <div className="form-group">
              <label>Deadline for Correction</label>
              <input
                type="date"
                className="form-control"
                defaultValue={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || (decision === 'reject' && !reviewComments.trim())}
          >
            {loading ? 'Processing...' : 
             decision === 'approve' ? 'Approve & Forward to GM' :
             decision === 'reject' ? 'Reject Application' :
             'Request Corrections'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

LoanReviewModal.propTypes = {
  loan: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onReview: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default LoanReviewModal;