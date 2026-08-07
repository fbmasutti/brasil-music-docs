import jsPDF from "jspdf";

export type PdfBlock =
  | { type: "heading"; text: string }
  | { type: "para"; text: string }
  | { type: "clause"; title: string; text: string }
  | { type: "kv"; rows: [string, string][] }
  | { type: "table"; head: string[]; rows: string[][]; widths?: number[] }
  // Imagem em data URL (PNG). Usado para embutir o mapa de palco desenhado,
  // que como tabela de texto não comunica posição para o técnico de som.
  | { type: "image"; dataUrl: string; aspect: number; caption?: string }
  | { type: "space"; size?: number }
  | { type: "note"; text: string }
  | { type: "signatures"; names: string[] };

export type PdfOrientation = "retrato" | "paisagem";

export type PdfDoc = {
  title: string;
  subtitle?: string;
  brand?: string;
  logoDataUrl?: string | null;
  footer?: string;
  /** Cor de destaque do Brand Kit da formação ativa (hex). Sem isso, cai no
   * violeta padrão do StageKit — mesma aparência de sempre. */
  accent?: string | undefined;
  /** Paisagem é necessária para mapas de palco de formações complexas, que
   * ficam ilegíveis na largura de uma folha em retrato. */
  orientation?: PdfOrientation;
  blocks: PdfBlock[];
};

const M = 18;

const DEFAULT_ACCENT: [number, number, number] = [139, 92, 246];

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1] as string, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return a.map((v, i) => Math.round(v + (b[i]! - v) * t)) as [number, number, number];
}

function luma([r, g, b]: [number, number, number]) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Cores derivadas da cor de destaque — em documento impresso/branco, uma
 * cor de brand kit muito clara (ex.: Studio Mono) precisa escurecer antes de
 * virar preenchimento com texto branco em cima, senão fica ilegível. O texto
 * dos títulos usa uma versão ainda mais escura, sempre legível em fundo
 * branco independente de quão clara for a cor original. */
function accentColors(accentHex: string | undefined) {
  const raw = (accentHex && hexToRgb(accentHex)) || DEFAULT_ACCENT;
  const fill: [number, number, number] = luma(raw) > 150 ? mix(raw, [0, 0, 0], 0.45) : raw;
  const text = mix(raw, [0, 0, 0], 0.55);
  const tint = mix(fill, [255, 255, 255], 0.92);
  const subtitle = mix(raw, [255, 255, 255], 0.45);
  return { line: raw, fill, text, tint, subtitle };
}

function newDoc(orientation: PdfOrientation) {
  return new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: orientation === "paisagem" ? "landscape" : "portrait",
  });
}

export function buildPdf(spec: PdfDoc): jsPDF {
  const orientation = spec.orientation ?? "retrato";
  const doc = newDoc(orientation);
  const W = orientation === "paisagem" ? 297 : 210;
  const H = orientation === "paisagem" ? 210 : 297;
  const CONTENT = W - M * 2;
  const {
    line: accentLine,
    fill: accentFill,
    text: accentText,
    tint: accentTint,
    subtitle: accentSubtitle,
  } = accentColors(spec.accent);

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
  doc.text((spec.brand || "StageKit").toUpperCase(), headerX, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...accentSubtitle);
  doc.text(spec.subtitle || "Documentação profissional para músicos", headerX, 19);
  y = 36;

  doc.setTextColor(20, 20, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(spec.title.toUpperCase(), CONTENT);
  doc.text(titleLines, W / 2, y, { align: "center" });
  y += titleLines.length * 6 + 4;
  doc.setDrawColor(...accentLine);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 8;

  // Motor flexível: descarta blocos sem conteúdo real para não imprimir vazios/traços.
  const blocks = spec.blocks.filter((b) => {
    if (b.type === "kv") return b.rows.some(([, v]) => Boolean(v && String(v).trim()));
    if (b.type === "table") return b.rows.length > 0;
    if (b.type === "para" || b.type === "heading" || b.type === "note")
      return Boolean(b.text?.trim());
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
        doc.setTextColor(...accentText);
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
        doc.setFillColor(...accentFill);
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
            doc.setFillColor(...accentTint);
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
      case "image": {
        // Cabe na largura do conteúdo e nunca passa da altura útil da página
        // (importante em paisagem, onde a folha é baixa); se não couber na
        // página atual, quebra antes de desenhar para não cortar o mapa.
        const maxH = H - M * 2 - 14 - (block.caption ? 8 : 0);
        let imgW = CONTENT;
        let imgH = imgW / (block.aspect || 1);
        if (imgH > maxH) {
          imgH = maxH;
          imgW = imgH * (block.aspect || 1);
        }
        ensure(imgH + (block.caption ? 8 : 4));
        try {
          doc.addImage(block.dataUrl, "PNG", M + (CONTENT - imgW) / 2, y - 2, imgW, imgH);
          y += imgH + 2;

        } catch {
          // Se a captura falhar, o documento segue sem o desenho em vez de
          // quebrar a geração inteira.
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(120, 120, 130);
          doc.text("(mapa de palco indisponível)", M, y);
          y += 6;
        }
        if (block.caption) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(110, 110, 120);
          doc.text(block.caption, M, y + 3);
          y += 8;
        }
        y += 3;
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
    doc.text(spec.footer || "Gerado com StageKit", M, H - 10);
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
