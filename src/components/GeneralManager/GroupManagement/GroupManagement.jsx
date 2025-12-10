// src/components/GeneralManager/GroupManagement/GroupManagement.jsx
import { useState, useEffect } from 'react';
import { 
    Users, Search, Filter, RefreshCw, Eye, Download,
    UserPlus, Building2, Calendar, DollarSign, TrendingUp,
    AlertCircle, CheckCircle
} from 'lucide-react';
import supabase from '../../../supabaseClient';
import './GroupManagement.css';

export default function GroupManagement() {
    const [groups, setGroups] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [groupsRes, membersRes] = await Promise.all([
                supabase
                    .from('groups')
                    .select(`
                        *,
                        branch:branches(name),
                        facilitator:users_meta(full_name),
                        members:group_members(count)
                    `)
                    .order('group_name'),
                supabase
                    .from('members')
                    .select('*')
                    .order('full_name')
            ]);

            setGroups(groupsRes.data || []);
            setMembers(membersRes.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group-management">
            <div className="page-header">
                <h1><Users size={28} /> Group & Member Management</h1>
                <p>Manage groups, members, and generate statements</p>
            </div>

            {/* Statistics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <Users size={24} />
                    <div>
                        <h3>{groups.length}</h3>
                        <p>Total Groups</p>
                    </div>
                </div>
                <div className="stat-card">
                    <UserPlus size={24} />
                    <div>
                        <h3>{members.length}</h3>
                        <p>Total Members</p>
                    </div>
                </div>
                <div className="stat-card">
                    <Building2 size={24} />
                    <div>
                        <h3>{new Set(groups.map(g => g.branch_id)).size}</h3>
                        <p>Branches with Groups</p>
                    </div>
                </div>
                <div className="stat-card">
                    <DollarSign size={24} />
                    <div>
                        <h3>{groups.filter(g => g.members?.count > 0).length}</h3>
                        <p>Active Groups</p>
                    </div>
                </div>
            </div>

            {/* Groups List */}
            <div className="groups-section">
                <div className="section-header">
                    <h2>Groups Overview</h2>
                    <div className="controls">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search groups..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={loadData} disabled={loading}>
                            <RefreshCw size={18} /> Refresh
                        </button>
                    </div>
                </div>

                <div className="groups-grid">
                    {groups.map(group => (
                        <div key={group.id} className="group-card">
                            <div className="group-header">
                                <h3>{group.group_name}</h3>
                                <span className={`status ${group.is_active ? 'active' : 'inactive'}`}>
                                    {group.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="group-details">
                                <p><Building2 size={14} /> {group.branch?.name}</p>
                                <p><UserPlus size={14} /> {group.facilitator?.full_name || 'No Facilitator'}</p>
                                <p><Users size={14} /> {group.members?.count || 0} members</p>
                                <p><Calendar size={14} /> Meets every {group.meeting_day}</p>
                            </div>
                            <div className="group-actions">
                                <button className="btn btn-sm">View Members</button>
                                <button className="btn btn-sm btn-secondary">Generate Report</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}