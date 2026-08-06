import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  CalendarDays,
  Music4,
  Sliders,
  Images,
  Settings,
  LogOut,
  Menu,
  Radio,
  Layers,
  Palette,
  Megaphone,
  Wand2,
  Wallet,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: LucideIcon };
type NavGroup = { key: string; label: string; items: NavItem[]; defaultOpen: boolean };

// Nível 1: o que se usa no dia a dia de show. Sempre visível.
const NAV_TOP: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/magic-paste", label: "Importar do WhatsApp", icon: Wand2 },
  { to: "/eventos", label: "Agenda de Shows", icon: CalendarDays },
  { to: "/financeiro", label: "Financeiro & Cachês", icon: Wallet },
];

// Nível 2: agrupado por intenção, para o menu não virar uma lista de 13 itens.
const NAV_GROUPS: NavGroup[] = [
  {
    key: "docs",
    label: "Documentos",
    defaultOpen: true,
    items: [
      { to: "/documentos", label: "Contratos & Recibos", icon: FileText },
      { to: "/riders", label: "Rider & Mapa de Palco", icon: Sliders },
      { to: "/repertorio", label: "ECAD & Direitos Autorais", icon: Music4 },
    ],
  },
  {
    key: "divulgacao",
    label: "Divulgação",
    defaultOpen: false,
    items: [
      { to: "/gerador-cards", label: "Gerador de Posts", icon: Megaphone },
      { to: "/marca", label: "Identidade Visual", icon: Palette },
      { to: "/portfolio", label: "Comprovação & Portfólio", icon: Images },
    ],
  },
  {
    key: "cadastros",
    label: "Cadastros",
    defaultOpen: false,
    items: [
      { to: "/formacoes", label: "Formações", icon: Layers },
      { to: "/equipe", label: "Equipe", icon: Users },
      { to: "/contratantes", label: "Contratantes", icon: Building2 },
      { to: "/perfil", label: "Dados do Artista", icon: Settings },
    ],
  },
];

const NAV_STORAGE_PREFIX = "stagekit:nav-group:";

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      {NAV_TOP.map(renderNavItem)}
      {NAV_GROUPS.map((group) => (
        <NavGroupBlock
          key={group.key}
          group={group}
          hasActive={group.items.some((item) => isItemActive(item.to))}
          renderItem={renderNavItem}
        />
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-5 lg:flex">
        <Brand />
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
                <Brand compact />
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
              {profile?.stage_name || "StageKit"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.entity_type === "PJ" ? "Pessoa Jurídica (MEI/LTDA)" : "Pessoa Física / MEI"}{" "}
              · {profile?.city || "cidade não informada"}
            </p>
          </div>
          {pathname !== "/dashboard" ? (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/dashboard">
                <LayoutDashboard className="mr-1 size-4" /> Painel
              </Link>
            </Button>
          ) : null}
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavGroupBlock({
  group,
  hasActive,
  renderItem,
}: {
  group: NavGroup;
  hasActive: boolean;
  renderItem: (item: NavItem) => React.ReactNode;
}) {
  const storageKey = `${NAV_STORAGE_PREFIX}${group.key}`;
  const [open, setOpen] = useState(() => {
    const stored = typeof localStorage === "undefined" ? null : localStorage.getItem(storageKey);
    if (stored === "1") return true;
    if (stored === "0") return false;
    return group.defaultOpen;
  });

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  useEffect(() => {
    localStorage.setItem(storageKey, open ? "1" : "0");
  }, [open, storageKey]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground/80">
        <span>{group.label}</span>
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1 pt-1">
        {group.items.map(renderItem)}
      </CollapsibleContent>
    </Collapsible>
  );
}

function Brand({ compact }: { compact?: boolean | undefined }) {
  return (
    <div className={cn("flex items-center gap-2.5", compact ? "" : "px-5 pb-6")}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-violet">
        <Radio className="size-4.5" />
      </span>
      <div>
        <p className="text-sm font-extrabold tracking-tight text-sidebar-foreground">StageKit</p>
        <p className="text-[11px] text-sidebar-foreground/60">Toolkit do artista</p>
      </div>
    </div>
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
