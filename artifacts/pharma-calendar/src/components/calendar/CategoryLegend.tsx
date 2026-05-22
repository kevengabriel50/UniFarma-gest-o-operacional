import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/calendar-utils';
import type { CalendarEventCategory } from '@workspace/api-client-react';

export function CategoryLegend() {
  const categories = Object.keys(CATEGORY_COLORS) as CalendarEventCategory[];

  return (
    <div className="flex flex-wrap gap-3 mt-4 items-center">
      <span className="text-sm font-medium text-muted-foreground mr-2">Legenda:</span>
      {categories.map((cat) => {
        const colors = CATEGORY_COLORS[cat];
        return (
          <div key={cat} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm border"
              style={{ backgroundColor: colors.bg, borderColor: colors.border }}
            />
            <span className="text-sm text-foreground">{CATEGORY_LABELS[cat]}</span>
          </div>
        );
      })}
    </div>
  );
}
