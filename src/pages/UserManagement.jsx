// src/pages/UserManagement.jsx - FIXED STATS VERSION
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, RefreshCw, AlertCircle, Edit, Trash2, Plus, Search, Filter,
  Shield, Mail, Phone, User, Building2, Lock, Eye, EyeOff, Download,
  Upload, CheckCircle, XCircle, MoreVertical, Calendar, MapPin, Settings,
  BarChart3, CreditCard, DollarSign, Bell, Key, UserPlus, UserX,
  Send, Copy, QrCode, Archive, Clock, Star, ShieldAlert
} from 'lucide-react';
import supabase from '../supabaseClient';
import '../styles/SuperAdminDashboard.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [branches, setBranches] = useState([]);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Dropdown management
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRefs = useRef({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    pending: 0,
    superAdmins: 0,
    generalManagers: 0,
    branchManagers: 0,
    facilitators: 0
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.action-menu')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Load all data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [usersResult, branchesResult] = await Promise.all([
        supabase.from('users_meta')
          .select('*')
          .order('created_at', { ascending: false }),
        
        supabase.from('branches')
          .select('id, name, location')
          .order('name')
      ]);

      if (usersResult.error) throw usersResult.error;
      if (branchesResult.error) console.warn('Branches error:', branchesResult.error);

      const usersData = usersResult.data || [];
      setUsers(usersData);
      setFilteredUsers(usersData);
      setBranches(branchesResult.data || []);
      calculateStats(usersData);
      
    } catch (err) {
      console.error('Load error:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Updated calculateStats function
  const calculateStats = (userList) => {
    if (!userList || userList.length === 0) {
      setStats({
        total: 0,
        active: 0,
        suspended: 0,
        pending: 0,
        superAdmins: 0,
        generalManagers: 0,
        branchManagers: 0,
        facilitators: 0
      });
      return;
    }
    
    // Debug log to see user data
    console.log('Users for stats calculation:', userList);
    
    const stats = {
      total: userList.length,
      active: userList.filter(u => u.status && u.status.toLowerCase() === 'active').length,
      suspended: userList.filter(u => u.status && u.status.toLowerCase() === 'suspended').length,
      pending: userList.filter(u => u.status && u.status.toLowerCase() === 'pending').length,
      superAdmins: userList.filter(u => u.role && u.role.includes('SUPER_ADMIN')).length,
      generalManagers: userList.filter(u => u.role && u.role.includes('GENERAL_MANAGER')).length,
      branchManagers: userList.filter(u => u.role && u.role.includes('BRANCH_MANAGER')).length,
      facilitators: userList.filter(u => u.role && u.role.includes('FACILITATOR')).length
    };
    
    console.log('Calculated stats:', stats);
    setStats(stats);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...users];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.full_name?.toLowerCase().includes(term)) ||
        (user.email?.toLowerCase().includes(term)) ||
        (user.phone?.includes(term)) ||
        (user.role?.toLowerCase().includes(term))
      );
    }
    
    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }
    
    // Branch filter
    if (filterBranch !== 'all') {
      filtered = filtered.filter(user => user.assigned_branch === filterBranch);
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, filterRole, filterStatus, filterBranch]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // User Actions
  const handleSuspendUser = async (user, suspend = true) => {
    try {
      const { error } = await supabase
        .from('users_meta')
        .update({ 
          status: suspend ? 'suspended' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setSuccess(`User ${suspend ? 'suspended' : 'activated'} successfully!`);
      setShowSuspendModal(false);
      setOpenDropdownId(null);
      loadData();
    } catch (err) {
      setError(`Failed to ${suspend ? 'suspend' : 'activate'} user: ${err.message}`);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // First, delete from users_meta
      const { error: metaError } = await supabase
        .from('users_meta')
        .delete()
        .eq('id', selectedUser.id);
      
      if (metaError) throw metaError;
      
      // Note: We can't delete from auth.users without admin privileges
      // The auth user will remain but won't have access to the app
      
      setSuccess('User deleted from system!');
      setShowDeleteModal(false);
      setOpenDropdownId(null);
      loadData();
    } catch (err) {
      setError(`Failed to delete user: ${err.message}`);
    }
  };

  const handleResetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setSuccess('Password reset email sent!');
      setShowResetPasswordModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      setError(`Failed to send reset email: ${err.message}`);
    }
  };

  const handleExportUsers = () => {
    const csvData = filteredUsers.map(user => ({
      ID: user.id,
      Name: user.full_name || 'N/A',
      Email: user.email || 'N/A',
      Phone: user.phone || 'N/A',
      Role: user.role,
      Status: user.status,
      Branch: branches.find(b => b.id === user.assigned_branch)?.name || 'Not assigned',
      'Created At': new Date(user.created_at).toLocaleDateString(),
      'Last Login': user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'
    }));
    
    const csv = convertToCSV(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setSuccess('Users exported successfully!');
  };

  const convertToCSV = (data) => {
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#4caf50';
      case 'suspended': return '#f44336';
      case 'pending': return '#ff9800';
      case 'inactive': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'SUPER_ADMIN': return '#c62828';
      case 'GENERAL_MANAGER': return '#1565c0';
      case 'BRANCH_MANAGER': return '#2e7d32';
      case 'FACILITATOR': return '#ef6c00';
      default: return '#666';
    }
  };

  // Toggle dropdown
  const toggleDropdown = (userId) => {
    if (openDropdownId === userId) {
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(userId);
    }
  };

  return (
    <div className="user-management">
      {/* Header */}
      <div className="welcome-header">
        <div>
          <h1><Users size={28} /> User Management</h1>
          <p className="welcome-subtitle">Complete control over system users</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} /> Add New User
          </button>
          <button className="btn btn-secondary" onClick={handleExportUsers}>
            <Download size={18} /> Export
          </button>
          <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={18} /> {loading ? 'Refreshing...' : 'Refresh'}
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

      {/* Stats Dashboard - FIXED: Direct stat display */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#667eea', color: 'white'}}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#e8f5e9', color: '#4caf50'}}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <p>Active</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#ffebee', color: '#f44336'}}>
            <UserX size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.suspended}</h3>
            <p>Suspended</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#fff3e0', color: '#ff9800'}}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>

        {/* Role stats - Fixed: Direct stat access */}
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#ffebee', color: '#c62828'}}>
            <Shield size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.superAdmins}</h3>
            <p>Super Admins</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#e3f2fd', color: '#1565c0'}}>
            <User size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.generalManagers}</h3>
            <p>General Managers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#e8f5e9', color: '#2e7d32'}}>
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.branchManagers}</h3>
            <p>Branch Managers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#fff3e0', color: '#ef6c00'}}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.facilitators}</h3>
            <p>Facilitators</p>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="content-card filters-panel">
        <div className="card-header">
          <h3><Filter size={20} /> Filter & Search Users</h3>
          <span className="badge">{filteredUsers.length} users found</span>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name, email, phone, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-group">
            <label>Role</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="GENERAL_MANAGER">General Manager</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="FACILITATOR">Facilitator</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Branch</label>
            <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="content-card">
        <div className="card-header">
          <h3><Users size={20} /> User List</h3>
          <div className="table-controls">
            <div className="pagination-info">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length}
            </div>
            <div className="pagination-buttons">
              <button 
                className="btn-icon" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ←
              </button>
              <span className="page-number">Page {currentPage} of {totalPages}</span>
              <button 
                className="btn-icon" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                →
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <RefreshCw className="loading-spinner" size={24} />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="no-data">
            <Users size={48} style={{color: '#ccc', marginBottom: '10px'}} />
            <p>No users found matching your criteria</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Branch</th>
                  <th>Contact</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar" style={{backgroundColor: getRoleColor(user.role)}}>
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="user-name">{user.full_name || 'No Name'}</div>
                          <div className="user-id">ID: {user.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="role-badge" 
                        style={{
                          backgroundColor: getRoleColor(user.role) + '20',
                          color: getRoleColor(user.role)
                        }}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{
                          backgroundColor: getStatusColor(user.status) + '20',
                          color: getStatusColor(user.status)
                        }}
                      >
                        <div className="status-dot" style={{backgroundColor: getStatusColor(user.status)}} />
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="branch-info">
                        {branches.find(b => b.id === user.assigned_branch)?.name || 'Not assigned'}
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-email">
                          <Mail size={12} /> {user.email || 'No email'}
                        </div>
                        {user.phone && (
                          <div className="contact-phone">
                            <Phone size={12} /> {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="activity-info">
                        {user.last_login ? (
                          <>
                            <div>{new Date(user.last_login).toLocaleDateString()}</div>
                            <small>{new Date(user.last_login).toLocaleTimeString()}</small>
                          </>
                        ) : 'Never'}
                      </div>
                    </td>
                    <td>
                      <div className="action-menu">
                        <button 
                          className="btn-icon more"
                          onClick={() => toggleDropdown(user.id)}
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {openDropdownId === user.id && (
                          <ActionDropdown 
                            user={user}
                            rowIndex={index}
                            totalRows={currentUsers.length}
                            onEdit={() => {
                              setShowEditModal(true);
                              setSelectedUser(user);
                              setOpenDropdownId(null);
                            }}
                            onResetPassword={() => {
                              setShowResetPasswordModal(true);
                              setSelectedUser(user);
                              setOpenDropdownId(null);
                            }}
                            onSuspend={() => {
                              setShowSuspendModal(true);
                              setSelectedUser(user);
                              setOpenDropdownId(null);
                            }}
                            onActivate={() => {
                              handleSuspendUser(user, false);
                              setOpenDropdownId(null);
                            }}
                            onDelete={() => {
                              setShowDeleteModal(true);
                              setSelectedUser(user);
                              setOpenDropdownId(null);
                            }}
                            closeDropdown={() => setOpenDropdownId(null)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          branches={branches}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setSuccess('User created successfully!');
            loadData();
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          branches={branches}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setSuccess('User updated successfully!');
            loadData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <DeleteUserModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleDeleteUser}
        />
      )}

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && selectedUser && (
        <SuspendUserModal
          user={selectedUser}
          onClose={() => {
            setShowSuspendModal(false);
            setSelectedUser(null);
          }}
          onConfirm={() => handleSuspendUser(selectedUser, true)}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
          onConfirm={() => handleResetPassword(selectedUser.email)}
        />
      )}
    </div>
  );
}

// Action Dropdown Component
function ActionDropdown({ 
  user, 
  rowIndex, 
  totalRows, 
  onEdit, 
  onResetPassword, 
  onSuspend, 
  onActivate, 
  onDelete,
  closeDropdown 
}) {
  const dropdownRef = useRef(null);
  
  // Determine if dropdown should open upwards (for last rows)
  const shouldOpenUpwards = rowIndex >= totalRows - 3;
  
  // Get dropdown classes
  const getDropdownClasses = () => {
    const classes = ['action-dropdown'];
    if (shouldOpenUpwards) {
      classes.push('upwards');
    }
    return classes.join(' ');
  };

  return (
    <div 
      ref={dropdownRef}
      className={getDropdownClasses()}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="dropdown-item" onClick={onEdit}>
        <Edit size={14} /> Edit Profile
      </button>
      <button className="dropdown-item" onClick={onResetPassword}>
        <Key size={14} /> Reset Password
      </button>
      {user.status === 'active' ? (
        <button className="dropdown-item warning" onClick={onSuspend}>
          <UserX size={14} /> Suspend User
        </button>
      ) : (
        <button className="dropdown-item success" onClick={onActivate}>
          <CheckCircle size={14} /> Activate User
        </button>
      )}
      <button className="dropdown-item danger" onClick={onDelete}>
        <Trash2 size={14} /> Delete User
      </button>
    </div>
  );
}

// Modal Components (keep the same as before)
function AddUserModal({ branches, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'FACILITATOR',
    assigned_branch: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Create user_meta record
      const { error: metaError } = await supabase
        .from('users_meta')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
          assigned_branch: formData.assigned_branch || null,
          status: formData.status
        });

      if (metaError) throw metaError;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3><UserPlus size={20} /> Add New User</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-grid">
            <div className="form-group">
              <label><User size={14} /> Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            
            <div className="form-group">
              <label><Mail size={14} /> Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="user@miotsacco.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label><Phone size={14} /> Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+254 700 000 000"
              />
            </div>
            
            <div className="form-group">
              <label><Lock size={14} /> Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="At least 6 characters"
                required
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label><Shield size={14} /> Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                required
              >
                <option value="FACILITATOR">Facilitator</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="GENERAL_MANAGER">General Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            
            <div className="form-group">
              <label><Building2 size={14} /> Assigned Branch</label>
              <select
                value={formData.assigned_branch}
                onChange={(e) => setFormData({...formData, assigned_branch: e.target.value})}
              >
                <option value="">Select a branch (optional)</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, branches, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    role: user.role,
    assigned_branch: user.assigned_branch || '',
    status: user.status || 'active',
    notes: user.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.role === 'BRANCH_MANAGER' && !formData.assigned_branch) {
      setError('Branch Manager must be assigned to a branch');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users_meta')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3><Edit size={20} /> Edit User: {user.email}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="user-info-summary">
            <div className="summary-item">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="summary-item">
              <strong>User ID:</strong> {user.id.substring(0, 12)}...
            </div>
            <div className="summary-item">
              <strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+254 700 000 000"
              />
            </div>
            
            <div className="form-group">
              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                required
              >
                <option value="FACILITATOR">Facilitator</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="GENERAL_MANAGER">General Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Assigned Branch</label>
              <select
                value={formData.assigned_branch}
                onChange={(e) => setFormData({...formData, assigned_branch: e.target.value})}
              >
                <option value="">No branch assigned</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Add any notes about this user..."
                rows="3"
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteUserModal({ user, onClose, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3><Trash2 size={20} /> Delete User</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="warning-message">
            <AlertCircle size={24} />
            <div>
              <strong>Warning: This action cannot be undone!</strong>
              <p>You are about to delete user: <strong>{user.email}</strong></p>
              <p>This will remove the user from the system and revoke all access.</p>
            </div>
          </div>
          
          <div className="user-details">
            <div><strong>Role:</strong> {user.role}</div>
            <div><strong>Status:</strong> {user.status}</div>
            {user.full_name && <div><strong>Name:</strong> {user.full_name}</div>}
          </div>
        </div>
        
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Delete User Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

function SuspendUserModal({ user, onClose, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3><UserX size={20} /> Suspend User</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="warning-message">
            <AlertCircle size={24} />
            <div>
              <strong>Suspend User Access</strong>
              <p>You are about to suspend user: <strong>{user.email}</strong></p>
              <p>The user will not be able to login until reactivated.</p>
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-warning" onClick={onConfirm}>
            Suspend User
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3><Key size={20} /> Reset Password</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="info-message">
            <Send size={24} />
            <div>
              <strong>Send Password Reset Email</strong>
              <p>A password reset link will be sent to: <strong>{user.email}</strong></p>
              <p>The user will need to click the link in their email to set a new password.</p>
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Send Reset Email
          </button>
        </div>
      </div>
    </div>
  );
}