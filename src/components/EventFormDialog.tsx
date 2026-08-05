import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { FieldGrid, TextField, TextAreaField } from "@/components/ui-kit";
import { QuickAddClientDialog } from "@/components/QuickAddClientDialog";
import { useList, useInsert, useUpdate } from "@/lib/queries";
import { EVENT_STATUS } from "@/lib/format";
import { DEFAULT_CHECKLIST } from "@/lib/event-defaults";
import type { Tables } from "@/integrations/supabase/types";

const EVENT_TYPES = ["SHOW", "WORKSHOP", "AULA", "GRAVACAO", "EDITAL"];

const empty = {
  title: "",
  event_type: "SHOW",
  status: "NEGOCIACAO",
  event_date: "",
  soundcheck_time: "",
  start_time: "",
  venue: "",
  full_address: "",
  city: "",
  state: "",
  client_id: "",
  formation_id: "",
  fee_total: "",
  fee_deposit: "",
  deposit_due_date: "",
  balance_due_date: "",
  notes: "",
};

type FormValues = typeof empty;

function toFormValues(event: Tables<"events">): FormValues {
  return {
    title: event.title ?? "",
    event_type: event.event_type ?? "SHOW",
    status: event.status ?? "NEGOCIACAO",
    event_date: event.event_date ?? "",
    soundcheck_time: event.soundcheck_time ?? "",
    start_time: event.start_time ?? "",
    venue: event.venue ?? "",
    full_address: event.full_address ?? "",
    city: event.city ?? "",
    state: event.state ?? "",
    client_id: event.client_id ?? "",
    formation_id: event.formation_id ?? "",
    fee_total: event.fee_total != null ? String(event.fee_total) : "",
    fee_deposit: event.fee_deposit != null ? String(event.fee_deposit) : "",
    deposit_due_date: event.deposit_due_date ?? "",
    balance_due_date: event.balance_due_date ?? "",
    notes: event.notes ?? "",
  };
}

function toPayload(form: FormValues) {
  return {
    title: form.title,
    event_type: form.event_type,
    status: form.status,
    event_date: form.event_date || null,
    soundcheck_time: form.soundcheck_time || null,
    start_time: form.start_time || null,
    venue: form.venue || null,
    full_address: form.full_address || null,
    city: form.city || null,
    state: form.state || null,
    client_id: form.client_id || null,
    formation_id: form.formation_id || null,
    fee_total: Number(form.fee_total || 0),
    fee_deposit: Number(form.fee_deposit || 0),
    deposit_due_date: form.deposit_due_date || null,
    balance_due_date: form.balance_due_date || null,
    notes: form.notes || null,
  };
}

/**
 * Formulário único de evento, usado tanto para criar quanto para editar —
 * inclusive direto das listas, sem precisar abrir outra tela. Só na criação
 * é que o checklist padrão e a mala de gig da formação são instanciados.
 */
export function EventFormDialog({
  event,
  trigger,
  onSaved,
}: {
  event?: Tables<"events"> | undefined;
  trigger: ReactNode;
  onSaved?: ((eventId: string) => void) | undefined;
}) {
  const isEdit = Boolean(event);
  const { data: clients = [] } = useList("clients", { order: { column: "name" } });
  const { data: formations = [] } = useList("formations", { order: { column: "name" } });
  const { data: gearItems = [] } = useList("gear_checklist_items", {
    order: { column: "position" },
  });
  const insertEvent = useInsert("events", "Evento criado");
  const updateEvent = useUpdate("events", "Evento atualizado");
  const insertTask = useInsert("event_checklists", "");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(event ? toFormValues(event) : empty);
  const set = (k: keyof FormValues) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Ao reabrir, parte sempre dos dados atuais do evento (que podem ter mudado
  // em outro lugar, ex.: status alterado no dossiê).
  useEffect(() => {
    if (open) setForm(event ? toFormValues(event) : empty);
  }, [open, event]);

  function selectFormation(formationId: string) {
    const formation = formations.find((f) => f.id === formationId);
    setForm((f) => ({
      ...f,
      formation_id: formationId,
      fee_total: f.fee_total || (formation ? String(formation.base_fee) : f.fee_total),
    }));
  }

  function save() {
    if (isEdit && event) {
      updateEvent.mutate(
        { id: event.id, values: toPayload(form) },
        {
          onSuccess: () => {
            setOpen(false);
            onSaved?.(event.id);
          },
        },
      );
      return;
    }

    const formationGear = gearItems.filter((g) => g.formation_id === form.formation_id);
    insertEvent.mutate(toPayload(form), {
      onSuccess: (created) => {
        DEFAULT_CHECKLIST.forEach((task, index) =>
          insertTask.mutate({
            event_id: created.id,
            label: task.label,
            phase: task.phase,
            position: index,
          }),
        );
        formationGear.forEach((gear, index) =>
          insertTask.mutate({
            event_id: created.id,
            label: gear.label,
            phase: "EQUIPAMENTO",
            position: index,
          }),
        );
        setForm(empty);
        setOpen(false);
        onSaved?.(created.id);
      },
    });
  }

  const pending = insertEvent.isPending || updateEvent.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar evento" : "Novo evento"}</DialogTitle>
        </DialogHeader>
        <FieldGrid>
          <TextField label="Título" value={form.title} onChange={set("title")} />
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.event_type} onValueChange={set("event_type")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={set("status")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_STATUS).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Contratante</Label>
              <QuickAddClientDialog onCreated={set("client_id")} />
            </div>
            <Select value={form.client_id} onValueChange={set("client_id")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Formação</Label>
            <Select value={form.formation_id} onValueChange={selectFormation}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {formations.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TextField
            label="Data"
            value={form.event_date}
            onChange={set("event_date")}
            type="date"
          />
          <TextField label="Local / Casa" value={form.venue} onChange={set("venue")} />
          <TextField
            label="Passagem de som"
            value={form.soundcheck_time}
            onChange={set("soundcheck_time")}
            type="time"
          />
          <TextField
            label="Início do show"
            value={form.start_time}
            onChange={set("start_time")}
            type="time"
          />
          <TextField label="Cidade" value={form.city} onChange={set("city")} />
          <TextField label="UF" value={form.state} onChange={set("state")} />
          <div className="sm:col-span-2">
            <TextField
              label="Endereço completo"
              value={form.full_address}
              onChange={set("full_address")}
              placeholder="Rua, número, bairro — usado para abrir a rota no mapa"
            />
          </div>
          <TextField
            label="Cachê total (R$)"
            value={form.fee_total}
            onChange={set("fee_total")}
            type="number"
          />
          <TextField
            label="Sinal (R$)"
            value={form.fee_deposit}
            onChange={set("fee_deposit")}
            type="number"
          />
          <TextField
            label="Vencimento do sinal"
            value={form.deposit_due_date}
            onChange={set("deposit_due_date")}
            type="date"
          />
          <TextField
            label="Vencimento do saldo"
            value={form.balance_due_date}
            onChange={set("balance_due_date")}
            type="date"
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Observações"
              value={form.notes}
              onChange={set("notes")}
              rows={3}
            />
          </div>
        </FieldGrid>
        <DialogFooter>
          <Button disabled={!form.title || pending} onClick={save}>
            {isEdit ? "Salvar alterações" : "Criar evento com checklist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
