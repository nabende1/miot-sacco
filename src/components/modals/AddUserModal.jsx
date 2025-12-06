// src/components/modals/AddUserModal.jsx
import { useState } from 'react';
import { X, Mail, Lock, User, Building2, Shield, AlertCircle } from 'lucide-react';

export default function AddUserModal({ branches, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'FACILITATOR',
    assigned_branch: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.role === 'BRANCH_MANAGER' && !formData.assigned_branch) {
      setError('Branch Manager must be assigned to a branch');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3><User size={20} /> Add New User</h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={16} /> Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@miotsacco.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={16} /> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Lock size={16} /> Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">
              <Shield size={16} /> User Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="FACILITATOR">Facilitator</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="GENERAL_MANAGER">General Manager</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="assigned_branch">
              <Building2 size={16} /> Assigned Branch
            </label>
            <select
              id="assigned_branch"
              name="assigned_branch"
              value={formData.assigned_branch}
              onChange={handleChange}
            >
              <option value="">Select a branch (optional)</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code || 'No Code'})
                </option>
              ))}
            </select>
            <small className="form-hint">
              Required for Branch Managers, optional for others
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
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
                <>
                  <span className="loading-spinner" style={{marginRight: '8px'}}>⟳</span>
                  Creating...
                </>
              ) : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}