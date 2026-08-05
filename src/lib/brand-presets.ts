export type BrandPalette = {
  bg: string;
  card: string;
  accent: string;
  text: string;
  fontFamily: "sans" | "serif" | "display";
};

export type BrandPreset = {
  id: string;
  label: string;
  description: string;
  palette: BrandPalette;
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
    },
  },
  {
    id: "vintage_poster",
    label: "Vintage Poster",
    description: "Alto contraste retrô com tipografia bold — clima de cartaz de show antigo.",
    palette: {
      bg: "#1A1400",
      card: "#2B2100",
      accent: "#E8B923",
      text: "#FFF6E0",
      fontFamily: "display",
    },
  },
];

export function presetPalette(id: string): BrandPalette {
  return (BRAND_PRESETS.find((p) => p.id === id) ?? BRAND_PRESETS[0]!).palette;
}
