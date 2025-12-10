// src/components/GeneralManager/LoanManagement/LoanApproval.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

export default function LoanApproval() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPendingRequests();
    }, []);

    const loadPendingRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('group_loan_requests')
                .select(`
                    *,
                    group:groups(group_name, branch_id, branch:branches(name)),
                    allocations:group_loan_allocations(
                        *,
                        member:members(full_name, phone)
                    )
                `)
                .eq('status', 'PENDING')
                .order('date_requested', { ascending: true });
            
            if (error) throw error;
            setPendingRequests(data || []);
        } catch (error) {
            console.error('Error loading pending requests:', error);
        }
    };

    const approveGroupLoan = async (requestId, groupId) => {
        try {
            setLoading(true);
            
            // Check if group already has 2 active loans
            const { data: activeLoans, error: loansError } = await supabase
                .from('group_loans')
                .select('id')
                .eq('group_id', groupId)
                .eq('loan_status', 'ACTIVE');
            
            if (loansError) throw loansError;
            
            if (activeLoans.length >= 2) {
                alert('Group already has 2 active loans. Cannot approve new loan.');
                return;
            }
            
            // Get request details
            const { data: request, error: requestError } = await supabase
                .from('group_loan_requests')
                .select('*, allocations:group_loan_allocations(*)')
                .eq('id', requestId)
                .single();
            
            if (requestError) throw requestError;
            
            // Start transaction
            // 1. Create group loan
            const { data: groupLoan, error: loanError } = await supabase
                .from('group_loans')
                .insert({
                    request_id: requestId,
                    group_id: groupId,
                    principal: request.requested_amount,
                    loan_status: 'ACTIVE',
                    outstanding_balance: request.requested_amount,
                    allocation_order: (activeLoans.length || 0) + 1
                })
                .select()
                .single();
            
            if (loanError) throw loanError;
            
            // 2. Create individual member loans
            const memberLoans = await Promise.all(
                request.allocations.map(async (allocation) => {
                    const requestedAmount = parseFloat(allocation.amount_requested);
                    const interest = requestedAmount * 0.10;
                    const processingFee = 10000;
                    const savingsAddition = requestedAmount * 0.10;
                    const netCash = requestedAmount - interest - processingFee - savingsAddition;
                    
                    // Create member loan
                    const { data: memberLoan, error: mlError } = await supabase
                        .from('member_loans')
                        .insert({
                            member_id: allocation.member_id,
                            group_loan_id: groupLoan.id,
                            principal: requestedAmount,
                            interest_percent: 10,
                            interest_amount: interest,
                            processing_fee: processingFee,
                            opening_topup: savingsAddition,
                            net_cash_disbursed: netCash,
                            weeks_due: 10,
                            remaining_balance: requestedAmount,
                            loan_status: 'ACTIVE'
                        })
                        .select()
                        .single();
                    
                    if (mlError) throw mlError;
                    
                    // Update member savings
                    await supabase
                        .from('members')
                        .update({
                            total_shares: supabase.raw('total_shares + ?', [savingsAddition])
                        })
                        .eq('id', allocation.member_id);
                    
                    // Record processing fee
                    await supabase
                        .from('member_processing_fees')
                        .insert({
                            member_loan_id: memberLoan.id,
                            member_id: allocation.member_id,
                            amount: processingFee
                        });
                    
                    // Record interest
                    await supabase
                        .from('loan_interest_ledger')
                        .insert({
                            member_loan_id: memberLoan.id,
                            member_id: allocation.member_id,
                            group_loan_id: groupLoan.id,
                            interest_amount: interest
                        });
                    
                    return memberLoan;
                })
            );
            
            // 3. Update request status
            await supabase
                .from('group_loan_requests')
                .update({ status: 'APPROVED' })
                .eq('id', requestId);
            
            // 4. Update allocations status
            await supabase
                .from('group_loan_allocations')
                .update({ status: 'approved' })
                .eq('loan_request_id', requestId);
            
            alert('Loan approved successfully!');
            loadPendingRequests();
            
        } catch (error) {
            console.error('Error approving loan:', error);
            alert('Error approving loan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const rejectLoanRequest = async (requestId) => {
        try {
            await supabase
                .from('group_loan_requests')
                .update({ status: 'REJECTED' })
                .eq('id', requestId);
            
            await supabase
                .from('group_loan_allocations')
                .update({ status: 'rejected' })
                .eq('loan_request_id', requestId);
            
            alert('Loan request rejected');
            loadPendingRequests();
        } catch (error) {
            console.error('Error rejecting loan:', error);
            alert('Error rejecting loan');
        }
    };

    return (
        <div className="loan-approval">
            <h2>Loan Approval</h2>
            
            {pendingRequests.length === 0 ? (
                <p>No pending loan requests</p>
            ) : (
                <div className="requests-list">
                    {pendingRequests.map(request => (
                        <div key={request.id} className="request-card">
                            <div className="request-header">
                                <h4>{request.group?.group_name}</h4>
                                <span className="badge badge-warning">Pending</span>
                            </div>
                            
                            <div className="request-details">
                                <p><strong>Branch:</strong> {request.group?.branch?.name}</p>
                                <p><strong>Amount:</strong> {parseFloat(request.requested_amount).toLocaleString()} UGX</p>
                                <p><strong>Date:</strong> {new Date(request.date_requested).toLocaleDateString()}</p>
                                <p><strong>Members:</strong> {request.allocations.length}</p>
                            </div>
                            
                            <div className="member-list">
                                <h5>Member Requests:</h5>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Amount</th>
                                            <th>Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {request.allocations.map(allocation => (
                                            <tr key={allocation.id}>
                                                <td>{allocation.member?.full_name}</td>
                                                <td>{parseFloat(allocation.amount_requested).toLocaleString()}</td>
                                                <td>{allocation.member?.phone}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="request-actions">
                                <button 
                                    className="btn btn-success"
                                    onClick={() => approveGroupLoan(request.id, request.group_id)}
                                    disabled={loading}
                                >
                                    Approve Loan
                                </button>
                                <button 
                                    className="btn btn-danger"
                                    onClick={() => rejectLoanRequest(request.id)}
                                    disabled={loading}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}