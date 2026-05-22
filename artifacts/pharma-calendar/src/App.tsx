import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import CalendarPage from "@/pages/CalendarPage";
import LoginPage from "@/pages/LoginPage";
import PassagemPlantaoPage from "@/pages/PassagemPlantaoPage";
import DashboardPage from "@/pages/DashboardPage";
import TasksPage from "@/pages/TasksPage";
import MedicamentosPage from "@/pages/MedicamentosPage";
import HistoricoPage from "@/pages/HistoricoPage";
import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={CalendarPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/passagem" component={PassagemPlantaoPage} />
        <Route path="/tasks" component={TasksPage} />
        <Route path="/medicamentos" component={MedicamentosPage} />
        <Route path="/historico" component={HistoricoPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {!isAuthenticated ? (
            <LoginPage onLogin={() => setIsAuthenticated(true)} />
          ) : (
            <Router />
          )}
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
