// Simple script to create a test PDF with sample bank statement data
const fs = require('fs');

// Create a simple text content that simulates a bank statement
const bankStatementText = `
ESTADO DE CUENTA BANCARIO
Banco Nacional
Período: Enero 2024

Fecha        Descripción                           Débito      Crédito     Saldo
15/01/2024   Depósito Salario                                 3500.00    3500.00
14/01/2024   Supermercado Jumbo                   85.50                  3414.50
13/01/2024   Estación de Servicio Copec           45.20                  3369.30
12/01/2024   Netflix Suscripción                  15.99                  3353.31
11/01/2024   Restaurante Casa Blanca              67.80                  3285.51
10/01/2024   Transferencia Recibida                          250.00     3535.51
09/01/2024   Farmacia Cruz Verde                  23.45                  3512.06
08/01/2024   Uber                                 18.50                  3493.56
07/01/2024   Compra Online Amazon                129.99                  3363.57
06/01/2024   Pago Electricidad                    89.70                  3273.87
05/01/2024   Retiro Cajero ATM                   100.00                  3173.87
04/01/2024   Depósito Freelance                              800.00     3973.87
03/01/2024   Supermercado Líder                  112.30                  3861.57
02/01/2024   Starbucks                             8.50                  3853.07
01/01/2024   Transferencia a Ahorros             500.00                  3353.07
`;

console.log('Test bank statement content created. This would normally be converted to PDF format.');
console.log('Content preview:');
console.log(bankStatementText);