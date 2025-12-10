import React from 'react';
import PropTypes from 'prop-types';
import { 
  DollarSign, CreditCard, Receipt, 
  CheckCircle2, Clock, AlertCircle 
} from 'lucide-react';

const PendingActions = ({ 
  pendingCounts, 
  onReviewCollections, 
  onReviewLoans, 
  onReviewExpenses,
  loading = false 
}) => {
  const {
    pendingCollections = 0,
    pendingLoans = 0,
    pendingExpenses = 0
  } = pendingCounts || {};

  return (
    <div className="content-card">
      <div className="card-header">
        <h3><CheckCircle2 size={20} /> Pending Actions</h3>
      </div>
      
      {loading ? (
        <div className="loading-placeholder">
          <div className="loading-skeleton" style={{ height: '120px' }}></div>
        </div>
      ) : (
        <div className="pending-actions">
          <div className="pending-item warning">
            <div className="pending-icon">
              <DollarSign size={20} />
            </div>
            <div className="pending-info">
              <strong>{pendingCollections} Collections</strong>
              <p>Awaiting review</p>
            </div>
            <button 
              className="btn btn-sm"
              onClick={onReviewCollections}
              disabled={pendingCollections === 0}
            >
              Review
            </button>
          </div>
          
          <div className="pending-item warning">
            <div className="pending-icon">
              <CreditCard size={20} />
            </div>
            <div className="pending-info">
              <strong>{pendingLoans} Loan Requests</strong>
              <p>Pending approval</p>
            </div>
            <button 
              className="btn btn-sm"
              onClick={onReviewLoans}
              disabled={pendingLoans === 0}
            >
              Review
            </button>
          </div>
          
          <div className="pending-item info">
            <div className="pending-icon">
              <Receipt size={20} />
            </div>
            <div className="pending-info">
              <strong>Expense Approval</strong>
              <p>Pending facilitator expenses</p>
            </div>
            <button 
              className="btn btn-sm"
              onClick={onReviewExpenses}
            >
              View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

PendingActions.propTypes = {
  pendingCounts: PropTypes.shape({
    pendingCollections: PropTypes.number,
    pendingLoans: PropTypes.number,
    pendingExpenses: PropTypes.number
  }),
  onReviewCollections: PropTypes.func,
  onReviewLoans: PropTypes.func,
  onReviewExpenses: PropTypes.func,
  loading: PropTypes.bool
};

export default PendingActions;