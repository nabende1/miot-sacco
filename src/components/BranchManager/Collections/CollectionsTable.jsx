import React from 'react';
import PropTypes from 'prop-types';
import { Eye, Check, AlertCircle } from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const CollectionsTable = ({ 
  collections, 
  loading = false,
  onViewDetails,
  onApprove,
  onFlag,
  emptyMessage = "No collections found"
}) => {
  if (loading) {
    return (
      <div className="loading-placeholder">
        <div className="loading-skeleton" style={{ height: '300px' }}></div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="no-data">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Facilitator</th>
            <th>Group</th>
            <th>Savings</th>
            <th>Social Fund</th>
            <th>Loan Repayment</th>
            <th>Opening Balance</th>
            <th>Fines</th>
            <th>Total Income</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((collection) => (
            <tr key={collection.id}>
              <td>{formatDate(collection.collection_date)}</td>
              <td>
                <div className="user-info">
                  <strong>{collection.facilitators?.full_name || 'N/A'}</strong>
                </div>
              </td>
              <td>
                <div className="group-info">
                  <strong>{collection.groups?.group_name || 'N/A'}</strong>
                  <small>{collection.groups?.group_code || ''}</small>
                </div>
              </td>
              <td className="numeric">{formatCurrency(collection.total_savings)}</td>
              <td className="numeric">{formatCurrency(collection.total_social_fund)}</td>
              <td className="numeric">{formatCurrency(collection.total_loan_repayments)}</td>
              <td className="numeric">{formatCurrency(collection.total_opening_balance || 0)}</td>
              <td className="numeric">{formatCurrency(collection.total_fines)}</td>
              <td className="numeric total-income">
                {formatCurrency(collection.total_collections)}
              </td>
              <td>
                <StatusBadge status={collection.status} />
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-icon"
                    onClick={() => onViewDetails(collection)}
                    title="View Details"
                  >
                    <Eye size={14} />
                  </button>
                  {collection.status === 'submitted' && (
                    <>
                      <button
                        className="btn-icon success"
                        onClick={() => onApprove(collection.id)}
                        title="Approve"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="btn-icon warning"
                        onClick={() => onFlag(collection.id)}
                        title="Flag for Correction"
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
  );
};

CollectionsTable.propTypes = {
  collections: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    collection_date: PropTypes.string.isRequired,
    facilitators: PropTypes.shape({
      full_name: PropTypes.string
    }),
    groups: PropTypes.shape({
      group_name: PropTypes.string,
      group_code: PropTypes.string
    }),
    total_savings: PropTypes.number,
    total_social_fund: PropTypes.number,
    total_loan_repayments: PropTypes.number,
    total_opening_balance: PropTypes.number,
    total_fines: PropTypes.number,
    total_collections: PropTypes.number,
    status: PropTypes.string.isRequired
  })).isRequired,
  loading: PropTypes.bool,
  onViewDetails: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onFlag: PropTypes.func.isRequired,
  emptyMessage: PropTypes.string
};

export default CollectionsTable;