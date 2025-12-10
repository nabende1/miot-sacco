import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Upload, Receipt, DollarSign, Tag, 
  Calendar, FileText, Plus, X 
} from 'lucide-react';

const ExpenseForm = ({ 
  onSubmit, 
  onCancel,
  loading = false,
  initialData = null
}) => {
  const [formData, setFormData] = useState({
    amount: initialData?.amount || '',
    category: initialData?.category || 'office_supplies',
    description: initialData?.description || '',
    notes: initialData?.notes || '',
    receipt_number: initialData?.receipt_number || '',
    expense_date: initialData?.expense_date || new Date().toISOString().split('T')[0],
    receipt_file: null
  });

  const [errors, setErrors] = useState({});

  const expenseCategories = [
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'transport', label: 'Transport & Fuel' },
    { value: 'communication', label: 'Communication' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'stationery', label: 'Stationery' },
    { value: 'printing', label: 'Printing & Copying' },
    { value: 'training', label: 'Training & Development' },
    { value: 'meals', label: 'Meals & Entertainment' },
    { value: 'other', label: 'Other Expenses' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size should be less than 5MB');
      return;
    }
    setFormData({ ...formData, receipt_file: file });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.expense_date) {
      newErrors.expense_date = 'Date is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      status: 'recorded',
      recorded_at: new Date().toISOString()
    };

    onSubmit(expenseData);
  };

  return (
    <div className="expense-form">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>
            <Receipt size={20} />
            {initialData ? 'Edit Expense' : 'Add New Expense'}
          </h3>
        </div>

        <div className="form-grid">
          {/* Amount and Category */}
          <div className="form-group">
            <label>
              <DollarSign size={16} />
              Amount *
            </label>
            <div className="amount-input">
              <span className="currency">UGX</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                disabled={loading}
                step="0.01"
                min="0"
              />
            </div>
            {errors.amount && <div className="error-message">{errors.amount}</div>}
          </div>

          <div className="form-group">
            <label>
              <Tag size={16} />
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`form-select ${errors.category ? 'is-invalid' : ''}`}
              disabled={loading}
            >
              {expenseCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && <div className="error-message">{errors.category}</div>}
          </div>

          {/* Date */}
          <div className="form-group">
            <label>
              <Calendar size={16} />
              Expense Date *
            </label>
            <input
              type="date"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
              className={`form-control ${errors.expense_date ? 'is-invalid' : ''}`}
              disabled={loading}
            />
            {errors.expense_date && <div className="error-message">{errors.expense_date}</div>}
          </div>

          {/* Receipt Number */}
          <div className="form-group">
            <label>
              <Receipt size={16} />
              Receipt Number
            </label>
            <input
              type="text"
              value={formData.receipt_number}
              onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
              placeholder="Optional receipt number"
              className="form-control"
              disabled={loading}
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>
            <FileText size={16} />
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the expense purpose..."
            rows={3}
            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
            disabled={loading}
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        {/* Notes */}
        <div className="form-group">
          <label>Additional Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes or comments..."
            rows={2}
            className="form-control"
            disabled={loading}
          />
        </div>

        {/* Receipt Upload */}
        <div className="form-group">
          <label>
            <Upload size={16} />
            Upload Receipt (Optional)
          </label>
          <div className="file-upload">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="file-input"
              disabled={loading}
            />
            <div className="file-preview">
              {formData.receipt_file ? (
                <div className="file-info">
                  <FileText size={16} />
                  <span>{formData.receipt_file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, receipt_file: null })}
                    className="btn-icon small"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <Upload size={24} />
                  <p>Click to upload receipt</p>
                  <small>PDF, JPG, PNG, DOC (Max 5MB)</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <Plus size={16} />
                {initialData ? 'Update Expense' : 'Add Expense'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

ExpenseForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  initialData: PropTypes.object
};

export default ExpenseForm;