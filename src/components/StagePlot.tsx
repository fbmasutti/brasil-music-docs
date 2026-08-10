import {
  Music2,
  Trash2,
  Plus,
  Speaker,
  Search,
  Sparkles,
  ArrowDown,
  ArrowUp,
  RotateCw,
  FlipHorizontal,
} from "lucide-react";
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

export type StageItem = {
  id: string;
  kind: StageKind;
  label: string;
  col: number;
  row: number;
  /** Múltiplo de 45°, somado ao padrão do tipo. A pegada não gira junto: a arte
   * transborda e a colisão continua olhando o retângulo original, porque girar um
   * retorno não deveria bloquear célula nova. */
  rotateDeg?: number;
  /** Espelha em relação ao padrão do tipo (XOR), para o monitor direito — que já nasce
   * espelhado — responder ao botão como todo mundo. */
  flipX?: boolean;
};

export type StageKind =
  | "voz"
  | "pedestal"
  | "guitarra"
  | "violao"
  | "violao_aco"
  | "cavaco"
  | "banjo"
  | "baixo"
  | "contrabaixo"
  | "violino"
  | "violoncelo"
  | "bateria"
  | "cajon"
  | "conga"
  | "djembe"
  | "pandeiro"
  | "tantan"
  | "triangulo"
  | "teclado"
  | "piano"
  | "orgao"
  | "sanfona"
  | "sintetizador"
  | "monitor"
  | "monitor_esquerdo"
  | "monitor_direito"
  | "monitor_near_field"
  | "subwoofer"
  | "cubo_guitarra"
  | "cubo_baixo"
  | "cabeca_amplificador"
  | "pedalboard"
  | "sax"
  | "trombone"
  | "trompete"
  | "di_box"
  | "ponto_energia"
  | "praticavel"
  | "toca_discos"
  | "mpc"
  | "mesa_som"
  | "outro";

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
  footprint: { w: number; h: number };
  rotateDeg?: number;
  /** Tamanho relativo dentro da célula. Não é ajuste de enquadramento: codifica o porte
   * real da peça em escala comprimida, para uma DI não ocupar o mesmo espaço visual que
   * um cajón. Piso em ~0.5 — abaixo disso o ícone some dentro da moldura. */
  scaleRatio?: number;
  /** Espelha no eixo X. Deixa o par esquerdo/direito de retornos compartilhar um único
   * arquivo, com simetria garantida. */
  flipX?: boolean;
  /** Arte chapada de corpo quase preto, que precisa do filtro de inversão para aparecer
   * no tema escuro. Todo o set atual é ilustrado multitom, então o padrão é `false`. */
  flat?: boolean;
  /** Contorno claro no tema escuro. Só para a arte que sumiria no fundo: medi a luminância
   * média dos pixels pintados de cada ícone e marquei os abaixo de 90. Num ícone de tom
   * médio (o pedestal dá 160) o contorno vira uma aura em volta do desenho. */
  darkOutline?: boolean;
}[] = [
  // Voz & Cordas
  {
    kind: "voz",
    label: "Voz / microfone",
    category: "voz_cordas",
    iconSrc: "/stage-icons/microfone.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.75,
  },
  {
    kind: "pedestal",
    label: "Pedestal com microfone",
    category: "voz_cordas",
    iconSrc: "/stage-icons/pedestal.svg",
    footprint: { w: 2, h: 4 },
    scaleRatio: 1,
  },
  {
    kind: "guitarra",
    label: "Guitarra",
    category: "voz_cordas",
    iconSrc: "/stage-icons/guitarra.svg",
    footprint: { w: 3, h: 2 },
    scaleRatio: 1.05,
  },
  {
    kind: "violao",
    label: "Violão (nylon)",
    category: "voz_cordas",
    iconSrc: "/stage-icons/violao.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 1.05,
  },
  {
    kind: "violao_aco",
    label: "Violão de aço",
    category: "voz_cordas",
    iconSrc: "/stage-icons/violao-aco.svg",
    footprint: { w: 3, h: 2 },
    scaleRatio: 1.05,
  },
  {
    kind: "cavaco",
    label: "Cavaquinho / Ukulele",
    category: "voz_cordas",
    iconSrc: "/stage-icons/cavaco.svg",
    footprint: { w: 2, h: 3 },
    scaleRatio: 0.9,
  },
  {
    kind: "banjo",
    label: "Banjo",
    category: "voz_cordas",
    iconSrc: "/stage-icons/banjo.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.95,
  },
  {
    kind: "baixo",
    label: "Baixo",
    category: "voz_cordas",
    iconSrc: "/stage-icons/baixo.svg",
    footprint: { w: 3, h: 2 },
    scaleRatio: 1.05,
  },
  {
    kind: "contrabaixo",
    label: "Contrabaixo acústico",
    category: "voz_cordas",
    iconSrc: "/stage-icons/contrabaixo.svg",
    footprint: { w: 2, h: 5 },
    scaleRatio: 1.05,
    darkOutline: true,
  },
  {
    kind: "violino",
    label: "Violino",
    category: "voz_cordas",
    iconSrc: "/stage-icons/violino.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.9,
  },
  {
    kind: "violoncelo",
    label: "Violoncelo",
    category: "voz_cordas",
    iconSrc: "/stage-icons/violoncelo.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 1.05,
  },
  {
    kind: "pedalboard",
    label: "Pedalboard",
    category: "voz_cordas",
    iconSrc: "/stage-icons/pedalboard.svg",
    footprint: { w: 4, h: 2 },
    scaleRatio: 0.8,
    darkOutline: true,
  },

  // Bateria & Percussão
  {
    kind: "bateria",
    label: "Bateria",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/bateria.svg",
    footprint: { w: 5, h: 4 },
    scaleRatio: 1.15,
    darkOutline: true,
  },
  {
    kind: "cajon",
    label: "Cajón",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/cajon.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 0.9,
  },
  {
    kind: "conga",
    label: "Conga",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/conga.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 1,
    darkOutline: true,
  },
  {
    kind: "djembe",
    label: "Djembe",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/djembe.svg",
    footprint: { w: 2, h: 3 },
    scaleRatio: 0.9,
  },
  {
    kind: "pandeiro",
    label: "Pandeiro",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/pandeiro.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.75,
  },
  {
    kind: "tantan",
    label: "Tantã / Zabumba",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/tantan.svg",
    footprint: { w: 2, h: 3 },
    scaleRatio: 0.85,
  },
  {
    kind: "triangulo",
    label: "Triângulo",
    category: "bateria_percussao",
    iconSrc: "/stage-icons/triangulo.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.55,
  },

  // Teclas & Eletrônicos
  {
    kind: "teclado",
    label: "Teclado",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/teclado.svg",
    footprint: { w: 5, h: 2 },
    scaleRatio: 1.15,
  },
  {
    kind: "piano",
    label: "Piano de cauda",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/piano.svg",
    footprint: { w: 5, h: 5 },
    scaleRatio: 1.1,
    darkOutline: true,
  },
  {
    kind: "orgao",
    label: "Órgão / Hammond",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/orgao.svg",
    footprint: { w: 6, h: 2 },
    scaleRatio: 1.1,
  },
  {
    kind: "sanfona",
    label: "Sanfona / Acordeon",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/sanfona.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 0.95,
    darkOutline: true,
  },
  {
    kind: "sintetizador",
    label: "Sintetizador / MIDI",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/sintetizador.svg",
    footprint: { w: 4, h: 2 },
    scaleRatio: 1,
    darkOutline: true,
  },
  {
    kind: "toca_discos",
    label: "Toca-discos",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/toca-discos.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 0.95,
  },
  {
    kind: "mpc",
    label: "MPC / Sampler",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/mpc.svg",
    footprint: { w: 3, h: 2 },
    scaleRatio: 0.8,
    darkOutline: true,
  },

  // Amplificadores & Retornos
  {
    kind: "monitor",
    label: "Monitor / Retorno",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor.svg",
    footprint: { w: 4, h: 2 },
    scaleRatio: 0.9,
    darkOutline: true,
  },
  {
    kind: "monitor_esquerdo",
    label: "Monitor esquerdo",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor.svg",
    footprint: { w: 4, h: 2 },
    scaleRatio: 0.9,
    darkOutline: true,
  },
  {
    kind: "monitor_direito",
    label: "Monitor direito",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor.svg",
    footprint: { w: 4, h: 2 },
    scaleRatio: 0.9,
    darkOutline: true,
    flipX: true,
  },
  {
    kind: "monitor_near_field",
    label: "Monitor near field",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor-near-field.svg",
    footprint: { w: 2, h: 3 },
    scaleRatio: 0.85,
    darkOutline: true,
  },
  {
    kind: "subwoofer",
    label: "P.A. / Subwoofer",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/subwoofer.svg",
    footprint: { w: 2, h: 5 },
    scaleRatio: 1,
    darkOutline: true,
  },
  {
    kind: "cubo_guitarra",
    label: "Cubo de guitarra",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cubo-guitarra.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 0.9,
  },
  {
    kind: "cubo_baixo",
    label: "Cubo de baixo",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cubo-baixo.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 0.95,
    darkOutline: true,
  },
  {
    kind: "cabeca_amplificador",
    label: "Amplificador (cabeçote + caixa)",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cabeca-amplificador.svg",
    footprint: { w: 3, h: 4 },
    scaleRatio: 1,
    darkOutline: true,
  },
  {
    kind: "di_box",
    label: "DI box",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/di-box.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.5,
    darkOutline: true,
  },
  {
    kind: "mesa_som",
    label: "Console / Mesa de Som",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/mesa-som.svg",
    footprint: { w: 4, h: 3 },
    scaleRatio: 1.05,
    darkOutline: true,
  },

  // Sopros & Infra
  {
    kind: "sax",
    label: "Sax",
    category: "sopros_infra",
    iconSrc: "/stage-icons/sax.svg",
    footprint: { w: 2, h: 3 },
    scaleRatio: 0.95,
  },
  {
    kind: "trombone",
    label: "Trombone",
    category: "sopros_infra",
    iconSrc: "/stage-icons/trombone.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 1.05,
  },
  {
    kind: "trompete",
    label: "Trompete",
    category: "sopros_infra",
    iconSrc: "/stage-icons/trompete.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.85,
  },
  {
    kind: "ponto_energia",
    label: "Ponto de energia / Régua AC",
    category: "sopros_infra",
    iconSrc: "/stage-icons/ponto-energia.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.6,
  },
  {
    kind: "praticavel",
    label: "Praticável",
    category: "sopros_infra",
    iconSrc: "/stage-icons/praticavel.svg",
    footprint: { w: 6, h: 3 },
    scaleRatio: 1.15,
    darkOutline: true,
  },
  {
    kind: "outro",
    label: "Outro",
    category: "sopros_infra",
    icon: <Music2 className="size-8 text-primary" />,
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.7,
  },
];

/** Pegada da peça na grade, em células. A razão largura/altura segue a proporção do
 * desenho, para a arte preencher a caixa em vez de sobrar nas laterais. */
export function spanOf(kind: StageKind) {
  return STAGE_KINDS.find((k) => k.kind === kind)?.footprint ?? { w: 2, h: 2 };
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

function StageIcon({
  kind,
  className,
  rotateDeg,
  flipX,
}: {
  kind: StageKind;
  className?: string;
  // `exactOptionalPropertyTypes` está ligado: os campos vêm de StageItem podendo ser
  // undefined, então o tipo precisa aceitar isso explicitamente.
  rotateDeg?: number | undefined;
  flipX?: boolean | undefined;
}) {
  const def = STAGE_KINDS.find((k) => k.kind === kind);
  const scale = def?.scaleRatio ?? 1;
  // A peça no mapa manda por cima do padrão do tipo: a rotação soma e o espelho é XOR,
  // para o monitor direito (que já nasce espelhado) responder ao botão como todo mundo.
  const rot = (def?.rotateDeg ?? 0) + (rotateDeg ?? 0);
  const espelhado = Boolean(def?.flipX) !== Boolean(flipX);
  const transform = `rotate(${rot}deg) scale(${scale})${espelhado ? " scaleX(-1)" : ""}`;

  if (def?.iconSrc) {
    return (
      <div
        className={cn("flex size-full items-center justify-center p-0 overflow-visible", className)}
      >
        <img
          src={def.iconSrc}
          alt={def.label}
          style={{ transform }}
          className={cn(
            "h-full w-full object-contain filter drop-shadow-sm transition-transform duration-200",
            // Inverter só serve para arte chapada de corpo quase preto. Na arte ilustrada,
            // inverter trocaria madeira por azul e latão por roxo.
            def.flat && "dark:invert dark:brightness-200",
            // O contorno claro é para a arte que sumiria no fundo escuro, e só para ela:
            // num ícone de tom médio ele vira uma aura feia em volta do desenho.
            def.darkOutline && "dark:drop-shadow-[0_0_1.5px_rgba(255,255,255,0.6)]",
          )}
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

export const COLS = 18;
export const ROWS = 12;


export function parseStagePlot(raw: unknown): StageItem[] {
  if (!Array.isArray(raw)) return [];
  const items = raw.filter(
    (i): i is StageItem =>
      Boolean(i) && typeof i === "object" && "kind" in (i as object) && "col" in (i as object),
  );
  return items;
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

  function rotate(id: string) {
    onChange(
      items.map((i) => (i.id === id ? { ...i, rotateDeg: ((i.rotateDeg ?? 0) + 45) % 360 } : i)),
    );
  }

  function mirror(id: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, flipX: !i.flipX } : i)));
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
                  {k.footprint.w}×{k.footprint.h}
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
            className="relative min-w-[900px]"
          >
            {/* Linhas da Grade do Palco sem Fundo Roxo */}
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, 48px)`,
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
              className="pointer-events-none absolute inset-0 grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, 48px)`,
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
                      "group pointer-events-auto relative cursor-grab active:cursor-grabbing rounded-lg border-2 backdrop-blur-2xs shadow-xs hover:shadow-md transition-all hover:scale-[1.02]",
                      colorStyle,
                    )}
                  >
                    <div className="absolute -right-2 -top-2 z-30 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        aria-label={`Girar ${item.label} 45 graus`}
                        className="rounded-full bg-background text-foreground border border-border p-1 shadow-md"
                        onClick={() => rotate(item.id)}
                      >
                        <RotateCw className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Espelhar ${item.label}`}
                        className="rounded-full bg-background text-foreground border border-border p-1 shadow-md"
                        onClick={() => mirror(item.id)}
                      >
                        <FlipHorizontal className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remover ${item.label}`}
                        className="rounded-full bg-destructive text-destructive-foreground p-1 shadow-md"
                        onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {/* A pegada inteira é arte: o rótulo sai dela e flutua por baixo, para o
                        desenho não perder altura para uma faixa de texto. */}
                    <StageIcon kind={item.kind} rotateDeg={item.rotateDeg} flipX={item.flipX} />

                    {/* Rótulo sobreposto no rodapé da própria pegada: não rouba altura da
                        arte (que segue ocupando a caixa inteira) e não vaza para a célula
                        vizinha. Quebra em duas linhas quando o nome é longo. */}
                    <span className="pointer-events-none absolute bottom-0.5 left-1/2 z-20 max-w-[calc(100%-4px)] -translate-x-1/2 rounded-xs border border-border/60 bg-background/95 px-1 py-0.5 text-center text-[9px] font-bold leading-[1.15] text-foreground shadow-2xs">
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
  // 12 linhas + 11 vãos de 3px precisam caber na área entre o cabeçalho e o rodapé
  // da folha (≈802px no retrato, ≈597px no paisagem). O rótulo mora dentro da pegada,
  // então não é preciso reservar calha embaixo.
  const cellHeight = isLandscape ? 46 : 63;

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
            gap: 3,
            height: "100%",
          }}
        >
          {/* Fundo liso: no PDF o quadriculado só desenhava a sobra de cada caixa. */}
          {Array.from({ length: ROWS * COLS }).map((_, index) => (
            <div key={index} style={{ borderRadius: 6, background: "#fafafa" }} />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, ${cellHeight}px)`,
            gap: 3,
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
                  position: "relative",
                  overflow: "visible",
                  color: "#18181b",
                }}
              >
                {/* Sem moldura e sem faixa de rótulo: a pegada inteira é desenho, e o
                    nome flutua logo abaixo, como nos mapas de palco de referência. */}
                <StageIcon
                  kind={item.kind}
                  rotateDeg={item.rotateDeg}
                  flipX={item.flipX}
                />
                <span
                  style={{
                    // Sobreposto no rodapé da própria pegada: a arte segue ocupando a caixa
                    // inteira e o nome não invade a célula vizinha nem o rodapé do palco.
                    position: "absolute",
                    left: "50%",
                    bottom: 2,
                    transform: "translateX(-50%)",
                    maxWidth: "calc(100% - 4px)",
                    zIndex: 20,
                    fontSize: 9,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    textAlign: "center",
                    color: "#18181b",
                    background: "#ffffff",
                    padding: "1px 4px",
                    borderRadius: 4,
                    border: "1px solid #d4d4d8",
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
            aria-label={`Girar ${item.label} 45 graus`}
            title="Girar 45°"
            onClick={() =>
              onChange(
                items.map((i) =>
                  i.id === item.id ? { ...i, rotateDeg: ((i.rotateDeg ?? 0) + 45) % 360 } : i,
                ),
              )
            }
          >
            <RotateCw className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Espelhar ${item.label}`}
            title="Espelhar na horizontal"
            onClick={() =>
              onChange(items.map((i) => (i.id === item.id ? { ...i, flipX: !i.flipX } : i)))
            }
          >
            <FlipHorizontal className="size-4" />
          </Button>
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
