import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sliders, Plus, Download, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section, EmptyState, FieldGrid, TextField, TextAreaField } from "@/components/ui-kit";
import { useList, useInsert, useRemove, useProfile } from "@/lib/queries";
import { downloadPdf, type PdfBlock } from "@/lib/pdf";
import { StagePlot, StageItemLabels, parseStagePlot, type StageItem } from "@/components/StagePlot";
import { RIDER_PRESETS, presetToStageItems } from "@/lib/rider-presets";

export const Route = createFileRoute("/_authenticated/riders")({
  head: () => ({
    meta: [
      { title: "Riders técnicos e hospitality — StageKit" },
      {
        name: "description",
        content: "Monte channel list, mapa de palco visual, backline, iluminação e hospitality e exporte o rider em PDF.",
      },
      { property: "og:title", content: "Riders técnicos — StageKit" },
      { property: "og:description", content: "Rider técnico e de hospitalidade profissional em PDF." },
    ],
  }),
  component: RidersPage,
});

const empty = {
  name: "",
  channel_list: "",
  sound_requirements: "",
  lighting_requirements: "",
  backline: "",
  hospitality: "",
  rooming_list: "",
};

function RidersPage() {
  const { data: profile } = useProfile();
  const { data: riders = [] } = useList("technical_riders", { order: { column: "name" } });
  const insert = useInsert("technical_riders", "Rider salvo");
  const remove = useRemove("technical_riders", "Rider removido");
  const [form, setForm] = useState(empty);
  const [stage, setStage] = useState<StageItem[]>([]);
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function applyPreset(id: string) {
    const preset = RIDER_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setForm((f) => ({
      ...f,
      name: f.name || preset.label,
      channel_list: preset.channels.join("\n"),
      sound_requirements: preset.sound,
      lighting_requirements: preset.lighting,
      backline: preset.backline,
      hospitality: preset.hospitality,
    }));
    setStage(presetToStageItems(preset));
  }

  function exportRider(rider: {
    name: string;
    channel_list: unknown;
    stage_plot?: unknown;
    sound_requirements: string | null;
    lighting_requirements: string | null;
    backline: string | null;
    hospitality: string | null;
    rooming_list: string | null;
  }) {
    const channels = Array.isArray(rider.channel_list) ? (rider.channel_list as string[]) : [];
    const plot = parseStagePlot(rider.stage_plot);
    downloadPdf(
      {
        title: `Rider técnico — ${rider.name}`,
        brand: profile?.stage_name ?? "StageKit",
        subtitle: profile?.legal_name ?? "Rider técnico e de hospitalidade",
        footer: `${profile?.stage_name ?? "StageKit"} · rider técnico`,
        blocks: [
          ...(channels.length
            ? ([
                { type: "heading", text: "Channel list" },
                {
                  type: "table",
                  head: ["Canal", "Fonte / Microfone"],
                  widths: [1, 4],
                  rows: channels.map((line, i) => [String(i + 1), String(line)]),
                },
              ] as PdfBlock[])
            : []),
          ...(plot.length
            ? ([
                { type: "heading", text: "Mapa de palco" },
                {
                  type: "table",
                  head: ["Elemento", "Posição (linha / coluna)"],
                  widths: [3, 2],
                  rows: plot
                    .slice()
                    .sort((a, b) => a.row - b.row || a.col - b.col)
                    .map((i) => [
                      i.label,
                      `${["fundo", "meio", "frente"][i.row] ?? `linha ${i.row + 1}`} · coluna ${i.col + 1}`,
                    ]),
                },
              ] as PdfBlock[])
            : []),
          ...(rider.sound_requirements
            ? ([{ type: "heading", text: "Sonorização (P.A.)" }, { type: "para", text: rider.sound_requirements }] as PdfBlock[])
            : []),
          ...(rider.lighting_requirements
            ? ([{ type: "heading", text: "Iluminação" }, { type: "para", text: rider.lighting_requirements }] as PdfBlock[])
            : []),
          ...(rider.backline ? ([{ type: "heading", text: "Backline" }, { type: "para", text: rider.backline }] as PdfBlock[]) : []),
          ...(rider.hospitality
            ? ([{ type: "heading", text: "Hospitality / Camarim" }, { type: "para", text: rider.hospitality }] as PdfBlock[])
            : []),
          ...(rider.rooming_list
            ? ([{ type: "heading", text: "Rooming list / Transporte" }, { type: "para", text: rider.rooming_list }] as PdfBlock[])
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
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Riders Técnicos"
        subtitle="Um rider claro evita improviso no palco. Use o assistente, ajuste o mapa de palco e reutilize em cada show."
      />

      <Section
        title="Assistente de Configuração"
        description="Escolha um formato e preenchemos channel list, mapa de palco, som, luz, backline e hospitality — depois você só ajusta."
        className="mb-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {RIDER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className="rounded-lg border border-border bg-card/60 p-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Wand2 className="size-4 text-primary" /> {p.label}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{p.description}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Novo rider" className="mb-5">
        <FieldGrid>
          <TextField label="Nome do rider" value={form.name} onChange={set("name")} placeholder="Trio elétrico / Voz e violão" />
        </FieldGrid>
        <div className="mt-4 space-y-4">
          <TextAreaField
            label="Channel list (um canal por linha)"
            value={form.channel_list}
            onChange={set("channel_list")}
            placeholder={"Bumbo — Shure Beta 52\nVoz principal — SM58"}
          />
          <div className="space-y-3">
            <p className="text-sm font-medium">Mapa de palco</p>
            <StagePlot items={stage} onChange={setStage} />
            <StageItemLabels items={stage} onChange={setStage} />
          </div>
          <TextAreaField label="Sonorização (P.A.)" value={form.sound_requirements} onChange={set("sound_requirements")} />
          <TextAreaField label="Iluminação" value={form.lighting_requirements} onChange={set("lighting_requirements")} />
          <TextAreaField label="Backline" value={form.backline} onChange={set("backline")} />
          <TextAreaField label="Hospitality / camarim" value={form.hospitality} onChange={set("hospitality")} />
          <TextAreaField label="Rooming list / transporte" value={form.rooming_list} onChange={set("rooming_list")} />
        </div>
        <Button
          className="mt-4"
          disabled={!form.name || insert.isPending}
          onClick={() =>
            insert.mutate(
              {
                name: form.name,
                channel_list: form.channel_list.split("\n").filter(Boolean),
                stage_plot: stage,
                sound_requirements: form.sound_requirements || null,
                lighting_requirements: form.lighting_requirements || null,
                backline: form.backline || null,
                hospitality: form.hospitality || null,
                rooming_list: form.rooming_list || null,
              },
              {
                onSuccess: () => {
                  setForm(empty);
                  setStage([]);
                },
              },
            )
          }
        >
          <Plus className="mr-1 size-4" /> Salvar rider
        </Button>
      </Section>

      <Section title={`Riders salvos (${riders.length})`}>
        {riders.length === 0 ? (
          <EmptyState icon={<Sliders className="size-5" />} title="Nenhum rider salvo" />
        ) : (
          <ul className="divide-y divide-border">
            {riders.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Array.isArray(r.channel_list) ? `${r.channel_list.length} canais` : "sem channel list"}
                    {parseStagePlot(r.stage_plot).length
                      ? ` · ${parseStagePlot(r.stage_plot).length} elementos no palco`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportRider(r)}>
                    <Download className="mr-1 size-4" /> PDF
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.id)} aria-label="Remover">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
