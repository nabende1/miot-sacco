import React from 'react';
import PropTypes from 'prop-types';
import { Eye, Edit, Lock, Unlock, Building2, Users, DollarSign, TrendingUp } from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';
import { formatCurrency } from '../../../utils/formatters';

const GroupsTable = ({ 
  groups, 
  loading = false,
  onViewGroup,
  onEditGroup,
  onToggleStatus,
  emptyMessage = "No groups found"
}) => {
  if (loading) {
    return (
      <div className="loading-placeholder">
        <div className="loading-skeleton" style={{ height: '300px' }}></div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="no-data">
        <Building2 size={48} />
        <h4>{emptyMessage}</h4>
        <p>No groups are currently assigned to this branch</p>
      </div>
    );
  }

  return (
    <div className="groups-table">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Group Code</th>
              <th>Facilitator</th>
              <th>Weekly Savings</th>
              <th>Active Loans</th>
              <th>Performance</th>
              <th>Default Status</th>
              <th>Total Savings</th>
              <th>Loan Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const totalSavings = group.group_savings?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
              const performance = group.performance_score || 0;
              const performanceRating = performance >= 90 ? 'excellent' : 
                                      performance >= 80 ? 'good' : 
                                      performance >= 70 ? 'average' : 'poor';
              
              return (
                <tr key={group.id}>
                  <td>
                    <div className="group-info">
                      <strong>{group.group_name}</strong>
                      <small>{group.meeting_day}s at {group.meeting_time}</small>
                    </div>
                  </td>
                  <td>
                    <code>{group.group_code}</code>
                  </td>
                  <td>
                    <div className="facilitator-info">
                      <strong>{group.facilitators?.full_name || 'Unassigned'}</strong>
                      {group.facilitators?.email && (
                        <small>{group.facilitators.email}</small>
                      )}
                    </div>
                  </td>
                  <td className="numeric">
                    {formatCurrency(group.weekly_savings || 0)}
                  </td>
                  <td className="numeric">
                    {group.group_loans?.length || 0}
                  </td>
                  <td>
                    <div className="performance-indicator">
                      <div className="performance-bar">
                        <div 
                          className={`performance-fill ${performanceRating}`}
                          style={{ width: `${performance}%` }}
                        ></div>
                      </div>
                      <span className="performance-score">{performance}%</span>
                    </div>
                  </td>
                  <td>
                    {group.has_defaulted ? (
                      <StatusBadge status="default" />
                    ) : (
                      <StatusBadge status="active" />
                    )}
                  </td>
                  <td className="numeric success">
                    {formatCurrency(totalSavings)}
                  </td>
                  <td className="numeric">
                    {formatCurrency(group.total_loan_balance || 0)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => onViewGroup(group)}
                        title="View Group Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => onEditGroup(group)}
                        title="Edit Group"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => onToggleStatus(group.id, !group.is_active)}
                        title={group.is_active ? "Deactivate Group" : "Activate Group"}
                      >
                        {group.is_active ? <Lock size={14} /> : <Unlock size={14} />}
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

GroupsTable.propTypes = {
  groups: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    group_name: PropTypes.string.isRequired,
    group_code: PropTypes.string,
    meeting_day: PropTypes.string,
    meeting_time: PropTypes.string,
    facilitators: PropTypes.shape({
      full_name: PropTypes.string,
      email: PropTypes.string
    }),
    weekly_savings: PropTypes.number,
    group_loans: PropTypes.array,
    performance_score: PropTypes.number,
    has_defaulted: PropTypes.bool,
    group_savings: PropTypes.array,
    total_loan_balance: PropTypes.number,
    is_active: PropTypes.bool
  })).isRequired,
  loading: PropTypes.bool,
  onViewGroup: PropTypes.func.isRequired,
  onEditGroup: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  emptyMessage: PropTypes.string
};

export default GroupsTable;