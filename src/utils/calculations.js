export const calculateCollectionRate = (collected, expected) => {
  if (!expected || expected === 0) return 0;
  return (collected / expected) * 100;
};

export const calculateNetProfit = (income, expenses) => {
  return income - expenses;
};

export const calculateDefaultRate = (defaultedLoans, totalLoans) => {
  if (!totalLoans || totalLoans === 0) return 0;
  return (defaultedLoans / totalLoans) * 100;
};

export const calculateGrowthRate = (currentValue, previousValue) => {
  if (!previousValue || previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};

export const calculatePerformanceScore = (metrics) => {
  const weights = {
    attendanceRate: 0.2,
    collectionRate: 0.3,
    repaymentRate: 0.3,
    savingsGrowth: 0.2
  };
  
  let score = 0;
  Object.entries(weights).forEach(([metric, weight]) => {
    const value = metrics[metric] || 0;
    score += value * weight;
  });
  
  return Math.min(score, 100);
};