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
  Layers,
  Palette,
  Megaphone,
  Wand2,
  Wallet,
  FileSignature,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };
export type NavGroup = { key: string; label: string; items: NavItem[]; defaultOpen: boolean };

// Única fonte de verdade para nome + rota de cada destino — usada pela
// sidebar (AppLayout) e pelo ⌘K (CommandPalette). Antes cada um tinha sua
// própria lista, e era fácil um rótulo divergir do outro.
//
// Nível 1: só o que se checa todo dia, incluindo o fluxo mais valioso do
// produto (Fechar um show), que antes não existia em lugar nenhum do menu.
export const NAV_TOP: NavItem[] = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/eventos", label: "Agenda de Shows", icon: CalendarDays },
  { to: "/contrato", label: "Fechar um show", icon: FileSignature },
  { to: "/financeiro", label: "Financeiro & Cachês", icon: Wallet },
];

// Nível 2: agrupado por intenção — um grupo aberto por vez.
export const NAV_GROUPS: NavGroup[] = [
  {
    key: "criar",
    label: "Criar",
    defaultOpen: true,
    items: [
      { to: "/magic-paste", label: "Colar do WhatsApp", icon: Wand2 },
      { to: "/documentos", label: "Contratos e Documentos", icon: FileText },
      { to: "/riders", label: "Rider & Mapa de Palco", icon: Sliders },
      { to: "/gerador-cards", label: "Gerador de Posts", icon: Megaphone },
    ],
  },
  {
    key: "material",
    label: "Meu material",
    defaultOpen: false,
    items: [
      { to: "/repertorio", label: "Repertório", icon: Music4 },
      { to: "/marca", label: "Identidade Visual", icon: Palette },
      { to: "/portfolio", label: "Portfólio & Clipping", icon: Images },
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

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_TOP, ...NAV_GROUPS.flatMap((g) => g.items)];

/** Título de seção para o header — a rota mais específica que "contém" o
 *  pathname atual vence (ex.: /eventos/$eventId cai em "Agenda de Shows"). */
export function pageTitleFor(pathname: string): string {
  const matches = ALL_NAV_ITEMS.filter((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
  if (matches.length === 0) return "StageKit";
  matches.sort((a, b) => b.to.length - a.to.length);
  return matches[0]!.label;
}

export function groupKeyForPathname(pathname: string): string | null {
  const group = NAV_GROUPS.find((g) =>
    g.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)),
  );
  return group?.key ?? null;
}
