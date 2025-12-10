import React from 'react';
import { 
    Building2, 
    Users, 
    CreditCard, 
    DollarSign,
    TrendingUp,
    PieChart,
    AlertCircle,
    CheckCircle,
    Banknote
} from 'lucide-react';

const KPICards = ({ stats }) => {
    const kpiItems = [
        {
            title: 'Total Branches',
            value: stats.totalBranches,
            icon: <Building2 size={24} />,
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            subtitle: 'Active branches'
        },
        {
            title: 'Total Members',
            value: stats.totalMembers.toLocaleString(),
            icon: <Users size={24} />,
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            subtitle: 'Active members'
        },
        {
            title: 'Total Groups',
            value: stats.totalGroups.toLocaleString(),
            icon: <Users size={24} />,
            color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            subtitle: 'Active groups'
        },
        {
            title: 'Today\'s Savings',
            value: `UGX ${stats.todaySavings.toLocaleString()}`,
            icon: <DollarSign size={24} />,
            color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            subtitle: 'Total collected today'
        },
        {
            title: 'Active Loans',
            value: stats.activeLoans.toLocaleString(),
            icon: <CreditCard size={24} />,
            color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            subtitle: `${stats.overdueLoans} overdue`
        },
        {
            title: 'Today\'s Repayments',
            value: `UGX ${stats.todayRepayments.toLocaleString()}`,
            icon: <Banknote size={24} />,
            color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            subtitle: 'Loan repayments today'
        },
        {
            title: 'Interest Income',
            value: `UGX ${stats.branchInterestIncome.toLocaleString()}`,
            icon: <TrendingUp size={24} />,
            color: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
            subtitle: '10% branch income (30 days)'
        },
        {
            title: 'Processing Fees',
            value: `UGX ${stats.processingFees.toLocaleString()}`,
            icon: <PieChart size={24} />,
            color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            subtitle: 'Fees collected (30 days)'
        }
    ];

    return (
        <div className="stats-grid">
            {kpiItems.map((item, index) => (
                <div key={index} className="stat-card">
                    <div className="stat-icon" style={{ background: item.color }}>
                        {item.icon}
                    </div>
                    <div className="stat-info">
                        <h3>{item.value}</h3>
                        <p>{item.title}</p>
                        {item.subtitle && <small className="active-loans">{item.subtitle}</small>}
                    </div>
                    <div className={`stat-trend ${index % 3 === 0 ? 'positive' : index % 3 === 1 ? 'negative' : 'neutral'}`}>
                        {index % 3 === 0 ? '↑ 12%' : index % 3 === 1 ? '↓ 5%' : '→'}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KPICards;