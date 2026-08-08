import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Images,
  Plus,
  Trash2,
  ExternalLink,
  Pencil,
  Wand2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchLinkMeta } from "@/lib/oembed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  PageHeader,
  PageContainer,
  Section,
  EmptyState,
  FieldGrid,
  TextField,
  TextAreaField,
  ConfirmDelete,
  ListState,
} from "@/components/ui-kit";
import { useList, useInsert, useUpdate, useRemove } from "@/lib/queries";
import type { Tables } from "@/integrations/supabase/types";
import { dateBR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfólio e clipping — currículo artístico para editais" },
      {
        name: "description",
        content:
          "Organize matérias, releases, prêmios e registros de shows por ano para anexar em editais de fomento.",
      },
      { property: "og:title", content: "Portfólio e clipping — StageKit" },
      {
        property: "og:description",
        content: "Seu histórico artístico documentado e pronto para comprovação.",
      },
    ],
  }),
  component: PortfolioPage,
});

const CATEGORIES = ["MATERIA", "RELEASE", "PREMIO", "SHOW", "MIDIA_SOCIAL", "OUTRO"];
const empty = {
  title: "",
  category: "MATERIA",
  event_name: "",
  happened_at: "",
  link_url: "",
  description: "",
};

function PortfolioPage() {
  const itemsQuery = useList("portfolio_clippings", {
    order: { column: "happened_at", ascending: false },
  });
  const items = itemsQuery.data ?? [];
  const remove = useRemove("portfolio_clippings", "Registro removido");

  return (
    <PageContainer>
      <PageHeader
        title="Portfólio & Clipping"
        subtitle="Comprovação de trajetória: matérias, prêmios, releases e registros de apresentações."
        actions={
          <ClippingFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Adicionar
              </Button>
            }
          />
        }
      />

      <Section title={itemsQuery.isLoading ? "Registros" : `Registros (${items.length})`}>
        <ListState
          query={itemsQuery}
          skeleton="cards"
          empty={
            <EmptyState
              icon={<Images className="size-5" />}
              title="Portfólio vazio"
              description="Comece registrando matérias e shows importantes da sua trajetória."
            />
          }
        >
          {(list) => (
            <ul className="grid gap-4 sm:grid-cols-2">
              {list.map((item) => (
                <li key={item.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Badge variant="outline">{item.category}</Badge>
                      <p className="mt-2 font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {[item.event_name, item.happened_at ? dateBR(item.happened_at) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <ClippingFormDialog
                        item={item}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Editar ${item.title}`}>
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <ConfirmDelete
                        title={`Remover "${item.title}"?`}
                        description="Este registro sai do portfólio e dos anexos de comprovação para editais. Essa ação não pode ser desfeita."
                        confirmLabel="Remover registro"
                        onConfirm={() => remove.mutate(item.id)}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Remover ${item.title}`}>
                            <Trash2 className="size-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                  {item.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                  {item.link_url ? (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Abrir link <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </ListState>
      </Section>
    </PageContainer>
  );
}

/** Formulário único de registro de portfólio — cria um novo ou edita um existente. */
function ClippingFormDialog({
  item,
  trigger,
}: {
  item?: Tables<"portfolio_clippings"> | undefined;
  trigger: ReactNode;
}) {
  const isEdit = Boolean(item);
  const insert = useInsert("portfolio_clippings", "Registro adicionado");
  const update = useUpdate("portfolio_clippings", "Registro atualizado");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [fetching, setFetching] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function fetchFromLink() {
    if (!form.link_url.trim()) return;
    setFetching(true);
    try {
      const meta = await fetchLinkMeta(form.link_url);
      if (!meta) {
        toast.error("Não consegui ler esse link. Preencha os campos manualmente.");
        return;
      }
      setForm((f) => ({
        ...f,
        title: meta.title || f.title,
        event_name: f.event_name || meta.author || "",
        happened_at: f.happened_at || meta.date || "",
      }));
      if (meta.thumbnail) setMediaUrl(meta.thumbnail);
      toast.success("Dados preenchidos a partir do link.");
    } finally {
      setFetching(false);
    }
  }


  useEffect(() => {
    if (!open) return;
    setForm(
      item
        ? {
            title: item.title ?? "",
            category: item.category ?? "MATERIA",
            event_name: item.event_name ?? "",
            happened_at: item.happened_at ?? "",
            link_url: item.link_url ?? "",
            description: item.description ?? "",
          }
        : empty,
    );
  }, [open, item]);

  function save() {
    const values = {
      title: form.title,
      category: form.category,
      event_name: form.event_name || null,
      happened_at: form.happened_at || null,
      year: form.happened_at ? Number(form.happened_at.slice(0, 4)) : null,
      link_url: form.link_url || null,
      description: form.description || null,
    };
    if (isEdit && item) {
      update.mutate({ id: item.id, values }, { onSuccess: () => setOpen(false) });
      return;
    }
    insert.mutate(values, {
      onSuccess: () => {
        setForm(empty);
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar registro" : "Novo registro"}</DialogTitle>
        </DialogHeader>
        <FieldGrid>
          <div className="space-y-2 sm:col-span-2">
            <Label>Link (matéria, YouTube, Instagram...)</Label>
            <div className="flex flex-wrap gap-2">
              <input
                className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                value={form.link_url}
                onChange={(e) => set("link_url")(e.target.value)}
                placeholder="https://"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!form.link_url.trim() || fetching}
                onClick={fetchFromLink}
              >
                {fetching ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <Wand2 className="mr-1 size-3.5" />
                )}
                Preencher pelo link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole o link primeiro: título, veículo e data são preenchidos automaticamente quando o
              site permite.
            </p>
          </div>
          <TextField label="Título" value={form.title} onChange={set("title")} />
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={set("category")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TextField
            label="Evento / veículo"
            value={form.event_name}
            onChange={set("event_name")}
          />
          <TextField
            label="Data"
            value={form.happened_at}
            onChange={set("happened_at")}
            type="date"
          />

          <div className="sm:col-span-2">
            <TextAreaField
              label="Descrição"
              value={form.description}
              onChange={set("description")}
            />
          </div>
        </FieldGrid>
        <DialogFooter>
          <Button disabled={!form.title || insert.isPending || update.isPending} onClick={save}>
            {isEdit ? "Salvar alterações" : "Adicionar ao portfólio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
