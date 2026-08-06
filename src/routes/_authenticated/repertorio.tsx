import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Music4, Plus, Trash2, Download, Users, Pencil } from "lucide-react";
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
  ConfirmDelete,
  ListState,
} from "@/components/ui-kit";
import { useList, useInsert, useUpdate, useRemove, useProfile } from "@/lib/queries";
import type { Tables } from "@/integrations/supabase/types";
import { duration, parseDuration, ECAD_ASSOCIATIONS, dateBR } from "@/lib/format";
import { downloadPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/repertorio")({
  head: () => ({
    meta: [
      { title: "ECAD & Direitos Autorais — obras, ISRC e split de autoria" },
      {
        name: "description",
        content:
          "Cadastre obras com ISRC, ISWC e divisão de autoria e gere relatórios de execução pública para o ECAD.",
      },
      { property: "og:title", content: "ECAD & Direitos Autorais — StageKit" },
      {
        property: "og:description",
        content: "Obras, autores e relatórios de execução pública organizados.",
      },
    ],
  }),
  component: RepertoirePage,
});

const emptySong = {
  title: "",
  genre: "",
  duration_input: "",
  isrc: "",
  iswc: "",
  publisher: "",
  producer: "",
  studio: "",
  performers: "",
};

const emptyWriter = { name: "", role: "", share_percent: "", cae_ipi: "", association: "" };

function RepertoirePage() {
  const { data: profile } = useProfile();
  const songsQuery = useList("songs", { order: { column: "title" } });
  const songs = songsQuery.data ?? [];
  const { data: writers = [] } = useList("song_writers");
  const { data: events = [] } = useList("events", {
    order: { column: "event_date", ascending: false },
  });
  const insertSong = useInsert("songs", "Obra cadastrada");
  const insertWriter = useInsert("song_writers", "Autor adicionado");
  const updateWriter = useUpdate("song_writers", "Autor atualizado");
  const removeSong = useRemove("songs", "Obra removida");
  const removeWriter = useRemove("song_writers", "Autor removido");

  const [open, setOpen] = useState(false);
  const [song, setSong] = useState(emptySong);
  const [writerFor, setWriterFor] = useState<string | null>(null);
  // id do autor sendo editado; null = o formulário está criando um novo
  const [editingWriterId, setEditingWriterId] = useState<string | null>(null);
  const [writer, setWriter] = useState(emptyWriter);
  const [ecadEventId, setEcadEventId] = useState("");

  const setSongField = (k: keyof typeof emptySong) => (v: string) =>
    setSong((s) => ({ ...s, [k]: v }));
  const setWriterField = (k: keyof typeof emptyWriter) => (v: string) =>
    setWriter((w) => ({ ...w, [k]: v }));

  function exportEcadReport() {
    const event = events.find((e) => e.id === ecadEventId);
    downloadPdf(
      {
        title: "Relatório de execução pública (ECAD)",
        brand: profile?.stage_name ?? "StageKit",
        subtitle: `Associação: ${profile?.ecad_association ?? "não informada"} · CAE/IPI: ${profile?.cae_ipi ?? "—"}`,
        footer: `${profile?.stage_name ?? "StageKit"} · relatório de execução pública`,
        blocks: [
          {
            type: "kv",
            rows: [
              ["Titular", profile?.stage_name ?? "—"],
              ["Documento", profile?.cpf_cnpj ?? "—"],
              ["Nº de cliente ECAD", profile?.ecad_client_number ?? "—"],
              ["Evento", event ? event.title : "Todos os eventos"],
              ["Data", event ? dateBR(event.event_date) : "—"],
              ["Local", event ? [event.venue, event.city].filter(Boolean).join(", ") : "—"],
            ],
          },
          { type: "heading", text: "Obras executadas" },
          {
            type: "table",
            head: ["Obra", "Duração", "ISWC", "Autores (%)"],
            widths: [3, 1, 1.6, 3.4],
            rows: songs.map((s) => [
              s.title,
              duration(s.duration_seconds),
              s.iswc ?? "—",
              writers
                .filter((w) => w.song_id === s.id)
                .map((w) => `${w.name} ${w.share_percent}%`)
                .join("; ") || "—",
            ]),
          },
          {
            type: "note",
            text: "Declaro que as obras acima foram executadas publicamente na apresentação indicada, para fins de distribuição de direitos autorais pelo ECAD.",
          },
          { type: "signatures", names: [profile?.legal_name ?? profile?.stage_name ?? "Titular"] },
        ],
      },
      "relatorio-ecad",
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="ECAD & Direitos Autorais"
        subtitle="Obras com metadados completos, split de autoria e relatórios de execução pública prontos para a associação."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportEcadReport} disabled={!songs.length}>
              <Download className="mr-1 size-4" /> Relatório ECAD
            </Button>
            <SongFormDialog
              trigger={
                <Button size="sm">
                  <Plus className="mr-1 size-4" /> Nova obra
                </Button>
              }
            />
          </>
        }
      />

      <Section
        title="Relatório por evento"
        description="Escolha um evento para identificar o relatório de execução pública."
        className="mb-5"
      >
        <div className="max-w-sm space-y-2">
          <Label>Evento</Label>
          <Select value={ecadEventId} onValueChange={setEcadEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os eventos" />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title} — {dateBR(e.event_date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section title={songsQuery.isLoading ? "Obras" : `Obras (${songs.length})`}>
        <ListState
          query={songsQuery}
          empty={
            <EmptyState
              icon={<Music4 className="size-5" />}
              title="Nenhuma obra cadastrada"
              description="Cadastre suas composições com ISRC, ISWC e divisão de autoria."
            />
          }
        >
          {(songList) => (
            <ul className="space-y-4">
              {songList.map((s) => {
                const list = writers.filter((w) => w.song_id === s.id);
                const total = list.reduce((sum, w) => sum + Number(w.share_percent), 0);
                return (
                  <li key={s.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            s.genre,
                            duration(s.duration_seconds),
                            s.isrc && `ISRC ${s.isrc}`,
                            s.iswc && `ISWC ${s.iswc}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={total === 100 ? "text-success" : "text-warning"}
                        >
                          Split {total}%
                        </Badge>
                        <SongFormDialog
                          song={s}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Editar ${s.title}`}>
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDelete
                          title={`Remover "${s.title}"?`}
                          description={
                            list.length
                              ? `${list.length} autor(es) e o split de autoria desta obra serão apagados junto. Essa ação não pode ser desfeita.`
                              : "A obra será apagada. Essa ação não pode ser desfeita."
                          }
                          confirmLabel="Remover obra"
                          onConfirm={() => removeSong.mutate(s.id)}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Remover ${s.title}`}>
                              <Trash2 className="size-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>

                    <ul className="mt-3 space-y-1.5">
                      {list.map((w) => (
                        <li key={w.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {w.name} — {w.role || "autor"} · {w.share_percent}%
                            {w.association ? ` · ${w.association}` : ""}
                            {w.cae_ipi ? ` · CAE ${w.cae_ipi}` : ""}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Editar autor ${w.name}`}
                              onClick={() => {
                                setWriterFor(s.id);
                                setEditingWriterId(w.id);
                                setWriter({
                                  name: w.name ?? "",
                                  role: w.role ?? "",
                                  share_percent: String(w.share_percent ?? ""),
                                  cae_ipi: w.cae_ipi ?? "",
                                  association: w.association ?? "",
                                });
                              }}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <ConfirmDelete
                              title={`Remover ${w.name} da autoria?`}
                              description={`O split de ${w.share_percent}% volta a ficar sem dono. Essa ação não pode ser desfeita.`}
                              confirmLabel="Remover autor"
                              onConfirm={() => removeWriter.mutate(w.id)}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Remover autor ${w.name}`}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              }
                            />
                          </div>
                        </li>
                      ))}
                    </ul>

                    {writerFor === s.id ? (
                      <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                        <FieldGrid>
                          <TextField
                            label="Autor"
                            value={writer.name}
                            onChange={setWriterField("name")}
                          />
                          <TextField
                            label="Função"
                            value={writer.role}
                            onChange={setWriterField("role")}
                            placeholder="Letra e música"
                          />
                          <TextField
                            label="Percentual (%)"
                            value={writer.share_percent}
                            onChange={setWriterField("share_percent")}
                          />
                          <TextField
                            label="CAE/IPI"
                            value={writer.cae_ipi}
                            onChange={setWriterField("cae_ipi")}
                          />
                          <div className="space-y-2">
                            <Label>Associação</Label>
                            <Select
                              value={writer.association}
                              onValueChange={setWriterField("association")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {ECAD_ASSOCIATIONS.map((a) => (
                                  <SelectItem key={a} value={a}>
                                    {a}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </FieldGrid>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={!writer.name}
                            onClick={() => {
                              const values = {
                                name: writer.name,
                                role: writer.role || null,
                                share_percent: Number(writer.share_percent || 0),
                                cae_ipi: writer.cae_ipi || null,
                                association: writer.association || null,
                              };
                              const done = {
                                onSuccess: () => {
                                  setWriter(emptyWriter);
                                  setWriterFor(null);
                                  setEditingWriterId(null);
                                },
                              };
                              if (editingWriterId) {
                                updateWriter.mutate({ id: editingWriterId, values }, done);
                              } else {
                                insertWriter.mutate({ song_id: s.id, ...values }, done);
                              }
                            }}
                          >
                            {editingWriterId ? "Salvar autor" : "Adicionar autor"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setWriterFor(null);
                              setEditingWriterId(null);
                              setWriter(emptyWriter);
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2"
                        onClick={() => {
                          setWriterFor(s.id);
                          setEditingWriterId(null);
                          setWriter(emptyWriter);
                        }}
                      >
                        <Users className="mr-1 size-4" /> Adicionar autor / split
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ListState>
      </Section>
    </PageContainer>
  );
}

/** Formulário único de obra — cria uma nova ou edita uma existente. */
function SongFormDialog({
  song,
  trigger,
}: {
  song?: Tables<"songs"> | undefined;
  trigger: ReactNode;
}) {
  const isEdit = Boolean(song);
  const insert = useInsert("songs", "Obra cadastrada");
  const update = useUpdate("songs", "Obra atualizada");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptySong);
  const set = (k: keyof typeof emptySong) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setForm(
      song
        ? {
            title: song.title ?? "",
            genre: song.genre ?? "",
            duration_input: duration(song.duration_seconds ?? 0),
            isrc: song.isrc ?? "",
            iswc: song.iswc ?? "",
            publisher: song.publisher ?? "",
            producer: song.producer ?? "",
            studio: song.studio ?? "",
            performers: song.performers ?? "",
          }
        : emptySong,
    );
  }, [open, song]);

  function save() {
    const values = {
      title: form.title,
      genre: form.genre || null,
      duration_seconds: parseDuration(form.duration_input) ?? 0,
      isrc: form.isrc || null,
      iswc: form.iswc || null,
      publisher: form.publisher || null,
      producer: form.producer || null,
      studio: form.studio || null,
      performers: form.performers || null,
    };
    if (isEdit && song) {
      update.mutate({ id: song.id, values }, { onSuccess: () => setOpen(false) });
      return;
    }
    insert.mutate(values, {
      onSuccess: () => {
        setForm(emptySong);
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar obra" : "Nova obra"}</DialogTitle>
        </DialogHeader>
        <FieldGrid>
          <TextField label="Título" value={form.title} onChange={set("title")} />
          <TextField label="Gênero" value={form.genre} onChange={set("genre")} />
          <TextField
            label="Duração (mm:ss)"
            value={form.duration_input}
            onChange={set("duration_input")}
            placeholder="03:45"
          />
          <TextField label="ISRC" value={form.isrc} onChange={set("isrc")} />
          <TextField label="ISWC" value={form.iswc} onChange={set("iswc")} />
          <TextField label="Editora" value={form.publisher} onChange={set("publisher")} />
          <TextField label="Produtor" value={form.producer} onChange={set("producer")} />
          <TextField label="Estúdio" value={form.studio} onChange={set("studio")} />
          <TextField label="Intérpretes" value={form.performers} onChange={set("performers")} />
        </FieldGrid>
        <DialogFooter>
          <Button disabled={!form.title || insert.isPending || update.isPending} onClick={save}>
            {isEdit ? "Salvar alterações" : "Salvar obra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
