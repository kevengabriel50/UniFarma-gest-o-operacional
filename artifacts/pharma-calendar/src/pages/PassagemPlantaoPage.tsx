import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTasks,
  useCreateTask,
  useDeleteTask,
  useConcluirTask,
  useCreateRegistroPlantao,
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Priority = "Alta" | "Média" | "Baixa";
type MedicamentoStatus = "Em Falta" | "Baixo Estoque";
type Medicamento = { id: string; name: string; status: MedicamentoStatus };

const turnoLabel: Record<string, string> = {
  "manha-7-19": "Manhã (07h às 19h)",
  "manha-7-13": "Manhã (07h às 13h)",
  "tarde": "Tarde (13h às 19h)",
  "noite": "Noite (19h às 07h)",
};

export default function PassagemPlantaoPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const TASKS_KEY = ["/api/tasks"];

  const { data: allTasks = [], isLoading: isLoadingTasks } = useListTasks();
  const pendingTasks = allTasks.filter((t) => !t.concluida);

  const createTask = useCreateTask({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }) },
  });
  const deleteTask = useDeleteTask({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }) },
  });
  const concluirTask = useConcluirTask({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }) },
  });
  const createRegistro = useCreateRegistroPlantao({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/registros-plantao"] });
        navigate("/historico");
      },
    },
  });

  const [pendingConfirmId, setPendingConfirmId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("Média");
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([
    { id: "1", name: "Dipirona 500mg", status: "Em Falta" },
    { id: "2", name: "SF 0,9% 500ml", status: "Baixo Estoque" },
  ]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedStatus, setNewMedStatus] = useState<MedicamentoStatus>("Baixo Estoque");

  const [farmaceutico, setFarmaceutico] = useState("");
  const [turno, setTurno] = useState("manha-7-19");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [statusLeitos, setStatusLeitos] = useState("");
  const [intercorrencias, setIntercorrencias] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const handleConfirmTask = () => {
    if (!pendingConfirmId) return;
    const task = allTasks.find((t) => t.id === pendingConfirmId);
    concluirTask.mutate(
      { id: pendingConfirmId },
      {
        onSuccess: () => {
          toast({ title: "Tarefa confirmada", description: `"${task?.titulo}" foi concluída e registrada em Tasks.` });
        },
      }
    );
    setPendingConfirmId(null);
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate({ data: { titulo: newTaskTitle.trim(), prioridade: newTaskPriority } });
    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const removeMed = (id: string) => setMedicamentos(medicamentos.filter((m) => m.id !== id));
  const addMed = () => {
    if (!newMedName.trim()) return;
    setMedicamentos([...medicamentos, { id: Date.now().toString(), name: newMedName, status: newMedStatus }]);
    setNewMedName("");
  };

  const handleSavePlantao = () => {
    createRegistro.mutate({
      data: {
        farmaceutico,
        turno: turnoLabel[turno] ?? turno,
        data,
        statusLeitos,
        intercorrencias,
        observacoes,
      },
    });
    toast({ title: "Registro salvo", description: "A passagem de plantão foi registrada e enviada ao Histórico." });
  };

  const pendingTask = allTasks.find((t) => t.id === pendingConfirmId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <AlertDialog open={!!pendingConfirmId} onOpenChange={(open) => { if (!open) setPendingConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cumprimento de tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja confirmar a conclusão da tarefa{" "}
              <span className="font-semibold text-gray-800">"{pendingTask?.titulo}"</span>?
              <br />
              Ela será movida para a aba de <strong>Tasks</strong> como concluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTask}
              className="bg-[#00995D] hover:bg-[#007A48] text-white"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="bg-[#e6f7f0] border-[#a3e6c8]">
        <Tabs defaultValue="tasks" className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="bg-white/60 p-1">
              <TabsTrigger value="tasks" className="data-[state=active]:bg-[#00995D] data-[state=active]:text-white">Tasks do Turno</TabsTrigger>
              <TabsTrigger value="plantao" className="data-[state=active]:bg-[#00995D] data-[state=active]:text-white">Registro de Plantão</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-6">
            <TabsContent value="tasks" className="m-0 space-y-4">
              <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
                <div className="space-y-3">
                  {isLoadingTasks ? (
                    <div className="flex items-center justify-center py-4 gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Carregando...</span>
                    </div>
                  ) : pendingTasks.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">Nenhuma task pendente neste turno.</p>
                  ) : (
                    pendingTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-white border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => setPendingConfirmId(task.id)}
                            className="data-[state=checked]:bg-[#00995D] data-[state=checked]:border-[#00995D]"
                            data-testid={`checkbox-task-${task.id}`}
                          />
                          <span className="text-sm font-medium text-gray-700">{task.titulo}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={`
                              ${task.prioridade === "Alta" ? "bg-red-50 text-red-700 border-red-200" : ""}
                              ${task.prioridade === "Média" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : ""}
                              ${task.prioridade === "Baixa" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
                            `}
                          >
                            {task.prioridade}
                          </Badge>
                          <button
                            onClick={() => deleteTask.mutate({ id: task.id })}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            data-testid={`button-remove-task-${task.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {isAddingTask ? (
                  <div className="flex items-center gap-3 pt-2">
                    <Input
                      placeholder="Descrição da task..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && addTask()}
                      data-testid="input-new-task"
                    />
                    <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as Priority)}>
                      <SelectTrigger className="w-[120px]" data-testid="select-new-task-priority">
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addTask} className="bg-[#00995D] hover:bg-[#007A48]" data-testid="button-add-task">Adicionar</Button>
                    <Button variant="ghost" onClick={() => setIsAddingTask(false)}>Cancelar</Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingTask(true)}
                    className="w-full mt-2 text-[#00995D] border-[#00995D] hover:bg-[#e6f7f0]"
                    data-testid="button-new-task"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Nova Task
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="plantao" className="m-0 space-y-4">
              <div className="bg-white rounded-xl p-5 shadow-sm space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label>Farmacêutico Responsável</Label>
                    <Input
                      placeholder="Nome completo"
                      value={farmaceutico}
                      onChange={(e) => setFarmaceutico(e.target.value)}
                      data-testid="input-farmaceutico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Turno</Label>
                    <Select value={turno} onValueChange={setTurno}>
                      <SelectTrigger data-testid="select-turno">
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manha-7-19">Manhã (07h às 19h)</SelectItem>
                        <SelectItem value="manha-7-13">Manhã (07h às 13h)</SelectItem>
                        <SelectItem value="tarde">Tarde (13h às 19h)</SelectItem>
                        <SelectItem value="noite">Noite (19h às 07h)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      data-testid="input-data"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status dos Leitos / UTI</Label>
                  <Textarea
                    placeholder="Descreva a lotação e prioridades..."
                    rows={2}
                    value={statusLeitos}
                    onChange={(e) => setStatusLeitos(e.target.value)}
                    data-testid="textarea-leitos"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Intercorrências</Label>
                  <Textarea
                    placeholder="Registre aqui qualquer problema ou aviso importante..."
                    rows={3}
                    value={intercorrencias}
                    onChange={(e) => setIntercorrencias(e.target.value)}
                    data-testid="textarea-intercorrencias"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações Gerais</Label>
                  <Textarea
                    placeholder="Outras notas para o próximo plantão..."
                    rows={2}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    data-testid="textarea-observacoes"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleSavePlantao}
                    disabled={createRegistro.isPending}
                    className="bg-[#00995D] hover:bg-[#007A48] text-white px-8"
                    data-testid="button-salvar-plantao"
                  >
                    {createRegistro.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Salvar Registro
                  </Button>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <Card className="shadow-sm border-0">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#00995D]" />
            Medicamentos em Falta / Baixo Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {medicamentos.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
                <span className="font-medium text-sm text-gray-800">{med.name}</span>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={`${med.status === "Em Falta" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {med.status === "Em Falta" ? <AlertTriangle className="w-3 h-3 mr-1" /> : null}
                    {med.status}
                  </Badge>
                  <button onClick={() => removeMed(med.id)} className="text-gray-400 hover:text-red-500 transition-colors" data-testid={`button-remove-med-${med.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-3 pt-2">
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-gray-500">Novo Item</Label>
              <Input
                placeholder="Nome do medicamento..."
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMed()}
                data-testid="input-new-med"
              />
            </div>
            <div className="w-[180px] space-y-2">
              <Label className="text-xs text-gray-500">Status</Label>
              <Select value={newMedStatus} onValueChange={(v) => setNewMedStatus(v as MedicamentoStatus)}>
                <SelectTrigger data-testid="select-new-med-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Em Falta">Em Falta</SelectItem>
                  <SelectItem value="Baixo Estoque">Baixo Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addMed} className="bg-gray-800 hover:bg-gray-900 text-white" data-testid="button-add-med">
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
