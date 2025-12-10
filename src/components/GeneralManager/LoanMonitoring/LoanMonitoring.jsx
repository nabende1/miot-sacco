// src/components/GeneralManager/LoanMonitoring/LoanMonitoring.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

export default function LoanMonitoring() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groupDetails, setGroupDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupPerformance();
        }
    }, [selectedGroup]);

    const loadGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('id, group_name, branch_id, branch:branches(name)')
                .eq('is_active', true)
                .order('group_name');
            
            if (error) throw error;
            setGroups(data || []);
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    };

    const loadGroupPerformance = async () => {
        try {
            setLoading(true);
            
            // Get group loans
            const { data: groupLoans, error: loansError } = await supabase
                .from('group_loans')
                .select('*')
                .eq('group_id', selectedGroup)
                .order('allocation_order');
            
            if (loansError) throw loansError;
            
            // Get member loans
            const { data: memberLoans, error: memberLoansError } = await supabase
                .from('member_loans')
                .select(`
                    *,
                    member:members(full_name, total_shares, social_fund_balance)
                `)
                .eq('group_loan_id', groupLoans.map(loan => loan.id))
                .order('member_id');
            
            if (memberLoansError) throw memberLoansError;
            
            // Get group members
            const { data: members, error: membersError } = await supabase
                .from('members')
                .select(`
                    id, full_name, total_shares, social_fund_balance,
                    last_savings_date, savings_streak, performance_score,
                    loan_repayment_rate
                `)
                .eq('group_id', selectedGroup)
                .eq('status', 'ACTIVE');
            
            if (membersError) throw membersError;
            
            // Calculate group performance
            const totalMembers = members.length;
            const activeMembers = members.filter(m => 
                memberLoans.some(ml => ml.member_id === m.id && ml.loan_status === 'ACTIVE')
            ).length;
            
            const totalGroupLoan = groupLoans.reduce((sum, loan) => 
                sum + (parseFloat(loan.outstanding_balance) || 0), 0);
            
            const totalMemberLoan = memberLoans.reduce((sum, loan) => 
                sum + (parseFloat(loan.remaining_balance) || 0), 0);
            
            const totalMemberSavings = members.reduce((sum, member) => 
                sum + (parseFloat(member.total_shares) || 0), 0);
            
            const totalSocialFund = members.reduce((sum, member) => 
                sum + (parseFloat(member.social_fund_balance) || 0), 0);
            
            const avgRepaymentRate = members.length > 0 ? 
                members.reduce((sum, m) => sum + (parseFloat(m.loan_repayment_rate) || 0), 0) / members.length :
                0;
            
            setGroupDetails({
                groupLoans: groupLoans || [],
                memberLoans: memberLoans || [],
                members: members || [],
                totals: {
                    total_members: totalMembers,
                    active_members: activeMembers,
                    total_group_loan: totalGroupLoan,
                    total_member_loan: totalMemberLoan,
                    total_member_savings: totalMemberSavings,
                    total_social_fund: totalSocialFund,
                    avg_repayment_rate: avgRepaymentRate
                }
            });
            
        } catch (error) {
            console.error('Error loading group performance:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="loan-monitoring">
            <h2>Loan Monitoring Dashboard</h2>
            
            <div className="controls">
                <select 
                    value={selectedGroup} 
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    disabled={loading}
                >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.group_name} ({group.branch?.name})
                        </option>
                    ))}
                </select>
            </div>
            
            {loading ? (
                <p>Loading group data...</p>
            ) : groupDetails ? (
                <div className="monitoring-dashboard">
                    {/* Summary Cards */}
                    <div className="summary-cards">
                        <div className="card">
                            <h4>Group Loan Status</h4>
                            <p className="amount">{groupDetails.totals.total_group_loan.toLocaleString()} UGX</p>
                            <small>{groupDetails.groupLoans.length} active loan(s)</small>
                        </div>
                        
                        <div className="card">
                            <h4>Member Loans</h4>
                            <p className="amount">{groupDetails.totals.total_member_loan.toLocaleString()} UGX</p>
                            <small>{groupDetails.memberLoans.filter(ml => ml.loan_status === 'ACTIVE').length} active member loans</small>
                        </div>
                        
                        <div className="card">
                            <h4>Total Savings</h4>
                            <p className="amount">{groupDetails.totals.total_member_savings.toLocaleString()} UGX</p>
                            <small>From {groupDetails.totals.total_members} members</small>
                        </div>
                        
                        <div className="card">
                            <h4>Repayment Rate</h4>
                            <p className="amount">{Math.round(groupDetails.totals.avg_repayment_rate)}%</p>
                            <small>Average member repayment</small>
                        </div>
                    </div>
                    
                    {/* Group Loans Detail */}
                    <div className="section">
                        <h3>Group Loans</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Loan #</th>
                                    <th>Principal</th>
                                    <th>Outstanding</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupDetails.groupLoans.map((loan, index) => (
                                    <tr key={loan.id}>
                                        <td>Loan {index + 1}</td>
                                        <td>{parseFloat(loan.principal).toLocaleString()} UGX</td>
                                        <td>{parseFloat(loan.outstanding_balance).toLocaleString()} UGX</td>
                                        <td>
                                            <span className={`badge badge-${loan.loan_status === 'ACTIVE' ? 'success' : 'warning'}`}>
                                                {loan.loan_status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress"
                                                    style={{ 
                                                        width: `${Math.max(0, 100 - (loan.outstanding_balance / loan.principal * 100))}%` 
                                                    }}
                                                />
                                                <span>{Math.round(100 - (loan.outstanding_balance / loan.principal * 100))}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Member Loans Detail */}
                    <div className="section">
                        <h3>Member Loans</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Loan Amount</th>
                                    <th>Remaining</th>
                                    <th>Weeks Paid</th>
                                    <th>Status</th>
                                    <th>Savings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupDetails.memberLoans.map(loan => (
                                    <tr key={loan.id}>
                                        <td>{loan.member?.full_name}</td>
                                        <td>{parseFloat(loan.principal).toLocaleString()} UGX</td>
                                        <td>{parseFloat(loan.remaining_balance).toLocaleString()} UGX</td>
                                        <td>{loan.weeks_paid}/{loan.weeks_due}</td>
                                        <td>
                                            <span className={`badge badge-${loan.loan_status === 'ACTIVE' ? 'success' : 'warning'}`}>
                                                {loan.loan_status}
                                            </span>
                                        </td>
                                        <td>{parseFloat(loan.member?.total_shares || 0).toLocaleString()} UGX</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Member Performance */}
                    <div className="section">
                        <h3>Member Performance</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Total Savings</th>
                                    <th>Social Fund</th>
                                    <th>Repayment Rate</th>
                                    <th>Performance Score</th>
                                    <th>Last Savings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupDetails.members.map(member => (
                                    <tr key={member.id}>
                                        <td>{member.full_name}</td>
                                        <td>{parseFloat(member.total_shares).toLocaleString()} UGX</td>
                                        <td>{parseFloat(member.social_fund_balance).toLocaleString()} UGX</td>
                                        <td>
                                            <div className="progress-bar small">
                                                <div 
                                                    className="progress"
                                                    style={{ width: `${member.loan_repayment_rate}%` }}
                                                />
                                                <span>{Math.round(member.loan_repayment_rate)}%</span>
                                            </div>
                                        </td>
                                        <td>{Math.round(member.performance_score)}/100</td>
                                        <td>{member.last_savings_date || 'Never'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : selectedGroup ? (
                <p>No data available for this group</p>
            ) : (
                <p>Please select a group to view details</p>
            )}
        </div>
    );
}