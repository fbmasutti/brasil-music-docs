import { Music2, Trash2, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  | "conga"
  | "pandeiro"
  | "tantan"
  | "teclado"
  | "monitor"
  | "cubo_guitarra"
  | "cubo_baixo"
  | "sax"
  | "trombone"
  | "trompete"
  | "violino"
  | "di_box"
  | "ponto_energia"
  | "praticavel"
  | "outro";

/** Ícone próprio em public/stage-icons (SVG desenhado), com fallback lucide para o
 * único elemento que ainda não tem arte dedicada ("outro", propositalmente genérico). */
export const STAGE_KINDS: { kind: StageKind; label: string; iconSrc?: string; icon?: ReactNode }[] =
  [
    { kind: "voz", label: "Voz", iconSrc: "/stage-icons/microfone.svg" },
    { kind: "guitarra", label: "Guitarra", iconSrc: "/stage-icons/guitarra.svg" },
    { kind: "violao", label: "Violão", iconSrc: "/stage-icons/violao.svg" },
    { kind: "cavaco", label: "Cavaco / Banjo", iconSrc: "/stage-icons/cavaco.svg" },
    { kind: "baixo", label: "Baixo", iconSrc: "/stage-icons/baixo.svg" },
    { kind: "violino", label: "Violino", iconSrc: "/stage-icons/violino.svg" },
    { kind: "bateria", label: "Bateria / Percussão", iconSrc: "/stage-icons/bateria.svg" },
    { kind: "conga", label: "Conga", iconSrc: "/stage-icons/conga.svg" },
    { kind: "pandeiro", label: "Pandeiro", iconSrc: "/stage-icons/pandeiro.svg" },
    { kind: "tantan", label: "Tantã", iconSrc: "/stage-icons/tantan.svg" },
    { kind: "teclado", label: "Teclado", iconSrc: "/stage-icons/teclado.svg" },
    { kind: "monitor", label: "Monitor / Retorno", iconSrc: "/stage-icons/monitor.svg" },
    { kind: "cubo_guitarra", label: "Cubo de guitarra", iconSrc: "/stage-icons/cubo-guitarra.svg" },
    { kind: "cubo_baixo", label: "Cubo de baixo", iconSrc: "/stage-icons/cubo-baixo.svg" },
    { kind: "sax", label: "Sax", iconSrc: "/stage-icons/sax.svg" },
    { kind: "trombone", label: "Trombone", iconSrc: "/stage-icons/trombone.svg" },
    { kind: "trompete", label: "Trompete", iconSrc: "/stage-icons/trompete.svg" },
    { kind: "di_box", label: "DI box", iconSrc: "/stage-icons/di-box.svg" },
    { kind: "ponto_energia", label: "Ponto de energia", iconSrc: "/stage-icons/ponto-energia.svg" },
    { kind: "praticavel", label: "Praticável", iconSrc: "/stage-icons/praticavel.svg" },
    { kind: "outro", label: "Outro", icon: <Music2 className="size-4" /> },
  ];

function StageIcon({ kind, className }: { kind: StageKind; className?: string }) {
  const def = STAGE_KINDS.find((k) => k.kind === kind);
  if (def?.iconSrc) {
    return <img src={def.iconSrc} alt="" className={className} />;
  }
  return <>{def?.icon ?? <Music2 className={className} />}</>;
}

const iconFor = (kind: StageKind) => <StageIcon kind={kind} className="size-4" />;

export const COLS = 4;
export const ROWS = 3;

export function parseStagePlot(raw: unknown): StageItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (i): i is StageItem =>
      Boolean(i) && typeof i === "object" && "kind" in (i as object) && "col" in (i as object),
  );
}

/** Mapa de palco em grade 4x3: adicionar, mover entre células e remover. */
export function StagePlot({
  items,
  onChange,
}: {
  items: StageItem[];
  onChange: (items: StageItem[]) => void;
}) {
  function add(kind: StageKind) {
    const taken = new Set(items.map((i) => `${i.col}-${i.row}`));
    let col = 0;
    let row = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        if (!taken.has(`${c}-${r}`)) {
          col = c;
          row = r;
          r = -1;
          break;
        }
      }
    }
    const label = STAGE_KINDS.find((k) => k.kind === kind)?.label ?? "Outro";
    onChange([...items, { id: crypto.randomUUID(), kind, label, col, row }]);
  }

  function drop(col: number, row: number, id: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, col, row } : i)));
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
            <StageIcon kind={k.kind} className="size-4" />
            <span className="ml-1 text-xs">{k.label}</span>
          </Button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <p className="mb-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Fundo do palco
        </p>
        {/* A grade é espacial (representa o palco), então não pode empilhar no
            celular — rola horizontalmente mantendo a proporção. */}
        <div className="overflow-x-auto">
          <div className="grid min-w-[420px] grid-cols-4 gap-2">
            {Array.from({ length: ROWS * COLS }).map((_, index) => {
              const col = index % COLS;
              const row = Math.floor(index / COLS);
              const cell = items.filter((i) => i.col === col && i.row === row);
              return (
                <div
                  key={`${col}-${row}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    if (id) drop(col, row, id);
                  }}
                  className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/70 p-1.5"
                >
                  {cell.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                      className="group flex w-full cursor-grab items-center gap-1 rounded bg-primary/15 px-1.5 py-1 text-[11px] text-primary"
                    >
                      {iconFor(item.kind)}
                      <span className="truncate">{item.label}</span>
                      <button
                        type="button"
                        aria-label={`Remover ${item.label}`}
                        className="ml-auto opacity-60 hover:opacity-100"
                        onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Plateia
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Arraste os elementos entre as células para posicionar o palco. Clique no ícone de lixeira
        para remover.
      </p>
    </div>
  );
}

/**
 * Versão estática do mapa para embutir no PDF: sem arrastar, sem lixeira e
 * com cores claras, já que o PDF é impresso em papel branco. Mantém a mesma
 * grade e os mesmos ícones da tela, então trocar os ícones melhora os dois.
 */
export const PRINT_PLOT_WIDTH = 640;
export const PRINT_PLOT_HEIGHT = 400;

export function StagePlotPrintable({ items }: { items: StageItem[] }) {
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
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#71717a",
          margin: 0,
        }}
      >
        Fundo do palco
      </p>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: 8,
        }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, index) => {
          const col = index % COLS;
          const row = Math.floor(index / COLS);
          const cell = items.filter((i) => i.col === col && i.row === row);
          return (
            <div
              key={`${col}-${row}`}
              style={{
                border: "1px dashed #d4d4d8",
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: 4,
              }}
            >
              {cell.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "#ede9fe",
                    color: "#5b21b6",
                    borderRadius: 4,
                    padding: "3px 6px",
                    fontSize: 11,
                    fontWeight: 600,
                    maxWidth: "100%",
                  }}
                >
                  {iconFor(item.kind)}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <p
        style={{
          textAlign: "center",
          fontSize: 11,
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
