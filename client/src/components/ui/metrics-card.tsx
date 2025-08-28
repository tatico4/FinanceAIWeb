import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  description?: string;
  color?: 'primary' | 'accent' | 'destructive' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5';
  className?: string;
  'data-testid'?: string;
}

export default function MetricsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  description,
  color = 'primary',
  className,
  'data-testid': testId,
}: MetricsCardProps) {
  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-accent bg-accent/20';
      case 'down':
        return 'text-destructive bg-destructive/20';
      default:
        return 'text-muted-foreground bg-muted/20';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'accent':
        return 'text-accent bg-accent/20 border-accent/20';
      case 'destructive':
        return 'text-destructive bg-destructive/20 border-destructive/20';
      case 'chart-1':
        return 'text-chart-1 bg-chart-1/20 border-chart-1/20';
      case 'chart-2':
        return 'text-chart-2 bg-chart-2/20 border-chart-2/20';
      case 'chart-3':
        return 'text-chart-3 bg-chart-3/20 border-chart-3/20';
      case 'chart-4':
        return 'text-chart-4 bg-chart-4/20 border-chart-4/20';
      case 'chart-5':
        return 'text-chart-5 bg-chart-5/20 border-chart-5/20';
      default:
        return 'text-primary bg-primary/20 border-primary/20';
    }
  };

  return (
    <Card className={cn("glassmorphism bg-card/80 border border-border", className)} data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Icon className={cn("h-5 w-5", getColorClasses().split(' ')[0])} />
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          {trend && (
            <Badge variant="secondary" className={cn("text-xs", getTrendColor())}>
              {trend}
            </Badge>
          )}
        </div>
        <div className={cn("text-2xl font-bold mb-1", getColorClasses().split(' ')[0])}>
          {value}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
