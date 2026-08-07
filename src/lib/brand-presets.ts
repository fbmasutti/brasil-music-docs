export type BrandFontFamily = "sans" | "serif" | "display" | "mono" | "rounded" | "condensed";
export type BrandPattern = "none" | "grid" | "diagonal" | "dots" | "waves" | "cross" | "sunburst";

export type BrandPalette = {
  bg: string;
  card: string;
  accent: string;
  text: string;
  fontFamily: BrandFontFamily;
  pattern: BrandPattern;
};

export type BrandPreset = {
  id: string;
  label: string;
  description: string;
  palette: BrandPalette;
};

// Uma família por categoria — cada preset tem uma fonte fisicamente distinta,
// carregada via Google Fonts em src/routes/__root.tsx.
export const FONT_STACKS: Record<BrandFontFamily, string> = {
  sans: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  serif: '"Fraunces", ui-serif, Georgia, serif',
  // Western/circus vintage (referência: cartazes tipo "Country Blues" e "West End").
  display: '"Rye", ui-sans-serif, system-ui, sans-serif',
  mono: '"Space Mono", ui-monospace, "SF Mono", monospace',
  // Manuscrita/pincel (referência: adesivos e placas pintadas à mão).
  rounded: '"Permanent Marker", ui-rounded, ui-sans-serif, system-ui, sans-serif',
  // Condensada ultra-bold de cartaz colado no poste (mais impacto que Oswald).
  condensed: '"Anton", ui-sans-serif, system-ui, sans-serif',
};

export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: "neon_night",
    label: "Neon Night",
    description: "Slate profundo com violeta neon — combina com o visual padrão do StageKit.",
    palette: {
      bg: "#09090B",
      card: "#18181B",
      accent: "#8B5CF6",
      text: "#FAFAFA",
      fontFamily: "sans",
      pattern: "grid",
    },
  },
  {
    id: "acoustic_minimal",
    label: "Acoustic Minimal",
    description: "Creme e carvão claro com tipografia serifada — clima intimista, acústico.",
    palette: {
      bg: "#F5F0E8",
      card: "#FFFFFF",
      accent: "#3F3A34",
      text: "#1C1917",
      fontFamily: "serif",
      pattern: "none",
    },
  },
  {
    id: "vintage_poster",
    label: "Vintage Poster",
    description:
      "Alto contraste retrô com tipografia western e grafismo art déco — clima de cartaz de show antigo.",
    palette: {
      bg: "#1A1400",
      card: "#2B2100",
      accent: "#E8B923",
      text: "#FFF6E0",
      fontFamily: "display",
      pattern: "sunburst",
    },
  },
  {
    id: "studio_mono",
    label: "Studio Mono",
    description: "Preto e branco técnico, tipografia monoespaçada — clima de estúdio e backstage.",
    palette: {
      bg: "#101012",
      card: "#1C1C1F",
      accent: "#E4E4E7",
      text: "#F4F4F5",
      fontFamily: "mono",
      pattern: "diagonal",
    },
  },
  {
    id: "tropical_bloom",
    label: "Tropical Bloom",
    description:
      "Verde e coral vibrantes, tipografia manuscrita — clima de placa de praia pintada à mão.",
    palette: {
      bg: "#0F3D2E",
      card: "#154A38",
      accent: "#FF7A59",
      text: "#F3FBF6",
      fontFamily: "rounded",
      pattern: "waves",
    },
  },
  {
    id: "punk_zine",
    label: "Punk Zine",
    description:
      "Preto, branco e vermelho crus, tipografia condensada ultra-bold — clima de fanzine e cartaz colado no poste.",
    palette: {
      bg: "#0A0A0A",
      card: "#000000",
      accent: "#E4002B",
      text: "#FFFFFF",
      fontFamily: "condensed",
      pattern: "cross",
    },
  },
];

export function presetPalette(id: string): BrandPalette {
  return (BRAND_PRESETS.find((p) => p.id === id) ?? BRAND_PRESETS[0]!).palette;
}

type BrandKitLike = { palette?: unknown; preset?: string | null } | null | undefined;

/** Paleta efetiva de um brand kit: usa a paleta salva se for válida, senão
 * cai no preset. Kits salvos antes do grafismo/6 fontes existirem não têm
 * `pattern` — cai em "none" em vez de quebrar o layout. */
export function paletteOf(kit: BrandKitLike): BrandPalette {
  const raw = kit?.palette;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "bg" in raw && "accent" in raw) {
    const palette = raw as unknown as BrandPalette;
    return { ...palette, pattern: palette.pattern ?? "none" };
  }
  return presetPalette(kit?.preset ?? "neon_night");
}

/**
 * Grafismo de fundo tileável em SVG puro (sem fetch externo, funciona em
 * data URL) — cada padrão usa a cor de destaque em baixa opacidade para não
 * brigar com o texto do card por cima.
 */
export function patternStyle(
  pattern: BrandPattern,
  color: string,
  opacity = 0.16,
): { backgroundImage?: string; backgroundSize?: string } {
  if (pattern === "none") return {};
  const c = encodeURIComponent(color);
  const svg = (size: number, body: string) =>
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E%3Cg fill='none' stroke='${c}' stroke-width='1' opacity='${opacity}'%3E${body}%3C/g%3E%3C/svg%3E")`;

  switch (pattern) {
    case "grid":
      return {
        backgroundImage: svg(24, "%3Cpath d='M0 0H24M0 0V24'/%3E"),
        backgroundSize: "24px 24px",
      };
    case "diagonal":
      return {
        backgroundImage: svg(16, "%3Cpath d='M0 16L16 0'/%3E"),
        backgroundSize: "16px 16px",
      };
    case "dots":
      return {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Ccircle cx='3' cy='3' r='2.4' fill='${c}' opacity='${opacity}'/%3E%3C/svg%3E")`,
        backgroundSize: "18px 18px",
      };
    case "waves":
      return {
        backgroundImage: svg(40, "%3Cpath d='M0 20Q10 10 20 20T40 20'/%3E"),
        backgroundSize: "40px 20px",
      };
    case "cross":
      return {
        backgroundImage: svg(20, "%3Cpath d='M0 20L20 0M0 0L20 20'/%3E"),
        backgroundSize: "20px 20px",
      };
    case "sunburst":
      // Losangos entrelaçados — motivo geométrico art déco (referência:
      // formas triangulares/circulares soltas de cartazes déco).
      return {
        backgroundImage: svg(32, "%3Cpath d='M0 16L16 0L32 16L16 32Z M16 0V32M0 16H32'/%3E"),
        backgroundSize: "32px 32px",
      };
    default:
      return {};
  }
}
