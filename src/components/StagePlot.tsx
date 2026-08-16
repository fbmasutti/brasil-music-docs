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
  Lock,
  Unlock,
  Undo2,
  Redo2,
  Copy,
  Eraser,
  Minus,
  Type,
  Pencil,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  /** Pegada própria em células, sobrescrevendo o padrão do tipo. Só existe quando o
   * usuário redimensionou a peça à mão — sem isso, a peça acompanha o padrão do tipo e
   * herda qualquer reajuste futuro de proporção. */
  w?: number;
  h?: number;
  /** Trava a peça: ignora arrastar, girar, espelhar, redimensionar e excluir. Serve para
   * fixar bateria e praticável antes de encaixar o resto em volta. */
  locked?: boolean;
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
  | "texto"
  | "outro";

export type StageCategoryKey =
  | "voz_cordas"
  | "bateria_percussao"
  | "teclas_eletronicos"
  | "amplificacao_monitores"
  | "sopros"
  | "infra";

// Cada cor segue uma associação direta com a categoria, em vez de ordem arbitrária:
// azul para voz/cordas (neutro, "limpo"), âmbar para bateria/percussão (madeira, calor),
// verde para teclas/eletrônicos (telas, digital), rosa para amplificação/retornos (potência),
// dourado para sopros (latão dos instrumentos de metal) e cinza para infra — a única
// categoria que não é instrumento musical, por isso fica fora da paleta "quente/instrumento".
export const STAGE_CATEGORIES: { key: StageCategoryKey; label: string; color: string }[] = [
  { key: "voz_cordas", label: "Voz & Cordas", color: "sky" },
  { key: "bateria_percussao", label: "Bateria & Percussão", color: "amber" },
  { key: "teclas_eletronicos", label: "Teclas & Eletrônicos", color: "emerald" },
  { key: "amplificacao_monitores", label: "Amplificadores & Retornos", color: "rose" },
  { key: "sopros", label: "Sopros", color: "yellow" },
  { key: "infra", label: "Infraestrutura", color: "slate" },
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
   * um cajón. Piso em ~0.5 — abaixo disso o ícone some dentro da moldura. Teto em 1: a
   * arte já preenche 100% da pegada via object-contain, então qualquer valor acima disso
   * estoura pra fora da célula — quanto maior a pegada, mais visível o estouro. */
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
    // A arte é 1:3,27 e não foi cortada: a pegada é que acompanha. Em 2x5 ela preenche
    // 77% da largura da caixa; em 2x4 cairia para 62%.
    footprint: { w: 2, h: 5 },
    scaleRatio: 1,
    // Haste quase preta: luminância média 35, a mais escura do set depois dos retornos.
    darkOutline: true,
  },
  {
    kind: "guitarra",
    label: "Guitarra",
    category: "voz_cordas",
    iconSrc: "/stage-icons/guitarra.svg",
    footprint: { w: 3, h: 2 },
    scaleRatio: 1,
  },
  {
    kind: "violao",
    label: "Violão (nylon)",
    category: "voz_cordas",
    iconSrc: "/stage-icons/violao.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 1,
  },
  {
    kind: "violao_aco",
    label: "Violão de aço",
    category: "voz_cordas",
    iconSrc: "/stage-icons/violao-aco.svg",
    footprint: { w: 3, h: 2 },
    scaleRatio: 1,
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
    scaleRatio: 1,
  },
  {
    kind: "contrabaixo",
    label: "Contrabaixo acústico",
    category: "voz_cordas",
    iconSrc: "/stage-icons/contrabaixo.svg",
    footprint: { w: 2, h: 5 },
    scaleRatio: 1,
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
    scaleRatio: 1,
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
    scaleRatio: 1,
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
    scaleRatio: 1,
  },
  {
    kind: "piano",
    label: "Piano de cauda",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/piano.svg",
    footprint: { w: 5, h: 5 },
    scaleRatio: 1,
    darkOutline: true,
  },
  {
    kind: "orgao",
    label: "Órgão / Hammond",
    category: "teclas_eletronicos",
    iconSrc: "/stage-icons/orgao.svg",
    footprint: { w: 6, h: 2 },
    scaleRatio: 1,
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
    footprint: { w: 3, h: 2 },
    scaleRatio: 0.9,
    darkOutline: true,
  },
  {
    kind: "monitor_esquerdo",
    label: "Monitor esquerdo",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor.svg",
    footprint: { w: 3, h: 2 },
    scaleRatio: 0.9,
    darkOutline: true,
  },
  {
    kind: "monitor_direito",
    label: "Monitor direito",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/monitor.svg",
    footprint: { w: 3, h: 2 },
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
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.95,
  },
  {
    kind: "cubo_baixo",
    label: "Cubo de baixo",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cubo-baixo.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 1,
    darkOutline: true,
  },
  {
    kind: "cabeca_amplificador",
    label: "Amplificador (cabeçote + caixa)",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/cabeca-amplificador.svg",
    footprint: { w: 2, h: 3 },
    scaleRatio: 1,
    darkOutline: true,
  },
  {
    kind: "di_box",
    label: "DI box",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/di-box.svg",
    footprint: { w: 1, h: 1 },
    scaleRatio: 0.9,
    darkOutline: true,
  },
  {
    kind: "mesa_som",
    label: "Console / Mesa de Som",
    category: "amplificacao_monitores",
    iconSrc: "/stage-icons/mesa-som.svg",
    footprint: { w: 4, h: 3 },
    scaleRatio: 1,
    darkOutline: true,
  },

  // Sopros
  {
    kind: "sax",
    label: "Sax",
    category: "sopros",
    iconSrc: "/stage-icons/sax.svg",
    footprint: { w: 2, h: 3 },
    scaleRatio: 0.95,
  },
  {
    kind: "trombone",
    label: "Trombone",
    category: "sopros",
    iconSrc: "/stage-icons/trombone.svg",
    footprint: { w: 3, h: 3 },
    scaleRatio: 1,
  },
  {
    kind: "trompete",
    label: "Trompete",
    category: "sopros",
    iconSrc: "/stage-icons/trompete.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.85,
  },

  // Infraestrutura
  {
    kind: "ponto_energia",
    label: "Ponto de energia / Régua AC",
    category: "infra",
    iconSrc: "/stage-icons/ponto-energia.svg",
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.5,
  },
  {
    kind: "praticavel",
    label: "Praticável",
    category: "infra",
    iconSrc: "/stage-icons/praticavel.svg",
    footprint: { w: 6, h: 3 },
    scaleRatio: 1,
    darkOutline: true,
  },
  {
    kind: "texto",
    label: "Texto livre",
    category: "infra",
    // Sem arte: a peça É o texto. O recado que não cabe em nenhum ícone — "DI da casa",
    // "praticável 2m", "entrada pela coxia" — passava a virar um ícone genérico com nome
    // comprido; aqui ele fica legível na própria caixa.
    icon: <Type className="size-8 text-primary" />,
    footprint: { w: 4, h: 2 },
  },
  {
    kind: "outro",
    label: "Outro",
    category: "infra",
    icon: <Music2 className="size-8 text-primary" />,
    footprint: { w: 2, h: 2 },
    scaleRatio: 0.7,
  },
];

/** A peça de texto se desenha sozinha (o rótulo ocupa a caixa toda), então ela pula o
 * ícone e a faixinha de nome nas duas vistas: a interativa e a do PDF. */
export function isTextItem(item: StageItem) {
  return item.kind === "texto";
}

/** Pegada da peça na grade, em células. A razão largura/altura segue a proporção do
 * desenho, para a arte preencher a caixa em vez de sobrar nas laterais. */
export function spanOf(kind: StageKind) {
  return STAGE_KINDS.find((k) => k.kind === kind)?.footprint ?? { w: 2, h: 2 };
}

function categoryColorStyles(category: StageCategoryKey) {
  switch (category) {
    case "voz_cordas":
      return "border-sky-500/20 text-sky-600 dark:text-sky-400 bg-sky-500/5";
    case "bateria_percussao":
      return "border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5";
    case "teclas_eletronicos":
      return "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5";
    case "amplificacao_monitores":
      return "border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5";
    case "sopros":
      return "border-yellow-500/20 text-yellow-600 dark:text-yellow-400 bg-yellow-500/5";
    case "infra":
      return "border-slate-500/20 text-slate-600 dark:text-slate-400 bg-slate-500/5";
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

// 22×12 com célula quase quadrada dá uma proporção de ~1,83:1, que é a de um palco real
// (12 m de boca por 6,5 m de profundidade). Os 18 colunas anteriores davam 1,5:1 e não
// comportavam banda de 8 integrantes com retorno individual — ver o teste da Lucky 7.
// Alargar é retrocompatível: as colunas novas entram à direita, então todo col/row já
// salvo continua válido.
export const COLS = 22;
export const ROWS = 12;

/** Quanto o ponteiro precisa andar para o gesto virar arrasto em vez de toque. Precisa
 * absorver o tremor natural do dedo: abaixo disso, tocar numa peça para selecioná-la
 * acabaria arrastando ela alguns pixels sem querer. */
const DRAG_THRESHOLD_PX = 6;

/** Limites da aproximação. O mínimo é 1 porque "ajustar à tela" já mostra o palco inteiro:
 * afastar mais só encolheria o desenho no meio de um quadro vazio. */
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
/** Lado de célula, em px, abaixo do qual posicionar com o dedo vira sorteio. Um palco de 22
 * colunas num celular de 375px dá célula de ~13px: é o caso que a aproximação automática
 * resolve ao abrir. */
const MIN_COMFORTABLE_CELL_PX = 26;

export function parseStagePlot(raw: unknown): StageItem[] {
  if (!Array.isArray(raw)) return [];
  const items = raw.filter(
    (i): i is StageItem =>
      Boolean(i) && typeof i === "object" && "kind" in (i as object) && "col" in (i as object),
  );
  return items;
}

/** Pegada efetiva da peça: o que o usuário definiu à mão, ou o padrão do tipo. */
export function itemSpan(item: StageItem) {
  const base = spanOf(item.kind);
  return { w: item.w ?? base.w, h: item.h ?? base.h };
}

function overlaps(a: StageItem, col: number, row: number, span: { w: number; h: number }) {
  const sa = itemSpan(a);
  return col < a.col + sa.w && col + span.w > a.col && row < a.row + sa.h && row + span.h > a.row;
}

function fits(
  items: StageItem[],
  span: { w: number; h: number },
  col: number,
  row: number,
  ignoreId?: string,
) {
  if (col < 0 || row < 0 || col + span.w > COLS || row + span.h > ROWS) return false;
  return !items.some((i) => i.id !== ignoreId && overlaps(i, col, row, span));
}

function findSpotForSpan(items: StageItem[], span: { w: number; h: number }) {
  const center = Math.floor(COLS / 2);
  const order = [center, ...Array.from({ length: COLS }, (_, i) => i).filter((c) => c !== center)];
  for (let row = ROWS - 1; row >= 0; row--) {
    for (const col of order) {
      if (fits(items, span, col, row)) return { col, row };
    }
  }
  return null;
}

function findSpot(items: StageItem[], kind: StageKind) {
  return findSpotForSpan(items, spanOf(kind));
}

/** Teto do histórico. Um mapa de 30 peças pesa ~4KB em memória; 50 passos é fundo de
 * gaveta suficiente para desfazer um arrasto errado sem o navegador segurar um MB à toa. */
const HISTORY_LIMIT = 50;

export type StageHistory = {
  items: StageItem[];
  /** Mutação normal: entra no histórico e descarta o "refazer" pendente. */
  set: (items: StageItem[]) => void;
  /** Atualiza sem empilhar. Serve para os quadros intermediários de um gesto contínuo
   * (arrastar a alça de redimensionar): o gesto inteiro vira uma entrada só, senão um
   * arrasto de 10 células gastaria 10 desfazeres para voltar. */
  replace: (items: StageItem[]) => void;
  /** Carrega outro mapa (abrir/duplicar rider, novo em branco) — zera o histórico em vez
   * de deixar o usuário desfazer para dentro do rider anterior. */
  reset: (items: StageItem[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

/** Histórico do mapa de palco. Fica no dono do estado (a página do rider), não dentro do
 * canvas, porque a lista de rótulos abaixo da grade edita as mesmas peças — as duas
 * precisam empilhar no mesmo histórico. */
export function useStageHistory(initial: StageItem[] = []): StageHistory {
  const [state, setState] = useState<{
    past: StageItem[][];
    present: StageItem[];
    future: StageItem[][];
  }>({ past: [], present: initial, future: [] });

  const set = useCallback((next: StageItem[]) => {
    setState((s) =>
      next === s.present
        ? s
        : { past: [...s.past, s.present].slice(-HISTORY_LIMIT), present: next, future: [] },
    );
  }, []);

  const replace = useCallback((next: StageItem[]) => {
    setState((s) => (next === s.present ? s : { ...s, present: next }));
  }, []);

  const reset = useCallback((next: StageItem[]) => {
    setState({ past: [], present: next, future: [] });
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      return { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      const next = s.future[0];
      if (!next) return s;
      return { past: [...s.past, s.present], present: next, future: s.future.slice(1) };
    });
  }, []);

  return {
    items: state.present,
    set,
    replace,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

export function StagePlot({
  items,
  onChange,
  history,
}: {
  items: StageItem[];
  onChange: (items: StageItem[]) => void;
  /** Sem histórico o canvas segue funcionando; só some a barra de desfazer/refazer. */
  history?: Pick<StageHistory, "undo" | "redo" | "canUndo" | "canRedo" | "replace"> | undefined;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<StageCategoryKey>("voz_cordas");
  const [searchQuery, setSearchQuery] = useState("");
  /** Peça selecionada. Existe por causa do toque: no celular não há hover, então sem uma
   * seleção explícita os botões de travar/girar/espelhar/duplicar/remover e a alça de
   * redimensionar nunca apareceriam. Um toque curto na peça seleciona. */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Caixa de texto sendo editada na própria grade. Duplo clique entra, Enter ou sair do
   * campo grava, Esc desiste. */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** Peça em arrasto e o quanto ela já andou em px, para acompanhar o dedo/cursor em tempo
   * real enquanto a prévia mostra, encaixada na grade, onde ela vai parar. */
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [dropHint, setDropHint] = useState<{
    col: number;
    row: number;
    w: number;
    h: number;
    ok: boolean;
  } | null>(null);
  /** Aproximação da grade. 1 = palco inteiro na largura disponível ("ajustar à tela"); daí
   * para cima a grade cresce além do quadro e o quadro rola. Não existe menos que 1 porque
   * abaixo disso sobraria espaço vazio em volta de um palco que já cabia inteiro. */
  const [zoom, setZoom] = useState(1);
  /** Espelho síncrono do zoom. Uma pinça dispara vários ajustes dentro do mesmo tique, e o
   * estado do React só chega no render seguinte — usar o estado ali faria cada ajuste
   * calcular a razão a partir de um valor velho e a rolagem se acumular fora de lugar. */
  const zoomRef = useRef(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  /** Ponteiros encostados no quadro. Serve para distinguir arrasto de peça (um dedo) de
   * pinça (dois) e para abortar o arrasto quando o segundo dedo chega. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  /** Zero da pinça: distância e zoom quando ela começou, mais o último meio entre os dois
   * dedos — é a diferença desse meio que desloca o mapa enquanto se aproxima. */
  const pinch = useRef<{ dist: number; zoom: number; cx: number; cy: number } | null>(null);
  /** Cancela o arrasto de peça em curso, se houver. Preenchido por startMove. */
  const cancelDrag = useRef<(() => void) | null>(null);
  const autoFitDone = useRef(false);

  // Cmd/Ctrl+Z e Cmd/Ctrl+Shift+Z (ou Ctrl+Y). Ignora quando o foco está num campo de
  // texto: lá o desfazer nativo do navegador é o comportamento que o usuário espera.
  useEffect(() => {
    if (!history) return;
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable)
        return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        history!.undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        history!.redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history]);

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

  /** Grava o texto da caixa. Texto vazio volta ao rótulo padrão em vez de virar uma caixa
   * invisível que o usuário não consegue mais pegar. */
  function commitText(id: string, texto: string) {
    const limpo = texto.trim();
    setEditingId(null);
    onChange(items.map((i) => (i.id === id ? { ...i, label: limpo || "Texto livre" } : i)));
  }

  function rotate(id: string) {
    onChange(
      items.map((i) =>
        i.id === id && !i.locked ? { ...i, rotateDeg: ((i.rotateDeg ?? 0) + 45) % 360 } : i,
      ),
    );
  }

  function mirror(id: string) {
    onChange(items.map((i) => (i.id === id && !i.locked ? { ...i, flipX: !i.flipX } : i)));
  }

  function toggleLock(id: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, locked: !i.locked } : i)));
  }

  /** Cópia da peça com o mesmo porte, rotação e espelho — o caso real é encher o palco de
   * retornos iguais sem reconfigurar cada um. Tenta encostar à direita, depois embaixo,
   * e só então cai em qualquer vaga. A cópia nasce destravada: acabou de ser criada e
   * precisa ser posicionada. */
  function duplicateItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const span = itemSpan(item);
    const spot =
      [
        { col: item.col + span.w, row: item.row },
        { col: item.col, row: item.row + span.h },
      ].find((c) => fits(items, span, c.col, c.row)) ?? findSpotForSpan(items, span);
    if (!spot) {
      setWarning("Não há espaço livre para a cópia. Remova ou reposicione algum elemento.");
      return;
    }
    setWarning(null);
    const { id: _id, locked: _locked, ...rest } = item;
    onChange([...items, { ...rest, id: crypto.randomUUID(), col: spot.col, row: spot.row }]);
  }

  /** Redimensiona em células. Recusa o que sairia da grade ou invadiria outra peça, em vez
   * de deixar o mapa num estado que a impressão não consegue representar.
   *
   * `coalesce` marca um quadro intermediário de arrasto: atualiza a tela sem empilhar no
   * histórico, para o gesto todo caber num único desfazer. */
  function setSize(id: string, w: number, h: number, coalesce = false) {
    const item = items.find((i) => i.id === id);
    if (!item || item.locked) return;
    const current = itemSpan(item);
    const next = {
      w: Math.max(1, Math.min(COLS - item.col, w)),
      h: Math.max(1, Math.min(ROWS - item.row, h)),
    };
    if (next.w === current.w && next.h === current.h) return;
    if (!fits(items, next, item.col, item.row, item.id)) return;
    setWarning(null);
    const updated = items.map((i) => (i.id === id ? { ...i, w: next.w, h: next.h } : i));
    if (coalesce && history?.replace) history.replace(updated);
    else onChange(updated);
  }

  /** Arrasta a alça do canto para redimensionar. Usa pointer events em vez do drag HTML5
   * já usado para mover a peça — os dois no mesmo elemento brigariam. */
  function startResize(e: React.PointerEvent, item: StageItem) {
    e.preventDefault();
    e.stopPropagation();
    const grid = gridRef.current;
    if (!grid || item.locked) return;
    const rect = grid.getBoundingClientRect();
    const cellW = rect.width / COLS;
    const cellH = rect.height / ROWS;
    const start = itemSpan(item);
    const originX = e.clientX;
    const originY = e.clientY;
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      /* segue sem captura — ver startMove */
    }
    // O primeiro passo do arrasto empilha (guardando o tamanho de antes); os seguintes só
    // atualizam a tela. Um arrasto = um desfazer.
    let pushed = false;

    function onMove(ev: PointerEvent) {
      setSize(
        item.id,
        start.w + Math.round((ev.clientX - originX) / cellW),
        start.h + Math.round((ev.clientY - originY) / cellH),
        pushed,
      );
      pushed = true;
    }
    function onUp() {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
    }
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  }

  /** Volta a peça ao porte padrão do tipo, descartando o ajuste manual. */
  function resetSize(id: string) {
    onChange(
      items.map((i) => {
        if (i.id !== id || i.locked) return i;
        const { w: _w, h: _h, ...rest } = i;
        return rest;
      }),
    );
  }

  /** Aproxima mantendo fixo o ponto de referência (centro do quadro, cursor da roda ou meio
   * da pinça). Sem isso, aproximar joga o palco para um canto e obriga a reencontrar onde
   * se estava — o efeito de "perdi minha bateria de vista".
   *
   * A grade é medida por getBoundingClientRect, então toda a matemática de arrasto e
   * redimensionamento continua valendo em qualquer aproximação, sem conversão nenhuma. */
  function zoomTo(next: number, focalX?: number, focalY?: number) {
    const vp = viewportRef.current;
    const grid = gridRef.current;
    const anterior = zoomRef.current;
    const alvo = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
    zoomRef.current = alvo;
    setZoom(alvo);
    if (!vp || !grid || alvo === anterior) return;

    const rect = vp.getBoundingClientRect();
    const fx = (focalX ?? rect.left + rect.width / 2) - rect.left;
    const fy = (focalY ?? rect.top + rect.height / 2) - rect.top;
    const conteudoX = vp.scrollLeft + fx;
    const conteudoY = vp.scrollTop + fy;
    const razao = alvo / anterior;

    // A largura é aplicada na mão antes de mexer na rolagem, e só depois o React repinta o
    // mesmo valor. É o que garante que a grade já esteja maior na hora do ajuste: o
    // scrollLeft de um quadro que ainda não transbordou é ceifado para 0, e a vista
    // pularia para o canto — exatamente o "perdi minha bateria de vista" que o ponto de
    // referência existe para evitar.
    grid.style.width = `${alvo * 100}%`;
    vp.scrollLeft = conteudoX * razao - fx;
    vp.scrollTop = conteudoY * razao - fy;
  }

  /** Ao abrir num quadro estreito, já entra aproximado o bastante para a célula dar conta de
   * um dedo. Roda uma vez só: depois disso a aproximação é do usuário, e refazer a conta a
   * cada redimensionamento desfaria a escolha dele. */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    function tentar() {
      if (autoFitDone.current) return true;
      const largura = vp!.clientWidth;
      // Largura 0 acontece quando o quadro ainda não tem layout — aba oculta, modal em
      // transição de entrada. Não é "não precisa aproximar", é "ainda não dá para medir":
      // por isso o observer segue ligado até a primeira medida válida, em vez de o efeito
      // rodar uma vez e desistir para sempre.
      if (!largura) return false;
      autoFitDone.current = true;
      const celula = largura / COLS;
      if (celula >= MIN_COMFORTABLE_CELL_PX) return true;
      const inicial = Math.min(ZOOM_MAX, (MIN_COMFORTABLE_CELL_PX * COLS) / largura);
      zoomRef.current = inicial;
      setZoom(inicial);
      return true;
    }

    if (tentar()) return;
    const observer = new ResizeObserver(() => {
      if (tentar()) observer.disconnect();
    });
    observer.observe(vp);
    return () => observer.disconnect();
  }, []);

  /** Ctrl/Cmd + roda aproxima, que é o gesto consagrado em editor — e é também o que o
   * trackpad manda quando se faz pinça nele.
   *
   * Precisa ser listener nativo com passive:false: o onWheel do React entra como passivo,
   * onde preventDefault não tem efeito, e sem preventDefault quem aproxima é o navegador,
   * na página inteira. O ref carrega o estado mais novo para o listener poder ser montado
   * uma vez só. */
  const rodaRef = useRef(zoomTo);
  useEffect(() => {
    rodaRef.current = zoomTo;
  });
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      rodaRef.current(zoomRef.current * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX, e.clientY);
    }
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, []);

  /** Pinça de dois dedos. Precisa ser nossa: as peças usam touch-action none (senão o
   * navegador entende o arrasto como rolagem), e isso também tira a pinça nativa em cima
   * delas. */
  function onViewportPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size !== 2) return;
    // Chegou o segundo dedo: o que estava valendo como arrasto de peça vira pinça.
    cancelDrag.current?.();
    rebasearPinca();
  }

  /** Os dois ponteiros encostados, quando são exatamente dois. */
  function doisPonteiros() {
    if (pointers.current.size !== 2) return null;
    const [a, b] = [...pointers.current.values()];
    return a && b ? { a, b } : null;
  }

  /** (Re)marca o zero da pinça a partir dos dois dedos que estão na tela agora. Precisa ser
   * refeito sempre que o par muda — com três dedos, largar um deixava a distância de
   * referência medida entre OUTRO par, e a aproximação dava um pulo. Lê zoomRef, e não o
   * estado, pelo mesmo motivo de sempre: o estado chega um render atrasado. */
  function rebasearPinca() {
    const par = doisPonteiros();
    pinch.current = par
      ? {
          dist: Math.hypot(par.a.x - par.b.x, par.a.y - par.b.y),
          zoom: zoomRef.current,
          cx: (par.a.x + par.b.x) / 2,
          cy: (par.a.y + par.b.y) / 2,
        }
      : null;
  }

  function onViewportPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const inicio = pinch.current;
    if (!inicio || !inicio.dist) return;
    const par = doisPonteiros();
    if (!par) return;
    const { a, b } = par;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    // Aproxima segurando o meio da pinça...
    zoomTo(inicio.zoom * (dist / inicio.dist), cx, cy);
    // ...e o quanto esse meio andou desloca o mapa junto. É o único jeito de alcançar as
    // bordas do palco ampliado no toque, agora que o quadro não rola sozinho.
    deslocar(inicio.cx - cx, inicio.cy - cy);
    inicio.cx = cx;
    inicio.cy = cy;
  }

  /** Move a vista do mapa. Usa scrollLeft/scrollTop, que continuam válidos mesmo com
   * overflow hidden — o quadro só não rola por gesto do navegador. */
  function deslocar(dx: number, dy: number) {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.scrollLeft += dx;
    vp.scrollTop += dy;
  }

  /** Arrastar o vazio da grade desloca o mapa — só no mouse. No toque esse mesmo gesto é a
   * rolagem da página (o motivo de o quadro ter deixado de rolar sozinho), e lá quem
   * desloca o mapa são os dois dedos. */
  function startPan(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (zoomRef.current <= ZOOM_MIN) return; // nada a deslocar: o palco cabe inteiro
    e.preventDefault();
    const target = e.currentTarget;
    let ultimoX = e.clientX;
    let ultimoY = e.clientY;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      /* segue sem captura */
    }

    function onMove(ev: PointerEvent) {
      deslocar(ultimoX - ev.clientX, ultimoY - ev.clientY);
      ultimoX = ev.clientX;
      ultimoY = ev.clientY;
    }
    function onUp() {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
    }
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
  }

  function onViewportPointerEnd(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    // Sobrando exatamente dois, a pinça continua — mas a partir de um zero novo, medido
    // entre os dedos que restaram.
    if (pointers.current.size === 2) rebasearPinca();
    else if (pointers.current.size < 2) pinch.current = null;
  }

  /** Célula sob o ponteiro, presa aos limites da grade: arrastar para fora da borda desliza
   * a peça pela lateral em vez de cancelar o gesto no meio do caminho. */
  function cellFromPointer(clientX: number, clientY: number) {
    const el = gridRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const col = Math.floor(((clientX - rect.left) / rect.width) * COLS);
    const row = Math.floor(((clientY - rect.top) / rect.height) * ROWS);
    return {
      col: Math.max(0, Math.min(COLS - 1, col)),
      row: Math.max(0, Math.min(ROWS - 1, row)),
    };
  }

  /** Onde a peça encostaria se soltasse neste ponto. `grab` é a distância, em células, entre
   * o canto da peça e a célula onde ela foi pega — preservá-la é o que faz a peça andar
   * junto do dedo em vez de pular para debaixo dele. O mesmo cálculo alimenta a prévia e o
   * commit, para o que se vê ser exatamente o que acontece. */
  function dropTargetAt(
    clientX: number,
    clientY: number,
    item: StageItem,
    grab: { col: number; row: number },
  ) {
    const cell = cellFromPointer(clientX, clientY);
    if (!cell) return null;
    const span = itemSpan(item);
    const col = Math.max(0, Math.min(COLS - span.w, cell.col - grab.col));
    const row = Math.max(0, Math.min(ROWS - span.h, cell.row - grab.row));
    return { col, row, w: span.w, h: span.h, ok: fits(items, span, col, row, item.id) };
  }

  /** Move a peça em células. Serve às setas do teclado quando ela está selecionada — o
   * ajuste fino que o arrasto não dá, e o único caminho para quem não usa mouse. */
  function moveBy(id: string, dCol: number, dRow: number) {
    const item = items.find((i) => i.id === id);
    if (!item || item.locked) return;
    const span = itemSpan(item);
    const col = Math.max(0, Math.min(COLS - span.w, item.col + dCol));
    const row = Math.max(0, Math.min(ROWS - span.h, item.row + dRow));
    if (col === item.col && row === item.row) return;
    if (!fits(items, span, col, row, item.id)) {
      setWarning(`"${item.label}" não cabe nesse ponto — já tem equipamento no lugar.`);
      return;
    }
    setWarning(null);
    onChange(items.map((i) => (i.id === id ? { ...i, col, row } : i)));
  }

  /** Arrasta a peça com pointer events, e não com o drag-and-drop do HTML5: o HTML5 só
   * responde a mouse, então no celular o mapa era intransportável — dava para adicionar e
   * remover peça, mas não para posicionar nenhuma. Pointer events cobrem dedo, caneta e
   * mouse pelo mesmo caminho.
   *
   * Só vira arrasto depois de andar alguns pixels; abaixo disso o gesto é um toque, que
   * apenas seleciona a peça e revela os botões dela. */
  function startMove(e: React.PointerEvent<HTMLElement>, item: StageItem) {
    // Os botões de ação e a alça de redimensionar têm gesto próprio.
    if ((e.target as HTMLElement).closest("[data-stage-control]")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Qualquer ponteiro já encostado significa que este é o segundo dedo, e dois dedos é
    // pinça, não arrasto. Precisa ser >= 1: este handler roda ANTES do handler do quadro
    // (a peça está dentro dele), então o ponteiro atual ainda não entrou no mapa. Com > 1
    // o segundo dedo abria um arrasto novo, sobrescrevia o cancelDrag do primeiro, e o
    // primeiro sobrevivia à pinça inteira para dar commit ao soltar.
    if (pointers.current.size >= 1) return;

    // Travada, a peça ainda seleciona (é assim que se chega ao botão de destravar), mas o
    // gesto segue sendo do navegador — no celular é o que deixa a rolagem passar por cima
    // dela.
    setSelectedId(item.id);
    if (item.locked) return;

    // Sem isto o navegador entende o gesto como arrastar a arte da peça (ou selecionar o
    // rótulo), abre o drag nativo dele e encerra o nosso na hora com um pointercancel —
    // era o motivo de a peça não sair do lugar nem no mouse.
    e.preventDefault();
    // preventDefault também cancela o foco automático; devolver o foco é o que mantém as
    // setas do teclado funcionando depois de clicar na peça. preventScroll é obrigatório:
    // com aproximação o quadro rola, e um focus() comum traria a peça para dentro da vista
    // deslocando a grade DEPOIS de `grab` já ter sido medido — a peça saltaria o tamanho da
    // rolagem no primeiro quadro do arrasto.
    e.currentTarget.focus({ preventScroll: true });

    const cell = cellFromPointer(e.clientX, e.clientY);
    if (!cell) return;
    const grab = { col: cell.col - item.col, row: cell.row - item.row };
    const originX = e.clientX;
    const originY = e.clientY;
    const target = e.currentTarget as HTMLElement;
    // A captura mantém o gesto vivo quando o dedo sai de cima da peça — que é o caso
    // normal, já que a peça anda junto. Se o navegador recusar (ponteiro já solto),
    // seguir sem captura é melhor do que abortar o arrasto.
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      /* segue sem captura */
    }
    let moved = false;

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - originX;
      const dy = ev.clientY - originY;
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      moved = true;
      setDrag({ id: item.id, dx, dy });
      setDropHint(dropTargetAt(ev.clientX, ev.clientY, item, grab));
    }

    function finish(ev: PointerEvent | null, commit: boolean) {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onCancel);
      cancelDrag.current = null;
      setDrag(null);
      setDropHint(null);
      if (!commit || !moved || !ev) return;
      const drop = dropTargetAt(ev.clientX, ev.clientY, item, grab);
      if (!drop) return;
      if (!drop.ok) {
        setWarning(`"${item.label}" não cabe nesse ponto — já tem equipamento no lugar.`);
        return;
      }
      setWarning(null);
      onChange(items.map((i) => (i.id === item.id ? { ...i, col: drop.col, row: drop.row } : i)));
    }

    function onUp(ev: PointerEvent) {
      finish(ev, true);
    }
    function onCancel(ev: PointerEvent) {
      finish(ev, false);
    }

    // A pinça precisa conseguir abortar este arrasto quando o segundo dedo encosta.
    cancelDrag.current = () => finish(null, false);

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onCancel);
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
              title="Busca em todas as categorias de uma vez, ignorando as abas"
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
                title={`Mostrar só ${cat.label} (${
                  STAGE_KINDS.filter((k) => k.category === cat.key).length
                } peças)`}
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
                title={`Adicionar ${k.label} — ocupa ${k.footprint.w}×${k.footprint.h} células da grade`}
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
            title="Coloca um retorno na frente de cada músico que ainda não tem um por perto"
            className="h-8 text-xs font-medium ml-auto"
          >
            <Speaker className="mr-1 size-3.5 text-primary" /> Sugerir Monitores
          </Button>
        </div>
      </div>

      {/* Barra de edição do canvas. Fica entre o painel de peças e a grade porque age
          sobre o mapa, não sobre o catálogo. */}
      <div className="flex flex-wrap items-center gap-2">
        {history ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={!history.canUndo}
              onClick={history.undo}
              title="Desfazer a última alteração no mapa (Ctrl/Cmd + Z)"
            >
              <Undo2 className="mr-1 size-3.5" /> Desfazer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={!history.canRedo}
              onClick={history.redo}
              title="Refazer o que acabou de ser desfeito (Ctrl/Cmd + Shift + Z)"
            >
              <Redo2 className="mr-1 size-3.5" /> Refazer
            </Button>
          </div>
        ) : null}

        {/* Aproximação. Fica junto do desfazer porque as duas agem sobre a vista do mapa, e
            não sobre o catálogo de peças. */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="size-8 p-0"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => zoomTo(zoomRef.current - 0.25)}
            aria-label="Afastar"
            title="Afastar"
          >
            <Minus className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 min-w-14 px-1 text-xs tabular-nums"
            disabled={zoom === ZOOM_MIN}
            onClick={() => zoomTo(ZOOM_MIN)}
            title="Ajustar à tela — mostra o palco inteiro de uma vez"
          >
            {zoom === ZOOM_MIN ? "Ajustado" : `${Math.round(zoom * 100)}%`}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="size-8 p-0"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => zoomTo(zoomRef.current + 0.25)}
            aria-label="Aproximar"
            title="Aproximar — no celular, pinça de dois dedos; para deslocar o mapa, arraste o vazio com o mouse ou use dois dedos"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        <span className="text-xs text-muted-foreground">
          {items.length === 0
            ? "Palco vazio"
            : `${items.length} ${items.length === 1 ? "peça" : "peças"} no palco`}
          {items.some((i) => i.locked)
            ? ` · ${items.filter((i) => i.locked).length} travada(s)`
            : ""}
        </span>

        {items.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-8 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              setWarning(null);
              onChange([]);
            }}
            title="Tira todas as peças do palco — dá para voltar no Desfazer"
          >
            <Eraser className="mr-1 size-3.5" /> Limpar palco
          </Button>
        ) : null}
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

        {/* Quadro de visualização: mantém a área do palco inteiro (aspect COLS/ROWS) e corta
            o que sobra quando a grade cresce. O min-height segura o caso do celular, onde
            22/12 de 300px daria uma fresta de 164px de altura.

            overflow-hidden, e não auto, de propósito: um quadro rolável no meio de um
            formulário longo sequestra a rolagem da página — o dedo (ou a roda) some dentro
            do mapa em vez de chegar nos controles logo abaixo. Aqui o quadro NUNCA rola por
            gesto do usuário; ele só é reposicionado por código (scrollLeft/scrollTop
            continuam funcionando com overflow hidden), o que mantém o zoom com ponto de
            referência intacto. Para deslocar o mapa: dois dedos no toque, arrastar o vazio
            com o mouse. */}
        <div
          ref={viewportRef}
          onPointerDown={onViewportPointerDown}
          onPointerMove={onViewportPointerMove}
          onPointerUp={onViewportPointerEnd}
          onPointerCancel={onViewportPointerEnd}
          className="mb-2 min-h-[260px] overflow-hidden rounded-lg sm:min-h-0"
          style={{
            aspectRatio: `${COLS} / ${ROWS}`,
            // pan-y deixa o arrasto de um dedo rolar a PÁGINA (o quadro não rola sozinho,
            // então a rolagem sobe direto para o modal) e ao mesmo tempo tira do navegador
            // a pinça, que é nossa. Sem o pan-y, a pinça viraria zoom da página inteira.
            touchAction: "pan-y",
          }}
        >
          {/* Largura em % da aproximação + aspect-ratio COLS/ROWS: a célula fica sempre
              quadrada e a grade inteira cresce junto, sem transform — assim os rótulos e as
              bordas continuam nítidos, e a matemática do arrasto (que mede o retângulo real)
              segue valendo sem nenhuma conversão. */}
          <div
            ref={gridRef}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("[data-stage-item]")) return;
              // Tocar no vazio da grade tira a seleção — é como o usuário "fecha" os botões
              // da peça no celular, onde não existe sair-com-o-mouse.
              setSelectedId(null);
              startPan(e);
            }}
            className={cn(
              "relative",
              dropHint && "cursor-grabbing",
              // A mão só aparece quando há para onde deslocar.
              !dropHint && zoom > ZOOM_MIN && "cursor-grab",
            )}
            style={{ aspectRatio: `${COLS} / ${ROWS}`, width: `${zoom * 100}%` }}
          >
            {/* Linhas da Grade do Palco sem Fundo Roxo */}
            <div
              className="grid size-full gap-1"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
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
                gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
              }}
            >
              {/* Palco vazio não diz o que fazer: a grade tracejada sozinha não sugere que o
                  próximo passo está no catálogo lá em cima. A dica some no instante em que
                  a primeira peça entra, então não estorva quem já sabe. */}
              {items.length === 0 ? (
                <div
                  className="pointer-events-none z-10 flex items-center justify-center"
                  style={{ gridColumn: "1 / -1", gridRow: "1 / -1" }}
                >
                  <p className="rounded-lg border border-dashed border-border bg-background/90 px-3 py-2 text-center text-xs font-medium text-muted-foreground shadow-xs">
                    Escolha um instrumento no catálogo acima para começar o mapa
                  </p>
                </div>
              ) : null}

              {/* Prévia do drop: as células exatas que a peça vai ocupar quando soltar. A
                  peça em si acompanha o dedo livremente, então é esta marca que mostra
                  onde ela de fato encaixa na grade. */}
              {dropHint ? (
                <div
                  aria-hidden
                  style={{
                    gridColumn: `${dropHint.col + 1} / span ${dropHint.w}`,
                    gridRow: `${dropHint.row + 1} / span ${dropHint.h}`,
                  }}
                  className={cn(
                    "pointer-events-none relative z-10 rounded-lg border-2 border-dashed",
                    dropHint.ok
                      ? "border-primary bg-primary/20"
                      : "border-destructive bg-destructive/20",
                  )}
                >
                  <span
                    className={cn(
                      "absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-xs px-1 text-[9px] font-bold tabular-nums text-background",
                      dropHint.ok ? "bg-primary" : "bg-destructive",
                    )}
                  >
                    {dropHint.ok ? `${dropHint.w}×${dropHint.h}` : "ocupado"}
                  </span>
                </div>
              ) : null}

              {items.map((item) => {
                const span = itemSpan(item);
                const category = STAGE_KINDS.find((k) => k.kind === item.kind)?.category ?? "infra";
                const colorStyle = categoryColorStyles(category);
                const selected = selectedId === item.id;
                const dragging = drag?.id === item.id;
                // Os controles seguem aparecendo no hover (mouse) e passam a aparecer
                // também quando a peça está selecionada — o único caminho no toque.
                const controlsVisible = selected
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100";

                return (
                  <div
                    key={item.id}
                    data-stage-item
                    data-selected={selected || undefined}
                    // group, e não button: a peça contém cinco botões, a alça de
                    // redimensionar e o campo de texto. Um role="button" achataria tudo isso
                    // no nome acessível e sumiria com os controles para quem usa leitor de
                    // tela — além de prometer uma reação a Enter/Space que a peça não tem.
                    role="group"
                    tabIndex={0}
                    aria-label={`${item.label}${item.locked ? " (travado)" : ""}`}
                    aria-roledescription="peça do mapa de palco"
                    title={
                      item.locked
                        ? `${item.label} — travado. Destrave para mover ou redimensionar.`
                        : isTextItem(item)
                          ? `${item.label} — duplo clique para editar o texto; arraste para reposicionar`
                          : `${item.label} — arraste para onde quiser (a peça acompanha o ponto onde você pegou); com ela selecionada, as setas do teclado ajustam célula a célula`
                    }
                    onPointerDown={(e) => startMove(e, item)}
                    onDoubleClick={() => {
                      if (isTextItem(item) && !item.locked) setEditingId(item.id);
                    }}
                    onKeyDown={(e) => {
                      const step: Record<string, [number, number]> = {
                        ArrowRight: [1, 0],
                        ArrowLeft: [-1, 0],
                        ArrowDown: [0, 1],
                        ArrowUp: [0, -1],
                      };
                      const d = step[e.key];
                      if (!d) return;
                      e.preventDefault();
                      setSelectedId(item.id);
                      moveBy(item.id, d[0], d[1]);
                    }}
                    onFocus={() => setSelectedId(item.id)}
                    style={{
                      gridColumn: `${item.col + 1} / span ${span.w}`,
                      gridRow: `${item.row + 1} / span ${span.h}`,
                      // A peça acompanha o ponteiro em px durante o gesto; ao soltar volta
                      // ao fluxo da grade, já na célula nova.
                      ...(dragging
                        ? { transform: `translate(${drag.dx}px, ${drag.dy}px)`, zIndex: 40 }
                        : null),
                    }}
                    className={cn(
                      // transition-shadow, e não transition-all: animar o transform faria a
                      // peça arrastar atrasada em relação ao dedo.
                      "group pointer-events-auto relative select-none rounded-lg border backdrop-blur-2xs shadow-xs transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      item.locked
                        ? "cursor-not-allowed border-dashed opacity-90"
                        : // touch-none impede o navegador de entender o arrasto como rolagem
                          // da página e engolir o gesto no meio.
                          "cursor-grab touch-none active:cursor-grabbing hover:shadow-md",
                      dragging && "cursor-grabbing shadow-lg",
                      selected && !dragging && "ring-2 ring-primary/70",
                      // A caixa de texto é recado, não equipamento: borda tracejada e fundo
                      // neutro para ninguém confundir com uma peça do palco.
                      isTextItem(item)
                        ? "border-dashed border-border bg-background/80"
                        : colorStyle,
                    )}
                  >
                    <div
                      data-stage-control
                      className={cn(
                        "absolute -right-2 -top-2 z-30 flex gap-0.5 transition-opacity focus-within:opacity-100",
                        controlsVisible,
                      )}
                    >
                      {/* Editar texto tem botão próprio porque o duplo clique não existe no
                          toque: o preventDefault do pointerdown (necessário para o arrasto)
                          suprime os eventos de mouse de compatibilidade, e com eles o
                          dblclick. Sem este botão a caixa de texto seria ineditável no
                          celular — justo a plataforma que o resto daqui veio consertar. */}
                      {isTextItem(item) && (
                        <button
                          type="button"
                          aria-label={`Editar texto de ${item.label}`}
                          title="Editar o texto desta caixa"
                          className="rounded-full border border-border bg-background p-1 text-foreground shadow-md disabled:opacity-40"
                          disabled={item.locked}
                          onClick={() => setEditingId(item.id)}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={
                          item.locked ? `Destravar ${item.label}` : `Travar ${item.label}`
                        }
                        title={
                          item.locked
                            ? "Destravar — volta a aceitar mover, girar e redimensionar"
                            : "Travar no lugar — útil para fixar bateria e praticável antes de encaixar o resto"
                        }
                        className={cn(
                          "rounded-full border border-border p-1 shadow-md",
                          item.locked
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-foreground",
                        )}
                        onClick={() => toggleLock(item.id)}
                      >
                        {item.locked ? (
                          <Lock className="size-3.5" />
                        ) : (
                          <Unlock className="size-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label={`Girar ${item.label} 45 graus`}
                        title={`Girar 45° (está em ${item.rotateDeg ?? 0}°) — aponte a peça para quem ela atende`}
                        className="rounded-full bg-background text-foreground border border-border p-1 shadow-md disabled:opacity-40"
                        disabled={item.locked}
                        onClick={() => rotate(item.id)}
                      >
                        <RotateCw className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Espelhar ${item.label}`}
                        title="Espelhar na horizontal — vira o desenho para o outro lado, sem mudar de lugar"
                        className="rounded-full bg-background text-foreground border border-border p-1 shadow-md disabled:opacity-40"
                        disabled={item.locked}
                        onClick={() => mirror(item.id)}
                      >
                        <FlipHorizontal className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Duplicar ${item.label}`}
                        title="Duplicar — a cópia mantém porte, rotação e espelho, e entra na vaga mais próxima"
                        className="rounded-full bg-background text-foreground border border-border p-1 shadow-md"
                        onClick={() => duplicateItem(item.id)}
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remover ${item.label}`}
                        title={`Remover "${item.label}" do palco`}
                        className="rounded-full bg-destructive text-destructive-foreground p-1 shadow-md disabled:opacity-40"
                        disabled={item.locked}
                        onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {/* Alça de redimensionar, no canto inferior direito. Marcada como
                        controle para o pointerdown dela não virar arrasto da peça. */}
                    {!item.locked && (
                      <div
                        data-stage-control
                        role="slider"
                        tabIndex={0}
                        aria-label={`Redimensionar ${item.label}`}
                        aria-valuetext={`${span.w} por ${span.h} células`}
                        aria-valuenow={span.w}
                        aria-valuemin={1}
                        aria-valuemax={COLS}
                        title={`${span.w}×${span.h} células — arraste para redimensionar, duplo clique volta ao padrão`}
                        draggable={false}
                        onPointerDown={(e) => startResize(e, item)}
                        onDoubleClick={() => resetSize(item.id)}
                        onKeyDown={(e) => {
                          const step: Record<string, [number, number]> = {
                            ArrowRight: [1, 0],
                            ArrowLeft: [-1, 0],
                            ArrowDown: [0, 1],
                            ArrowUp: [0, -1],
                          };
                          const d = step[e.key];
                          if (!d) return;
                          e.preventDefault();
                          // Sem isto a seta também borbulharia para a peça e o gesto
                          // redimensionaria e moveria de uma vez só.
                          e.stopPropagation();
                          setSize(item.id, span.w + d[0], span.h + d[1]);
                        }}
                        className={cn(
                          "absolute -bottom-1 -right-1 z-30 size-3.5 touch-none cursor-nwse-resize rounded-sm border border-border bg-background shadow-md transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring/60",
                          controlsVisible,
                        )}
                      />
                    )}

                    {isTextItem(item) ? (
                      editingId === item.id ? (
                        <input
                          data-stage-control
                          // Foco na mão em vez de autoFocus, pelo mesmo motivo do startMove:
                          // autoFocus rola o quadro para trazer a caixa à vista, e com
                          // aproximação isso desloca o mapa inteiro na cara do usuário.
                          ref={(el) => el?.focus({ preventScroll: true })}
                          defaultValue={item.label}
                          aria-label="Texto da caixa"
                          onBlur={(e) => commitText(item.id, e.currentTarget.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") commitText(item.id, e.currentTarget.value);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          // select-text e touch-auto desfazem, só aqui dentro, o select-none
                          // e o touch-none que a peça usa para o arrasto — senão não dá para
                          // marcar nem posicionar o cursor no texto que se está editando.
                          className="absolute inset-0 size-full touch-auto select-text rounded-lg border-0 bg-background/95 px-1 text-center text-[10px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      ) : (
                        <span className="pointer-events-none flex size-full items-center justify-center overflow-hidden px-1 text-center text-[9px] font-semibold leading-tight text-foreground sm:text-[11px]">
                          {item.label}
                        </span>
                      )
                    ) : (
                      <>
                        {/* A pegada inteira é arte: o rótulo sai dela e flutua por baixo, para
                            o desenho não perder altura para uma faixa de texto. */}
                        <StageIcon kind={item.kind} rotateDeg={item.rotateDeg} flipX={item.flipX} />

                        {/* Rótulo sobreposto no rodapé da própria pegada: não rouba altura da
                            arte (que segue ocupando a caixa inteira) e não vaza para a célula
                            vizinha. Quebra em duas linhas quando o nome é longo. */}
                        <span className="pointer-events-none absolute bottom-0.5 left-1/2 z-20 max-w-[calc(100%-4px)] -translate-x-1/2 truncate rounded-xs border border-border/60 bg-background/95 px-0.5 py-px text-center text-[7px] font-bold leading-[1.1] text-foreground shadow-2xs sm:px-1 sm:py-0.5 sm:text-[9px] sm:leading-[1.15]">
                          {item.label}
                        </span>
                      </>
                    )}
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
        💡 <strong>Como posicionar:</strong> arraste a peça com o dedo ou o mouse — ela acompanha o
        ponto onde você pegou, e a área tracejada mostra as células que ela vai ocupar antes de você
        soltar. <strong>Toque uma vez</strong> para selecionar e liberar os botões de travar, girar,
        espelhar, duplicar e remover; com a peça selecionada, as setas do teclado ajustam célula a
        célula. Puxe o canto inferior direito para redimensionar.
        {history ? " Ctrl/Cmd + Z desfaz, Ctrl/Cmd + Shift + Z refaz." : ""}
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
  // Com 22 colunas a célula tem ~50px de largura ((1200 − 40 de padding − 21 vãos)/22),
  // então o retrato usa 50 para ficar quadrada: 12×50 + 33 = 633px, dentro dos 802.
  // O paisagem fica em 46 porque 12×50 + 33 estouraria os 597 disponíveis.
  const cellHeight = isLandscape ? 46 : 50;

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
            const span = itemSpan(item);
            // A caixa de texto vira o próprio recado no PDF: moldura tracejada e o texto
            // ocupando a caixa, sem ícone e sem a faixinha de nome.
            if (isTextItem(item)) {
              return (
                <div
                  key={item.id}
                  style={{
                    gridColumn: `${item.col + 1} / span ${span.w}`,
                    gridRow: `${item.row + 1} / span ${span.h}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 4px",
                    border: "1px dashed #a1a1aa",
                    borderRadius: 6,
                    background: "#ffffff",
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    textAlign: "center",
                    color: "#18181b",
                    overflow: "hidden",
                  }}
                >
                  {item.label}
                </div>
              );
            }
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
                <StageIcon kind={item.kind} rotateDeg={item.rotateDeg} flipX={item.flipX} />
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
      {items.map((item) => {
        const span = itemSpan(item);
        const resized = item.w !== undefined || item.h !== undefined;
        return (
          <div key={item.id} className="flex flex-wrap items-center gap-2">
            <Select
              value={item.kind}
              disabled={Boolean(item.locked)}
              onValueChange={(v) =>
                onChange(
                  items.map((i) => {
                    if (i.id !== item.id) return i;
                    // O tamanho manual não sobrevive à troca de tipo: a pegada nova é a
                    // do tipo escolhido, senão um cubo viraria bateria mantendo 2x2.
                    const { w: _w, h: _h, ...rest } = i;
                    return { ...rest, kind: v as StageKind };
                  }),
                )
              }
            >
              <SelectTrigger
                className="h-8 w-full text-xs sm:w-44"
                title="Trocar o tipo desta peça — o desenho e o espaço que ela ocupa mudam junto"
              >
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
              className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-xs"
              title="Nome que aparece no mapa e no PDF. Nomes curtos cabem melhor dentro da peça"
              value={item.label}
              onChange={(e) =>
                onChange(items.map((i) => (i.id === item.id ? { ...i, label: e.target.value } : i)))
              }
            />
            <button
              type="button"
              disabled={!resized || item.locked}
              title={
                resized
                  ? `${span.w}×${span.h} células (ajustado à mão) — clique para voltar ao padrão do tipo`
                  : `${span.w}×${span.h} células — porte padrão do tipo`
              }
              onClick={() =>
                onChange(
                  items.map((i) => {
                    if (i.id !== item.id) return i;
                    const { w: _w, h: _h, ...rest } = i;
                    return rest;
                  }),
                )
              }
              className={cn(
                "h-8 shrink-0 rounded-md border px-2 font-mono text-[11px] tabular-nums",
                resized
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-input text-muted-foreground",
                "disabled:cursor-default",
              )}
            >
              {span.w}×{span.h}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={item.locked ? `Destravar ${item.label}` : `Travar ${item.label}`}
              title={
                item.locked
                  ? "Destravar — volta a aceitar mover, girar e redimensionar"
                  : "Travar no lugar — útil para fixar bateria e praticável antes de encaixar o resto"
              }
              onClick={() =>
                onChange(items.map((i) => (i.id === item.id ? { ...i, locked: !i.locked } : i)))
              }
            >
              {item.locked ? (
                <Lock className="size-4 text-primary" />
              ) : (
                <Unlock className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={item.locked}
              aria-label={`Girar ${item.label} 45 graus`}
              title={`Girar 45° (está em ${item.rotateDeg ?? 0}°) — aponte a peça para quem ela atende`}
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
              disabled={item.locked}
              aria-label={`Espelhar ${item.label}`}
              title="Espelhar na horizontal — vira o desenho para o outro lado, sem mudar de lugar"
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
              disabled={item.locked}
              aria-label="Remover"
              title={`Remover "${item.label}" do palco`}
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export const PlusIcon = Plus;
