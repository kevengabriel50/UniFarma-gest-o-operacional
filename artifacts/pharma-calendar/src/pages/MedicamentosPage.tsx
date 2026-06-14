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

// ── Label printing — HTML/CSS via browser print dialog ───────────────────────
// Zebra GC420t: 76.2mm × 50.8mm at 203dpi
// Adjust these constants and use test mode to calibrate for your label stock.
const LABEL_DEFAULT_W = 76.2;
const LABEL_DEFAULT_H = 50.8;
const LABEL_PAD = 2.5; // mm internal padding

/** Render CODE128 barcode to a PNG data-URL using JsBarcode + canvas. */
function generateBarcodePng(code: string): string | null {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, code, {
      format: "CODE128",
      width: 4,        // 4px per narrow bar → good resolution when scaled to label width
      height: 100,
      displayValue: false,
      margin: 0,
      background: "#ffffff",
      lineColor: "#000000",
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** Build the full HTML document for the dedicated print popup. */
function buildLabelHtml(params: {
  name: string;
  barcodePng: string | null;
  code: string;
  internalCode?: string;
  wMm: number;
  hMm: number;
  testMode: boolean;
}): string {
  const { name, barcodePng, code, internalCode, wMm, hMm, testMode } = params;
  const testBorder = testMode ? "border: 0.5mm solid #000;" : "";
  const testDimsEl = testMode
    ? `<div style="position:fixed;bottom:0.8mm;right:1.2mm;font-family:monospace;font-size:5pt;color:#aaa;">${wMm}\u00d7${hMm}mm</div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Etiqueta</title>
  <style>
    @page {
      size: ${wMm}mm ${hMm}mm;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${wMm}mm;
      height: ${hMm}mm;
      overflow: hidden;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label {
      width: ${wMm}mm;
      height: ${hMm}mm;
      padding: ${LABEL_PAD}mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      ${testBorder}
    }
    .name {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      width: 100%;
      line-height: 1.25;
      word-break: break-word;
    }
    .barcode-wrap {
      width: 100%;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1mm 0;
    }
    .barcode-wrap img {
      width: 100%;
      height: auto;
      display: block;
      image-rendering: crisp-edges;
      image-rendering: -webkit-optimize-contrast;
    }
    .code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 7pt;
      text-align: center;
      letter-spacing: 1px;
      width: 100%;
    }
    .internal {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 6pt;
      text-align: center;
      color: #666;
      width: 100%;
      margin-top: 0.5mm;
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="name">${name}</div>
    <div class="barcode-wrap">
      ${barcodePng
        ? `<img src="${barcodePng}" alt="barcode" />`
        : `<p style="font-size:7pt;color:#c00;font-family:Arial">Código inválido</p>`}
    </div>
    <div class="code">${code}</div>
    ${internalCode ? `<div class="internal">${internalCode}</div>` : ""}
  </div>
  ${testDimsEl}
  <script>
    window.onload = function() {
      ${testMode
        ? "/* Modo de teste — pressione Ctrl+P ou Cmd+P para imprimir */"
        : "setTimeout(function() { window.print(); }, 400);"}
    };
  <\/script>
</body>
</html>`;
}

// ── Label Print Component ─────────────────────────────────────────────────────
function LabelPrintModal({ med, onClose }: { med: Medication; onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [wMm, setWMm] = useState(LABEL_DEFAULT_W);
  const [hMm, setHMm] = useState(LABEL_DEFAULT_H);
  const [testMode, setTestMode] = useState(false);

  const labelLine = [med.nome, med.apresentacao].filter(Boolean).join(" ").toUpperCase();

  // Render barcode SVG preview inside modal
  useEffect(() => {
    if (svgRef.current && med.codigoBarras) {
      try {
        JsBarcode(svgRef.current, med.codigoBarras, {
          format: "CODE128",
          width: 2,
          height: 55,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch { /* non-critical */ }
    }
  }, [med.codigoBarras]);

  const openPrintWindow = useCallback(() => {
    const barcodePng = generateBarcodePng(med.codigoBarras);
    const html = buildLabelHtml({
      name: labelLine,
      barcodePng,
      code: med.codigoBarras,
      internalCode: med.codigoInterno ?? undefined,
      wMm,
      hMm,
      testMode,
    });
    const win = window.open("", "_blank", `width=${Math.round(wMm * 4)},height=${Math.round(hMm * 4 + 60)}`);
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }, [med, labelLine, wMm, hMm, testMode]);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#00995D]" />
            Imprimir Etiqueta
          </DialogTitle>
        </DialogHeader>

        {/* Prévia visual da etiqueta */}
        <div className="flex flex-col items-center gap-2 py-3 px-2 bg-white border border-gray-200 rounded-xl">
          <p className="font-bold text-xs leading-tight uppercase tracking-wide text-gray-900 text-center max-w-[230px]">
            {labelLine}
          </p>
          <svg ref={svgRef} style={{ width: 230 }} />
          <p className="font-mono text-[11px] text-gray-700 tracking-widest">{med.codigoBarras}</p>
          {med.codigoInterno && (
            <p className="text-[10px] text-gray-400">{med.codigoInterno}</p>
          )}
        </div>

        {/* Dimensões configuráveis */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-600">Dimensões da etiqueta (mm)</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <Label className="text-[11px] text-gray-500 w-10 shrink-0">Largura</Label>
              <Input
                type="number"
                value={wMm}
                onChange={(e) => setWMm(parseFloat(e.target.value) || LABEL_DEFAULT_W)}
                className="h-7 text-xs"
                step={0.5}
                min={20}
                max={200}
              />
            </div>
            <span className="text-xs text-gray-400">×</span>
            <div className="flex items-center gap-1.5 flex-1">
              <Label className="text-[11px] text-gray-500 w-10 shrink-0">Altura</Label>
              <Input
                type="number"
                value={hMm}
                onChange={(e) => setHMm(parseFloat(e.target.value) || LABEL_DEFAULT_H)}
                className="h-7 text-xs"
                step={0.5}
                min={20}
                max={200}
              />
            </div>
            <button
              onClick={() => { setWMm(LABEL_DEFAULT_W); setHMm(LABEL_DEFAULT_H); }}
              className="text-[11px] text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded hover:bg-gray-100"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Toggle modo de teste */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
          <div>
            <p className="text-xs font-medium text-gray-700">Modo de teste</p>
            <p className="text-[11px] text-gray-400 leading-tight">Borda visível + dimensões · sem auto-imprimir</p>
          </div>
          <button
            onClick={() => setTestMode((v) => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
              testMode ? "bg-[#00995D]" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                testMode ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Instruções do diálogo de impressão */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 space-y-0.5">
          <p className="text-[11px] font-medium text-gray-600 mb-1">No diálogo de impressão:</p>
          <p className="text-[11px] text-gray-500">• Impressora: <span className="text-gray-700 font-medium">ZDesigner GC420t (EPL)</span></p>
          <p className="text-[11px] text-gray-500">• Papel: <span className="text-gray-700 font-medium">User defined — {wMm} × {hMm} mm</span></p>
          <p className="text-[11px] text-gray-500">• Margens: <span className="text-gray-700 font-medium">Nenhuma</span></p>
          <p className="text-[11px] text-gray-500">• Escala: <span className="text-gray-700 font-medium">100%</span></p>
          <p className="text-[11px] text-gray-500">• Cabeçalho/Rodapé: <span className="text-gray-700 font-medium">Desmarcar</span></p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-3.5 h-3.5 mr-1" /> Fechar
          </Button>
          <Button
            size="sm"
            onClick={openPrintWindow}
            className="bg-[#00995D] hover:bg-[#007A48] text-white gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            {testMode ? "Abrir prévia de teste" : "Abrir para imprimir"}
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
