import { useState, useRef, useEffect } from "react";
import {
  useListDomAtendimentos,
  useCreateDomAtendimento,
  useGetDomAtendimento,
  useFinalizeDomAtendimento,
  useAddDomItem,
  useDeleteDomItem,
  useGetMedicationByBarcode,
  // Assumindo a existência das mutações de update e delete com base no padrão da API
  useUpdateDomAtendimento, 
  useDeleteDomAtendimento,
  getListDomAtendimentosQueryKey,
  getGetDomAtendimentoQueryKey,
  getGetMedicationByBarcodeQueryKey,
} from "@workspace/api-client-react";
import type { DomAtendimento, DomItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  Plus,
  Barcode,
  Trash2,
  ChevronLeft,
  Loader2,
  Search,
  ClipboardCheck,
  CheckCircle2,
  Printer,
  Edit2,
  Settings2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Step = "list" | "novo" | "editar_cadastro" | "itens" | "revisao";

type ItemDraft = {
  id?: number;
  codigoBarras: string;
  codigoInterno: string;
  nome: string;
  lote: string;
  quantidade: number;
};

const EMPTY_ITEM: ItemDraft = {
  codigoBarras: "",
  codigoInterno: "",
  nome: "",
  lote: "",
  quantidade: 1,
};

function PrintView({ atendimento, itens }: { atendimento: DomAtendimento; itens: DomItem[] }) {
  return (
    <div id="dom-print-area" className="hidden print:block p-8 font-sans text-sm text-black">
      <div className="border-b-2 border-black pb-4 mb-4">
        <h1 className="text-2xl font-bold">UniFarma — Atendimento DOM</h1>
        <p className="text-gray-500 text-xs mt-1">Unimed Londrina — Farmácia Hospitalar — Pronto Atendimento</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div><span className="font-semibold">Paciente:</span> {atendimento.nomePaciente}</div>
        <div><span className="font-semibold">Nº Atendimento:</span> {atendimento.numeroAtendimento}</div>
        <div><span className="font-semibold">Data:</span> {format(new Date(atendimento.data + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</div>
        <div><span className="font-semibold">Status:</span> {atendimento.status === "finalizado" ? "Finalizado" : "Em andamento"}</div>
        {atendimento.observacoes && <div className="col-span-2"><span className="font-semibold">Observações:</span> {atendimento.observacoes}</div>}
      </div>
      <table className="w-full border-collapse border border-gray-300 text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 text-left">Código EAN / Interno</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Nome</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Lote</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Qtd</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.id}>
              <td className="border border-gray-300 px-2 py-1 font-mono">
                {item.codigoBarras ? `${item.codigoBarras} / ` : ""}{item.codigoInterno}
              </td>
              <td className="border border-gray-300 px-2 py-1">{item.nome}</td>
              <td className="border border-gray-300 px-2 py-1 font-mono">{item.lote}</td>
              <td className="border border-gray-300 px-2 py-1 text-center font-bold">{item.quantidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-400">Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>
    </div>
  );
}

export default function DomPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("list");
  const [currentAtendimentoId, setCurrentAtendimentoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [cadastroForm, setCadastroForm] = useState({ nomePaciente: "", numeroAtendimento: "", data: new Date().toISOString().split("T")[0], observacoes: "" });
  const [itemDraft, setItemDraft] = useState<ItemDraft>(EMPTY_ITEM);
  const [isManualItem, setIsManualItem] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanBarcode, setScanBarcode] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const scanRef = useRef<HTMLInputElement>(null);

  const { data: atendimentos = [], isLoading: isLoadingList } = useListDomAtendimentos();
  const { data: atendimentoDetail } = useGetDomAtendimento(currentAtendimentoId ?? 0, {
    query: {
      enabled: !!currentAtendimentoId && (step === "itens" || step === "revisao" || step === "editar_cadastro"),
      queryKey: getGetDomAtendimentoQueryKey(currentAtendimentoId ?? 0),
    },
  });

  // Preenche o formulário de cadastro quando os detalhes do atendimento carregarem (para edição)
  useEffect(() => {
    if (atendimentoDetail && step === "editar_cadastro") {
      setCadastroForm({
        nomePaciente: atendimentoDetail.nomePaciente,
        numeroAtendimento: atendimentoDetail.numeroAtendimento,
        data: atendimentoDetail.data,
        observacoes: atendimentoDetail.observacoes || "",
      });
    }
  }, [atendimentoDetail, step]);

  const { data: scannedMed, isError: scanNotFound } = useGetMedicationByBarcode(
    scanBarcode ?? "",
    { query: { enabled: !!scanBarcode, queryKey: getGetMedicationByBarcodeQueryKey(scanBarcode ?? "") } }
  );

  useEffect(() => {
    if (!scanBarcode) return;
    if (scannedMed) {
      setItemDraft((d) => ({
        ...d,
        codigoBarras: scannedMed.codigoBarras,
        codigoInterno: scannedMed.codigoInterno,
        nome: scannedMed.nome,
      }));
      setIsManualItem(true);
      setScanBarcode(null);
      setScanInput("");
    } else if (scanNotFound) {
      setItemDraft((d) => ({ ...d, codigoBarras: scanBarcode }));
      setIsManualItem(true);
      setScanBarcode(null);
      setScanInput("");
      toast({ title: "Medicamento não encontrado", description: "Preencha os dados manualmente." });
    }
  }, [scannedMed, scanNotFound, scanBarcode]);

  const createAtendimentoMutation = useCreateDomAtendimento({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListDomAtendimentosQueryKey() });
        setCurrentAtendimentoId(data.id);
        setStep("itens");
      },
      onError: () => toast({ title: "Erro ao criar atendimento", variant: "destructive" }),
    },
  });

  const updateAtendimentoMutation = useUpdateDomAtendimento({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDomAtendimentosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDomAtendimentoQueryKey(currentAtendimentoId ?? 0) });
        toast({ title: "Cadastro atualizado com sucesso" });
        setStep("itens");
      },
      onError: () => toast({ title: "Erro ao atualizar cadastro", variant: "destructive" }),
    },
  });

  const deleteAtendimentoMutation = useDeleteDomAtendimento({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDomAtendimentosQueryKey() });
        toast({ title: "Atendimento removido com sucesso" });
        setStep("list");
        setCurrentAtendimentoId(null);
      },
      onError: () => toast({ title: "Erro ao excluir atendimento", variant: "destructive" }),
    },
  });

  const addItemMutation = useAddDomItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDomAtendimentoQueryKey(currentAtendimentoId ?? 0) });
        setItemDraft(EMPTY_ITEM);
        setIsManualItem(false);
        toast({ title: "Item salvo com sucesso" });
      },
      onError: () => toast({ title: "Erro ao salvar item", variant: "destructive" }),
    },
  });

  const deleteItemMutation = useDeleteDomItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDomAtendimentoQueryKey(currentAtendimentoId ?? 0) });
      },
      onError: () => toast({ title: "Erro ao remover item", variant: "destructive" }),
    },
  });

  const finalizeMutation = useFinalizeDomAtendimento({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDomAtendimentosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDomAtendimentoQueryKey(currentAtendimentoId ?? 0) });
        toast({ title: "Atendimento finalizado com sucesso" });
        setStep("list");
        setCurrentAtendimentoId(null);
        setCheckedItems(new Set());
      },
      onError: () => toast({ title: "Erro ao finalizar atendimento", variant: "destructive" }),
    },
  });

  function handleScanKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && scanInput.trim()) {
      setScanBarcode(scanInput.trim());
    }
  }

  function handleAddItem() {
    if (!itemDraft.codigoBarras || !itemDraft.codigoInterno || !itemDraft.nome || !itemDraft.lote || itemDraft.quantidade < 1) {
      toast({ title: "Preencha todos os campos do item", variant: "destructive" });
      return;
    }
    addItemMutation.mutate({ id: currentAtendimentoId ?? 0, data: itemDraft });
  }

  function handleEditItemInline(item: DomItem) {
    // Carrega o rascunho de volta para edição no topo e remove momentaneamente da lista
    setItemDraft({
      id: item.id,
      codigoBarras: item.codigoBarras || "",
      codigoInterno: item.codigoInterno,
      nome: item.nome,
      lote: item.lote,
      quantidade: item.quantidade,
    });
    setIsManualItem(true);
    deleteItemMutation.mutate({ atendimentoId: currentAtendimentoId ?? 0, itemId: item.id });
    toast({ title: "Item carregado para edição" });
  }

  function handleDeleteAtendimento() {
    if (window.confirm("Tem certeza absoluta de que deseja excluir este atendimento e todos os seus itens?")) {
      deleteAtendimentoMutation.mutate({ id: currentAtendimentoId ?? 0 });
    }
  }

  function handleFinalizar() {
    finalizeMutation.mutate({ id: currentAtendimentoId ?? 0 });
  }

  const filteredAtendimentos = atendimentos.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.nomePaciente.toLowerCase().includes(q) ||
      a.numeroAtendimento.toLowerCase().includes(q)
    );
  });

  const currentItens: DomItem[] = atendimentoDetail?.itens ?? [];
  const allChecked = currentItens.length > 0 && checkedItems.size === currentItens.length;

  // ── STEP: LIST ──────────────────────────────────────────────────────────────
  if (step === "list") {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por paciente ou número de atendimento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <Button
            onClick={() => { setCadastroForm({ nomePaciente: "", numeroAtendimento: "", data: new Date().toISOString().split("T")[0], observacoes: "" }); setStep("novo"); }}
            className="bg-[#00995D] hover:bg-[#007A48] text-white gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Atendimento
          </Button>
        </div>

        <Card className="shadow-none border border-gray-100 overflow-hidden">
          <CardHeader className="bg-[#f7fdf9] border-b border-[#e6f7f0] px-5 py-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Home className="w-4 h-4 text-[#00995D]" />
              Atendimentos DOM
              {filteredAtendimentos.length > 0 && (
                <Badge className="bg-[#e6f7f0] text-[#00995D] border border-[#a3e6c8] text-xs">
                  {filteredAtendimentos.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingList ? (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : filteredAtendimentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2 text-center px-4">
                <div className="w-14 h-14 bg-[#e6f7f0] rounded-full flex items-center justify-center">
                  <Home className="w-7 h-7 text-[#00995D]" />
                </div>
                <p className="text-sm font-medium text-gray-500">Nenhum atendimento registrado</p>
                <p className="text-xs text-gray-400">Clique em "Novo Atendimento" para iniciar.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredAtendimentos.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => { setCurrentAtendimentoId(a.id); setStep("itens"); }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{a.nomePaciente}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Atend. {a.numeroAtendimento} · {format(new Date(a.data + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={a.status === "finalizado"
                        ? "bg-green-50 text-green-700 border-green-200 text-xs"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                      }
                    >
                      {a.status === "finalizado" ? "Finalizado" : "Em andamento"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── STEP: NOVO & EDITAR CADASTRO ────────────────────────────────────────────
  if (step === "novo" || step === "editar_cadastro") {
    const isEditing = step === "editar_cadastro";
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
        <button onClick={() => setStep(isEditing ? "itens" : "list")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <Card className="shadow-none border border-gray-100">
          <CardHeader className="border-b border-[#e6f7f0] bg-[#f7fdf9]">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="w-5 h-5 text-[#00995D]" />
              {isEditing ? "Alterar Dados do Atendimento" : "Novo Atendimento DOM"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome do Paciente <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="Nome completo"
                  value={cadastroForm.nomePaciente}
                  onChange={(e) => setCadastroForm((f) => ({ ...f, nomePaciente: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Número do Atendimento <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="Ex: 2024001234"
                  value={cadastroForm.numeroAtendimento}
                  onChange={(e) => setCadastroForm((f) => ({ ...f, numeroAtendimento: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={cadastroForm.data}
                  onChange={(e) => setCadastroForm((f) => ({ ...f, data: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações (opcional)</Label>
              <Textarea
                placeholder="Informações adicionais..."
                value={cadastroForm.observacoes}
                onChange={(e) => setCadastroForm((f) => ({ ...f, observacoes: e.target.value }))}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              {isEditing ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAtendimento}
                  disabled={deleteAtendimentoMutation.isPending}
                  className="gap-1.5"
                >
                  {deleteAtendimentoMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Excluir Atendimento
                </Button>
              ) : <div />}

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(isEditing ? "itens" : "list")}>Cancelar</Button>
                <Button
                  onClick={() => {
                    if (isEditing) {
                      updateAtendimentoMutation.mutate({ id: currentAtendimentoId ?? 0, data: cadastroForm });
                    } else {
                      createAtendimentoMutation.mutate({ data: cadastroForm });
                    }
                  }}
                  disabled={!cadastroForm.nomePaciente || !cadastroForm.numeroAtendimento || createAtendimentoMutation.isPending || updateAtendimentoMutation.isPending}
                  className="bg-[#00995D] hover:bg-[#007A48] text-white gap-2"
                >
                  {(createAtendimentoMutation.isPending || updateAtendimentoMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEditing ? "Salvar Alterações" : "Iniciar Atendimento"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── STEP: ITENS ─────────────────────────────────────────────────────────────
  if (step === "itens") {
    const atend = atendimentoDetail;
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
        <button onClick={() => setStep("list")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        {atend && (
          <Card className="shadow-none border border-gray-100 bg-[#f7fdf9]">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-gray-800">{atend.nomePaciente}</p>
                <p className="text-xs text-gray-400">Atend. {atend.numeroAtendimento} · {format(new Date(atend.data + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep("editar_cadastro")}
                  className="gap-1.5 text-gray-600 border-gray-200"
                >
                  <Settings2 className="w-3.5 h-3.5" /> Editar Cadastro / Excluir
                </Button>
                <Badge className={atend.status === "finalizado" ? "bg-green-50 text-green-700 border-green-200 text-xs" : "bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"}>
                  {atend.status === "finalizado" ? "Finalizado (Modo Edição)" : "Em andamento"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scan / Add item */}
        <Card className="shadow-none border border-gray-100">
          <CardHeader className="border-b border-gray-100 px-5 py-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Barcode className="w-4 h-4 text-[#00995D]" /> Adicionar Medicamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {!isManualItem ? (
              <div className="space-y-2">
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    ref={scanRef}
                    placeholder="Bipe o código de barras..."
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={handleScanKeyDown}
                    className="pl-9 font-mono text-sm"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">ou</p>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => setIsManualItem(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar manualmente
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Código de Barras *</Label>
                    <Input
                      value={itemDraft.codigoBarras}
                      onChange={(e) => setItemDraft((d) => ({ ...d, codigoBarras: e.target.value }))}
                      className="font-mono text-sm"
                      placeholder="Ex: 7891234567890"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Código Interno *</Label>
                    <Input
                      value={itemDraft.codigoInterno}
                      onChange={(e) => setItemDraft((d) => ({ ...d, codigoInterno: e.target.value }))}
                      className="font-mono text-sm"
                      placeholder="Ex: MED0001"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Nome do Medicamento *</Label>
                    <Input
                      value={itemDraft.nome}
                      onChange={(e) => setItemDraft((d) => ({ ...d, nome: e.target.value }))}
                      placeholder="Ex: Dipirona 500mg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Lote *</Label>
                    <Input
                      value={itemDraft.lote}
                      onChange={(e) => setItemDraft((d) => ({ ...d, lote: e.target.value }))}
                      className="font-mono text-sm"
                      placeholder="Ex: LOT2024A"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quantidade *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={itemDraft.quantidade}
                      onChange={(e) => setItemDraft((d) => ({ ...d, Policy: undefined, quantidade: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="ghost" size="sm" onClick={() => { setIsManualItem(false); setItemDraft(EMPTY_ITEM); }}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddItem}
                    disabled={addItemMutation.isPending}
                    className="bg-[#00995D] hover:bg-[#007A48] text-white gap-2"
                  >
                    {addItemMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Salvar Item
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items list */}
        {currentItens.length > 0 && (
          <Card className="shadow-none border border-gray-100 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Itens Registrados ({currentItens.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {currentItens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.nome}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {item.codigoBarras ? `EAN: ${item.codigoBarras} · ` : ""}CÓD: {item.codigoInterno} · Lote: {item.lote} · Qtd: <span className="font-bold text-gray-600">{item.quantidade}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEditItemInline(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="Editar item diretamente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteItemMutation.mutate({ atendimentoId: currentAtendimentoId ?? 0, itemId: item.id })}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {atend?.status === "finalizado" && (
            <Button variant="outline" onClick={() => setStep("revisao")}>
              Voltar para Revisão
            </Button>
          )}
          <Button
            onClick={() => setStep("revisao")}
            disabled={currentItens.length === 0}
            className="bg-[#00995D] hover:bg-[#007A48] text-white gap-2"
          >
            <ClipboardCheck className="w-4 h-4" />
            Conferir e Avançar ({currentItens.length} {currentItens.length === 1 ? "item" : "itens"})
          </Button>
        </div>
      </div>
    );
  }

  // ── STEP: REVISAO ───────────────────────────────────────────────────────────
  const atend = atendimentoDetail;
  const isFinalizado = atend?.status === "finalizado";

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5 print:p-0">
      {atend && (
        <PrintView atendimento={atend} itens={currentItens} />
      )}

      <div className="print:hidden">
        <button
          onClick={() => setStep(isFinalizado ? "list" : "itens")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar à lista
        </button>

        {atend && (
          <Card className="shadow-none border border-gray-100 bg-[#f7fdf9] mb-5">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-gray-800">{atend.nomePaciente}</p>
                <p className="text-xs text-gray-400">Atend. {atend.numeroAtendimento} · {format(new Date(atend.data + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</p>
                {atend.observacoes && <p className="text-xs text-gray-500 mt-1 italic">{atend.observacoes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" onClick={() => setStep("itens")}>
                  <Edit2 className="w-3.5 h-3.5" /> Editar Itens
                </Button>
                <Badge
                  className={isFinalizado
                    ? "bg-green-50 text-green-700 border-green-200 text-xs"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                  }
                >
                  {isFinalizado ? "Finalizado" : "Em andamento"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {!isFinalizado && (
          <Card className="shadow-none border border-yellow-200 bg-yellow-50 mb-5">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Confirme que os medicamentos e quantidades conferem com a dispensação realizada.
              </p>
              <p className="text-xs text-yellow-600 mt-1">Marque cada item individualmente para habilitar a finalização.</p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-none border border-gray-100 overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Medicamentos Dispensados ({currentItens.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {currentItens.map((item) => (
                <div key={item.id} className="flex items-start gap-4 px-5 py-3.5">
                  {!isFinalizado && (
                    <Checkbox
                      checked={checkedItems.has(item.id)}
                      onCheckedChange={(checked) => {
                        setCheckedItems((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(item.id); else next.delete(item.id);
                          return next;
                        });
                      }}
                      className="mt-0.5 data-[state=checked]:bg-[#00995D] data-[state=checked]:border-[#00995D]"
                    />
                  )}
                  {isFinalizado && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.nome}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {item.codigoBarras ? `EAN: ${item.codigoBarras} · ` : ""}CÓD: {item.codigoInterno} · Lote: {item.lote}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold text-gray-800">{item.quantidade}</span>
                    <p className="text-[10px] text-gray-400">unid.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-2 text-gray-600"
          >
            <Printer className="w-4 h-4" />
            Imprimir PDF
          </Button>

          {!isFinalizado && (
            <Button
              onClick={handleFinalizar}
              disabled={!allChecked || finalizeMutation.isPending}
              className="bg-[#00995D] hover:bg-[#007A48] text-white gap-2"
            >
              {finalizeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <CheckCircle2 className="w-4 h-4" />
              Finalizar Atendimento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}