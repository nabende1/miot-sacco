import React from 'react';
import PropTypes from 'prop-types';
import { LineChart, BarChart3, PieChart, TrendingUp } from 'lucide-react';

const PerformanceCharts = ({ chartData, loading = false }) => {
  const {
    weeklySavingsTrend = [],
    monthlyLoanDisbursement = [],
    monthlyLoanRepayment = [],
    monthlyBranchProfit = [],
    groupLoanPerformance = []
  } = chartData || {};

  if (loading) {
    return (
      <div className="performance-charts loading">
        <div className="loading-skeleton" style={{ height: '400px' }}></div>
      </div>
    );
  }

  return (
    <div className="performance-charts">
      <div className="charts-grid">
        {/* Weekly Savings Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h4><LineChart size={18} /> Weekly Savings Trend</h4>
          </div>
          <div className="chart-content">
            <div className="bar-chart">
              {weeklySavingsTrend.map((week, index) => {
                const max = Math.max(...weeklySavingsTrend.map(w => w.savings || 0));
                const height = max > 0 ? ((week.savings || 0) / max) * 100 : 0;
                
                return (
                  <div key={index} className="bar-item">
                    <div className="bar-label">{week.week}</div>
                    <div className="bar-container">
                      <div 
                        className="bar"
                        style={{ height: `${height}%` }}
                        title={`${formatCurrency(week.savings || 0)}`}
                      >
                        <span className="bar-value">{formatCurrencyShort(week.savings || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loan Performance Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h4><BarChart3 size={18} /> Loan Disbursement vs Repayment</h4>
            <div className="chart-legend">
              <span className="legend-item disbursed">Disbursed</span>
              <span className="legend-item repaid">Repaid</span>
            </div>
          </div>
          <div className="chart-content">
            <div className="dual-chart">
              {monthlyLoanDisbursement.map((item, index) => {
                const repaid = monthlyLoanRepayment[index]?.amount || 0;
                const disbursed = item.amount || 0;
                const max = Math.max(disbursed, repaid, ...monthlyLoanDisbursement.map(d => d.amount || 0));
                
                return (
                  <div key={index} className="chart-column">
                    <div className="column-label">{item.month}</div>
                    <div className="column-bars">
                      <div 
                        className="bar disbursed"
                        style={{ height: `${(disbursed / max) * 100}%` }}
                        title={`Disbursed: ${formatCurrency(disbursed)}`}
                      >
                        <span className="bar-value">{formatCurrencyShort(disbursed)}</span>
                      </div>
                      <div 
                        className="bar repaid"
                        style={{ height: `${(repaid / max) * 100}%` }}
                        title={`Repaid: ${formatCurrency(repaid)}`}
                      >
                        <span className="bar-value">{formatCurrencyShort(repaid)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Branch Profit Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h4><TrendingUp size={18} /> Monthly Branch Profit</h4>
          </div>
          <div className="chart-content">
            <div className="line-chart">
              {monthlyBranchProfit.map((item, index) => (
                <div key={index} className="line-point">
                  <div className="point-label">{item.month}</div>
                  <div className="point-value">
                    {formatCurrencyShort(item.amount || 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Group Loan Performance */}
        <div className="chart-card">
          <div className="chart-header">
            <h4><PieChart size={18} /> Group Loan Performance</h4>
          </div>
          <div className="chart-content">
            <div className="performance-table">
              <table>
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Approved</th>
                    <th>Defaulting</th>
                    <th>Default Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {groupLoanPerformance.slice(0, 5).map((group, index) => (
                    <tr key={index}>
                      <td>{group.group_name}</td>
                      <td>{group.approved_loans || 0}</td>
                      <td>{group.defaulting_loans || 0}</td>
                      <td>
                        <span className={`status-badge ${(group.default_rate || 0) < 0.1 ? 'success' : (group.default_rate || 0) < 0.2 ? 'warning' : 'danger'}`}>
                          {((group.default_rate || 0) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const formatCurrencyShort = (amount) => {
  if (amount >= 1000000) {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `UGX ${(amount / 1000).toFixed(1)}K`;
  }
  return `UGX ${amount}`;
};

PerformanceCharts.propTypes = {
  chartData: PropTypes.shape({
    weeklySavingsTrend: PropTypes.array,
    monthlyLoanDisbursement: PropTypes.array,
    monthlyLoanRepayment: PropTypes.array,
    monthlyBranchProfit: PropTypes.array,
    groupLoanPerformance: PropTypes.array
  }),
  loading: PropTypes.bool
};

export default PerformanceCharts;