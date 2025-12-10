import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText, FileSpreadsheet, Download, Calendar } from 'lucide-react';

const ReportGenerator = ({ 
  onGenerate, 
  loading = false,
  reportTypes = [],
  defaultType = 'daily'
}) => {
  const [reportConfig, setReportConfig] = useState({
    type: defaultType,
    start_date: '',
    end_date: '',
    format: 'pdf',
    include_charts: true,
    include_details: true
  });

  const handleGenerate = () => {
    if (!reportConfig.start_date && reportConfig.type !== 'daily') {
      alert('Please select a start date');
      return;
    }
    
    if (!reportConfig.end_date && reportConfig.type !== 'daily') {
      alert('Please select an end date');
      return;
    }
    
    onGenerate(reportConfig);
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf':
        return <FileText size={16} />;
      case 'excel':
        return <FileSpreadsheet size={16} />;
      case 'csv':
        return <Download size={16} />;
      case 'docx':
        return <FileText size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <div className="report-generator">
      <div className="card-header">
        <h3><FileSpreadsheet size={20} /> Generate New Report</h3>
      </div>
      
      <div className="report-form">
        <div className="form-row">
          <div className="form-group">
            <label>Report Type *</label>
            <select
              value={reportConfig.type}
              onChange={(e) => setReportConfig({...reportConfig, type: e.target.value})}
              className="form-select"
              disabled={loading}
            >
              {reportTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Format *</label>
            <select
              value={reportConfig.format}
              onChange={(e) => setReportConfig({...reportConfig, format: e.target.value})}
              className="form-select"
              disabled={loading}
            >
              <option value="pdf">PDF Document</option>
              <option value="excel">Excel (XLSX)</option>
              <option value="csv">CSV</option>
              <option value="docx">Word Document</option>
            </select>
          </div>
        </div>
        
        {reportConfig.type !== 'daily' && (
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                value={reportConfig.start_date}
                onChange={(e) => setReportConfig({...reportConfig, start_date: e.target.value})}
                className="form-control"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                value={reportConfig.end_date}
                onChange={(e) => setReportConfig({...reportConfig, end_date: e.target.value})}
                className="form-control"
                disabled={loading}
              />
            </div>
          </div>
        )}
        
        <div className="form-checkboxes">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={reportConfig.include_charts}
              onChange={(e) => setReportConfig({...reportConfig, include_charts: e.target.checked})}
              disabled={loading}
            />
            <span>Include Charts & Graphs</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={reportConfig.include_details}
              onChange={(e) => setReportConfig({...reportConfig, include_details: e.target.checked})}
              disabled={loading}
            />
            <span>Include Detailed Data</span>
          </label>
        </div>
        
        <div className="form-actions">
          <button 
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>Generating...</>
            ) : (
              <>
                {getFormatIcon(reportConfig.format)}
                Generate {reportConfig.format.toUpperCase()} Report
              </>
            )}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setReportConfig({
              type: defaultType,
              start_date: '',
              end_date: '',
              format: 'pdf',
              include_charts: true,
              include_details: true
            })}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

ReportGenerator.propTypes = {
  onGenerate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  reportTypes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })),
  defaultType: PropTypes.string
};

export default ReportGenerator;