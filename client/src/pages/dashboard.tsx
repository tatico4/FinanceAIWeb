import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PieChart from "@/components/charts/pie-chart";
import LineChart from "@/components/charts/line-chart";
import Recommendations from "@/components/recommendations";
import MetricsCard from "@/components/ui/metrics-card";
import { ChartLine, TrendingDown, TrendingUp, ArrowLeft, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { AnalysisResult, Transaction } from "@shared/schema";

export default function Dashboard() {
  const [match, params] = useRoute("/dashboard/:id");
  const analysisId = params?.id;
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 20;

  const { data: analysis, isLoading, error } = useQuery<AnalysisResult>({
    queryKey: ['/api/analysis', analysisId],
    enabled: !!analysisId,
  });

  if (!match || !analysisId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert className="max-w-md">
          <AlertDescription>ID de análisis inválido proporcionado.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert className="max-w-md">
          <AlertDescription>
            Error al cargar los datos del análisis. Por favor intenta subir tu archivo nuevamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const transactions = analysis.transactions as Transaction[];
  const categories = analysis.categories as any[];
  const recommendations = analysis.recommendations as any[];

  // Pagination for transactions
  const sortedTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const totalPages = Math.ceil(sortedTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate additional metrics from transactions
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const averageTransactionAmount = expenseTransactions.length > 0 ? 
    (analysis.totalExpenses || 0) / expenseTransactions.length : 0;
  
  // Calculate date range from transactions
  const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
  const dateRange = dates.length > 0 ? {
    start: dates[0].toISOString(),
    end: dates[dates.length - 1].toISOString()
  } : null;
  
  // Calculate transaction frequency by category
  const transactionFrequency: Record<string, number> = {};
  transactions.forEach(t => {
    const category = t.category || 'Otros';
    transactionFrequency[category] = (transactionFrequency[category] || 0) + 1;
  });
  
  // Get period information
  const periodInfo = dateRange ? {
    start: new Date(dateRange.start).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    end: new Date(dateRange.end).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } : null;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food & Dining': 'hsl(var(--chart-1))',
      'Transportation': 'hsl(var(--chart-2))',
      'Shopping': 'hsl(var(--chart-3))',
      'Entertainment': 'hsl(var(--chart-4))',
      'Health & Medical': 'hsl(var(--chart-5))',
      'Income': 'hsl(var(--accent))',
    };
    return colors[category] || 'hsl(var(--muted))';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{analysis.fileName}</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Dashboard de Análisis Financiero
              </h1>
              <p className="text-muted-foreground">
                Insights completos sobre tu salud financiera basados en {transactions.length} transacciones
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Analizado el</div>
              <div className="text-sm font-medium">
                {new Date(analysis.uploadedAt!).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Data Summary */}
        <Card className="glassmorphism bg-card/80 border border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Resumen de Datos Procesados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <div className="text-2xl font-bold text-primary">{transactions.length}</div>
                <div className="text-sm text-muted-foreground">Transacciones</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-accent/10">
                <div className="text-2xl font-bold text-accent">
                  ${averageTransactionAmount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Promedio por Transacción</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/10">
                <div className="text-2xl font-bold text-foreground">
                  {Object.keys(transactionFrequency).length}
                </div>
                <div className="text-sm text-muted-foreground">Categorías Identificadas</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/10">
                <div className="text-lg font-bold text-foreground">
                  {periodInfo ? `${Math.ceil((new Date(dateRange!.end).getTime() - new Date(dateRange!.start).getTime()) / (1000 * 60 * 60 * 24))} días` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Período Analizado</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Metrics Cards - Solo Gastos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricsCard
            title="Gastos Totales"
            value={`$${analysis.totalExpenses?.toLocaleString() || '0'}`}
            icon={TrendingDown}
            trend={`${transactions.filter(t => t.type === 'expense').length} transacciones`}
            trendDirection="neutral"
            description="Total procesado"
            color="destructive"
            data-testid="card-total-expenses"
          />
          <MetricsCard
            title="Promedio por Gasto"
            value={`$${transactions.filter(t => t.type === 'expense').length > 0 ? 
              Math.round((analysis.totalExpenses || 0) / transactions.filter(t => t.type === 'expense').length).toLocaleString() : '0'}`}
            icon={ChartLine}
            trend={`${Object.keys(transactionFrequency).length} categorías`}
            trendDirection="neutral"
            description="Gasto promedio"
            color="primary"
            data-testid="card-average-expense"
          />
          <MetricsCard
            title="Período Analizado"
            value={dateRange ? `${Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))} días` : 'N/A'}
            icon={FileText}
            trend={dateRange ? `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}` : 'Sin datos'}
            trendDirection="neutral"
            description="Rango de fechas"
            color="accent"
            data-testid="card-period"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Spending by Category Chart */}
          <Card className="glassmorphism bg-card/80 border border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChartLine className="h-5 w-5" />
                <span>Gastos por Categoría</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={categories} />
              <div className="grid grid-cols-2 gap-4 mt-6">
                {categories.slice(0, 6).map((category, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm flex-1">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ${category.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend Chart */}
          <Card className="glassmorphism bg-card/80 border border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Ingresos vs Gastos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart 
                data={[
                  { month: 'Jan', income: analysis.totalIncome || 0, expenses: analysis.totalExpenses || 0 },
                  { month: 'Feb', income: (analysis.totalIncome || 0) * 0.95, expenses: (analysis.totalExpenses || 0) * 1.05 },
                  { month: 'Mar', income: (analysis.totalIncome || 0) * 1.1, expenses: (analysis.totalExpenses || 0) * 0.9 },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        {/* Category Details */}
        <Card className="glassmorphism bg-card/80 border border-border mb-8">
          <CardHeader>
            <CardTitle>Desglose Detallado por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category, index) => (
                <div key={index} className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex items-center space-x-3 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="font-semibold">{category.name}</h3>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Monto Total:</span>
                      <span className="font-medium">${category.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Porcentaje:</span>
                      <span className="font-medium">{category.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transacciones:</span>
                      <span className="font-medium">{category.transactionCount || transactionFrequency[category.name] || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Promedio:</span>
                      <span className="font-medium">
                        ${category.transactionCount ? (category.amount / category.transactionCount).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <div className="mb-8">
          <Recommendations recommendations={recommendations} />
        </div>

        {/* Transactions Table with Pagination */}
        <Card className="glassmorphism bg-card/80 border border-border">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Todas las Transacciones</span>
              <span className="text-sm text-muted-foreground">
                {sortedTransactions.length} transacciones encontradas
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-transactions">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Descripción</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Categoría</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction: Transaction, index: number) => (
                    <tr key={transaction.id || index} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-4 text-sm" data-testid={`text-date-${index}`}>
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm" data-testid={`text-description-${index}`}>
                        {transaction.description}
                      </td>
                      <td className="p-4" data-testid={`badge-category-${index}`}>
                        <Badge 
                          variant="secondary"
                          style={{ 
                            backgroundColor: `${getCategoryColor(transaction.category)}20`,
                            color: getCategoryColor(transaction.category),
                            borderColor: `${getCategoryColor(transaction.category)}40`
                          }}
                        >
                          {transaction.category}
                        </Badge>
                      </td>
                      <td className={`p-4 text-right text-sm font-medium ${
                        transaction.type === 'income' ? 'text-accent' : 'text-destructive'
                      }`} data-testid={`text-amount-${index}`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, sortedTransactions.length)} de {sortedTransactions.length} transacciones
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 2
                    )
                    .map((page, index, array) => (
                      <span key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      </span>
                    ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
