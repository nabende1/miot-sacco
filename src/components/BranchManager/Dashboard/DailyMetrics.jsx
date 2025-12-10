import React from 'react';
import PropTypes from 'prop-types';
import { 
  DollarSign, Banknote, Users, AlertCircle, 
  CreditCard, Building2, CalendarDays 
} from 'lucide-react';
import StatCard from '../Common/StatCard';

const DailyMetrics = ({ 
  metrics, 
  loading = false, 
  onPeriodChange,
  selectedPeriod = 'today' 
}) => {
  const {
    todayCollections = 0,
    todaySavings = 0,
    todaySocialFund = 0,
    todayFines = 0,
    todayLoanRepayments = 0,
    groupsActiveToday = 0,
    facilitatorsActiveToday = 0
  } = metrics || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="daily-metrics-section">
      <div className="section-header">
        <h2><CalendarDays size={24} /> Today's Metrics</h2>
        <div className="period-selector">
          <select 
            value={selectedPeriod}
            onChange={(e) => onPeriodChange?.(e.target.value)}
            className="form-select"
            disabled={loading}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Collections"
          value={loading ? '...' : formatCurrency(todayCollections)}
          icon={DollarSign}
          status="primary"
          subtitle={`${groupsActiveToday} groups active`}
          loading={loading}
        />
        
        <StatCard
          title="Total Savings"
          value={loading ? '...' : formatCurrency(todaySavings)}
          icon={Banknote}
          status="success"
          subtitle="Shares only"
          loading={loading}
        />
        
        <StatCard
          title="Social Fund"
          value={loading ? '...' : formatCurrency(todaySocialFund)}
          icon={Users}
          status="info"
          subtitle="1000/member"
          loading={loading}
        />
        
        <StatCard
          title="Fines Collected"
          value={loading ? '...' : formatCurrency(todayFines)}
          icon={AlertCircle}
          status="warning"
          subtitle="1600 for not saving + 1% penalty"
          loading={loading}
        />
        
        <StatCard
          title="Loan Repayments"
          value={loading ? '...' : formatCurrency(todayLoanRepayments)}
          icon={CreditCard}
          status="primary"
          subtitle="Principal + Interest"
          loading={loading}
        />
        
        <StatCard
          title="Active Groups"
          value={loading ? '...' : groupsActiveToday}
          icon={Building2}
          status="success"
          subtitle="Submitted collections"
          loading={loading}
        />
        
        <StatCard
          title="Active Facilitators"
          value={loading ? '...' : facilitatorsActiveToday}
          icon={Users}
          status="info"
          subtitle="Submitted today"
          loading={loading}
        />
      </div>
    </div>
  );
};

DailyMetrics.propTypes = {
  metrics: PropTypes.shape({
    todayCollections: PropTypes.number,
    todaySavings: PropTypes.number,
    todaySocialFund: PropTypes.number,
    todayFines: PropTypes.number,
    todayLoanRepayments: PropTypes.number,
    groupsActiveToday: PropTypes.number,
    facilitatorsActiveToday: PropTypes.number
  }),
  loading: PropTypes.bool,
  onPeriodChange: PropTypes.func,
  selectedPeriod: PropTypes.string
};

export default DailyMetrics;