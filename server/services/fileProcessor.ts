import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface RawTransaction {
  date: string;
  description: string;
  amount: number;
}

/**
 * Process uploaded file and extract transaction data
 */
export async function processFile(filePath: string, fileType: string): Promise<RawTransaction[]> {
  const fileBuffer = fs.readFileSync(filePath);
  
  switch (fileType) {
    case '.pdf':
      return processPDF(fileBuffer);
    case '.xlsx':
    case '.xls':
      return processExcel(fileBuffer);
    case '.csv':
      return processCSV(fileBuffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Process PDF bank statements
 * Extracts transaction data from PDF text using pattern matching
 */
async function processPDF(buffer: Buffer): Promise<RawTransaction[]> {
  try {
    // Dynamic import to avoid initialization issues
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    const text = data.text;
    
    const transactions: RawTransaction[] = [];
    const lines = text.split('\n');
    
    // Common patterns for bank statements
    const patterns = [
      // Pattern 1: DD/MM/YYYY Description Amount
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([-+]?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/,
      // Pattern 2: YYYY-MM-DD Description Amount
      /(\d{4}-\d{1,2}-\d{1,2})\s+(.+?)\s+([-+]?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/,
      // Pattern 3: MM/DD/YYYY Description Amount
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([-+]?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/,
      // Pattern 4: Description Date Amount (some formats)
      /(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+([-+]?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/,
    ];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 10) continue;
      
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = trimmedLine.match(pattern);
        if (match) {
          try {
            let dateStr: string, description: string, amountStr: string;
            
            if (i === 3) {
              // Special case where description comes first
              [, description, dateStr, amountStr] = match;
            } else {
              [, dateStr, description, amountStr] = match;
            }
            
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) continue;
            
            const cleanAmount = amountStr.replace(/[$,\s]/g, '');
            let amount = parseFloat(cleanAmount);
            if (isNaN(amount)) continue;
            
            // Determine if it's a debit or credit based on keywords
            if (amount > 0 && !amountStr.includes('+')) {
              const expenseKeywords = ['compra', 'pago', 'retiro', 'purchase', 'payment', 'withdrawal', 'fee', 'charge'];
              if (expenseKeywords.some(keyword => 
                description.toLowerCase().includes(keyword)
              )) {
                amount = -amount;
              }
            }
            
            transactions.push({
              date: date.toISOString(),
              description: description.trim(),
              amount: amount,
            });
            
            break;
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    // Flexible parsing if no patterns match
    if (transactions.length === 0) {
      console.log('No transactions found with standard patterns, trying flexible parsing...');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length < 10) continue;
        
        const dateMatches = trimmedLine.match(/\d{1,4}[\/\-]\d{1,2}[\/\-]\d{2,4}/g);
        const amountMatches = trimmedLine.match(/[-+]?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})/g);
        
        if (dateMatches && amountMatches) {
          try {
            const dateStr = dateMatches[0];
            const amountStr = amountMatches[amountMatches.length - 1];
            
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) continue;
            
            const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
            if (isNaN(amount)) continue;
            
            const description = trimmedLine
              .replace(dateMatches[0], '')
              .replace(amountMatches[amountMatches.length - 1], '')
              .trim();
            
            if (description.length > 2) {
              transactions.push({
                date: date.toISOString(),
                description: description,
                amount: amount,
              });
            }
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    if (transactions.length === 0) {
      throw new Error('No se pudieron extraer transacciones del PDF. Verifique que el archivo contenga un estado de cuenta bancario válido.');
    }
    
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`Extracted ${transactions.length} transactions from PDF`);
    return transactions;
    
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`Error procesando PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Process Excel files
 */
function processExcel(buffer: Buffer): RawTransaction[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (!data || data.length === 0) {
      throw new Error('El archivo Excel está vacío o no contiene datos válidos.');
    }
    
    const transactions: RawTransaction[] = [];
    
    for (const row of data) {
      const dateCol = findColumn(row, [
        'date', 'transaction_date', 'posted_date', 'fecha', 'fecha_transaccion',
        'processing_date', 'effective_date', 'trans_date', 'transaction date'
      ]);
      const descCol = findColumn(row, [
        'description', 'memo', 'details', 'descripcion', 'concepto',
        'transaction_description', 'detail', 'reference', 'referencia'
      ]);
      const amountCol = findColumn(row, [
        'amount', 'debit', 'credit', 'monto', 'valor', 'importe',
        'transaction_amount', 'debits', 'credits', 'balance_change'
      ]);
      
      const debitCol = findColumn(row, ['debit', 'debits', 'debit_amount', 'debe', 'cargo']);
      const creditCol = findColumn(row, ['credit', 'credits', 'credit_amount', 'haber', 'abono']);
      
      if (dateCol && descCol && (amountCol || debitCol || creditCol)) {
        try {
          let date: Date;
          const dateValue = (row as any)[dateCol];
          if (typeof dateValue === 'number') {
            date = new Date((dateValue - 25569) * 86400 * 1000);
          } else {
            date = new Date(dateValue);
          }
          
          if (isNaN(date.getTime())) continue;
          
          let amount = 0;
          if (amountCol) {
            const amountStr = String((row as any)[amountCol]).replace(/[$,\s]/g, '');
            amount = parseFloat(amountStr);
          } else if (debitCol || creditCol) {
            const debitValue = debitCol ? parseFloat(String((row as any)[debitCol] || 0).replace(/[$,\s]/g, '')) : 0;
            const creditValue = creditCol ? parseFloat(String((row as any)[creditCol] || 0).replace(/[$,\s]/g, '')) : 0;
            amount = creditValue - debitValue;
          }
          
          if (isNaN(amount)) continue;
          
          const description = String((row as any)[descCol]).trim();
          if (description.length > 1) {
            transactions.push({
              date: date.toISOString(),
              description: description,
              amount: amount,
            });
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    if (transactions.length === 0) {
      throw new Error('No se pudieron extraer transacciones del archivo Excel. Verifique que contenga columnas de fecha, descripción y monto.');
    }
    
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`Extracted ${transactions.length} transactions from Excel file`);
    return transactions;
  } catch (error) {
    console.error('Excel processing error:', error);
    throw new Error(`Error procesando archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Process CSV files
 */
function processCSV(buffer: Buffer): RawTransaction[] {
  try {
    const csvText = buffer.toString('utf-8');
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    
    if (result.errors.length > 0) {
      console.warn('CSV parsing warnings:', result.errors.map(e => e.message));
    }
    
    if (!result.data || result.data.length === 0) {
      throw new Error('El archivo CSV está vacío o no contiene datos válidos.');
    }
    
    const transactions: RawTransaction[] = [];
    
    for (const row of result.data) {
      if (!row || typeof row !== 'object') continue;
      
      const dateCol = findColumn(row, [
        'date', 'transaction_date', 'posted_date', 'fecha', 'fecha_transaccion',
        'processing_date', 'effective_date', 'trans_date', 'transaction date'
      ]);
      const descCol = findColumn(row, [
        'description', 'memo', 'details', 'descripcion', 'concepto',
        'transaction_description', 'detail', 'reference', 'referencia'
      ]);
      const amountCol = findColumn(row, [
        'amount', 'debit', 'credit', 'monto', 'valor', 'importe',
        'transaction_amount', 'debits', 'credits', 'balance_change'
      ]);
      
      const debitCol = findColumn(row, ['debit', 'debits', 'debit_amount', 'debe', 'cargo']);
      const creditCol = findColumn(row, ['credit', 'credits', 'credit_amount', 'haber', 'abono']);
      
      if (dateCol && descCol && (amountCol || debitCol || creditCol)) {
        try {
          const dateValue = (row as any)[dateCol];
          const date = new Date(dateValue);
          
          if (isNaN(date.getTime())) continue;
          
          let amount = 0;
          if (amountCol) {
            const amountStr = String((row as any)[amountCol] || '').replace(/[$,\s]/g, '');
            amount = parseFloat(amountStr);
          } else if (debitCol || creditCol) {
            const debitValue = debitCol ? parseFloat(String((row as any)[debitCol] || 0).replace(/[$,\s]/g, '')) : 0;
            const creditValue = creditCol ? parseFloat(String((row as any)[creditCol] || 0).replace(/[$,\s]/g, '')) : 0;
            amount = creditValue - debitValue;
          }
          
          if (isNaN(amount)) continue;
          
          const description = String((row as any)[descCol] || '').trim();
          if (description.length > 1) {
            transactions.push({
              date: date.toISOString(),
              description: description,
              amount: amount,
            });
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    if (transactions.length === 0) {
      throw new Error('No se pudieron extraer transacciones del archivo CSV. Verifique que contenga columnas de fecha, descripción y monto.');
    }
    
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`Extracted ${transactions.length} transactions from CSV file`);
    return transactions;
  } catch (error) {
    console.error('CSV processing error:', error);
    throw new Error(`Error procesando archivo CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Helper function to find column by multiple possible names
 */
function findColumn(row: any, possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    for (const key of Object.keys(row)) {
      if (key.toLowerCase().includes(name.toLowerCase())) {
        return key;
      }
    }
  }
  return null;
}