import React from 'react';
import PropTypes from 'prop-types';
import { 
  DollarSign, TrendingUp, TrendingDown, 
  PieChart, BarChart3, Calendar 
} from 'lucide-react';
import StatCard from '../Common/StatCard';
import { formatCurrency } from '../../../utils/formatters';

const ExpenseSummary = ({ 
  summary, 
  period = 'monthly',
  onPeriodChange,
  loading = false 
}) => {
  const {
    totalExpenses = 0,
    pendingApproval = 0,
    approvedExpenses = 0,
    rejectedExpenses = 0,
    byCategory = [],
    byMonth = [],
    netProfit = 0,
    income = 0
  } = summary || {};

  const expenseRatio = income > 0 ? (totalExpenses / income) * 100 : 0;

  return (
    <div className="expense-summary">
      <div className="summary-header">
        <h3><DollarSign size={24} /> Expense Summary</h3>
        <div className="period-selector">
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="form-select"
            disabled={loading}
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <StatCard
          title="Total Expenses"
          value={loading ? '...' : formatCurrency(totalExpenses)}
          icon={DollarSign}
          status="warning"
          subtitle={`${expenseRatio.toFixed(1)}% of income`}
          loading={loading}
        />
        
        <StatCard
          title="Pending Approval"
          value={loading ? '...' : pendingApproval}
          icon={Calendar}
          status="warning"
          subtitle="Awaiting review"
          loading={loading}
        />
        
        <StatCard
          title="Approved Expenses"
          value={loading ? '...' : approvedExpenses}
          icon={TrendingUp}
          status="success"
          subtitle="Processed"
          loading={loading}
        />
        
        <StatCard
          title="Net Profit"
          value={loading ? '...' : formatCurrency(netProfit)}
          icon={netProfit > 0 ? TrendingUp : TrendingDown}
          status={netProfit > 0 ? 'success' : 'danger'}
          subtitle="Income - Expenses"
          loading={loading}
        />
      </div>

      {/* Category Breakdown */}
      {byCategory.length > 0 && (
        <div className="category-breakdown">
          <div className="section-header">
            <h4><PieChart size={18} /> Expenses by Category</h4>
          </div>
          <div className="category-list">
            {byCategory.map((category, index) => {
              const percentage = totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0;
              
              return (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{category.name}</span>
                    <span className="category-amount">{formatCurrency(category.amount)}</span>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="bar-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <span className="category-percentage">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Trend */}
      {byMonth.length > 0 && (
        <div className="monthly-trend">
          <div className="section-header">
            <h4><BarChart3 size={18} /> Monthly Expense Trend</h4>
          </div>
          <div className="trend-chart">
            {byMonth.map((month, index) => {
              const maxAmount = Math.max(...byMonth.map(m => m.amount));
              const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
              
              return (
                <div key={index} className="month-column">
                  <div className="column-label">{month.month}</div>
                  <div className="column-bar">
                    <div 
                      className="bar"
                      style={{ height: `${height}%` }}
                      title={`${formatCurrency(month.amount)}`}
                    >
                      <span className="bar-value">{formatCurrencyShort(month.amount)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-item">
          <span>Avg Daily Expense</span>
          <strong>{formatCurrency(totalExpenses / 30)}</strong>
        </div>
        <div className="stat-item">
          <span>Largest Expense</span>
          <strong className="warning">
            {formatCurrency(Math.max(...byCategory.map(c => c.amount)))}
          </strong>
        </div>
        <div className="stat-item">
          <span>Expense Growth</span>
          <strong className={expenseRatio > 50 ? 'danger' : 'success'}>
            {expenseRatio.toFixed(1)}%
          </strong>
        </div>
        <div className="stat-item">
          <span>Savings Rate</span>
          <strong className="success">
            {((1 - (totalExpenses / income)) * 100).toFixed(1)}%
          </strong>
        </div>
      </div>
    </div>
  );
};

// Helper function
const formatCurrencyShort = (amount) => {
  if (amount >= 1000000) {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `UGX ${(amount / 1000).toFixed(1)}K`;
  }
  return `UGX ${amount}`;
};

ExpenseSummary.propTypes = {
  summary: PropTypes.shape({
    totalExpenses: PropTypes.number,
    pendingApproval: PropTypes.number,
    approvedExpenses: PropTypes.number,
    rejectedExpenses: PropTypes.number,
    byCategory: PropTypes.array,
    byMonth: PropTypes.array,
    netProfit: PropTypes.number,
    income: PropTypes.number
  }),
  period: PropTypes.string,
  onPeriodChange: PropTypes.func,
  loading: PropTypes.bool
};

export default ExpenseSummary;