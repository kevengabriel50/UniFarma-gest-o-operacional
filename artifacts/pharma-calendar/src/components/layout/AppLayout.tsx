import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CalendarDays, 
  ClipboardList, 
  CheckSquare, 
  Pill, 
  History, 
  Menu,
  X,
  Home,
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/", label: "Calendário", icon: CalendarDays },
  { path: "/passagem", label: "Passagem de Plantão", icon: ClipboardList },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/medicamentos", label: "Medicamentos", icon: Pill },
  { path: "/dom", label: "DOM", icon: Home },
  { path: "/historico", label: "Histórico", icon: History },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentItem = navItems.find((item) => item.path === location);
  const pageTitle = currentItem ? currentItem.label : "Gestão Operacional";

  return (
    <div className="flex min-h-[100dvh] w-full bg-[#f7faf8]">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[#007A48] text-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-[#00663c]">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">UniFarma</span>
            <span className="text-[10px] font-medium text-[#a3e6c8] uppercase tracking-wider">Gestão Operacional</span>
          </div>
          <button 
            className="md:hidden text-white/80 hover:text-white"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-white text-[#00995D] shadow-sm" 
                    : "text-white/90 hover:bg-[#00995D]/40"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#00995D]" : "text-white/70"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              US
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Usuário do Sistema</span>
              <span className="text-xs text-white/60">Farmacêutico</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white border-b border-[#e6f7f0] flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden text-gray-500 hover:text-gray-900"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{pageTitle}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#00995D] flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-[#e6f7f0]">
              US
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
