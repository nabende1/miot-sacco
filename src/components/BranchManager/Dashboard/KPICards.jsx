import React from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, CheckCircle, AlertTriangle, Award, Users, DollarSign, UserCheck, TrendingDown } from 'lucide-react';
import StatCard from '../Common/StatCard';

const KPICards = ({ kpis, loading = false }) => {
  const {
    savingsGrowthRate = 0,
    loanRepaymentRate = 0,
    defaultRatio = 0,
    groupPerformanceAvg = 0,
    facilitatorPerformanceScore = 0,
    branchNetProfit = 0,
    cashFlowStatus = 'positive',
    groupAttendanceConsistency = 0
  } = kpis || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${value?.toFixed(1) || 0}%`;
  };

  return (
    <div className="kpi-cards-section">
      <h3 className="section-title">Performance KPIs</h3>
      <div className="stats-grid">
        <StatCard
          title="Savings Growth"
          value={loading ? '...' : formatPercentage(savingsGrowthRate)}
          icon={TrendingUp}
          status={savingsGrowthRate > 0 ? 'success' : 'danger'}
          subtitle="Monthly growth"
          loading={loading}
        />
        
        <StatCard
          title="Repayment Rate"
          value={loading ? '...' : formatPercentage(loanRepaymentRate)}
          icon={CheckCircle}
          status={loanRepaymentRate > 95 ? 'success' : loanRepaymentRate > 90 ? 'warning' : 'danger'}
          subtitle="Success rate"
          loading={loading}
        />
        
        <StatCard
          title="Default Ratio"
          value={loading ? '...' : formatPercentage(defaultRatio)}
          icon={AlertTriangle}
          status={defaultRatio < 2 ? 'success' : defaultRatio < 5 ? 'warning' : 'danger'}
          subtitle="Of total loans"
          loading={loading}
        />
        
        <StatCard
          title="Group Performance"
          value={loading ? '...' : `${groupPerformanceAvg?.toFixed(1) || 0}/10`}
          icon={Award}
          status={groupPerformanceAvg > 8 ? 'success' : groupPerformanceAvg > 6 ? 'warning' : 'danger'}
          subtitle="Average score"
          loading={loading}
        />
        
        <StatCard
          title="Facilitator Score"
          value={loading ? '...' : formatPercentage(facilitatorPerformanceScore)}
          icon={Users}
          status={facilitatorPerformanceScore > 85 ? 'success' : facilitatorPerformanceScore > 70 ? 'warning' : 'danger'}
          subtitle="Performance score"
          loading={loading}
        />
        
        <StatCard
          title="Net Profit"
          value={loading ? '...' : formatCurrency(branchNetProfit)}
          icon={DollarSign}
          status={branchNetProfit > 0 ? 'success' : 'danger'}
          subtitle="Monthly"
          loading={loading}
        />
        
        <StatCard
          title="Cash Flow"
          value={loading ? '...' : cashFlowStatus === 'positive' ? 'Positive' : 'Negative'}
          icon={cashFlowStatus === 'positive' ? TrendingUp : TrendingDown}
          status={cashFlowStatus === 'positive' ? 'success' : 'danger'}
          subtitle="Status"
          loading={loading}
        />
        
        <StatCard
          title="Attendance"
          value={loading ? '...' : formatPercentage(groupAttendanceConsistency)}
          icon={UserCheck}
          status={groupAttendanceConsistency > 90 ? 'success' : groupAttendanceConsistency > 80 ? 'warning' : 'danger'}
          subtitle="Consistency"
          loading={loading}
        />
      </div>
    </div>
  );
};

KPICards.propTypes = {
  kpis: PropTypes.shape({
    savingsGrowthRate: PropTypes.number,
    loanRepaymentRate: PropTypes.number,
    defaultRatio: PropTypes.number,
    groupPerformanceAvg: PropTypes.number,
    facilitatorPerformanceScore: PropTypes.number,
    branchNetProfit: PropTypes.number,
    cashFlowStatus: PropTypes.string,
    groupAttendanceConsistency: PropTypes.number
  }),
  loading: PropTypes.bool
};

export default KPICards;