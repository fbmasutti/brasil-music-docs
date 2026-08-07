import { Music2, Trash2, Plus, Speaker } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

/** Porte físico real do equipamento traduzido em células da grade:
 * `sm` 1x1 (DI, tomada, microfone), `md` 2x1 (monitor, cubo, cajón) e
 * `lg` 2x2 (bateria, praticável, P.A., console). É isso que dá proporção ao
 * mapa — um pedal de DI não pode ocupar o mesmo espaço de uma bateria. */
export type StageSize = "sm" | "md" | "lg";

export const STAGE_KINDS: {
  kind: StageKind;
  label: string;
  iconSrc?: string;
  icon?: ReactNode;
  size: StageSize;
}[] = [
  { kind: "voz", label: "Voz / microfone", iconSrc: "/stage-icons/microfone.svg", size: "sm" },
  { kind: "guitarra", label: "Guitarra", iconSrc: "/stage-icons/guitarra.svg", size: "md" },
  { kind: "violao", label: "Violão", iconSrc: "/stage-icons/violao.svg", size: "md" },
  { kind: "cavaco", label: "Cavaco / Banjo", iconSrc: "/stage-icons/cavaco.svg", size: "sm" },
  { kind: "baixo", label: "Baixo", iconSrc: "/stage-icons/baixo.svg", size: "md" },
  { kind: "violino", label: "Violino", iconSrc: "/stage-icons/violino.svg", size: "md" },
  { kind: "bateria", label: "Bateria", iconSrc: "/stage-icons/bateria.svg", size: "lg" },
  { kind: "cajon", label: "Cajón", iconSrc: "/stage-icons/cajon.svg", size: "md" },
  { kind: "conga", label: "Conga", iconSrc: "/stage-icons/conga.svg", size: "md" },
  { kind: "pandeiro", label: "Pandeiro", iconSrc: "/stage-icons/pandeiro.svg", size: "sm" },
  { kind: "tantan", label: "Tantã", iconSrc: "/stage-icons/tantan.svg", size: "md" },
  { kind: "teclado", label: "Teclado", iconSrc: "/stage-icons/teclado.svg", size: "md" },
  {
    kind: "sintetizador",
    label: "Sintetizador / MIDI",
    iconSrc: "/stage-icons/sintetizador.svg",
    size: "md",
  },
  { kind: "monitor", label: "Monitor / Retorno", iconSrc: "/stage-icons/monitor.svg", size: "md" },
  {
    kind: "monitor_esquerdo",
    label: "Monitor esquerdo",
    iconSrc: "/stage-icons/monitor-esquerdo.svg",
    size: "md",
  },
  {
    kind: "monitor_direito",
    label: "Monitor direito",
    iconSrc: "/stage-icons/monitor-direito.svg",
    size: "md",
  },
  { kind: "subwoofer", label: "P.A. / Subwoofer", iconSrc: "/stage-icons/subwoofer.svg", size: "lg" },
  {
    kind: "cubo_guitarra",
    label: "Cubo de guitarra",
    iconSrc: "/stage-icons/cubo-guitarra.svg",
    size: "md",
  },
  { kind: "cubo_baixo", label: "Cubo de baixo", iconSrc: "/stage-icons/cubo-baixo.svg", size: "lg" },
  {
    kind: "cabeca_amplificador",
    label: "Amplificador (cabeçote + caixa)",
    iconSrc: "/stage-icons/cabeca-amplificador.svg",
    size: "lg",
  },
  { kind: "pedalboard", label: "Pedalboard", iconSrc: "/stage-icons/pedalboard.svg", size: "sm" },
  { kind: "sax", label: "Sax", iconSrc: "/stage-icons/sax.svg", size: "md" },
  { kind: "trombone", label: "Trombone", iconSrc: "/stage-icons/trombone.svg", size: "md" },
  { kind: "trompete", label: "Trompete", iconSrc: "/stage-icons/trompete.svg", size: "md" },
  { kind: "di_box", label: "DI box", iconSrc: "/stage-icons/di-box.svg", size: "sm" },
  {
    kind: "ponto_energia",
    label: "Ponto de energia",
    iconSrc: "/stage-icons/ponto-energia.svg",
    size: "sm",
  },
  { kind: "praticavel", label: "Praticável", iconSrc: "/stage-icons/praticavel.svg", size: "lg" },
  { kind: "toca_discos", label: "Toca-discos", iconSrc: "/stage-icons/toca-discos.svg", size: "md" },
  { kind: "mpc", label: "MPC / Sampler", iconSrc: "/stage-icons/mpc.svg", size: "sm" },
  {
    kind: "mesa_som",
    label: "Console / Mesa de Som",
    iconSrc: "/stage-icons/mesa-som.svg",
    size: "lg",
  },
  { kind: "outro", label: "Outro", icon: <Music2 className="size-4" />, size: "sm" },
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
    // SVGs próprios usam preenchimento escuro fixo (não currentColor) —
    // sem backdrop claro, somem no fundo escuro do tema dark.
    return (
      <img
        src={def.iconSrc}
        alt=""
        className={cn("h-full w-full rounded-md object-contain dark:bg-white/90 dark:p-1", className)}
      />
    );
  }
  return <>{def?.icon ?? <Music2 className={className} />}</>;
}

/** Grade ampliada: 9 colunas x 6 linhas dá conta de formações complexas
 * (percussão, naipe de metais, side fills e amplificadores) e mantém uma
 * coluna central de verdade para bateria e voz principal. */
export const COLS = 9;
export const ROWS = 6;

const LEGACY_COLS = 5;
const LEGACY_ROWS = 3;

/** Mapas salvos na grade antiga (5x3) são reposicionados na grade nova para
 * não ficarem todos empilhados no fundo à esquerda. */
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
  return (
    col < a.col + sa.w && col + span.w > a.col && row < a.row + sa.h && row + span.h > a.row
  );
}

function fits(items: StageItem[], kind: StageKind, col: number, row: number, ignoreId?: string) {
  const span = spanOf(kind);
  if (col < 0 || row < 0 || col + span.w > COLS || row + span.h > ROWS) return false;
  return !items.some((i) => i.id !== ignoreId && overlaps(i, col, row, span));
}

function findSpot(items: StageItem[], kind: StageKind) {
  const center = Math.floor(COLS / 2);
  const order = [center, ...Array.from({ length: COLS }, (_, i) => i).filter((c) => c !== center)];
  // Começa pela frente do palco (linha da plateia) e sobe.
  for (let row = ROWS - 1; row >= 0; row--) {
    for (const col of order) {
      if (fits(items, kind, col, row)) return { col, row };
    }
  }
  return null;
}

/** Mapa de palco em grade 9x6, com elementos de tamanhos diferentes conforme o
 * porte real do equipamento. Arrastar move; a lixeira remove. */
export function StagePlot({
  items,
  onChange,
}: {
  items: StageItem[];
  onChange: (items: StageItem[]) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [warning, setWarning] = useState<string | null>(null);

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

  /** Converte a posição do mouse na grade em célula (col/row). */
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
    // Encaixa dentro do palco mesmo quando o ponteiro cai na borda.
    const col = Math.min(cell.col, COLS - span.w);
    const row = Math.min(cell.row, ROWS - span.h);
    if (!fits(items, item.kind, col, row, item.id)) {
      setWarning(`"${item.label}" não cabe nesse ponto — já tem equipamento no lugar.`);
      return;
    }
    setWarning(null);
    onChange(items.map((i) => (i.id === id ? { ...i, col, row } : i)));
  }

  /** Um monitor por elemento da linha de frente que ainda não tem retorno
   * próximo — o palco quase sempre precisa de um por músico voltado à plateia. */
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">Adicionar ao palco:</Label>
        {STAGE_KINDS.map((k) => (
          <Button
            key={k.kind}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => add(k.kind)}
          >
            <span className="flex size-4 items-center justify-center">
              <StageIcon kind={k.kind} />
            </span>
            <span className="ml-1 text-xs">{k.label}</span>
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={suggestMonitors}>
          <Speaker className="mr-1 size-4" /> Sugerir monitores
        </Button>
      </div>

      {warning ? <p className="text-xs text-destructive">{warning}</p> : null}

      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <p className="mb-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Fundo do palco
        </p>
        {/* A grade é espacial (representa o palco), então não pode empilhar no
            celular — rola horizontalmente mantendo a proporção. */}
        <div className="overflow-x-auto">
          <div
            ref={gridRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative min-w-[720px]"
          >
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, 64px)`,
              }}
            >
              {Array.from({ length: ROWS * COLS }).map((_, index) => {
                const col = index % COLS;
                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-md border border-dashed border-border/60",
                      col === Math.floor(COLS / 2) && "border-primary/40 bg-primary/5",
                    )}
                  />
                );
              })}
            </div>
            <div
              className="pointer-events-none absolute inset-0 grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, 64px)`,
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
                    className="group pointer-events-auto relative flex cursor-grab items-center justify-center rounded-md bg-background/40 p-1"
                  >
                    <button
                      type="button"
                      aria-label={`Remover ${item.label}`}
                      className="absolute -right-1 -top-1 z-10 rounded-full bg-background text-destructive opacity-0 shadow-sm group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <StageIcon kind={item.kind} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Plateia
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Arraste os elementos para posicionar. Equipamentos maiores (bateria, P.A., console) ocupam
        mais células — a coluna destacada é o centro do palco.
      </p>
    </div>
  );
}

/**
 * Versão estática do mapa para embutir no PDF: sem arrastar, sem lixeira e
 * com cores claras, já que o PDF é impresso em papel branco. Mantém a mesma
 * grade e os mesmos ícones da tela, então trocar os ícones melhora os dois.
 */
export const PRINT_PLOT_WIDTH = 1200;
export const PRINT_PLOT_HEIGHT = 880;

export function StagePlotPrintable({ items }: { items: StageItem[] }) {
  const cell = 120;
  return (
    <div
      style={{
        width: PRINT_PLOT_WIDTH,
        height: PRINT_PLOT_HEIGHT,
        background: "#ffffff",
        color: "#18181b",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#71717a",
          margin: 0,
        }}
      >
        Fundo do palco
      </p>
      <div style={{ position: "relative", flex: 1 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, ${cell}px)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gap: 4,
            height: "100%",
          }}
        >
          {Array.from({ length: ROWS * COLS }).map((_, index) => (
            <div key={index} style={{ border: "1px dashed #e4e4e7", borderRadius: 4 }} />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, ${cell}px)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gap: 4,
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
                  justifyContent: "center",
                  gap: 2,
                  padding: 2,
                  overflow: "hidden",
                  fontWeight: 600,
                  color: "#3f3f46",
                }}
              >
                <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%" }}>
                  <StageIcon kind={item.kind} />
                </div>
                {/* No papel não dá pra passar o mouse pra ver o nome, então a
                    legenda fica — só bem discreta. */}
                <span
                  style={{
                    fontSize: 8,
                    lineHeight: 1.1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    maxWidth: "100%",
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
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#71717a",
          margin: 0,
        }}
      >
        Plateia
      </p>
    </div>
  );
}

/** Renomear rótulo de um elemento (usado no assistente). */
export function StageItemLabels({
  items,
  onChange,
}: {
  items: StageItem[];
  onChange: (items: StageItem[]) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Select
            value={item.kind}
            onValueChange={(v) =>
              onChange(items.map((i) => (i.id === item.id ? { ...i, kind: v as StageKind } : i)))
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_KINDS.map((k) => (
                <SelectItem key={k.kind} value={k.kind}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
            value={item.label}
            onChange={(e) =>
              onChange(items.map((i) => (i.id === item.id ? { ...i, label: e.target.value } : i)))
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remover"
            onClick={() => onChange(items.filter((i) => i.id !== item.id))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export const PlusIcon = Plus;
