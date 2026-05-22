import { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import ptBRLocale from '@fullcalendar/core/locales/pt-br';
import { 
  useListEvents, 
  useUpdateEvent,
  getListEventsQueryKey,
  getGetEventsSummaryQueryKey,
  CalendarEvent
} from '@workspace/api-client-react';
import { mapEventToFullCalendar } from '@/lib/calendar-utils';
import { EventModal } from './EventModal';
import { EventDetailModal } from './EventDetailModal';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

export function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const { data: events, isLoading } = useListEvents();
  const updateEvent = useUpdateEvent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [createModalData, setCreateModalData] = useState<any>({});
  const [editingEventId, setEditingEventId] = useState<number | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const mappedEvents = events?.map(mapEventToFullCalendar) || [];

  const handleDateClick = (arg: any) => {
    setEditingEventId(undefined);
    setCreateModalData({
      start: arg.dateStr + (arg.allDay ? '' : 'T00:00'),
      allDay: arg.allDay,
    });
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const eventId = parseInt(arg.event.id);
    const event = events?.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setIsDetailModalOpen(true);
    }
  };

  const handleEventDrop = (arg: any) => {
    const eventId = parseInt(arg.event.id);
    const payload = {
      start: arg.event.startStr,
      end: arg.event.endStr || undefined,
      allDay: arg.event.allDay,
    };

    updateEvent.mutate(
      { id: eventId, data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
          toast({ title: 'Evento movido com sucesso' });
        },
        onError: () => {
          arg.revert();
          toast({ title: 'Erro ao mover evento', variant: 'destructive' });
        }
      }
    );
  };

  const handleEventResize = (arg: any) => {
    const eventId = parseInt(arg.event.id);
    const payload = {
      start: arg.event.startStr,
      end: arg.event.endStr || undefined,
      allDay: arg.event.allDay,
    };

    updateEvent.mutate(
      { id: eventId, data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
          toast({ title: 'Evento redimensionado com sucesso' });
        },
        onError: () => {
          arg.revert();
          toast({ title: 'Erro ao redimensionar evento', variant: 'destructive' });
        }
      }
    );
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setCreateModalData({
      title: event.title,
      employeeName: event.employeeName,
      category: event.category,
      start: event.start.slice(0, 16),
      end: event.end ? event.end.slice(0, 16) : undefined,
      allDay: event.allDay,
      description: event.description,
    });
    setIsCreateModalOpen(true);
  };

  return (
    <>
      <Card className="p-4 bg-card border shadow-sm">
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale={ptBRLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listMonth'
            }}
            events={mappedEvents}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            height="auto"
            contentHeight={800}
            eventClassNames="cursor-pointer font-medium text-xs rounded-sm px-1 py-0.5"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDayText="Dia Int."
          />
        </div>
      </Card>

      <EventModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        initialData={createModalData}
        editingEventId={editingEventId}
      />

      <EventDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        event={selectedEvent}
        onEdit={openEditModal}
      />
    </>
  );
}
