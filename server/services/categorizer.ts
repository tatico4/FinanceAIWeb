export interface CategorizedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  originalAmount: number;
}

interface CategoryStats {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  transactionCount: number;
}

// Category rules for automatic classification
const categoryRules: Record<string, string[]> = {
  'Comida y Restaurantes': [
    'SUPERMERCADO', 'JUMBO', 'LIDER', 'WALMART', 'TARGET', 'COSTCO',
    'RESTAURANT', 'MCDONALDS', 'BURGER', 'PIZZA', 'STARBUCKS', 'CAFE',
    'FOOD', 'DINING', 'KITCHEN', 'BAKERY', 'DELI', 'GROCERY', 'COMIDA',
    'RESTAURANTE', 'ALMACEN', 'PANADERIA'
  ],
  'Transporte': [
    'SHELL', 'COPEC', 'EXXON', 'BP', 'CHEVRON', 'MOBIL',
    'UBER', 'LYFT', 'TAXI', 'METRO', 'BUS', 'TRAIN',
    'GAS', 'FUEL', 'PARKING', 'TOLL', 'TRANSPORT', 'COMBUSTIBLE',
    'ESTACIONAMIENTO', 'PEAJE', 'LOCOMOCION'
  ],
  'Entretenimiento': [
    'NETFLIX', 'SPOTIFY', 'AMAZON PRIME', 'DISNEY', 'HULU',
    'CINEMA', 'THEATER', 'CONCERT', 'STEAM', 'PLAYSTATION',
    'XBOX', 'NINTENDO', 'ENTERTAINMENT', 'MOVIE', 'MUSIC',
    'CINE', 'TEATRO', 'CONCIERTO', 'ENTRETENCION'
  ],
  'Salud y Médicos': [
    'FARMACIA', 'PHARMACY', 'CVS', 'WALGREENS', 'HOSPITAL',
    'CLINICA', 'CLINIC', 'DOCTOR', 'MEDICAL', 'HEALTH',
    'DENTAL', 'VISION', 'INSURANCE', 'MEDICARE', 'CONSULTA',
    'MEDICO', 'DENTISTA'
  ],
  'Educación': [
    'UNIVERSIDAD', 'UNIVERSITY', 'COLLEGE', 'SCHOOL',
    'INSTITUTO', 'TUITION', 'EDUCATION', 'STUDENT',
    'TEXTBOOK', 'COURSE', 'TRAINING', 'COLEGIO', 'ESCUELA'
  ],
  'Compras': [
    'AMAZON', 'EBAY', 'WALMART', 'TARGET', 'BEST BUY',
    'APPLE STORE', 'STORE', 'MALL', 'SHOPPING',
    'CLOTHES', 'FASHION', 'ELECTRONICS', 'TIENDA',
    'ROPA', 'ELECTRONICA', 'COMPRA'
  ],
  'Servicios Básicos': [
    'ELECTRIC', 'GAS COMPANY', 'WATER', 'INTERNET',
    'PHONE', 'CABLE', 'UTILITY', 'POWER', 'ENERGY',
    'LUZ', 'AGUA', 'TELEFONO', 'ENERGIA', 'SERVICIOS'
  ],
  'Bancarios y Finanzas': [
    'BANK', 'ATM', 'TRANSFER', 'FEE', 'INTEREST',
    'CREDIT CARD', 'LOAN', 'MORTGAGE', 'INVESTMENT',
    'BANCO', 'TRANSFERENCIA', 'COMISION', 'INTERES',
    'CREDITO', 'PRESTAMO', 'INVERSION'
  ],
  'Ingresos': [
    'SALARY', 'PAYROLL', 'WAGE', 'BONUS', 'REFUND',
    'DIVIDEND', 'INTEREST EARNED', 'CASHBACK',
    'SUELDO', 'SALARIO', 'REMUNERACION', 'BONO',
    'REEMBOLSO', 'DIVIDENDO'
  ]
};

// Color palette for categories
const categoryColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
  '#EC4899', '#6B7280'
];

export async function categorizeTransactions(transactions: any[]): Promise<CategorizedTransaction[]> {
  const categorizedTransactions = transactions.map(transaction => {
    const category = classifyTransaction(transaction.description);
    const type = transaction.amount >= 0 ? 'income' : 'expense';
    
    return {
      id: generateTransactionId(),
      date: transaction.date,
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      category,
      type: type as 'income' | 'expense',
      originalAmount: transaction.amount
    };
  });
  
  return categorizedTransactions;
}

function classifyTransaction(description: string): string {
  const upperDesc = description.toUpperCase();
  
  for (const [category, keywords] of Object.entries(categoryRules)) {
    for (const keyword of keywords) {
      if (upperDesc.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Otros';
}

function generateTransactionId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getCategoryStats(transactions: CategorizedTransaction[]): CategoryStats[] {
  const categoryTotals: Record<string, { amount: number; count: number }> = {};
  
  // Calculate totals for each category (expenses only)
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  expenseTransactions.forEach(transaction => {
    if (!categoryTotals[transaction.category]) {
      categoryTotals[transaction.category] = { amount: 0, count: 0 };
    }
    categoryTotals[transaction.category].amount += transaction.amount;
    categoryTotals[transaction.category].count += 1;
  });
  
  // Convert to array and calculate percentages
  const categoryStats = Object.entries(categoryTotals)
    .map(([name, data], index) => ({
      name,
      amount: Math.round(data.amount * 100) / 100,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      color: categoryColors[index % categoryColors.length],
      transactionCount: data.count
    }))
    .sort((a, b) => b.amount - a.amount);
  
  return categoryStats;
}