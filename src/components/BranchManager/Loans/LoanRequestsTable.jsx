import React from 'react';
import PropTypes from 'prop-types';
import { Eye, Check, X, AlertCircle, Users } from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const LoanRequestsTable = ({ 
  loans, 
  loading = false,
  onSelectLoan,
  onReviewLoan,
  emptyMessage = "No loan requests found"
}) => {
  const handleApprove = (loanId, e) => {
    e.stopPropagation();
    if (window.confirm('Approve this loan request?')) {
      onReviewLoan(loanId, 'approve');
    }
  };

  const handleReject = (loanId, e) => {
    e.stopPropagation();
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      onReviewLoan(loanId, 'reject', reason);
    }
  };

  if (loading) {
    return (
      <div className="loading-placeholder">
        <div className="loading-skeleton" style={{ height: '300px' }}></div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="no-data">
        <Users size={48} />
        <h4>{emptyMessage}</h4>
        <p>No loan requests are currently pending your review</p>
      </div>
    );
  }

  return (
    <div className="loan-requests-table">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Group</th>
              <th>Amount</th>
              <th>Members</th>
              <th>Facilitator</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr 
                key={loan.id}
                onClick={() => onSelectLoan(loan)}
                className="clickable-row"
              >
                <td>
                  <strong>LN-{loan.id}</strong>
                </td>
                <td>
                  <div className="group-info">
                    <strong>{loan.groups?.group_name}</strong>
                    <small>{loan.groups?.group_code}</small>
                  </div>
                </td>
                <td className="numeric">
                  <strong>{formatCurrency(loan.total_amount)}</strong>
                </td>
                <td>
                  <div className="member-count">
                    <Users size={14} />
                    <span>{loan.application_members?.length || 0} members</span>
                  </div>
                </td>
                <td>{loan.facilitators?.full_name}</td>
                <td>
                  <StatusBadge status={loan.status} />
                </td>
                <td>{formatDate(loan.created_at)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      onClick={() => onSelectLoan(loan)}
                      title="Review Details"
                    >
                      <Eye size={14} />
                    </button>
                    
                    {loan.status === 'pending_branch_manager' && (
                      <>
                        <button
                          className="btn-icon success"
                          onClick={(e) => handleApprove(loan.id, e)}
                          title="Approve Loan"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={(e) => handleReject(loan.id, e)}
                          title="Reject Loan"
                        >
                          <X size={14} />
                        </button>
                        <button
                          className="btn-icon warning"
                          onClick={() => {
                            const comments = prompt('Enter correction request:');
                            if (comments) onReviewLoan(loan.id, 'request_correction', comments);
                          }}
                          title="Request Corrections"
                        >
                          <AlertCircle size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

LoanRequestsTable.propTypes = {
  loans: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    groups: PropTypes.shape({
      group_name: PropTypes.string,
      group_code: PropTypes.string
    }),
    total_amount: PropTypes.number,
    application_members: PropTypes.array,
    facilitators: PropTypes.shape({
      full_name: PropTypes.string
    }),
    status: PropTypes.string,
    created_at: PropTypes.string
  })).isRequired,
  loading: PropTypes.bool,
  onSelectLoan: PropTypes.func.isRequired,
  onReviewLoan: PropTypes.func.isRequired,
  emptyMessage: PropTypes.string
};

export default LoanRequestsTable;