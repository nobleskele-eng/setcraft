import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export type IntelligencePdfSection = {
  title: string;
  body?: string[];
  table?: {
    headers: string[];
    rows: Array<Array<string | number>>;
    widths?: number[];
  };
};

export type IntelligencePdfData = {
  title: string;
  kicker: string;
  subtitle: string;
  generatedLabel: string;
  metrics: Array<{ label: string; value: string; note?: string }>;
  sections: IntelligencePdfSection[];
  footerNote: string;
};

const PAGE = { width: 595.28, height: 841.89, margin: 42 };
const COLORS = {
  ink: rgb(0.055, 0.082, 0.14),
  muted: rgb(0.39, 0.45, 0.55),
  line: rgb(0.87, 0.89, 0.93),
  panel: rgb(0.965, 0.975, 0.99),
  violet: rgb(0.31, 0.2, 0.74),
  cyan: rgb(0.08, 0.72, 0.82),
  white: rgb(1, 1, 1),
};

function ascii(value: string | number) {
  return String(value)
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u00b7/g, " - ")
    .replace(/\u00b1/g, "+/-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of ascii(text).split(/\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    if (!words.length) lines.push("");
  }
  return lines;
}

function drawLines(page: PDFPage, lines: string[], font: PDFFont, size: number, x: number, y: number, lineHeight: number, color = COLORS.ink) {
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * lineHeight, font, size, color }));
  return y - lines.length * lineHeight;
}

export async function buildIntelligencePdf(data: IntelligencePdfData) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page!: PDFPage;
  let y!: number;
  let pageNumber = 0;

  const addPage = (first = false) => {
    page = pdf.addPage([PAGE.width, PAGE.height]);
    pageNumber += 1;
    page.drawRectangle({ x: 0, y: PAGE.height - (first ? 150 : 54), width: PAGE.width, height: first ? 150 : 54, color: COLORS.ink });
    page.drawRectangle({ x: 0, y: PAGE.height - (first ? 150 : 54), width: 8, height: first ? 150 : 54, color: COLORS.cyan });
    if (!first) {
      page.drawText(ascii(data.kicker).toUpperCase(), { x: PAGE.margin, y: PAGE.height - 34, font: bold, size: 8.5, color: COLORS.cyan });
      page.drawText(ascii(data.title), { x: PAGE.margin + 120, y: PAGE.height - 36, font: bold, size: 11, color: COLORS.white });
    }
    page.drawText(`LaneLab Intelligence - ${pageNumber}`, { x: PAGE.margin, y: 22, font: regular, size: 8, color: COLORS.muted });
    page.drawText(ascii(data.generatedLabel), { x: PAGE.width - PAGE.margin - 150, y: 22, font: regular, size: 8, color: COLORS.muted });
    y = first ? PAGE.height - 184 : PAGE.height - 82;
  };

  const ensure = (height: number) => {
    if (y - height < 48) addPage(false);
  };

  addPage(true);
  page.drawText(ascii(data.kicker).toUpperCase(), { x: PAGE.margin, y: PAGE.height - 42, font: bold, size: 9, color: COLORS.cyan });
  page.drawText(ascii(data.title), { x: PAGE.margin, y: PAGE.height - 82, font: bold, size: 28, color: COLORS.white });
  const subtitleLines = wrap(data.subtitle, regular, 10, PAGE.width - PAGE.margin * 2);
  drawLines(page, subtitleLines.slice(0, 3), regular, 10, PAGE.margin, PAGE.height - 108, 14, rgb(0.78, 0.82, 0.9));

  const metricGap = 8;
  const metricWidth = (PAGE.width - PAGE.margin * 2 - metricGap * 2) / 3;
  data.metrics.forEach((metric, index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    const boxY = y - row * 78 - 58;
    page.drawRectangle({ x: PAGE.margin + column * (metricWidth + metricGap), y: boxY, width: metricWidth, height: 62, color: COLORS.panel, borderColor: COLORS.line, borderWidth: 0.7 });
    page.drawText(ascii(metric.label).toUpperCase(), { x: PAGE.margin + column * (metricWidth + metricGap) + 10, y: boxY + 44, font: bold, size: 7, color: COLORS.violet });
    page.drawText(ascii(metric.value).slice(0, 24), { x: PAGE.margin + column * (metricWidth + metricGap) + 10, y: boxY + 23, font: bold, size: 15, color: COLORS.ink });
    if (metric.note) page.drawText(ascii(metric.note).slice(0, 35), { x: PAGE.margin + column * (metricWidth + metricGap) + 10, y: boxY + 8, font: regular, size: 6.7, color: COLORS.muted });
  });
  y -= Math.ceil(data.metrics.length / 3) * 78 + 8;

  for (const section of data.sections) {
    ensure(64);
    page.drawRectangle({ x: PAGE.margin, y: y - 4, width: 4, height: 18, color: COLORS.violet });
    page.drawText(ascii(section.title), { x: PAGE.margin + 12, y, font: bold, size: 14, color: COLORS.ink });
    y -= 24;
    for (const paragraph of section.body || []) {
      const lines = wrap(paragraph, regular, 9, PAGE.width - PAGE.margin * 2);
      ensure(lines.length * 13 + 12);
      y = drawLines(page, lines, regular, 9, PAGE.margin, y, 13, COLORS.muted) - 8;
    }
    if (section.table) {
      const headers = section.table.headers.map(ascii);
      const available = PAGE.width - PAGE.margin * 2;
      const proportions = section.table.widths || headers.map(() => 1);
      const totalProportion = proportions.reduce((sum, value) => sum + value, 0);
      const widths = proportions.map((value) => available * value / totalProportion);
      const drawHeader = () => {
        ensure(34);
        page.drawRectangle({ x: PAGE.margin, y: y - 20, width: available, height: 24, color: COLORS.ink });
        let x = PAGE.margin;
        headers.forEach((header, index) => {
          page.drawText(header.toUpperCase().slice(0, 22), { x: x + 6, y: y - 12, font: bold, size: 6.8, color: COLORS.white });
          x += widths[index];
        });
        y -= 25;
      };
      drawHeader();
      for (const row of section.table.rows) {
        const cellLines = row.map((cell, index) => wrap(ascii(cell), regular, 7.4, widths[index] - 12));
        const rowHeight = Math.max(24, Math.max(...cellLines.map((lines) => lines.length)) * 10 + 9);
        if (y - rowHeight < 48) {
          addPage(false);
          drawHeader();
        }
        page.drawRectangle({ x: PAGE.margin, y: y - rowHeight + 3, width: available, height: rowHeight, color: pageNumber % 2 ? COLORS.white : COLORS.panel, borderColor: COLORS.line, borderWidth: 0.4 });
        let x = PAGE.margin;
        cellLines.forEach((lines, index) => {
          drawLines(page, lines.slice(0, 4), index === 0 ? bold : regular, 7.4, x + 6, y - 9, 10, index === 0 ? COLORS.ink : COLORS.muted);
          x += widths[index];
        });
        y -= rowHeight;
      }
      y -= 14;
    }
    y -= 4;
  }

  ensure(54);
  const footerLines = wrap(data.footerNote, regular, 7.8, PAGE.width - PAGE.margin * 2 - 18);
  const footerHeight = footerLines.length * 11 + 20;
  page.drawRectangle({ x: PAGE.margin, y: y - footerHeight + 6, width: PAGE.width - PAGE.margin * 2, height: footerHeight, color: rgb(0.94, 0.97, 1), borderColor: rgb(0.75, 0.84, 0.96), borderWidth: 0.6 });
  drawLines(page, footerLines, regular, 7.8, PAGE.margin + 9, y - 8, 11, rgb(0.13, 0.27, 0.46));

  pdf.setTitle(ascii(data.title));
  pdf.setAuthor("LaneLab Swim Studio");
  pdf.setSubject(ascii(data.subtitle));
  pdf.setCreator("LaneLab Performance Intelligence");
  return pdf.save();
}

export async function downloadIntelligencePdf(filename: string, data: IntelligencePdfData) {
  const bytes = await buildIntelligencePdf(data);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
