import React from 'react';
import PropTypes from 'prop-types';
import { Eye, Check, X, Receipt, Download, FileText } from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const ExpensesTable = ({ 
  expenses, 
  loading = false,
  onViewDetails,
  onApprove,
  onReject,
  onExport,
  emptyMessage = "No expenses found"
}) => {
  const handleExport = (expenseId, format) => {
    onExport(expenseId, format);
  };

  if (loading) {
    return (
      <div className="loading-placeholder">
        <div className="loading-skeleton" style={{ height: '300px' }}></div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="no-data">
        <Receipt size={48} />
        <h4>{emptyMessage}</h4>
        <p>No expense records found for this branch</p>
      </div>
    );
  }

  return (
    <div className="expenses-table">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Receipt #</th>
              <th>Submitted By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{formatDate(expense.expense_date)}</td>
                <td>
                  <span className="category-badge">
                    {expense.category?.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div className="description">
                    {expense.description}
                    {expense.notes && (
                      <small className="notes">{expense.notes}</small>
                    )}
                  </div>
                </td>
                <td className="numeric">
                  <strong>{formatCurrency(expense.amount)}</strong>
                </td>
                <td>
                  {expense.receipt_number ? (
                    <code>{expense.receipt_number}</code>
                  ) : (
                    <span className="no-receipt">No Receipt</span>
                  )}
                </td>
                <td>
                  <div className="submitter-info">
                    <strong>{expense.recorded_by_name || 'System'}</strong>
                    <small>{expense.recorded_by_role || 'Branch Manager'}</small>
                  </div>
                </td>
                <td>
                  <StatusBadge status={expense.status} />
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      onClick={() => onViewDetails(expense)}
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    
                    {expense.status === 'pending' && (
                      <>
                        <button
                          className="btn-icon success"
                          onClick={() => onApprove(expense.id)}
                          title="Approve Expense"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => onReject(expense.id)}
                          title="Reject Expense"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                    
                    {expense.receipt_url && (
                      <button
                        className="btn-icon"
                        onClick={() => window.open(expense.receipt_url, '_blank')}
                        title="View Receipt"
                      >
                        <Receipt size={14} />
                      </button>
                    )}
                    
                    <button
                      className="btn-icon"
                      onClick={() => handleExport(expense.id, 'pdf')}
                      title="Export as PDF"
                    >
                      <FileText size={14} />
                    </button>
                    
                    <button
                      className="btn-icon"
                      onClick={() => handleExport(expense.id, 'excel')}
                      title="Export as Excel"
                    >
                      <Download size={14} />
                    </button>
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

ExpensesTable.propTypes = {
  expenses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    expense_date: PropTypes.string.isRequired,
    category: PropTypes.string,
    description: PropTypes.string,
    notes: PropTypes.string,
    amount: PropTypes.number,
    receipt_number: PropTypes.string,
    receipt_url: PropTypes.string,
    recorded_by_name: PropTypes.string,
    recorded_by_role: PropTypes.string,
    status: PropTypes.string.isRequired
  })).isRequired,
  loading: PropTypes.bool,
  onViewDetails: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  emptyMessage: PropTypes.string
};

export default ExpensesTable;