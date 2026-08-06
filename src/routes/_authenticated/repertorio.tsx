import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Music4, Plus, Trash2, Download, Users, Pencil, FileBadge } from "lucide-react";
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
      { title: "Repertório — covers e obras autorais, ECAD e direitos autorais" },
      {
        name: "description",
        content:
          "Cadastre seu repertório de covers e obras próprias e gere relatórios de execução pública e fichas de registro para o ECAD.",
      },
      { property: "og:title", content: "Repertório — StageKit" },
      {
        property: "og:description",
        content: "Covers, obras autorais, split de autoria e documentos para o ECAD organizados.",
      },
    ],
  }),
  component: RepertoirePage,
});

type SongOrigin = "cover" | "autoral";

const emptySong = {
  origin: "cover" as SongOrigin,
  title: "",
  genre: "",
  duration_input: "",
  original_authors: "",
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
  const insertWriter = useInsert("song_writers", "Autor adicionado");
  const updateWriter = useUpdate("song_writers", "Autor atualizado");
  const removeSong = useRemove("songs", "Obra removida");
  const removeWriter = useRemove("song_writers", "Autor removido");

  const [writerFor, setWriterFor] = useState<string | null>(null);
  // id do autor sendo editado; null = o formulário está criando um novo
  const [editingWriterId, setEditingWriterId] = useState<string | null>(null);
  const [writer, setWriter] = useState(emptyWriter);
  const [ecadEventId, setEcadEventId] = useState("");

  const setWriterField = (k: keyof typeof emptyWriter) => (v: string) =>
    setWriter((w) => ({ ...w, [k]: v }));

  const ownSongs = songs.filter((s) => s.origin === "autoral");

  function authorsFor(s: Tables<"songs">) {
    if (s.origin === "cover") return s.original_authors || "—";
    const list = writers.filter((w) => w.song_id === s.id);
    return list.map((w) => `${w.name} ${w.share_percent}%`).join("; ") || "—";
  }

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
            head: ["Obra", "Duração", "ISWC", "Autor(es)"],
            widths: [3, 1, 1.6, 3.4],
            rows: songs.map((s) => [
              s.title,
              duration(s.duration_seconds),
              s.origin === "autoral" ? s.iswc || "—" : "—",
              authorsFor(s),
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

  function exportRegistrationSheet(s: Tables<"songs">) {
    const list = writers.filter((w) => w.song_id === s.id);
    downloadPdf(
      {
        title: "Ficha de registro de obra",
        brand: profile?.stage_name ?? "StageKit",
        subtitle: "Documento de apoio para registro em ECAD, UBC, ABRAMUS e demais associações",
        footer: `${profile?.stage_name ?? "StageKit"} · ficha de registro de obra`,
        blocks: [
          {
            type: "kv",
            rows: [
              ["Titular", profile?.stage_name ?? "—"],
              ["Documento", profile?.cpf_cnpj ?? "—"],
              ["Título da obra", s.title],
              ["Gênero", s.genre || "—"],
              ["Duração", duration(s.duration_seconds)],
              ["ISRC", s.isrc || "—"],
              ["ISWC", s.iswc || "—"],
              ["Editora", s.publisher || "—"],
              ["Produtor", s.producer || "—"],
              ["Estúdio", s.studio || "—"],
              ["Intérpretes", s.performers || "—"],
            ],
          },
          { type: "heading", text: "Split de autoria" },
          {
            type: "table",
            head: ["Autor", "Função", "%", "CAE/IPI", "Associação"],
            widths: [2.6, 1.6, 0.8, 1.4, 1.4],
            rows: list.map((w) => [
              w.name,
              w.role || "—",
              String(w.share_percent),
              w.cae_ipi || "—",
              w.association || "—",
            ]),
          },
          {
            type: "note",
            text: "Documento de apoio gerado pelo StageKit para instruir o registro da obra junto à associação de direitos autorais.",
          },
        ],
      },
      `ficha-registro-${s.title}`,
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Repertório"
        subtitle="Covers e obras autorais num só lugar. Os relatórios e documentos do ECAD são gerados automaticamente a partir daqui."
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
              description="Cadastre o repertório que você toca — covers e composições próprias."
            />
          }
        >
          {(songList) => (
            <ul className="space-y-4">
              {songList.map((s) => {
                const isOwn = s.origin === "autoral";
                const list = writers.filter((w) => w.song_id === s.id);
                const total = list.reduce((sum, w) => sum + Number(w.share_percent), 0);
                return (
                  <li key={s.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{s.title}</p>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {isOwn ? "Autoral" : "Cover"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[
                            s.genre,
                            duration(s.duration_seconds),
                            !isOwn && s.original_authors && `Autor: ${s.original_authors}`,
                            isOwn && s.isrc && `ISRC ${s.isrc}`,
                            isOwn && s.iswc && `ISWC ${s.iswc}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwn ? (
                          <Badge
                            variant="outline"
                            className={total === 100 ? "text-success" : "text-warning"}
                          >
                            Split {total}%
                          </Badge>
                        ) : null}
                        {isOwn ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Ficha de registro de ${s.title}`}
                            onClick={() => exportRegistrationSheet(s)}
                          >
                            <FileBadge className="size-4" />
                          </Button>
                        ) : null}
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

                    {isOwn ? (
                      <>
                        <ul className="mt-3 space-y-1.5">
                          {list.map((w) => (
                            <li
                              key={w.id}
                              className="flex items-center justify-between gap-2 text-sm"
                            >
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
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </ListState>
      </Section>

      {ownSongs.length === 0 && songs.length > 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Compõe também? Marque uma obra como "Autoral" para liberar ISRC/ISWC, split de autores e a
          ficha de registro para ECAD/UBC/ABRAMUS.
        </p>
      ) : null}
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
  const set =
    <K extends keyof typeof emptySong>(k: K) =>
    (v: (typeof emptySong)[K]) =>
      setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setForm(
      song
        ? {
            origin: (song.origin as SongOrigin) ?? "cover",
            title: song.title ?? "",
            genre: song.genre ?? "",
            duration_input: duration(song.duration_seconds ?? 0),
            original_authors: song.original_authors ?? "",
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

  const isOwn = form.origin === "autoral";

  function save() {
    const values = isOwn
      ? {
          origin: form.origin,
          title: form.title,
          genre: form.genre || null,
          duration_seconds: parseDuration(form.duration_input) ?? 0,
          original_authors: null,
          isrc: form.isrc || null,
          iswc: form.iswc || null,
          publisher: form.publisher || null,
          producer: form.producer || null,
          studio: form.studio || null,
          performers: form.performers || null,
        }
      : {
          origin: form.origin,
          title: form.title,
          genre: form.genre || null,
          duration_seconds: parseDuration(form.duration_input) ?? 0,
          original_authors: form.original_authors || null,
          isrc: null,
          iswc: null,
          publisher: null,
          producer: null,
          studio: null,
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
          <div className="space-y-2 sm:col-span-2">
            <Label>Tipo</Label>
            <Select value={form.origin} onValueChange={(v) => set("origin")(v as SongOrigin)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover — toco, não compus</SelectItem>
                <SelectItem value="autoral">Autoral — obra própria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TextField label="Título" value={form.title} onChange={set("title")} />
          <TextField label="Gênero" value={form.genre} onChange={set("genre")} />
          <TextField
            label="Duração (mm:ss)"
            value={form.duration_input}
            onChange={set("duration_input")}
            placeholder="03:45"
          />
          {!isOwn ? (
            <div className="sm:col-span-2">
              <TextField
                label="Autor(es) original(is)"
                value={form.original_authors}
                onChange={set("original_authors")}
                placeholder="Ex.: Caetano Veloso"
              />
            </div>
          ) : (
            <>
              <TextField label="ISRC" value={form.isrc} onChange={set("isrc")} />
              <TextField label="ISWC" value={form.iswc} onChange={set("iswc")} />
              <TextField label="Editora" value={form.publisher} onChange={set("publisher")} />
              <TextField label="Produtor" value={form.producer} onChange={set("producer")} />
              <TextField label="Estúdio" value={form.studio} onChange={set("studio")} />
            </>
          )}
          <TextField label="Intérpretes" value={form.performers} onChange={set("performers")} />
        </FieldGrid>
        {isOwn ? (
          <p className="text-xs text-muted-foreground">
            Depois de salvar, adicione os autores com o split de % — é o que gera a ficha de
            registro para ECAD/UBC/ABRAMUS.
          </p>
        ) : null}
        <DialogFooter>
          <Button disabled={!form.title || insert.isPending || update.isPending} onClick={save}>
            {isEdit ? "Salvar alterações" : "Salvar obra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
