// src/utils/loanCalculations.js

export const calculateGroupLoan = (memberRequests) => {
    const totalRequested = memberRequests.reduce((sum, member) => 
        sum + (parseFloat(member.requested_amount) || 0), 0);
    
    const memberCalculations = memberRequests.map(member => {
        const requested = parseFloat(member.requested_amount) || 0;
        const interest = requested * 0.10; // 10% interest
        const processingFee = 10000; // Fixed processing fee
        const savingsAddition = requested * 0.10; // 10% to savings
        const actualLoan = requested - interest - processingFee - savingsAddition;
        
        return {
            ...member,
            requested_amount: requested,
            interest_amount: interest,
            processing_fee: processingFee,
            savings_addition: savingsAddition,
            actual_loan: Math.max(0, actualLoan),
            net_disbursement: Math.max(0, actualLoan)
        };
    });
    
    const totalInterest = memberCalculations.reduce((sum, member) => 
        sum + member.interest_amount, 0);
    
    const totalProcessingFees = memberCalculations.reduce((sum, member) => 
        sum + member.processing_fee, 0);
    
    const totalSavingsAddition = memberCalculations.reduce((sum, member) => 
        sum + member.savings_addition, 0);
    
    return {
        total_requested: totalRequested,
        total_interest: totalInterest,
        total_processing_fees: totalProcessingFees,
        total_savings_addition: totalSavingsAddition,
        total_actual_loan: memberCalculations.reduce((sum, m) => sum + m.actual_loan, 0),
        member_calculations: memberCalculations
    };
};

export const calculateWeeklyPayment = (memberLoan, isAbsent = false) => {
    const weeklyRepayment = memberLoan.principal / memberLoan.weeks_due;
    let fines = 0;
    
    if (isAbsent) {
        // Auto fine for not saving
        fines += 1600;
    }
    
    // 1% fine on outstanding balance if failed to pay
    if (memberLoan.days_overdue > 7) {
        fines += memberLoan.remaining_balance * 0.01;
    }
    
    const totalPayment = weeklyRepayment + fines;
    
    return {
        weekly_repayment: weeklyRepayment,
        fines: fines,
        total_payment: totalPayment
    };
};

export const allocateGroupCollections = (groupCollections, groupLoans) => {
    const allocation = {
        to_savings: 0,
        to_loan_repayment: 0,
        to_social_fund: 0,
        remaining_balance: groupCollections.total
    };
    
    // Sort loans by priority (oldest first)
    const activeLoans = groupLoans
        .filter(loan => loan.loan_status === 'ACTIVE' && loan.outstanding_balance > 0)
        .sort((a, b) => new Date(a.date_approved || a.created_at) - new Date(b.date_approved || b.created_at));
    
    if (activeLoans.length === 0) {
        // No active loans, all goes to savings
        allocation.to_savings = groupCollections.total;
        allocation.remaining_balance = 0;
        return allocation;
    }
    
    let remaining = groupCollections.total;
    
    // Pay loan 1 first
    if (activeLoans[0]) {
        const loan1Payment = Math.min(remaining, activeLoans[0].outstanding_balance);
        allocation.to_loan_repayment += loan1Payment;
        remaining -= loan1Payment;
    }
    
    // Pay loan 2 if exists and still have money
    if (remaining > 0 && activeLoans[1]) {
        const loan2Payment = Math.min(remaining, activeLoans[1].outstanding_balance);
        allocation.to_loan_repayment += loan2Payment;
        remaining -= loan2Payment;
    }
    
    // Any remaining goes to savings
    allocation.to_savings = remaining;
    allocation.remaining_balance = 0;
    
    return allocation;
};

export const calculateCommission = (processingFees) => {
    // Facilitator gets 1% of total processing fees
    return processingFees * 0.01;
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};