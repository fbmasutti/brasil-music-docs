import { useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/eventos", label: "Shows & Eventos", icon: CalendarDays },
  { to: "/documentos", label: "Central de Documentos", icon: FileText },
  { to: "/elenco", label: "Elenco & Contratantes", icon: Users },
  { to: "/repertorio", label: "Repertório & ECAD", icon: Music4 },
  { to: "/riders", label: "Riders Técnicos", icon: Sliders },
  { to: "/portfolio", label: "Portfólio & Clipping", icon: Images },
  { to: "/perfil", label: "Cofre da Entidade", icon: Settings },
] as const;

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

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
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
      })}
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
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fechar menu">
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
              {profile?.stage_name || "StageDocs"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.entity_type === "PJ" ? "Pessoa Jurídica (MEI/LTDA)" : "Pessoa Física / MEI"} ·{" "}
              {profile?.city || "cidade não informada"}
            </p>
          </div>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/documentos">Gerar documento</Link>
          </Button>
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
        <p className="text-sm font-extrabold tracking-tight text-sidebar-foreground">StageDocs</p>
        <p className="text-[11px] text-sidebar-foreground/60">Hub Músico Brasil</p>
      </div>
    </div>
  );
}

function UserBox({ profileName, onSignOut }: { profileName?: string | undefined; onSignOut: () => void }) {
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
