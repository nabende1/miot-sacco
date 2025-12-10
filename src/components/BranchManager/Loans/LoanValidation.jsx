import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ClipboardCheck, CheckCircle2, AlertCircle } from 'lucide-react';

const LoanValidation = ({ loan, onValidate }) => {
  const [validation, setValidation] = useState({
    savingsConsistency: false,
    facilitatorPerformance: false,
    groupLoanHistory: false,
    memberLoanHistory: false,
    defaultFlags: false,
    cashFlow: false,
    comments: ''
  });

  const handleCheckboxChange = (field) => {
    setValidation(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = (decision) => {
    const allValid = Object.entries(validation)
      .filter(([key]) => !['comments'].includes(key))
      .every(([_, value]) => value === true);

    if (!allValid && decision === 'approve') {
      alert('Please complete all validation checks before approving.');
      return;
    }

    onValidate({
      ...validation,
      decision,
      loanId: loan.id
    });
  };

  return (
    <div className="loan-validation-card">
      <div className="card-header">
        <h3><ClipboardCheck size={20} /> Loan Validation Checklist</h3>
      </div>
      
      <div className="validation-checklist">
        <div className="checklist-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={validation.savingsConsistency}
              onChange={() => handleCheckboxChange('savingsConsistency')}
            />
            <span>Check group savings consistency</span>
          </label>
          {validation.savingsConsistency && <CheckCircle2 size={16} className="check-icon success" />}
        </div>
        
        <div className="checklist-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={validation.facilitatorPerformance}
              onChange={() => handleCheckboxChange('facilitatorPerformance')}
            />
            <span>Check facilitator performance</span>
          </label>
          {validation.facilitatorPerformance && <CheckCircle2 size={16} className="check-icon success" />}
        </div>
        
        <div className="checklist-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={validation.groupLoanHistory}
              onChange={() => handleCheckboxChange('groupLoanHistory')}
            />
            <span>Check group loan history</span>
          </label>
          {validation.groupLoanHistory && <CheckCircle2 size={16} className="check-icon success" />}
        </div>
        
        <div className="checklist-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={validation.memberLoanHistory}
              onChange={() => handleCheckboxChange('memberLoanHistory')}
            />
            <span>Check members' loan history</span>
          </label>
          {validation.memberLoanHistory && <CheckCircle2 size={16} className="check-icon success" />}
        </div>
        
        <div className="checklist-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={validation.defaultFlags}
              onChange={() => handleCheckboxChange('defaultFlags')}
            />
            <span>Check default flags (missed weeks, penalties)</span>
          </label>
          {validation.defaultFlags && <CheckCircle2 size={16} className="check-icon success" />}
        </div>
        
        <div className="checklist-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={validation.cashFlow}
              onChange={() => handleCheckboxChange('cashFlow')}
            />
            <span>Check branch cash flow</span>
          </label>
          {validation.cashFlow && <CheckCircle2 size={16} className="check-icon success" />}
        </div>
      </div>
      
      <div className="validation-comments">
        <label>Additional Comments</label>
        <textarea
          value={validation.comments}
          onChange={(e) => setValidation(prev => ({ ...prev, comments: e.target.value }))}
          placeholder="Enter any additional comments or conditions..."
          rows={3}
          className="form-control"
        />
      </div>
      
      <div className="validation-actions">
        <button
          className="btn btn-success"
          onClick={() => handleSubmit('approve')}
          disabled={!Object.values(validation).filter((_, i) => i < 6).every(v => v)}
        >
          <CheckCircle2 size={16} /> Approve & Forward to GM
        </button>
        <button
          className="btn btn-warning"
          onClick={() => handleSubmit('request_correction')}
        >
          <AlertCircle size={16} /> Request Corrections
        </button>
        <button
          className="btn btn-danger"
          onClick={() => handleSubmit('reject')}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

LoanValidation.propTypes = {
  loan: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired
};

export default LoanValidation;