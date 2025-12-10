import React from 'react';
import PropTypes from 'prop-types';
import { 
  Download, Eye, Printer, Trash2, FileText, 
  FileSpreadsheet, Calendar, Clock 
} from 'lucide-react';
import { formatDateTime, formatFileSize } from '../../../utils/formatters';

const ReportsList = ({ 
  reports, 
  loading = false,
  onDownload,
  onView,
  onPrint,
  onDelete,
  emptyMessage = "No reports generated yet"
}) => {
  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf':
        return <FileText size={16} />;
      case 'excel':
        return <FileSpreadsheet size={16} />;
      case 'csv':
        return <FileText size={16} />;
      case 'docx':
        return <FileText size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getReportTypeLabel = (type) => {
    const labels = {
      daily: 'Daily Financial Summary',
      weekly: 'Weekly Branch Summary',
      monthly: 'Monthly P&L',
      loan_portfolio: 'Loan Portfolio',
      loan_recovery: 'Loan Recovery',
      default_risk: 'Default Risk',
      penalties: 'Penalties',
      group_performance: 'Group Performance',
      member_loan: 'Member Loan',
      savings_performance: 'Savings Performance',
      member_growth: 'Member Growth',
      attendance_analysis: 'Attendance Analysis',
      facilitator_performance: 'Facilitator Performance',
      submission_timeliness: 'Submission Timeliness',
      data_accuracy: 'Data Accuracy'
    };
    
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="loading-placeholder">
        <div className="loading-skeleton" style={{ height: '300px' }}></div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="no-data">
        <FileText size={48} />
        <h4>{emptyMessage}</h4>
        <p>Generate your first report to see it here</p>
      </div>
    );
  }

  return (
    <div className="reports-list">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Type</th>
              <th>Period</th>
              <th>Generated</th>
              <th>Format</th>
              <th>Size</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <strong>RPT-{report.id}</strong>
                </td>
                <td>
                  <div className="report-type">
                    {getReportTypeLabel(report.type)}
                  </div>
                </td>
                <td>
                  {report.start_date && report.end_date ? (
                    <div className="report-period">
                      <Calendar size={14} />
                      <span>
                        {formatDateTime(report.start_date).split(',')[0]} - 
                        {formatDateTime(report.end_date).split(',')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="no-period">N/A</span>
                  )}
                </td>
                <td>
                  <div className="report-date">
                    <Clock size={14} />
                    <span>{formatDateTime(report.generated_at)}</span>
                  </div>
                </td>
                <td>
                  <span className={`format-badge ${report.format}`}>
                    {getFormatIcon(report.format)}
                    {report.format.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className="file-size">
                    {formatFileSize(report.file_size || 0)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${report.status === 'completed' ? 'success' : 'warning'}`}>
                    {report.status === 'completed' ? 'Ready' : 'Processing'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {report.file_url && (
                      <>
                        <button
                          className="btn-icon"
                          onClick={() => onDownload(report.id)}
                          title="Download Report"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onView(report.id)}
                          title="View Report"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onPrint(report.id)}
                          title="Print Report"
                        >
                          <Printer size={14} />
                        </button>
                      </>
                    )}
                    <button
                      className="btn-icon danger"
                      onClick={() => {
                        if (window.confirm('Delete this report?')) {
                          onDelete(report.id);
                        }
                      }}
                      title="Delete Report"
                    >
                      <Trash2 size={14} />
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

ReportsList.propTypes = {
  reports: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string.isRequired,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    generated_at: PropTypes.string.isRequired,
    format: PropTypes.string.isRequired,
    file_size: PropTypes.number,
    file_url: PropTypes.string,
    status: PropTypes.string
  })).isRequired,
  loading: PropTypes.bool,
  onDownload: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onPrint: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  emptyMessage: PropTypes.string
};

export default ReportsList;