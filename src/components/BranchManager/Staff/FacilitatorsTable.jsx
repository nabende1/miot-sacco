import React from 'react';
import PropTypes from 'prop-types';
import { Eye, Edit, Building2, DollarSign, Award, Users } from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';
import { formatCurrency } from '../../../utils/formatters';

const FacilitatorsTable = ({ 
  facilitators, 
  loading = false,
  onViewProfile,
  onEditFacilitator,
  onAssignGroups,
  emptyMessage = "No facilitators found"
}) => {
  if (loading) {
    return (
      <div className="loading-placeholder">
        <div className="loading-skeleton" style={{ height: '300px' }}></div>
      </div>
    );
  }

  if (facilitators.length === 0) {
    return (
      <div className="no-data">
        <Users size={48} />
        <h4>{emptyMessage}</h4>
        <p>No facilitators are currently assigned to this branch</p>
      </div>
    );
  }

  return (
    <div className="facilitators-table">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Groups Assigned</th>
              <th>Active Groups</th>
              <th>Weekly Collections</th>
              <th>Accuracy Score</th>
              <th>Errors Flagged</th>
              <th>Performance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilitators.map((facilitator) => {
              const metrics = facilitator.performance_metrics || {};
              const performance = metrics.accuracyScore || 0;
              const performanceRating = performance >= 90 ? 'excellent' : 
                                      performance >= 80 ? 'good' : 
                                      performance >= 70 ? 'average' : 'poor';
              
              return (
                <tr key={facilitator.id}>
                  <td>
                    <div className="user-info">
                      <strong>{facilitator.full_name}</strong>
                      <small>{facilitator.email}</small>
                      <small className="phone">{facilitator.phone}</small>
                    </div>
                  </td>
                  <td className="numeric">
                    <div className="group-count">
                      <Building2 size={14} />
                      <span>{metrics.groupsHandled || 0}</span>
                    </div>
                  </td>
                  <td className="numeric">
                    {facilitator.groups?.length || 0}
                  </td>
                  <td className="numeric">
                    <div className="collection-amount">
                      {formatCurrency(metrics.totalCollections || 0)}
                    </div>
                  </td>
                  <td>
                    <div className="score-indicator">
                      <div className="score-bar">
                        <div 
                          className={`score-fill ${performanceRating}`}
                          style={{ width: `${performance}%` }}
                        ></div>
                      </div>
                      <span className="score-value">{performance}%</span>
                    </div>
                  </td>
                  <td className="numeric">
                    <span className={`error-count ${facilitator.error_count > 0 ? 'warning' : 'success'}`}>
                      {facilitator.error_count || 0}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={performanceRating} />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => onViewProfile(facilitator)}
                        title="View Profile"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => onEditFacilitator(facilitator)}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => onAssignGroups(facilitator)}
                        title="Assign Groups"
                      >
                        <Building2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

FacilitatorsTable.propTypes = {
  facilitators: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    full_name: PropTypes.string.isRequired,
    email: PropTypes.string,
    phone: PropTypes.string,
    performance_metrics: PropTypes.shape({
      groupsHandled: PropTypes.number,
      totalCollections: PropTypes.number,
      accuracyScore: PropTypes.number
    }),
    groups: PropTypes.array,
    error_count: PropTypes.number
  })).isRequired,
  loading: PropTypes.bool,
  onViewProfile: PropTypes.func.isRequired,
  onEditFacilitator: PropTypes.func.isRequired,
  onAssignGroups: PropTypes.func.isRequired,
  emptyMessage: PropTypes.string
};

export default FacilitatorsTable;