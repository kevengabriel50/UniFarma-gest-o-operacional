import { CalendarView } from '@/components/calendar/CalendarView';
import { SummaryPanel } from '@/components/calendar/SummaryPanel';
import { CategoryLegend } from '@/components/calendar/CategoryLegend';

export default function CalendarPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 flex flex-col gap-4">
          <CalendarView />
          <CategoryLegend />
        </div>
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <SummaryPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
