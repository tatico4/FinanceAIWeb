interface RawTransaction {
  date: string;
  description: string;
  amount: number;
}

/**
 * Current Account Statement PDF Processor
 * Specifically designed for Chilean current account statements from Banco Santander
 * Format: DD/MMLocation[codes]Description[amounts]FinalBalance
 */
export async function processCurrentAccountPDF(buffer: Buffer): Promise<RawTransaction[]> {
  try {
    console.log('\n=== CURRENT ACCOUNT STATEMENT PROCESSOR ===');
    console.log(`PDF buffer size: ${buffer.length} bytes`);
    
    // Import pdf-extraction dynamically with proper error handling
    let extract;
    try {
      const pdfExtraction = await import('pdf-extraction');
      extract = pdfExtraction.extract || pdfExtraction.default?.extract || pdfExtraction.default;
      console.log('pdf-extraction module loaded successfully');
      console.log('Extract function type:', typeof extract);
    } catch (importError) {
      console.error('Failed to import pdf-extraction:', importError);
      throw new Error('Error cargando el módulo PDF. Intenta con formato Excel o CSV.');
    }
    
    if (!extract || typeof extract !== 'function') {
      throw new Error('pdf-extraction module not properly loaded');
    }
    
    // Extract text from PDF
    const data = await extract(buffer, {});
    let text: string;
    
    if (typeof data.text === 'string') {
      text = data.text;
    } else if (data.text && typeof data.text === 'object' && 'text' in data.text) {
      text = (data.text as any).text;
    } else {
      throw new Error('No se pudo extraer texto del PDF');
    }
    
    console.log(`Extracted text length: ${text.length}`);
    
    const transactions: RawTransaction[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log(`Processing ${lines.length} lines`);
    
    // First, let's analyze some sample lines to understand the format
    console.log('\n=== SAMPLE LINES ANALYSIS ===');
    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      const line = lines[i].trim();
      if (line.length > 20 && /\d{1,2}\/\d{1,2}/.test(line)) {
        console.log(`Sample line ${i + 1}: "${line}"`);
      }
    }
    console.log('=== END SAMPLE ANALYSIS ===\n');
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex].trim();
      
      console.log(`\n--- Line ${lineIndex + 1}: "${line}"`);
      
      // Skip short lines
      if (line.length < 20) {
        console.log('❌ Line too short, skipping');
        continue;
      }
      
      // Skip non-transaction lines
      if (isNonTransactionLineCurrentAccount(line)) {
        console.log('❌ Non-transaction line, skipping');
        continue;
      }
      
      // Try to parse as current account transaction
      const transaction = parseCurrentAccountTransaction(line);
      if (transaction) {
        console.log('✅ Valid transaction found!');
        console.log(`   Date: ${transaction.date}`);
        console.log(`   Description: ${transaction.description}`);
        console.log(`   Amount: ${transaction.amount}`);
        transactions.push(transaction);
      }
    }
    
    console.log(`\n=== PROCESSING COMPLETE ===`);
    console.log(`Total valid transactions found: ${transactions.length}`);
    
    return transactions;
    
  } catch (error) {
    console.error('Current Account PDF processing error:', error);
    throw new Error(`Error procesando PDF de cuenta corriente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Check if a line contains non-transaction information for current accounts
 */
function isNonTransactionLineCurrentAccount(line: string): boolean {
  const nonTransactionPatterns = [
    /CUENTA CORRIENTE/i,
    /B A N C O\s+S A N T A N D E R/i,
    /ESTADO DE CUENTA/i,
    /CLIENTE ELITE/i,
    /Nombre del Titular/i,
    /Resumen de Comisiones/i,
    /SIN COMISIONES/i,
    /MENSAJES/i,
    /SR\.CLIENTE/i,
    /INFORMESE SOBRE/i,
    /WWW\.CMFCHILE\.CL/i,
    /INFORMACION DE CUENTA/i,
    /SALDO INICIAL/i,
    /DEPOSITOS/i,
    /OTROS ABONOS/i,
    /CHEQUES/i,
    /OTROS CARGOS/i,
    /IMPUESTOS/i,
    /SALDO FINAL/i,
    /CUPO APROBADO/i,
    /FECHA VENCIMIENTO/i,
    /MONTO UTILIZADO/i,
    /SALDO DISPONIBLE/i,
    /INFORMACION DE LINEA/i,
    // Skip lines that are just numbers without context
    /^\d+\.?\d*\s*$/,
    // Skip asterisks and separators
    /^\*+$/,
    // Skip header/footer patterns
    /^\d{2}\/\d{2}\/\d{4}\s*$/,
    // Skip balances that are just numbers
    /^\d{1,3}(\.\d{3})*\s*$/
  ];
  
  return nonTransactionPatterns.some(pattern => pattern.test(line));
}

/**
 * Parse current account transaction from line
 * Expected formats:
 * - "01/08Agustinas0797601101 Transf. GENERA SPA8000012.975.000" (Income)
 * - "05/08AgustinasTraspaso Internet a T. Crédito2.561.017" (Expense)
 */
function parseCurrentAccountTransaction(line: string): RawTransaction | null {
  try {
    // Pattern 1: Complex format with multiple amounts
    // "01/08Agustinas0797601101 Transf. GENERA SPA8000012.975.000"
    // Extract: Date, Location, Code, Description, then parse amounts separately
    const pattern1 = /^(\d{1,2}\/\d{1,2})([A-Za-z\s]+?)(\d+)\s(.+?)\s*(\d+.*\d{1,3}(?:\.\d{3})+)$/;
    
    // Pattern 2: Simple format - Amount at the end
    // "05/08AgustinasTraspaso Internet a T. Crédito2.561.017"  
    const pattern2 = /^(\d{1,2}\/\d{1,2})([A-Za-z\s]+?)(.+?)(\d{1,3}(?:\.\d{3})+)$/;
    
    // Pattern 3: Fallback for other formats
    const pattern3 = /^(\d{1,2}\/\d{1,2})([A-Za-z\s]+)(.+?)(\d{1,3}(?:\.\d{3})+)$/;
    
    const patterns = [pattern1, pattern2, pattern3];
    
    let match = null;
    let patternUsed = 0;
    
    // Try each pattern
    for (let i = 0; i < patterns.length; i++) {
      match = line.match(patterns[i]);
      if (match) {
        patternUsed = i + 1;
        console.log(`✅ Matched with current account pattern ${patternUsed}`);
        break;
      }
    }
    
    if (!match) {
      console.log('❌ Line does not match any current account pattern');
      
      // Enhanced debugging for lines with dates
      const datePattern = /(\d{1,2}\/\d{1,2})/;
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        console.log(`🔍 Found date ${dateMatch[1]} but line doesn't match any pattern`);
        const dateStr = dateMatch[1];
        const afterDate = line.substring(line.indexOf(dateStr) + dateStr.length);
        console.log(`   After date: "${afterDate}"`);
        console.log(`   Full line length: ${line.length}`);
        
        // Try to extract numbers for potential amounts
        const numbers = afterDate.match(/\d{1,3}(?:\.\d{3})+/g);
        if (numbers && numbers.length >= 1) {
          console.log(`   Found ${numbers.length} potential amounts: ${numbers.join(', ')}`);
        }
      }
      
      return null;
    }
    
    // Extract components based on pattern
    let dateStr = '';
    let location = '';
    let codes = '';
    let description = '';
    let amountStr = '';
    
    if (patternUsed === 1) {
      // Complex format - need to extract transaction amount from number sequence
      let numberSequence: string;
      [, dateStr, location, codes, description, numberSequence] = match;
      
      // Parse the number sequence to extract actual transaction amount
      // "8000012.975.000" should extract "2.975.000"
      const numbers = numberSequence.match(/(\d{1,3}(?:\.\d{3})+)/g);
      if (numbers && numbers.length >= 1) {
        // Use the last meaningful amount as transaction amount
        amountStr = numbers[numbers.length - 1];
        
        // If there are multiple amounts, try to identify the transaction amount
        // (usually not the largest one which is typically the balance)
        if (numbers.length > 1) {
          const amounts = numbers.map(n => parseFloat(n.replace(/\./g, '')));
          const maxAmount = Math.max(...amounts);
          
          // Find the transaction amount (not the balance)
          for (let i = 0; i < amounts.length - 1; i++) {
            if (amounts[i] < maxAmount && amounts[i] > 0) {
              amountStr = numbers[i];
              break;
            }
          }
        }
      } else {
        console.log('❌ Could not extract amount from number sequence');
        return null;
      }
      
      console.log(`   Number sequence: "${numberSequence}"`);
      console.log(`   Extracted numbers: [${numbers?.join(', ')}]`);
      console.log(`   Selected amount: "${amountStr}"`);
      
    } else if (patternUsed === 2 || patternUsed === 3) {
      // Simpler formats - amount is at the end
      [, dateStr, location, description, amountStr] = match;
      codes = ''; // No codes in this format
    }
    
    console.log(`Parsing current account transaction with pattern ${patternUsed}:`);
    console.log(`  Date: "${dateStr}"`);
    console.log(`  Location: "${location.trim()}"`);
    console.log(`  Codes: "${codes}"`);
    console.log(`  Description: "${description.trim()}"`);
    console.log(`  Amount String: "${amountStr}"`);
    
    // Parse date (DD/MM format, assume current year)
    const [day, month] = dateStr.split('/').map(Number);
    const currentYear = new Date().getFullYear();
    const date = new Date(currentYear, month - 1, day);
    
    if (isNaN(date.getTime()) || month < 1 || month > 12 || day < 1 || day > 31) {
      console.log('❌ Invalid date');
      return null;
    }
    
    // Clean and combine description
    const fullDescription = `${description.trim()}`;
    
    if (fullDescription.length < 3) {
      console.log('❌ Description too short');
      return null;
    }
    
    // Parse amount (Chilean format uses dots as thousand separators)
    // Remove dots to get the actual number
    const cleanAmount = amountStr.replace(/\./g, '');
    const amount = parseFloat(cleanAmount);
    
    if (isNaN(amount) || amount <= 0) {
      console.log(`❌ Invalid amount: ${amountStr} -> ${cleanAmount}`);
      return null;
    }
    
    // Determine if it's an income or expense based on description keywords
    const isExpense = isExpenseTransaction(fullDescription);
    const finalAmount = isExpense ? -amount : amount;
    
    console.log(`   Transaction type: ${isExpense ? 'EXPENSE' : 'INCOME'}`);
    console.log(`   Final amount: ${finalAmount}`);
    
    return {
      date: date.toISOString(),
      description: fullDescription,
      amount: finalAmount
    };
    
  } catch (error) {
    console.log(`❌ Error parsing current account transaction: ${error}`);
    return null;
  }
}

/**
 * Determine if a transaction is an expense based on description keywords
 */
function isExpenseTransaction(description: string): boolean {
  const expenseKeywords = [
    // Keywords that indicate outgoing money (expenses)
    'TRASPASO',
    'PAGO',
    'RETIRO',
    'COMISION',
    'CARGO',
    'TRANSFERENCIA',
    'GIRO',
    'CHEQUE',
    'CUOTA',
    'ABONO',
    'CREDITO', // when it says "a T. Crédito" it means payment to credit card
    'PRESTAMO',
    'TARJETA',
    'COMPRA',
    'DEBITO',
    'MULTIPAGO'
  ];
  
  const upperDesc = description.toUpperCase();
  
  // Check for expense keywords
  for (const keyword of expenseKeywords) {
    if (upperDesc.includes(keyword)) {
      console.log(`   Found expense keyword: "${keyword}"`);
      return true;
    }
  }
  
  // Default to income if no expense keywords found
  console.log(`   No expense keywords found, treating as income`);
  return false;
}