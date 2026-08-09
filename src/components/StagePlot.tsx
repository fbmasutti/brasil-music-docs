import { Music2, Trash2, Plus, Speaker, Search, Sparkles } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type StageItem = { id: string; kind: StageKind; label: string; col: number; row: number };

export type StageKind =
  | "voz"
  | "guitarra"
  | "violao"
  | "cavaco"
  | "baixo"
  | "bateria"
  | "cajon"
  | "conga"
  | "pandeiro"
  | "tantan"
  | "teclado"
  | "sintetizador"
  | "monitor"
  | "monitor_esquerdo"
  | "monitor_direito"
  | "subwoofer"
  | "cubo_guitarra"
  | "cubo_baixo"
  | "cabeca_amplificador"
  | "pedalboard"
  | "sax"
  | "trombone"
  | "trompete"
  | "violino"
  | "di_box"
  | "ponto_energia"
  | "praticavel"
  | "toca_discos"
  | "mpc"
  | "mesa_som"
  | "outro";

export type StageSize = "sm" | "md" | "lg";

export type StageCategoryKey =
  | "voz_cordas"
  | "bateria_percussao"
  | "teclas_eletronicos"
  | "amplificacao_monitores"
  | "sopros_infra";

export const STAGE_CATEGORIES: { key: StageCategoryKey; label: string }[] = [
  { key: "voz_cordas", label: "Voz & Cordas" },
  { key: "bateria_percussao", label: "Bateria & Percussão" },
  { key: "teclas_eletronicos", label: "Teclas & Eletrônicos" },
  { key: "amplificacao_monitores", label: "Amplificadores & Retornos" },
  { key: "sopros_infra", label: "Sopros & Infra" },
];

export const STAGE_KINDS: {
  kind: StageKind;
  label: string;
  category: StageCategoryKey;
  iconSrc?: string;
  icon?: ReactNode;
  size: StageSize;
}[] = [
  // Voz & Cordas
  {
    kind: "voz",
    label: "Voz / microfone",
    category: "voz_cordas",
    iconSrc: "/stage-icons/microfone.svg",
    size: "sm",
  },
  {
    kind: "guitarra",
    label: "Guitarra",
    category: "voz_cordas",
    iconSrc: "/stage-icons/guitarra.svg",
    size: "md",
  },
  {
    kind: "violao",
    label: "Violão",
    category: "voz_cordas",
    iconSrc: "/stage-icons/violao.svg",
    size: "md",
  },
  {
    kind: "cavaco",
    label: "Cavaco / Banjo",
    category: "voz_cordas",
    iconSrc: "/stage-icons/cavaco.svg",
    size: "sm",
  },
  {
    kind: "baixo",
    label: "Baixo",
    category: "voz_cordas",
    iconSrc: "/stage-icons/baixo.svg",
    size: "md",
  },
  {
    kind: "violino",
    label: "Violino",
    category: "voz_cordas",
    iconSrc: "/stage-icons/violino.svg",
    size: "md",
  },
  {
    kind: "pedalboard",
    label: "Pedalboard",
    category: "voz_cordas",
    iconSrc: "/stage-icons/pedalboard.svg",
    size: "sm",
  },

  // Bateria & Percussão
  {
    kind: "bateria",
    label: "Bateria",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/bateria.svg",
    size: "lg",
  },
  {
    kind: "cajon",
    label: "Cajón",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/cajon.svg",
    size: "md",
  },
  {
    kind: "conga",
    label: "Conga",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/conga.svg",
    size: "md",
  },
  {
    kind: "pandeiro",
    label: "Pandeiro",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/pandeiro.svg",
    size: "sm",
  },
  {
    kind: "tantan",
    label: "Tantã",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/tantan.svg",
    size: "md",
  },

  // Teclas & Eletrônicos
  {
    kind: "teclado",
    label: "Teclado",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/teclado.svg",
    size: "md",
  },
  {
    kind: "sintetizador",
    label: "Sintetizador / MIDI",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/sintetizador.svg",
    size: "md",
  },
  {
    kind: "toca_discos",
    label: "Toca-discos",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/toca-discos.svg",
    size: "md",
  },
  {
    kind: "mpc",
    label: "MPC / Sampler",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/mpc.svg",
    size: "sm",
  },

  // Amplificadores & Retornos
  {
    kind: "monitor",
    label: "Monitor / Retorno",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor.svg",
    size: "md",
  },
  {
    kind: "monitor_esquerdo",
    label: "Monitor esquerdo",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor-esquerdo.svg",
    size: "md",
  },
  {
    kind: "monitor_direito",
    label: "Monitor direito",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor-direito.svg",
    size: "md",
  },
  {
    kind: "subwoofer",
    label: "P.A. / Subwoofer",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/subwoofer.svg",
    size: "lg",
  },
  {
    kind: "cubo_guitarra",
    label: "Cubo de guitarra",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cubo-guitarra.svg",
    size: "md",
  },
  {
    kind: "cubo_baixo",
    label: "Cubo de baixo",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cubo-baixo.svg",
    size: "lg",
  },
  {
    kind: "cabeca_amplificador",
    label: "Amplificador (cabeçote + caixa)",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cabeca-amplificador.svg",
    size: "lg",
  },
  {
    kind: "di_box",
    label: "DI box",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/di-box.svg",
    size: "sm",
  },
  {
    kind: "mesa_som",
    label: "Console / Mesa de Som",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/mesa-som.svg",
    size: "lg",
  },

  // Sopros & Infra
  {
    kind: "sax",
    label: "Sax",
    category: "sopros_infra",
    iconSrc: "/stage-icons/sax.svg",
    size: "md",
  },
  {
    kind: "trombone",
    label: "Trombone",
    category: "sopros_infra",
    iconSrc: "/stage-icons/trombone.svg",
    size: "md",
  },
  {
    kind: "trompete",
    label: "Trompete",
    category: "sopros_infra",
    iconSrc: "/stage-icons/trompete.svg",
    size: "md",
  },
  {
    kind: "ponto_energia",
    label: "Ponto de energia",
    category: "sopros_infra",
    iconSrc: "/stage-icons/ponto-energia.svg",
    size: "sm",
  },
  {
    kind: "praticavel",
    label: "Praticável",
    category: "sopros_infra",
    iconSrc: "/stage-icons/praticavel.svg",
    size: "lg",
  },
  {
    kind: "outro",
    label: "Outro",
    category: "sopros_infra",
    icon: <Music2 className="size-8 text-primary" />,
    size: "sm",
  },
];

const SPANS: Record<StageSize, { w: number; h: number }> = {
  sm: { w: 1, h: 1 },
  md: { w: 2, h: 1 },
  lg: { w: 2, h: 2 },
};

export function spanOf(kind: StageKind) {
  const size = STAGE_KINDS.find((k) => k.kind === kind)?.size ?? "sm";
  return SPANS[size];
}

function StageIcon({ kind, className }: { kind: StageKind; className?: string }) {
  const def = STAGE_KINDS.find((k) => k.kind === kind);
  if (def?.iconSrc) {
    return (
      <div className={cn("flex size-full items-center justify-center p-0", className)}>
        <img
          src={def.iconSrc}
          alt={def.label}
          className="h-full w-full object-contain filter drop-shadow-xs dark:invert dark:brightness-200"
        />
      </div>
    );
  }
  return (
    <div className={cn("flex size-full items-center justify-center p-0", className)}>
      {def?.icon ?? <Music2 className="size-8 text-primary" />}
    </div>
  );
}

export const COLS = 9;
export const ROWS = 6;

const LEGACY_COLS = 5;
const LEGACY_ROWS = 3;

function upgradeLegacy(items: StageItem[]): StageItem[] {
  const legacy = items.every((i) => i.col < LEGACY_COLS && i.row < LEGACY_ROWS);
  if (!legacy || items.length === 0) return items;
  return items.map((i) => ({
    ...i,
    col: Math.min(COLS - spanOf(i.kind).w, i.col * 2),
    row: Math.min(ROWS - spanOf(i.kind).h, i.row * 2 + (ROWS - LEGACY_ROWS * 2)),
  }));
}

export function parseStagePlot(raw: unknown): StageItem[] {
  if (!Array.isArray(raw)) return [];
  const items = raw.filter(
    (i): i is StageItem =>
      Boolean(i) && typeof i === "object" && "kind" in (i as object) && "col" in (i as object),
  );
  return upgradeLegacy(items);
}

function overlaps(a: StageItem, col: number, row: number, span: { w: number; h: number }) {
  const sa = spanOf(a.kind);
  return col < a.col + sa.w && col + span.w > a.col && row < a.row + sa.h && row + span.h > a.row;
}

function fits(items: StageItem[], kind: StageKind, col: number, row: number, ignoreId?: string) {
  const span = spanOf(kind);
  if (col < 0 || row < 0 || col + span.w > COLS || row + span.h > ROWS) return false;
  return !items.some((i) => i.id !== ignoreId && overlaps(i, col, row, span));
}

function findSpot(items: StageItem[], kind: StageKind) {
  const center = Math.floor(COLS / 2);
  const order = [center, ...Array.from({ length: COLS }, (_, i) => i).filter((c) => c !== center)];
  for (let row = ROWS - 1; row >= 0; row--) {
    for (const col of order) {
      if (fits(items, kind, col, row)) return { col, row };
    }
  }
  return null;
}

export function StagePlot({
  items,
  onChange,
}: {
  items: StageItem[];
  onChange: (items: StageItem[]) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<StageCategoryKey>("voz_cordas");
  const [searchQuery, setSearchQuery] = useState("");

  function add(kind: StageKind) {
    const spot = findSpot(items, kind);
    if (!spot) {
      setWarning("O palco está cheio. Remova ou reposicione algum elemento.");
      return;
    }
    setWarning(null);
    const label = STAGE_KINDS.find((k) => k.kind === kind)?.label ?? "Outro";
    onChange([...items, { id: crypto.randomUUID(), kind, label, col: spot.col, row: spot.row }]);
  }

  function cellFromPointer(clientX: number, clientY: number) {
    const el = gridRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const col = Math.floor(((clientX - rect.left) / rect.width) * COLS);
    const row = Math.floor(((clientY - rect.top) / rect.height) * ROWS);
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return null;
    return { col, row };
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const item = items.find((i) => i.id === id);
    const cell = cellFromPointer(e.clientX, e.clientY);
    if (!item || !cell) return;
    const span = spanOf(item.kind);
    const col = Math.min(cell.col, COLS - span.w);
    const row = Math.min(cell.row, ROWS - span.h);
    if (!fits(items, item.kind, col, row, item.id)) {
      setWarning(`"${item.label}" não cabe nesse ponto — já tem equipamento no lugar.`);
      return;
    }
    setWarning(null);
    onChange(items.map((i) => (i.id === id ? { ...i, col, row } : i)));
  }

  function suggestMonitors() {
    const frontRow = ROWS - 1;
    let next = [...items];
    for (const item of items) {
      if (item.row < frontRow - 1 || item.kind.startsWith("monitor")) continue;
      const near = next.some(
        (i) => i.kind.startsWith("monitor") && Math.abs(i.col - item.col) <= 1,
      );
      if (near) continue;
      const spot = findSpot(next, "monitor");
      if (!spot) break;
      next = [
        ...next,
        {
          id: crypto.randomUUID(),
          kind: "monitor",
          label: `Monitor — ${item.label}`,
          col: spot.col,
          row: spot.row,
        },
      ];
    }
    if (next.length !== items.length) onChange(next);
  }

  const filteredKinds = searchQuery.trim()
    ? STAGE_KINDS.filter((k) => k.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : STAGE_KINDS.filter((k) => k.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Painel Organizado de Equipamentos (Categorias + Busca) */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> Adicionar Equipamento ao Palco
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar instrumento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {/* Abas de Categorias */}
        {!searchQuery.trim() && (
          <div className="flex flex-wrap gap-1 border-b border-border/60 pb-2">
            {STAGE_CATEGORIES.map((cat) => (
              <Button
                key={cat.key}
                type="button"
                variant={activeCategory === cat.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveCategory(cat.key)}
                className="h-7 px-2.5 text-xs font-medium"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        )}

        {/* Lista de Botões Filtrados */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filteredKinds.length > 0 ? (
            filteredKinds.map((k) => (
              <Button
                key={k.kind}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => add(k.kind)}
                className="h-8 border-border/80 bg-background hover:bg-accent/60 transition-all"
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  <StageIcon kind={k.kind} />
                </span>
                <span className="ml-1.5 text-xs font-medium">{k.label}</span>
                <Badge
                  variant="secondary"
                  className="ml-1 px-1 py-0 text-[9px] uppercase font-mono"
                >
                  {k.size}
                </Badge>
              </Button>
            ))
          ) : (
            <p className="py-2 text-xs text-muted-foreground">
              Nenhum instrumento encontrado para "{searchQuery}".
            </p>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={suggestMonitors}
            className="h-8 text-xs font-medium ml-auto"
          >
            <Speaker className="mr-1 size-3.5 text-primary" /> Sugerir Monitores
          </Button>
        </div>
      </div>

      {warning ? <p className="text-xs text-destructive font-medium">{warning}</p> : null}

      {/* Grade Interativa do Palco */}
      <div className="rounded-xl border border-border bg-gradient-to-b from-muted/20 to-transparent p-4 shadow-inner">
        <p className="mb-2.5 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
          <span className="h-px w-12 bg-border" /> Fundo do Palco{" "}
          <span className="h-px w-12 bg-border" />
        </p>

        <div className="overflow-x-auto pb-2">
          <div
            ref={gridRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative min-w-[780px]"
          >
            {/* Linhas de Fundo Neutras da Grade (Sem Fundo Roxo no Centro) */}
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, 96px)`,
              }}
            >
              {Array.from({ length: ROWS * COLS }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-dashed border-border/60 bg-muted/10 transition-colors"
                />
              ))}
            </div>

            {/* Elementos Posicionados no Palco (Sem fundo branco quadrado, ícones grandes) */}
            <div
              className="pointer-events-none absolute inset-0 grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, 96px)`,
              }}
            >
              {items.map((item) => {
                const span = spanOf(item.kind);
                return (
                  <div
                    key={item.id}
                    draggable
                    title={item.label}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                    style={{
                      gridColumn: `${item.col + 1} / span ${span.w}`,
                      gridRow: `${item.row + 1} / span ${span.h}`,
                    }}
                    className="group pointer-events-auto relative flex cursor-grab active:cursor-grabbing flex-col items-center justify-between rounded-lg border-2 border-primary/30 bg-background/40 hover:bg-background/80 backdrop-blur-2xs p-1 hover:border-primary hover:shadow-lg transition-all"
                  >
                    <button
                      type="button"
                      aria-label={`Remover ${item.label}`}
                      className="absolute -right-2 -top-2 z-30 rounded-full bg-destructive text-destructive-foreground p-1 opacity-0 shadow-md transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                    >
                      <Trash2 className="size-3.5" />
                    </button>

                    <div className="flex-1 min-h-0 w-full flex items-center justify-center p-0">
                      <StageIcon kind={item.kind} />
                    </div>

                    <span className="w-full truncate text-[10px] font-bold text-center leading-none text-foreground bg-background/90 py-1 px-1.5 rounded-xs border border-border/50 shadow-2xs mt-0.5">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-2.5 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
          <span className="h-px w-12 bg-border" /> Plateia <span className="h-px w-12 bg-border" />
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 <strong>Dica:</strong> Arraste os elementos para posicionar no palco. Equipamentos
        maiores ocupam mais células na grade.
      </p>
    </div>
  );
}

/**
 * Versão estática do mapa para embutir no PDF: ícones grandes e limpos.
 */
export const PRINT_PLOT_WIDTH = 1200;
export const PRINT_PLOT_HEIGHT_PORTRAIT = 880;
export const PRINT_PLOT_HEIGHT_LANDSCAPE = 675;

export function StagePlotPrintable({
  items,
  orientation = "retrato",
}: {
  items: StageItem[];
  orientation?: "retrato" | "paisagem";
}) {
  const isLandscape = orientation === "paisagem";
  const height = isLandscape ? PRINT_PLOT_HEIGHT_LANDSCAPE : PRINT_PLOT_HEIGHT_PORTRAIT;
  const cellHeight = isLandscape ? 100 : 132;

  return (
    <div
      style={{
        width: PRINT_PLOT_WIDTH,
        height,
        background: "#ffffff",
        color: "#18181b",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: "Inter, system-ui, sans-serif",
        borderRadius: 8,
        border: "1px solid #e4e4e7",
      }}
    >
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          letterSpacing: "0.15em",
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#71717a",
          margin: 0,
        }}
      >
        --- Fundo do Palco ---
      </p>
      <div style={{ position: "relative", flex: 1 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, ${cellHeight}px)`,
            gap: 6,
            height: "100%",
          }}
        >
          {Array.from({ length: ROWS * COLS }).map((_, index) => (
            <div
              key={index}
              style={{ border: "1px dashed #d4d4d8", borderRadius: 6, background: "#fafafa" }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, ${cellHeight}px)`,
            gap: 6,
          }}
        >
          {items.map((item) => {
            const span = spanOf(item.kind);
            return (
              <div
                key={item.id}
                style={{
                  gridColumn: `${item.col + 1} / span ${span.w}`,
                  gridRow: `${item.row + 1} / span ${span.h}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 4,
                  overflow: "hidden",
                  fontWeight: 600,
                  color: "#18181b",
                  background: "transparent",
                  border: "1.5px dashed #71717a",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 2,
                  }}
                >
                  <StageIcon kind={item.kind} />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    maxWidth: "100%",
                    color: "#18181b",
                    background: "#f4f4f5",
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: "1px solid #e4e4e7",
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          letterSpacing: "0.15em",
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#71717a",
          margin: 0,
        }}
      >
        --- Plateia ---
      </p>
    </div>
  );
}

export function StageItemLabels({
  items,
  onChange,
}: {
  items: StageItem[];
  onChange: (items: StageItem[]) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <Label className="text-xs font-semibold text-muted-foreground">
        Rótulos dos Equipamentos no Palco:
      </Label>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Select
            value={item.kind}
            onValueChange={(v) =>
              onChange(items.map((i) => (i.id === item.id ? { ...i, kind: v as StageKind } : i)))
            }
          >
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_KINDS.map((k) => (
                <SelectItem key={k.kind} value={k.kind} className="text-xs">
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            className="h-8 flex-1 rounded-md border border-input bg-background px-3 text-xs"
            value={item.label}
            onChange={(e) =>
              onChange(items.map((i) => (i.id === item.id ? { ...i, label: e.target.value } : i)))
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Remover"
            onClick={() => onChange(items.filter((i) => i.id !== item.id))}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export const PlusIcon = Plus;
