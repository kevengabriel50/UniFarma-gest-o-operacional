import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORY_LABELS } from '@/lib/calendar-utils';
import { 
  CalendarEventCategory, 
  useCreateEvent, 
  useUpdateEvent,
  getListEventsQueryKey,
  getGetEventsSummaryQueryKey,
  getGetEventQueryKey,
  CalendarEvent
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  employeeName: z.string().optional(),
  category: z.nativeEnum(CalendarEventCategory),
  start: z.string().min(1, 'A data de início é obrigatória'),
  end: z.string().optional(),
  allDay: z.boolean().default(true),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<FormValues>;
  editingEventId?: number;
}

export function EventModal({ isOpen, onClose, initialData, editingEventId }: EventModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  
  const isEditing = !!editingEventId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      employeeName: '',
      category: CalendarEventCategory.ferias,
      start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      allDay: true,
      description: '',
      ...initialData
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: '',
        employeeName: '',
        category: CalendarEventCategory.ferias,
        start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        allDay: true,
        description: '',
        ...initialData
      });
    }
  }, [isOpen, initialData, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      end: values.end || undefined,
      employeeName: values.employeeName || undefined,
      description: values.description || undefined,
    };

    if (isEditing) {
      updateEvent.mutate(
        { id: editingEventId, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(editingEventId) });
            toast({ title: 'Evento atualizado com sucesso' });
            onClose();
          },
          onError: () => {
            toast({ title: 'Erro ao atualizar evento', variant: 'destructive' });
          }
        }
      );
    } else {
      createEvent.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
            toast({ title: 'Evento criado com sucesso' });
            onClose();
          },
          onError: () => {
            toast({ title: 'Erro ao criar evento', variant: 'destructive' });
          }
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Férias do João" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type={form.watch('allDay') ? 'date' : 'datetime-local'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Término (opcional)</FormLabel>
                    <FormControl>
                      <Input type={form.watch('allDay') ? 'date' : 'datetime-local'} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Dia inteiro
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes adicionais..." 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
