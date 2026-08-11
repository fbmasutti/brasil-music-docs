import { Check } from "lucide-react";
import {
  PICKABLE_BRAND_PRESETS,
  FONT_STACKS,
  patternStyle,
  type BrandPreset,
} from "@/lib/brand-presets";
import { cn } from "@/lib/utils";

/** Grade de escolha de preset visual. O nome do preset fica dentro da própria
 * caixa colorida, na fonte e cor de destaque dele — a etiqueta demonstra a
 * identidade em vez de um "Aa" genérico ao lado de um rótulo cinza. */
export function PresetPicker({
  value,
  onChange,
  presets = PICKABLE_BRAND_PRESETS,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  presets?: BrandPreset[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5", className)}>
      {presets.map((p) => {
        const selected = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            title={p.description}
            onClick={() => onChange(p.id)}
            className={cn(
              "relative overflow-hidden rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "border-primary ring-2 ring-primary/50"
                : "border-border hover:border-primary/60",
            )}
          >
            <span
              className="flex h-14 items-center justify-center px-1.5 py-1 text-center"
              style={{
                background: p.palette.bg,
                ...patternStyle(p.palette.pattern, p.palette.accent),
              }}
            >
              <span
                className="text-[11px] font-bold leading-tight"
                style={{ fontFamily: FONT_STACKS[p.palette.fontFamily], color: p.palette.accent }}
              >
                {p.label}
              </span>
            </span>
            {selected ? (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <Check className="size-2.5" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
