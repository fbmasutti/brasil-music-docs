import jsPDF from "jspdf";

export type PdfBlock =
  | { type: "heading"; text: string }
  | { type: "para"; text: string }
  | { type: "clause"; title: string; text: string }
  | { type: "kv"; rows: [string, string][] }
  | { type: "table"; head: string[]; rows: string[][]; widths?: number[] }
  | { type: "space"; size?: number }
  | { type: "note"; text: string }
  | { type: "signatures"; names: string[] };

export type PdfDoc = {
  title: string;
  subtitle?: string;
  brand?: string;
  logoDataUrl?: string | null;
  footer?: string;
  blocks: PdfBlock[];
};

const M = 18;
const W = 210;
const H = 297;
const CONTENT = W - M * 2;

function newDoc() {
  return new jsPDF({ unit: "mm", format: "a4" });
}

export function buildPdf(spec: PdfDoc): jsPDF {
  const doc = newDoc();
  let y = M;

  const ensure = (needed: number) => {
    if (y + needed > H - M - 10) {
      doc.addPage();
      y = M;
    }
  };

  // Header
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, W, 26, "F");
  if (spec.logoDataUrl) {
    try {
      doc.addImage(spec.logoDataUrl, "PNG", M, 5, 16, 16);
    } catch {
      /* ignore unreadable logo */
    }
  }
  const headerX = spec.logoDataUrl ? M + 20 : M;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text((spec.brand || "StageDocs").toUpperCase(), headerX, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 180, 250);
  doc.text(spec.subtitle || "Documentação profissional para músicos", headerX, 19);
  y = 36;

  doc.setTextColor(20, 20, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(spec.title.toUpperCase(), CONTENT);
  doc.text(titleLines, W / 2, y, { align: "center" });
  y += titleLines.length * 6 + 4;
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 8;

  // Motor flexível: descarta blocos sem conteúdo real para não imprimir vazios/traços.
  const blocks = spec.blocks.filter((b) => {
    if (b.type === "kv") return b.rows.some(([, v]) => Boolean(v && String(v).trim()));
    if (b.type === "table") return b.rows.length > 0;
    if (b.type === "para" || b.type === "heading" || b.type === "note") return Boolean(b.text?.trim());
    if (b.type === "clause") return Boolean(b.text?.trim() || b.title?.trim());
    if (b.type === "signatures") return b.names.some((n) => Boolean(n && n.trim()));
    return true;
  });

  for (const block of blocks) {
    switch (block.type) {

      case "heading": {
        ensure(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(60, 30, 140);
        doc.text(block.text.toUpperCase(), M, y);
        y += 6;
        break;
      }
      case "para": {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(25, 25, 28);
        const lines = doc.splitTextToSize(block.text, CONTENT);
        for (const line of lines) {
          ensure(6);
          doc.text(line, M, y, { maxWidth: CONTENT });
          y += 5;
        }
        y += 3;
        break;
      }
      case "clause": {
        ensure(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(25, 25, 28);
        doc.text(block.title, M, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(block.text, CONTENT);
        for (const line of lines) {
          ensure(6);
          doc.text(line, M, y);
          y += 5;
        }
        y += 3;
        break;
      }
      case "kv": {
        doc.setFontSize(9.5);
        for (const [k, v] of block.rows) {
          if (!v || !String(v).trim()) continue;
          ensure(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(80, 80, 90);
          doc.text(`${k}:`, M, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(20, 20, 22);
          const lines = doc.splitTextToSize(String(v).trim(), CONTENT - 45);
          doc.text(lines, M + 45, y);
          y += Math.max(5.5, lines.length * 5);
        }
        y += 3;
        break;
      }

      case "table": {
        const cols = block.head.length;
        const widths =
          block.widths && block.widths.length === cols
            ? block.widths.map((w) => (w / block.widths!.reduce((a, b) => a + b, 0)) * CONTENT)
            : Array.from({ length: cols }, () => CONTENT / cols);
        ensure(12);
        doc.setFillColor(139, 92, 246);
        doc.rect(M, y - 4.5, CONTENT, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        let x = M;
        block.head.forEach((h, i) => {
          doc.text(h, x + 1.5, y);
          x += widths[i] as number;
        });
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(25, 25, 28);
        block.rows.forEach((row, ri) => {
          const cellLines = row.map((cell, i) =>
            doc.splitTextToSize(String(cell ?? ""), (widths[i] as number) - 3),
          );
          const rowHeight = Math.max(...cellLines.map((l) => l.length)) * 4.4 + 2.5;
          ensure(rowHeight + 2);
          if (ri % 2 === 0) {
            doc.setFillColor(244, 243, 250);
            doc.rect(M, y - 4, CONTENT, rowHeight, "F");
          }
          let cx = M;
          cellLines.forEach((lines, i) => {
            doc.text(lines, cx + 1.5, y);
            cx += widths[i] as number;
          });
          y += rowHeight;
        });
        y += 5;
        break;
      }
      case "note": {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(110, 110, 120);
        const lines = doc.splitTextToSize(block.text, CONTENT);
        for (const line of lines) {
          ensure(5);
          doc.text(line, M, y);
          y += 4.2;
        }
        y += 3;
        break;
      }
      case "space": {
        y += block.size ?? 6;
        break;
      }
      case "signatures": {
        ensure(30 + block.names.length * 2);
        y += 10;
        const half = CONTENT / 2;
        block.names.forEach((name, i) => {
          const col = i % 2;
          if (col === 0 && i > 0) y += 24;
          const x = M + col * half;
          doc.setDrawColor(120, 120, 130);
          doc.setLineWidth(0.3);
          doc.line(x, y, x + half - 12, y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(60, 60, 70);
          doc.text(doc.splitTextToSize(name, half - 12), x, y + 4.5);
        });
        y += 22;
        break;
      }
    }
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 150);
    doc.text(spec.footer || "Gerado com StageDocs", M, H - 10);
    doc.text(`${p}/${pages}`, W - M, H - 10, { align: "right" });
  }

  return doc;
}

export function pdfPreviewUrl(spec: PdfDoc) {
  return buildPdf(spec).output("datauristring");
}

export function downloadPdf(spec: PdfDoc, filename: string) {
  buildPdf(spec).save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export function pdfBlob(spec: PdfDoc): Blob {
  return buildPdf(spec).output("blob");
}
