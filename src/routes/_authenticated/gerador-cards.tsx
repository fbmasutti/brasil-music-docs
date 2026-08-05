import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, Loader2, CalendarDays, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Section, EmptyState, TextField } from "@/components/ui-kit";
import { useList, useProfile } from "@/lib/queries";
import { dateBR } from "@/lib/format";
import { BRAND_PRESETS, presetPalette, type BrandPalette } from "@/lib/brand-presets";
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

const FORMATS = {
  STORIES: { label: "Stories 9:16", width: 360, height: 640 },
  FEED: { label: "Feed 1:1", width: 460, height: 460 },
} as const;

type FormatKey = keyof typeof FORMATS;

// Select do Radix não aceita string vazia como valor de item.
const NO_KIT = "__none__";

function paletteOf(kit: Tables<"brand_kits"> | undefined): BrandPalette {
  const raw = kit?.palette;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "bg" in raw && "accent" in raw) {
    return raw as unknown as BrandPalette;
  }
  return presetPalette(kit?.preset ?? "neon_night");
}

/** Textos que o card mostra, derivados do evento mas livres para ajuste fino. */
function defaultCopy(event: Tables<"events"> | undefined, stageName: string) {
  return {
    kicker: stageName,
    headline: event?.title ?? "",
    dateLine: event?.event_date
      ? `${dateBR(event.event_date)}${event.start_time ? ` · ${event.start_time}` : ""}`
      : "Data a definir",
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

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(
    (e) => e.status !== "CANCELADO" && (!e.event_date || e.event_date >= today),
  );

  const [eventId, setEventId] = useState("");
  const [format, setFormat] = useState<FormatKey>("STORIES");
  const [showPhoto, setShowPhoto] = useState(true);
  const [copy, setCopy] = useState(defaultCopy(undefined, ""));
  const [exporting, setExporting] = useState(false);
  // null = herdar da formação do show; string = escolha explícita do usuário
  // ("" significa "sem identidade", usando o visual padrão do StageKit).
  const [manualKitId, setManualKitId] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eventId) return;
    if (eventIdParam && upcoming.some((e) => e.id === eventIdParam)) {
      setEventId(eventIdParam);
    } else if (upcoming.length) {
      setEventId(upcoming[0]!.id);
    }
  }, [upcoming, eventId, eventIdParam]);

  const event = upcoming.find((e) => e.id === eventId);
  const formation = formations.find((f) => f.id === event?.formation_id);

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
  const isFeed = format === "FEED";

  async function exportPng() {
    if (!cardRef.current || !event) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        width: dims.width,
        height: dims.height,
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
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Gerador de Cards" subtitle="Card de divulgação para Stories e Feed." />
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
      </div>
    );
  }

  const setCopyField = (k: keyof typeof copy) => (v: string) => setCopy((c) => ({ ...c, [k]: v }));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Gerador de Cards"
        subtitle="Card de divulgação com a identidade visual da formação — ajuste os textos antes de exportar."
        actions={
          <Button onClick={exportPng} disabled={!event || exporting} size="sm">
            {exporting ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Download className="mr-1 size-4" />
            )}
            Exportar Imagem (PNG)
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
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
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(FORMATS) as FormatKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormat(key)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition",
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
                    Nenhum brand kit cadastrado.{" "}
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
                  "O card usa só as cores padrão — escolha um brand kit para incluir foto e logo."
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
              <TextField label="Título" value={copy.headline} onChange={setCopyField("headline")} />
              <TextField
                label="Data e hora"
                value={copy.dateLine}
                onChange={setCopyField("dateLine")}
              />
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

        <div className="flex items-start justify-center">
          <div
            ref={cardRef}
            className="relative flex shrink-0 flex-col justify-end overflow-hidden rounded-2xl"
            style={{
              width: dims.width,
              height: dims.height,
              background: palette.bg,
              color: palette.text,
            }}
          >
            {showPhoto && brandKit?.photo_url ? (
              <img
                src={brandKit.photo_url}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div
              className={cn("relative flex flex-col gap-2", isFeed ? "p-6" : "p-7")}
              style={{
                background: `linear-gradient(to top, ${palette.bg}f2 20%, ${palette.bg}00 75%)`,
              }}
            >
              {brandKit?.logo_url ? (
                <img
                  src={brandKit.logo_url}
                  alt="Logo"
                  crossOrigin="anonymous"
                  className="mb-3 h-10 max-w-[140px] object-contain"
                />
              ) : null}
              {copy.kicker ? (
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: palette.accent }}
                >
                  {copy.kicker}
                </p>
              ) : null}
              {copy.headline ? (
                <p className={cn("font-extrabold leading-tight", isFeed ? "text-2xl" : "text-3xl")}>
                  {copy.headline}
                </p>
              ) : null}
              {copy.dateLine ? <p className="text-sm opacity-90">{copy.dateLine}</p> : null}
              {copy.locationLine ? <p className="text-sm opacity-90">{copy.locationLine}</p> : null}
              {copy.footnote ? <p className="mt-1 text-xs opacity-75">{copy.footnote}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
