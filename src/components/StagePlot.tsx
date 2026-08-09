import { Music2, Trash2, Plus, Speaker, Search, Sparkles, ArrowDown, ArrowUp } from "lucide-react";
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

export const STAGE_CATEGORIES: { key: StageCategoryKey; label: string; color: string }[] = [
  { key: "voz_cordas", label: "Voz & Cordas", color: "sky" },
  { key: "bateria_percussao", label: "Bateria & Percussão", color: "amber" },
  { key: "teclas_eletronicos", label: "Teclas & Eletrônicos", color: "emerald" },
  { key: "amplificacao_monitores", label: "Amplificadores & Retornos", color: "rose" },
  { key: "sopros_infra", label: "Sopros & Infra", color: "indigo" },
];

export const STAGE_KINDS: {
  kind: StageKind;
  label: string;
  category: StageCategoryKey;
  iconSrc?: string;
  icon?: ReactNode;
  size: StageSize;
  rotateDeg?: number;
  scaleRatio?: number;
}[] = [
  // Voz & Cordas
  {
    kind: "voz",
    label: "Voz / microfone",
    category: "voz_cordas",
    iconSrc: "/stage-icons/microfone.svg",
    size: "sm",
    scaleRatio: 1.3,
  },
  {
    kind: "guitarra",
    label: "Guitarra",
    category: "voz_cordas",
    iconSrc: "/stage-icons/guitarra.svg",
    size: "md",
    rotateDeg: -45,
    scaleRatio: 1.45,
  },
  {
    kind: "violao",
    label: "Violão",
    category: "voz_cordas",
    iconSrc: "/stage-icons/violao.svg",
    size: "md",
    rotateDeg: -45,
    scaleRatio: 1.45,
  },
  {
    kind: "cavaco",
    label: "Cavaco / Banjo",
    category: "voz_cordas",
    iconSrc: "/stage-icons/cavaco.svg",
    size: "sm",
    rotateDeg: -45,
    scaleRatio: 1.35,
  },
  {
    kind: "baixo",
    label: "Baixo",
    category: "voz_cordas",
    iconSrc: "/stage-icons/baixo.svg",
    size: "md",
    rotateDeg: -45,
    scaleRatio: 1.45,
  },
  {
    kind: "violino",
    label: "Violino",
    category: "voz_cordas",
    iconSrc: "/stage-icons/violino.svg",
    size: "md",
    rotateDeg: -35,
    scaleRatio: 1.35,
  },
  {
    kind: "pedalboard",
    label: "Pedalboard",
    category: "voz_cordas",
    iconSrc: "/stage-icons/pedalboard.svg",
    size: "sm",
    scaleRatio: 1.25,
  },

  // Bateria & Percussão
  {
    kind: "bateria",
    label: "Bateria",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/bateria.svg",
    size: "lg",
    scaleRatio: 1.3,
  },
  {
    kind: "cajon",
    label: "Cajón",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/cajon.svg",
    size: "md",
    scaleRatio: 1.3,
  },
  {
    kind: "conga",
    label: "Conga",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/conga.svg",
    size: "md",
    scaleRatio: 1.3,
  },
  {
    kind: "pandeiro",
    label: "Pandeiro",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/pandeiro.svg",
    size: "sm",
    scaleRatio: 1.3,
  },
  {
    kind: "tantan",
    label: "Tantã",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/tantan.svg",
    size: "md",
    scaleRatio: 1.3,
  },

  // Teclas & Eletrônicos
  {
    kind: "teclado",
    label: "Teclado",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/teclado.svg",
    size: "md",
    scaleRatio: 1.3,
  },
  {
    kind: "sintetizador",
    label: "Sintetizador / MIDI",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/sintetizador.svg",
    size: "md",
    scaleRatio: 1.3,
  },
  {
    kind: "toca_discos",
    label: "Toca-discos",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/toca-discos.svg",
    size: "md",
    scaleRatio: 1.3,
  },
  {
    kind: "mpc",
    label: "MPC / Sampler",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/mpc.svg",
    size: "sm",
    scaleRatio: 1.25,
  },

  // Amplificadores & Retornos
  {
    kind: "monitor",
    label: "Monitor / Retorno",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor.svg",
    size: "md",
    scaleRatio: 1.3,
  },
  {
    kind: "monitor_esquerdo",
    label: "Monitor esquerdo",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor-esquerdo.svg",
    size: "md",
    scaleRatio: 1.3,
  },
  {
    kind: "monitor_direito",
    label: "Monitor direito",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor-direito.svg",
    size: "md",
    scaleRatio: 1.3,
  },
  {
    kind: "subwoofer",
    label: "P.A. / Subwoofer",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/subwoofer.svg",
    size: "lg",
    scaleRatio: 1.25,
  },
  {
    kind: "cubo_guitarra",
    label: "Cubo de guitarra",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cubo-guitarra.svg",
    size: "md",
    scaleRatio: 1.3,
  },
  {
    kind: "cubo_baixo",
    label: "Cubo de baixo",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cubo-baixo.svg",
    size: "lg",
    scaleRatio: 1.3,
  },
  {
    kind: "cabeca_amplificador",
    label: "Amplificador (cabeçote + caixa)",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cabeca-amplificador.svg",
    size: "lg",
    scaleRatio: 1.25,
  },
  {
    kind: "di_box",
    label: "DI box",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/di-box.svg",
    size: "sm",
    scaleRatio: 1.25,
  },
  {
    kind: "mesa_som",
    label: "Console / Mesa de Som",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/mesa-som.svg",
    size: "lg",
    scaleRatio: 1.25,
  },

  // Sopros & Infra
  {
    kind: "sax",
    label: "Sax",
    category: "sopros_infra",
    iconSrc: "/stage-icons/sax.svg",
    size: "md",
    rotateDeg: -25,
    scaleRatio: 1.35,
  },
  {
    kind: "trombone",
    label: "Trombone",
    category: "sopros_infra",
    iconSrc: "/stage-icons/trombone.svg",
    size: "md",
    rotateDeg: -30,
    scaleRatio: 1.35,
  },
  {
    kind: "trompete",
    label: "Trompete",
    category: "sopros_infra",
    iconSrc: "/stage-icons/trompete.svg",
    size: "md",
    rotateDeg: -30,
    scaleRatio: 1.35,
  },
  {
    kind: "ponto_energia",
    label: "Ponto de energia",
    category: "sopros_infra",
    iconSrc: "/stage-icons/ponto-energia.svg",
    size: "sm",
    scaleRatio: 1.25,
  },
  {
    kind: "praticavel",
    label: "Praticável",
    category: "sopros_infra",
    iconSrc: "/stage-icons/praticavel.svg",
    size: "lg",
    scaleRatio: 1.15,
  },
  {
    kind: "outro",
    label: "Outro",
    category: "sopros_infra",
    icon: <Music2 className="size-8 text-primary" />,
    size: "sm",
    scaleRatio: 1.2,
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

function categoryColorStyles(category: StageCategoryKey) {
  switch (category) {
    case "voz_cordas":
      return "border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/5";
    case "bateria_percussao":
      return "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5";
    case "teclas_eletronicos":
      return "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5";
    case "amplificacao_monitores":
      return "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/5";
    case "sopros_infra":
      return "border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5";
  }
}

function StageIcon({ kind, className }: { kind: StageKind; className?: string }) {
  const def = STAGE_KINDS.find((k) => k.kind === kind);
  const rot = def?.rotateDeg ?? 0;
  const scale = def?.scaleRatio ?? 1.25;
  const transform = `rotate(${rot}deg) scale(${scale})`;

  if (def?.iconSrc) {
    return (
      <div
        className={cn("flex size-full items-center justify-center p-0 overflow-visible", className)}
      >
        <img
          src={def.iconSrc}
          alt={def.label}
          style={{ transform }}
          className="h-full w-full object-contain filter drop-shadow-sm dark:invert dark:brightness-200 transition-transform duration-200"
        />
      </div>
    );
  }
  return (
    <div
      className={cn("flex size-full items-center justify-center p-0 overflow-visible", className)}
    >
      <div style={{ transform }}>{def?.icon ?? <Music2 className="size-8 text-primary" />}</div>
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

      {/* Grade Interativa do Palco com Moldura Profissional de Rider */}
      <div className="rounded-xl border-2 border-border bg-gradient-to-b from-muted/20 to-transparent p-4 shadow-sm space-y-2">
        {/* Cabeçalho do Fundo do Palco */}
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/60 pb-2">
          <span className="text-[10px] text-muted-foreground/70">
            LATERAIS / SIDE FILL ESQUERDO
          </span>
          <span className="flex items-center gap-1 text-primary">
            <ArrowUp className="size-3" /> FUNDO DO PALCO / BACKSTAGE <ArrowUp className="size-3" />
          </span>
          <span className="text-[10px] text-muted-foreground/70">LATERAIS / SIDE FILL DIREITO</span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div
            ref={gridRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative min-w-[800px]"
          >
            {/* Linhas da Grade do Palco sem Fundo Roxo */}
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, 96px)`,
              }}
            >
              {Array.from({ length: ROWS * COLS }).map((_, index) => {
                const col = index % COLS;
                const isCenter = col === Math.floor(COLS / 2);
                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-lg border border-dashed border-border/60 bg-background/20 transition-colors relative",
                      isCenter && "border-border/90",
                    )}
                  >
                    {isCenter && index < COLS && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase text-muted-foreground/60 bg-background px-1 border rounded">
                        Eixo Central
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ícones de Equipamentos sem Fundo Branco e Proporcionais */}
            <div
              className="pointer-events-none absolute inset-0 grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, 96px)`,
              }}
            >
              {items.map((item) => {
                const span = spanOf(item.kind);
                const category =
                  STAGE_KINDS.find((k) => k.kind === item.kind)?.category ?? "sopros_infra";
                const colorStyle = categoryColorStyles(category);

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
                    className={cn(
                      "group pointer-events-auto relative flex cursor-grab active:cursor-grabbing flex-col items-center justify-between rounded-lg border-2 backdrop-blur-2xs p-1 shadow-xs hover:shadow-md transition-all hover:scale-[1.02]",
                      colorStyle,
                    )}
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

                    <span className="w-full truncate text-[10px] font-bold text-center leading-none text-foreground bg-background/90 py-1 px-1.5 rounded-xs border border-border/60 shadow-2xs mt-0.5">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé da Frente do Palco */}
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground border-t border-border/60 pt-2">
          <span className="text-[10px] text-muted-foreground/70">P.A. ESQUERDO (L)</span>
          <span className="flex items-center gap-1 text-primary">
            <ArrowDown className="size-3" /> FRENTE DO PALCO / PLATEIA (HOUSE MIX){" "}
            <ArrowDown className="size-3" />
          </span>
          <span className="text-[10px] text-muted-foreground/70">P.A. DIREITO (R)</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 <strong>Mapa de Palco Profissional:</strong> Arraste os elementos para posicionar.
        Equipamentos de grande porte (Bateria, Console, P.A.) ocupam proporções maiores na grade
        para clareza técnica do produtor de áudio.
      </p>
    </div>
  );
}

/**
 * Versão estática do mapa para embutir no PDF: visual vetorizado de padrão profissional.
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
        border: "2px solid #27272a",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #27272a",
          paddingBottom: 6,
        }}
      >
        <span
          style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#71717a" }}
        >
          SIDE FILL (L)
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            textTransform: "uppercase",
            color: "#18181b",
            letterSpacing: "0.1em",
          }}
        >
          ▲ FUNDO DO PALCO / BACKSTAGE ▲
        </span>
        <span
          style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#71717a" }}
        >
          SIDE FILL (R)
        </span>
      </div>

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
              style={{ border: "1px dashed #e4e4e7", borderRadius: 6, background: "#fafafa" }}
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
                  border: "2px dashed #3f3f46",
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
                    fontWeight: 800,
                    lineHeight: 1.1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    maxWidth: "100%",
                    color: "#18181b",
                    background: "#ffffff",
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: "1px solid #18181b",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "2px solid #27272a",
          paddingTop: 6,
        }}
      >
        <span
          style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#71717a" }}
        >
          P.A. ESQUERDO (L)
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            textTransform: "uppercase",
            color: "#18181b",
            letterSpacing: "0.1em",
          }}
        >
          ▼ FRENTE DO PALCO / PLATEIA (HOUSE MIX) ▼
        </span>
        <span
          style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#71717a" }}
        >
          P.A. DIREITO (R)
        </span>
      </div>
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
