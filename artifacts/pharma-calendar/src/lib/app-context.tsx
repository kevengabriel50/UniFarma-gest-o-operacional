import { createContext, useContext, ReactNode } from "react";

type AppContextType = Record<string, never>;

const AppContext = createContext<AppContextType>({});

export function AppProvider({ children }: { children: ReactNode }) {
  return <AppContext.Provider value={{}}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
