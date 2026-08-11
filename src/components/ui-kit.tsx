import { forwardRef, useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, RefreshCw, Save, Undo2, MoreVertical, Pencil, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; tone: string }> }) {
  const meta = map[status] ?? { label: status, tone: "bg-muted/50 text-muted-foreground border-border" };
  return <Badge variant="outline" className={meta.tone}>{meta.label}</Badge>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  icon?: ReactNode | undefined;
  /** `brand` segue a cor primária do tema; os demais são acentos fixos. */
  tone?: "brand" | "cyan" | "amber" | "lime" | "muted" | undefined;
}) {
  const tones: Record<string, string> = {
    brand: "text-primary bg-primary/10 border-primary/20",
    // Usava text-accent, que é escuro e de baixo croma — o cartão "ciano" saía
    // com a cor da marca e contraste baixo. Agora aponta para a variável --cyan.
    cyan: "text-cyan bg-cyan/10 border-cyan/20",
    amber: "text-warning bg-warning/10 border-warning/20",
    lime: "text-lime bg-lime/10 border-lime/20",
    muted: "text-muted-foreground bg-muted/40 border-border",
  };
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border",
              tones[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export const EmptyState = forwardRef<
  HTMLDivElement,
  {
    icon?: ReactNode | undefined;
    title: string;
    description?: string | undefined;
    action?: ReactNode;
    /** Quando informado, o painel inteiro vira alvo de clique (e de Enter/Espaço
     * pelo teclado) para criar o primeiro item — não só o botão de ação, que
     * costuma ser pequeno e passar despercebido num estado vazio. Também aceita
     * ser passado como `trigger` de um DialogTrigger asChild: o Radix injeta
     * onClick/ref por cima, sem precisar de nenhuma prop extra aqui. */
    onClick?: (() => void) | undefined;
  }
>(function EmptyState({ icon, title, description, action, onClick }, ref) {
  const interactive = Boolean(onClick);
  return (
    <div
      ref={ref}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "panel flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        interactive &&
          "cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {icon ? (
        <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          {icon}
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
});

/** Largura padrão de página. "narrow" só para fluxos guiados de coluna única. */
export function PageContainer({
  children,
  width = "default",
  className,
}: {
  children: ReactNode;
  width?: "default" | "narrow" | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("mx-auto", width === "narrow" ? "max-w-3xl" : "max-w-6xl", className)}>
      {children}
    </div>
  );
}

function SkeletonRows({ variant }: { variant: "list" | "cards" }) {
  if (variant === "cards") {
    return (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-36 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </ul>
    );
  }
  return (
    <ul className="divide-y divide-border" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center justify-between gap-3 py-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted/60" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted/40" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded bg-muted/40" />
        </li>
      ))}
    </ul>
  );
}

type ListQuery<T> = {
  data?: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
};

/**
 * Decide entre carregando / erro / vazio / conteúdo a partir do resultado de
 * useList. Sem isto, o padrão `const { data = [] }` faz a tela anunciar
 * "nenhum item cadastrado" enquanto o fetch ainda está em voo, e uma falha de
 * rede fica indistinguível de uma conta vazia.
 */
export function ListState<T>({
  query,
  empty,
  skeleton = "list",
  errorTitle = "Não foi possível carregar",
  errorDescription = "Isso não é uma lista vazia — houve uma falha ao buscar seus dados.",
  children,
}: {
  query: ListQuery<T>;
  empty: ReactNode;
  skeleton?: "list" | "cards" | undefined;
  errorTitle?: string | undefined;
  errorDescription?: string | undefined;
  children: (items: T[]) => ReactNode;
}) {
  if (query.isLoading) return <SkeletonRows variant={skeleton} />;

  if (query.isError) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-5" />}
        title={errorTitle}
        description={errorDescription}
        action={
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            <RefreshCw className="mr-1 size-4" /> Tentar de novo
          </Button>
        }
      />
    );
  }

  const items = query.data ?? [];
  if (items.length === 0) return <>{empty}</>;
  return <>{children(items)}</>;
}

/**
 * Exclusão sempre passa por confirmação. A descrição deve dizer o efeito real
 * (o que vai junto em cascata), não um "tem certeza?" genérico.
 */
export function ConfirmDelete({
  title,
  description,
  confirmLabel = "Remover",
  onConfirm,
  trigger,
}: {
  title: string;
  description: ReactNode;
  confirmLabel?: string | undefined;
  onConfirm: () => void;
  trigger: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
}: {
  title?: string | undefined;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  // Para seções secundárias em páginas longas (histórico, config avançada):
  // renderizadas fechadas por padrão, reduz rolagem sem esconder a função.
  collapsible?: boolean | undefined;
  defaultOpen?: boolean | undefined;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <section className={cn("panel p-5", className)}>
        {title || actions ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              {title ? (
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions}
          </div>
        ) : null}
        {children}
      </section>
    );
  }

  return (
    <section className={cn("panel p-5", className)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CollapsibleTrigger className="flex items-center gap-2 text-left">
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
            <div>
              {title ? (
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </CollapsibleTrigger>
          {actions}
        </div>
        <CollapsibleContent className="mt-4">{children}</CollapsibleContent>
      </Collapsible>
    </section>
  );
}

export function FieldGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  type?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        aria-invalid={Boolean(error)}
        className={error ? "border-destructive focus-visible:ring-destructive" : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

/**
 * Seleção de hora em dois dropdowns, no lugar de <input type="time">.
 * O picker nativo do sistema pode abrir com o botão de confirmar fora da
 * área visível em alguns aparelhos — aqui o controle é do próprio app, e
 * o passo de 5 minutos elimina digitação para os horários usuais de show.
 */
export function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [h = "", m = ""] = (value || "").split(":");
  // Um horário salvo fora do passo de 5 min (ex.: 20:37, vindo do parser do
  // WhatsApp) continua selecionável em vez de sumir da lista.
  const minuteOptions = m && !MINUTES.includes(m) ? [...MINUTES, m].sort() : MINUTES;

  function emit(hour: string, minute: string) {
    if (!hour && !minute) return onChange("");
    onChange(`${hour || "00"}:${minute || "00"}`);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Select value={h} onValueChange={(v) => emit(v, m)}>
          <SelectTrigger aria-label={`${label} — hora`}>
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {HOURS.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select value={m} onValueChange={(v) => emit(h, v)}>
          <SelectTrigger aria-label={`${label} — minuto`}>
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {minuteOptions.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  rows?: number | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
      />
    </div>
  );
}

/** Menu ⋮ unificado para ações de item: Editar, Duplicar, extras e Excluir com confirmação.
 *  O dialog de edição deve ser controlado externamente (estado `editingId` no pai) para
 *  evitar conflito entre DropdownMenu e Dialog no Radix. */
export function ItemActions({
  onEdit,
  onDuplicate,
  onDelete,
  deleteConfirm,
  extra = [],
}: {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  deleteConfirm?: { title: string; description: ReactNode; confirmLabel?: string };
  extra?: Array<{ label: string; icon?: ReactNode; onClick: () => void }>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasTop = onEdit || onDuplicate || extra.length > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 shrink-0">
            <MoreVertical className="size-4" />
            <span className="sr-only">Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 size-4" /> Editar
            </DropdownMenuItem>
          )}
          {onDuplicate && (
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 size-4" /> Duplicar
            </DropdownMenuItem>
          )}
          {extra.map((item) => (
            <DropdownMenuItem key={item.label} onClick={item.onClick}>
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </DropdownMenuItem>
          ))}
          {hasTop && onDelete && <DropdownMenuSeparator />}
          {onDelete && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => (deleteConfirm ? setConfirmOpen(true) : onDelete())}
            >
              <Trash2 className="mr-2 size-4" /> Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {deleteConfirm && onDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{deleteConfirm.title}</AlertDialogTitle>
              <AlertDialogDescription>{deleteConfirm.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={() => { onDelete(); setConfirmOpen(false); }}
              >
                {deleteConfirm.confirmLabel ?? "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

/** Barra de progresso de cadastro de módulo — mostra quantas checagens estão concluídas. */
export function ModuleHealth({ checks }: { checks: { label: string; done: boolean }[] }) {
  const done = checks.filter((c) => c.done).length;
  const pct = checks.length === 0 ? 0 : Math.round((done / checks.length) * 100);
  const missing = checks.filter((c) => !c.done);
  if (checks.length === 0) return null;
  return (
    <div className="mb-5 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{pct}% concluído</span>
        {missing.length > 0 && (
          <span className="text-muted-foreground">falta: {missing.map((c) => c.label).join(", ")}</span>
        )}
      </div>
      <Progress value={pct} />
    </div>
  );
}

/** Barra de ação fixa no rodapé — aparece só quando há alterações pendentes.
 *  Posicionar dentro de um elemento `relative` ou no fim de `PageContainer`. */
export function StickyActionBar({
  visible,
  onSave,
  onDiscard,
  saving = false,
}: {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 mt-6 flex items-center justify-between gap-3 rounded-t-lg border border-b-0 border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-200",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <span className="text-sm text-muted-foreground">Você tem alterações não salvas.</span>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
          <Undo2 className="mr-1.5 size-3.5" /> Descartar
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          <Save className="mr-1.5 size-3.5" />
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
