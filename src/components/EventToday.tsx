import { PartyPopper, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildMapsUrl, buildWazeUrl, buildAppleMapsUrl } from "@/lib/calendar-link";
import { cn } from "@/lib/utils";
import type { CalendarEventInput } from "@/lib/calendar-link";

/** Selo comemorativo — cor de acento, não de alerta: é show, não problema. */
export function TodayBadge({ className }: { className?: string | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary",
        className,
      )}
    >
      <PartyPopper className="size-3" />É hoje!
    </span>
  );
}

/**
 * "Como chegar" com escolha de app de navegação. Ver `calendar-link.ts`:
 * nenhuma URL única abre um seletor nativo nos dois sistemas, então a
 * escolha é oferecida aqui.
 */
export function HowToGetThere({
  event,
  size = "sm",
  variant = "default",
  className,
}: {
  event: CalendarEventInput;
  size?: "sm" | "default" | undefined;
  variant?: "default" | "outline" | undefined;
  className?: string | undefined;
}) {
  const maps = buildMapsUrl(event);
  const waze = buildWazeUrl(event);
  const apple = buildAppleMapsUrl(event);

  // Sem endereço nem cidade não há o que navegar — esconder é melhor que
  // oferecer um botão que abriria um mapa vazio.
  if (!maps) return null;

  const options: [string, string | null][] = [
    ["Google Maps", maps],
    ["Waze", waze],
    ["Apple Maps", apple],
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} className={cn("shrink-0", className)}>
          <Navigation className="mr-1.5 size-4" /> Como chegar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map(([label, href]) =>
          href ? (
            <DropdownMenuItem key={label} asChild>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            </DropdownMenuItem>
          ) : null,
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
