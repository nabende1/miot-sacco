import React from 'react';
import PropTypes from 'prop-types';
import { 
  FileText, FileSpreadsheet, Download, Calendar, 
  BarChart3, PieChart, Users, CreditCard, 
  AlertTriangle, CheckCircle, TrendingUp, Building2 
} from 'lucide-react';

const ReportTypes = ({ 
  reportTypes = [],
  onGenerate,
  loading = false 
}) => {
  const getReportIcon = (type) => {
    const iconMap = {
      daily: Calendar,
      weekly: Calendar,
      monthly: BarChart3,
      loan_portfolio: CreditCard,
      loan_recovery: CheckCircle,
      default_risk: AlertTriangle,
      penalties: AlertTriangle,
      group_performance: Building2,
      member_loan: Users,
      savings_performance: TrendingUp,
      member_growth: Users,
      attendance_analysis: Users,
      facilitator_performance: TrendingUp,
      submission_timeliness: CheckCircle,
      data_accuracy: CheckCircle
    };
    
    return iconMap[type] || FileText;
  };

  const getReportDescription = (type) => {
    const descriptions = {
      daily: 'Daily financial transactions and collections',
      weekly: 'Weekly branch performance and summaries',
      monthly: 'Monthly profit & loss statements',
      loan_portfolio: 'Current loan portfolio status and analysis',
      loan_recovery: 'Loan recovery progress and status',
      default_risk: 'Risk assessment of potential defaults',
      penalties: 'Fines and penalties collected',
      group_performance: 'Group-wise performance metrics',
      member_loan: 'Member loan status and history',
      savings_performance: 'Savings growth and performance',
      member_growth: 'New member registrations and growth',
      attendance_analysis: 'Group attendance patterns and trends',
      facilitator_performance: 'Facilitator performance metrics',
      submission_timeliness: 'Data submission timeliness analysis',
      data_accuracy: 'Data accuracy and error reports'
    };
    
    return descriptions[type] || 'Detailed report';
  };

  const handleGenerate = (reportType, format = 'pdf') => {
    onGenerate({ type: reportType, format });
  };

  // Group reports by category
  const groupedReports = {
    'Financial Reports': reportTypes.filter(r => 
      ['daily', 'weekly', 'monthly', 'loan_portfolio', 'loan_recovery', 'default_risk', 'penalties'].includes(r.id)
    ),
    'Groups & Members': reportTypes.filter(r => 
      ['group_performance', 'member_loan', 'savings_performance', 'member_growth', 'attendance_analysis'].includes(r.id)
    ),
    'Performance Reports': reportTypes.filter(r => 
      ['facilitator_performance', 'submission_timeliness', 'data_accuracy'].includes(r.id)
    )
  };

  return (
    <div className="report-types">
      {Object.entries(groupedReports).map(([category, reports]) => (
        reports.length > 0 && (
          <div key={category} className="report-category">
            <div className="category-header">
              <h4>{category}</h4>
            </div>
            
            <div className="report-grid">
              {reports.map((report) => {
                const Icon = getReportIcon(report.id);
                
                return (
                  <div key={report.id} className="report-type-card">
                    <div className="report-header">
                      <div className="report-icon">
                        <Icon size={20} />
                      </div>
                      <div className="report-info">
                        <h5>{report.label}</h5>
                        <p>{getReportDescription(report.id)}</p>
                      </div>
                    </div>
                    
                    <div className="report-actions">
                      <div className="format-buttons">
                        <button
                          className="btn-format pdf"
                          onClick={() => handleGenerate(report.id, 'pdf')}
                          disabled={loading}
                          title="Generate PDF"
                        >
                          <FileText size={14} /> PDF
                        </button>
                        <button
                          className="btn-format excel"
                          onClick={() => handleGenerate(report.id, 'excel')}
                          disabled={loading}
                          title="Generate Excel"
                        >
                          <FileSpreadsheet size={14} /> Excel
                        </button>
                        <button
                          className="btn-format csv"
                          onClick={() => handleGenerate(report.id, 'csv')}
                          disabled={loading}
                          title="Generate CSV"
                        >
                          <Download size={14} /> CSV
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ))}
    </div>
  );
};

ReportTypes.propTypes = {
  reportTypes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })),
  onGenerate: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default ReportTypes;