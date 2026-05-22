import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Priority = "Alta" | "Média" | "Baixa";
type Task = { id: string; title: string; priority: Priority; done: boolean };
type MedicamentoStatus = "Em Falta" | "Baixo Estoque";
type Medicamento = { id: string; name: string; status: MedicamentoStatus };

export default function PassagemPlantaoPage() {
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Verificar temperatura da câmara fria", priority: "Alta", done: false },
    { id: "2", title: "Registrar saída de NPT do paciente 312", priority: "Média", done: false },
    { id: "3", title: "Confirmar recebimento de hemoderivados", priority: "Baixa", done: false },
  ]);

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([
    { id: "1", name: "Dipirona 500mg", status: "Em Falta" },
    { id: "2", name: "SF 0,9% 500ml", status: "Baixo Estoque" },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("Média");
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [newMedName, setNewMedName] = useState("");
  const [newMedStatus, setNewMedStatus] = useState<MedicamentoStatus>("Baixo Estoque");

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), title: newTaskTitle, priority: newTaskPriority, done: false }]);
    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const removeMed = (id: string) => {
    setMedicamentos(medicamentos.filter(m => m.id !== id));
  };

  const addMed = () => {
    if (!newMedName.trim()) return;
    setMedicamentos([...medicamentos, { id: Date.now().toString(), name: newMedName, status: newMedStatus }]);
    setNewMedName("");
  };

  const handleSavePlantao = () => {
    toast({
      title: "Registro salvo",
      description: "A passagem de plantão foi registrada com sucesso.",
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
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
                  {tasks.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">Nenhuma task pendente.</p>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${task.done ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={task.done} 
                            onCheckedChange={() => toggleTask(task.id)} 
                            className="data-[state=checked]:bg-[#00995D] data-[state=checked]:border-[#00995D]"
                          />
                          <span className={`text-sm font-medium ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className={`
                              ${task.priority === 'Alta' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                              ${task.priority === 'Média' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                              ${task.priority === 'Baixa' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            `}
                          >
                            {task.priority}
                          </Badge>
                          <button onClick={() => removeTask(task.id)} className="text-gray-400 hover:text-red-500 transition-colors">
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
                    />
                    <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as Priority)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addTask} className="bg-[#00995D] hover:bg-[#007A48]">Adicionar</Button>
                    <Button variant="ghost" onClick={() => setIsAddingTask(false)}>Cancelar</Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setIsAddingTask(true)} className="w-full mt-2 text-[#00995D] border-[#00995D] hover:bg-[#e6f7f0]">
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
                    <Input placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Turno</Label>
                    <Select defaultValue="Manhã">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manhã">Manhã (07h-19h)</SelectItem>
                        <SelectItem value="Tarde">Tarde (13h-19h)</SelectItem>
                        <SelectItem value="Noite">Noite (19h-07h)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status dos Leitos / UTI</Label>
                  <Textarea placeholder="Descreva a lotação e prioridades..." rows={2} />
                </div>
                
                <div className="space-y-2">
                  <Label>Intercorrências</Label>
                  <Textarea placeholder="Registre aqui qualquer problema ou aviso importante..." rows={3} />
                </div>
                
                <div className="space-y-2">
                  <Label>Observações Gerais</Label>
                  <Textarea placeholder="Outras notas para o próximo plantão..." rows={2} />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button onClick={handleSavePlantao} className="bg-[#00995D] hover:bg-[#007A48] text-white px-8">
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
                    className={`
                      ${med.status === 'Em Falta' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                    `}
                  >
                    {med.status === 'Em Falta' ? <AlertTriangle className="w-3 h-3 mr-1" /> : null}
                    {med.status}
                  </Badge>
                  <button onClick={() => removeMed(med.id)} className="text-gray-400 hover:text-red-500 transition-colors">
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
              />
            </div>
            <div className="w-[180px] space-y-2">
              <Label className="text-xs text-gray-500">Status</Label>
              <Select value={newMedStatus} onValueChange={(v) => setNewMedStatus(v as MedicamentoStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Em Falta">Em Falta</SelectItem>
                  <SelectItem value="Baixo Estoque">Baixo Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addMed} className="bg-gray-800 hover:bg-gray-900 text-white">
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
