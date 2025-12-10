import React from 'react';
import PropTypes from 'prop-types';
import { DollarSign, TrendingUp } from 'lucide-react';

const FinancialSummary = ({ financials, loading = false }) => {
  const {
    totalBranchSavings = 0,
    loanPortfolioValue = 0,
    outstandingLoanBalance = 0,
    branchProfits = 0
  } = financials || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="content-card">
      <div className="card-header">
        <h3><DollarSign size={20} /> Financial Summary</h3>
      </div>
      
      {loading ? (
        <div className="loading-placeholder">
          <div className="loading-skeleton" style={{ height: '100px' }}></div>
        </div>
      ) : (
        <>
          <div className="financial-summary">
            <div className="financial-item">
              <span>Total Branch Savings</span>
              <strong className="success">{formatCurrency(totalBranchSavings)}</strong>
            </div>
            <div className="financial-item">
              <span>Loan Portfolio Value</span>
              <strong>{formatCurrency(loanPortfolioValue)}</strong>
            </div>
            <div className="financial-item">
              <span>Outstanding Balance</span>
              <strong className="warning">{formatCurrency(outstandingLoanBalance)}</strong>
            </div>
            <div className="financial-item">
              <span>Branch Profits</span>
              <strong className="success">{formatCurrency(branchProfits)}</strong>
            </div>
          </div>
          
          <div className="profit-breakdown">
            <h4>Profit Sources</h4>
            <div className="breakdown-items">
              <span className="breakdown-item">10% Group Interest</span>
              <span className="breakdown-item">Processing Fees</span>
              <span className="breakdown-item">Penalties</span>
              <span className="breakdown-item">Member Fines</span>
              <span className="breakdown-item">Registration Fees</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

FinancialSummary.propTypes = {
  financials: PropTypes.shape({
    totalBranchSavings: PropTypes.number,
    loanPortfolioValue: PropTypes.number,
    outstandingLoanBalance: PropTypes.number,
    branchProfits: PropTypes.number
  }),
  loading: PropTypes.bool
};

export default FinancialSummary;