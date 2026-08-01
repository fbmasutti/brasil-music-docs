import { Mic, Guitar, Drum, Piano, Speaker, Music2, Trash2, Plus } from "lucide-react";
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

export type StageKind = "voz" | "guitarra" | "baixo" | "bateria" | "teclado" | "monitor" | "outro";

export const STAGE_KINDS: { kind: StageKind; label: string; icon: ReactNode }[] = [
  { kind: "voz", label: "Voz", icon: <Mic className="size-4" /> },
  { kind: "guitarra", label: "Guitarra / Violão", icon: <Guitar className="size-4" /> },
  { kind: "baixo", label: "Baixo", icon: <Guitar className="size-4" /> },
  { kind: "bateria", label: "Bateria / Percussão", icon: <Drum className="size-4" /> },
  { kind: "teclado", label: "Teclado", icon: <Piano className="size-4" /> },
  { kind: "monitor", label: "Monitor / Retorno", icon: <Speaker className="size-4" /> },
  { kind: "outro", label: "Outro", icon: <Music2 className="size-4" /> },
];

const iconFor = (kind: StageKind) =>
  STAGE_KINDS.find((k) => k.kind === kind)?.icon ?? <Music2 className="size-4" />;

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
          <Button key={k.kind} type="button" variant="outline" size="sm" onClick={() => add(k.kind)}>
            {k.icon}
            <span className="ml-1 text-xs">{k.label}</span>
          </Button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Fundo do palco
        </p>
        <div className="grid grid-cols-4 gap-2">
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
        <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
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
