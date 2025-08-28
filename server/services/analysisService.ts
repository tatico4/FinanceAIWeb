import { getCategoryStats, CategorizedTransaction } from './categorizer';

export interface FinancialAnalysis {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;
  categories: any[];
  monthlyTrend: any[];
  transactionCount: number;
  averageTransactionAmount: number;
  transactionFrequency: Record<string, number>;
  dateRange: { start: string; end: string } | null;
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

export function generateAnalysis(transactions: CategorizedTransaction[]): FinancialAnalysis {
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

  // Calculate basic metrics using originalAmount to preserve signs
  const income = transactions
    .filter(t => t.originalAmount > 0)
    .reduce((sum, t) => sum + t.originalAmount, 0);
    
  const expenses = Math.abs(transactions
    .filter(t => t.originalAmount < 0)
    .reduce((sum, t) => sum + t.originalAmount, 0));
    
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  
  const categories = getCategoryStats(transactions);
  const monthlyTrend = generateMonthlyTrend(transactions);
  
  const averageTransactionAmount = transactions.length > 0 
    ? transactions.reduce((sum, t) => sum + Math.abs(t.originalAmount), 0) / transactions.length 
    : 0;
  
  const transactionFrequency: Record<string, number> = {};
  transactions.forEach(t => {
    const category = t.category || 'Otros';
    transactionFrequency[category] = (transactionFrequency[category] || 0) + 1;
  });
  
  const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
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

export function generateRecommendations(transactions: CategorizedTransaction[], metrics: FinancialAnalysis): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Savings rate recommendations
  if (metrics.savingsRate < 20) {
    recommendations.push({
      id: 'savings_rate_low',
      type: 'ahorros',
      title: 'Mejora tu Tasa de Ahorro',
      description: `Tu tasa de ahorro actual es ${metrics.savingsRate.toFixed(1)}%. Los expertos financieros recomiendan ahorrar al menos 20% de tus ingresos.`,
      impact: `Aumentar al 20% te permitiría ahorrar $${Math.round((metrics.totalIncome * 0.2) - metrics.totalSavings)} adicionales mensualmente`,
      priority: 'high'
    });
  } else if (metrics.savingsRate >= 20) {
    recommendations.push({
      id: 'savings_rate_good',
      type: 'felicitaciones',
      title: '¡Excelente Tasa de Ahorro!',
      description: `Tu tasa de ahorro del ${metrics.savingsRate.toFixed(1)}% está por encima del objetivo recomendado del 20%.`,
      impact: 'Continúa con estos buenos hábitos de ahorro para mantener tu salud financiera',
      priority: 'low'
    });
  }
  
  // Category-specific recommendations
  const topCategories = metrics.categories.slice(0, 3);
  
  topCategories.forEach(category => {
    if (category.name === 'Comida y Restaurantes' && category.percentage > 15) {
      recommendations.push({
        id: 'food_dining_high',
        type: 'gastos',
        title: 'Reduce Gastos en Comida y Restaurantes',
        description: `Estás gastando ${category.percentage.toFixed(1)}% de tus gastos en comida y restaurantes. Considera planificar comidas y cocinar más en casa.`,
        impact: `Podrías ahorrar $${Math.round(category.amount * 0.2)} mensualmente`,
        priority: 'medium'
      });
    }
    
    if (category.name === 'Transporte' && category.percentage > 20) {
      recommendations.push({
        id: 'transport_high',
        type: 'gastos',
        title: 'Optimiza Gastos de Transporte',
        description: `Los gastos de transporte representan ${category.percentage.toFixed(1)}% de tus gastos totales. Considera opciones más económicas como transporte público.`,
        impact: `Reducir al 15% podría ahorrarte $${Math.round(category.amount * 0.25)} mensualmente`,
        priority: 'medium'
      });
    }
    
    if (category.name === 'Entretenimiento' && category.percentage > 10) {
      recommendations.push({
        id: 'entertainment_high',
        type: 'gastos',
        title: 'Controla Gastos de Entretenimiento',
        description: `El entretenimiento representa ${category.percentage.toFixed(1)}% de tus gastos. Considera revisar suscripciones no utilizadas.`,
        impact: `Optimizar podría ahorrarte $${Math.round(category.amount * 0.3)} mensualmente`,
        priority: 'low'
      });
    }
  });
  
  // Transaction frequency recommendations
  if (metrics.transactionCount > 100) {
    recommendations.push({
      id: 'transaction_frequency_high',
      type: 'habitos',
      title: 'Consolida tus Compras',
      description: `Realizas muchas transacciones pequeñas (${metrics.transactionCount}). Consolidar compras puede ayudarte a ahorrar y tener mejor control.`,
      impact: 'Mejor organización financiera y menos gastos impulsivos',
      priority: 'low'
    });
  }
  
  return recommendations;
}

function generateMonthlyTrend(transactions: CategorizedTransaction[]): any[] {
  const monthlyData: Record<string, { income: number; expenses: number }> = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    if (transaction.originalAmount > 0) {
      monthlyData[monthKey].income += transaction.originalAmount;
    } else {
      monthlyData[monthKey].expenses += Math.abs(transaction.originalAmount);
    }
  });
  
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      income: Math.round(data.income * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
      savings: Math.round((data.income - data.expenses) * 100) / 100
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}