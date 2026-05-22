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

type AppContextType = {
  completedTasks: CompletedTask[];
  addCompletedTask: (task: CompletedTask) => void;
  plantaoRecords: PlantaoRecord[];
  addPlantaoRecord: (record: PlantaoRecord) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [plantaoRecords, setPlantaoRecords] = useState<PlantaoRecord[]>([]);

  const addCompletedTask = (task: CompletedTask) => {
    setCompletedTasks((prev) => [task, ...prev]);
  };

  const addPlantaoRecord = (record: PlantaoRecord) => {
    setPlantaoRecords((prev) => [record, ...prev]);
  };

  return (
    <AppContext.Provider value={{ completedTasks, addCompletedTask, plantaoRecords, addPlantaoRecord }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
