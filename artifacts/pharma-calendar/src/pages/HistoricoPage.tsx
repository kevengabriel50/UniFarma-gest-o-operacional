import { useAppContext } from "@/lib/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HistoricoPage() {
  const { plantaoRecords } = useAppContext();

  if (plantaoRecords.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 bg-[#e6f7f0] rounded-full flex items-center justify-center mb-6">
          <History className="w-10 h-10 text-[#00995D]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nenhum registro ainda</h1>
        <p className="text-gray-500 max-w-md">
          Os registros salvos na Passagem de Plantão aparecerão aqui com todos os detalhes do turno.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-gray-800">Histórico de Plantões</h2>
        <p className="text-sm text-gray-500">Registros salvos das passagens de plantão.</p>
      </div>

      <div className="space-y-4">
        {plantaoRecords.map((record) => (
          <Card key={record.id} className="shadow-sm border border-gray-100 overflow-hidden">
            <CardHeader className="pb-3 bg-[#f7fdf9] border-b border-[#e6f7f0] px-5 py-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#00995D] flex items-center justify-center shrink-0">
                    <History className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Passagem de Plantão</p>
                    <p className="text-xs text-gray-400">
                      Registrado em {format(new Date(record.savedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#e6f7f0] text-[#00995D] border border-[#a3e6c8] hover:bg-[#e6f7f0]">
                  {record.turno}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-[#00995D] shrink-0" />
                  <span className="font-medium truncate">{record.farmaceutico || "Não informado"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4 text-[#00995D] shrink-0" />
                  <span>
                    {record.data
                      ? format(new Date(record.data + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })
                      : "Não informada"}
                  </span>
                </div>
              </div>

              {record.statusLeitos && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Status dos Leitos</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">{record.statusLeitos}</p>
                </div>
              )}

              {record.intercorrencias && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Intercorrências</p>
                  <p className="text-sm text-gray-700 bg-red-50 rounded-lg p-3 border border-red-100">{record.intercorrencias}</p>
                </div>
              )}

              {record.observacoes && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Observações Gerais</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">{record.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
