import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Section, EmptyState } from "@/components/ui-kit";
import { useList, useProfile } from "@/lib/queries";
import { dateBR } from "@/lib/format";
import { BRAND_PRESETS, presetPalette, type BrandPalette } from "@/lib/brand-presets";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/gerador-cards")({
  validateSearch: (search: Record<string, unknown>): { event?: string | undefined } => ({
    event: typeof search["event"] === "string" ? search["event"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Gerador de Posts — StageKit" },
      {
        name: "description",
        content:
          "Card de divulgação pronto pro Stories, com a foto, logo e paleta da formação do show.",
      },
      { property: "og:title", content: "Gerador de Posts — StageKit" },
      { property: "og:description", content: "Divulgue seu próximo show em segundos." },
    ],
  }),
  component: CardGeneratorPage,
});

function paletteOf(kit: Tables<"brand_kits"> | undefined): BrandPalette {
  const raw = kit?.palette;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "bg" in raw && "accent" in raw) {
    return raw as unknown as BrandPalette;
  }
  return presetPalette(kit?.preset ?? "neon_night");
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
  // Eventos sem data entram também (ex.: acabou de vir do Magic Paste sem
  // data fechada ainda) — mostram "Data a definir" no card.
  const upcoming = events.filter(
    (e) => e.status !== "CANCELADO" && (!e.event_date || e.event_date >= today),
  );

  const [eventId, setEventId] = useState("");
  const [exporting, setExporting] = useState(false);
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
  const brandKit = brandKits.find((k) => k.id === formation?.brand_kit_id);
  const preset = BRAND_PRESETS.find((p) => p.id === brandKit?.preset);
  const palette = paletteOf(brandKit);

  async function exportPng() {
    if (!cardRef.current || !event) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${event.title.replace(/[^\w-]+/g, "_") || "divulgacao"}.png`;
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
        <PageHeader title="Gerador de Posts" subtitle="Card de divulgação pronto pro Stories." />
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

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Gerador de Posts"
        subtitle="Card de divulgação (Stories) com a identidade visual da formação do show."
        actions={
          <Button onClick={exportPng} disabled={!event || exporting} size="sm">
            {exporting ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Download className="mr-1 size-4" />
            )}
            Baixar PNG
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
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

          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            {!formation ? (
              <p>Esse show não tem formação vinculada — usando visual padrão do StageKit.</p>
            ) : !brandKit ? (
              <p>
                A formação "{formation.name}" não tem brand kit vinculado.{" "}
                <Link to="/formacoes" className="text-primary hover:underline">
                  Vincular agora
                </Link>
                .
              </p>
            ) : (
              <p>
                Usando o brand kit "{brandKit.name}" ({preset?.label ?? brandKit.preset}).
              </p>
            )}
          </div>
        </Section>

        <div className="flex items-start justify-center">
          <div
            ref={cardRef}
            className="relative flex h-[640px] w-[360px] shrink-0 flex-col justify-end overflow-hidden rounded-2xl"
            style={{ background: palette.bg, color: palette.text }}
          >
            {brandKit?.photo_url ? (
              <img
                src={brandKit.photo_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div
              className="relative flex flex-col gap-2 p-7"
              style={{
                background: `linear-gradient(to top, ${palette.bg}f2 20%, ${palette.bg}00 75%)`,
              }}
            >
              {brandKit?.logo_url ? (
                <img
                  src={brandKit.logo_url}
                  alt="Logo"
                  className="mb-3 h-10 max-w-[140px] object-contain"
                />
              ) : null}
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: palette.accent }}
              >
                {profile?.stage_name || "StageKit"}
              </p>
              <p className="text-3xl font-extrabold leading-tight">{event?.title}</p>
              <p className="text-sm opacity-90">
                {event?.event_date ? dateBR(event.event_date) : "Data a definir"}
                {event?.start_time ? ` · ${event.start_time}` : ""}
              </p>
              <p className="text-sm opacity-90">
                {[event?.venue, event?.city].filter(Boolean).join(", ") || "Local a definir"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
