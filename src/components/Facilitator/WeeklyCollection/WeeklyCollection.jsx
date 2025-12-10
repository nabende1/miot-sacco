import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { calculateWeeklyPayment, allocateGroupCollections } from '../../../utils/loanCalculations';
import '../../../styles/pages/Facilitator/WeeklyCollection.css';

export default function WeeklyCollection() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groupMembers, setGroupMembers] = useState([]);
    const [collections, setCollections] = useState([]);
    const [groupLoans, setGroupLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadFacilitatorGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupDetails();
        }
    }, [selectedGroup, selectedDate]);

    const loadFacilitatorGroups = async () => {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw userError || new Error('No user found');

            const { data, error } = await supabase
                .from('groups')
                .select('id, group_name, meeting_day, meeting_time, meeting_location')
                .eq('facilitator_id', user.id)
                .eq('is_active', true)
                .order('group_name');

            if (error) throw error;
            setGroups(data || []);
            
        } catch (error) {
            console.error('Error loading facilitator groups:', error);
            alert('Error loading groups: ' + error.message);
        }
    };

    const loadGroupDetails = async () => {
        try {
            setLoading(true);
            
            // Load members
            const { data: members, error: membersError } = await supabase
                .from('members')
                .select(`
                    id, 
                    full_name, 
                    total_shares, 
                    social_fund_balance,
                    member_loans!left(id, principal, remaining_balance, weeks_due, weeks_paid, loan_status)
                `)
                .eq('group_id', selectedGroup)
                .eq('status', 'ACTIVE')
                .order('full_name');

            if (membersError) throw membersError;

            // Load group loans
            const { data: loans, error: loansError } = await supabase
                .from('group_loans')
                .select('id, principal, outstanding_balance, loan_status')
                .eq('group_id', selectedGroup)
                .in('loan_status', ['ACTIVE', 'OVERDUE']);

            if (loansError) throw loansError;

            setGroupMembers(members || []);
            setGroupLoans(loans || []);

            // Initialize collections with today's data
            const today = new Date().toISOString().split('T')[0];
            const { data: todayTransactions } = await supabase
                .from('weekly_transactions')
                .select('member_id, shares_value, loan_repayment')
                .eq('group_id', selectedGroup)
                .eq('transaction_date', today);

            const initialCollections = (members || []).map(member => {
                const todayTransaction = todayTransactions?.find(tx => tx.member_id === member.id);
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
                    savings: todayTransaction?.shares_value || '',
                    loan_repayment: payment.total_payment,
                    social_fund: '',
                    fines: payment.fines,
                    registration: '',
                    is_absent: false,
                    notes: ''
                };
            });

            setCollections(initialCollections);
            
        } catch (error) {
            console.error('Error loading group details:', error);
            alert('Error loading group details: ' + error.message);
        } finally {
            setLoading(false);
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
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw userError || new Error('Not authenticated');

            const totals = calculateTotals();
            const totalCollections = Object.values(totals).reduce((a, b) => a + b, 0);

            // Get group name for logging
            const selectedGroupData = groups.find(g => g.id === selectedGroup);
            const groupName = selectedGroupData?.group_name || 'Unknown Group';

            // 1. Create daily submission
            const { data: submission, error: subError } = await supabase
                .from('daily_submissions')
                .insert({
                    group_id: selectedGroup,
                    facilitator_id: user.id,
                    submission_date: selectedDate,
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
                const transactionDate = selectedDate;
                
                // Record savings
                if (parseFloat(collection.savings) > 0) {
                    await supabase
                        .from('member_savings')
                        .insert({
                            member_id: collection.member_id,
                            group_id: selectedGroup,
                            facilitator_id: user.id,
                            amount: parseFloat(collection.savings),
                            submission_id: submission.id,
                            savings_type: 'Regular',
                            transaction_date: transactionDate
                        });

                    // Update member total shares
                    await supabase
                        .from('members')
                        .update({
                            total_shares: supabase.raw('total_shares + ?', [parseFloat(collection.savings)]),
                            last_savings_date: transactionDate,
                            savings_streak: supabase.raw('CASE WHEN last_savings_date = ? THEN savings_streak + 1 ELSE 1 END', 
                                [new Date(new Date(transactionDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]])
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
                            payment_date: transactionDate,
                            recorded_by: user.id,
                            notes: collection.notes || 'Weekly repayment'
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
                            facilitator_id: user.id,
                            imposed_date: transactionDate,
                            status: 'paid'
                        });
                }

                // Record attendance
                await supabase
                    .from('member_attendance')
                    .insert({
                        member_id: collection.member_id,
                        group_id: selectedGroup,
                        attendance_date: transactionDate,
                        status: collection.is_absent ? 'absent' : 'present',
                        recorded_by: user.id
                    });

                // Record weekly transaction for reporting
                await supabase
                    .from('weekly_transactions')
                    .upsert({
                        group_id: selectedGroup,
                        member_id: collection.member_id,
                        transaction_date: transactionDate,
                        shares_value: parseFloat(collection.savings) || 0,
                        loan_repayment: parseFloat(collection.loan_repayment) || 0,
                        social_fund: parseFloat(collection.social_fund) || 0,
                        auto_fine_applied: collection.is_absent ? 1600 : 0,
                        fines_paid: parseFloat(collection.fines) || 0,
                        attendance_status: collection.is_absent ? 'absent' : 'present',
                        recorded_by: user.id
                    }, {
                        onConflict: 'group_id,member_id,transaction_date'
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
                    allocation_date: selectedDate,
                    total_collected: groupCollections.total,
                    loan1_id: groupLoans[0]?.id,
                    loan1_amount: groupLoans[0] ? 
                        Math.min(groupCollections.total, groupLoans[0].outstanding_balance) : 0,
                    loan2_id: groupLoans[1]?.id,
                    loan2_amount: groupLoans[1] ? 
                        Math.min(
                            Math.max(0, groupCollections.total - (groupLoans[0]?.outstanding_balance || 0)),
                            groupLoans[1].outstanding_balance
                        ) : 0,
                    to_savings: allocation.to_savings,
                    allocated_by: user.id
                });

            // Update group loan balances
            await Promise.all(groupLoans.map(async (loan, index) => {
                const paymentAmount = index === 0 ? 
                    Math.min(groupCollections.total, loan.outstanding_balance) :
                    Math.min(
                        Math.max(0, groupCollections.total - (groupLoans[0]?.outstanding_balance || 0)),
                        loan.outstanding_balance
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

            // 4. Calculate facilitator commission for this collection
            const totalProcessingFees = collections.filter(c => c.has_loan).length * 10000;
            const facilitatorCommission = totalProcessingFees * 0.01; // 1% of processing fees

            if (facilitatorCommission > 0) {
                await supabase
                    .from('facilitator_commissions')
                    .insert({
                        facilitator_id: user.id,
                        group_id: selectedGroup,
                        commission_type: 'collection',
                        amount: facilitatorCommission,
                        date_recorded: selectedDate,
                        notes: `Commission from ${groupName} collection on ${selectedDate}`
                    });
            }

            alert(`Weekly collection for ${groupName} submitted successfully!\n\n` +
                  `Total Collected: ${formatCurrency(totalCollections)}\n` +
                  `Commission Earned: ${formatCurrency(facilitatorCommission)}`);

            // Reset form
            setCollections([]);
            loadGroupDetails(); // Reload to get updated data
            
        } catch (error) {
            console.error('Error submitting collection:', error);
            alert('Error submitting collection: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const totals = calculateTotals();

    return (
        <div className="weekly-collection">
            <div className="page-header">
                <h1>Weekly Collection</h1>
                <p>Record savings, loan repayments, and attendance for your groups</p>
            </div>

            {/* Group Selection and Date */}
            <div className="collection-controls">
                <div className="form-group">
                    <label>Select Group</label>
                    <select 
                        value={selectedGroup} 
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        disabled={loading}
                        className="form-control"
                    >
                        <option value="">Select a group</option>
                        {groups.map(group => (
                            <option key={group.id} value={group.id}>
                                {group.group_name} ({group.meeting_day}s at {group.meeting_time})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Collection Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="form-control"
                        disabled={loading}
                    />
                </div>
            </div>

            {selectedGroup && (
                <>
                    {/* Collection Summary */}
                    <div className="collection-summary">
                        <h3>Collection Summary</h3>
                        <div className="summary-stats">
                            <div className="summary-stat">
                                <span>Total Members:</span>
                                <strong>{groupMembers.length}</strong>
                            </div>
                            <div className="summary-stat">
                                <span>Active Loans:</span>
                                <strong>{groupLoans.length}</strong>
                            </div>
                            <div className="summary-stat">
                                <span>Expected Collection:</span>
                                <strong>{formatCurrency(groupMembers.length * 2000)}</strong>
                            </div>
                            <div className="summary-stat">
                                <span>Total Collected:</span>
                                <strong>{formatCurrency(totals.savings + totals.loan_repayments)}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Collections Table */}
                    <div className="collections-table-section">
                        <div className="section-header">
                            <h3>Member Collections</h3>
                            <div className="table-info">
                                <span>{groupMembers.length} members</span>
                            </div>
                        </div>
                        
                        <div className="collections-table-container">
                            <table className="collections-table">
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Absent</th>
                                        <th>Savings (UGX)</th>
                                        <th>Loan Repayment (UGX)</th>
                                        <th>Fines (UGX)</th>
                                        <th>Social Fund (UGX)</th>
                                        <th>Registration (UGX)</th>
                                        <th>Total (UGX)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {collections.map((collection, index) => (
                                        <tr key={collection.member_id}>
                                            <td className="member-name">
                                                <strong>{collection.member_name}</strong>
                                                {collection.has_loan && (
                                                    <small className="loan-indicator">Has Loan</small>
                                                )}
                                            </td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={collection.is_absent}
                                                    onChange={(e) => updateCollection(index, 'is_absent', e.target.checked)}
                                                    disabled={loading}
                                                    className="absent-checkbox"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={collection.savings}
                                                    onChange={(e) => updateCollection(index, 'savings', e.target.value)}
                                                    disabled={loading || collection.is_absent}
                                                    className="amount-input"
                                                    placeholder="0"
                                                    min="0"
                                                    step="100"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={collection.loan_repayment}
                                                    onChange={(e) => updateCollection(index, 'loan_repayment', e.target.value)}
                                                    disabled={loading || collection.is_absent || !collection.has_loan}
                                                    className="amount-input"
                                                    placeholder={collection.has_loan ? "0" : "No Loan"}
                                                    min="0"
                                                    step="100"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={collection.fines}
                                                    readOnly
                                                    className="read-only-input"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={collection.social_fund}
                                                    onChange={(e) => updateCollection(index, 'social_fund', e.target.value)}
                                                    disabled={loading || collection.is_absent}
                                                    className="amount-input"
                                                    placeholder="0"
                                                    min="0"
                                                    step="100"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={collection.registration}
                                                    onChange={(e) => updateCollection(index, 'registration', e.target.value)}
                                                    disabled={loading || collection.is_absent}
                                                    className="amount-input"
                                                    placeholder="0"
                                                    min="0"
                                                    step="100"
                                                />
                                            </td>
                                            <td className="total-column">
                                                {formatCurrency(
                                                    (parseFloat(collection.savings) || 0) +
                                                    (parseFloat(collection.loan_repayment) || 0) +
                                                    (parseFloat(collection.fines) || 0) +
                                                    (parseFloat(collection.social_fund) || 0) +
                                                    (parseFloat(collection.registration) || 0)
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="totals-row">
                                        <td colSpan="2"><strong>Totals:</strong></td>
                                        <td><strong>{formatCurrency(totals.savings)}</strong></td>
                                        <td><strong>{formatCurrency(totals.loan_repayments)}</strong></td>
                                        <td><strong>{formatCurrency(totals.fines)}</strong></td>
                                        <td><strong>{formatCurrency(totals.social_fund)}</strong></td>
                                        <td><strong>{formatCurrency(totals.registration)}</strong></td>
                                        <td><strong>{formatCurrency(
                                            totals.savings + totals.loan_repayments + 
                                            totals.fines + totals.social_fund + totals.registration
                                        )}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Group Loan Allocation Preview */}
                    {groupLoans.length > 0 && (
                        <div className="allocation-preview">
                            <div className="section-header">
                                <h3>Group Loan Allocation Preview</h3>
                            </div>
                            
                            <div className="allocation-details">
                                <div className="allocation-summary">
                                    <p>
                                        <strong>Total for Allocation:</strong> {
                                            formatCurrency(totals.savings + totals.loan_repayments + totals.social_fund + totals.fines)
                                        }
                                    </p>
                                    <p>
                                        <strong>Active Group Loans:</strong> {groupLoans.length}
                                    </p>
                                </div>
                                
                                <div className="loan-allocation-breakdown">
                                    {groupLoans.map((loan, index) => {
                                        const isFirst = index === 0;
                                        const maxPayment = isFirst ? 
                                            Math.min(totals.savings + totals.loan_repayments + totals.social_fund + totals.fines, loan.outstanding_balance) :
                                            Math.min(
                                                Math.max(0, (totals.savings + totals.loan_repayments + totals.social_fund + totals.fines) - 
                                                       (groupLoans[0]?.outstanding_balance || 0)),
                                                loan.outstanding_balance
                                            );
                                        
                                        return (
                                            <div key={loan.id} className="loan-allocation-item">
                                                <div className="loan-header">
                                                    <h4>Group Loan #{index + 1}</h4>
                                                    <span className={`status-badge ${loan.loan_status === 'ACTIVE' ? 'active' : 'overdue'}`}>
                                                        {loan.loan_status}
                                                    </span>
                                                </div>
                                                <div className="loan-details">
                                                    <div className="loan-stat">
                                                        <span>Original:</span>
                                                        <strong>{formatCurrency(loan.principal)}</strong>
                                                    </div>
                                                    <div className="loan-stat">
                                                        <span>Outstanding:</span>
                                                        <strong>{formatCurrency(loan.outstanding_balance)}</strong>
                                                    </div>
                                                    <div className="loan-stat">
                                                        <span>This Allocation:</span>
                                                        <strong>{formatCurrency(maxPayment)}</strong>
                                                    </div>
                                                    <div className="progress-bar">
                                                        <div 
                                                            className="progress-fill"
                                                            style={{ 
                                                                width: `${Math.min(100, ((loan.principal - loan.outstanding_balance) / loan.principal) * 100)}%` 
                                                            }}
                                                        ></div>
                                                        <span className="progress-text">
                                                            {Math.round(((loan.principal - loan.outstanding_balance) / loan.principal) * 100)}% Paid
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Collection Notes */}
                    <div className="collection-notes">
                        <div className="form-group">
                            <label>Additional Notes (Optional)</label>
                            <textarea
                                className="form-control"
                                placeholder="Add any additional notes about today's collection..."
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="submit-section">
                        <button 
                            className="btn btn-primary btn-lg"
                            onClick={submitWeeklyCollection}
                            disabled={loading || collections.length === 0}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="loading-spinner" size={18} />
                                    Submitting Collection...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Submit Weekly Collection
                                </>
                            )}
                        </button>
                        
                        <div className="submit-info">
                            <p className="info-text">
                                <Info size={14} />
                                This will record all transactions, update member balances, and calculate commissions.
                            </p>
                        </div>
                    </div>
                </>
            )}

            {!selectedGroup && groups.length > 0 && (
                <div className="no-group-selected">
                    <Building2 size={48} />
                    <h3>Select a Group</h3>
                    <p>Please select a group from the dropdown above to start recording collections.</p>
                </div>
            )}

            {!selectedGroup && groups.length === 0 && (
                <div className="no-groups">
                    <Building2 size={48} />
                    <h3>No Groups Assigned</h3>
                    <p>You don't have any active groups assigned to you yet.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => window.location.hash = 'create-group'}
                    >
                        <Plus size={18} />
                        Create Your First Group
                    </button>
                </div>
            )}
        </div>
    );
}