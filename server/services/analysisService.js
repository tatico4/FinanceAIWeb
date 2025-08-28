import { getCategoryStats } from './categorizer.js';

/**
 * Generate comprehensive financial analysis
 * @param {Array} transactions - Categorized transactions
 * @returns {Object} Financial metrics and insights
 */
export function generateAnalysis(transactions) {
  if (!transactions || transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      savingsRate: 0,
      categories: [],
      monthlyTrend: [],
      transactionCount: 0,
      averageTransactionAmount: 0,
      transactionFrequency: {},
      dateRange: null
    };
  }

  // Calculate basic metrics with proper handling of positive/negative amounts
  const income = transactions
    .filter(t => t.amount > 0) // Positive amounts are income
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenses = Math.abs(transactions
    .filter(t => t.amount < 0) // Negative amounts are expenses
    .reduce((sum, t) => sum + t.amount, 0));
    
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  
  // Get category breakdown
  const categories = getCategoryStats(transactions);
  
  // Generate monthly trend
  const monthlyTrend = generateMonthlyTrend(transactions);
  
  // Calculate additional metrics
  const averageTransactionAmount = transactions.length > 0 
    ? transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length 
    : 0;
  
  // Calculate transaction frequency by category
  const transactionFrequency = {};
  transactions.forEach(t => {
    const category = t.category || 'Otros';
    transactionFrequency[category] = (transactionFrequency[category] || 0) + 1;
  });
  
  // Get date range
  const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a - b);
  const dateRange = dates.length > 0 ? {
    start: dates[0].toISOString(),
    end: dates[dates.length - 1].toISOString()
  } : null;
  
  return {
    totalIncome: Math.round(income * 100) / 100,
    totalExpenses: Math.round(expenses * 100) / 100,
    totalSavings: Math.round(savings * 100) / 100,
    savingsRate: Math.round(savingsRate * 100) / 100,
    categories,
    monthlyTrend,
    transactionCount: transactions.length,
    averageTransactionAmount: Math.round(averageTransactionAmount * 100) / 100,
    transactionFrequency,
    dateRange
  };
}

/**
 * Generate personalized recommendations
 * @param {Array} transactions - Categorized transactions
 * @param {Object} metrics - Financial metrics
 * @returns {Array} Array of recommendations
 */
export function generateRecommendations(transactions, metrics) {
  const recommendations = [];
  
  // Savings rate recommendations
  if (metrics.savingsRate < 20) {
    recommendations.push({
      id: 'savings_rate_low',
      type: 'savings',
      title: 'Improve Your Savings Rate',
      description: `Your current savings rate is ${metrics.savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income.`,
      impact: `Increase to 20% to save an additional $${Math.round((metrics.totalIncome * 0.2) - metrics.totalSavings)} monthly`,
      priority: 'high'
    });
  }
  
  // Category-specific recommendations
  const topCategories = metrics.categories.slice(0, 3);
  
  topCategories.forEach(category => {
    if (category.name === 'Food & Dining' && category.percentage > 15) {
      recommendations.push({
        id: 'food_dining_high',
        type: 'savings',
        title: 'Reduce Food & Dining Expenses',
        description: `You're spending ${category.percentage.toFixed(1)}% of your expenses on food and dining. Consider meal planning and cooking at home more often.`,
        impact: `Save $${Math.round(category.amount * 0.2)} monthly`,
        priority: 'medium'
      });
    }
    
    if (category.name === 'Transportation' && category.percentage > 20) {
      recommendations.push({
        id: 'transportation_high',
        type: 'savings',
        title: 'Optimize Transportation Costs',
        description: `Transportation costs are ${category.percentage.toFixed(1)}% of your expenses. Consider carpooling, public transport, or working from home more often.`,
        impact: `Save $${Math.round(category.amount * 0.15)} monthly`,
        priority: 'medium'
      });
    }
    
    if (category.name === 'Entertainment' && category.percentage > 10) {
      recommendations.push({
        id: 'entertainment_high',
        type: 'savings',
        title: 'Review Entertainment Subscriptions',
        description: `Entertainment expenses are ${category.percentage.toFixed(1)}% of your budget. Review and cancel unused subscriptions.`,
        impact: `Save $${Math.round(category.amount * 0.3)} monthly`,
        priority: 'low'
      });
    }
  });
  
  // Investment recommendations
  if (metrics.savingsRate > 20) {
    recommendations.push({
      id: 'investment_opportunity',
      type: 'investment',
      title: 'Emergency Fund Priority',
      description: 'Great savings rate! Focus on building a 6-month emergency fund before investing.',
      impact: 'Financial security and peace of mind',
      priority: 'high'
    });
    
    if (metrics.totalSavings > metrics.totalExpenses * 6) {
      recommendations.push({
        id: 'index_fund_investment',
        type: 'investment',
        title: 'Consider Index Fund Investment',
        description: 'With a solid emergency fund, consider low-cost index funds for long-term growth.',
        impact: 'Potential 7-10% annual returns',
        priority: 'medium'
      });
    }
  }
  
  // Budget recommendations
  recommendations.push({
    id: 'budget_tracking',
    type: 'budget',
    title: 'Set Category Budgets',
    description: 'Based on your spending patterns, consider setting monthly budgets for each category to stay on track.',
    impact: 'Better financial control and awareness',
    priority: 'medium'
  });
  
  return recommendations.slice(0, 6); // Return top 6 recommendations
}

/**
 * Generate monthly trend data (simplified)
 */
function generateMonthlyTrend(transactions) {
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    if (transaction.type === 'income') {
      monthlyData[monthKey].income += transaction.amount;
    } else {
      monthlyData[monthKey].expenses += transaction.amount;
    }
  });
  
  // Convert to array and sort by date
  const monthlyArray = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month: formatMonth(month),
      income: Math.round(data.income),
      expenses: Math.round(data.expenses)
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  return monthlyArray.slice(-6); // Return last 6 months
}

/**
 * Format month string for display
 */
function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
