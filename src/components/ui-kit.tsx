import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  tone = "violet",
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  icon?: ReactNode | undefined;
  tone?: "violet" | "cyan" | "amber" | "lime" | "muted" | undefined;
}) {
  const tones: Record<string, string> = {
    violet: "text-primary bg-primary/10 border-primary/20",
    // Usava text-accent, que é um violeta escuro — o cartão "ciano" saía
    // roxo e com contraste baixo. Agora aponta para a variável --cyan.
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

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode | undefined;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
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
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string | undefined;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  type?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
      />
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
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
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
