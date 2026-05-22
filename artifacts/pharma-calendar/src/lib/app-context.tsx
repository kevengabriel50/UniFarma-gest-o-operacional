import { createContext, useContext, useState, ReactNode } from "react";

export type Priority = "Alta" | "Média" | "Baixa";

export type CompletedTask = {
  id: string;
  title: string;
  priority: Priority;
  completedAt: string;
};

export type PlantaoRecord = {
  id: string;
  farmaceutico: string;
  turno: string;
  data: string;
  statusLeitos: string;
  intercorrencias: string;
  observacoes: string;
  savedAt: string;
};

export type Recado = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  pinned: boolean;
};

type AppContextType = {
  completedTasks: CompletedTask[];
  addCompletedTask: (task: CompletedTask) => void;
  plantaoRecords: PlantaoRecord[];
  addPlantaoRecord: (record: PlantaoRecord) => void;
  recados: Recado[];
  addRecado: (recado: Recado) => void;
  removeRecado: (id: string) => void;
  togglePinRecado: (id: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [plantaoRecords, setPlantaoRecords] = useState<PlantaoRecord[]>([]);
  const [recados, setRecados] = useState<Recado[]>([
    {
      id: "demo-1",
      author: "Dra. Ana Paula",
      content: "Atenção: o fornecedor de hemoderivados avisou atraso na entrega desta semana. Verificar estoque antes de cada dispensação.",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      pinned: true,
    },
    {
      id: "demo-2",
      author: "Farm. Carlos",
      content: "Câmara fria B foi calibrada hoje. Relatório de temperatura disponível na pasta compartilhada.",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      pinned: false,
    },
  ]);

  const addCompletedTask = (task: CompletedTask) =>
    setCompletedTasks((prev) => [task, ...prev]);

  const addPlantaoRecord = (record: PlantaoRecord) =>
    setPlantaoRecords((prev) => [record, ...prev]);

  const addRecado = (recado: Recado) =>
    setRecados((prev) => [recado, ...prev]);

  const removeRecado = (id: string) =>
    setRecados((prev) => prev.filter((r) => r.id !== id));

  const togglePinRecado = (id: string) =>
    setRecados((prev) =>
      prev.map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r))
    );

  return (
    <AppContext.Provider
      value={{
        completedTasks,
        addCompletedTask,
        plantaoRecords,
        addPlantaoRecord,
        recados,
        addRecado,
        removeRecado,
        togglePinRecado,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
