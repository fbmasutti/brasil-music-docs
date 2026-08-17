import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, Radio, Layers, Search, Sun, Moon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useList, useProfile } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { ActiveFormationProvider, useActiveFormation } from "@/lib/active-formation";
import { presetPalette } from "@/lib/brand-presets";
import { navForActivities, pageTitleFor, groupKeyForPathname, type NavItem } from "@/lib/nav";
import { useActivities } from "@/lib/activities";
import { CommandPalette } from "@/components/CommandPalette";
import type { Tables } from "@/integrations/supabase/types";

const NAV_OPEN_GROUP_KEY = "stagekit:nav-open-group";

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  // O menu tem forma diferente conforme o que a pessoa faz: quem só dá aula
  // não vê rider, formação, equipe nem mala de gig.
  const { activities } = useActivities();
  const { top: navTop, groups: navGroups } = navForActivities(activities);

  // Um grupo aberto por vez. A navegação pode trocar qual grupo está aberto
  // (para revelar o item ativo), mas só o clique do usuário no cabeçalho do
  // grupo é gravado no localStorage — sem isso, todo grupo visitado ficava
  // aberto para sempre.
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    if (typeof localStorage === "undefined") return groupKeyForPathname(pathname);
    const stored = localStorage.getItem(NAV_OPEN_GROUP_KEY);
    if (stored !== null) return stored || null;
    return groupKeyForPathname(pathname) ?? navGroups.find((g) => g.defaultOpen)?.key ?? null;
  });

  useEffect(() => {
    const activeGroup = groupKeyForPathname(pathname);
    if (activeGroup && activeGroup !== openGroup) setOpenGroup(activeGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function isItemActive(to: string) {
    return pathname === to || pathname.startsWith(`${to}/`);
  }

  function renderNavItem(item: NavItem) {
    const active = isItemActive(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <item.icon className={cn("size-4 shrink-0", active && "text-primary")} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navTop.map(renderNavItem)}
      <Accordion
        type="single"
        collapsible
        value={openGroup ?? ""}
        onValueChange={(value) => {
          const next = value || null;
          setOpenGroup(next);
          localStorage.setItem(NAV_OPEN_GROUP_KEY, next ?? "");
        }}
        className="mt-2 flex flex-col gap-0.5"
      >
        {navGroups.map((group) => (
          <AccordionItem key={group.key} value={group.key} className="border-b-0">
            <AccordionTrigger className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/80 hover:no-underline [&[data-state=open]>svg]:rotate-180">
              {group.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1 pb-1 pt-1">
              {group.items.map(renderNavItem)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </nav>
  );

  return (
    <ActiveFormationProvider>
      <div className="flex min-h-screen w-full bg-background">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-5 lg:flex">
          <Link to="/dashboard" className="block transition-opacity hover:opacity-80">
            <Brand />
          </Link>
          {nav}
          <UserBox profileName={profile?.stage_name} onSignOut={handleSignOut} />
        </aside>

        {/* Sheet em vez de div manual: traz foco preso, fechar no Escape e
            bloqueio de scroll do fundo, que a implementação anterior não tinha. */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="left"
            className="flex w-72 max-w-[85vw] flex-col overflow-y-auto border-sidebar-border bg-sidebar p-0 py-5 lg:hidden"
          >
            <SheetHeader className="px-5 text-left">
              <SheetTitle asChild>
                <div>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="block">
                    <Brand compact />
                  </Link>
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex flex-1 flex-col">{nav}</div>
            <UserBox profileName={profile?.stage_name} onSignOut={handleSignOut} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {pageTitleFor(pathname)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandOpen(true)}
              className="hidden items-center gap-1.5 text-muted-foreground sm:inline-flex"
            >
              <Search className="size-3.5" /> Buscar
              <kbd className="ml-1 rounded border border-border px-1 text-[10px] text-muted-foreground/70">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCommandOpen(true)}
              aria-label="Buscar"
              className="sm:hidden"
            >
              <Search className="size-4.5" />
            </Button>
            <FormationSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
              // O tema real vem do script inline (antes da hidratação) e pode
              // divergir do "light" padrão do primeiro render no servidor —
              // só o ícone pisca por um frame, as cores da página não.
              suppressHydrationWarning
            >
              {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </ActiveFormationProvider>
  );
}

function Brand({ compact }: { compact?: boolean | undefined }) {
  return (
    <div className={cn("flex items-center gap-2.5", compact ? "" : "px-5 pb-6")}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-brand">
        <Radio className="size-4.5" />
      </span>
      <div>
        <p className="text-sm font-extrabold tracking-tight text-sidebar-foreground">StageKit</p>
        <p className="text-[11px] text-sidebar-foreground/60">Toolkit do artista</p>
      </div>
    </div>
  );
}

function formationDotColor(brandKit: Tables<"brand_kits"> | undefined): string {
  const raw = brandKit?.palette;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "accent" in raw) {
    return (raw as { accent: string }).accent;
  }
  return presetPalette(brandKit?.preset ?? "neon_night").accent;
}

// "Tocando como": troca a formação ativa pra qualquer tela que herde brand
// kit ou roster (Gerador de Posts, Riders), sem precisar reconfigurar nada a
// cada vez — é o contexto que fica ligado, não a tela. Visível também no
// mobile (só o ícone/ponto, o rótulo aparece a partir de sm) — antes sumia
// completamente e o usuário ficava sem saber em que formação estava.
function FormationSwitcher() {
  const { formations, activeFormation, activeFormationId, setActiveFormationId } =
    useActiveFormation();
  const { data: brandKits = [] } = useList("brand_kits");

  if (formations.length === 0) return null;

  const activeBrandKit = brandKits.find((k) => k.id === activeFormation?.brand_kit_id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="inline-flex shrink-0 items-center gap-2">
          {activeFormation ? (
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: formationDotColor(activeBrandKit) }}
            />
          ) : (
            <Layers className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="hidden max-w-56 truncate sm:inline">
            Tocando como: {activeFormation?.name ?? "Padrão (solo)"}
          </span>
          <ChevronDown className="hidden size-3.5 shrink-0 text-muted-foreground sm:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setActiveFormationId(null)}>
          Nenhuma (padrão solo)
        </DropdownMenuItem>
        {formations.map((f) => {
          const kit = brandKits.find((k) => k.id === f.brand_kit_id);
          return (
            <DropdownMenuItem
              key={f.id}
              onSelect={() => setActiveFormationId(f.id)}
              className={cn(f.id === activeFormationId && "font-semibold")}
            >
              <span
                className="mr-2 size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: formationDotColor(kit) }}
              />
              {f.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserBox({
  profileName,
  onSignOut,
}: {
  profileName?: string | undefined;
  onSignOut: () => void;
}) {
  return (
    <div className="mt-4 border-t border-sidebar-border px-3 pt-4">
      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
          {(profileName || "SD").slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-sidebar-foreground/80">
          {profileName || "Minha conta"}
        </span>
        <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sair">
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}
