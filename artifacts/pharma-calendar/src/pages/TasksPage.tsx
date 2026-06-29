import { useListTasks } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useListTasks();

  const concluidas = tasks.filter((t) => t.concluida);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  if (concluidas.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 bg-[#e6f7f0] rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-[#00995D]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma task concluída ainda</h1>
        <p className="text-gray-500 max-w-md">
          As tarefas confirmadas na Passagem de Plantão aparecerão aqui como registro de cumprimento.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-gray-800">Tasks Concluídas</h2>
        <p className="text-sm text-gray-500">Registro de tarefas confirmadas durante os plantões.</p>
      </div>

      <div className="space-y-3">
        {concluidas.map((task) => (
          <Card key={task.id} className="shadow-sm border border-gray-100">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#e6f7f0] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#00995D]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-through decoration-gray-400 truncate">{task.titulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {task.concluidaEm
                      ? `Concluída em ${format(new Date(task.concluidaEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                      : `Registrada em ${format(new Date(task.createdAt), "dd/MM/yyyy", { locale: ptBR })}`}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0
                  ${task.prioridade === "Alta" ? "bg-red-50 text-red-700 border-red-200" : ""}
                  ${task.prioridade === "Média" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : ""}
                  ${task.prioridade === "Baixa" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
                `}
              >
                {task.prioridade}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
