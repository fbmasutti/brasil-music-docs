import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Music4,
  Plus,
  Download,
  Users,
  FileBadge,
  ExternalLink,
  Wand2,
  Loader2,
} from "lucide-react";
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
  ItemActions,
  ListState,
} from "@/components/ui-kit";
import { useList, useInsert, useUpdate, useRemove, useProfile } from "@/lib/queries";
import { useDocumentAccent } from "@/lib/active-formation";
import type { Tables } from "@/integrations/supabase/types";
import { duration, parseDuration, ECAD_ASSOCIATIONS, dateBR, razaoSocial } from "@/lib/format";
import { downloadPdf } from "@/lib/pdf";
import { fetchTrackMeta } from "@/lib/oembed";

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
  external_link: "",
};

const emptyWriter = { name: "", role: "", share_percent: "", cae_ipi: "", association: "" };

function RepertoirePage() {
  const { data: profile } = useProfile();
  const songsQuery = useList("songs", { order: { column: "title" } });
  const allSongs = songsQuery.data ?? [];
  const { data: writers = [] } = useList("song_writers");
  const { data: formations = [] } = useList("formations", { order: { column: "name" } });
  const { data: formationSongs = [] } = useList("formation_songs");
  const { data: events = [] } = useList("events", {
    order: { column: "event_date", ascending: false },
  });
  const insertWriter = useInsert("song_writers", "Autor adicionado");
  const updateWriter = useUpdate("song_writers", "Autor atualizado");
  const removeSong = useRemove("songs", "Obra removida");
  const removeWriter = useRemove("song_writers", "Autor removido");
  const duplicateSong = useInsert("songs", "Obra duplicada");

  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [writerFor, setWriterFor] = useState<string | null>(null);
  // id do autor sendo editado; null = o formulário está criando um novo
  const [editingWriterId, setEditingWriterId] = useState<string | null>(null);
  const [writer, setWriter] = useState(emptyWriter);
  // "" = todas as formações. Filtra a lista de obras na tela — é sobre navegar e
  // organizar o repertório, não sobre o relatório (esse tem o próprio filtro,
  // no diálogo do botão "Relatório ECAD").
  const [formationFilter, setFormationFilter] = useState("");
  const accent = useDocumentAccent();

  const setWriterField = (k: keyof typeof emptyWriter) => (v: string) =>
    setWriter((w) => ({ ...w, [k]: v }));

  const songs = formationFilter
    ? allSongs.filter((s) =>
        formationSongs.some((fs) => fs.song_id === s.id && fs.formation_id === formationFilter),
      )
    : allSongs;

  function formationNamesFor(songId: string) {
    return formationSongs
      .filter((fs) => fs.song_id === songId)
      .map((fs) => formations.find((f) => f.id === fs.formation_id)?.name)
      .filter((name): name is string => Boolean(name));
  }

  const ownSongs = songs.filter((s) => s.origin === "autoral");

  function exportRegistrationSheet(s: Tables<"songs">) {
    const list = writers.filter((w) => w.song_id === s.id);
    downloadPdf(
      {
        title: "Ficha de registro de obra",
        brand: profile?.stage_name ?? "StageKit",
        subtitle: "Documento de apoio para registro em ECAD, UBC, ABRAMUS e demais associações",
        footer: `${profile?.stage_name ?? "StageKit"} · ficha de registro de obra`,
        accent,
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
        subtitle="Cadastre o repertório vinculado a cada formação. Quando precisar, gere o relatório de execução pública e as fichas de registro do ECAD."
        actions={
          <>
            <EcadReportDialog
              trigger={
                <Button variant="outline" size="sm" disabled={!allSongs.length}>
                  <Download className="mr-1 size-4" /> Relatório ECAD
                </Button>
              }
              allSongs={allSongs}
              formations={formations}
              formationSongs={formationSongs}
              writers={writers}
              events={events}
              profile={profile}
              accent={accent}
            />
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
        title={songsQuery.isLoading ? "Obras" : `Obras (${songs.length})`}
        description={
          formations.length
            ? "Filtre por formação para ver e organizar o repertório de cada banda ou projeto."
            : undefined
        }
        actions={
          formations.length ? (
            <div className="flex items-center gap-2">
              <Label className="shrink-0 text-xs text-muted-foreground">Formação</Label>
              <Select
                value={formationFilter || "all"}
                onValueChange={(v) => setFormationFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="Todas as formações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formações</SelectItem>
                  {formations.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                      {f.is_default ? " · padrão" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : undefined
        }
      >
        <ListState
          query={songsQuery}
          empty={
            <SongFormDialog
              trigger={
                <EmptyState
                  icon={<Music4 className="size-5" />}
                  title="Nenhuma obra cadastrada"
                  description="Clique para cadastrar o repertório que você toca — covers e composições próprias."
                />
              }
            />
          }
        >
          {() => (
            <ul className="space-y-4">
              {songs.map((s) => {
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
                          {s.external_link ? (
                            <a
                              href={s.external_link}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Abrir link de ${s.title}`}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          ) : null}
                        </div>
                        {formationNamesFor(s.id).length ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {formationNamesFor(s.id).map((name) => (
                              <Badge key={name} variant="secondary" className="text-[10px]">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
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
                        <ItemActions
                          onEdit={() => setEditingSongId(s.id)}
                          onDuplicate={() =>
                            duplicateSong.mutate({
                              title: `${s.title} (cópia)`,
                              origin: s.origin,
                              genre: s.genre,
                              duration_seconds: s.duration_seconds,
                            })
                          }
                          onDelete={() => removeSong.mutate(s.id)}
                          deleteConfirm={{
                            title: `Remover "${s.title}"?`,
                            description: list.length
                              ? `${list.length} autor(es) e o split de autoria desta obra serão apagados junto. Essa ação não pode ser desfeita.`
                              : "A obra será apagada. Essa ação não pode ser desfeita.",
                            confirmLabel: "Remover obra",
                          }}
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
                              <ItemActions
                                onEdit={() => {
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
                                onDelete={() => removeWriter.mutate(w.id)}
                                deleteConfirm={{
                                  title: `Remover ${w.name} da autoria?`,
                                  description: `O split de ${w.share_percent}% volta a ficar sem dono. Essa ação não pode ser desfeita.`,
                                  confirmLabel: "Remover autor",
                                }}
                              />
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

      {editingSongId && (
        <SongFormDialog
          song={allSongs.find((s) => s.id === editingSongId)}
          open={true}
          onOpenChange={(o) => { if (!o) setEditingSongId(null); }}
        />
      )}
    </PageContainer>
  );
}

/**
 * Fluxo de download do relatório ECAD, separado da navegação do repertório: o
 * usuário escolhe explicitamente quais obras entram (por formação, com a
 * padrão pré-selecionada) e, se quiser, um evento — que só entra no cabeçalho
 * do PDF, não filtra a tabela. Antes os dois selects moravam soltos na página
 * e pareciam controlar a mesma coisa; aqui fica claro que são independentes.
 */
function EcadReportDialog({
  trigger,
  allSongs,
  formations,
  formationSongs,
  writers,
  events,
  profile,
  accent,
}: {
  trigger: ReactNode;
  allSongs: Tables<"songs">[];
  formations: Tables<"formations">[];
  formationSongs: Tables<"formation_songs">[];
  writers: Tables<"song_writers">[];
  events: Tables<"events">[];
  profile: Tables<"profiles"> | null | undefined;
  accent: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [formationId, setFormationId] = useState("");
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    if (!open) return;
    setFormationId(formations.find((f) => f.is_default)?.id ?? "");
    setEventId("");
  }, [open, formations]);

  const songs = formationId
    ? allSongs.filter((s) =>
        formationSongs.some((fs) => fs.song_id === s.id && fs.formation_id === formationId),
      )
    : allSongs;

  function authorsFor(s: Tables<"songs">) {
    if (s.origin === "cover") return s.original_authors || "—";
    const list = writers.filter((w) => w.song_id === s.id);
    return list.map((w) => `${w.name} ${w.share_percent}%`).join("; ") || "—";
  }

  function download() {
    const event = events.find((e) => e.id === eventId);
    const formation = formations.find((f) => f.id === formationId);
    downloadPdf(
      {
        title: "Relatório de execução pública (ECAD)",
        brand: profile?.stage_name ?? "StageKit",
        subtitle: `Associação: ${profile?.ecad_association ?? "não informada"} · CAE/IPI: ${profile?.cae_ipi ?? "—"}`,
        footer: `${profile?.stage_name ?? "StageKit"} · relatório de execução pública`,
        accent,
        blocks: [
          {
            type: "kv",
            rows: [
              ["Titular", profile?.stage_name ?? "—"],
              ["Documento", profile?.cpf_cnpj ?? "—"],
              ["Nº de cliente ECAD", profile?.ecad_client_number ?? "—"],
              ["Repertório", formation ? formation.name : "Todo o repertório"],
              ["Evento", event ? event.title : "Não vinculado a um evento específico"],
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
          { type: "signatures", names: [razaoSocial(profile) || "Titular"] },
        ],
      },
      "relatorio-ecad",
    );
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Relatório ECAD</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          O repertório decide quais obras entram na tabela. O evento é opcional e só aparece no
          cabeçalho do PDF — não filtra as obras.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Repertório</Label>
            <Select
              value={formationId || "all"}
              onValueChange={(v) => setFormationId(v === "all" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o repertório ({allSongs.length})</SelectItem>
                {formations.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                    {f.is_default ? " · padrão" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Evento (opcional)</Label>
            <Select value={eventId || "none"} onValueChange={(v) => setEventId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sem evento específico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem evento específico</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title} — {dateBR(e.event_date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {songs.length} obra{songs.length === 1 ? "" : "s"} entrar{songs.length === 1 ? "á" : "ão"}{" "}
          no relatório.
        </p>
        <DialogFooter>
          <Button onClick={download} disabled={!songs.length}>
            <Download className="mr-1 size-4" /> Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Formulário único de obra — cria uma nova ou edita uma existente. */
function SongFormDialog({
  song,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  song?: Tables<"songs"> | undefined;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const isEdit = Boolean(song);
  const insert = useInsert("songs", "Obra cadastrada");
  const update = useUpdate("songs", "Obra atualizada");
  const { data: formations = [] } = useList("formations", { order: { column: "name" } });
  const { data: formationSongs = [] } = useList("formation_songs");
  const linkFormation = useInsert("formation_songs", "");
  const unlinkFormation = useRemove("formation_songs", "");

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;
  const [form, setForm] = useState(emptySong);
  const [fetchingLink, setFetchingLink] = useState(false);
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const set =
    <K extends keyof typeof emptySong>(k: K) =>
    (v: (typeof emptySong)[K]) =>
      setForm((f) => ({ ...f, [k]: v }));

  const toggleFormation = (id: string) =>
    setSelectedFormations((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );

  /** Aplica no banco a diferença entre o que estava vinculado e o que ficou marcado. */
  function syncFormations(songId: string) {
    const current = formationSongs.filter((fs) => fs.song_id === songId);
    current
      .filter((fs) => !selectedFormations.includes(fs.formation_id))
      .forEach((fs) => unlinkFormation.mutate(fs.id));
    selectedFormations
      .filter((id) => !current.some((fs) => fs.formation_id === id))
      .forEach((id, index) =>
        linkFormation.mutate({ song_id: songId, formation_id: id, position: index }),
      );
  }

  async function fetchFromLink() {
    if (!form.external_link.trim()) return;
    setFetchingLink(true);
    try {
      const meta = await fetchTrackMeta(form.external_link);
      if (!meta) {
        toast.error("Não consegui ler esse link. Confira se é do YouTube ou Spotify.");
        return;
      }
      setForm((f) => ({
        ...f,
        title: meta.title || f.title,
        original_authors: f.origin !== "autoral" && meta.author ? meta.author : f.original_authors,
      }));
      toast.success("Título preenchido a partir do link.");
    } finally {
      setFetchingLink(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setSelectedFormations(
      song
        ? formationSongs.filter((fs) => fs.song_id === song.id).map((fs) => fs.formation_id)
        : [],
    );
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
            external_link: song.external_link ?? "",
          }
        : emptySong,
    );
    // formationSongs entra de propósito fora das deps: só interessa o estado
    // no momento em que o modal abre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          external_link: form.external_link || null,
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
          external_link: form.external_link || null,
        };
    if (isEdit && song) {
      update.mutate(
        { id: song.id, values },
        {
          onSuccess: () => {
            syncFormations(song.id);
            setOpen(false);
          },
        },
      );
      return;
    }
    insert.mutate(values, {
      onSuccess: (created) => {
        syncFormations(created.id);
        setForm(emptySong);
        setSelectedFormations([]);
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar obra" : "Nova obra"}</DialogTitle>
        </DialogHeader>
        <FieldGrid>
          <div className="space-y-2 sm:col-span-2">
            <Label>Link (Spotify, YouTube...)</Label>
            <div className="flex flex-wrap gap-2">
              <input
                className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                value={form.external_link}
                onChange={(e) => set("external_link")(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!form.external_link.trim() || fetchingLink}
                onClick={fetchFromLink}
              >
                {fetchingLink ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <Wand2 className="mr-1 size-3.5" />
                )}
                Buscar dados do link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole o link primeiro: o título (e o autor, quando dá pra separar) vem preenchido.
            </p>
          </div>
          <TextField label="Título" value={form.title} onChange={set("title")} />
          <div className="space-y-2">
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
          {formations.length ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>Formações que tocam esta obra</Label>
              <div className="flex flex-wrap gap-2">
                {formations.map((f) => {
                  const on = selectedFormations.includes(f.id);
                  return (
                    <Button
                      key={f.id}
                      type="button"
                      size="sm"
                      variant={on ? "default" : "outline"}
                      onClick={() => toggleFormation(f.id)}
                    >
                      {f.name}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Serve para montar setlists e riders por formação — uma obra pode estar em mais de
                uma.
              </p>
            </div>
          ) : null}
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
