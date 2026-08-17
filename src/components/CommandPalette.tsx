import { useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, Building2 } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { navForActivities } from "@/lib/nav";
import { useActivities } from "@/lib/activities";
import { useList } from "@/lib/queries";
import { dateBR } from "@/lib/format";

/** ⌘K / Ctrl+K — ir para qualquer tela pelo nome, sem navegar pela sidebar.
 *  É o atalho de maior retorno para quem tem dificuldade de manter o fio da
 *  navegação: busca shows e contratantes já cadastrados, além das telas. */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  // O ⌘K não pode oferecer tela que a sidebar esconde: seria a única porta
  // para um recurso que não é daquele perfil.
  const { activities } = useActivities();
  const { top, groups } = navForActivities(activities);
  const navItems = [...top, ...groups.flatMap((g) => g.items)];
  const { data: events = [] } = useList("events", {
    order: { column: "event_date", ascending: false },
  });
  const { data: clients = [] } = useList("clients", { order: { column: "name" } });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const recentEvents = useMemo(() => events.slice(0, 8), [events]);
  const topClients = useMemo(() => clients.slice(0, 8), [clients]);

  function go(to: string) {
    onOpenChange(false);
    navigate({ to });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar telas, shows, contratantes..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Ir para">
          {navItems.map((item) => (
            <CommandItem key={item.to} value={item.label} onSelect={() => go(item.to)}>
              <item.icon />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {recentEvents.length > 0 && (
          <CommandGroup heading="Shows">
            {recentEvents.map((e) => (
              <CommandItem
                key={e.id}
                value={`${e.title} ${e.venue ?? ""} ${e.city ?? ""}`}
                onSelect={() => {
                  onOpenChange(false);
                  navigate({ to: "/eventos/$eventId", params: { eventId: e.id } });
                }}
              >
                <CalendarDays />
                <span className="truncate">{e.title}</span>
                <CommandShortcut>
                  {e.event_date ? dateBR(e.event_date) : "sem data"}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {topClients.length > 0 && (
          <CommandGroup heading="Contratantes">
            {topClients.map((c) => (
              <CommandItem key={c.id} value={c.name} onSelect={() => go("/contratantes")}>
                <Building2 />
                {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
