// src/components/GeneralManager/LoanManagement/GroupLoanRequest.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { calculateGroupLoan } from '../../../utils/loanCalculations';

export default function GroupLoanRequest() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groupMembers, setGroupMembers] = useState([]);
    const [memberRequests, setMemberRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [calculation, setCalculation] = useState(null);

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupMembers();
        }
    }, [selectedGroup]);

    const loadGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('id, group_name, branch_id')
                .eq('is_active', true);
            
            if (error) throw error;
            setGroups(data || []);
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    };

    const loadGroupMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('id, full_name, total_shares, existing_loan_id')
                .eq('group_id', selectedGroup)
                .eq('status', 'ACTIVE');
            
            if (error) throw error;
            
            const membersWithLoans = await Promise.all(
                (data || []).map(async (member) => {
                    const { data: existingLoan } = await supabase
                        .from('member_loans')
                        .select('id, loan_status')
                        .eq('member_id', member.id)
                        .in('loan_status', ['ACTIVE', 'OVERDUE'])
                        .single();
                    
                    return {
                        ...member,
                        has_active_loan: !!existingLoan,
                        existing_loan_id: existingLoan?.id
                    };
                })
            );
            
            setGroupMembers(membersWithLoans);
            
            // Initialize member requests
            const initialRequests = membersWithLoans.map(member => ({
                member_id: member.id,
                member_name: member.full_name,
                requested_amount: '',
                has_active_loan: member.has_active_loan,
                can_request: !member.has_active_loan
            }));
            
            setMemberRequests(initialRequests);
        } catch (error) {
            console.error('Error loading group members:', error);
        }
    };

    const updateMemberRequest = (index, amount) => {
        const updated = [...memberRequests];
        updated[index].requested_amount = amount;
        setMemberRequests(updated);
        
        // Calculate totals
        const validRequests = updated.filter(r => 
            r.can_request && parseFloat(r.requested_amount) > 0
        );
        
        if (validRequests.length > 0) {
            const calc = calculateGroupLoan(validRequests);
            setCalculation(calc);
        } else {
            setCalculation(null);
        }
    };

    const submitGroupLoanRequest = async () => {
        try {
            setLoading(true);
            
            // 1. Create group loan request
            const { data: groupRequest, error: requestError } = await supabase
                .from('group_loan_requests')
                .insert({
                    group_id: selectedGroup,
                    requested_amount: calculation.total_requested,
                    status: 'PENDING',
                    notes: `Group loan request for ${groups.find(g => g.id === selectedGroup)?.group_name}`
                })
                .select()
                .single();
            
            if (requestError) throw requestError;
            
            // 2. Create member loan allocations
            const memberAllocations = calculation.member_calculations.map(member => ({
                loan_request_id: groupRequest.id,
                member_id: member.member_id,
                amount_requested: member.requested_amount,
                amount_approved: member.requested_amount,
                status: 'pending'
            }));
            
            const { error: allocationError } = await supabase
                .from('group_loan_allocations')
                .insert(memberAllocations);
            
            if (allocationError) throw allocationError;
            
            alert('Group loan request submitted successfully!');
            
            // Reset form
            setMemberRequests([]);
            setCalculation(null);
            setSelectedGroup('');
            
        } catch (error) {
            console.error('Error submitting loan request:', error);
            alert('Error submitting loan request: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group-loan-request">
            <h2>Group Loan Request</h2>
            
            <div className="form-group">
                <label>Select Group</label>
                <select 
                    value={selectedGroup} 
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    disabled={loading}
                >
                    <option value="">Select a group</option>
                    {groups.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.group_name}
                        </option>
                    ))}
                </select>
            </div>
            
            {selectedGroup && (
                <div className="member-requests">
                    <h3>Member Loan Requests</h3>
                    <p>Each member can request one loan at a time</p>
                    
                    <div className="requests-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member Name</th>
                                    <th>Current Loan Status</th>
                                    <th>Loan Amount Requested (UGX)</th>
                                    <th>Eligibility</th>
                                </tr>
                            </thead>
                            <tbody>
                                {memberRequests.map((member, index) => (
                                    <tr key={member.member_id}>
                                        <td>{member.member_name}</td>
                                        <td>
                                            {member.has_active_loan ? 
                                                <span className="badge badge-danger">Has Active Loan</span> : 
                                                <span className="badge badge-success">Eligible</span>
                                            }
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={member.requested_amount}
                                                onChange={(e) => updateMemberRequest(index, e.target.value)}
                                                disabled={member.has_active_loan || loading}
                                                placeholder="Enter amount"
                                            />
                                        </td>
                                        <td>
                                            {member.has_active_loan ? 'Not Eligible' : 'Eligible'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {calculation && (
                        <div className="calculation-summary">
                            <h4>Loan Calculation Summary</h4>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <span>Total Requested:</span>
                                    <strong>{calculation.total_requested.toLocaleString()} UGX</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Total Interest (10%):</span>
                                    <strong>{calculation.total_interest.toLocaleString()} UGX</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Total Processing Fees:</span>
                                    <strong>{calculation.total_processing_fees.toLocaleString()} UGX</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Total to Member Savings (10%):</span>
                                    <strong>{calculation.total_savings_addition.toLocaleString()} UGX</strong>
                                </div>
                                <div className="summary-item total">
                                    <span>Actual Loan Amount:</span>
                                    <strong>{calculation.total_actual_loan.toLocaleString()} UGX</strong>
                                </div>
                            </div>
                            
                            <div className="member-breakdown">
                                <h5>Member Breakdown</h5>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Member</th>
                                            <th>Requested</th>
                                            <th>Interest</th>
                                            <th>Processing Fee</th>
                                            <th>To Savings</th>
                                            <th>Actual Loan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calculation.member_calculations.map((member, index) => (
                                            <tr key={index}>
                                                <td>{member.member_name}</td>
                                                <td>{member.requested_amount.toLocaleString()}</td>
                                                <td>{member.interest_amount.toLocaleString()}</td>
                                                <td>{member.processing_fee.toLocaleString()}</td>
                                                <td>{member.savings_addition.toLocaleString()}</td>
                                                <td>{member.actual_loan.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <button 
                                className="btn btn-primary"
                                onClick={submitGroupLoanRequest}
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Submit Group Loan Request'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}