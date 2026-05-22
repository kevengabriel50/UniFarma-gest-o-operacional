import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/calendar-utils';
import { useGetEventsSummary } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarEventCategory } from '@workspace/api-client-react';

export function SummaryPanel() {
  const { data: summary, isLoading, isError } = useGetEventsSummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar resumo.</p>
        </CardContent>
      </Card>
    );
  }

  const categories = Object.keys(CATEGORY_COLORS) as CalendarEventCategory[];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Resumo do Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="font-medium text-sm text-foreground">Total de Eventos</span>
            <span className="font-bold text-lg">{summary.total}</span>
          </div>
          
          <div className="space-y-3">
            {categories.map(cat => {
              const count = summary.byCategory?.[cat] || 0;
              const colors = CATEGORY_COLORS[cat];
              
              return (
                <div key={cat} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm border"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                    />
                    <span className="text-sm text-muted-foreground">{CATEGORY_LABELS[cat]}</span>
                  </div>
                  <span className="font-medium text-sm">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
