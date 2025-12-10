// src/components/BranchManagement.jsx - REFACTORED WITH RPC FIX
import { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  RefreshCw,
  Calendar,
  Globe,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Group,
  Eye,
  Shield,
  Grid,
  List,
  CheckCircle
} from 'lucide-react';
import supabase from '../supabaseClient';

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(true); // Assume admin for now
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignManagerModal, setShowAssignManagerModal] = useState(false);
  
  // Selected items
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchManagers, setBranchManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // View mode
  const [viewMode, setViewMode] = useState('cards');
  const [filterManagerStatus, setFilterManagerStatus] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  // SIMPLIFIED: Just fetch what we need
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching branches...');
      
      // 1. Fetch branches with safe select
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name, region, created_at, updated_at, branch_manager_id') // Added branch_manager_id for UI
        .order('created_at', { ascending: false });

      if (branchesError) {
        console.error('Branches fetch error:', branchesError);
        // Fallback or error handling remains the same
        const { data: simpleData } = await supabase
          .from('branches')
          .select('id, name')
          .order('name', { ascending: true });
        
        if (simpleData) {
          setBranches(simpleData);
        } else {
          setBranches([]);
        }
      } else {
        setBranches(branchesData || []);
      }
      
      // 2. Fetch users (for managers)
      try {
        const { data: usersData } = await supabase
          .from('users_meta')
          .select('id, full_name, email, phone, role')
          .order('full_name');

        setAllUsers(usersData || []);
        
        // Filter for managers
        const managers = usersData?.filter(user => 
          user.role === 'BRANCH_MANAGER' || 
          user.role === 'MANAGER'
        ) || [];
        setBranchManagers(managers);
      } catch (userErr) {
        console.warn('Could not fetch users:', userErr);
        setAllUsers([]);
        setBranchManagers([]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // SIMPLIFIED: Add branch (Still uses standard INSERT as RLS policy is usually simple for trusted roles)
  const handleAddBranch = async (branchData) => {
    if (!isSuperAdmin) {
      setError('Only Super Admins can add branches');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      console.log('Adding branch:', branchData);
      
      const insertData = {
        name: branchData.name.trim(),
        region: branchData.region?.trim() || null,
      };
      
      if (branchData.branch_manager_id) {
        insertData.branch_manager_id = branchData.branch_manager_id;
      }
      
      const { data, error } = await supabase
        .from('branches')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Add branch error:', error);
        if (error.message.includes('branch_manager_id')) {
          delete insertData.branch_manager_id;
          const { data: retryData, error: retryError } = await supabase
            .from('branches')
            .insert([insertData])
            .select();
            
          if (retryError) throw retryError;
          
          setSuccess('Branch added successfully!');
          fetchAllData();
          setShowAddModal(false);
          return;
        }
        throw error;
      }
      
      setSuccess('Branch added successfully!');
      fetchAllData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding branch:', error);
      setError(`Failed to add branch: ${error.message}`);
    }
  };

  // 🛑 FIX: Use RPC for secure, role-based UPDATE
  const handleUpdateBranch = async (branchId, updates) => {
    // The client-side check is left for UX, but RPC handles security
    if (!isSuperAdmin) {
      setError('Only Super Admins can update branches');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      console.log('Updating branch via RPC:', branchId, updates);
      
      // Calling the PostgreSQL function (RPC)
      const { error } = await supabase.rpc('update_branch_with_role_check', {
        // Argument names MUST match the PostgreSQL function signature
        branch_id: branchId,
        new_branch_name: updates.name.trim(),
        new_region: updates.region?.trim() || null, 
        new_manager_id: updates.branch_manager_id || null // Handles null/empty string for unassigning
      });

      if (error) {
        console.error('RPC Update branch error:', error);
        throw error;
      }
      
      setSuccess('Branch updated successfully!');
      fetchAllData();
      setShowEditModal(false);
      setSelectedBranch(null);
    } catch (error) {
      console.error('Error updating branch:', error);
      setError(`Failed to update branch: ${error.message}`);
    }
  };

  // 🛑 FIX: Use RPC for secure, role-based DELETE
  const handleDeleteBranch = async () => {
    if (!selectedBranch) return;
    
    // The client-side check is left for UX, but RPC handles security
    if (!isSuperAdmin) {
      setError('Only Super Admins can delete branches');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      console.log('Deleting branch via RPC:', selectedBranch.id);
      
      // Calling the PostgreSQL function (RPC)
      const { error } = await supabase.rpc('delete_branch_with_role_check', {
        // Argument name MUST match the PostgreSQL function signature
        branch_id_to_delete: selectedBranch.id, 
      });

      if (error) {
        console.error('RPC Delete error:', error);
        
        // This logic is complex and often unnecessary when using a trusted RPC.
        // If the RPC fails, it should throw a clear error.
        // We will keep the soft-delete fallback if the error message indicates a RLS failure or constraint issue
        // that the RPC couldn't handle, although the RPC should handle the logic.
        if (error.message.includes('Permission denied') || error.code === 'P0001') {
           setError(`Permission Denied: Failed to delete branch. Check user role and database function logic.`);
           throw error; 
        }

        // Keep the soft-delete fallback logic for robustness if the error suggests it
        console.warn('Attempting soft delete fallback...');
        const { error: softDeleteError } = await supabase
          .from('branches')
          .update({ is_active: false, deleted_at: new Date().toISOString() })
          .eq('id', selectedBranch.id);
          
        if (softDeleteError) throw softDeleteError;
        
        setSuccess('Branch soft-deleted successfully!');
      } else {
        setSuccess('Branch hard-deleted successfully!');
      }
      
      fetchAllData();
      setShowDeleteModal(false);
      setSelectedBranch(null);
    } catch (error) {
      console.error('Error deleting branch:', error);
      setError(`Failed to delete branch: ${error.message}`);
    }
  };

  // Filter branches
  const filteredBranches = branches.filter(branch => {
    if (!branch) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (branch.name?.toLowerCase().includes(searchLower) || false) ||
      (branch.region?.toLowerCase().includes(searchLower) || false)
    );
    
    return matchesSearch;
  });

  // Get branch manager info
  const getBranchManager = (branch) => {
    if (!branch.branch_manager_id) return null;
    return allUsers.find(user => user.id === branch.branch_manager_id);
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="branch-management">
      <div className="welcome-header">
        <div>
          <h1><Building2 size={28} /> Branch Management</h1>
          <p className="welcome-subtitle">Manage all SACCO branches</p>
        </div>
        <div className="header-actions">
          {isSuperAdmin && (
            <div className="admin-badge">
              <Shield size={16} /> Super Admin
            </div>
          )}
          
          <div className="view-toggle">
            <button 
              className={`btn-icon ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              <Grid size={18} />
            </button>
            <button 
              className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={18} />
            </button>
          </div>
          
          <button 
            className="btn btn-secondary" 
            onClick={fetchAllData}
            disabled={loading}
          >
            <RefreshCw size={18} /> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddModal(true)}
            disabled={!isSuperAdmin}
            title={!isSuperAdmin ? "Only Super Admins can add branches" : "Add new branch"}
          >
            <Plus size={18} /> Add New Branch
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} /> {error}
          <button className="close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <CheckCircle size={20} /> {success}
          <button className="close-btn" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#667eea', color: 'white'}}>
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <h3>{branches.length}</h3>
            <p>Total Branches</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#e8f5e9', color: '#4caf50'}}>
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <h3>{branchManagers.length}</h3>
            <p>Available Managers</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="content-card filters-panel">
        <div className="card-header">
          <h3><Search size={20} /> Search Branches</h3>
          <span className="badge">{filteredBranches.length} branches found</span>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="loading">
          <RefreshCw className="loading-spinner" size={24} />
          <p>Loading branches...</p>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="content-card">
          <div className="no-data">
            <Building2 size={48} style={{color: '#ccc', marginBottom: '10px'}} />
            <p>No branches found</p>
            {branches.length === 0 ? (
              <p className="text-muted">Add your first branch to get started</p>
            ) : (
              <p className="text-muted">No branches match your search criteria</p>
            )}
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="branches-grid">
          {filteredBranches.map((branch) => {
            const manager = getBranchManager(branch);
            
            return (
              <div key={branch.id} className="branch-card">
                <div className="branch-header">
                  <div className="branch-icon">
                    <Building2 size={24} />
                  </div>
                  <div className="branch-info">
                    <h3>{branch.name}</h3>
                    <div className="branch-meta">
                      {branch.region && (
                        <span className="region-badge">
                          <Globe size={14} /> {branch.region}
                        </span>
                      )}
                      <span className="created-date">
                        <Calendar size={14} /> {new Date(branch.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="branch-actions">
                    {isSuperAdmin && (
                      <>
                        <button
                          className="btn-icon edit"
                          onClick={() => {
                            setSelectedBranch(branch);
                            setShowEditModal(true);
                          }}
                          title="Edit Branch"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => {
                            setSelectedBranch(branch);
                            setShowDeleteModal(true);
                          }}
                          title="Delete Branch"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Manager Section */}
                <div className="branch-manager-section">
                  <h4>Branch Manager</h4>
                  {manager ? (
                    <div className="manager-info">
                      <div className="manager-avatar">
                        {manager.full_name?.charAt(0) || manager.email?.charAt(0) || 'M'}
                      </div>
                      <div className="manager-details">
                        <strong>{manager.full_name || 'No Name'}</strong>
                        <small>{manager.email}</small>
                        <small>{manager.phone || 'No phone'}</small>
                      </div>
                      {isSuperAdmin && (
                        <button
                          className="btn-icon danger"
                          onClick={() => {
                            // Handle remove manager
                            setSelectedBranch(branch);
                            // We'll implement this later
                          }}
                          title="Remove Manager"
                        >
                          <UserX size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="no-manager">
                      <span>No manager assigned</span>
                      {isSuperAdmin && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedBranch(branch);
                            setShowAssignManagerModal(true);
                          }}
                        >
                          <UserPlus size={14} /> Assign Manager
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="branch-footer">
                  <div className="branch-quick-stats">
                    <div className="quick-stat">
                      <Users size={14} />
                      <span>Members: <strong>0</strong></span>
                    </div>
                    <div className="quick-stat">
                      <Group size={14} />
                      <span>Groups: <strong>0</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Table View
        <div className="content-card">
          <div className="card-header">
            <h3>Branches Table</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Region</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch) => {
                  const manager = getBranchManager(branch);
                  
                  return (
                    <tr key={branch.id}>
                      <td>
                        <div className="table-cell-main">
                          <Building2 size={16} />
                          <strong>{branch.name}</strong>
                        </div>
                      </td>
                      <td>{branch.region || '-'}</td>
                      <td>{new Date(branch.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="table-actions">
                          {isSuperAdmin && (
                            <>
                              <button
                                className="btn-icon"
                                onClick={() => {
                                  setSelectedBranch(branch);
                                  setShowEditModal(true);
                                }}
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="btn-icon danger"
                                onClick={() => {
                                  setSelectedBranch(branch);
                                  setShowDeleteModal(true);
                                }}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SIMPLE MODALS */}

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Branch</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <AddBranchForm 
                onSubmit={handleAddBranch}
                onCancel={() => setShowAddModal(false)}
                branchManagers={branchManagers}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {showEditModal && selectedBranch && (
        <div className="modal-overlay" onClick={() => {
          setShowEditModal(false);
          setSelectedBranch(null);
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Branch</h3>
              <button className="close-btn" onClick={() => {
                setShowEditModal(false);
                setSelectedBranch(null);
              }}>×</button>
            </div>
            <div className="modal-content">
              <EditBranchForm 
                branch={selectedBranch}
                onSubmit={handleUpdateBranch}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedBranch(null);
                }}
                branchManagers={branchManagers}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Branch Modal */}
      {showDeleteModal && selectedBranch && (
        <div className="modal-overlay" onClick={() => {
          setShowDeleteModal(false);
          setSelectedBranch(null);
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Branch</h3>
              <button className="close-btn" onClick={() => {
                setShowDeleteModal(false);
                setSelectedBranch(null);
              }}>×</button>
            </div>
            <div className="modal-content">
              <DeleteBranchConfirm 
                branch={selectedBranch}
                onConfirm={handleDeleteBranch}
                onCancel={() => {
                  setShowDeleteModal(false);
                  setSelectedBranch(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SIMPLE FORM COMPONENTS

function AddBranchForm({ onSubmit, onCancel, branchManagers }) {
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    branch_manager_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Branch name is required');
      return;
    }
    
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Branch Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Enter branch name"
          required
          disabled={submitting}
          autoFocus
        />
      </div>
      
      <div className="form-group">
        <label>Region</label>
        <input
          type="text"
          value={formData.region}
          onChange={(e) => setFormData({...formData, region: e.target.value})}
          placeholder="Enter region"
          disabled={submitting}
        />
      </div>
      
      <div className="form-group">
        <label>Assign Manager (Optional)</label>
        <select
          value={formData.branch_manager_id}
          onChange={(e) => setFormData({...formData, branch_manager_id: e.target.value})}
          disabled={submitting}
        >
          <option value="">Select manager...</option>
          {branchManagers.map(manager => (
            <option key={manager.id} value={manager.id}>
              {manager.full_name} ({manager.email})
            </option>
          ))}
        </select>
      </div>
      
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Branch'}
        </button>
      </div>
    </form>
  );
}

function EditBranchForm({ branch, onSubmit, onCancel, branchManagers }) {
  const [formData, setFormData] = useState({
    name: branch.name || '',
    region: branch.region || '',
    branch_manager_id: branch.branch_manager_id || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Branch name is required');
      return;
    }
    
    setSubmitting(true);
    // Pass the branch ID and the updated data to the handler
    await onSubmit(branch.id, formData); 
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Branch Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
          disabled={submitting}
          autoFocus
        />
      </div>
      
      <div className="form-group">
        <label>Region</label>
        <input
          type="text"
          value={formData.region}
          onChange={(e) => setFormData({...formData, region: e.target.value})}
          placeholder="Enter region"
          disabled={submitting}
        />
      </div>
      
      <div className="form-group">
        <label>Branch Manager</label>
        <select
          value={formData.branch_manager_id}
          onChange={(e) => setFormData({...formData, branch_manager_id: e.target.value})}
          disabled={submitting}
        >
          <option value="">No manager</option>
          {branchManagers.map(manager => (
            <option key={manager.id} value={manager.id}>
              {manager.full_name} ({manager.email})
            </option>
          ))}
        </select>
      </div>
      
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update Branch'}
        </button>
      </div>
    </form>
  );
}

function DeleteBranchConfirm({ branch, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <div>
      <div className="warning-message">
        <AlertCircle size={24} />
        <div>
          <strong>Are you sure?</strong>
          <p>You are about to delete branch: <strong>{branch.name}</strong></p>
          <p>This action cannot be undone.</p>
        </div>
      </div>
      
      <div className="branch-details">
        <div><strong>Name:</strong> {branch.name}</div>
        {branch.region && <div><strong>Region:</strong> {branch.region}</div>}
        <div><strong>Created:</strong> {new Date(branch.created_at).toLocaleDateString()}</div>
      </div>
      
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={deleting}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={handleConfirm} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete Branch'}
        </button>
      </div>
    </div>
  );
}
// Add this CSS for success messages
const styles = `
.success-message {
  background: #d4edda;
  color: #155724;
  padding: 12px 16px;
  border-radius: 6px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #c3e6cb;
}

.success-message .close-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #155724;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}