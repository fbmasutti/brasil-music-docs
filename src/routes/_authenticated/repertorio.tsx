import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Music4, Plus, Trash2, Download, Users } from "lucide-react";
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
import { PageHeader, Section, EmptyState, FieldGrid, TextField } from "@/components/ui-kit";
import { useList, useInsert, useRemove, useProfile } from "@/lib/queries";
import { duration, parseDuration, ECAD_ASSOCIATIONS, dateBR } from "@/lib/format";
import { downloadPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/repertorio")({
  head: () => ({
    meta: [
      { title: "Repertório e ECAD — obras, ISRC e split de autoria" },
      {
        name: "description",
        content:
          "Cadastre obras com ISRC, ISWC e divisão de autoria e gere relatórios de execução pública para o ECAD.",
      },
      { property: "og:title", content: "Repertório e ECAD — StageKit" },
      { property: "og:description", content: "Obras, autores e relatórios de execução pública organizados." },
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
  const { data: songs = [] } = useList("songs", { order: { column: "title" } });
  const { data: writers = [] } = useList("song_writers");
  const { data: events = [] } = useList("events", { order: { column: "event_date", ascending: false } });
  const insertSong = useInsert("songs", "Obra cadastrada");
  const insertWriter = useInsert("song_writers", "Autor adicionado");
  const removeSong = useRemove("songs", "Obra removida");
  const removeWriter = useRemove("song_writers", "Autor removido");

  const [open, setOpen] = useState(false);
  const [song, setSong] = useState(emptySong);
  const [writerFor, setWriterFor] = useState<string | null>(null);
  const [writer, setWriter] = useState(emptyWriter);
  const [ecadEventId, setEcadEventId] = useState("");

  const setSongField = (k: keyof typeof emptySong) => (v: string) => setSong((s) => ({ ...s, [k]: v }));
  const setWriterField = (k: keyof typeof emptyWriter) => (v: string) => setWriter((w) => ({ ...w, [k]: v }));

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
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Repertório & ECAD"
        subtitle="Obras com metadados completos, split de autoria e relatórios de execução pública prontos para a associação."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportEcadReport} disabled={!songs.length}>
              <Download className="mr-1 size-4" /> Relatório ECAD
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 size-4" /> Nova obra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova obra</DialogTitle>
                </DialogHeader>
                <FieldGrid>
                  <TextField label="Título" value={song.title} onChange={setSongField("title")} />
                  <TextField label="Gênero" value={song.genre} onChange={setSongField("genre")} />
                  <TextField
                    label="Duração (mm:ss)"
                    value={song.duration_input}
                    onChange={setSongField("duration_input")}
                    placeholder="03:45"
                  />
                  <TextField label="ISRC" value={song.isrc} onChange={setSongField("isrc")} />
                  <TextField label="ISWC" value={song.iswc} onChange={setSongField("iswc")} />
                  <TextField label="Editora" value={song.publisher} onChange={setSongField("publisher")} />
                  <TextField label="Produtor" value={song.producer} onChange={setSongField("producer")} />
                  <TextField label="Estúdio" value={song.studio} onChange={setSongField("studio")} />
                  <TextField label="Intérpretes" value={song.performers} onChange={setSongField("performers")} />
                </FieldGrid>
                <DialogFooter>
                  <Button
                    disabled={!song.title || insertSong.isPending}
                    onClick={() =>
                      insertSong.mutate(
                        {
                          title: song.title,
                          genre: song.genre || null,
                          duration_seconds: parseDuration(song.duration_input) ?? 0,
                          isrc: song.isrc || null,
                          iswc: song.iswc || null,
                          publisher: song.publisher || null,
                          producer: song.producer || null,
                          studio: song.studio || null,
                          performers: song.performers || null,
                        },
                        {
                          onSuccess: () => {
                            setSong(emptySong);
                            setOpen(false);
                          },
                        },
                      )
                    }
                  >
                    Salvar obra
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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

      <Section title={`Obras (${songs.length})`}>
        {songs.length === 0 ? (
          <EmptyState
            icon={<Music4 className="size-5" />}
            title="Nenhuma obra cadastrada"
            description="Cadastre suas composições com ISRC, ISWC e divisão de autoria."
          />
        ) : (
          <ul className="space-y-4">
            {songs.map((s) => {
              const list = writers.filter((w) => w.song_id === s.id);
              const total = list.reduce((sum, w) => sum + Number(w.share_percent), 0);
              return (
                <li key={s.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {[s.genre, duration(s.duration_seconds), s.isrc && `ISRC ${s.isrc}`, s.iswc && `ISWC ${s.iswc}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={total === 100 ? "text-success" : "text-warning"}>
                        Split {total}%
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => removeSong.mutate(s.id)} aria-label="Remover">
                        <Trash2 className="size-4" />
                      </Button>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWriter.mutate(w.id)}
                          aria-label="Remover autor"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>

                  {writerFor === s.id ? (
                    <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                      <FieldGrid>
                        <TextField label="Autor" value={writer.name} onChange={setWriterField("name")} />
                        <TextField label="Função" value={writer.role} onChange={setWriterField("role")} placeholder="Letra e música" />
                        <TextField label="Percentual (%)" value={writer.share_percent} onChange={setWriterField("share_percent")} />
                        <TextField label="CAE/IPI" value={writer.cae_ipi} onChange={setWriterField("cae_ipi")} />
                        <div className="space-y-2">
                          <Label>Associação</Label>
                          <Select value={writer.association} onValueChange={setWriterField("association")}>
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
                          onClick={() =>
                            insertWriter.mutate(
                              {
                                song_id: s.id,
                                name: writer.name,
                                role: writer.role || null,
                                share_percent: Number(writer.share_percent || 0),
                                cae_ipi: writer.cae_ipi || null,
                                association: writer.association || null,
                              },
                              {
                                onSuccess: () => {
                                  setWriter(emptyWriter);
                                  setWriterFor(null);
                                },
                              },
                            )
                          }
                        >
                          Adicionar autor
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setWriterFor(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => setWriterFor(s.id)}>
                      <Users className="mr-1 size-4" /> Adicionar autor / split
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
