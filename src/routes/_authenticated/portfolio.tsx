import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Images, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Section, EmptyState, FieldGrid, TextField, TextAreaField } from "@/components/ui-kit";
import { useList, useInsert, useRemove } from "@/lib/queries";
import { dateBR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfólio e clipping — currículo artístico para editais" },
      {
        name: "description",
        content: "Organize matérias, releases, prêmios e registros de shows por ano para anexar em editais de fomento.",
      },
      { property: "og:title", content: "Portfólio e clipping — StageDocs" },
      { property: "og:description", content: "Seu histórico artístico documentado e pronto para comprovação." },
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
  const { data: items = [] } = useList("portfolio_clippings", {
    order: { column: "happened_at", ascending: false },
  });
  const insert = useInsert("portfolio_clippings", "Registro adicionado");
  const remove = useRemove("portfolio_clippings", "Registro removido");
  const [form, setForm] = useState(empty);
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Portfólio & Clipping"
        subtitle="Comprovação de trajetória: matérias, prêmios, releases e registros de apresentações."
      />

      <Section title="Novo registro" className="mb-5">
        <FieldGrid>
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
          <TextField label="Evento / veículo" value={form.event_name} onChange={set("event_name")} />
          <TextField label="Data" value={form.happened_at} onChange={set("happened_at")} type="date" />
          <div className="sm:col-span-2">
            <TextField label="Link" value={form.link_url} onChange={set("link_url")} placeholder="https://" />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField label="Descrição" value={form.description} onChange={set("description")} />
          </div>
        </FieldGrid>
        <Button
          className="mt-4"
          disabled={!form.title || insert.isPending}
          onClick={() =>
            insert.mutate(
              {
                title: form.title,
                category: form.category,
                event_name: form.event_name || null,
                happened_at: form.happened_at || null,
                year: form.happened_at ? Number(form.happened_at.slice(0, 4)) : null,
                link_url: form.link_url || null,
                description: form.description || null,
              },
              { onSuccess: () => setForm(empty) },
            )
          }
        >
          <Plus className="mr-1 size-4" /> Adicionar ao portfólio
        </Button>
      </Section>

      <Section title={`Registros (${items.length})`}>
        {items.length === 0 ? (
          <EmptyState
            icon={<Images className="size-5" />}
            title="Portfólio vazio"
            description="Comece registrando matérias e shows importantes da sua trajetória."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline">{item.category}</Badge>
                    <p className="mt-2 font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[item.event_name, item.happened_at ? dateBR(item.happened_at) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(item.id)} aria-label="Remover">
                    <Trash2 className="size-4" />
                  </Button>
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
      </Section>
    </div>
  );
}
