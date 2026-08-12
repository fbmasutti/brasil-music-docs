import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sliders, Plus, Download, Trash2, Wand2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  PageContainer,
  Section,
  EmptyState,
  FieldGrid,
  TextField,
  TextAreaField,
  ItemActions,
} from "@/components/ui-kit";
import { useList, useInsert, useUpdate, useRemove, useProfile } from "@/lib/queries";
import { useActiveFormation } from "@/lib/active-formation";
import { paletteOf } from "@/lib/brand-presets";
import { downloadPdf, type PdfBlock } from "@/lib/pdf";
import {
  StagePlot,
  StageItemLabels,
  StagePlotPrintable,
  parseStagePlot,
  useStageHistory,
  PRINT_PLOT_WIDTH,
  PRINT_PLOT_HEIGHT_PORTRAIT,
  PRINT_PLOT_HEIGHT_LANDSCAPE,
} from "@/components/StagePlot";
import { toPng } from "html-to-image";
import { RIDER_PRESETS, presetToStageItems } from "@/lib/rider-presets";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { PdfOrientation } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/riders")({
  head: () => ({
    meta: [
      { title: "Rider técnico e mapa de palco — StageKit" },
      {
        name: "description",
        content:
          "Crie o rider técnico em um clique a partir de formatos prontos, ajuste o mapa de palco e exporte em PDF.",
      },
      { property: "og:title", content: "Rider técnico — StageKit" },
      {
        property: "og:description",
        content: "Rider técnico e de hospitalidade profissional em PDF, sem formulário longo.",
      },
    ],
  }),
  component: RidersPage,
});

type RiderRow = {
  id: string;
  name: string;
  formation_id: string | null;
  channel_list: unknown;
  stage_plot?: unknown;
  sound_requirements: string | null;
  console_specs?: string | null;
  pa_specs?: string | null;
  monitor_specs?: string | null;
  lighting_requirements: string | null;
  backline: string | null;
  hospitality: string | null;
  rooming_list: string | null;
};

type ChannelRow = { id: string; instrument: string; mic: string; phantom: boolean; pedestal: boolean; monitor: string };
type BacklineRow = { id: string; item: string };

// Curada de propósito — cobre o que a maioria dos riders realmente usa, sem
// virar um catálogo de microfones. "Outro" cobre o resto por texto livre.
const MIC_OPTIONS = [
  "SM58 (dinâmico vocal)",
  "SM57 (dinâmico instrumental)",
  "Beta 52 (bumbo/grave)",
  "Condensador cardioide",
  "Sem fio de mão",
  "Lapela/Headset sem fio",
  "DI (ativo/passivo)",
];

type ChannelRecord = {
  instrument: string;
  mic: string;
  phantom?: boolean;
  pedestal?: boolean;
  monitor?: string;
};

function parseChannelEntry(entry: unknown): ChannelRow {
  if (entry && typeof entry === "object" && "instrument" in entry) {
    const r = entry as ChannelRecord;
    return {
      id: crypto.randomUUID(),
      instrument: r.instrument ?? "",
      mic: r.mic ?? "",
      phantom: Boolean(r.phantom),
      pedestal: Boolean(r.pedestal),
      monitor: r.monitor ?? "",
    };
  }
  const line = String(entry ?? "");
  const [instrument, ...rest] = line.split(" — ");
  return { id: crypto.randomUUID(), instrument: instrument ?? "", mic: rest.join(" — "), phantom: false, pedestal: false, monitor: "" };
}

function parseChannelLine(line: string): ChannelRow {
  return parseChannelEntry(line);
}

function channelRowsToList(rows: ChannelRow[]): ChannelRecord[] {
  return rows
    .filter((r) => r.instrument.trim() || r.mic.trim())
    .map((r) => ({
      instrument: r.instrument.trim(),
      mic: r.mic.trim(),
      phantom: r.phantom,
      pedestal: r.pedestal,
      monitor: r.monitor.trim(),
    }));
}

function parseBacklineRows(value: string | null | undefined): BacklineRow[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ id: crypto.randomUUID(), item: line }));
}

function backlineRowsToText(rows: BacklineRow[]): string {
  return rows.filter((r) => r.item.trim()).map((r) => r.item.trim()).join("\n");
}

const empty = {
  name: "",
  formation_id: "",
  sound_requirements: "",
  console_specs: "",
  pa_specs: "",
  monitor_specs: "",
  lighting_requirements: "",
  backline: "",
  hospitality: "",
  rooming_list: "",
};

type RiderTab = "channels" | "som" | "luz" | "hospitality" | "mapa";

function RidersPage() {
  const { data: profile } = useProfile();
  const { data: riders = [] } = useList("technical_riders", { order: { column: "name" } });
  const { data: formations = [] } = useList("formations", { order: { column: "name" } });
  const { data: brandKits = [] } = useList("brand_kits");
  const { activeFormationId, activeFormation } = useActiveFormation();
  const insert = useInsert("technical_riders", "Rider salvo");
  const duplicate = useInsert("technical_riders", "Rider duplicado");
  const update = useUpdate("technical_riders", "Rider atualizado");
  const remove = useRemove("technical_riders", "Rider removido");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [pendingExport, setPendingExport] = useState<{
    rider: RiderRow;
    orientation: PdfOrientation;
  } | null>(null);
  const [tab, setTab] = useState<RiderTab>("channels");
  const printRef = useRef<HTMLDivElement>(null);
  // O histórico mora aqui, não dentro do canvas: a grade e a lista de rótulos editam as
  // mesmas peças e precisam empilhar no mesmo desfazer.
  const stageHistory = useStageHistory([]);
  const stage = stageHistory.items;
  const setStage = stageHistory.set;
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [backlineRows, setBacklineRows] = useState<BacklineRow[]>([]);
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function addChannelRow() {
    setChannels((rows) => [...rows, { id: crypto.randomUUID(), instrument: "", mic: "", phantom: false, pedestal: false, monitor: "" }]);
  }
  function updateChannelRow(id: string, patch: Partial<ChannelRow>) {
    setChannels((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeChannelRow(id: string) {
    setChannels((rows) => rows.filter((r) => r.id !== id));
  }

  function addBacklineRow() {
    setBacklineRows((rows) => [...rows, { id: crypto.randomUUID(), item: "" }]);
  }
  function updateBacklineRow(id: string, item: string) {
    setBacklineRows((rows) => rows.map((r) => (r.id === id ? { ...r, item } : r)));
  }
  function removeBacklineRow(id: string) {
    setBacklineRows((rows) => rows.filter((r) => r.id !== id));
  }

  /** O preset pré-preenche o formulário e abre o modal — o usuário revisa
   * (ou ajusta o mapa de palco) antes de confirmar, em vez de o rider
   * aparecer direto na lista sem ele perceber. */
  function createFromPreset(id: string) {
    const preset = RIDER_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const taken = riders.filter((r) => r.name.startsWith(preset.label)).length;
    setEditingId(null);
    setFormOpen(true);
    setTab("channels");
    setForm({
      ...empty,
      name: taken ? `${preset.label} (${taken + 1})` : preset.label,
      formation_id: activeFormationId ?? "",
      sound_requirements: preset.sound,
      lighting_requirements: preset.lighting,
      backline: preset.backline,
      hospitality: preset.hospitality,
    });
    stageHistory.reset(presetToStageItems(preset));
    setChannels(preset.channels.map(parseChannelLine));
    setBacklineRows(parseBacklineRows(preset.backline));
  }

  useEffect(() => {
    if (!pendingExport) return;
    const rider = pendingExport.rider;
    const node = printRef.current;
    let cancelled = false;
    (async () => {
      let dataUrl: string | null = null;
      try {
        if (node) {
          // Espera um frame: no primeiro commit o nó existe no DOM mas ainda
          // pode não ter fontes/estilos aplicados, e a captura sairia torta.
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          // Os ícones do mapa de palco são <img> de SVG carregados à parte; sem
          // esperar o decode, a captura pode sair com os ícones em branco.
          const images = Array.from(node.querySelectorAll("img"));
          await Promise.all(
            images.map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {}))),
          );
          dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "#fff" });
        }
      } catch {
        // Sem o desenho o PDF ainda sai, com a tabela de posições como reserva.
        dataUrl = null;
      }
      if (cancelled) return;
      exportRider(rider, dataUrl, pendingExport.orientation);
      setPendingExport(null);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingExport]);

  function startEdit(rider: RiderRow, openTab: RiderTab = "channels") {
    setEditingId(rider.id);
    setFormOpen(true);
    setTab(openTab);
    setForm({
      name: rider.name,
      formation_id: rider.formation_id ?? "",
      sound_requirements: rider.sound_requirements ?? "",
      console_specs: rider.console_specs ?? "",
      pa_specs: rider.pa_specs ?? "",
      monitor_specs: rider.monitor_specs ?? "",
      lighting_requirements: rider.lighting_requirements ?? "",
      backline: rider.backline ?? "",
      hospitality: rider.hospitality ?? "",
      rooming_list: rider.rooming_list ?? "",
    });
    stageHistory.reset(parseStagePlot(rider.stage_plot));
    setChannels(
      Array.isArray(rider.channel_list)
        ? (rider.channel_list as unknown[]).map(parseChannelEntry)
        : [],
    );
    setBacklineRows(parseBacklineRows(rider.backline));
  }

  function startBlank() {
    setEditingId(null);
    setFormOpen(true);
    setTab("channels");
    setForm({ ...empty, formation_id: activeFormationId ?? "" });
    stageHistory.reset([]);
    setChannels([]);
    setBacklineRows([]);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(empty);
    stageHistory.reset([]);
    setChannels([]);
    setBacklineRows([]);
  }

  function save() {
    const backlineText = backlineRowsToText(backlineRows) || form.backline || null;
    const values = {
      name: form.name.trim() || "Rider técnico",
      formation_id: form.formation_id || null,
      channel_list: channelRowsToList(channels),
      stage_plot: stage,
      sound_requirements: form.sound_requirements || null,
      console_specs: form.console_specs || null,
      pa_specs: form.pa_specs || null,
      monitor_specs: form.monitor_specs || null,
      lighting_requirements: form.lighting_requirements || null,
      backline: backlineText,
      hospitality: form.hospitality || null,
      rooming_list: form.rooming_list || null,
    };
    if (editingId) update.mutate({ id: editingId, values }, { onSuccess: closeForm });
    else insert.mutate(values, { onSuccess: closeForm });
  }

  // Rider vinculado a uma formação usa o brand kit dela; sem vínculo, herda
  // a formação "tocando como" do header — mesma lógica do Gerador de Posts.
  function accentForRider(rider: RiderRow): string | undefined {
    const formation = rider.formation_id
      ? (formations.find((f) => f.id === rider.formation_id) ?? null)
      : activeFormation;
    const brandKit = brandKits.find((k) => k.id === formation?.brand_kit_id);
    return brandKit ? paletteOf(brandKit).accent : undefined;
  }

  function exportRider(rider: RiderRow, plotImage: string | null, orientation: PdfOrientation) {
    const rawChannels = Array.isArray(rider.channel_list) ? (rider.channel_list as unknown[]) : [];
    const parsedChannels = rawChannels.map(parseChannelEntry);
    const hasExtended = parsedChannels.some((c) => c.phantom || c.pedestal || c.monitor);
    const plot = parseStagePlot(rider.stage_plot);
    const plotHeight =
      orientation === "paisagem" ? PRINT_PLOT_HEIGHT_LANDSCAPE : PRINT_PLOT_HEIGHT_PORTRAIT;
    downloadPdf(
      {
        title: `Rider técnico — ${rider.name}`,
        brand: profile?.stage_name ?? "StageKit",
        subtitle: profile?.legal_name ?? "Rider técnico e de hospitalidade",
        footer: `${profile?.stage_name ?? "StageKit"} · rider técnico`,
        accent: accentForRider(rider),
        orientation: "retrato",
        blocks: [
          ...(parsedChannels.length
            ? ([
                { type: "heading", text: "Channel list" },
                {
                  type: "table",
                  head: hasExtended
                    ? ["Canal", "Instrumento", "Microfone", "+48V", "Pedestal", "Retorno"]
                    : ["Canal", "Instrumento", "Microfone"],
                  rows: parsedChannels.map((c, i) =>
                    hasExtended
                      ? [String(i + 1), c.instrument, c.mic, c.phantom ? "Sim" : "—", c.pedestal ? "Sim" : "—", c.monitor || "—"]
                      : [String(i + 1), c.instrument, c.mic],
                  ),
                },
              ] as PdfBlock[])
            : []),
          ...(plot.length
            ? ([
                { type: "heading", text: "Mapa de palco" },
                ...(plotImage
                  ? ([
                      {
                        type: "image",
                        dataUrl: plotImage,
                        aspect: PRINT_PLOT_WIDTH / plotHeight,
                        caption: `Visão da plateia para o palco (${orientation === "paisagem" ? "mapa em formato amplo / paisagem" : "mapa em formato retrato"}).`,
                      },
                    ] as PdfBlock[])
                  : ([
                      {
                        type: "table",
                        head: ["Posição", "Elemento"],
                        rows: plot.map((item) => [
                          `Linha ${item.row + 1}, coluna ${item.col + 1}`,
                          item.label,
                        ]),
                      },
                    ] as PdfBlock[])),
              ] as PdfBlock[])
            : []),
          ...(rider.console_specs ||
          rider.pa_specs ||
          rider.monitor_specs ||
          rider.sound_requirements
            ? ([
                { type: "heading", text: "Sonorização" },
                {
                  type: "kv",
                  rows: [
                    ["Mesa / Console", rider.console_specs ?? ""],
                    ["P.A.", rider.pa_specs ?? ""],
                    ["Monitores", rider.monitor_specs ?? ""],
                  ],
                },
                ...(rider.sound_requirements
                  ? ([{ type: "para", text: rider.sound_requirements }] as PdfBlock[])
                  : []),
              ] as PdfBlock[])
            : []),
          ...(rider.lighting_requirements
            ? ([
                { type: "heading", text: "Iluminação" },
                { type: "para", text: rider.lighting_requirements },
              ] as PdfBlock[])
            : []),
          ...(rider.backline
            ? ([
                { type: "heading", text: "Backline" },
                { type: "para", text: rider.backline },
              ] as PdfBlock[])
            : []),
          ...(rider.hospitality
            ? ([
                { type: "heading", text: "Hospitality / Camarim" },
                { type: "para", text: rider.hospitality },
              ] as PdfBlock[])
            : []),
          ...(rider.rooming_list
            ? ([
                { type: "heading", text: "Rooming list / Transporte" },
                { type: "para", text: rider.rooming_list },
              ] as PdfBlock[])
            : []),
          {
            type: "note",
            text: "Este rider é parte integrante do contrato de apresentação. Alterações devem ser acordadas por escrito com pelo menos 48h de antecedência.",
          },
        ],
      },
      `rider-${rider.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Rider & Mapa de Palco"
        subtitle="Escolha um formato pronto e o rider já nasce completo — depois você ajusta só o que quiser."
        actions={
          <Button variant="outline" size="sm" onClick={startBlank}>
            <Plus className="mr-1 size-4" /> Rider em branco
          </Button>
        }
      />

      <Section
        title="Comece por um formato"
        description="Um clique cria o rider com channel list, mapa de palco, som, luz, backline e hospitality preenchidos."
        className="mb-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {RIDER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={insert.isPending}
              onClick={() => createFromPreset(p.id)}
              className="rounded-lg border border-border bg-card/60 p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 disabled:opacity-60"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Wand2 className="size-4 text-primary" /> {p.label}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{p.description}</span>
            </button>
          ))}
        </div>
      </Section>

      <Dialog open={formOpen} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar rider" : "Novo rider"}</DialogTitle>
            <DialogDescription>Só o nome é necessário para salvar e gerar o PDF.</DialogDescription>
          </DialogHeader>
          <FieldGrid>
            <TextField
              label="Nome do rider"
              value={form.name}
              onChange={set("name")}
              placeholder="Voz e violão / Banda completa"
            />
            <div className="space-y-2">
              <Label>Formação (opcional)</Label>
              <Select value={form.formation_id} onValueChange={set("formation_id")}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma — rider avulso" />
                </SelectTrigger>
                <SelectContent>
                  {formations.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FieldGrid>

          <Tabs value={tab} onValueChange={(v) => setTab(v as RiderTab)} className="mt-4">
            <TabsList className="h-auto flex-wrap gap-1">
              <TabsTrigger value="channels">
                Channel list
                {channels.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">{channels.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="som">Som</TabsTrigger>
              <TabsTrigger value="luz">Luz & Backline</TabsTrigger>
              <TabsTrigger value="hospitality">Hospitality</TabsTrigger>
              <TabsTrigger value="mapa">
                Mapa
                {stage.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">{stage.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ─── Channel list ─── */}
            <TabsContent value="channels" className="space-y-3 pt-2">
              {channels.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum canal ainda. Clique para adicionar.</p>
              ) : (
                <div className="space-y-2">
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="w-5 shrink-0" />
                    <span className="flex-1 text-[10px] uppercase tracking-wide text-muted-foreground/60">Instrumento</span>
                    <span className="w-40 shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground/60">Microfone</span>
                    <span className="w-8 shrink-0 text-center text-[10px] uppercase tracking-wide text-muted-foreground/60">+48V</span>
                    <span className="w-8 shrink-0 text-center text-[10px] uppercase tracking-wide text-muted-foreground/60">Ped.</span>
                    <span className="w-20 shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground/60">Retorno</span>
                    <span className="w-8 shrink-0" />
                  </div>
                  {channels.map((row, i) => (
                    <div key={row.id} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                      <div className="flex w-full items-center gap-2 sm:contents">
                        <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
                        <Input
                          value={row.instrument}
                          onChange={(e) => updateChannelRow(row.id, { instrument: e.target.value })}
                          placeholder="Instrumento"
                          className="min-w-0 flex-1"
                        />
                      </div>
                      <Select
                        value={MIC_OPTIONS.includes(row.mic) ? row.mic : ""}
                        onValueChange={(v) => updateChannelRow(row.id, { mic: v })}
                      >
                        <SelectTrigger className="w-40 shrink-0">
                          <SelectValue placeholder="Microfone" />
                        </SelectTrigger>
                        <SelectContent>
                          {MIC_OPTIONS.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        title="+48V Phantom power"
                        onClick={() => updateChannelRow(row.id, { phantom: !row.phantom })}
                        className={`w-8 shrink-0 rounded border py-1 text-center text-[10px] font-mono transition ${row.phantom ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}
                      >
                        48V
                      </button>
                      <button
                        type="button"
                        title="Pedestal"
                        onClick={() => updateChannelRow(row.id, { pedestal: !row.pedestal })}
                        className={`w-8 shrink-0 rounded border py-1 text-center text-[10px] font-mono transition ${row.pedestal ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}
                      >
                        Ped
                      </button>
                      <Input
                        value={row.monitor}
                        onChange={(e) => updateChannelRow(row.id, { monitor: e.target.value })}
                        placeholder="M1, IEM..."
                        className="w-20 shrink-0"
                        title="Via de retorno"
                      />
                      <Button variant="ghost" size="icon" aria-label="Remover canal" onClick={() => removeChannelRow(row.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addChannelRow}>
                <Plus className="mr-1 size-4" /> Adicionar canal
              </Button>
            </TabsContent>

            {/* ─── Som ─── */}
            <TabsContent value="som" className="space-y-4 pt-2">
              <FieldGrid>
                <TextField
                  label="Mesa / Console"
                  value={form.console_specs}
                  onChange={set("console_specs")}
                  placeholder="Digital, mínimo 16 canais"
                />
                <TextField
                  label="P.A."
                  value={form.pa_specs}
                  onChange={set("pa_specs")}
                  placeholder="Line array, compatível com o público"
                />
                <TextField
                  label="Monitores"
                  value={form.monitor_specs}
                  onChange={set("monitor_specs")}
                  placeholder="4 vias independentes ou in-ear"
                />
              </FieldGrid>
              <TextAreaField
                label="Observações gerais de som"
                value={form.sound_requirements}
                onChange={set("sound_requirements")}
                placeholder="Detalhes de setup, palco próprio, etc."
              />
            </TabsContent>

            {/* ─── Luz & Backline ─── */}
            <TabsContent value="luz" className="space-y-4 pt-2">
              <TextAreaField
                label="Iluminação"
                value={form.lighting_requirements}
                onChange={set("lighting_requirements")}
                placeholder="Ex.: 4 PAR LED frontais, 2 spots laterais, strobo..."
              />
              <div className="space-y-2">
                <Label>Backline — lista de equipamentos</Label>
                {backlineRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum item ainda.</p>
                ) : (
                  <div className="space-y-1.5">
                    {backlineRows.map((row) => (
                      <div key={row.id} className="flex items-center gap-2">
                        <Input
                          value={row.item}
                          onChange={(e) => updateBacklineRow(row.id, e.target.value)}
                          placeholder="Ex.: Bateria acústica 5 peças c/ bumbo 22pol"
                          className="flex-1"
                        />
                        <Button variant="ghost" size="icon" aria-label="Remover item" onClick={() => removeBacklineRow(row.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" onClick={addBacklineRow}>
                  <Plus className="mr-1 size-4" /> Adicionar equipamento
                </Button>
              </div>
            </TabsContent>

            {/* ─── Hospitality ─── */}
            <TabsContent value="hospitality" className="space-y-4 pt-2">
              <TextAreaField
                label="Hospitality / camarim"
                value={form.hospitality}
                onChange={set("hospitality")}
                placeholder="Água mineral, chá, snacks, espaço reservado..."
              />
              <TextAreaField
                label="Rooming list / transporte"
                value={form.rooming_list}
                onChange={set("rooming_list")}
                placeholder="Número de quartos, van, meia-passagem..."
              />
            </TabsContent>

            {/* ─── Mapa de palco ─── */}
            <TabsContent value="mapa" className="space-y-3 pt-2">
              <StagePlot items={stage} onChange={setStage} history={stageHistory} />
              <StageItemLabels items={stage} onChange={setStage} />
            </TabsContent>
          </Tabs>

          <Button className="mt-4" disabled={insert.isPending || update.isPending} onClick={save}>
            <Plus className="mr-1 size-4" /> {editingId ? "Salvar alterações" : "Salvar rider"}
          </Button>
        </DialogContent>
      </Dialog>

      <Section title={`Riders salvos (${riders.length})`}>
        {riders.length === 0 ? (
          <EmptyState
            icon={<Sliders className="size-5" />}
            title="Nenhum rider ainda"
            onClick={() => setFormOpen(true)}
            description="Clique para começar — escolha um formato pronto e o rider fica pronto na hora."
          />
        ) : (
          <ul className="divide-y divide-border">
            {riders.map((r) => {
              const formation = formations.find((f) => f.id === r.formation_id);
              const plotCount = parseStagePlot(r.stage_plot).length;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Array.isArray(r.channel_list)
                        ? `${r.channel_list.length} canais`
                        : "sem channel list"}
                      {plotCount ? ` · ${plotCount} elementos no palco` : ""}
                      {formation ? ` · padrão de ${formation.name}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingExport({ rider: r, orientation: "retrato" })}
                    >
                      <Download className="mr-1 size-4" /> PDF (Mapa Retrato)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingExport({ rider: r, orientation: "paisagem" })}
                    >
                      <Download className="mr-1 size-4" /> PDF (Mapa Amplo)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(r, "mapa")}
                    >
                      <Map className="mr-1 size-4" /> Mapa
                    </Button>
                    <ItemActions
                      onEdit={() => startEdit(r)}
                      onDuplicate={() =>
                        duplicate.mutate({
                          name: `${r.name} (cópia)`,
                          formation_id: r.formation_id,
                          channel_list: r.channel_list,
                          stage_plot: r.stage_plot,
                          console_specs: r.console_specs,
                          pa_specs: r.pa_specs,
                          monitor_specs: r.monitor_specs,
                          backline: r.backline,
                          hospitality: r.hospitality,
                          lighting_requirements: r.lighting_requirements,
                        })
                      }
                      onDelete={() => remove.mutate(r.id)}
                      deleteConfirm={{
                        title: `Remover "${r.name}"?`,
                        description:
                          "A channel list e o mapa de palco deste rider serão apagados. Os shows que usavam ele ficam sem rider vinculado.",
                        confirmLabel: "Remover rider",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Fora da tela, mas dentro do documento — o html-to-image precisa de um
          nó realmente renderizado para capturar. Só existe durante a exportação. */}
      {pendingExport ? (
        <div aria-hidden style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none" }}>
          <div ref={printRef}>
            <StagePlotPrintable
              items={parseStagePlot(pendingExport.rider.stage_plot)}
              orientation={pendingExport.orientation}
            />
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
