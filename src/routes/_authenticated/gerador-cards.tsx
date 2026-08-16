import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, Loader2, CalendarDays, RotateCcw, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  TextField,
  TimeField,
} from "@/components/ui-kit";
import { useList, useProfile } from "@/lib/queries";
import { dateBR, todayISO } from "@/lib/format";
import { useActiveFormation } from "@/lib/active-formation";
import { BRAND_PRESETS, paletteOf, patternStyle, FONT_STACKS } from "@/lib/brand-presets";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/gerador-cards")({
  validateSearch: (search: Record<string, unknown>): { event?: string | undefined } => ({
    event: typeof search["event"] === "string" ? search["event"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Gerador de Cards — StageKit" },
      {
        name: "description",
        content:
          "Card de divulgação em Stories e Feed, com a foto, logo e paleta da formação do show.",
      },
      { property: "og:title", content: "Gerador de Cards — StageKit" },
      { property: "og:description", content: "Divulgue seu próximo show em segundos." },
    ],
  }),
  component: CardGeneratorPage,
});

// width/height são o tamanho da PRÉVIA. A exportação reescala para 1080px de
// largura em todos os formatos (ver EXPORT_WIDTH), então Stories sai 1080x1920,
// Feed 1:1 sai 1080x1080 e Feed 4:5 sai 1080x1350.
const FORMATS = {
  STORIES: { label: "Stories 9:16", width: 315, height: 560 },
  FEED_11: { label: "Feed 1:1", width: 420, height: 420 },
  FEED_45: { label: "Feed 4:5", width: 400, height: 500 },
} as const;

const EXPORT_WIDTH = 1080;

type FormatKey = keyof typeof FORMATS;

/**
 * O que separa um post de artista de um post de aplicativo é variação de
 * composição, não de cor — os 6 brand kits já cobrem cor/fonte/textura, o que
 * faltava era ter só um jeito de organizar o espaço. Cada layout é uma
 * hierarquia e um uso do espaço diferentes; a paleta do brand kit entra por
 * cima de qualquer um deles.
 */
type LayoutKey = "BLEED" | "BLOCKS" | "POSTER" | "CENTERED" | "DIAGONAL";

const LAYOUTS: { key: LayoutKey; label: string; hint: string }[] = [
  {
    key: "BLEED",
    label: "Foto em destaque",
    hint: "Logo e chamada no canto, texto compacto embaixo",
  },
  { key: "BLOCKS", label: "Blocos", hint: "Foto em cima, texto num bloco sólido embaixo" },
  { key: "POSTER", label: "Cartaz tipográfico", hint: "O título domina a peça inteira" },
  { key: "CENTERED", label: "Minimalista", hint: "Tudo centralizado, com bastante respiro" },
  { key: "DIAGONAL", label: "Faixa diagonal", hint: "Uma faixa de destaque cruza o card" },
];

// Select do Radix não aceita string vazia como valor de item.
const NO_KIT = "__none__";

/**
 * Data e hora ficam como valores estruturados (ISO e HH:MM), não como texto —
 * assim o usuário escolhe em calendário/dropdown em vez de digitar separadores.
 * A linha exibida no card é derivada por formatDateLine().
 */
function formatDateLine(dateISO: string, time: string) {
  if (!dateISO) return time ? `Horário: ${time}` : "Data a definir";
  return `${dateBR(dateISO)}${time ? ` · ${time}` : ""}`;
}

/** Textos que o card mostra, derivados do evento mas livres para ajuste fino. */
function defaultCopy(event: Tables<"events"> | undefined, stageName: string) {
  return {
    kicker: stageName,
    headline: event?.title ?? "",
    dateISO: event?.event_date ?? "",
    time: event?.start_time ?? "",
    locationLine: [event?.venue, event?.city].filter(Boolean).join(", ") || "Local a definir",
    footnote: "",
  };
}

function CardGeneratorPage() {
  const { data: profile } = useProfile();
  const { data: events = [] } = useList("events", {
    order: { column: "event_date", ascending: true },
  });
  const { data: formations = [] } = useList("formations");
  const { data: brandKits = [] } = useList("brand_kits");
  const { event: eventIdParam } = Route.useSearch();

  const today = todayISO();
  const upcoming = events.filter(
    (e) => e.status !== "CANCELADO" && (!e.event_date || e.event_date >= today),
  );

  const [eventId, setEventId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [format, setFormat] = useState<FormatKey>("STORIES");
  const [layout, setLayout] = useState<LayoutKey>("BLEED");
  const [showPhoto, setShowPhoto] = useState(true);
  const [copy, setCopy] = useState(defaultCopy(undefined, ""));
  const [exporting, setExporting] = useState(false);
  // null = herdar da formação do show; string = escolha explícita do usuário
  // ("" significa "sem identidade", usando o visual padrão do StageKit).
  const [manualKitId, setManualKitId] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  // Largura disponível da moldura, para encolher a prévia em tela estreita
  // sem mudar as dimensões reais do nó que vai ser exportado.
  const [frameWidth, setFrameWidth] = useState(0);

  // O frame só existe no DOM com o modal aberto (Radix desmonta o conteúdo do
  // Dialog fechado), então o observer precisa reanexar quando dialogOpen muda —
  // só na montagem ele nunca encontraria o nó na primeira abertura.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setFrameWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [dialogOpen]);

  // Chegar aqui com ?event= (dashboard, evento, magic paste...) já abre o
  // editor pronto — só o acesso direto pela lista pede um clique em "Criar post".
  useEffect(() => {
    if (eventIdParam && upcoming.some((e) => e.id === eventIdParam)) {
      setEventId(eventIdParam);
      setDialogOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIdParam, upcoming.length]);

  function openEditor(id: string) {
    setEventId(id);
    setDialogOpen(true);
  }

  const { activeFormation } = useActiveFormation();
  const event = upcoming.find((e) => e.id === eventId);
  // Sem show selecionado (card avulso), herda a formação "tocando como" do
  // header em vez de ficar sem identidade nenhuma.
  const formation = event ? formations.find((f) => f.id === event.formation_id) : activeFormation;

  // Exigir show -> formação -> brand kit para usar uma foto é fricção demais:
  // quem acabou de subir a imagem espera vê-la. Então herda da formação
  // quando existir, cai no único brand kit cadastrado quando houver só um, e
  // em qualquer caso deixa trocar na mão.
  const inheritedKitId =
    formation?.brand_kit_id ?? (brandKits.length === 1 ? brandKits[0]!.id : "");
  const effectiveKitId = manualKitId ?? inheritedKitId;
  const brandKit = brandKits.find((k) => k.id === effectiveKitId);
  const preset = BRAND_PRESETS.find((p) => p.id === brandKit?.preset);
  const palette = paletteOf(brandKit);
  const stageName = profile?.stage_name || "StageKit";

  // Trocar de show repõe os textos e volta a identidade para a herdada — o
  // ajuste fino vale para o card em montagem, não vira estado permanente.
  // Depende do id (não do objeto) para que um refetch da lista não descarte
  // o que o usuário acabou de ajustar.
  const currentEventId = event?.id;
  useEffect(() => {
    if (!currentEventId) return;
    setCopy(
      defaultCopy(
        events.find((e) => e.id === currentEventId),
        stageName,
      ),
    );
    setManualKitId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEventId, stageName]);

  const dims = FORMATS[format];
  const isCompact = format !== "STORIES";
  // 32px = padding p-4 da moldura nos dois lados. Nunca amplia (máx. 1).
  const previewScale = frameWidth > 0 ? Math.min(1, (frameWidth - 32) / dims.width) : 1;
  // Escala de exportação derivada do formato, para todos saírem com 1080px de
  // largura real independentemente do tamanho da prévia na tela.
  const exportScale = EXPORT_WIDTH / dims.width;
  const exportHeight = Math.round(dims.height * exportScale);

  async function exportPng() {
    if (!cardRef.current || !event) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: exportScale,
        cacheBust: true,
        width: dims.width,
        height: dims.height,
        // O nó pode estar reduzido na tela (previewScale) para caber no
        // celular; a imagem exportada tem que sair no tamanho nominal.
        style: { transform: "none", transformOrigin: "top left" },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      const slug = (copy.headline || event.title || "divulgacao").replace(/[^\w-]+/g, "_");
      a.download = `${slug}-${format.toLowerCase()}.png`;
      a.click();
    } catch {
      toast.error("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  if (upcoming.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Gerador de Posts" subtitle="Card de divulgação para Stories e Feed." />
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="Nenhum show futuro cadastrado"
          description="Cadastre um evento para gerar o card de divulgação dele."
          action={
            <Button asChild size="sm">
              <Link to="/eventos">Cadastrar evento</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const setCopyField = (k: keyof typeof copy) => (v: string) => setCopy((c) => ({ ...c, [k]: v }));

  const hasPhoto = showPhoto && Boolean(brandKit?.photo_url);
  const bg = (
    <>
      {!hasPhoto ? (
        <div
          className="absolute inset-0"
          style={patternStyle(palette.pattern, palette.accent)}
          aria-hidden
        />
      ) : (
        <img
          src={brandKit!.photo_url!}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </>
  );
  const logo = brandKit?.logo_url ? (
    <img
      src={brandKit.logo_url}
      alt="Logo"
      crossOrigin="anonymous"
      className="h-9 max-w-[130px] object-contain"
    />
  ) : null;
  const dateLine = formatDateLine(copy.dateISO, copy.time);

  /** Cada composição usa as mesmas peças (fundo, logo, textos) numa hierarquia
   * e ocupação de espaço diferentes — é isso, não a paleta, que faz o post
   * parecer feito por alguém em vez de gerado por um app. */
  function renderLayout() {
    switch (layout) {
      case "BLOCKS":
        return (
          <>
            <div className="relative flex-1 overflow-hidden">{bg}</div>
            <div
              className={cn("relative flex flex-col gap-1.5", isCompact ? "p-6" : "p-7")}
              style={{ background: palette.card }}
            >
              {logo}
              {copy.kicker ? (
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: palette.accent }}
                >
                  {copy.kicker}
                </p>
              ) : null}
              {copy.headline ? (
                <p
                  className={cn("font-extrabold leading-tight", isCompact ? "text-xl" : "text-2xl")}
                >
                  {copy.headline}
                </p>
              ) : null}
              <p className="text-sm opacity-90">{dateLine}</p>
              {copy.locationLine ? <p className="text-sm opacity-90">{copy.locationLine}</p> : null}
              {copy.footnote ? <p className="mt-1 text-xs opacity-75">{copy.footnote}</p> : null}
            </div>
          </>
        );

      case "POSTER":
        return (
          <>
            {bg}
            <div
              className="absolute inset-0"
              style={{
                background: hasPhoto
                  ? `linear-gradient(180deg, ${palette.bg}b3, ${palette.bg}e6)`
                  : "transparent",
              }}
              aria-hidden
            />
            <div
              className={cn(
                "relative flex h-full flex-col justify-between",
                isCompact ? "p-6" : "p-7",
              )}
            >
              <div className="flex items-center gap-2">
                {logo}
                {copy.kicker ? (
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: palette.accent, color: palette.bg }}
                  >
                    {copy.kicker}
                  </span>
                ) : null}
              </div>
              {copy.headline ? (
                <p
                  className={cn(
                    "font-extrabold uppercase leading-[0.95]",
                    isCompact ? "text-4xl" : "text-5xl",
                  )}
                >
                  {copy.headline}
                </p>
              ) : null}
              <div>
                <p className="text-sm font-semibold opacity-90">{dateLine}</p>
                {copy.locationLine ? (
                  <p className="text-sm opacity-90">{copy.locationLine}</p>
                ) : null}
                {copy.footnote ? <p className="mt-1 text-xs opacity-75">{copy.footnote}</p> : null}
              </div>
            </div>
          </>
        );

      case "CENTERED":
        return (
          <>
            {bg}
            <div
              className="absolute inset-0"
              style={{ background: `${palette.bg}cc` }}
              aria-hidden
            />
            <div className="relative flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
              {logo}
              {copy.kicker ? (
                <p
                  className="text-xs font-bold uppercase tracking-[0.25em]"
                  style={{ color: palette.accent }}
                >
                  {copy.kicker}
                </p>
              ) : null}
              {copy.headline ? (
                <p
                  className={cn(
                    "font-extrabold leading-tight",
                    isCompact ? "text-2xl" : "text-3xl",
                  )}
                >
                  {copy.headline}
                </p>
              ) : null}
              <div className="mt-1 h-px w-10" style={{ background: palette.accent }} aria-hidden />
              <p className="text-sm opacity-90">{dateLine}</p>
              {copy.locationLine ? <p className="text-sm opacity-90">{copy.locationLine}</p> : null}
              {copy.footnote ? <p className="mt-1 text-xs opacity-70">{copy.footnote}</p> : null}
            </div>
          </>
        );

      case "DIAGONAL":
        return (
          <>
            {bg}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${palette.bg}f2 15%, ${palette.bg}00 55%)`,
              }}
              aria-hidden
            />
            {copy.kicker ? (
              <div
                className="absolute left-[-12%] top-[16%] flex w-[124%] -rotate-6 items-center justify-center py-2"
                style={{ background: palette.accent }}
              >
                <span
                  className="text-xs font-extrabold uppercase tracking-[0.3em]"
                  style={{ color: palette.bg }}
                >
                  {copy.kicker}
                </span>
              </div>
            ) : null}
            <div className={cn("relative flex flex-col gap-1.5", isCompact ? "p-6" : "p-7")}>
              {logo}
              {copy.headline ? (
                <p
                  className={cn(
                    "font-extrabold leading-tight",
                    isCompact ? "text-2xl" : "text-3xl",
                  )}
                >
                  {copy.headline}
                </p>
              ) : null}
              <p className="text-sm opacity-90">{dateLine}</p>
              {copy.locationLine ? <p className="text-sm opacity-90">{copy.locationLine}</p> : null}
              {copy.footnote ? <p className="mt-1 text-xs opacity-75">{copy.footnote}</p> : null}
            </div>
          </>
        );

      case "BLEED":
      default:
        return (
          <>
            {bg}
            {logo || copy.kicker ? (
              <div className="absolute left-0 top-0 flex items-center gap-2 p-5">
                {logo}
                {copy.kicker ? (
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{
                      color: hasPhoto ? "#fff" : palette.accent,
                      textShadow: hasPhoto ? "0 1px 3px rgba(0,0,0,.5)" : "none",
                    }}
                  >
                    {copy.kicker}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div
              className={cn("relative flex flex-col gap-1.5", isCompact ? "p-6" : "p-7")}
              style={{
                background: `linear-gradient(to top, ${palette.bg}f2 25%, ${palette.bg}00 80%)`,
              }}
            >
              {copy.headline ? (
                <p
                  className={cn(
                    "font-extrabold leading-tight",
                    isCompact ? "text-2xl" : "text-3xl",
                  )}
                >
                  {copy.headline}
                </p>
              ) : null}
              <p className="text-sm opacity-90">{dateLine}</p>
              {copy.locationLine ? <p className="text-sm opacity-90">{copy.locationLine}</p> : null}
              {copy.footnote ? <p className="mt-1 text-xs opacity-75">{copy.footnote}</p> : null}
            </div>
          </>
        );
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Gerador de Posts"
        subtitle="Escolha um show e crie o card de divulgação — o editor abre em destaque, sem sair da lista."
      />

      <Section title={`Próximos shows (${upcoming.length})`}>
        <ul className="divide-y divide-border">
          {upcoming.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.event_date ? dateBR(e.event_date) : "data a definir"}
                </p>
              </div>
              <Button size="sm" onClick={() => openEditor(e.id)}>
                <Megaphone className="mr-1 size-4" /> Criar post
              </Button>
            </li>
          ))}
        </ul>
      </Section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex h-[92vh] max-h-[92vh] w-[96vw] max-w-6xl flex-col overflow-hidden p-0 sm:rounded-2xl">
          <DialogTitle className="sr-only">Gerador de post — {event?.title ?? ""}</DialogTitle>
          <div className="shrink-0 border-b border-border px-5 py-3 pr-12">
            <p className="truncate text-sm font-semibold">{event?.title}</p>
            <p className="text-xs text-muted-foreground">
              {event?.event_date ? dateBR(event.event_date) : "Data a definir"}
            </p>
          </div>

          <div className="grid flex-1 gap-6 overflow-y-auto p-5 lg:grid-cols-[340px_1fr]">
            <div className="space-y-5">
              <Section title="Show">
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar show" />
                  </SelectTrigger>
                  <SelectContent>
                    {upcoming.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.title} — {e.event_date ? dateBR(e.event_date) : "data a definir"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="mt-4 space-y-2">
                  <Label>Formato</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(FORMATS) as FormatKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormat(key)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          format === key
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/60",
                        )}
                      >
                        {FORMATS[key].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label>Composição</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {LAYOUTS.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => setLayout(l.key)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          layout === l.key
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/60",
                        )}
                      >
                        <span className="block text-xs font-semibold">{l.label}</span>
                        <span className="block text-[11px] text-muted-foreground">{l.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label>Identidade visual</Label>
                  <Select
                    value={effectiveKitId || NO_KIT}
                    onValueChange={(v) => setManualKitId(v === NO_KIT ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_KIT}>Sem identidade (padrão StageKit)</SelectItem>
                      {brandKits.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {brandKits.length === 0 ? (
                      <>
                        Nenhuma identidade visual cadastrada.{" "}
                        <Link to="/marca" className="text-primary hover:underline">
                          Criar um agora
                        </Link>{" "}
                        para usar sua foto e logo no card.
                      </>
                    ) : brandKit ? (
                      <>
                        {preset?.label ?? brandKit.preset}
                        {formation?.brand_kit_id === brandKit.id
                          ? ` · herdado da formação "${formation.name}"`
                          : ""}
                        {!brandKit.photo_url ? " · este kit não tem foto" : ""}
                      </>
                    ) : (
                      "O card usa só as cores padrão — escolha uma identidade visual para incluir foto e logo."
                    )}
                  </p>
                </div>
              </Section>

              <Section
                title="Ajuste fino"
                description="Os textos vêm do show; edite livremente para este card."
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCopy(defaultCopy(event, stageName))}
                  >
                    <RotateCcw className="mr-1 size-3.5" /> Restaurar
                  </Button>
                }
              >
                <div className="space-y-4">
                  <TextField
                    label="Chamada (topo)"
                    value={copy.kicker}
                    onChange={setCopyField("kicker")}
                  />
                  <TextField
                    label="Título"
                    value={copy.headline}
                    onChange={setCopyField("headline")}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Data"
                      value={copy.dateISO}
                      onChange={setCopyField("dateISO")}
                      type="date"
                    />
                    <TimeField label="Hora" value={copy.time} onChange={setCopyField("time")} />
                  </div>
                  <p className="-mt-2 text-xs text-muted-foreground">
                    No card aparece como: {formatDateLine(copy.dateISO, copy.time)}
                  </p>
                  <TextField
                    label="Local"
                    value={copy.locationLine}
                    onChange={setCopyField("locationLine")}
                  />
                  <TextField
                    label="Rodapé (opcional)"
                    value={copy.footnote}
                    onChange={setCopyField("footnote")}
                    placeholder="Ingressos na bio, classificação, etc."
                  />
                  {brandKit?.photo_url ? (
                    <label className="flex items-center justify-between gap-2 text-sm">
                      Usar foto de fundo
                      <Switch checked={showPhoto} onCheckedChange={setShowPhoto} />
                    </label>
                  ) : null}
                </div>
              </Section>
            </div>

            <div className="flex flex-col items-center gap-4">
              <p className="self-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prévia
              </p>

              {/* Moldura: fundo xadrez discreto para separar o card da página e
              deixar claro onde a arte começa e termina. */}
              <div
                ref={frameRef}
                className="w-full max-w-full rounded-2xl border border-border p-4"
                style={{
                  backgroundColor: "var(--muted)",
                  backgroundImage:
                    "linear-gradient(45deg, color-mix(in oklab, var(--background) 60%, transparent) 25%, transparent 25%, transparent 75%, color-mix(in oklab, var(--background) 60%, transparent) 75%), linear-gradient(45deg, color-mix(in oklab, var(--background) 60%, transparent) 25%, transparent 25%, transparent 75%, color-mix(in oklab, var(--background) 60%, transparent) 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 8px 8px",
                }}
              >
                {/* O nó exportado mantém as dimensões nominais (o toPng depende
                delas); quem encolhe na tela pequena é este invólucro, via
                scale. Sem isto o card vaza ~110px no iPhone SE. */}
                <div
                  className="mx-auto overflow-hidden"
                  style={{ width: dims.width * previewScale, height: dims.height * previewScale }}
                >
                  <div
                    ref={cardRef}
                    className="relative flex shrink-0 flex-col justify-end overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/20"
                    style={{
                      width: dims.width,
                      height: dims.height,
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                      background: palette.bg,
                      color: palette.text,
                      fontFamily: FONT_STACKS[palette.fontFamily],
                    }}
                  >
                    {renderLayout()}
                  </div>
                </div>
              </div>

              {/* Exportar fica no fim do fluxo visual, junto da prévia pronta —
              não no topo da página, antes de existir o que baixar. */}
              <div className="flex flex-col items-center gap-1.5">
                <Button onClick={exportPng} disabled={!event || exporting} size="lg">
                  {exporting ? (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  ) : (
                    <Download className="mr-1 size-4" />
                  )}
                  Exportar Imagem (PNG)
                </Button>
                <p className="text-xs text-muted-foreground">
                  {EXPORT_WIDTH} × {exportHeight} px · {FORMATS[format].label}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
