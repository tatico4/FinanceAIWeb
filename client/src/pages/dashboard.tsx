import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PieChart from "@/components/charts/pie-chart";
import LineChart from "@/components/charts/line-chart";
import Recommendations from "@/components/recommendations";
import MetricsCard from "@/components/ui/metrics-card";
import { ChartLine, TrendingUp, TrendingDown, PiggyBank, Percent, ArrowLeft, FileText } from "lucide-react";
import type { AnalysisResult, Transaction } from "@shared/schema";

export default function Dashboard() {
  const [match, params] = useRoute("/dashboard/:id");
  const analysisId = params?.id;

  const { data: analysis, isLoading, error } = useQuery<AnalysisResult>({
    queryKey: ['/api/analysis', analysisId],
    enabled: !!analysisId,
  });

  if (!match || !analysisId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert className="max-w-md">
          <AlertDescription>Invalid analysis ID provided.</AlertDescription>
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
            Failed to load analysis data. Please try uploading your file again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const transactions = analysis.transactions as Transaction[];
  const categories = analysis.categories as any[];
  const recommendations = analysis.recommendations as any[];

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

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
                  Back
                </Button>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{analysis.fileName}</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Financial Analysis Dashboard
              </h1>
              <p className="text-muted-foreground">
                Comprehensive insights into your financial health based on {transactions.length} transactions
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Analyzed on</div>
              <div className="text-sm font-medium">
                {new Date(analysis.uploadedAt!).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Total Income"
            value={`$${analysis.totalIncome?.toLocaleString() || '0'}`}
            icon={TrendingUp}
            trend="+8.2%"
            trendDirection="up"
            description="This period"
            color="accent"
            data-testid="card-total-income"
          />
          <MetricsCard
            title="Total Expenses"
            value={`$${analysis.totalExpenses?.toLocaleString() || '0'}`}
            icon={TrendingDown}
            trend="-3.1%"
            trendDirection="down"
            description="This period"
            color="destructive"
            data-testid="card-total-expenses"
          />
          <MetricsCard
            title="Net Savings"
            value={`$${((analysis.totalIncome || 0) - (analysis.totalExpenses || 0)).toLocaleString()}`}
            icon={PiggyBank}
            trend="+15.7%"
            trendDirection="up"
            description="This period"
            color="primary"
            data-testid="card-net-savings"
          />
          <MetricsCard
            title="Savings Rate"
            value={`${analysis.savingsRate?.toFixed(1) || '0'}%`}
            icon={Percent}
            trend="Target: 20%"
            trendDirection={analysis.savingsRate! >= 20 ? "up" : "neutral"}
            description={analysis.savingsRate! >= 20 ? "Above target" : "Below target"}
            color="chart-3"
            data-testid="card-savings-rate"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Spending by Category Chart */}
          <Card className="glassmorphism bg-card/80 border border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChartLine className="h-5 w-5" />
                <span>Spending by Category</span>
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
                <span>Income vs Expenses</span>
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

        {/* Recommendations */}
        <div className="mb-8">
          <Recommendations recommendations={recommendations} />
        </div>

        {/* Transactions Table */}
        <Card className="glassmorphism bg-card/80 border border-border">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-transactions">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Description</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction, index) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
