import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sliders, Plus, Download, Trash2, Wand2, Pencil, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  ConfirmDelete,
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
  PRINT_PLOT_WIDTH,
  PRINT_PLOT_HEIGHT,
  type StageItem,
} from "@/components/StagePlot";
import { toPng } from "html-to-image";
import { RIDER_PRESETS, presetToStageItems } from "@/lib/rider-presets";

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

type ChannelRow = { id: string; instrument: string; mic: string };

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

/** "Instrumento — Microfone" -> linha estruturada; sem separador, tudo vira instrumento. */
function parseChannelLine(line: string): ChannelRow {
  const [instrument, ...rest] = line.split(" — ");
  return { id: crypto.randomUUID(), instrument: instrument ?? "", mic: rest.join(" — ") };
}

function channelRowsToList(rows: ChannelRow[]): string[] {
  return rows
    .filter((r) => r.instrument.trim() || r.mic.trim())
    .map((r) => (r.mic.trim() ? `${r.instrument.trim()} — ${r.mic.trim()}` : r.instrument.trim()));
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

function RidersPage() {
  const { data: profile } = useProfile();
  const { data: riders = [] } = useList("technical_riders", { order: { column: "name" } });
  const { data: formations = [] } = useList("formations", { order: { column: "name" } });
  const { data: brandKits = [] } = useList("brand_kits");
  const { activeFormationId, activeFormation } = useActiveFormation();
  const insert = useInsert("technical_riders", "Rider salvo");
  const update = useUpdate("technical_riders", "Rider atualizado");
  const remove = useRemove("technical_riders", "Rider removido");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [form, setForm] = useState(empty);
  // Rider aguardando exportação: enquanto está setado, o mapa é renderizado
  // fora da tela para ser capturado como imagem e entrar no PDF.
  const [pendingExport, setPendingExport] = useState<RiderRow | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<StageItem[]>([]);
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function addChannelRow() {
    setChannels((rows) => [...rows, { id: crypto.randomUUID(), instrument: "", mic: "" }]);
  }
  function updateChannelRow(id: string, patch: Partial<ChannelRow>) {
    setChannels((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeChannelRow(id: string) {
    setChannels((rows) => rows.filter((r) => r.id !== id));
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
    setAdvancedOpen(false);
    setForm({
      ...empty,
      name: taken ? `${preset.label} (${taken + 1})` : preset.label,
      formation_id: activeFormationId ?? "",
      sound_requirements: preset.sound,
      lighting_requirements: preset.lighting,
      backline: preset.backline,
      hospitality: preset.hospitality,
    });
    setStage(presetToStageItems(preset));
    setChannels(preset.channels.map(parseChannelLine));
  }

  useEffect(() => {
    if (!pendingExport) return;
    const rider = pendingExport;
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
      exportRider(rider, dataUrl);
      setPendingExport(null);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingExport]);

  function startEdit(rider: RiderRow) {
    setEditingId(rider.id);
    setFormOpen(true);
    setAdvancedOpen(false);
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
    setStage(parseStagePlot(rider.stage_plot));
    setChannels(
      Array.isArray(rider.channel_list)
        ? (rider.channel_list as string[]).map(parseChannelLine)
        : [],
    );
  }

  function startBlank() {
    setEditingId(null);
    setFormOpen(true);
    setAdvancedOpen(false);
    // Novo rider já nasce com a formação "tocando como" do header, em vez de
    // pedir pra escolher de novo algo que já está definido globalmente.
    setForm({ ...empty, formation_id: activeFormationId ?? "" });
    setStage([]);
    setChannels([]);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(empty);
    setStage([]);
    setChannels([]);
  }

  function save() {
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
      backline: form.backline || null,
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

  function exportRider(rider: RiderRow, plotImage: string | null) {
    const channels = Array.isArray(rider.channel_list) ? (rider.channel_list as string[]) : [];
    const plot = parseStagePlot(rider.stage_plot);
    downloadPdf(
      {
        title: `Rider técnico — ${rider.name}`,
        brand: profile?.stage_name ?? "StageKit",
        subtitle: profile?.legal_name ?? "Rider técnico e de hospitalidade",
        footer: `${profile?.stage_name ?? "StageKit"} · rider técnico`,
        accent: accentForRider(rider),
        blocks: [
          ...(channels.length
            ? ([
                { type: "heading", text: "Channel list" },
                {
                  type: "table",
                  head: ["Canal", "Fonte / microfone"],
                  rows: channels.map((c, i) => [String(i + 1), c]),
                },
              ] as PdfBlock[])
            : []),
          ...(plot.length
            ? ([
                { type: "heading", text: "Mapa de palco" },
                // Desenho de verdade. Antes isto era uma tabela de texto
                // ("Bateria — linha 1, coluna 2"), que não comunica posição
                // para quem monta o palco.
                ...(plotImage
                  ? ([
                      {
                        type: "image",
                        dataUrl: plotImage,
                        aspect: PRINT_PLOT_WIDTH / PRINT_PLOT_HEIGHT,
                        caption: "Visão de quem está na plateia olhando para o palco.",
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
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
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

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Channel list</Label>
              {channels.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum canal ainda.</p>
              ) : (
                <div className="space-y-2">
                  {channels.map((row) => (
                    <div key={row.id} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                      <Input
                        value={row.instrument}
                        onChange={(e) => updateChannelRow(row.id, { instrument: e.target.value })}
                        placeholder="Instrumento (ex.: Bumbo)"
                        className="flex-1"
                      />
                      <Select
                        value={MIC_OPTIONS.includes(row.mic) ? row.mic : ""}
                        onValueChange={(v) => updateChannelRow(row.id, { mic: v })}
                      >
                        <SelectTrigger className="w-44 shrink-0">
                          <SelectValue placeholder="Microfone" />
                        </SelectTrigger>
                        <SelectContent>
                          {MIC_OPTIONS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={row.mic}
                        onChange={(e) => updateChannelRow(row.id, { mic: e.target.value })}
                        placeholder="Ou digite (ex.: Beta 91 sob o bumbo)"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remover canal"
                        onClick={() => removeChannelRow(row.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addChannelRow}>
                <Plus className="mr-1 size-4" /> Adicionar canal
              </Button>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Mapa de palco</p>
              <StagePlot items={stage} onChange={setStage} />
              <StageItemLabels items={stage} onChange={setStage} />
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <ChevronDown
                  className={`size-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                />
                {advancedOpen ? "Ocultar" : "+ Adicionar"} detalhes avançados (opcional)
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-4">
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
                />
                <TextAreaField
                  label="Iluminação"
                  value={form.lighting_requirements}
                  onChange={set("lighting_requirements")}
                />
                <TextAreaField label="Backline" value={form.backline} onChange={set("backline")} />
                <TextAreaField
                  label="Hospitality / camarim"
                  value={form.hospitality}
                  onChange={set("hospitality")}
                />
                <TextAreaField
                  label="Rooming list / transporte"
                  value={form.rooming_list}
                  onChange={set("rooming_list")}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

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
            description="Escolha um formato acima e o rider fica pronto na hora."
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
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPendingExport(r)}>
                      <Download className="mr-1 size-4" /> PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(r)}
                      aria-label={`Editar ${r.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <ConfirmDelete
                      title={`Remover "${r.name}"?`}
                      description="A channel list e o mapa de palco deste rider serão apagados. Os shows que usavam ele ficam sem rider vinculado."
                      confirmLabel="Remover rider"
                      onConfirm={() => remove.mutate(r.id)}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Remover ${r.name}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      }
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
            <StagePlotPrintable items={parseStagePlot(pendingExport.stage_plot)} />
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
