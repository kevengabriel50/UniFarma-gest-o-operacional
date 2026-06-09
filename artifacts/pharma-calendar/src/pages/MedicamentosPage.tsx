import { useState, useRef, useEffect, useCallback } from "react";
import JsBarcode from "jsbarcode";
import {
  useListMedications,
  useCreateMedication,
  useUpdateMedication,
  useGetMedicationByBarcode,
  getListMedicationsQueryKey,
  getGetMedicationByBarcodeQueryKey,
} from "@workspace/api-client-react";
import type { Medication } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Pill,
  Plus,
  Search,
  Barcode,
  Pencil,
  PowerOff,
  Power,
  Loader2,
  Tag,
  Printer,
  X,
  PackageOpen,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type MedFormData = {
  codigoBarras: string;
  codigoInterno: string;
  nome: string;
  apresentacao: string;
  laboratorio: string;
  descricao: string;
  estoque: number;
};

const EMPTY_FORM: MedFormData = {
  codigoBarras: "",
  codigoInterno: "",
  nome: "",
  apresentacao: "",
  laboratorio: "",
  descricao: "",
  estoque: 0,
};

function stockBadge(estoque: number) {
  if (estoque === 0) return { label: "Sem estoque", className: "bg-red-100 text-red-700 border-red-200" };
  if (estoque < 5) return { label: `${estoque} un.`, className: "bg-red-100 text-red-700 border-red-200" };
  if (estoque < 10) return { label: `${estoque} un.`, className: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  return { label: `${estoque} un.`, className: "bg-green-50 text-green-700 border-green-200" };
}

// ── Label Print Component ─────────────────────────────────────────────────────
function LabelPrintModal({ med, onClose }: { med: Medication; onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && med.codigoBarras) {
      try {
        JsBarcode(svgRef.current, med.codigoBarras, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch {
        // barcode rendering failure is non-critical
      }
    }
  }, [med.codigoBarras]);

  const handlePrint = useCallback(() => {
    const labelLine = [med.nome, med.apresentacao].filter(Boolean).join(" ").toUpperCase();

    // Zebra GC420t: 76.2mm × 50.8mm, sem área não imprimível
    // Barras finas e curtas para caber em uma etiqueta (como na etiqueta real)
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    try {
      JsBarcode(tempSvg, med.codigoBarras, {
        format: "CODE128",
        width: 1.8,   // barras finas
        height: 40,   // barras curtas — adequado para etiqueta pequena
        displayValue: false,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch {
      // se falhar, usa SVG vazio
    }

    // Remove atributos width/height explícitos do SVG para o CSS controlar o tamanho
    tempSvg.removeAttribute("width");
    tempSvg.removeAttribute("height");
    const barcodeSvgHtml = tempSvg.outerHTML;

    // Janela de pré-impressão — tamanho próximo da etiqueta real
    const win = window.open("", "_blank", "width=290,height=200");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Etiqueta</title>
  <style>
    @page {
      size: 76.2mm 50.8mm;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 76.2mm;
      height: 50.8mm;
      overflow: hidden;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
    }
    .label {
      width: 76.2mm;
      height: 50.8mm;
      padding: 2.5mm 2mm 2mm 2mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }
    .label-name {
      font-weight: bold;
      font-size: 9pt;
      text-transform: uppercase;
      text-align: center;
      line-height: 1.15;
      letter-spacing: 0.02em;
      color: #000;
      word-break: break-word;
      max-height: 13mm;
      overflow: hidden;
    }
    .label-barcode {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .label-barcode svg {
      width: 70mm;
      height: 14mm;
      display: block;
    }
    .label-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 7.5pt;
      letter-spacing: 0.1em;
      color: #000;
      text-align: center;
    }
    .label-internal {
      font-size: 6.5pt;
      color: #333;
      text-align: center;
    }
    @media print {
      * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="label-name">${labelLine}</div>
    <div class="label-barcode">${barcodeSvgHtml}</div>
    <div class="label-code">${med.codigoBarras}</div>
    ${med.codigoInterno ? `<div class="label-internal">${med.codigoInterno}</div>` : ""}
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }<\/script>
</body>
</html>`);
    win.document.close();
  }, [med]);

  const labelLine = [med.nome, med.apresentacao].filter(Boolean).join(" ").toUpperCase();

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#00995D]" />
            Prévia da Etiqueta
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4 px-2 bg-white border border-gray-200 rounded-xl">
          <div className="text-center w-full" style={{ maxWidth: 260 }}>
            <p className="font-bold text-sm leading-tight uppercase tracking-wide text-gray-900">
              {labelLine}
            </p>
            <div className="mt-3 flex justify-center">
              <svg ref={svgRef} style={{ width: 220 }} />
            </div>
            <p className="font-mono text-xs mt-2 text-gray-700 tracking-widest">
              {med.codigoBarras}
            </p>
            {med.codigoInterno && (
              <p className="text-xs text-gray-400 mt-0.5">{med.codigoInterno}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4 mr-1.5" /> Fechar
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-[#00995D] hover:bg-[#007A48] text-white gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir Etiqueta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MedicamentosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [form, setForm] = useState<MedFormData>(EMPTY_FORM);
  const [labelMed, setLabelMed] = useState<Medication | null>(null);

  const [scanInput, setScanInput] = useState("");
  const [scanBarcode, setScanBarcode] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: medications = [], isLoading } = useListMedications(
    debouncedSearch ? { q: debouncedSearch } : {}
  );

  const { data: scannedMed, isError: scanNotFound } = useGetMedicationByBarcode(
    scanBarcode ?? "",
    { query: { enabled: !!scanBarcode, queryKey: getGetMedicationByBarcodeQueryKey(scanBarcode ?? "") } }
  );

  useEffect(() => {
    if (!scanBarcode) return;
    if (scannedMed) {
      openEdit(scannedMed);
      setScanBarcode(null);
      setScanInput("");
    } else if (scanNotFound) {
      setForm((f) => ({ ...f, codigoBarras: scanBarcode }));
      setEditingMed(null);
      setIsModalOpen(true);
      setScanBarcode(null);
      setScanInput("");
    }
  }, [scannedMed, scanNotFound, scanBarcode]);

  const createMutation = useCreateMedication({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey() });
        toast({ title: "Medicamento cadastrado com sucesso" });
        closeModal();
      },
      onError: (err: unknown) => {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : undefined;
        toast({ title: msg ?? "Erro ao cadastrar", variant: "destructive" });
      },
    },
  });

  const updateMutation = useUpdateMedication({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey() });
        toast({ title: "Medicamento atualizado" });
        closeModal();
      },
      onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
    },
  });

  function openEdit(med: Medication) {
    setEditingMed(med);
    setForm({
      codigoBarras: med.codigoBarras,
      codigoInterno: med.codigoInterno,
      nome: med.nome,
      apresentacao: med.apresentacao ?? "",
      laboratorio: med.laboratorio ?? "",
      descricao: med.descricao ?? "",
      estoque: med.estoque,
    });
    setIsModalOpen(true);
  }

  function openNew() {
    setEditingMed(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingMed(null);
    setForm(EMPTY_FORM);
  }

  function handleSave() {
    if (!form.codigoBarras || !form.codigoInterno || !form.nome) {
      toast({ title: "Preencha os campos obrigatórios (nome, cód. de barras e cód. interno)", variant: "destructive" });
      return;
    }
    const payload = {
      codigoBarras: form.codigoBarras,
      codigoInterno: form.codigoInterno,
      nome: form.nome,
      estoque: form.estoque,
      apresentacao: form.apresentacao || undefined,
      laboratorio: form.laboratorio || undefined,
      descricao: form.descricao || undefined,
    };
    if (editingMed) {
      updateMutation.mutate({ id: editingMed.id, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  }

  function handleToggleAtivo(med: Medication) {
    updateMutation.mutate({ id: med.id, data: { ativo: !med.ativo } });
  }

  function handleScanKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && scanInput.trim()) {
      setScanBarcode(scanInput.trim());
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 print:hidden">
      {labelMed && (
        <LabelPrintModal med={labelMed} onClose={() => setLabelMed(null)} />
      )}

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            ref={scanRef}
            placeholder="Bipe o código de barras para buscar ou cadastrar..."
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={handleScanKeyDown}
            className="pl-9 font-mono text-sm"
            data-testid="input-scan"
          />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, código ou laboratório..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
            data-testid="input-search"
          />
        </div>
        <Button
          onClick={openNew}
          className="bg-[#00995D] hover:bg-[#007A48] text-white gap-2 shrink-0"
          data-testid="button-novo-medicamento"
        >
          <Plus className="w-4 h-4" />
          Novo Medicamento
        </Button>
      </div>

      {/* Table */}
      <Card className="shadow-none border border-gray-100 overflow-hidden">
        <CardHeader className="bg-[#f7fdf9] border-b border-[#e6f7f0] px-5 py-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Pill className="w-4 h-4 text-[#00995D]" />
            Cadastro de Medicamentos
            {medications.length > 0 && (
              <Badge className="ml-1 bg-[#e6f7f0] text-[#00995D] border border-[#a3e6c8] text-xs">
                {medications.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : medications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2 text-center px-4">
              <div className="w-14 h-14 bg-[#e6f7f0] rounded-full flex items-center justify-center">
                <Pill className="w-7 h-7 text-[#00995D]" />
              </div>
              <p className="text-sm font-medium text-gray-500">Nenhum medicamento cadastrado</p>
              <p className="text-xs text-gray-400">
                Clique em "Novo Medicamento" ou bipe um código de barras para começar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Código</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nome</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Apresentação</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Laboratório</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estoque</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {medications.map((med) => {
                    const stock = stockBadge(med.estoque);
                    return (
                      <tr
                        key={med.id}
                        className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${!med.ativo ? "opacity-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-gray-500">{med.codigoInterno}</div>
                          <div className="font-mono text-[10px] text-gray-400">{med.codigoBarras}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{med.nome}</div>
                          {med.descricao && (
                            <div className="text-xs text-gray-400 truncate max-w-[180px]">{med.descricao}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{med.apresentacao ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{med.laboratorio ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={`text-xs font-semibold ${stock.className}`}>
                            {stock.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={med.ativo
                              ? "bg-green-50 text-green-700 border-green-200 text-xs"
                              : "bg-gray-100 text-gray-400 border-gray-200 text-xs"
                            }
                          >
                            {med.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => setLabelMed(med)}
                              className="p-1.5 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              title="Imprimir Etiqueta"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(med)}
                              className="p-1.5 rounded text-gray-400 hover:text-[#00995D] hover:bg-[#e6f7f0] transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleAtivo(med)}
                              className={`p-1.5 rounded transition-colors ${
                                med.ativo
                                  ? "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                                  : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                              }`}
                              title={med.ativo ? "Inativar" : "Reativar"}
                            >
                              {med.ativo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-[#00995D]" />
              {editingMed ? "Editar Medicamento" : "Novo Medicamento"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Código de Barras <span className="text-red-400">*</span>
              </Label>
              <Input
                value={form.codigoBarras}
                onChange={(e) => setForm((f) => ({ ...f, codigoBarras: e.target.value }))}
                placeholder="Ex: 7891234567890"
                className="font-mono text-sm"
                data-testid="input-codigo-barras"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Código Interno <span className="text-red-400">*</span>
              </Label>
              <Input
                value={form.codigoInterno}
                onChange={(e) => setForm((f) => ({ ...f, codigoInterno: e.target.value }))}
                placeholder="Ex: MED0001"
                className="font-mono text-sm"
                data-testid="input-codigo-interno"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">
                Nome do Medicamento <span className="text-red-400">*</span>
              </Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Dipirona"
                data-testid="input-nome"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Apresentação <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input
                value={form.apresentacao}
                onChange={(e) => setForm((f) => ({ ...f, apresentacao: e.target.value }))}
                placeholder="Ex: 500mg/ml"
                data-testid="input-apresentacao"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Laboratório <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input
                value={form.laboratorio}
                onChange={(e) => setForm((f) => ({ ...f, laboratorio: e.target.value }))}
                placeholder="Ex: EMS"
                data-testid="input-laboratorio"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Descrição <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Observações, indicações ou informações adicionais..."
                rows={2}
                className="resize-none text-sm"
                data-testid="input-descricao"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <PackageOpen className="w-3.5 h-3.5 text-[#00995D]" />
                Qtd. em Estoque <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                value={form.estoque}
                onChange={(e) => setForm((f) => ({ ...f, estoque: Math.max(0, Number(e.target.value)) }))}
                data-testid="input-estoque"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeModal} disabled={isSaving}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#00995D] hover:bg-[#007A48] text-white gap-2"
              data-testid="button-salvar-medicamento"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingMed ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
