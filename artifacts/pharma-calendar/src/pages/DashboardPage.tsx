import { useState, useMemo } from "react";
import { useListEvents, useListMedications } from "@workspace/api-client-react";
import { useAppContext } from "@/lib/app-context";
import { getBrazilianHolidays } from "@/lib/holidays";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/calendar-utils";
import type { CalendarEventCategory } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Umbrella,
  Coffee,
  Stethoscope,
  ArrowLeftRight,
  GraduationCap,
  CalendarX,
  Pin,
  PinOff,
  Trash2,
  Plus,
  MessageSquare,
  Bell,
  PackageOpen,
  AlertTriangle,
} from "lucide-react";
import { format, differenceInDays, parseISO, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORY_ICONS: Record<CalendarEventCategory, typeof Umbrella> = {
  ferias: Umbrella,
  folga: Coffee,
  afastamento: Stethoscope,
  troca_plantao: ArrowLeftRight,
  treinamento: GraduationCap,
};

function urgencyBadge(dateStr: string) {
  const diff = differenceInDays(parseISO(dateStr), new Date());
  if (diff <= 0) return { label: "Hoje", className: "bg-red-100 text-red-700 border-red-200" };
  if (diff === 1) return { label: "Amanhã", className: "bg-orange-100 text-orange-700 border-orange-200" };
  if (diff <= 3) return { label: `${diff} dias`, className: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  return { label: `${diff} dias`, className: "bg-blue-50 text-blue-700 border-blue-200" };
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days !== 1 ? "s" : ""}`;
}

export default function DashboardPage() {
  const { data: events } = useListEvents();
  const { recados, addRecado, removeRecado, togglePinRecado } = useAppContext();
  const { data: allMedications = [] } = useListMedications({});

  const [isAddingRecado, setIsAddingRecado] = useState(false);
  const [newAuthor, setNewAuthor] = useState("");
  const [newContent, setNewContent] = useState("");

  const lowStockMeds = useMemo(() => {
    return allMedications
      .filter((m) => m.ativo && m.estoque < 10)
      .sort((a, b) => a.estoque - b.estoque);
  }, [allMedications]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 7);

    const calendarItems = (events ?? [])
      .filter((e) => {
        const d = parseISO(e.start);
        return d >= today && d <= cutoff;
      })
      .map((e) => ({
        id: `event-${e.id}`,
        kind: "event" as const,
        title: e.title,
        date: e.start,
        category: e.category,
        employeeName: e.employeeName ?? undefined,
      }));

    const year = today.getFullYear();
    const holidays = getBrazilianHolidays(year)
      .filter((h) => {
        const d = parseISO(h.date);
        return d >= today && d <= cutoff;
      })
      .map((h) => ({
        id: `holiday-${h.date}`,
        kind: "holiday" as const,
        title: h.title,
        date: h.date,
      }));

    return [...calendarItems, ...holidays].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [events]);

  const sortedRecados = useMemo(() => {
    const pinned = recados.filter((r) => r.pinned);
    const unpinned = recados.filter((r) => !r.pinned);
    return [...pinned, ...unpinned];
  }, [recados]);

  const handleAddRecado = () => {
    if (!newContent.trim()) return;
    addRecado({
      id: Date.now().toString(),
      author: newAuthor.trim() || "Anônimo",
      content: newContent.trim(),
      createdAt: new Date().toISOString(),
      pinned: false,
    });
    setNewAuthor("");
    setNewContent("");
    setIsAddingRecado(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-10">

      {/* Upcoming events timeline */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#e6f7f0] flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#00995D]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">Próximos 7 dias</h2>
              <p className="text-xs text-gray-400">Eventos e feriados se aproximando</p>
            </div>
          </div>
          {upcomingEvents.length > 0 && (
            <Badge className="bg-[#e6f7f0] text-[#00995D] border border-[#a3e6c8]">
              {upcomingEvents.length} evento{upcomingEvents.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {upcomingEvents.length === 0 ? (
          <Card className="border-dashed border-gray-200 shadow-none">
            <CardContent className="py-10 flex flex-col items-center text-center gap-2">
              <CalendarX className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-400 font-medium">Nenhum evento nos próximos 7 dias</p>
              <p className="text-xs text-gray-300">Os eventos cadastrados no calendário aparecerão aqui</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* timeline line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200" />
            <div className="space-y-3">
              {upcomingEvents.map((item) => {
                if (item.kind === "holiday") {
                  const badge = urgencyBadge(item.date);
                  return (
                    <div key={item.id} className="relative flex items-start gap-4 pl-12">
                      <div className="absolute left-0 top-2.5 w-10 flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-white shadow-sm flex items-center justify-center z-10">
                          <CalendarX className="w-4 h-4 text-red-500" />
                        </div>
                      </div>
                      <Card className="flex-1 border border-red-100 bg-red-50/40 shadow-none">
                        <CardContent className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-red-700 truncate">{item.title}</p>
                            <p className="text-xs text-red-400 mt-0.5">
                              Feriado Nacional · {format(parseISO(item.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                            </p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  );
                }

                const colors = CATEGORY_COLORS[item.category];
                const Icon = CATEGORY_ICONS[item.category];
                const badge = urgencyBadge(item.date);
                return (
                  <div key={item.id} className="relative flex items-start gap-4 pl-12">
                    <div className="absolute left-0 top-2.5 w-10 flex justify-center">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <Icon className="w-4 h-4" style={{ color: colors.text }} />
                      </div>
                    </div>
                    <Card
                      className="flex-1 shadow-none"
                      style={{ borderColor: colors.border + "88", backgroundColor: colors.bg + "44" }}
                    >
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate" style={{ color: colors.text }}>
                              {item.title}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 font-medium"
                              style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.bg }}
                            >
                              {CATEGORY_LABELS[item.category]}
                            </Badge>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: colors.text + "99" }}>
                            {item.employeeName ? `${item.employeeName} · ` : ""}
                            {format(parseISO(item.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Stock alerts */}
      {lowStockMeds.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-yellow-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900 leading-tight">Alertas de Estoque</h2>
              <p className="text-xs text-gray-400">Medicamentos com quantidade baixa</p>
            </div>
            <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">
              {lowStockMeds.length} item{lowStockMeds.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {lowStockMeds.map((med) => {
              const isCritical = med.estoque < 5;
              return (
                <Card
                  key={med.id}
                  className={`shadow-none ${
                    isCritical
                      ? "border-red-200 bg-red-50/40"
                      : "border-yellow-200 bg-yellow-50/40"
                  }`}
                >
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                          isCritical ? "bg-red-100" : "bg-yellow-100"
                        }`}
                      >
                        <PackageOpen className={`w-4 h-4 ${isCritical ? "text-red-500" : "text-yellow-600"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isCritical ? "text-red-800" : "text-yellow-900"}`}>
                          {med.nome}
                        </p>
                        {med.apresentacao && (
                          <p className={`text-xs truncate ${isCritical ? "text-red-400" : "text-yellow-600"}`}>
                            {med.apresentacao}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 font-bold text-sm px-2.5 ${
                        isCritical
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }`}
                    >
                      {med.estoque === 0 ? "Sem estoque" : `${med.estoque} un.`}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Recados */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#e6f7f0] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#00995D]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">Recados</h2>
              <p className="text-xs text-gray-400">Avisos e comunicados da equipe</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddingRecado((v) => !v)}
            className="bg-[#00995D] hover:bg-[#007A48] text-white gap-1.5"
            data-testid="button-new-recado"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo recado
          </Button>
        </div>

        {isAddingRecado && (
          <Card className="mb-4 border-[#a3e6c8] bg-[#f7fdf9] shadow-none">
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Seu nome (opcional)</Label>
                <Input
                  placeholder="Ex: Farm. João Silva"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="text-sm"
                  data-testid="input-recado-author"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">
                  Recado <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  placeholder="Digite o aviso ou recado para a equipe..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  autoFocus
                  className="text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddRecado();
                  }}
                  data-testid="input-recado-content"
                />
                <p className="text-[10px] text-gray-400">Ctrl+Enter para publicar</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsAddingRecado(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddRecado}
                  disabled={!newContent.trim()}
                  className="bg-[#00995D] hover:bg-[#007A48] text-white"
                  data-testid="button-submit-recado"
                >
                  Publicar recado
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sortedRecados.length === 0 ? (
          <Card className="border-dashed border-gray-200 shadow-none">
            <CardContent className="py-10 flex flex-col items-center text-center gap-2">
              <MessageSquare className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-400 font-medium">Nenhum recado ainda</p>
              <p className="text-xs text-gray-300">Clique em "Novo recado" para deixar um aviso</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedRecados.map((recado) => (
              <Card
                key={recado.id}
                className={`shadow-none transition-colors ${
                  recado.pinned
                    ? "border-[#a3e6c8] bg-[#f7fdf9]"
                    : "border-gray-100 bg-white"
                }`}
                data-testid={`card-recado-${recado.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold select-none ${
                          recado.pinned
                            ? "bg-[#00995D] text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {recado.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-gray-800">{recado.author}</span>
                          {recado.pinned && (
                            <Badge className="bg-[#e6f7f0] text-[#00995D] border border-[#a3e6c8] text-[10px] px-1.5 py-0 gap-0.5 font-medium">
                              <Pin className="w-2.5 h-2.5" />
                              Fixado
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400">{timeAgo(recado.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{recado.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      <button
                        onClick={() => togglePinRecado(recado.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          recado.pinned
                            ? "text-[#00995D] hover:bg-[#e6f7f0]"
                            : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                        }`}
                        title={recado.pinned ? "Desafixar" : "Fixar"}
                        data-testid={`button-pin-recado-${recado.id}`}
                      >
                        {recado.pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => removeRecado(recado.id)}
                        className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Excluir recado"
                        data-testid={`button-remove-recado-${recado.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
