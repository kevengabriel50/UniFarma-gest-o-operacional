import { CheckSquare } from "lucide-react";

export default function TasksPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 bg-[#e6f7f0] rounded-full flex items-center justify-center mb-6">
        <CheckSquare className="w-10 h-10 text-[#00995D]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tasks em construção</h1>
      <p className="text-gray-500 max-w-md">
        Esta seção será implementada em breve. O gerenciamento completo de tarefas da equipe estará disponível aqui.
      </p>
    </div>
  );
}
