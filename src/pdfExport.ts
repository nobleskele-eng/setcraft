import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { PoolUnit, StudioNode, StudioSectionNode, StudioSetNode, StudioStats, calculateStats } from "./swimStudioEngine";
import { DeckSheetMeta, GoalTimeTable, LaneAssignmentConfig } from "./studioSheetTypes";

export interface PdfWorkoutMeta {
  name: string;
  focus: string;
  phase: string;
  poolLength: number;
  poolUnit: PoolUnit;
  targetMinutes: number;
  stats: StudioStats;
  nodes: StudioNode[];
  laneAssignments: LaneAssignmentConfig;
  deckSheetMeta: DeckSheetMeta;
}

interface SectionRow {
  title: string;
  purpose: string;
  setLines: string[];
  performanceText: string;
  distance: number;
  duration: number;
  nodeIds: string[];
}

const safe = (value: string | undefined | null) => String(value || "")
  .replace(/[×✕]/g, "x")
  .replace(/[–—]/g, "-")
  .replace(/≥/g, ">=")
  .replace(/≤/g, "<=")
  .replace(/→/g, "->")
  .replace(/·/g, "|")
  .replace(/[“”]/g, '"')
  .replace(/[’]/g, "'")
  .replace(/[^\n\x20-\x7E]/g, "");

const shortStroke: Record<string, string> = {
  Free: "FR",
  Back: "BK",
  Breast: "BR",
  Fly: "FLY",
  IM: "IM",
  "IM Order": "IMO",
  Choice: "CH",
  "No stroke": "",
};

function setLine(node: StudioSetNode, unit: PoolUnit): string {
  const distance = node.distance > 0 ? `${node.distance}${unit}` : "timed";
  const stroke = shortStroke[node.stroke] ?? node.stroke;
  const timing = node.intervalMode === "rest"
    ? `${node.restSeconds}s rest`
    : node.intervalMode === "open"
      ? "open"
      : node.intervalMode === "target-time"
        ? `target ${node.targetTime || node.interval}`
        : `@ ${node.interval}`;
  const details = [
    stroke,
    timing,
    node.targetTime && node.intervalMode !== "target-time" ? `target ${node.targetTime}` : "",
    node.equipment.length ? `w/ ${node.equipment.join(", ")}` : "",
    node.notes,
  ].filter(Boolean).join(" - ");
  return `${node.reps} x ${distance}${details ? ` ${details}` : ""}`;
}

function nodeLines(nodes: StudioNode[], unit: PoolUnit, depth = 0): string[] {
  const lines: string[] = [];
  const prefix = "  ".repeat(Math.min(depth, 4));
  for (const node of nodes) {
    if (node.kind === "set") lines.push(`${prefix}${setLine(node, unit)}`);
    else if (node.kind === "note") lines.push(`${prefix}${node.label}: ${node.text}`);
    else if (node.kind === "repeat") {
      lines.push(`${prefix}${node.rounds} x (${node.label})`);
      lines.push(...nodeLines(node.children, unit, depth + 1));
    } else if (node.kind === "progress") {
      lines.push(`${prefix}${node.mode.toUpperCase()} ${node.rounds} rounds (${node.amount}${node.unit} change)`);
      lines.push(...nodeLines(node.children, unit, depth + 1));
    } else if (node.kind === "condition") {
      lines.push(`${prefix}IF ${node.metric} ${node.comparator} ${node.threshold}: ${node.action}; else ${node.elseAction}`);
      lines.push(...nodeLines(node.children, unit, depth + 1));
    } else if (node.kind === "time-cap") {
      lines.push(`${prefix}TIME CAP ${node.minutes} min - ${node.behavior}`);
      lines.push(...nodeLines(node.children, unit, depth + 1));
    } else if (node.kind === "lane") {
      lines.push(`${prefix}${node.label}: ${node.lanes.map((lane) => `${lane.name} ${lane.targetPace}`).join(" | ")}`);
      lines.push(...nodeLines(node.children, unit, depth + 1));
    } else if (node.kind === "section") {
      lines.push(`${prefix}${node.title.toUpperCase()}:`);
      lines.push(...nodeLines(node.children, unit, depth + 1));
    }
  }
  return lines;
}

function collectSkillFocus(nodes: StudioNode[]): string[] {
  const values: string[] = [];
  const visit = (items: StudioNode[]) => items.forEach((node) => {
    if (node.kind === "set") {
      const cue = safe(node.skillFocus).trim();
      if (cue && !values.some((value) => value.toLowerCase() === cue.toLowerCase())) values.push(cue);
    } else if (node.kind !== "note") visit(node.children);
  });
  visit(nodes);
  return values;
}

function collectNodeIds(nodes: StudioNode[]): string[] {
  const ids: string[] = [];
  const visit = (items: StudioNode[]) => items.forEach((node) => {
    ids.push(node.id);
    if (node.kind !== "set" && node.kind !== "note") visit(node.children);
  });
  visit(nodes);
  return ids;
}

function lanePlanLines(nodeIds: string[], laneAssignments: LaneAssignmentConfig): string[] {
  if (!laneAssignments.enabled || !laneAssignments.showLaneSetPlans) return [];
  const lines: string[] = [];
  laneAssignments.lanes.forEach((lane) => {
    lane.setAssignments.filter((assignment) => nodeIds.includes(assignment.nodeId)).forEach((assignment) => {
      const details = [
        assignment.targetPace ? `pace ${assignment.targetPace}` : "",
        assignment.sendOff ? `@ ${assignment.sendOff}` : "",
        assignment.repsOverride ? `${assignment.repsOverride} reps` : "",
        assignment.distanceOverride ? `${assignment.distanceOverride} distance` : "",
        assignment.instructions,
      ].filter(Boolean).join(" - ");
      lines.push(`${lane.label}: ${assignment.nodeLabel}${details ? ` -> ${details}` : ""}`);
    });
  });
  return lines;
}

function buildRows(nodes: StudioNode[], unit: PoolUnit, laneAssignments: LaneAssignmentConfig): SectionRow[] {
  const rows: SectionRow[] = [];
  let loose: StudioNode[] = [];
  const flushLoose = () => {
    if (!loose.length) return;
    const stats = calculateStats(loose);
    const nodeIds = collectNodeIds(loose);
    const laneLines = lanePlanLines(nodeIds, laneAssignments);
    rows.push({
      title: "SET",
      purpose: "",
      setLines: [...nodeLines(loose, unit), ...(laneLines.length ? ["LANE PLANS:", ...laneLines] : [])],
      performanceText: collectSkillFocus(loose).join("; "),
      distance: stats.totalDistance,
      duration: stats.estimatedDuration,
      nodeIds,
    });
    loose = [];
  };

  nodes.forEach((node) => {
    if (node.kind !== "section") {
      loose.push(node);
      return;
    }
    flushLoose();
    const section = node as StudioSectionNode;
    const stats = calculateStats(section.children);
    const explicit = safe(section.pointsOfPerformance).trim();
    const nodeIds = [section.id, ...collectNodeIds(section.children)];
    const laneLines = lanePlanLines(nodeIds, laneAssignments);
    rows.push({
      title: safe(section.title || "SECTION").toUpperCase(),
      purpose: safe(section.purpose),
      setLines: [...nodeLines(section.children, unit), ...(laneLines.length ? ["LANE PLANS:", ...laneLines] : [])],
      performanceText: explicit || collectSkillFocus(section.children).join("; "),
      distance: stats.totalDistance,
      duration: stats.estimatedDuration,
      nodeIds,
    });
  });
  flushLoose();
  return rows.length ? rows : [{ title: "SET", purpose: "", setLines: ["No sets added"], performanceText: "", distance: 0, duration: 0, nodeIds: [] }];
}

function wrapLine(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const clean = safe(text);
  if (!clean.trim()) return [""];
  const words = clean.split(/\s+/).filter(Boolean);
  const result: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) current = candidate;
    else { result.push(current); current = word; }
  }
  if (current) result.push(current);
  return result;
}

function wrapParagraphs(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  return safe(text).split(/\n|;/).flatMap((part) => wrapLine(part.trim(), maxWidth, font, fontSize)).filter((line, index, all) => line || index === all.length - 1);
}

function drawTextLines(page: PDFPage, lines: string[], x: number, yTop: number, font: PDFFont, fontSize: number, lineHeight: number, color = rgb(0, 0, 0), maxLines = 999): number {
  let y = yTop;
  lines.slice(0, maxLines).forEach((line) => {
    page.drawText(safe(line), { x, y: y - fontSize, size: fontSize, font, color });
    y -= lineHeight;
  });
  return y;
}

function formatDate(value: string): string {
  const parsed = value ? new Date(`${value}T12:00:00`) : new Date();
  if (Number.isNaN(parsed.getTime())) return safe(value);
  return parsed.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function drawCell(page: PDFPage, x: number, y: number, width: number, height: number, fill = rgb(1, 1, 1), borderWidth = 0.65) {
  page.drawRectangle({ x, y, width, height, color: fill, borderColor: rgb(0.25, 0.25, 0.25), borderWidth });
}

function laneCellLines(lane: LaneAssignmentConfig["lanes"][number]): string[] {
  const lines: string[] = [];
  const lanePlan = [lane.defaultPace ? `Pace ${lane.defaultPace}` : "", lane.defaultSendOff ? `@ ${lane.defaultSendOff}` : "", lane.laneNotes].filter(Boolean).join(" - ");
  if (lanePlan) lines.push(`[${safe(lanePlan)}]`);
  lane.swimmers.forEach((swimmer) => {
    const title = safe(swimmer.name || "Unnamed swimmer");
    const detail = [swimmer.assignment, swimmer.notes].filter(Boolean).join(" - ");
    lines.push(title);
    if (detail) lines.push(`(${safe(detail)})`);
  });
  return lines.length ? lines : [""];
}

function laneTableHeight(meta: PdfWorkoutMeta, regular: PDFFont, contentWidth: number): { height: number; fontSize: number; lineHeight: number; maxLines: number } {
  if (!meta.laneAssignments.enabled || !meta.laneAssignments.lanes.length) return { height: 0, fontSize: 0, lineHeight: 0, maxLines: 0 };
  const labelWidth = 52;
  const laneWidth = (contentWidth - labelWidth) / meta.laneAssignments.lanes.length;
  let fontSize = meta.laneAssignments.lanes.length > 8 ? 4.6 : meta.laneAssignments.lanes.length > 6 ? 5.2 : 6.4;
  let lineHeight = fontSize * 1.16;
  const countWrappedLines = () => Math.max(1, ...meta.laneAssignments.lanes.map((lane) =>
    laneCellLines(lane).flatMap((line) => wrapLine(line, laneWidth - 6, regular, fontSize)).length,
  ));
  let maxLines = countWrappedLines();
  let body = Math.min(100, Math.max(36, maxLines * lineHeight + 9));
  while (maxLines * lineHeight + 9 > body && fontSize > 3.7) {
    fontSize -= 0.25;
    lineHeight = fontSize * 1.14;
    maxLines = countWrappedLines();
    body = Math.min(100, Math.max(36, maxLines * lineHeight + 9));
  }
  return { height: 18 + body, fontSize, lineHeight, maxLines };
}

export async function createWorkoutPdfBytes(meta: PdfWorkoutMeta): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const width = page.getWidth();
  const height = page.getHeight();
  const margin = 20;
  const contentWidth = width - margin * 2;
  let y = height - 24;

  const heading = `${safe(meta.deckSheetMeta.sessionCode)}${meta.deckSheetMeta.sessionCode ? " - " : ""}${formatDate(meta.deckSheetMeta.date)}${meta.deckSheetMeta.timeRange ? ` (${safe(meta.deckSheetMeta.timeRange)})` : ""}`;
  page.drawText(heading, { x: margin + 6, y: y - 10, size: 10.5, font: bold, color: rgb(0.03, 0.03, 0.03), maxWidth: contentWidth - 12 });
  y -= 17;
  const subtitle = [meta.deckSheetMeta.quote ? `"${safe(meta.deckSheetMeta.quote)}"` : "", meta.deckSheetMeta.coaches ? safe(meta.deckSheetMeta.coaches) : ""].filter(Boolean).join(" - ");
  if (subtitle) {
    page.drawText(subtitle, { x: margin + 6, y: y - 8, size: 8.6, font: italic, color: rgb(0.08, 0.08, 0.08), maxWidth: contentWidth - 12 });
    y -= 15;
  }

  const laneSizing = laneTableHeight(meta, regular, contentWidth);
  if (laneSizing.height > 0) {
    const lanes = meta.laneAssignments.lanes;
    const labelWidth = 52;
    const laneWidth = (contentWidth - labelWidth) / lanes.length;
    const headerHeight = 18;
    const bodyHeight = laneSizing.height - headerHeight;
    const tableBottom = y - laneSizing.height;
    const tan = rgb(0.91, 0.78, 0.66);
    drawCell(page, margin, y - headerHeight, labelWidth, headerHeight, tan);
    page.drawText("Lane", { x: margin + 16, y: y - 12.5, size: 7.5, font: bold });
    lanes.forEach((lane, index) => {
      const x = margin + labelWidth + index * laneWidth;
      drawCell(page, x, y - headerHeight, laneWidth, headerHeight, tan);
      const title = safe(lane.label || String(index + 1));
      const titleWidth = bold.widthOfTextAtSize(title, 7.2);
      page.drawText(title, { x: x + Math.max(2, (laneWidth - titleWidth) / 2), y: y - 12.5, size: 7.2, font: bold, maxWidth: laneWidth - 4 });
    });
    drawCell(page, margin, tableBottom, labelWidth, bodyHeight);
    page.drawText("Swimmers", { x: margin + 6, y: tableBottom + bodyHeight / 2 - 3, size: 7.2, font: regular, maxWidth: labelWidth - 10 });
    lanes.forEach((lane, index) => {
      const x = margin + labelWidth + index * laneWidth;
      drawCell(page, x, tableBottom, laneWidth, bodyHeight);
      const rawLines = laneCellLines(lane);
      const wrapped = rawLines.flatMap((line) => wrapLine(line, laneWidth - 6, line.startsWith("(") ? italic : regular, laneSizing.fontSize));
      const totalTextHeight = wrapped.length * laneSizing.lineHeight;
      let lineY = tableBottom + Math.min(bodyHeight - 4, (bodyHeight + totalTextHeight) / 2);
      wrapped.slice(0, laneSizing.maxLines).forEach((line) => {
        const isDetail = line.startsWith("(");
        const font = isDetail ? italic : regular;
        const size = isDetail ? Math.max(3.8, laneSizing.fontSize - 0.3) : laneSizing.fontSize;
        const textWidth = font.widthOfTextAtSize(safe(line), size);
        page.drawText(safe(line), { x: x + Math.max(2, (laneWidth - textWidth) / 2), y: lineY - size, size, font, maxWidth: laneWidth - 4, color: isDetail ? rgb(0.25, 0.25, 0.25) : rgb(0.03, 0.03, 0.03) });
        lineY -= laneSizing.lineHeight;
      });
    });
    y = tableBottom - 4;
    if (meta.laneAssignments.absent.trim()) {
      const absentLines = wrapLine(`Absent: ${safe(meta.laneAssignments.absent)}`, contentWidth - 12, bold, 7.4);
      drawTextLines(page, absentLines, margin + 6, y, bold, 7.4, 8.5);
      y -= absentLines.length * 8.5 + 2;
    }
  }

  const dayLabel = safe(meta.deckSheetMeta.dayLabel || "Practice");
  const dayWidth = bold.widthOfTextAtSize(dayLabel, 9);
  page.drawText(dayLabel, { x: (width - dayWidth) / 2, y: y - 9, size: 9, font: bold });
  y -= 15;

  const focusHeight = 31;
  drawCell(page, margin, y - focusHeight, contentWidth, focusHeight, rgb(0.9, 0.9, 0.9));
  page.drawText(`WEEK'S FOCUS: ${safe(meta.deckSheetMeta.weekFocus || meta.phase).toUpperCase()}`, { x: margin + 6, y: y - 11, size: 7.5, font: bold, maxWidth: contentWidth - 12 });
  page.drawText(`TODAY'S FOCUS: ${safe(meta.deckSheetMeta.todayFocus || meta.focus).toUpperCase()}`, { x: margin + 6, y: y - 23, size: 7.5, font: bold, maxWidth: contentWidth - 12 });
  y -= focusHeight;

  const headerHeight = 22;
  const setWidth = contentWidth * 0.59;
  const performanceWidth = contentWidth * 0.29;
  const timeWidth = contentWidth - setWidth - performanceWidth;
  drawCell(page, margin, y - headerHeight, setWidth, headerHeight, rgb(0.9, 0.9, 0.9));
  drawCell(page, margin + setWidth, y - headerHeight, performanceWidth, headerHeight, rgb(0.9, 0.9, 0.9));
  drawCell(page, margin + setWidth + performanceWidth, y - headerHeight, timeWidth, headerHeight, rgb(0.9, 0.9, 0.9));
  page.drawText("SET", { x: margin + 6, y: y - 14, size: 8.2, font: bold });
  page.drawText("POINTS OF PERFORMANCE", { x: margin + setWidth + 6, y: y - 14, size: 7.8, font: bold, maxWidth: performanceWidth - 10 });
  page.drawText("Time/", { x: margin + setWidth + performanceWidth + 6, y: y - 10, size: 6.8, font: bold });
  page.drawText("Distance", { x: margin + setWidth + performanceWidth + 6, y: y - 18, size: 6.8, font: bold });
  y -= headerHeight;

  const rows = buildRows(meta.nodes, meta.poolUnit, meta.laneAssignments);
  const goalTables = meta.deckSheetMeta.goalTimesEnabled ? meta.deckSheetMeta.goalTimeTables.slice(0, 3) : [];
  const goalReserved = goalTables.reduce((sum, table) => sum + Math.min(58, 17 + Math.max(1, table.rows.length) * 13), 0);
  const notesReserved = meta.deckSheetMeta.bottomNotes ? Math.min(46, 15 + meta.deckSheetMeta.bottomNotes.split(/\n/).length * 8) : 0;
  const footerReserved = meta.deckSheetMeta.footerNote ? 18 : 0;
  const bottomReserved = 24 + goalReserved + notesReserved + footerReserved;
  const availableHeight = Math.max(160, y - margin - bottomReserved - 18);

  let fontSize = 7.35;
  let lineHeight = 8.65;
  let rowLayouts: Array<{ row: SectionRow; setLines: string[]; perfLines: string[]; height: number }> = [];
  const calculateLayouts = () => rows.map((row) => {
    const titleLine = `${row.title}${row.purpose ? ` - ${row.purpose}` : ""}`;
    const setTextLines = [titleLine, ...row.setLines];
    const wrappedSet = setTextLines.flatMap((line, index) => wrapLine(line, setWidth - 12, index === 0 ? bold : regular, index === 0 ? fontSize + 0.2 : fontSize));
    const wrappedPerf = wrapParagraphs(row.performanceText, performanceWidth - 12, regular, fontSize);
    const lineCount = Math.max(wrappedSet.length, wrappedPerf.length, 2);
    return { row, setLines: wrappedSet, perfLines: wrappedPerf, height: Math.max(26, lineCount * lineHeight + 8) };
  });

  rowLayouts = calculateLayouts();
  while (rowLayouts.reduce((sum, layout) => sum + layout.height, 0) > availableHeight && fontSize > 4.25) {
    fontSize -= 0.25;
    lineHeight = fontSize * 1.18;
    rowLayouts = calculateLayouts();
  }
  const totalRowHeight = 18;
  const layoutHeight = rowLayouts.reduce((sum, layout) => sum + layout.height, 0) + totalRowHeight;
  if (layoutHeight > availableHeight) {
    const scale = availableHeight / layoutHeight;
    rowLayouts = rowLayouts.map((layout) => ({ ...layout, height: Math.max(18, layout.height * scale) }));
  }

  rowLayouts.forEach((layout) => {
    const bottom = y - layout.height;
    drawCell(page, margin, bottom, setWidth, layout.height);
    drawCell(page, margin + setWidth, bottom, performanceWidth, layout.height);
    drawCell(page, margin + setWidth + performanceWidth, bottom, timeWidth, layout.height);

    let setY = y - 4;
    layout.setLines.forEach((line, index) => {
      if (setY - lineHeight < bottom + 2) return;
      const rowFont = index === 0 ? bold : regular;
      const rowSize = index === 0 ? fontSize + 0.2 : fontSize;
      page.drawText(safe(line), { x: margin + 6, y: setY - rowSize, size: rowSize, font: rowFont, maxWidth: setWidth - 12 });
      setY -= lineHeight;
    });

    let perfY = y - 5;
    layout.perfLines.forEach((line) => {
      if (perfY - lineHeight < bottom + 2) return;
      page.drawText(safe(line), { x: margin + setWidth + 6, y: perfY - fontSize, size: fontSize, font: regular, maxWidth: performanceWidth - 12 });
      perfY -= lineHeight;
    });

    const rightX = margin + setWidth + performanceWidth + 6;
    page.drawText(`${layout.row.distance.toLocaleString()}${meta.poolUnit}`, { x: rightX, y: y - 12, size: Math.max(5.2, fontSize + 0.6), font: bold, maxWidth: timeWidth - 10 });
    page.drawText(`${layout.row.duration} min`, { x: rightX, y: y - 24, size: Math.max(4.8, fontSize), font: regular, maxWidth: timeWidth - 10 });
    y = bottom;
  });

  const totalBottom = y - totalRowHeight;
  drawCell(page, margin, totalBottom, setWidth + performanceWidth, totalRowHeight);
  drawCell(page, margin + setWidth + performanceWidth, totalBottom, timeWidth, totalRowHeight);
  const totalLabel = "Total Distance:";
  page.drawText(totalLabel, { x: margin + setWidth + performanceWidth - bold.widthOfTextAtSize(totalLabel, 7.5) - 8, y: totalBottom + 5, size: 7.5, font: bold });
  page.drawText(`${meta.stats.totalDistance.toLocaleString()}${meta.poolUnit}`, { x: margin + setWidth + performanceWidth + 6, y: totalBottom + 5, size: 7.5, font: bold });
  y = totalBottom - 8;

  const summary = `${meta.poolLength}${meta.poolUnit} pool | ${meta.targetMinutes} min booking | Estimated ${meta.stats.estimatedDuration} min | Avg RPE ${meta.stats.averageIntensity}/10`;
  page.drawText(safe(summary), { x: margin + 5, y: y - 7, size: 6.4, font: regular, color: rgb(0.25, 0.25, 0.25), maxWidth: contentWidth - 10 });
  y -= 14;

  if (meta.deckSheetMeta.bottomNotes) {
    const noteTitleHeight = 12;
    page.drawText("NOTES", { x: margin + 5, y: y - 7, size: 6.8, font: bold });
    y -= noteTitleHeight;
    const noteLines = wrapParagraphs(meta.deckSheetMeta.bottomNotes, contentWidth - 10, regular, 5.8).slice(0, 5);
    const noteHeight = Math.max(14, noteLines.length * 6.8 + 5);
    drawCell(page, margin, y - noteHeight, contentWidth, noteHeight, rgb(0.98, 0.98, 0.98), 0.5);
    drawTextLines(page, noteLines, margin + 5, y - 3, regular, 5.8, 6.8, rgb(0.12, 0.12, 0.12), 5);
    y -= noteHeight + 4;
  }

  const drawGoalTable = (table: GoalTimeTable) => {
    if (y < 35) return;
    const columns = table.columns.slice(0, 8);
    const rows = table.rows.slice(0, 5);
    const titleHeight = 12;
    page.drawText(safe(table.title || "TARGET GOAL TIMES").toUpperCase(), { x: margin + 5, y: y - 7, size: 6.8, font: bold, maxWidth: contentWidth - 10 });
    y -= titleHeight;
    const labelWidth = Math.min(95, contentWidth * 0.2);
    const valueWidth = (contentWidth - labelWidth) / Math.max(1, columns.length);
    const rowHeight = 12;
    drawCell(page, margin, y - rowHeight, labelWidth, rowHeight, rgb(0.88, 0.48, 0.18), 0.5);
    page.drawText("TARGET", { x: margin + 4, y: y - 8.2, size: 5.6, font: bold });
    columns.forEach((column, index) => {
      const x = margin + labelWidth + index * valueWidth;
      drawCell(page, x, y - rowHeight, valueWidth, rowHeight, rgb(0.94, 0.94, 0.94), 0.5);
      const text = safe(column);
      page.drawText(text, { x: x + Math.max(2, (valueWidth - bold.widthOfTextAtSize(text, 5.5)) / 2), y: y - 8.1, size: 5.5, font: bold, maxWidth: valueWidth - 4 });
    });
    y -= rowHeight;
    rows.forEach((row) => {
      drawCell(page, margin, y - rowHeight, labelWidth, rowHeight, rgb(1, 1, 1), 0.5);
      page.drawText(safe(row.label), { x: margin + 4, y: y - 8.1, size: 5.5, font: bold, maxWidth: labelWidth - 8 });
      columns.forEach((_, index) => {
        const x = margin + labelWidth + index * valueWidth;
        drawCell(page, x, y - rowHeight, valueWidth, rowHeight, rgb(1, 1, 1), 0.5);
        const text = safe(row.values[index] || "");
        page.drawText(text, { x: x + Math.max(2, (valueWidth - regular.widthOfTextAtSize(text, 5.4)) / 2), y: y - 8.1, size: 5.4, font: regular, maxWidth: valueWidth - 4 });
      });
      y -= rowHeight;
    });
    y -= 4;
  };
  goalTables.forEach(drawGoalTable);

  if (meta.deckSheetMeta.footerNote) {
    const footerLines = wrapLine(safe(meta.deckSheetMeta.footerNote), contentWidth - 10, italic, 6.2).slice(0, 3);
    page.drawText("Coach note:", { x: margin + 5, y: y - 6, size: 6.2, font: bold });
    drawTextLines(page, footerLines, margin + 50, y, italic, 6.2, 7.2, rgb(0.22, 0.22, 0.22), 3);
  }

  page.drawText("Generated by LaneLab AI - coach review required", { x: margin + 5, y: 9, size: 5.4, font: regular, color: rgb(0.45, 0.45, 0.45) });
  page.drawText(safe(meta.name), { x: width - margin - Math.min(220, regular.widthOfTextAtSize(safe(meta.name), 5.4)), y: 9, size: 5.4, font: regular, color: rgb(0.45, 0.45, 0.45), maxWidth: 220 });

  return pdf.save();
}

export async function exportWorkoutPdf(meta: PdfWorkoutMeta): Promise<void> {
  const bytes = await createWorkoutPdfBytes(meta);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(meta.name || "lanelab-workout").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
