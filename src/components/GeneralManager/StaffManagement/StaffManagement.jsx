import { useState, useEffect } from 'react';
import { 
    Users, Shield, Building2, Edit, Trash2, UserPlus, Search, Filter,
    RefreshCw, AlertCircle, CheckCircle, X, ArrowRight, MapPin, Phone, Mail,
    MoreVertical, UserCheck, UserX, Shuffle, Activity, Award, TrendingUp,
    Group, Plus, Settings, Eye, Clock, Star, Target, Lock, Unlock,
    Save, Upload, Download, ChevronDown, ChevronRight, Grid, List
} from 'lucide-react';
import supabase from '../../../supabaseClient';
import './StaffManagement.css';

export default function StaffManagement() {
    const [staff, setStaff] = useState([]);
    const [branches, setBranches] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Filters and View
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [branchFilter, setBranchFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    
    // Modals
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showFacilitatorGroupsModal, setShowFacilitatorGroupsModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showBranchGroupsModal, setShowBranchGroupsModal] = useState(false);
    const [showStaffDetailsModal, setShowStaffDetailsModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    
    // New staff/group data
    const [newGroupData, setNewGroupData] = useState({
        group_name: '',
        branch_id: '',
        meeting_day: 'Monday',
        meeting_time: '09:00',
        meeting_location: '',
        is_active: true
    });
    
    // Selected staff for group assignment
    const [selectedGroupStaff, setSelectedGroupStaff] = useState([]);
    
    // Stats
    const [stats, setStats] = useState({
        totalStaff: 0,
        branchManagers: 0,
        facilitators: 0,
        unassignedStaff: 0,
        activeFacilitators: 0,
        facilitatorsWithGroups: 0,
        totalGroups: 0,
        groupsWithoutFacilitators: 0,
        staffByBranch: {}
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Load all staff
            const { data: staffData, error: staffError } = await supabase
                .from('users_meta')
                .select('*')
                .in('role', ['BRANCH_MANAGER', 'FACILITATOR'])
                .order('created_at', { ascending: false });
            
            if (staffError) throw staffError;
            
            // Load branches
            const { data: branchesData, error: branchesError } = await supabase
                .from('branches')
                .select('id, name, location, is_active, created_at')
                .order('name');
            
            if (branchesError) throw branchesError;
            
            // Load groups with detailed info
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select(`
                    id,
                    group_name,
                    facilitator_id,
                    branch_id,
                    meeting_day,
                    meeting_time,
                    meeting_location,
                    is_active,
                    created_at,
                    branch:branches(name, location),
                    facilitator:users_meta(full_name, email)
                `)
                .order('group_name');
            
            if (groupsError) throw groupsError;
            
            // Enhance staff data
            const enhancedStaff = staffData.map(member => {
                const staffGroups = groupsData?.filter(g => g.facilitator_id === member.id) || [];
                const assignedBranch = branchesData?.find(b => b.id === member.assigned_branch);
                const branchGroups = groupsData?.filter(g => g.branch_id === member.assigned_branch) || [];
                
                return {
                    ...member,
                    group_count: staffGroups.length,
                    groups: staffGroups,
                    branch_name: assignedBranch?.name || 'Unassigned',
                    branch_location: assignedBranch?.region || '',
                    branch_data: assignedBranch,
                    branch_groups: branchGroups,
                    performance_rating: calculatePerformanceRating(member, staffGroups)
                };
            });
            
            setStaff(enhancedStaff);
            setBranches(branchesData || []);
            setGroups(groupsData || []);
            
            // Calculate stats
            calculateStats(enhancedStaff, groupsData || []);
            
        } catch (err) {
            console.error('Load error:', err);
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const calculatePerformanceRating = (member, groups) => {
        // Mock performance calculation based on various factors
        if (member.role === 'BRANCH_MANAGER') {
            return Math.min(100, Math.floor(Math.random() * 30) + 70); // 70-100 for BMs
        }
        
        // For facilitators with groups
        if (groups.length > 0) {
            const baseScore = Math.min(100, Math.floor(Math.random() * 40) + 60);
            const groupBonus = groups.length * 5;
            return Math.min(100, baseScore + groupBonus);
        }
        
        // New facilitators without groups
        return Math.floor(Math.random() * 50) + 50; // 50-100
    };

    const calculateStats = (staffList, groupsList) => {
        const branchManagers = staffList.filter(s => s.role === 'BRANCH_MANAGER').length;
        const facilitators = staffList.filter(s => s.role === 'FACILITATOR').length;
        const unassigned = staffList.filter(s => !s.assigned_branch).length;
        const activeFacilitators = staffList.filter(s => 
            s.role === 'FACILITATOR' && s.status === 'active'
        ).length;
        const facilitatorsWithGroups = staffList.filter(s => 
            s.role === 'FACILITATOR' && s.group_count > 0
        ).length;
        const totalGroups = groupsList.length;
        const groupsWithoutFacilitators = groupsList.filter(g => !g.facilitator_id).length;
        
        // Staff by branch
        const staffByBranch = {};
        staffList.forEach(member => {
            const branchId = member.assigned_branch || 'unassigned';
            staffByBranch[branchId] = staffByBranch[branchId] || { count: 0, branch_name: member.branch_name };
            staffByBranch[branchId].count++;
        });
        
        setStats({
            totalStaff: staffList.length,
            branchManagers,
            facilitators,
            unassignedStaff: unassigned,
            activeFacilitators,
            facilitatorsWithGroups,
            totalGroups,
            groupsWithoutFacilitators,
            staffByBranch
        });
    };

    // Assign staff to branch
    const handleAssignToBranch = async (staffId, branchId) => {
        try {
            setLoading(true);
            
            const staffMember = staff.find(s => s.id === staffId);
            if (!staffMember) throw new Error('Staff member not found');
            
            // Check if staff is a Branch Manager
            if (staffMember.role === 'BRANCH_MANAGER') {
                // Check if branch already has a manager
                const existingManager = staff.find(s => 
                    s.role === 'BRANCH_MANAGER' && s.assigned_branch === branchId && s.id !== staffId
                );
                
                if (existingManager) {
                    const confirm = window.confirm(
                        `${existingManager.full_name} is already the manager of this branch. ` +
                        `Do you want to reassign? ${staffMember.full_name} will become the new manager.`
                    );
                    if (!confirm) return;
                }
            }
            
            // Update staff member's assigned branch
            const { error: updateError } = await supabase
                .from('users_meta')
                .update({ 
                    assigned_branch: branchId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', staffId);
            
            if (updateError) throw updateError;
            
            // Log the assignment
            await supabase
                .from('staff_assignments_log')
                .insert({
                    staff_id: staffId,
                    from_branch: staffMember.assigned_branch,
                    to_branch: branchId,
                    assigned_by: (await supabase.auth.getUser()).data.user?.id,
                    notes: `Assigned to branch`
                });
            
            setSuccess(`${staffMember.full_name} assigned to branch successfully!`);
            setShowAssignModal(false);
            setSelectedStaff(null);
            await loadData();
            
        } catch (err) {
            setError(`Failed to assign staff: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Move staff between branches
    const handleMoveToBranch = async (staffId, newBranchId, moveGroups = true) => {
        try {
            setLoading(true);
            
            const staffMember = staff.find(s => s.id === staffId);
            if (!staffMember) throw new Error('Staff member not found');
            
            // Check if moving to same branch
            if (staffMember.assigned_branch === newBranchId) {
                setError('Staff member is already assigned to this branch');
                return;
            }
            
            const oldBranchId = staffMember.assigned_branch;
            
            // Update staff member's branch
            const { error: staffError } = await supabase
                .from('users_meta')
                .update({ 
                    assigned_branch: newBranchId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', staffId);
            
            if (staffError) throw staffError;
            
            let movedGroupsCount = 0;
            
            // If facilitator and moveGroups is true, update all their groups
            if (staffMember.role === 'FACILITATOR' && moveGroups && staffMember.groups.length > 0) {
                const groupIds = staffMember.groups.map(g => g.id);
                
                const { error: groupsError } = await supabase
                    .from('groups')
                    .update({ 
                        branch_id: newBranchId,
                        updated_at: new Date().toISOString()
                    })
                    .in('id', groupIds);
                
                if (groupsError) throw groupsError;
                movedGroupsCount = staffMember.groups.length;
            }
            
            // Log the move
            await supabase
                .from('staff_assignments_log')
                .insert({
                    staff_id: staffId,
                    from_branch: oldBranchId,
                    to_branch: newBranchId,
                    assigned_by: (await supabase.auth.getUser()).data.user?.id,
                    notes: `Moved to new branch${moveGroups ? ` with ${movedGroupsCount} groups` : ''}`
                });
            
            setSuccess(`${staffMember.full_name} moved to new branch successfully! ${movedGroupsCount > 0 ? `${movedGroupsCount} groups moved.` : ''}`);
            setShowMoveModal(false);
            setSelectedStaff(null);
            await loadData();
            
        } catch (err) {
            setError(`Failed to move staff: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Create new group
    const handleCreateGroup = async () => {
        try {
            setLoading(true);
            
            if (!newGroupData.group_name || !newGroupData.branch_id) {
                setError('Group name and branch are required');
                return;
            }
            
            // Create new group
            const { error: groupError } = await supabase
                .from('groups')
                .insert([{
                    group_name: newGroupData.group_name,
                    branch_id: newGroupData.branch_id,
                    meeting_day: newGroupData.meeting_day,
                    meeting_time: newGroupData.meeting_time,
                    meeting_location: newGroupData.meeting_location,
                    is_active: newGroupData.is_active,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                }]);
            
            if (groupError) throw groupError;
            
            setSuccess('Group created successfully!');
            setNewGroupData({
                group_name: '',
                branch_id: '',
                meeting_day: 'Monday',
                meeting_time: '09:00',
                meeting_location: '',
                is_active: true
            });
            setShowCreateGroupModal(false);
            await loadData();
            
        } catch (err) {
            setError(`Failed to create group: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Assign facilitator to group
    const handleAssignToGroup = async (facilitatorId, groupId) => {
        try {
            setLoading(true);
            
            const facilitator = staff.find(s => s.id === facilitatorId);
            const group = groups.find(g => g.id === groupId);
            
            if (!facilitator || !group) {
                throw new Error('Facilitator or group not found');
            }
            
            // Check if facilitator is assigned to same branch as group
            if (facilitator.assigned_branch !== group.branch_id) {
                const confirm = window.confirm(
                    `This group belongs to a different branch. Do you want to:\n\n` +
                    `1. Reassign group to facilitator's branch (${facilitator.branch_name})\n` +
                    `2. Move facilitator to group's branch (${group.branch?.name})\n` +
                    `3. Cancel assignment`
                );
                
                if (confirm) {
                    // Option 1: Move group to facilitator's branch
                    await supabase
                        .from('groups')
                        .update({ 
                            branch_id: facilitator.assigned_branch,
                            facilitator_id: facilitatorId,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', groupId);
                    
                    setSuccess('Group reassigned to facilitator\'s branch and assigned successfully!');
                } else {
                    return;
                }
            } else {
                // Update group with facilitator
                const { error: groupError } = await supabase
                    .from('groups')
                    .update({ 
                        facilitator_id: facilitatorId,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', groupId);
                
                if (groupError) throw groupError;
                
                setSuccess('Group assigned to facilitator successfully!');
            }
            
            // Log the assignment
            await supabase
                .from('group_assignments_log')
                .insert({
                    group_id: groupId,
                    facilitator_id: facilitatorId,
                    assigned_by: (await supabase.auth.getUser()).data.user?.id,
                    notes: 'Manual assignment'
                });
            
            await loadData();
            
        } catch (err) {
            setError(`Failed to assign group: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Remove facilitator from group
    const handleRemoveFromGroup = async (groupId) => {
        try {
            if (!window.confirm('Are you sure you want to remove the facilitator from this group?')) {
                return;
            }
            
            setLoading(true);
            
            const group = groups.find(g => g.id === groupId);
            
            const { error } = await supabase
                .from('groups')
                .update({ 
                    facilitator_id: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', groupId);
            
            if (error) throw error;
            
            // Log the removal
            await supabase
                .from('group_assignments_log')
                .insert({
                    group_id: groupId,
                    facilitator_id: group?.facilitator_id,
                    assigned_by: (await supabase.auth.getUser()).data.user?.id,
                    notes: 'Facilitator removed from group'
                });
            
            setSuccess('Facilitator removed from group successfully!');
            await loadData();
            
        } catch (err) {
            setError(`Failed to remove facilitator: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Change staff status
    const handleChangeStatus = async (staffId, newStatus) => {
        try {
            if (!window.confirm(`Change staff status to ${newStatus}?`)) {
                return;
            }
            
            setLoading(true);
            
            const { error } = await supabase
                .from('users_meta')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', staffId);
            
            if (error) throw error;
            
            setSuccess('Staff status updated successfully!');
            await loadData();
            
        } catch (err) {
            setError(`Failed to update status: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Get filtered staff
    const getFilteredStaff = () => {
        return staff.filter(member => {
            // Search filter
            const searchMatch = !searchTerm || 
                member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.phone?.includes(searchTerm) ||
                member.branch_name?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Role filter
            const roleMatch = roleFilter === 'all' || member.role === roleFilter;
            
            // Branch filter
            const branchMatch = branchFilter === 'all' || member.assigned_branch === branchFilter;
            
            // Status filter
            const statusMatch = statusFilter === 'all' || member.status === statusFilter;
            
            return searchMatch && roleMatch && branchMatch && statusMatch;
        });
    };

    const filteredStaff = getFilteredStaff();

    // Export staff data
    const handleExportData = async () => {
        try {
            const exportData = staff.map(member => ({
                Name: member.full_name,
                Email: member.email,
                Phone: member.phone,
                Role: member.role,
                Status: member.status,
                Branch: member.branch_name,
                Location: member.branch_location,
                'Group Count': member.group_count,
                'Performance Rating': member.performance_rating,
                'Created Date': new Date(member.created_at).toLocaleDateString()
            }));
            
            // Convert to CSV
            const headers = Object.keys(exportData[0] || {});
            const csv = [
                headers.join(','),
                ...exportData.map(row => 
                    headers.map(header => 
                        JSON.stringify(row[header] || '')
                    ).join(',')
                )
            ].join('\n');
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `staff_data_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            setSuccess('Data exported successfully!');
            
        } catch (err) {
            setError(`Failed to export data: ${err.message}`);
        }
    };

    return (
        <div className="staff-management">
            {/* Header */}
            <div className="staff-header">
                <div>
                    <h2><Shield size={28} /> Staff Management</h2>
                    <p>Manage branch managers and facilitators across all branches</p>
                </div>
                <div className="header-actions">
                    <div className="view-toggle">
                        <button 
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={18} />
                        </button>
                        <button 
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={18} />
                        </button>
                    </div>
                    <button 
                        className="btn btn-secondary"
                        onClick={handleExportData}
                    >
                        <Download size={18} /> Export
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setShowCreateGroupModal(true)}
                    >
                        <Plus size={18} /> Create Group
                    </button>
                    <button 
                        className="btn btn-success" 
                        onClick={loadData}
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="alert alert-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="alert-close">
                        <X size={16} />
                    </button>
                </div>
            )}
            
            {success && (
                <div className="alert alert-success">
                    <CheckCircle size={20} />
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="alert-close">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Statistics Dashboard */}
            <div className="stats-dashboard">
                <div className="stats-grid">
                    <div className="stat-card primary">
                        <div className="stat-icon">
                            <Users size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.totalStaff}</h3>
                            <p>Total Staff</p>
                            <small>{stats.branchManagers} BMs • {stats.facilitators} Fac</small>
                        </div>
                    </div>
                    
                    <div className="stat-card success">
                        <div className="stat-icon">
                            <Building2 size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{branches.length}</h3>
                            <p>Branches</p>
                            <small>{branches.filter(b => b.is_active).length} active</small>
                        </div>
                    </div>
                    
                    <div className="stat-card info">
                        <div className="stat-icon">
                            <Group size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.totalGroups}</h3>
                            <p>Groups</p>
                            <small>{stats.groupsWithoutFacilitators} unassigned</small>
                        </div>
                    </div>
                    
                    <div className="stat-card warning">
                        <div className="stat-icon">
                            <UserX size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.unassignedStaff}</h3>
                            <p>Unassigned Staff</p>
                            <small>Need branch assignment</small>
                        </div>
                    </div>
                    
                    <div className="stat-card danger">
                        <div className="stat-icon">
                            <AlertCircle size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{staff.filter(s => s.status === 'inactive').length}</h3>
                            <p>Inactive</p>
                            <small>Require attention</small>
                        </div>
                    </div>
                    
                    <div className="stat-card purple">
                        <div className="stat-icon">
                            <Activity size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{Math.round(staff.reduce((sum, s) => sum + s.performance_rating, 0) / Math.max(staff.length, 1))}%</h3>
                            <p>Avg Performance</p>
                            <small>Overall rating</small>
                        </div>
                    </div>
                </div>

                {/* Branch Distribution */}
                <div className="branch-distribution">
                    <h4>Staff Distribution by Branch</h4>
                    <div className="distribution-grid">
                        {Object.entries(stats.staffByBranch).slice(0, 6).map(([branchId, data]) => (
                            <div key={branchId} className="branch-stat">
                                <div className="branch-stat-info">
                                    <strong>{data.count}</strong>
                                    <span>{branchId === 'unassigned' ? 'Unassigned' : data.branch_name}</span>
                                </div>
                                <div className="branch-stat-bar">
                                    <div 
                                        className="bar-fill"
                                        style={{ width: `${(data.count / stats.totalStaff) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {Object.keys(stats.staffByBranch).length > 6 && (
                            <div className="branch-stat more">
                                <span>+{Object.keys(stats.staffByBranch).length - 6} more branches</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search staff by name, email, phone, or branch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="filter-controls">
                    <select 
                        value={roleFilter} 
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Roles</option>
                        <option value="BRANCH_MANAGER">Branch Managers</option>
                        <option value="FACILITATOR">Facilitators</option>
                    </select>
                    
                    <select 
                        value={branchFilter} 
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Branches</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                    
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>
                    
                    <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                            setSearchTerm('');
                            setRoleFilter('all');
                            setBranchFilter('all');
                            setStatusFilter('all');
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Staff List/Grid */}
            <div className="staff-list">
                {loading && filteredStaff.length === 0 ? (
                    <div className="loading-state">
                        <RefreshCw size={32} className="spinning" />
                        <p>Loading staff...</p>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <h3>No staff found</h3>
                        <p>No staff members match your filters</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('all');
                                setBranchFilter('all');
                                setStatusFilter('all');
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="staff-grid">
                        {filteredStaff.map(member => (
                            <StaffCard
                                key={member.id}
                                staff={member}
                                branches={branches}
                                onAssign={() => {
                                    setSelectedStaff(member);
                                    setShowAssignModal(true);
                                }}
                                onMove={() => {
                                    setSelectedStaff(member);
                                    setShowMoveModal(true);
                                }}
                                onViewGroups={() => {
                                    setSelectedStaff(member);
                                    setShowFacilitatorGroupsModal(true);
                                }}
                                onViewDetails={() => {
                                    setSelectedStaff(member);
                                    setShowStaffDetailsModal(true);
                                }}
                                onChangeStatus={handleChangeStatus}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="staff-table-container">
                        <table className="staff-table">
                            <thead>
                                <tr>
                                    <th>Staff Member</th>
                                    <th>Role</th>
                                    <th>Branch</th>
                                    <th>Status</th>
                                    <th>Groups</th>
                                    <th>Performance</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.map(member => (
                                    <tr key={member.id}>
                                        <td>
                                            <div className="staff-table-info">
                                                <div className="staff-avatar small">
                                                    {member.role === 'BRANCH_MANAGER' ? 
                                                        <Shield size={16} /> : 
                                                        <Users size={16} />
                                                    }
                                                </div>
                                                <div>
                                                    <strong>{member.full_name || 'No Name'}</strong>
                                                    <small>{member.email}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${member.role === 'BRANCH_MANAGER' ? 'success' : 'info'}`}>
                                                {member.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={member.assigned_branch ? '' : 'unassigned'}>
                                                {member.branch_name}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${member.status === 'active' ? 'success' : member.status === 'inactive' ? 'warning' : 'danger'}`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td>
                                            {member.role === 'FACILITATOR' ? (
                                                <div className="groups-count">
                                                    <span>{member.group_count}</span>
                                                    {member.group_count > 0 && (
                                                        <button 
                                                            className="btn-text"
                                                            onClick={() => {
                                                                setSelectedStaff(member);
                                                                setShowFacilitatorGroupsModal(true);
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <div className="performance-rating">
                                                <div className="rating-bar">
                                                    <div 
                                                        className="rating-fill"
                                                        style={{ width: `${member.performance_rating}%` }}
                                                    />
                                                </div>
                                                <span>{member.performance_rating}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button 
                                                    className="btn-icon"
                                                    onClick={() => {
                                                        setSelectedStaff(member);
                                                        setShowStaffDetailsModal(true);
                                                    }}
                                                    title="View Details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                {!member.assigned_branch ? (
                                                    <button 
                                                        className="btn-icon"
                                                        onClick={() => {
                                                            setSelectedStaff(member);
                                                            setShowAssignModal(true);
                                                        }}
                                                        title="Assign to Branch"
                                                    >
                                                        <UserPlus size={14} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className="btn-icon"
                                                        onClick={() => {
                                                            setSelectedStaff(member);
                                                            setShowMoveModal(true);
                                                        }}
                                                        title="Move to Branch"
                                                    >
                                                        <Shuffle size={14} />
                                                    </button>
                                                )}
                                                <button 
                                                    className="btn-icon"
                                                    onClick={() => handleChangeStatus(member.id, member.status === 'active' ? 'inactive' : 'active')}
                                                    title="Change Status"
                                                >
                                                    {member.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAssignModal && selectedStaff && (
                <AssignToBranchModal
                    staff={selectedStaff}
                    branches={branches}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedStaff(null);
                    }}
                    onAssign={handleAssignToBranch}
                />
            )}

            {showMoveModal && selectedStaff && (
                <MoveToBranchModal
                    staff={selectedStaff}
                    branches={branches}
                    currentBranch={branches.find(b => b.id === selectedStaff.assigned_branch)}
                    onClose={() => {
                        setShowMoveModal(false);
                        setSelectedStaff(null);
                    }}
                    onMove={handleMoveToBranch}
                />
            )}

            {showFacilitatorGroupsModal && selectedStaff && (
                <FacilitatorGroupsModal
                    facilitator={selectedStaff}
                    allGroups={groups}
                    branches={branches}
                    onClose={() => {
                        setShowFacilitatorGroupsModal(false);
                        setSelectedStaff(null);
                    }}
                    onAssignToGroup={handleAssignToGroup}
                    onRemoveFromGroup={handleRemoveFromGroup}
                />
            )}

            {showCreateGroupModal && (
                <CreateGroupModal
                    branches={branches}
                    facilitators={staff.filter(s => s.role === 'FACILITATOR')}
                    onClose={() => setShowCreateGroupModal(false)}
                    onCreate={handleCreateGroup}
                    groupData={newGroupData}
                    onChange={setNewGroupData}
                />
            )}

            {showStaffDetailsModal && selectedStaff && (
                <StaffDetailsModal
                    staff={selectedStaff}
                    onClose={() => {
                        setShowStaffDetailsModal(false);
                        setSelectedStaff(null);
                    }}
                    onChangeStatus={handleChangeStatus}
                />
            )}
        </div>
    );
}

// Enhanced Staff Card Component
function StaffCard({ staff, branches, onAssign, onMove, onViewGroups, onViewDetails, onChangeStatus }) {
    const getRoleColor = (role) => {
        return role === 'BRANCH_MANAGER' ? 'success' : 'info';
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'active': return 'success';
            case 'inactive': return 'warning';
            case 'suspended': return 'danger';
            default: return 'secondary';
        }
    };

    const getPerformanceColor = (rating) => {
        if (rating >= 90) return 'excellent';
        if (rating >= 80) return 'good';
        if (rating >= 70) return 'average';
        return 'poor';
    };

    return (
        <div className="staff-card">
            <div className="staff-card-header">
                <div className="staff-avatar">
                    {staff.role === 'BRANCH_MANAGER' ? (
                        <Shield size={24} />
                    ) : (
                        <Users size={24} />
                    )}
                </div>
                <div className="staff-basic-info">
                    <h4>{staff.full_name || 'No Name'}</h4>
                    <div className="role-status-row">
                        <span className={`role-badge ${getRoleColor(staff.role)}`}>
                            {staff.role.replace('_', ' ')}
                        </span>
                        <span className={`status-badge ${getStatusColor(staff.status)}`}>
                            {staff.status}
                        </span>
                    </div>
                </div>
                <div className="performance-indicator">
                    <div className="performance-circle">
                        <span>{staff.performance_rating}</span>
                        <small>%</small>
                    </div>
                    <div className={`performance-dot ${getPerformanceColor(staff.performance_rating)}`} />
                </div>
            </div>

            <div className="staff-card-body">
                <div className="staff-info-item">
                    <Mail size={14} />
                    <span className={staff.email ? '' : 'no-data'}>{staff.email || 'No email'}</span>
                </div>
                <div className="staff-info-item">
                    <Phone size={14} />
                    <span className={staff.phone ? '' : 'no-data'}>{staff.phone || 'No phone'}</span>
                </div>
                <div className="staff-info-item">
                    <Building2 size={14} />
                    <span className={staff.assigned_branch ? '' : 'unassigned'}>
                        {staff.branch_name}
                        {staff.branch_location && ` (${staff.branch_location})`}
                    </span>
                </div>
                {staff.role === 'FACILITATOR' && (
                    <div className="staff-info-item">
                        <Group size={14} />
                        <span>{staff.group_count} group{staff.group_count !== 1 ? 's' : ''}</span>
                    </div>
                )}
                <div className="staff-info-item">
                    <Clock size={14} />
                    <span>Joined {new Date(staff.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="staff-card-actions">
                <div className="action-buttons">
                    {!staff.assigned_branch ? (
                        <button 
                            className="btn btn-sm btn-primary"
                            onClick={onAssign}
                        >
                            <UserPlus size={14} /> Assign
                        </button>
                    ) : (
                        <button 
                            className="btn btn-sm btn-secondary"
                            onClick={onMove}
                        >
                            <Shuffle size={14} /> Move
                        </button>
                    )}
                    {staff.role === 'FACILITATOR' && (
                        <button 
                            className="btn btn-sm btn-info"
                            onClick={onViewGroups}
                        >
                            <Group size={14} /> Groups
                        </button>
                    )}
                </div>
                <div className="quick-actions">
                    <button 
                        className="btn-icon"
                        onClick={onViewDetails}
                        title="View Details"
                    >
                        <Eye size={14} />
                    </button>
                    <button 
                        className="btn-icon"
                        onClick={() => onChangeStatus(staff.id, staff.status === 'active' ? 'inactive' : 'active')}
                        title={staff.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                        {staff.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Enhanced Assign to Branch Modal
function AssignToBranchModal({ staff, branches, onClose, onAssign }) {
    const [selectedBranch, setSelectedBranch] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedBranch) {
            onAssign(staff.id, selectedBranch);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3><Building2 size={20} /> Assign to Branch</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="staff-summary-card">
                            <div className="summary-avatar">
                                {staff.role === 'BRANCH_MANAGER' ? 
                                    <Shield size={32} /> : 
                                    <Users size={32} />
                                }
                            </div>
                            <div className="summary-details">
                                <h4>{staff.full_name}</h4>
                                <p><strong>Role:</strong> {staff.role.replace('_', ' ')}</p>
                                <p><strong>Email:</strong> {staff.email}</p>
                                <p><strong>Current Status:</strong> Unassigned</p>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Select Branch *</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                required
                                className="form-control"
                            >
                                <option value="">-- Select a branch --</option>
                                {branches
                                    .filter(b => b.is_active)
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(branch => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name} - {branch.region}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Assignment Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="form-control"
                                placeholder="Add any notes about this assignment..."
                                rows="3"
                            />
                        </div>
                        
                        {selectedBranch && staff.role === 'BRANCH_MANAGER' && (
                            <div className="alert alert-warning">
                                <AlertCircle size={16} />
                                <span>
                                    Assigning a Branch Manager will make them responsible for this branch.
                                    Any existing manager will be reassigned.
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={!selectedBranch}>
                            <CheckCircle size={16} /> Assign to Branch
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Enhanced Move to Branch Modal
function MoveToBranchModal({ staff, branches, currentBranch, onClose, onMove }) {
    const [selectedBranch, setSelectedBranch] = useState('');
    const [moveGroups, setMoveGroups] = useState(true);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedBranch && selectedBranch !== staff.assigned_branch) {
            onMove(staff.id, selectedBranch, moveGroups);
        }
    };

    const availableBranches = branches.filter(b => 
        b.is_active && b.id !== staff.assigned_branch
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3><Shuffle size={20} /> Move Staff Member</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="staff-summary-card">
                            <div className="summary-avatar">
                                {staff.role === 'BRANCH_MANAGER' ? 
                                    <Shield size={32} /> : 
                                    <Users size={32} />
                                }
                            </div>
                            <div className="summary-details">
                                <h4>{staff.full_name}</h4>
                                <p><strong>Role:</strong> {staff.role.replace('_', ' ')}</p>
                                <p><strong>Current Branch:</strong> {currentBranch?.name || 'Unassigned'}</p>
                                <p><strong>Groups:</strong> {staff.group_count}</p>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Select New Branch *</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                required
                                className="form-control"
                            >
                                <option value="">-- Select new branch --</option>
                                {availableBranches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name} - {branch.region}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {staff.role === 'FACILITATOR' && staff.group_count > 0 && (
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={moveGroups}
                                        onChange={(e) => setMoveGroups(e.target.checked)}
                                    />
                                    <span>Move all groups ({staff.group_count}) to new branch</span>
                                </label>
                                <small className="checkbox-description">
                                    If unchecked, groups will remain in the current branch and become unassigned
                                </small>
                            </div>
                        )}
                        
                        <div className="form-group">
                            <label>Movement Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="form-control"
                                placeholder="Add notes about this movement..."
                                rows="3"
                            />
                        </div>
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={!selectedBranch || selectedBranch === staff.assigned_branch}
                        >
                            <ArrowRight size={16} /> Move to Branch
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Enhanced Facilitator Groups Modal
function FacilitatorGroupsModal({ facilitator, allGroups, branches, onClose, onAssignToGroup, onRemoveFromGroup }) {
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [activeTab, setActiveTab] = useState('current'); // 'current', 'available', 'branch'
    
    const facilitatorGroups = allGroups.filter(g => g.facilitator_id === facilitator.id);
    const availableGroups = allGroups.filter(g => 
        !g.facilitator_id && 
        g.branch_id === facilitator.assigned_branch &&
        g.is_active
    );
    const branchGroups = allGroups.filter(g => 
        g.branch_id === facilitator.assigned_branch
    );

    const handleAssign = () => {
        if (selectedGroupId) {
            onAssignToGroup(facilitator.id, selectedGroupId);
            setSelectedGroupId('');
        }
    };

    const renderGroupCard = (group, isAssigned = false) => {
        const branch = branches.find(b => b.id === group.branch_id);
        
        return (
            <div key={group.id} className="group-card">
                <div className="group-card-header">
                    <h5>{group.group_name}</h5>
                    {isAssigned ? (
                        <span className="badge badge-success">Assigned</span>
                    ) : (
                        <span className="badge badge-secondary">Available</span>
                    )}
                </div>
                <div className="group-card-body">
                    <p><Building2 size={12} /> {branch?.name || 'Unknown Branch'}</p>
                    <p><Clock size={12} /> {group.meeting_day} at {group.meeting_time}</p>
                    {group.meeting_location && (
                        <p><MapPin size={12} /> {group.meeting_location}</p>
                    )}
                </div>
                <div className="group-card-actions">
                    {isAssigned ? (
                        <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => onRemoveFromGroup(group.id)}
                        >
                            <X size={14} /> Remove
                        </button>
                    ) : (
                        <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => onAssignToGroup(facilitator.id, group.id)}
                        >
                            <UserPlus size={14} /> Assign
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3><Group size={20} /> Manage Facilitator Groups</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="modal-body">
                    <div className="facilitator-summary-section">
                        <div className="facilitator-summary">
                            <div className="facilitator-avatar">
                                <Users size={40} />
                            </div>
                            <div className="facilitator-details">
                                <h4>{facilitator.full_name}</h4>
                                <p><Building2 size={14} /> {facilitator.branch_name}</p>
                                <p><Users size={14} /> {facilitator.group_count} assigned groups</p>
                            </div>
                        </div>
                        
                        <div className="tabs">
                            <button 
                                className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
                                onClick={() => setActiveTab('current')}
                            >
                                Current Groups ({facilitatorGroups.length})
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
                                onClick={() => setActiveTab('available')}
                            >
                                Available Groups ({availableGroups.length})
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'branch' ? 'active' : ''}`}
                                onClick={() => setActiveTab('branch')}
                            >
                                All Branch Groups ({branchGroups.length})
                            </button>
                        </div>
                    </div>

                    <div className="groups-section">
                        {activeTab === 'current' && (
                            <div className="current-groups">
                                {facilitatorGroups.length === 0 ? (
                                    <div className="no-groups-message">
                                        <Group size={48} />
                                        <p>No groups assigned to this facilitator</p>
                                    </div>
                                ) : (
                                    <div className="groups-grid">
                                        {facilitatorGroups.map(group => renderGroupCard(group, true))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'available' && (
                            <div className="available-groups">
                                {availableGroups.length === 0 ? (
                                    <div className="no-groups-message">
                                        <Group size={48} />
                                        <p>No available groups in {facilitator.branch_name}</p>
                                    </div>
                                ) : (
                                    <div className="groups-grid">
                                        {availableGroups.map(group => renderGroupCard(group))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'branch' && (
                            <div className="branch-groups">
                                <div className="groups-grid">
                                    {branchGroups.map(group => {
                                        const isAssigned = group.facilitator_id === facilitator.id;
                                        return renderGroupCard(group, isAssigned);
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// Create Group Modal
function CreateGroupModal({ branches, facilitators, onClose, onCreate, groupData, onChange }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate();
    };

    const handleChange = (field, value) => {
        onChange({
            ...groupData,
            [field]: value
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3><Plus size={20} /> Create New Group</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Group Name *</label>
                            <input
                                type="text"
                                value={groupData.group_name}
                                onChange={(e) => handleChange('group_name', e.target.value)}
                                required
                                className="form-control"
                                placeholder="Enter group name"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Select Branch *</label>
                            <select
                                value={groupData.branch_id}
                                onChange={(e) => handleChange('branch_id', e.target.value)}
                                required
                                className="form-control"
                            >
                                <option value="">-- Select a branch --</option>
                                {branches
                                    .filter(b => b.is_active)
                                    .map(branch => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name} - {branch.region}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Meeting Day *</label>
                                <select
                                    value={groupData.meeting_day}
                                    onChange={(e) => handleChange('meeting_day', e.target.value)}
                                    required
                                    className="form-control"
                                >
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Meeting Time *</label>
                                <input
                                    type="time"
                                    value={groupData.meeting_time}
                                    onChange={(e) => handleChange('meeting_time', e.target.value)}
                                    required
                                    className="form-control"
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Meeting Location</label>
                            <input
                                type="text"
                                value={groupData.meeting_location}
                                onChange={(e) => handleChange('meeting_location', e.target.value)}
                                className="form-control"
                                placeholder="Enter meeting location"
                            />
                        </div>
                        
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={groupData.is_active}
                                    onChange={(e) => handleChange('is_active', e.target.checked)}
                                />
                                <span>Active Group</span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            <CheckCircle size={16} /> Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Staff Details Modal
function StaffDetailsModal({ staff, onClose, onChangeStatus }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getPerformanceColor = (rating) => {
        if (rating >= 90) return 'excellent';
        if (rating >= 80) return 'good';
        if (rating >= 70) return 'average';
        return 'poor';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3><Users size={20} /> Staff Details</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="modal-body">
                    <div className="staff-details-header">
                        <div className="details-avatar large">
                            {staff.role === 'BRANCH_MANAGER' ? 
                                <Shield size={48} /> : 
                                <Users size={48} />
                            }
                        </div>
                        <div className="details-header-content">
                            <h4>{staff.full_name}</h4>
                            <div className="details-meta">
                                <span className={`role-badge ${staff.role === 'BRANCH_MANAGER' ? 'success' : 'info'}`}>
                                    {staff.role.replace('_', ' ')}
                                </span>
                                <span className={`status-badge ${staff.status === 'active' ? 'success' : 'warning'}`}>
                                    {staff.status}
                                </span>
                                <span className="joined-date">
                                    Joined {formatDate(staff.created_at)}
                                </span>
                            </div>
                        </div>
                        <div className="details-actions">
                            <button 
                                className={`btn btn-sm ${staff.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                                onClick={() => onChangeStatus(staff.id, staff.status === 'active' ? 'inactive' : 'active')}
                            >
                                {staff.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                                {staff.status === 'active' ? ' Deactivate' : ' Activate'}
                            </button>
                        </div>
                    </div>

                    <div className="details-sections">
                        {/* Contact Information */}
                        <div className="details-section">
                            <h5><Mail size={16} /> Contact Information</h5>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <label>Email</label>
                                    <span>{staff.email || 'Not provided'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Phone</label>
                                    <span>{staff.phone || 'Not provided'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Last Login</label>
                                    <span>{staff.last_login ? formatDate(staff.last_login) : 'Never'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Branch Information */}
                        <div className="details-section">
                            <h5><Building2 size={16} /> Branch Information</h5>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <label>Assigned Branch</label>
                                    <span className={staff.assigned_branch ? '' : 'unassigned'}>
                                        {staff.branch_name || 'Unassigned'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>Branch Location</label>
                                    <span>{staff.branch_location || 'Not specified'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Branch Status</label>
                                    <span className={staff.branch_data?.is_active ? 'active' : 'inactive'}>
                                        {staff.branch_data?.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Performance & Groups */}
                        <div className="details-section">
                            <h5><Activity size={16} /> Performance & Groups</h5>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <label>Performance Rating</label>
                                    <div className="performance-display">
                                        <div className={`performance-circle ${getPerformanceColor(staff.performance_rating)}`}>
                                            <span>{staff.performance_rating}</span>
                                            <small>%</small>
                                        </div>
                                        <div className="performance-label">
                                            <span className={`performance-text ${getPerformanceColor(staff.performance_rating)}`}>
                                                {staff.performance_rating >= 90 ? 'Excellent' : 
                                                 staff.performance_rating >= 80 ? 'Good' : 
                                                 staff.performance_rating >= 70 ? 'Average' : 'Needs Improvement'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {staff.role === 'FACILITATOR' && (
                                    <div className="detail-item">
                                        <label>Groups Assigned</label>
                                        <div className="groups-summary">
                                            <strong>{staff.group_count}</strong>
                                            <small>groups assigned</small>
                                            {staff.group_count > 0 && (
                                                <ul className="group-names">
                                                    {staff.groups.slice(0, 3).map(group => (
                                                        <li key={group.id}>{group.group_name}</li>
                                                    ))}
                                                    {staff.group_count > 3 && (
                                                        <li>+{staff.group_count - 3} more</li>
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="detail-item">
                                    <label>Member Since</label>
                                    <div className="tenure-display">
                                        <strong>{Math.floor((new Date() - new Date(staff.created_at)) / (1000 * 60 * 60 * 24 * 30))}</strong>
                                        <small>months</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        {staff.notes && (
                            <div className="details-section">
                                <h5><FileText size={16} /> Additional Notes</h5>
                                <div className="notes-content">
                                    {staff.notes}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}