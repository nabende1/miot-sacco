// src/components/Facilitator/WeeklyCollection.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { calculateWeeklyPayment, allocateGroupCollections } from '../../utils/loanCalculations';

export default function WeeklyCollection() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groupMembers, setGroupMembers] = useState([]);
    const [collections, setCollections] = useState([]);
    const [groupLoans, setGroupLoans] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadFacilitatorGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupDetails();
        }
    }, [selectedGroup]);

    const loadFacilitatorGroups = async () => {
        const user = await supabase.auth.getUser();
        if (!user.data.user) return;

        const { data, error } = await supabase
            .from('groups')
            .select('id, group_name, meeting_day')
            .eq('facilitator_id', user.data.user.id)
            .eq('is_active', true);

        if (error) throw error;
        setGroups(data || []);
    };

    const loadGroupDetails = async () => {
        try {
            // Load members
            const { data: members, error: membersError } = await supabase
                .from('members')
                .select(`
                    id, full_name, total_shares, social_fund_balance,
                    member_loans!left(
                        id, principal, remaining_balance, weeks_due, weeks_paid, loan_status
                    )
                `)
                .eq('group_id', selectedGroup)
                .eq('status', 'ACTIVE');

            if (membersError) throw membersError;

            // Load group loans
            const { data: loans, error: loansError } = await supabase
                .from('group_loans')
                .select('*')
                .eq('group_id', selectedGroup)
                .in('loan_status', ['ACTIVE', 'OVERDUE']);

            if (loansError) throw loansError;

            setGroupMembers(members || []);
            setGroupLoans(loans || []);

            // Initialize collections
            const initialCollections = (members || []).map(member => {
                const activeLoan = member.member_loans?.find(loan => 
                    loan.loan_status === 'ACTIVE' || loan.loan_status === 'OVERDUE'
                );
                
                const payment = activeLoan ? 
                    calculateWeeklyPayment(activeLoan, false) : 
                    { weekly_repayment: 0, fines: 0, total_payment: 0 };

                return {
                    member_id: member.id,
                    member_name: member.full_name,
                    has_loan: !!activeLoan,
                    loan_id: activeLoan?.id,
                    savings: '',
                    loan_repayment: payment.total_payment,
                    social_fund: '',
                    fines: payment.fines,
                    registration: '',
                    is_absent: false
                };
            });

            setCollections(initialCollections);
        } catch (error) {
            console.error('Error loading group details:', error);
        }
    };

    const updateCollection = (index, field, value) => {
        const updated = [...collections];
        
        if (field === 'is_absent') {
            updated[index][field] = value;
            
            // If absent, add auto fine
            if (value) {
                updated[index].fines = (parseFloat(updated[index].fines) || 0) + 1600;
            } else {
                // Remove auto fine if present
                updated[index].fines = Math.max(0, (parseFloat(updated[index].fines) || 0) - 1600);
            }
            
            // Recalculate loan repayment with fines
            if (updated[index].has_loan) {
                const member = groupMembers[index];
                const activeLoan = member.member_loans?.find(loan => 
                    loan.loan_status === 'ACTIVE' || loan.loan_status === 'OVERDUE'
                );
                
                if (activeLoan) {
                    const payment = calculateWeeklyPayment(activeLoan, value);
                    updated[index].loan_repayment = payment.total_payment;
                    updated[index].fines = payment.fines;
                }
            }
        } else {
            updated[index][field] = value;
        }
        
        setCollections(updated);
    };

    const calculateTotals = () => {
        return collections.reduce((totals, collection) => ({
            savings: totals.savings + (parseFloat(collection.savings) || 0),
            loan_repayments: totals.loan_repayments + (parseFloat(collection.loan_repayment) || 0),
            social_fund: totals.social_fund + (parseFloat(collection.social_fund) || 0),
            fines: totals.fines + (parseFloat(collection.fines) || 0),
            registration: totals.registration + (parseFloat(collection.registration) || 0)
        }), { savings: 0, loan_repayments: 0, social_fund: 0, fines: 0, registration: 0 });
    };

    const submitWeeklyCollection = async () => {
        try {
            setLoading(true);
            const user = await supabase.auth.getUser();
            if (!user.data.user) throw new Error('Not authenticated');

            const totals = calculateTotals();
            const totalCollections = Object.values(totals).reduce((a, b) => a + b, 0);

            // 1. Create daily submission
            const { data: submission, error: subError } = await supabase
                .from('daily_submissions')
                .insert({
                    group_id: selectedGroup,
                    facilitator_id: user.data.user.id,
                    submission_date: new Date().toISOString().split('T')[0],
                    total_collections: totalCollections,
                    total_savings: totals.savings,
                    total_loan_repayments: totals.loan_repayments,
                    total_social_fund: totals.social_fund,
                    total_fines: totals.fines,
                    total_registration: totals.registration,
                    attendance_count: collections.filter(c => !c.is_absent).length,
                    status: 'submitted'
                })
                .select()
                .single();

            if (subError) throw subError;

            // 2. Process individual collections
            await Promise.all(collections.map(async (collection) => {
                // Record savings
                if (parseFloat(collection.savings) > 0) {
                    await supabase
                        .from('member_savings')
                        .insert({
                            member_id: collection.member_id,
                            group_id: selectedGroup,
                            facilitator_id: user.data.user.id,
                            amount: parseFloat(collection.savings),
                            submission_id: submission.id,
                            savings_type: 'Regular',
                            transaction_date: new Date().toISOString().split('T')[0]
                        });

                    // Update member total shares
                    await supabase
                        .from('members')
                        .update({
                            total_shares: supabase.raw('total_shares + ?', [parseFloat(collection.savings)]),
                            last_savings_date: new Date().toISOString().split('T')[0]
                        })
                        .eq('id', collection.member_id);
                }

                // Record loan repayments
                if (parseFloat(collection.loan_repayment) > 0 && collection.loan_id) {
                    await supabase
                        .from('loan_repayments')
                        .insert({
                            member_loan_id: collection.loan_id,
                            member_id: collection.member_id,
                            group_id: selectedGroup,
                            amount_paid: parseFloat(collection.loan_repayment),
                            recorded_by: user.data.user.id
                        });

                    // Update member loan balance
                    await supabase
                        .from('member_loans')
                        .update({
                            remaining_balance: supabase.raw('remaining_balance - ?', [parseFloat(collection.loan_repayment)]),
                            weeks_paid: supabase.raw('weeks_paid + 1')
                        })
                        .eq('id', collection.loan_id);
                }

                // Record fines
                if (parseFloat(collection.fines) > 0) {
                    await supabase
                        .from('member_fines')
                        .insert({
                            member_id: collection.member_id,
                            amount: parseFloat(collection.fines),
                            reason: collection.is_absent ? 'Absent from meeting' : 'Late loan repayment',
                            fine_type: collection.is_absent ? 'absent' : 'other',
                            facilitator_id: user.data.user.id,
                            status: 'paid'
                        });
                }

                // Record social fund
                if (parseFloat(collection.social_fund) > 0) {
                    await supabase
                        .from('members')
                        .update({
                            social_fund_balance: supabase.raw('social_fund_balance + ?', [parseFloat(collection.social_fund)])
                        })
                        .eq('id', collection.member_id);
                }

                // Record attendance
                await supabase
                    .from('member_attendance')
                    .insert({
                        member_id: collection.member_id,
                        group_id: selectedGroup,
                        attendance_date: new Date().toISOString().split('T')[0],
                        status: collection.is_absent ? 'absent' : 'present',
                        recorded_by: user.data.user.id
                    });
            }));

            // 3. Allocate group collections to group loans
            const groupCollections = {
                total: totals.savings + totals.loan_repayments + totals.social_fund + totals.fines,
                savings: totals.savings,
                loan_repayments: totals.loan_repayments,
                social_fund: totals.social_fund,
                fines: totals.fines
            };

            const allocation = allocateGroupCollections(groupCollections, groupLoans);

            // Record allocation
            await supabase
                .from('group_allocation_log')
                .insert({
                    group_id: selectedGroup,
                    allocation_date: new Date().toISOString().split('T')[0],
                    total_collected: groupCollections.total,
                    loan1_id: groupLoans[0]?.id,
                    loan1_amount: groupLoans[0] ? 
                        Math.min(groupCollections.total, groupLoans[0].remaining_balance) : 0,
                    loan2_id: groupLoans[1]?.id,
                    loan2_amount: groupLoans[1] ? 
                        Math.min(
                            Math.max(0, groupCollections.total - (groupLoans[0]?.remaining_balance || 0)),
                            groupLoans[1].remaining_balance
                        ) : 0,
                    to_savings: allocation.to_savings,
                    allocated_by: user.data.user.id
                });

            // Update group loan balances
            await Promise.all(groupLoans.map(async (loan, index) => {
                const paymentAmount = index === 0 ? 
                    Math.min(groupCollections.total, loan.remaining_balance) :
                    Math.min(
                        Math.max(0, groupCollections.total - (groupLoans[0]?.remaining_balance || 0)),
                        loan.remaining_balance
                    );

                if (paymentAmount > 0) {
                    await supabase
                        .from('group_loans')
                        .update({
                            outstanding_balance: supabase.raw('outstanding_balance - ?', [paymentAmount])
                        })
                        .eq('id', loan.id);
                }
            }));

            alert('Weekly collection submitted successfully!');
            
            // Reset form
            setCollections([]);
            setSelectedGroup('');
            
        } catch (error) {
            console.error('Error submitting collection:', error);
            alert('Error submitting collection: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const totals = calculateTotals();

    return (
        <div className="weekly-collection">
            <h2>Weekly Collection</h2>
            
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
                            {group.group_name} ({group.meeting_day})
                        </option>
                    ))}
                </select>
            </div>
            
            {selectedGroup && (
                <>
                    <div className="collections-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Absent</th>
                                    <th>Savings</th>
                                    <th>Loan Repayment</th>
                                    <th>Social Fund</th>
                                    <th>Fines</th>
                                    <th>Registration</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collections.map((collection, index) => (
                                    <tr key={collection.member_id}>
                                        <td>{collection.member_name}</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={collection.is_absent}
                                                onChange={(e) => updateCollection(index, 'is_absent', e.target.checked)}
                                                disabled={loading}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={collection.savings}
                                                onChange={(e) => updateCollection(index, 'savings', e.target.value)}
                                                disabled={loading || collection.is_absent}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={collection.loan_repayment}
                                                readOnly
                                                className="read-only"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={collection.social_fund}
                                                onChange={(e) => updateCollection(index, 'social_fund', e.target.value)}
                                                disabled={loading || collection.is_absent}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={collection.fines}
                                                readOnly
                                                className="read-only"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={collection.registration}
                                                onChange={(e) => updateCollection(index, 'registration', e.target.value)}
                                                disabled={loading || collection.is_absent}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            {(
                                                (parseFloat(collection.savings) || 0) +
                                                (parseFloat(collection.loan_repayment) || 0) +
                                                (parseFloat(collection.social_fund) || 0) +
                                                (parseFloat(collection.fines) || 0) +
                                                (parseFloat(collection.registration) || 0)
                                            ).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="totals-row">
                                    <td colSpan="2"><strong>Totals:</strong></td>
                                    <td><strong>{totals.savings.toLocaleString()}</strong></td>
                                    <td><strong>{totals.loan_repayments.toLocaleString()}</strong></td>
                                    <td><strong>{totals.social_fund.toLocaleString()}</strong></td>
                                    <td><strong>{totals.fines.toLocaleString()}</strong></td>
                                    <td><strong>{totals.registration.toLocaleString()}</strong></td>
                                    <td><strong>{
                                        (totals.savings + totals.loan_repayments + 
                                         totals.social_fund + totals.fines + totals.registration).toLocaleString()
                                    }</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div className="allocation-preview">
                        <h4>Group Loan Allocation Preview</h4>
                        {groupLoans.length > 0 ? (
                            <div className="allocation-details">
                                <p><strong>Active Group Loans:</strong> {groupLoans.length}</p>
                                <p><strong>Total Collections for Allocation:</strong> {
                                    (totals.savings + totals.loan_repayments + totals.social_fund + totals.fines).toLocaleString()
                                } UGX</p>
                                
                                <div className="loan-breakdown">
                                    {groupLoans.map((loan, index) => (
                                        <div key={loan.id} className="loan-item">
                                            <p>Loan {index + 1}: {loan.remaining_balance.toLocaleString()} UGX remaining</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p>No active group loans. All collections will go to group savings.</p>
                        )}
                    </div>
                    
                    <button 
                        className="btn btn-primary btn-lg"
                        onClick={submitWeeklyCollection}
                        disabled={loading || collections.length === 0}
                    >
                        {loading ? 'Submitting...' : 'Submit Weekly Collection'}
                    </button>
                </>
            )}
        </div>
    );
}