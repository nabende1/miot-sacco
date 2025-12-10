// src/components/GeneralManager/DailyOperations/DailyOperations.jsx
import { useState, useEffect } from 'react';
import { 
    Calendar, DollarSign, TrendingUp, TrendingDown, 
    Users, CreditCard, AlertCircle, CheckCircle, 
    FileText, Download, Filter, RefreshCw, Search,
    Eye, Printer, Plus, Minus, BarChart3, TrendingUp as ChartUp,
    TrendingDown as ChartDown, Clock, Building2, Wallet,
    ArrowUpRight, ArrowDownRight, Percent, Banknote,
    CheckCircle2, XCircle, Clock as ClockIcon, Target
} from 'lucide-react';
import supabase from '../../../supabaseClient';
import './DailyOperations.css';

export default function DailyOperations() {
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateRange, setDateRange] = useState('today');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Daily Summary Data
    const [dailySummary, setDailySummary] = useState({
        totalSavings: 0,
        totalRepayments: 0,
        totalNewLoans: 0,
        totalProcessingFees: 0,
        totalFines: 0,
        totalSocialFund: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        cashIn: 0,
        cashOut: 0,
        previousDayComparison: {
            savings: 0,
            repayments: 0,
            loans: 0,
            netCash: 0
        }
    });
    
    // Transactions Data
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [transactionFilter, setTransactionFilter] = useState('all');
    
    // Branch Breakdown
    const [branchBreakdown, setBranchBreakdown] = useState([]);
    
    // Cash Flow Chart Data
    const [cashFlowData, setCashFlowData] = useState([]);
    
    // Pending Approvals
    const [pendingApprovals, setPendingApprovals] = useState({
        loans: [],
        expenses: [],
        adjustments: []
    });
    
    // Daily Targets vs Actuals
    const [dailyTargets, setDailyTargets] = useState({
        savings: { target: 5000000, actual: 0, variance: 0 },
        repayments: { target: 3000000, actual: 0, variance: 0 },
        newMembers: { target: 10, actual: 0, variance: 0 },
        groups: { target: 5, actual: 0, variance: 0 }
    });

    // Load data on component mount and date change
    useEffect(() => {
        loadDailyOperations();
    }, [selectedDate, dateRange]);

    // Filter transactions when search term or filter changes
    useEffect(() => {
        filterTransactions();
    }, [transactions, searchTerm, transactionFilter]);

    const loadDailyOperations = async () => {
        try {
            setLoading(true);
            
            await Promise.all([
                loadDailySummary(),
                loadTransactions(),
                loadBranchBreakdown(),
                loadCashFlowData(),
                loadPendingApprovals(),
                loadDailyTargets()
            ]);
            
        } catch (error) {
            console.error('Error loading daily operations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDailySummary = async () => {
        try {
            const date = new Date(selectedDate);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // Previous day for comparison
            const previousDay = new Date(date);
            previousDay.setDate(previousDay.getDate() - 1);
            const startOfPreviousDay = new Date(previousDay);
            startOfPreviousDay.setHours(0, 0, 0, 0);

            const [
                { data: savingsData },
                { data: repaymentData },
                { data: loanData },
                { data: feesData },
                { data: finesData },
                { data: socialFundData },
                { data: expensesData },
                { data: previousDaySavings },
                { data: previousDayRepayments },
                { data: previousDayLoans },
                { data: cashFlowData }
            ] = await Promise.all([
                // Today's data
                supabase.from('member_savings')
                    .select('amount')
                    .gte('created_at', startOfDay.toISOString())
                    .lt('created_at', endOfDay.toISOString()),
                
                supabase.from('loan_repayments')
                    .select('amount_paid')
                    .gte('payment_date', startOfDay.toISOString())
                    .lt('payment_date', endOfDay.toISOString()),
                
                supabase.from('member_loans')
                    .select('principal, processing_fee')
                    .gte('issued_date', startOfDay.toISOString())
                    .lt('issued_date', endOfDay.toISOString())
                    .eq('loan_status', 'ACTIVE'),
                
                supabase.from('member_processing_fees')
                    .select('amount')
                    .gte('date_recorded', startOfDay.toISOString())
                    .lt('date_recorded', endOfDay.toISOString()),
                
                supabase.from('member_fines')
                    .select('amount')
                    .eq('imposed_date', selectedDate)
                    .eq('status', 'paid'),
                
                supabase.from('daily_submissions')
                    .select('total_social_fund')
                    .eq('submission_date', selectedDate),
                
                supabase.from('expenses')
                    .select('amount')
                    .gte('expense_date', startOfDay.toISOString())
                    .lt('expense_date', endOfDay.toISOString()),
                
                // Previous day data for comparison
                supabase.from('member_savings')
                    .select('amount')
                    .gte('created_at', startOfPreviousDay.toISOString())
                    .lt('created_at', startOfDay.toISOString()),
                
                supabase.from('loan_repayments')
                    .select('amount_paid')
                    .gte('payment_date', startOfPreviousDay.toISOString())
                    .lt('payment_date', startOfDay.toISOString()),
                
                supabase.from('member_loans')
                    .select('principal')
                    .gte('issued_date', startOfPreviousDay.toISOString())
                    .lt('issued_date', startOfDay.toISOString())
                    .eq('loan_status', 'ACTIVE'),
                
                supabase.from('branch_profit_ledger')
                    .select('amount, transaction_type')
                    .eq('date_recorded', selectedDate)
            ]);

            const totalSavings = savingsData?.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0) || 0;
            const totalRepayments = repaymentData?.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0) || 0;
            const totalNewLoans = loanData?.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0) || 0;
            const totalProcessingFees = loanData?.reduce((sum, l) => sum + (parseFloat(l.processing_fee) || 0), 0) || 0;
            const additionalFees = feesData?.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) || 0;
            const totalFines = finesData?.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) || 0;
            const totalSocialFund = socialFundData?.reduce((sum, s) => sum + (parseFloat(s.total_social_fund) || 0), 0) || 0;
            const totalExpenses = expensesData?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;

            const previousDaySavingsTotal = previousDaySavings?.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0) || 0;
            const previousDayRepaymentsTotal = previousDayRepayments?.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0) || 0;
            const previousDayLoansTotal = previousDayLoans?.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0) || 0;

            const cashIn = totalSavings + totalRepayments + totalProcessingFees + additionalFees + totalFines;
            const cashOut = totalExpenses + totalNewLoans;
            const netCashFlow = cashIn - cashOut;

            const previousDayNetCash = (previousDaySavingsTotal + previousDayRepaymentsTotal) - previousDayLoansTotal;

            setDailySummary({
                totalSavings,
                totalRepayments,
                totalNewLoans,
                totalProcessingFees: totalProcessingFees + additionalFees,
                totalFines,
                totalSocialFund,
                totalExpenses,
                netCashFlow,
                cashIn,
                cashOut,
                previousDayComparison: {
                    savings: calculatePercentageChange(previousDaySavingsTotal, totalSavings),
                    repayments: calculatePercentageChange(previousDayRepaymentsTotal, totalRepayments),
                    loans: calculatePercentageChange(previousDayLoansTotal, totalNewLoans),
                    netCash: calculatePercentageChange(previousDayNetCash, netCashFlow)
                }
            });

        } catch (error) {
            console.error('Error loading daily summary:', error);
        }
    };

    const loadTransactions = async () => {
        try {
            const date = new Date(selectedDate);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // Load different types of transactions
            const [
                { data: savingsTransactions },
                { data: repaymentTransactions },
                { data: loanTransactions },
                { data: feeTransactions },
                { data: fineTransactions },
                { data: expenseTransactions }
            ] = await Promise.all([
                supabase.from('member_savings')
                    .select(`
                        id, amount, created_at,
                        member:members(full_name, member_number)
                    `)
                    .gte('created_at', startOfDay.toISOString())
                    .lt('created_at', endOfDay.toISOString())
                    .order('created_at', { ascending: false }),
                
                supabase.from('loan_repayments')
                    .select(`
                        id, amount_paid, payment_date,
                        member:members(full_name, member_number),
                        loan:member_loans(loan_number)
                    `)
                    .gte('payment_date', startOfDay.toISOString())
                    .lt('payment_date', endOfDay.toISOString())
                    .order('payment_date', { ascending: false }),
                
                supabase.from('member_loans')
                    .select(`
                        id, principal, processing_fee, issued_date, loan_number,
                        member:members(full_name, member_number)
                    `)
                    .gte('issued_date', startOfDay.toISOString())
                    .lt('issued_date', endOfDay.toISOString())
                    .eq('loan_status', 'ACTIVE')
                    .order('issued_date', { ascending: false }),
                
                supabase.from('member_processing_fees')
                    .select(`
                        id, amount, date_recorded,
                        member:members(full_name, member_number)
                    `)
                    .gte('date_recorded', startOfDay.toISOString())
                    .lt('date_recorded', endOfDay.toISOString())
                    .order('date_recorded', { ascending: false }),
                
                supabase.from('member_fines')
                    .select(`
                        id, amount, imposed_date, reason,
                        member:members(full_name, member_number)
                    `)
                    .eq('imposed_date', selectedDate)
                    .eq('status', 'paid')
                    .order('imposed_date', { ascending: false }),
                
                supabase.from('expenses')
                    .select(`
                        id, amount, category, description, expense_date,
                        branch:branches(name)
                    `)
                    .gte('expense_date', startOfDay.toISOString())
                    .lt('expense_date', endOfDay.toISOString())
                    .order('expense_date', { ascending: false })
            ]);

            const allTransactions = [];
            
            // Process savings transactions
            if (savingsTransactions) {
                savingsTransactions.forEach(tx => {
                    allTransactions.push({
                        id: tx.id,
                        type: 'savings',
                        description: `Savings from ${tx.member?.full_name || 'Member'}`,
                        amount: tx.amount || 0,
                        member: tx.member?.full_name,
                        memberNumber: tx.member?.member_number,
                        timestamp: tx.created_at,
                        status: 'completed',
                        category: 'income'
                    });
                });
            }
            
            // Process loan repayments
            if (repaymentTransactions) {
                repaymentTransactions.forEach(tx => {
                    allTransactions.push({
                        id: tx.id,
                        type: 'loan_repayment',
                        description: `Loan repayment from ${tx.member?.full_name || 'Member'}`,
                        amount: tx.amount_paid || 0,
                        member: tx.member?.full_name,
                        memberNumber: tx.member?.member_number,
                        loanNumber: tx.loan?.loan_number,
                        timestamp: tx.payment_date,
                        status: 'completed',
                        category: 'income'
                    });
                });
            }
            
            // Process new loans (cash out)
            if (loanTransactions) {
                loanTransactions.forEach(tx => {
                    allTransactions.push({
                        id: tx.id,
                        type: 'new_loan',
                        description: `New loan issued to ${tx.member?.full_name || 'Member'}`,
                        amount: -(tx.principal || 0),
                        member: tx.member?.full_name,
                        memberNumber: tx.member?.member_number,
                        loanNumber: tx.loan_number,
                        timestamp: tx.issued_date,
                        status: 'completed',
                        category: 'expense',
                        processingFee: tx.processing_fee || 0
                    });
                });
            }
            
            // Process processing fees
            if (feeTransactions) {
                feeTransactions.forEach(tx => {
                    allTransactions.push({
                        id: tx.id,
                        type: 'processing_fee',
                        description: `Processing fee from ${tx.member?.full_name || 'Member'}`,
                        amount: tx.amount || 0,
                        member: tx.member?.full_name,
                        memberNumber: tx.member?.member_number,
                        timestamp: tx.date_recorded,
                        status: 'completed',
                        category: 'income'
                    });
                });
            }
            
            // Process fines
            if (fineTransactions) {
                fineTransactions.forEach(tx => {
                    allTransactions.push({
                        id: tx.id,
                        type: 'fine',
                        description: `Fine from ${tx.member?.full_name || 'Member'}: ${tx.reason}`,
                        amount: tx.amount || 0,
                        member: tx.member?.full_name,
                        memberNumber: tx.member?.member_number,
                        timestamp: tx.imposed_date,
                        status: 'completed',
                        category: 'income'
                    });
                });
            }
            
            // Process expenses
            if (expenseTransactions) {
                expenseTransactions.forEach(tx => {
                    allTransactions.push({
                        id: tx.id,
                        type: 'expense',
                        description: `${tx.category} expense: ${tx.description}`,
                        amount: -(tx.amount || 0),
                        branch: tx.branch?.name,
                        timestamp: tx.expense_date,
                        status: 'completed',
                        category: 'expense'
                    });
                });
            }
            
            // Sort by timestamp
            allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            setTransactions(allTransactions);
            
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    };

    const loadBranchBreakdown = async () => {
        try {
            const { data: branches, error } = await supabase
                .from('branches')
                .select('id, name, location');
            
            if (error) throw error;
            
            const date = new Date(selectedDate);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            const branchStats = await Promise.all(
                branches.map(async (branch) => {
                    try {
                        const { data: members } = await supabase
                            .from('members')
                            .select('id')
                            .eq('branch_id', branch.id);
                        
                        const memberIds = members?.map(m => m.id) || [];
                        
                        const [
                            { data: savings },
                            { data: repayments },
                            { data: newLoans },
                            { data: processingFees },
                            { data: expenses }
                        ] = await Promise.all([
                            memberIds.length > 0 
                                ? supabase.from('member_savings')
                                    .select('amount')
                                    .in('member_id', memberIds)
                                    .gte('created_at', startOfDay.toISOString())
                                    .lt('created_at', endOfDay.toISOString())
                                : { data: null },
                            
                            memberIds.length > 0
                                ? supabase.from('loan_repayments')
                                    .select('amount_paid')
                                    .in('member_id', memberIds)
                                    .gte('payment_date', startOfDay.toISOString())
                                    .lt('payment_date', endOfDay.toISOString())
                                : { data: null },
                            
                            memberIds.length > 0
                                ? supabase.from('member_loans')
                                    .select('principal, processing_fee')
                                    .in('member_id', memberIds)
                                    .gte('issued_date', startOfDay.toISOString())
                                    .lt('issued_date', endOfDay.toISOString())
                                    .eq('loan_status', 'ACTIVE')
                                : { data: null },
                            
                            memberIds.length > 0
                                ? supabase.from('member_processing_fees')
                                    .select('amount')
                                    .in('member_id', memberIds)
                                    .gte('date_recorded', startOfDay.toISOString())
                                    .lt('date_recorded', endOfDay.toISOString())
                                : { data: null },
                            
                            supabase.from('expenses')
                                .select('amount')
                                .eq('branch_id', branch.id)
                                .gte('expense_date', startOfDay.toISOString())
                                .lt('expense_date', endOfDay.toISOString())
                        ]);
                        
                        const totalSavings = savings?.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0) || 0;
                        const totalRepayments = repayments?.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0) || 0;
                        const totalNewLoans = newLoans?.reduce((sum, l) => sum + (parseFloat(l.principal) || 0), 0) || 0;
                        const totalProcessingFees = (newLoans?.reduce((sum, l) => sum + (parseFloat(l.processing_fee) || 0), 0) || 0) + 
                                                   (processingFees?.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) || 0);
                        const totalExpenses = expenses?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;
                        
                        const cashIn = totalSavings + totalRepayments + totalProcessingFees;
                        const cashOut = totalExpenses + totalNewLoans;
                        const netCashFlow = cashIn - cashOut;
                        
                        return {
                            id: branch.id,
                            name: branch.name,
                            location: branch.location,
                            memberCount: members?.length || 0,
                            totalSavings,
                            totalRepayments,
                            totalNewLoans,
                            totalProcessingFees,
                            totalExpenses,
                            cashIn,
                            cashOut,
                            netCashFlow,
                            efficiency: memberCount > 0 ? Math.round((cashIn / Math.max(memberCount, 1)) / 1000) * 1000 : 0
                        };
                    } catch (err) {
                        console.error(`Error loading branch ${branch.name} stats:`, err);
                        return {
                            id: branch.id,
                            name: branch.name,
                            location: branch.location,
                            memberCount: 0,
                            totalSavings: 0,
                            totalRepayments: 0,
                            totalNewLoans: 0,
                            totalProcessingFees: 0,
                            totalExpenses: 0,
                            cashIn: 0,
                            cashOut: 0,
                            netCashFlow: 0,
                            efficiency: 0
                        };
                    }
                })
            );
            
            branchStats.sort((a, b) => b.cashIn - a.cashIn);
            setBranchBreakdown(branchStats);
            
        } catch (error) {
            console.error('Error loading branch breakdown:', error);
        }
    };

    const loadCashFlowData = async () => {
        try {
            const { data: cashFlowData, error } = await supabase
                .from('branch_profit_ledger')
                .select('date_recorded, amount, transaction_type, description')
                .gte('date_recorded', getDateRangeStart(dateRange))
                .lt('date_recorded', new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .order('date_recorded', { ascending: true });
            
            if (error) throw error;
            
            // Group by date
            const groupedData = (cashFlowData || []).reduce((acc, transaction) => {
                const date = transaction.date_recorded.split('T')[0];
                if (!acc[date]) {
                    acc[date] = {
                        date,
                        cashIn: 0,
                        cashOut: 0,
                        netFlow: 0
                    };
                }
                
                if (transaction.transaction_type === 'income') {
                    acc[date].cashIn += parseFloat(transaction.amount) || 0;
                } else if (transaction.transaction_type === 'expense') {
                    acc[date].cashOut += parseFloat(transaction.amount) || 0;
                }
                
                acc[date].netFlow = acc[date].cashIn - acc[date].cashOut;
                return acc;
            }, {});
            
            const sortedData = Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date));
            setCashFlowData(sortedData.slice(-7)); // Last 7 days
            
        } catch (error) {
            console.error('Error loading cash flow data:', error);
        }
    };

    const loadPendingApprovals = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const [
                { data: pendingLoans },
                { data: pendingExpenses },
                { data: pendingAdjustments }
            ] = await Promise.all([
                supabase.from('member_loans')
                    .select(`
                        id, principal, purpose, created_at,
                        member:members(full_name, member_number),
                        branch:branches(name)
                    `)
                    .eq('loan_status', 'pending_general_manager')
                    .order('created_at', { ascending: false }),
                
                supabase.from('expenses')
                    .select(`
                        id, amount, category, description, created_at,
                        branch:branches(name),
                        submitted_by:users_meta(full_name)
                    `)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false }),
                
                supabase.from('accounting_adjustments')
                    .select(`
                        id, amount, adjustment_type, reason, created_at,
                        branch:branches(name),
                        submitted_by:users_meta(full_name)
                    `)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
            ]);
            
            setPendingApprovals({
                loans: pendingLoans || [],
                expenses: pendingExpenses || [],
                adjustments: pendingAdjustments || []
            });
            
        } catch (error) {
            console.error('Error loading pending approvals:', error);
        }
    };

    const loadDailyTargets = async () => {
        try {
            const date = new Date(selectedDate);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            const [
                { data: savingsData },
                { data: repaymentData },
                { data: newMembersData },
                { data: groupsData }
            ] = await Promise.all([
                supabase.from('member_savings')
                    .select('amount')
                    .gte('created_at', startOfDay.toISOString())
                    .lt('created_at', endOfDay.toISOString()),
                
                supabase.from('loan_repayments')
                    .select('amount_paid')
                    .gte('payment_date', startOfDay.toISOString())
                    .lt('payment_date', endOfDay.toISOString()),
                
                supabase.from('members')
                    .select('id')
                    .gte('date_joined', selectedDate)
                    .lt('date_joined', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
                
                supabase.from('groups')
                    .select('id')
                    .gte('created_at', startOfDay.toISOString())
                    .lt('created_at', endOfDay.toISOString())
            ]);
            
            const actualSavings = savingsData?.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0) || 0;
            const actualRepayments = repaymentData?.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0) || 0;
            const actualNewMembers = newMembersData?.length || 0;
            const actualGroups = groupsData?.length || 0;
            
            setDailyTargets(prev => ({
                ...prev,
                savings: { ...prev.savings, actual: actualSavings, variance: actualSavings - prev.savings.target },
                repayments: { ...prev.repayments, actual: actualRepayments, variance: actualRepayments - prev.repayments.target },
                newMembers: { ...prev.newMembers, actual: actualNewMembers, variance: actualNewMembers - prev.newMembers.target },
                groups: { ...prev.groups, actual: actualGroups, variance: actualGroups - prev.groups.target }
            }));
            
        } catch (error) {
            console.error('Error loading daily targets:', error);
        }
    };

    const filterTransactions = () => {
        let filtered = transactions;
        
        if (searchTerm) {
            filtered = filtered.filter(tx =>
                tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (tx.member && tx.member.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (tx.memberNumber && tx.memberNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (tx.branch && tx.branch.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        if (transactionFilter !== 'all') {
            filtered = filtered.filter(tx => {
                if (transactionFilter === 'income') return tx.category === 'income';
                if (transactionFilter === 'expense') return tx.category === 'expense';
                if (transactionFilter === 'cash_in') return tx.amount > 0;
                if (transactionFilter === 'cash_out') return tx.amount < 0;
                if (transactionFilter === 'pending') return tx.status === 'pending';
                if (transactionFilter === 'savings') return tx.type === 'savings';
                if (transactionFilter === 'repayments') return tx.type === 'loan_repayment';
                if (transactionFilter === 'loans') return tx.type === 'new_loan';
                return true;
            });
        }
        
        setFilteredTransactions(filtered);
    };

    const calculatePercentageChange = (previous, current) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    const getDateRangeStart = (range) => {
        const today = new Date();
        const startDate = new Date(today);
        
        switch (range) {
            case 'week':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(today.getMonth() - 3);
                break;
            default: // 'today'
                startDate.setDate(today.getDate());
                startDate.setHours(0, 0, 0, 0);
        }
        
        return startDate.toISOString().split('T')[0];
    };

    const handleApproveLoan = async (loanId) => {
        try {
            setLoading(true);
            
            const { error } = await supabase
                .from('member_loans')
                .update({ 
                    loan_status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: (await supabase.auth.getUser()).data.user?.id
                })
                .eq('id', loanId);
            
            if (error) throw error;
            
            await loadPendingApprovals();
            await loadDailyOperations();
            
            alert('Loan approved successfully!');
            
        } catch (error) {
            console.error('Error approving loan:', error);
            alert('Error approving loan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRejectLoan = async (loanId, reason = 'Rejected by General Manager') => {
        try {
            setLoading(true);
            
            const { error } = await supabase
                .from('member_loans')
                .update({ 
                    loan_status: 'rejected',
                    rejection_reason: reason,
                    rejected_at: new Date().toISOString(),
                    rejected_by: (await supabase.auth.getUser()).data.user?.id
                })
                .eq('id', loanId);
            
            if (error) throw error;
            
            await loadPendingApprovals();
            
            alert('Loan rejected successfully!');
            
        } catch (error) {
            console.error('Error rejecting loan:', error);
            alert('Error rejecting loan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveExpense = async (expenseId) => {
        try {
            setLoading(true);
            
            const { error } = await supabase
                .from('expenses')
                .update({ 
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: (await supabase.auth.getUser()).data.user?.id
                })
                .eq('id', expenseId);
            
            if (error) throw error;
            
            await loadPendingApprovals();
            await loadDailyOperations();
            
            alert('Expense approved successfully!');
            
        } catch (error) {
            console.error('Error approving expense:', error);
            alert('Error approving expense: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = async () => {
        try {
            // In a real application, you would generate a PDF or CSV report
            // For now, we'll create a simple JSON download
            
            const reportData = {
                date: selectedDate,
                summary: dailySummary,
                transactions: filteredTransactions,
                branchBreakdown: branchBreakdown,
                generatedAt: new Date().toISOString(),
                generatedBy: (await supabase.auth.getUser()).data.user?.id
            };
            
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `daily-operations-report-${selectedDate}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Report exported successfully!');
            
        } catch (error) {
            console.error('Error exporting report:', error);
            alert('Error exporting report: ' + error.message);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid date';
        }
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'savings': return <DollarSign size={16} />;
            case 'loan_repayment': return <CreditCard size={16} />;
            case 'new_loan': return <TrendingUp size={16} />;
            case 'processing_fee': return <Wallet size={16} />;
            case 'fine': return <AlertCircle size={16} />;
            case 'expense': return <TrendingDown size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const getStatusColor = (type) => {
        switch (type) {
            case 'savings':
            case 'loan_repayment':
            case 'processing_fee':
            case 'fine':
                return 'success';
            case 'new_loan':
            case 'expense':
                return 'danger';
            default:
                return 'neutral';
        }
    };

    return (
        <div className="daily-operations">
            {/* Header */}
            <div className="page-header">
                <h1><Calendar size={28} /> Daily Operations</h1>
                <p>Monitor daily transactions, cash flow, and branch performance</p>
            </div>

            {/* Controls */}
            <div className="controls-section">
                <div className="date-controls">
                    <div className="date-picker">
                        <label>Select Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    <div className="range-selector">
                        <label>Date Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="form-select"
                        >
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="quarter">Last 90 Days</option>
                        </select>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={loadDailyOperations}
                        disabled={loading}
                    >
                        <RefreshCw size={18} /> Refresh
                    </button>
                    <button 
                        className="btn btn-secondary"
                        onClick={handleExportReport}
                        disabled={loading}
                    >
                        <Download size={18} /> Export Report
                    </button>
                </div>
                
                <div className="search-filters">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search transactions by member, branch, or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <select
                        value={transactionFilter}
                        onChange={(e) => setTransactionFilter(e.target.value)}
                        className="form-select"
                        disabled={loading}
                    >
                        <option value="all">All Transactions</option>
                        <option value="income">All Income</option>
                        <option value="expense">All Expenses</option>
                        <option value="cash_in">Cash In Only</option>
                        <option value="cash_out">Cash Out Only</option>
                        <option value="savings">Savings Only</option>
                        <option value="repayments">Loan Repayments</option>
                        <option value="loans">New Loans</option>
                    </select>
                </div>
            </div>

            {/* Daily Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card primary">
                    <div className="card-header">
                        <DollarSign size={24} />
                        <h3>Cash In Today</h3>
                    </div>
                    <div className="card-body">
                        <h2>{formatCurrency(dailySummary.cashIn)}</h2>
                        <div className="card-details">
                            <div className="detail-item">
                                <span>Savings</span>
                                <strong>{formatCurrency(dailySummary.totalSavings)}</strong>
                                <span className={`trend ${dailySummary.previousDayComparison.savings >= 0 ? 'success' : 'danger'}`}>
                                    {dailySummary.previousDayComparison.savings >= 0 ? '↗' : '↘'} 
                                    {Math.abs(dailySummary.previousDayComparison.savings)}%
                                </span>
                            </div>
                            <div className="detail-item">
                                <span>Repayments</span>
                                <strong>{formatCurrency(dailySummary.totalRepayments)}</strong>
                                <span className={`trend ${dailySummary.previousDayComparison.repayments >= 0 ? 'success' : 'danger'}`}>
                                    {dailySummary.previousDayComparison.repayments >= 0 ? '↗' : '↘'} 
                                    {Math.abs(dailySummary.previousDayComparison.repayments)}%
                                </span>
                            </div>
                            <div className="detail-item">
                                <span>Processing Fees</span>
                                <strong>{formatCurrency(dailySummary.totalProcessingFees)}</strong>
                            </div>
                            <div className="detail-item">
                                <span>Fines</span>
                                <strong>{formatCurrency(dailySummary.totalFines)}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="summary-card warning">
                    <div className="card-header">
                        <TrendingDown size={24} />
                        <h3>Cash Out Today</h3>
                    </div>
                    <div className="card-body">
                        <h2>{formatCurrency(dailySummary.cashOut)}</h2>
                        <div className="card-details">
                            <div className="detail-item">
                                <span>New Loans</span>
                                <strong>{formatCurrency(dailySummary.totalNewLoans)}</strong>
                                <span className={`trend ${dailySummary.previousDayComparison.loans <= 0 ? 'success' : 'danger'}`}>
                                    {dailySummary.previousDayComparison.loans <= 0 ? '↗' : '↘'} 
                                    {Math.abs(dailySummary.previousDayComparison.loans)}%
                                </span>
                            </div>
                            <div className="detail-item">
                                <span>Expenses</span>
                                <strong>{formatCurrency(dailySummary.totalExpenses)}</strong>
                            </div>
                            <div className="detail-item">
                                <span>Social Fund</span>
                                <strong>{formatCurrency(dailySummary.totalSocialFund)}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`summary-card ${dailySummary.netCashFlow >= 0 ? 'success' : 'danger'}`}>
                    <div className="card-header">
                        {dailySummary.netCashFlow >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                        <h3>Net Cash Flow</h3>
                    </div>
                    <div className="card-body">
                        <h2>{formatCurrency(dailySummary.netCashFlow)}</h2>
                        <div className="card-details">
                            <div className="detail-item">
                                <span>Cash In</span>
                                <strong>{formatCurrency(dailySummary.cashIn)}</strong>
                            </div>
                            <div className="detail-item">
                                <span>Cash Out</span>
                                <strong>{formatCurrency(dailySummary.cashOut)}</strong>
                            </div>
                            <div className="detail-item">
                                <span>vs Yesterday</span>
                                <span className={`trend ${dailySummary.previousDayComparison.netCash >= 0 ? 'success' : 'danger'}`}>
                                    {dailySummary.previousDayComparison.netCash >= 0 ? '↗' : '↘'} 
                                    {Math.abs(dailySummary.previousDayComparison.netCash)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="summary-card info">
                    <div className="card-header">
                        <Target size={24} />
                        <h3>Daily Targets</h3>
                    </div>
                    <div className="card-body">
                        <div className="targets-grid">
                            <div className="target-item">
                                <span>Savings Target</span>
                                <div className="target-progress">
                                    <div 
                                        className="progress-bar"
                                        style={{ width: `${Math.min(100, (dailyTargets.savings.actual / dailyTargets.savings.target) * 100)}%` }}
                                    />
                                    <span>{formatCurrency(dailyTargets.savings.actual)} / {formatCurrency(dailyTargets.savings.target)}</span>
                                </div>
                            </div>
                            <div className="target-item">
                                <span>Repayment Target</span>
                                <div className="target-progress">
                                    <div 
                                        className="progress-bar"
                                        style={{ width: `${Math.min(100, (dailyTargets.repayments.actual / dailyTargets.repayments.target) * 100)}%` }}
                                    />
                                    <span>{formatCurrency(dailyTargets.repayments.actual)} / {formatCurrency(dailyTargets.repayments.target)}</span>
                                </div>
                            </div>
                            <div className="target-item">
                                <span>New Members</span>
                                <div className="target-progress">
                                    <div 
                                        className="progress-bar"
                                        style={{ width: `${Math.min(100, (dailyTargets.newMembers.actual / dailyTargets.newMembers.target) * 100)}%` }}
                                    />
                                    <span>{dailyTargets.newMembers.actual} / {dailyTargets.newMembers.target}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Approvals Section */}
            {pendingApprovals.loans.length > 0 || pendingApprovals.expenses.length > 0 || pendingApprovals.adjustments.length > 0 ? (
                <div className="pending-approvals-section">
                    <h3><AlertCircle size={24} /> Pending Approvals</h3>
                    <div className="approvals-grid">
                        {pendingApprovals.loans.length > 0 && (
                            <div className="approval-card">
                                <div className="approval-header">
                                    <CreditCard size={20} />
                                    <h4>Loan Approvals ({pendingApprovals.loans.length})</h4>
                                </div>
                                <div className="approval-list">
                                    {pendingApprovals.loans.slice(0, 3).map(loan => (
                                        <div key={loan.id} className="approval-item">
                                            <div className="approval-info">
                                                <strong>{loan.member?.full_name}</strong>
                                                <small>{formatCurrency(loan.principal)} • {loan.branch?.name}</small>
                                                <p>{loan.purpose || 'No purpose specified'}</p>
                                            </div>
                                            <div className="approval-actions">
                                                <button 
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleApproveLoan(loan.id)}
                                                    disabled={loading}
                                                >
                                                    <CheckCircle2 size={14} /> Approve
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleRejectLoan(loan.id)}
                                                    disabled={loading}
                                                >
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {pendingApprovals.expenses.length > 0 && (
                            <div className="approval-card">
                                <div className="approval-header">
                                    <TrendingDown size={20} />
                                    <h4>Expense Approvals ({pendingApprovals.expenses.length})</h4>
                                </div>
                                <div className="approval-list">
                                    {pendingApprovals.expenses.slice(0, 3).map(expense => (
                                        <div key={expense.id} className="approval-item">
                                            <div className="approval-info">
                                                <strong>{expense.category}</strong>
                                                <small>{formatCurrency(expense.amount)} • {expense.branch?.name}</small>
                                                <p>{expense.description}</p>
                                            </div>
                                            <div className="approval-actions">
                                                <button 
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleApproveExpense(expense.id)}
                                                    disabled={loading}
                                                >
                                                    <CheckCircle2 size={14} /> Approve
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Branch Performance Breakdown */}
            <div className="branch-performance-section">
                <h3><Building2 size={24} /> Branch Performance Breakdown</h3>
                <div className="branch-performance-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Branch</th>
                                <th>Members</th>
                                <th>Cash In</th>
                                <th>Cash Out</th>
                                <th>Net Flow</th>
                                <th>Efficiency</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branchBreakdown.map(branch => (
                                <tr key={branch.id}>
                                    <td>
                                        <div className="branch-info">
                                            <strong>{branch.name}</strong>
                                            <small>{branch.location}</small>
                                        </div>
                                    </td>
                                    <td>{branch.memberCount}</td>
                                    <td className="success">{formatCurrency(branch.cashIn)}</td>
                                    <td className="danger">{formatCurrency(branch.cashOut)}</td>
                                    <td className={branch.netCashFlow >= 0 ? 'success' : 'danger'}>
                                        {formatCurrency(branch.netCashFlow)}
                                    </td>
                                    <td>
                                        <div className="efficiency-bar">
                                            <div 
                                                className="efficiency-fill"
                                                style={{ width: `${Math.min(100, branch.efficiency / 10000)}%` }}
                                            />
                                            <span>{formatCurrency(branch.efficiency)}/member</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${branch.netCashFlow >= 0 ? 'success' : 'danger'}`}>
                                            {branch.netCashFlow >= 0 ? 'Positive' : 'Negative'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="transactions-section">
                <div className="section-header">
                    <h3><Clock size={24} /> Recent Transactions</h3>
                    <span className="transaction-count">{filteredTransactions.length} transactions found</span>
                </div>
                
                <div className="transactions-table-container">
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Member/Branch</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.slice(0, 20).map(transaction => (
                                    <tr key={transaction.id}>
                                        <td>
                                            <div className="transaction-time">
                                                {formatDate(transaction.timestamp)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`transaction-type ${getStatusColor(transaction.type)}`}>
                                                {getTransactionIcon(transaction.type)}
                                                <span>{transaction.type.replace('_', ' ').toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="transaction-description">
                                                {transaction.description}
                                                {transaction.loanNumber && (
                                                    <small>Loan #: {transaction.loanNumber}</small>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {transaction.member ? (
                                                <div className="member-info">
                                                    <strong>{transaction.member}</strong>
                                                    <small>{transaction.memberNumber}</small>
                                                </div>
                                            ) : transaction.branch ? (
                                                <div className="branch-info">
                                                    <Building2 size={12} />
                                                    <span>{transaction.branch}</span>
                                                </div>
                                            ) : (
                                                'N/A'
                                            )}
                                        </td>
                                        <td className={transaction.amount >= 0 ? 'success' : 'danger'}>
                                            {formatCurrency(transaction.amount)}
                                            {transaction.processingFee > 0 && (
                                                <small>+{formatCurrency(transaction.processingFee)} fee</small>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${transaction.status}`}>
                                                {transaction.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-transactions">
                                        <FileText size={32} />
                                        <p>No transactions found</p>
                                        <small>Try changing the date or filters</small>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {filteredTransactions.length > 20 && (
                    <div className="view-all-transactions">
                        <button className="btn btn-secondary">
                            <Eye size={16} /> View All {filteredTransactions.length} Transactions
                        </button>
                    </div>
                )}
            </div>

            {/* Cash Flow Chart (Simple Version) */}
            {cashFlowData.length > 0 && (
                <div className="cash-flow-section">
                    <h3><BarChart3 size={24} /> Cash Flow Trend</h3>
                    <div className="cash-flow-chart">
                        <div className="chart-header">
                            <div className="chart-metrics">
                                <div className="metric">
                                    <span>Total Cash In</span>
                                    <strong>{formatCurrency(cashFlowData.reduce((sum, day) => sum + day.cashIn, 0))}</strong>
                                </div>
                                <div className="metric">
                                    <span>Total Cash Out</span>
                                    <strong>{formatCurrency(cashFlowData.reduce((sum, day) => sum + day.cashOut, 0))}</strong>
                                </div>
                                <div className="metric">
                                    <span>Net Flow</span>
                                    <strong className={cashFlowData.reduce((sum, day) => sum + day.netFlow, 0) >= 0 ? 'success' : 'danger'}>
                                        {formatCurrency(cashFlowData.reduce((sum, day) => sum + day.netFlow, 0))}
                                    </strong>
                                </div>
                            </div>
                        </div>
                        <div className="chart-bars">
                            {cashFlowData.map((day, index) => {
                                const maxValue = Math.max(...cashFlowData.map(d => Math.max(d.cashIn, d.cashOut)));
                                const cashInHeight = maxValue > 0 ? (day.cashIn / maxValue) * 100 : 0;
                                const cashOutHeight = maxValue > 0 ? (day.cashOut / maxValue) * 100 : 0;
                                
                                return (
                                    <div key={index} className="chart-bar-group">
                                        <div className="bar-label">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </div>
                                        <div className="bars">
                                            <div 
                                                className="bar cash-in" 
                                                style={{ height: `${cashInHeight}%` }}
                                                title={`Cash In: ${formatCurrency(day.cashIn)}`}
                                            />
                                            <div 
                                                className="bar cash-out" 
                                                style={{ height: `${cashOutHeight}%` }}
                                                title={`Cash Out: ${formatCurrency(day.cashOut)}`}
                                            />
                                        </div>
                                        <div className="bar-value">
                                            {formatCurrency(day.netFlow)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="chart-legend">
                            <div className="legend-item">
                                <div className="legend-color cash-in"></div>
                                <span>Cash In</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-color cash-out"></div>
                                <span>Cash Out</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}