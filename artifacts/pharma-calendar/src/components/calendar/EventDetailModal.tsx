import { useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/calendar-utils';
import { 
  useDeleteEvent,
  getListEventsQueryKey,
  getGetEventsSummaryQueryKey,
  CalendarEvent
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit2, Trash2, Calendar, User, AlignLeft, Clock } from 'lucide-react';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
}

export function EventDetailModal({ event, isOpen, onClose, onEdit }: EventDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteEvent = useDeleteEvent();

  if (!event) return null;

  const colors = CATEGORY_COLORS[event.category];
  const label = CATEGORY_LABELS[event.category];

  const handleDelete = () => {
    deleteEvent.mutate(
      { id: event.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
          toast({ title: 'Evento removido com sucesso' });
          onClose();
        },
        onError: () => {
          toast({ title: 'Erro ao remover evento', variant: 'destructive' });
        }
      }
    );
  };

  const formatDate = (dateStr: string, allDay: boolean) => {
    const d = parseISO(dateStr);
    if (allDay) {
      return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    return format(d, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-sm border"
              style={{ backgroundColor: colors.bg, borderColor: colors.border }}
            />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          </div>
          <DialogTitle className="text-xl">{event.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Início</p>
              <p className="text-sm text-muted-foreground">{formatDate(event.start, event.allDay)}</p>
            </div>
          </div>
          
          {event.end && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Término</p>
                <p className="text-sm text-muted-foreground">{formatDate(event.end, event.allDay)}</p>
              </div>
            </div>
          )}
          
          {event.employeeName && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Funcionário</p>
                <p className="text-sm text-muted-foreground">{event.employeeName}</p>
              </div>
            </div>
          )}
          
          {event.description && (
            <div className="flex items-start gap-3">
              <AlignLeft className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Descrição</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center sm:justify-between border-t pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O evento será permanentemente removido.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button 
            onClick={() => {
              onClose();
              onEdit(event);
            }} 
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
