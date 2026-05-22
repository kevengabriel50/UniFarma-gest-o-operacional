import type { CalendarEvent, CalendarEventCategory } from '@workspace/api-client-react';

export const CATEGORY_COLORS: Record<CalendarEventCategory, { bg: string, border: string, text: string }> = {
  ferias: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }, // warm amber/yellow
  folga: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' }, // soft teal/green
  afastamento: { bg: '#FFEDD5', border: '#F97316', text: '#9A3412' }, // orange/coral
  troca_plantao: { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' }, // blue/indigo
  treinamento: { bg: '#F3E8FF', border: '#A855F7', text: '#581C87' }, // purple/violet
};

export const CATEGORY_LABELS: Record<CalendarEventCategory, string> = {
  ferias: 'Férias',
  folga: 'Folga',
  afastamento: 'Afastamento',
  troca_plantao: 'Troca de Plantão',
  treinamento: 'Treinamento',
};

export function mapEventToFullCalendar(event: CalendarEvent) {
  const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.ferias;
  
  return {
    id: event.id.toString(),
    title: event.title,
    start: event.start,
    end: event.end || undefined,
    allDay: event.allDay,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text,
    extendedProps: {
      category: event.category,
      description: event.description,
      employeeName: event.employeeName,
      createdAt: event.createdAt
    }
  };
}
