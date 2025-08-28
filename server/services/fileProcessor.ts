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
    // Import pdfjs-dist dynamically to avoid issues
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // Load the PDF
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });
    
    const pdf = await loadingTask.promise;
    const transactions: RawTransaction[] = [];
    
    // Extract text from all pages
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    // Parse transactions from extracted text
    const lines = fullText.split('\n');
    
    // Enhanced patterns for different bank statement formats
    const patterns = [
      // Pattern 1: DD/MM/YYYY Description Amount (Chilean format)
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+(.+?)\s+([-+]?\$?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*$/,
      // Pattern 2: YYYY-MM-DD Description Amount (International format)
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s+(.+?)\s+([-+]?\$?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*$/,
      // Pattern 3: MM/DD/YYYY Description Amount (US format)
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+(.+?)\s+([-+]?\$?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*$/,
      // Pattern 4: Amount Description Date (some formats)
      /([-+]?\$?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s+(.+?)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s*$/,
      // Pattern 5: More flexible pattern for complex layouts
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(.{5,50}?)\s*([-+]?\$?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:[-+]?\$?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)?/,
    ];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 15) continue; // Skip short lines
      
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = trimmedLine.match(pattern);
        
        if (match) {
          try {
            let dateStr: string, description: string, amountStr: string;
            
            if (i === 3) {
              // Amount Description Date format
              [, amountStr, description, dateStr] = match;
            } else {
              // Date Description Amount format
              [, dateStr, description, amountStr] = match;
            }
            
            // Clean and parse date
            const cleanDateStr = dateStr.replace(/[^\d\/\-]/g, '');
            const date = parseDate(cleanDateStr);
            if (!date || isNaN(date.getTime())) continue;
            
            // Clean and parse amount
            const cleanAmountStr = amountStr
              .replace(/\$|\s/g, '')
              .replace(/,/g, '.')
              .replace(/\.(?=\d{3})/g, '') // Remove thousand separators
              .trim();
            
            let amount = parseFloat(cleanAmountStr);
            if (isNaN(amount) || amount === 0) continue;
            
            // Clean description
            description = description
              .replace(/\s+/g, ' ')
              .replace(/[^\w\s\-\.\,]/g, '')
              .trim();
            
            if (description.length < 3) continue;
            
            // Determine transaction type based on keywords and amount context
            const expenseKeywords = [
              'compra', 'pago', 'retiro', 'comision', 'cargo', 'fee',
              'purchase', 'payment', 'withdrawal', 'charge', 'debit',
              'supermercado', 'restaurant', 'netflix', 'uber', 'taxi',
              'gasolina', 'combustible', 'farmacia', 'medico', 'clinica'
            ];
            
            const incomeKeywords = [
              'deposito', 'salario', 'sueldo', 'transferencia', 'abono',
              'deposit', 'salary', 'transfer', 'credit', 'income',
              'dividend', 'refund', 'reembolso', 'bonus'
            ];
            
            // Check if it's clearly an expense or income
            const isExpense = expenseKeywords.some(keyword => 
              description.toLowerCase().includes(keyword)
            );
            
            const isIncome = incomeKeywords.some(keyword => 
              description.toLowerCase().includes(keyword)
            );
            
            // Apply sign logic
            if (amount > 0 && isExpense && !isIncome) {
              amount = -amount;
            } else if (amount < 0 && isIncome) {
              amount = Math.abs(amount);
            }
            
            transactions.push({
              date: date.toISOString(),
              description: description,
              amount: amount,
            });
            
            break; // Found a match, move to next line
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    // If no standard patterns work, try a more flexible approach
    if (transactions.length === 0) {
      console.log('Trying flexible PDF parsing approach...');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length < 20) continue;
        
        // Look for date patterns
        const dateMatches = trimmedLine.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g);
        // Look for amount patterns
        const amountMatches = trimmedLine.match(/[-+]?\$?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})/g);
        
        if (dateMatches && amountMatches && dateMatches.length > 0 && amountMatches.length > 0) {
          try {
            const dateStr = dateMatches[0];
            const amountStr = amountMatches[amountMatches.length - 1];
            
            const date = parseDate(dateStr);
            if (!date || isNaN(date.getTime())) continue;
            
            const amount = parseFloat(amountStr.replace(/[$,\s]/g, '').replace(',', '.'));
            if (isNaN(amount) || amount === 0) continue;
            
            // Extract description
            let description = trimmedLine
              .replace(dateMatches[0], '')
              .replace(amountMatches[amountMatches.length - 1], '')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (description.length > 3) {
              transactions.push({
                date: date.toISOString(),
                description: description.substring(0, 100), // Limit description length
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
      throw new Error('No se pudieron encontrar transacciones en el PDF. Verifique que el archivo sea un estado de cuenta bancario válido con transacciones claramente formateadas.');
    }
    
    // Remove duplicates based on date, description, and amount
    const uniqueTransactions = removeDuplicateTransactions(transactions);
    
    // Sort by date (newest first)
    uniqueTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`Successfully extracted ${uniqueTransactions.length} transactions from PDF`);
    return uniqueTransactions;
    
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`Error procesando PDF: ${error instanceof Error ? error.message : 'Error desconocido'}. Asegúrate de que el archivo sea un estado de cuenta bancario válido.`);
  }
}

// Helper function to parse dates in different formats
function parseDate(dateStr: string): Date | null {
  const cleanDateStr = dateStr.replace(/[^\d\/\-]/g, '');
  
  // Try different date formats
  const formats = [
    // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // MM/DD/YYYY or MM-DD-YYYY  
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // YYYY/MM/DD or YYYY-MM-DD
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
    // DD/MM/YY or DD-MM-YY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
  ];
  
  for (let i = 0; i < formats.length; i++) {
    const match = cleanDateStr.match(formats[i]);
    if (match) {
      let day: number, month: number, year: number;
      
      if (i === 2) {
        // YYYY/MM/DD format
        [, year, month, day] = match.map(Number);
      } else if (i === 3) {
        // DD/MM/YY format - assume 20XX
        [, day, month, year] = match.map(Number);
        year = year + 2000;
      } else {
        // DD/MM/YYYY or MM/DD/YYYY - try both interpretations
        const [, first, second, fullYear] = match.map(Number);
        
        // Prefer DD/MM/YYYY for international formats
        if (second <= 12 && first <= 31) {
          day = first;
          month = second;
        } else if (first <= 12 && second <= 31) {
          day = second;
          month = first;
        } else {
          continue;
        }
        year = fullYear;
      }
      
      // Validate date values
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }
  }
  
  return null;
}

// Helper function to remove duplicate transactions
function removeDuplicateTransactions(transactions: RawTransaction[]): RawTransaction[] {
  const seen = new Set<string>();
  return transactions.filter(transaction => {
    const key = `${transaction.date}_${transaction.description}_${transaction.amount}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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