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
  X,
  Radio,
  Layers,
  Palette,
  Megaphone,
  Wand2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: LucideIcon };

// Modo Diário: o que se usa no dia a dia de show. Fica sempre visível.
const NAV_DAILY: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/magic-paste", label: "Colar do WhatsApp", icon: Wand2 },
  { to: "/eventos", label: "Shows & Agenda", icon: CalendarDays },
  { to: "/documentos", label: "Gerador Rápido", icon: FileText },
  { to: "/gerador-cards", label: "Gerador de Posts", icon: Megaphone },
];

// Ferramentas Avançadas: cadastros e burocracia — configurados de vez em
// quando, não todo dia. Ficam recolhidos por padrão.
const NAV_PRO: NavItem[] = [
  { to: "/formacoes", label: "Formações", icon: Layers },
  { to: "/equipe", label: "Equipe", icon: Users },
  { to: "/contratantes", label: "Contratantes", icon: Building2 },
  { to: "/marca", label: "Marca & Brand Kit", icon: Palette },
  { to: "/riders", label: "Rider & Mapa de Palco", icon: Sliders },
  { to: "/repertorio", label: "Minhas Músicas & ECAD", icon: Music4 },
  { to: "/portfolio", label: "Comprovação & Portfólio", icon: Images },
  { to: "/perfil", label: "Dados do Artista / Proponente", icon: Settings },
];

const PRO_NAV_STORAGE_KEY = "stagekit:nav-pro-open";

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isProActive = NAV_PRO.some(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  const [proOpen, setProOpen] = useState(() => localStorage.getItem(PRO_NAV_STORAGE_KEY) === "1");

  useEffect(() => {
    if (isProActive) setProOpen(true);
  }, [isProActive]);

  useEffect(() => {
    localStorage.setItem(PRO_NAV_STORAGE_KEY, proOpen ? "1" : "0");
  }, [proOpen]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function renderNavItem(item: NavItem) {
    const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
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
      {NAV_DAILY.map(renderNavItem)}

      <Collapsible open={proOpen} onOpenChange={setProOpen} className="mt-3">
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground/80">
          <span>Ferramentas Avançadas</span>
          <ChevronDown className={cn("size-3.5 transition-transform", proOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-1 pt-1">
          {NAV_PRO.map(renderNavItem)}
        </CollapsibleContent>
      </Collapsible>
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-5 lg:flex">
        <Brand />
        {nav}
        <UserBox profileName={profile?.stage_name} onSignOut={handleSignOut} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative flex w-72 flex-col border-r border-sidebar-border bg-sidebar py-5">
            <div className="flex items-center justify-between px-5">
              <Brand compact />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-1 flex-col">{nav}</div>
            <UserBox profileName={profile?.stage_name} onSignOut={handleSignOut} />
          </aside>
        </div>
      ) : null}

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
