/**
 * Transaction categorization service
 */

// Category rules for automatic classification
const categoryRules = {
  'Food & Dining': [
    'SUPERMERCADO', 'JUMBO', 'LIDER', 'WALMART', 'TARGET', 'COSTCO',
    'RESTAURANT', 'MCDONALDS', 'BURGER', 'PIZZA', 'STARBUCKS', 'CAFE',
    'FOOD', 'DINING', 'KITCHEN', 'BAKERY', 'DELI', 'GROCERY'
  ],
  'Transportation': [
    'SHELL', 'COPEC', 'EXXON', 'BP', 'CHEVRON', 'MOBIL',
    'UBER', 'LYFT', 'TAXI', 'METRO', 'BUS', 'TRAIN',
    'GAS', 'FUEL', 'PARKING', 'TOLL', 'TRANSPORT'
  ],
  'Entertainment': [
    'NETFLIX', 'SPOTIFY', 'AMAZON PRIME', 'DISNEY', 'HULU',
    'CINEMA', 'THEATER', 'CONCERT', 'STEAM', 'PLAYSTATION',
    'XBOX', 'NINTENDO', 'ENTERTAINMENT', 'MOVIE', 'MUSIC'
  ],
  'Health & Medical': [
    'FARMACIA', 'PHARMACY', 'CVS', 'WALGREENS', 'HOSPITAL',
    'CLINICA', 'CLINIC', 'DOCTOR', 'MEDICAL', 'HEALTH',
    'DENTAL', 'VISION', 'INSURANCE', 'MEDICARE'
  ],
  'Education': [
    'UNIVERSIDAD', 'UNIVERSITY', 'COLLEGE', 'SCHOOL',
    'INSTITUTO', 'TUITION', 'EDUCATION', 'STUDENT',
    'TEXTBOOK', 'COURSE', 'TRAINING'
  ],
  'Shopping': [
    'AMAZON', 'EBAY', 'WALMART', 'TARGET', 'BEST BUY',
    'APPLE STORE', 'STORE', 'MALL', 'SHOPPING',
    'CLOTHES', 'FASHION', 'ELECTRONICS'
  ],
  'Utilities': [
    'ELECTRIC', 'GAS COMPANY', 'WATER', 'INTERNET',
    'PHONE', 'CABLE', 'UTILITY', 'POWER', 'ENERGY'
  ],
  'Banking & Finance': [
    'BANK', 'ATM', 'TRANSFER', 'FEE', 'INTEREST',
    'CREDIT CARD', 'LOAN', 'MORTGAGE', 'INVESTMENT'
  ],
  'Income': [
    'SALARY', 'PAYROLL', 'WAGE', 'BONUS', 'REFUND',
    'DIVIDEND', 'INTEREST EARNED', 'CASHBACK'
  ]
};

/**
 * Categorize transactions using rule-based system
 * @param {Array} transactions - Raw transaction data
 * @returns {Promise<Array>} Categorized transactions
 */
export async function categorizeTransactions(transactions) {
  const categorizedTransactions = transactions.map(transaction => {
    const category = classifyTransaction(transaction.description);
    const type = transaction.amount >= 0 ? 'income' : 'expense';
    
    return {
      id: generateTransactionId(),
      date: transaction.date,
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      category,
      type,
      originalAmount: transaction.amount
    };
  });
  
  return categorizedTransactions;
}

/**
 * Classify a single transaction based on its description
 */
function classifyTransaction(description) {
  const upperDesc = description.toUpperCase();
  
  // Check each category's rules
  for (const [category, keywords] of Object.entries(categoryRules)) {
    for (const keyword of keywords) {
      if (upperDesc.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Default category for unmatched transactions
  return 'Other';
}

/**
 * Generate unique transaction ID
 */
function generateTransactionId() {
  return 'txn_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Get category statistics
 */
export function getCategoryStats(transactions) {
  const categoryTotals = {};
  const categoryColors = {
    'Food & Dining': 'hsl(217 91% 60%)',
    'Transportation': 'hsl(158 64% 52%)',
    'Entertainment': 'hsl(43 74% 66%)',
    'Health & Medical': 'hsl(27 87% 67%)',
    'Education': 'hsl(309 78% 73%)',
    'Shopping': 'hsl(200 50% 60%)',
    'Utilities': 'hsl(350 70% 65%)',
    'Banking & Finance': 'hsl(270 60% 70%)',
    'Income': 'hsl(120 50% 55%)',
    'Other': 'hsl(0 0% 60%)'
  };
  
  // Calculate totals by category
  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      const category = transaction.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
    }
  });
  
  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  
  // Convert to array with percentages
  const categoryData = Object.entries(categoryTotals).map(([name, amount]) => ({
    name,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    color: categoryColors[name] || categoryColors['Other']
  }));
  
  // Sort by amount descending
  categoryData.sort((a, b) => b.amount - a.amount);
  
  return categoryData;
}
