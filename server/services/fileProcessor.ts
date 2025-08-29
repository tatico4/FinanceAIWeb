import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { processCreditCardPDF } from './pdfProcessor';

export interface RawTransaction {
  date: string;
  description: string;
  amount: number;
}

/**
 * Process uploaded file and extract transaction data
 */
export async function processFile(filePath: string, fileType: string): Promise<RawTransaction[]> {
  console.log('=== PROCESSING FILE ===');
  console.log('File path:', filePath);
  console.log('File type:', fileType);
  console.log('File exists:', fs.existsSync(filePath));
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }
  
  const stats = fs.statSync(filePath);
  console.log('File size:', stats.size, 'bytes');
  
  let fileBuffer: Buffer;
  try {
    fileBuffer = fs.readFileSync(filePath);
    console.log('File read successfully, buffer size:', fileBuffer.length);
  } catch (readError) {
    console.error('Error reading file:', readError);
    throw new Error(`Error reading file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
  }
  
  switch (fileType) {
    case '.pdf':
      console.log('Processing as PDF using Credit Card processor...');
      return processCreditCardPDF(fileBuffer);
    case '.xlsx':
    case '.xls':
      console.log('Processing as Excel...');
      return processExcel(fileBuffer);
    case '.csv':
      console.log('Processing as CSV...');
      return processCSV(fileBuffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
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
        } catch (rowError) {
          console.warn('Error processing Excel row:', rowError);
          continue;
        }
      }
    }
    
    if (transactions.length === 0) {
      throw new Error('No se encontraron transacciones válidas en el archivo Excel. Asegúrate de que tenga columnas para fecha, descripción y monto.');
    }
    
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
    const csvText = buffer.toString('utf8');
    
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('El archivo CSV está vacío.');
    }
    
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim(),
    });
    
    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors);
    }
    
    const data = parseResult.data as any[];
    
    if (!data || data.length === 0) {
      throw new Error('El archivo CSV no contiene datos válidos.');
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
          const date = new Date(row[dateCol]);
          if (isNaN(date.getTime())) continue;
          
          let amount = 0;
          if (amountCol) {
            const amountStr = String(row[amountCol]).replace(/[$,\s]/g, '');
            amount = parseFloat(amountStr);
          } else if (debitCol || creditCol) {
            const debitValue = debitCol ? parseFloat(String(row[debitCol] || 0).replace(/[$,\s]/g, '')) : 0;
            const creditValue = creditCol ? parseFloat(String(row[creditCol] || 0).replace(/[$,\s]/g, '')) : 0;
            amount = creditValue - debitValue;
          }
          
          if (isNaN(amount)) continue;
          
          const description = String(row[descCol]).trim();
          if (description.length > 1) {
            transactions.push({
              date: date.toISOString(),
              description: description,
              amount: amount,
            });
          }
        } catch (rowError) {
          console.warn('Error processing CSV row:', rowError);
          continue;
        }
      }
    }
    
    if (transactions.length === 0) {
      throw new Error('No se encontraron transacciones válidas en el archivo CSV. Asegúrate de que tenga columnas para fecha, descripción y monto.');
    }
    
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
  const keys = Object.keys(row).map(k => k.toLowerCase().trim());
  
  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().trim();
    
    // Exact match
    const exactMatch = keys.find(key => key === normalizedName);
    if (exactMatch) {
      const originalKey = Object.keys(row).find(k => k.toLowerCase().trim() === exactMatch);
      if (originalKey) return originalKey;
    }
    
    // Partial match
    const partialMatch = keys.find(key => key.includes(normalizedName) || normalizedName.includes(key));
    if (partialMatch) {
      const originalKey = Object.keys(row).find(k => k.toLowerCase().trim() === partialMatch);
      if (originalKey) return originalKey;
    }
  }
  
  return null;
}