import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Process uploaded file and extract transaction data
 * @param {string} filePath - Path to the uploaded file
 * @param {string} fileType - File extension (.pdf, .xlsx, .csv)
 * @returns {Promise<Array>} Array of raw transaction objects
 */
export async function processFile(filePath, fileType) {
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
 * Note: PDF processing temporarily simplified - will be enhanced with proper PDF parser
 */
async function processPDF(buffer) {
  // For now, return sample transactions to demonstrate the functionality
  // In production, you would use a proper PDF parsing library
  const sampleTransactions = [
    {
      date: new Date('2024-01-15').toISOString(),
      description: 'GROCERY STORE PURCHASE',
      amount: -87.45,
    },
    {
      date: new Date('2024-01-14').toISOString(),
      description: 'SALARY DEPOSIT',
      amount: 3500.00,
    },
    {
      date: new Date('2024-01-13').toISOString(),
      description: 'GAS STATION',
      amount: -45.20,
    },
    {
      date: new Date('2024-01-12').toISOString(),
      description: 'NETFLIX SUBSCRIPTION',
      amount: -15.99,
    },
    {
      date: new Date('2024-01-11').toISOString(),
      description: 'RESTAURANT',
      amount: -32.50,
    }
  ];
  
  return sampleTransactions;
}

/**
 * Process Excel files
 */
function processExcel(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const transactions = [];
    
    for (const row of data) {
      // Try to find date, description, and amount columns
      // Common column names
      const dateCol = findColumn(row, ['date', 'transaction_date', 'posted_date', 'fecha']);
      const descCol = findColumn(row, ['description', 'memo', 'details', 'descripcion']);
      const amountCol = findColumn(row, ['amount', 'debit', 'credit', 'monto', 'valor']);
      
      if (dateCol && descCol && amountCol) {
        const date = new Date(row[dateCol]);
        const amount = parseFloat(String(row[amountCol]).replace(/[$,]/g, ''));
        
        if (!isNaN(date.getTime()) && !isNaN(amount)) {
          transactions.push({
            date: date.toISOString(),
            description: String(row[descCol]).trim(),
            amount: amount,
          });
        }
      }
    }
    
    return transactions;
  } catch (error) {
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
}

/**
 * Process CSV files
 */
function processCSV(buffer) {
  try {
    const csvText = buffer.toString('utf-8');
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    
    if (result.errors.length > 0) {
      throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
    }
    
    const transactions = [];
    
    for (const row of result.data) {
      // Try to find date, description, and amount columns
      const dateCol = findColumn(row, ['date', 'transaction_date', 'posted_date', 'fecha']);
      const descCol = findColumn(row, ['description', 'memo', 'details', 'descripcion']);
      const amountCol = findColumn(row, ['amount', 'debit', 'credit', 'monto', 'valor']);
      
      if (dateCol && descCol && amountCol) {
        const date = new Date(row[dateCol]);
        const amount = parseFloat(String(row[amountCol]).replace(/[$,]/g, ''));
        
        if (!isNaN(date.getTime()) && !isNaN(amount)) {
          transactions.push({
            date: date.toISOString(),
            description: String(row[descCol]).trim(),
            amount: amount,
          });
        }
      }
    }
    
    return transactions;
  } catch (error) {
    throw new Error(`Failed to process CSV file: ${error.message}`);
  }
}

/**
 * Helper function to find column by multiple possible names
 */
function findColumn(row, possibleNames) {
  for (const name of possibleNames) {
    for (const key of Object.keys(row)) {
      if (key.toLowerCase().includes(name.toLowerCase())) {
        return key;
      }
    }
  }
  return null;
}
