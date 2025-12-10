// src/components/GeneralManager/BranchOverview/BranchComparison.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BranchComparison = ({ branches }) => {
    // Prepare data for comparison chart
    const chartData = branches.map(branch => ({
        name: branch.code || branch.name.substring(0, 10),
        savings: Math.round(branch.totalSavings / 1000), // In thousands
        members: branch.membersCount,
        loans: branch.totalLoans,
        repayment: branch.repaymentRate
    }));

    return (
        <div className="branch-comparison-chart">
            <h3>Branch Performance Comparison</h3>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="savings" name="Savings (in 000's)" fill="#667eea" />
                        <Bar dataKey="members" name="Members" fill="#4caf50" />
                        <Bar dataKey="loans" name="Loans" fill="#ff9800" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BranchComparison;