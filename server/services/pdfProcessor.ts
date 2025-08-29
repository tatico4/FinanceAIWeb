interface RawTransaction {
  date: string;
  description: string;
  amount: number;
}

/**
 * Credit Card Statement PDF Processor
 * Specifically designed for Chilean credit card statements with format:
 * Ciudad DD/MM/YYYY Descripción Código Monto1 Monto2 VencimientoFinal MontoFinal
 */
export async function processCreditCardPDF(buffer: Buffer): Promise<RawTransaction[]> {
  try {
    console.log('\n=== CREDIT CARD STATEMENT PROCESSOR ===');
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
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex].trim();
      
      console.log(`\n--- Line ${lineIndex + 1}: "${line}"`);
      
      // Skip short lines
      if (line.length < 30) {
        console.log('❌ Line too short, skipping');
        continue;
      }
      
      // Skip non-transaction lines
      if (isNonTransactionLine(line)) {
        console.log('❌ Non-transaction line, skipping');
        continue;
      }
      
      // Try to parse as credit card transaction
      const transaction = parseCreditCardTransaction(line);
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
    console.error('PDF processing error:', error);
    throw new Error(`Error procesando PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Check if a line contains non-transaction information
 */
function isNonTransactionLine(line: string): boolean {
  const nonTransactionPatterns = [
    /ESTADO DE CUENTA/i,
    /CLIENTE ELITE/i,
    /FRANCISCO BRAVO/i,
    /LIRA \d+/i,
    /SANTIAGO/i,
    /Nombre del Titular/i,
    /Cupon de Pago/i,
    /N° de Tarjeta/i,
    /Pagar Hasta/i,
    /Próximo Período/i,
    /Fecha Facturación/i,
    /CMR Puntos/i,
    /Costo Monetario/i,
    /Otros\s+\+?\$\d+/,
    // Skip lines that are just numbers or dates without merchant info
    /^\d{1,2}\/\d{1,2}\/\d{4}\s*$/, 
    /^\d+\.\d+\s*$/,
    /^\d+\s*$/
  ];
  
  return nonTransactionPatterns.some(pattern => pattern.test(line));
}

/**
 * Parse credit card transaction from line
 * Expected format: CiudadDD/MM/AAAADescripción TCodigoMonto1Monto2DD/MMmes-AAAAMontoFinal
 * Example: "Las Condes17/08/2025Mercadopago *lavuelta T7.1507.15001/01sep-20257.150"
 */
function parseCreditCardTransaction(line: string): RawTransaction | null {
  try {
    // Updated pattern for Chilean statements without spaces
    // Ciudad followed by date, then description, then T + amounts, then final date and amount
    const pattern = /^([A-Za-z\s]+?)(\d{1,2}\/\d{1,2}\/\d{4})(.+?)\s([T])([\d.,]+)([\d.,]+)(\d{2}\/\d{2})(\w+-\d{4})([\d.,]+)$/;
    
    const match = line.match(pattern);
    
    if (!match) {
      console.log('❌ Line does not match credit card pattern');
      
      // Try a simpler pattern for debugging
      const simplePattern = /(\d{1,2}\/\d{1,2}\/\d{4})/;
      const dateMatch = line.match(simplePattern);
      if (dateMatch) {
        console.log(`🔍 Found date ${dateMatch[1]} but line doesn't match full pattern`);
        // Try to extract parts manually
        const dateStr = dateMatch[1];
        const beforeDate = line.substring(0, line.indexOf(dateStr));
        const afterDate = line.substring(line.indexOf(dateStr) + dateStr.length);
        console.log(`   Before date: "${beforeDate}"`);
        console.log(`   After date: "${afterDate}"`);
      }
      
      return null;
    }
    
    const [, city, dateStr, rawDescription, tCode, amount1, amount2, dateEnd, monthYear, finalAmount] = match;
    
    console.log(`Parsing transaction:`);
    console.log(`  City: "${city}"`);
    console.log(`  Date: "${dateStr}"`);
    console.log(`  Description: "${rawDescription}"`);
    console.log(`  T Code: "${tCode}"`);
    console.log(`  Amount1: "${amount1}"`);
    console.log(`  Amount2: "${amount2}"`);
    console.log(`  Final Amount: "${finalAmount}"`);
    
    // Parse date (DD/MM/YYYY)
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime()) || month < 1 || month > 12 || day < 1 || day > 31) {
      console.log('❌ Invalid date');
      return null;
    }
    
    // Clean description (remove extra spaces)
    const description = rawDescription.trim().replace(/\s+/g, ' ');
    
    if (description.length < 3) {
      console.log('❌ Description too short');
      return null;
    }
    
    // Parse amount (final amount is the actual transaction amount)
    // Chilean format uses dots as thousand separators, no comma decimals in this case
    const cleanAmount = finalAmount.replace(/\./g, '');
    const amount = parseFloat(cleanAmount);
    
    if (isNaN(amount) || amount <= 0) {
      console.log(`❌ Invalid amount: ${finalAmount} -> ${cleanAmount}`);
      return null;
    }
    
    // Credit card transactions are expenses (negative)
    return {
      date: date.toISOString(),
      description: description,
      amount: -amount
    };
    
  } catch (error) {
    console.log(`❌ Error parsing transaction: ${error}`);
    return null;
  }
}