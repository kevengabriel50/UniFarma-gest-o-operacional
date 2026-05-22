import { CalendarView } from '@/components/calendar/CalendarView';
import { SummaryPanel } from '@/components/calendar/SummaryPanel';
import { CategoryLegend } from '@/components/calendar/CategoryLegend';
import { Stethoscope } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-card-foreground leading-tight">Calendário Operacional</h1>
            <p className="text-xs text-muted-foreground font-medium">Farmácia Hospitalar</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 flex flex-col gap-4">
            <CalendarView />
            <CategoryLegend />
          </div>
          <div className="xl:col-span-1">
            <div className="sticky top-24">
              <SummaryPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
