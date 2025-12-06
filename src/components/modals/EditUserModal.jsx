// src/components/modals/EditUserModal.jsx
import { useState } from 'react';
import { X, User, Building2, Shield, AlertCircle, Calendar, Mail } from 'lucide-react';

export default function EditUserModal({ user, branches, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    role: user.role,
    assigned_branch: user.assigned_branch || ''
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

    if (formData.role === 'BRANCH_MANAGER' && !formData.assigned_branch) {
      setError('Branch Manager must be assigned to a branch');
      return;
    }

    // Prevent demoting the only SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN' && formData.role !== 'SUPER_ADMIN') {
      if (!window.confirm('Warning: Changing the role of a Super Admin may leave the system without administrative access. Continue?')) {
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit(user.id, formData);
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3><User size={20} /> Edit User</h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="user-info-summary">
            <div className="summary-item">
              <Mail size={14} />
              <div>
                <strong>Email:</strong>
                <span>{user.auth_users?.email || 'No email'}</span>
              </div>
            </div>
            <div className="summary-item">
              <User size={14} />
              <div>
                <strong>User ID:</strong>
                <span className="user-id">{user.id.substring(0, 8)}...</span>
              </div>
            </div>
            <div className="summary-item">
              <Calendar size={14} />
              <div>
                <strong>Created:</strong>
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
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
            {user.role === 'SUPER_ADMIN' && formData.role !== 'SUPER_ADMIN' && (
              <small className="form-warning">
                ⚠️ Changing Super Admin role may affect system access
              </small>
            )}
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
              <option value="">No branch assigned</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code || 'No Code'})
                </option>
              ))}
            </select>
            <small className="form-hint">
              Changing branch assignment will affect user permissions
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
                  Updating...
                </>
              ) : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}