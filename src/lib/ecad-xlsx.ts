import type { Tables } from "@/integrations/supabase/types";
import templateUrl from "@/assets/ecad/arr008-repertorio-musical-shows.xlsx?url";

/**
 * Preenche o roteiro musical oficial do Ecad (formulário Arr008, "Repertório
 * Musical Show") a partir do template real baixado do site do Ecad — só
 * escreve nas células de dado, sem alterar layout, rótulos ou o texto legal
 * do rodapé. Layout do template (conferido célula a célula com exceljs):
 *   B3 Evento · K3 Data do evento · C4 Intérprete · C5 Local · I5 Cidade ·
 *   N5 UF · G6 Produtor/Responsável · M6 Telefone
 *   Linhas 8–38 (máx. 31 músicas): A Nº · B:G Título · H:M Referência
 *   autoral · N Uso do Ecad (preenchido pelo próprio Ecad, deixado em branco)
 */

const FIRST_SONG_ROW = 8;
const MAX_SONGS_PER_SHEET = 31;

export type EcadRoteiroHeader = {
  eventTitle: string;
  /** ISO yyyy-mm-dd */
  eventDate: string | null;
  performer: string;
  venue: string | null;
  city: string | null;
  state: string | null;
  producer: string | null;
  phone: string | null;
};

export type EcadRoteiroSong = {
  title: string;
  authors: string;
};

/** Mesma regra usada no relatório de execução pública em PDF (repertorio.tsx). */
export function songAuthors(
  song: Pick<Tables<"songs">, "id" | "origin" | "original_authors">,
  writers: Tables<"song_writers">[],
): string {
  if (song.origin === "cover") return song.original_authors || "—";
  const list = writers.filter((w) => w.song_id === song.id);
  return list.map((w) => `${w.name} ${w.share_percent}%`).join("; ") || "—";
}

async function loadTemplateBuffer(): Promise<ArrayBuffer> {
  const res = await fetch(templateUrl);
  return res.arrayBuffer();
}

function fillHeader(ws: import("exceljs").Worksheet, header: EcadRoteiroHeader) {
  ws.getCell("B3").value = header.eventTitle || "";
  if (header.eventDate) ws.getCell("K3").value = new Date(`${header.eventDate}T12:00:00`);
  ws.getCell("C4").value = header.performer || "";
  ws.getCell("C5").value = header.venue || "";
  ws.getCell("I5").value = header.city || "";
  ws.getCell("N5").value = header.state || "";
  ws.getCell("G6").value = header.producer || "";
  ws.getCell("M6").value = header.phone || "";
}

function fillSongs(ws: import("exceljs").Worksheet, songs: EcadRoteiroSong[]) {
  songs.forEach((song, i) => {
    const row = FIRST_SONG_ROW + i;
    ws.getCell(`A${row}`).value = i + 1;
    ws.getCell(`B${row}`).value = song.title;
    ws.getCell(`H${row}`).value = song.authors;
  });
}

export type EcadRoteiroFile = { blob: Blob; part: number; totalParts: number };

/**
 * Um roteiro por show/artista, conforme a orientação do Ecad. Com mais de 31
 * músicas, divide em mais de um arquivo — cada um é o mesmo template com o
 * mesmo cabeçalho, só a tabela de músicas muda, como pede a instrução oficial
 * de usar "um segundo formulário" quando a execução passa de 31 músicas.
 */
export async function buildEcadRoteiroFiles(params: {
  header: EcadRoteiroHeader;
  songs: EcadRoteiroSong[];
}): Promise<EcadRoteiroFile[]> {
  const { default: ExcelJS } = await import("exceljs");
  const buffer = await loadTemplateBuffer();

  const chunks: EcadRoteiroSong[][] = [];
  for (let i = 0; i < params.songs.length; i += MAX_SONGS_PER_SHEET) {
    chunks.push(params.songs.slice(i, i + MAX_SONGS_PER_SHEET));
  }
  if (chunks.length === 0) chunks.push([]);

  const files: EcadRoteiroFile[] = [];
  for (let idx = 0; idx < chunks.length; idx++) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new Error("Template do Ecad sem planilha.");
    fillHeader(ws, params.header);
    fillSongs(ws, chunks[idx] ?? []);
    const arr = await wb.xlsx.writeBuffer();
    files.push({
      blob: new Blob([arr], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      part: idx + 1,
      totalParts: chunks.length,
    });
  }
  return files;
}

export async function downloadEcadRoteiro(params: {
  header: EcadRoteiroHeader;
  songs: EcadRoteiroSong[];
  filenameBase: string;
}) {
  const files = await buildEcadRoteiroFiles(params);
  for (const { blob, part, totalParts } of files) {
    const suffix = totalParts > 1 ? `-parte-${part}` : "";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${params.filenameBase}${suffix}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
