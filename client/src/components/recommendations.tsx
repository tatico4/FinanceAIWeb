import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp, Target, Lightbulb, Download, Calendar } from "lucide-react";
import type { Recommendation } from "@shared/schema";

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="glassmorphism bg-card/80 border border-border">
        <CardContent className="p-8 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay Recomendaciones Disponibles</h3>
          <p className="text-muted-foreground">
            Sube más datos financieros para recibir recomendaciones personalizadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return PiggyBank;
      case 'investment':
        return TrendingUp;
      case 'budget':
        return Target;
      default:
        return Lightbulb;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'savings':
        return 'accent';
      case 'investment':
        return 'primary';
      case 'budget':
        return 'chart-3';
      default:
        return 'muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'chart-3';
      case 'low':
        return 'muted';
      default:
        return 'secondary';
    }
  };

  const savingsRecommendations = recommendations.filter(r => r.type === 'savings');
  const investmentRecommendations = recommendations.filter(r => r.type === 'investment');
  const budgetRecommendations = recommendations.filter(r => r.type === 'budget');

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Recomendaciones Inteligentes</h2>
        <p className="text-xl text-muted-foreground">
          Insights personalizados para mejorar tu salud financiera
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Savings Recommendations */}
        {savingsRecommendations.length > 0 && (
          <Card className="glassmorphism bg-card/80 border border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-accent to-primary rounded-lg flex items-center justify-center">
                  <PiggyBank className="h-5 w-5 text-primary-foreground" />
                </div>
                <span>Savings Opportunities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {savingsRecommendations.map((recommendation, index) => (
                <div 
                  key={recommendation.id || index} 
                  className={`bg-${getRecommendationColor(recommendation.type)}/10 border border-${getRecommendationColor(recommendation.type)}/20 rounded-lg p-4`}
                  data-testid={`recommendation-savings-${index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(recommendation.priority) as any}>
                        {recommendation.priority}
                      </Badge>
                      <span className={`text-${getRecommendationColor(recommendation.type)} font-semibold`}>
                        {recommendation.impact.includes('$') ? recommendation.impact : 'High Impact'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Investment Recommendations */}
        {investmentRecommendations.length > 0 && (
          <Card className="glassmorphism bg-card/80 border border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <span>Investment Opportunities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {investmentRecommendations.map((recommendation, index) => (
                <div 
                  key={recommendation.id || index} 
                  className={`bg-${getRecommendationColor(recommendation.type)}/10 border border-${getRecommendationColor(recommendation.type)}/20 rounded-lg p-4`}
                  data-testid={`recommendation-investment-${index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <Badge variant={getPriorityColor(recommendation.priority) as any}>
                      {recommendation.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
                  {recommendation.title.includes('Emergency Fund') && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Budget Recommendations */}
        {budgetRecommendations.length > 0 && (
          <Card className="glassmorphism bg-card/80 border border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-chart-3 to-primary rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary-foreground" />
                </div>
                <span>Budget Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgetRecommendations.map((recommendation, index) => (
                  <div 
                    key={recommendation.id || index} 
                    className={`bg-${getRecommendationColor(recommendation.type)}/10 border border-${getRecommendationColor(recommendation.type)}/20 rounded-lg p-4`}
                    data-testid={`recommendation-budget-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{recommendation.title}</h4>
                      <Badge variant={getPriorityColor(recommendation.priority) as any}>
                        {recommendation.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="text-center mt-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold transform hover:scale-105 transition-all"
            data-testid="button-download-report"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Report
          </Button>
          <Button 
            size="lg"
            variant="outline" 
            className="border-border hover:bg-secondary font-semibold"
            data-testid="button-schedule-consultation"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Schedule Consultation
          </Button>
        </div>
      </div>
    </div>
  );
}
