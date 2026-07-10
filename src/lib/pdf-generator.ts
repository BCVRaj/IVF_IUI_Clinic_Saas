import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface HospitalSettings {
  hospital_name: string;
  logo_url?: string;
  address_line_1: string;
  address_line_2?: string;
  contact_phone: string;
  contact_email: string;
}

export interface PatientInfo {
  name: string;
  age: number | string;
  dob: string;
  patientId: string;
}

// IVF-specific markers used to filter when generating an IVF summary PDF
const IVF_MARKERS = ["AMH", "FSH", "LH", "Estradiol", "E2", "Progesterone", "P4", "TSH", "DHEA", "Testosterone", "Prolactin", "AFC"];

// ─── Main Export ─────────────────────────────────────────────────────────────
/**
 * Generates and downloads a structured medical PDF.
 *
 * @param settings   Hospital header configuration (from /api/hospital-settings)
 * @param patient    Patient demographics block
 * @param reports    Array of lab report records to include (one section per report)
 * @param mode       "selected" | "full" — controls title and IVF filtering
 */
export function generateLabReportPDF(
  settings: HospitalSettings,
  patient: PatientInfo,
  reports: any[],
  mode: "selected" | "full" | "ivf_cycle"
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let currentY = 10; // running Y cursor

  // ── HEADER (drawn once on the first page) ─────────────────────────────────
  currentY = drawHeader(doc, settings, currentY);

  // ── PATIENT INFO BLOCK ────────────────────────────────────────────────────
  currentY = drawPatientBlock(doc, patient, reports, mode, currentY);

  // ── REPORT SECTIONS (one per report) ─────────────────────────────────────
  reports.forEach((report, idx) => {
    // Page break if not enough space (at least 60mm for a section)
    if (currentY > 230) {
      doc.addPage();
      currentY = 15;
    }

    currentY = drawReportSection(doc, report, mode, idx, currentY);
  });

  // ── FOOTER (page numbers on all pages) ───────────────────────────────────
  drawFooter(doc, settings);

  // ── SAVE ─────────────────────────────────────────────────────────────────
  const safeName = patient.name.replace(/\s+/g, "_");
  const modeLabel = mode === "ivf_cycle" ? "IVF_Cycle" : mode === "full" ? "Full_Report" : `${reports.length}_Reports`;
  doc.save(`${safeName}_${modeLabel}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Section Drawers ─────────────────────────────────────────────────────────
function drawHeader(doc: jsPDF, settings: HospitalSettings, startY: number): number {
  let y = startY + 10;

  // Teal accent bar
  doc.setFillColor(13, 148, 136);
  doc.rect(14, y - 2, 182, 0.8, "F");
  y += 5;

  // Hospital name
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(settings.hospital_name, 14, y);
  y += 7;

  // Address & contact
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  if (settings.address_line_1) doc.text(settings.address_line_1, 14, y);
  if (settings.address_line_2) { y += 4; doc.text(settings.address_line_2, 14, y); }
  y += 4;
  doc.text(`Tel: ${settings.contact_phone}  |  Email: ${settings.contact_email}`, 14, y);
  y += 6;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, y, 196, y);
  y += 6;

  return y;
}

function drawPatientBlock(
  doc: jsPDF,
  patient: PatientInfo,
  reports: any[],
  mode: "selected" | "full" | "ivf_cycle",
  startY: number
): number {
  let y = startY;

  // Title
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  const modeTitle =
    mode === "ivf_cycle"
      ? "IVF CYCLE SUMMARY REPORT"
      : mode === "full"
      ? "COMPLETE LAB REPORT"
      : `LAB REPORT — ${reports.length} SECTION${reports.length !== 1 ? "S" : ""}`;
  doc.text(modeTitle, 14, y);
  y += 6;

  // Patient info box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, 182, 26, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);

  const col1x = 18, col2x = 105;
  let iy = y + 7;

  doc.text("Patient Name:", col1x, iy);
  doc.setFont("helvetica", "normal");
  doc.text(patient.name, col1x + 28, iy);

  doc.setFont("helvetica", "bold");
  doc.text("Report Date:", col2x, iy);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }), col2x + 24, iy);

  iy += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Patient ID:", col1x, iy);
  doc.setFont("helvetica", "normal");
  doc.text(patient.patientId, col1x + 28, iy);

  doc.setFont("helvetica", "bold");
  doc.text("Age / DOB:", col2x, iy);
  doc.setFont("helvetica", "normal");
  doc.text(`${patient.age} / ${patient.dob}`, col2x + 24, iy);

  iy += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Sections Included:", col1x, iy);
  doc.setFont("helvetica", "normal");
  doc.text(reports.map((r) => r.result_type).join(", ").slice(0, 80), col1x + 36, iy);

  y += 33;
  return y;
}

function drawReportSection(
  doc: jsPDF,
  report: any,
  mode: "selected" | "full" | "ivf_cycle",
  index: number,
  startY: number
): number {
  let y = startY + 4;

  // Section heading
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${index + 1}. ${report.result_type || "Lab Result"}`, 14, y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const dateStr = report.result_date
    ? new Date(report.result_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "Date not recorded";
  doc.text(dateStr, 14, y + 5);
  y += 10;

  // Build table rows
  const resultData: Record<string, unknown> = report.result_data || {};
  let rows: [string, string][] = Object.entries(resultData).map(([k, v]) => [k, String(v ?? "—")]);

  if (mode === "ivf_cycle") {
    rows = rows.filter(([key]) =>
      IVF_MARKERS.some((m) => key.toLowerCase().includes(m.toLowerCase()))
    );
    if (rows.length === 0) {
      rows = [["Notice", "No IVF-specific markers found in this report section."]];
    }
  }

  if (rows.length === 0) {
    rows = [["Notice", "No structured result data available."]];
  }

  autoTable(doc, {
    startY: y,
    head: [["Test Parameter / Marker", "Result Value"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: "bold",
      halign: "left",
      fontSize: 9,
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: [51, 65, 85],
      cellPadding: 4,
    },
    alternateRowStyles: { fillColor: [250, 252, 253] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: "auto" },
    },
  });

  // @ts-ignore
  let finalY: number = doc.lastAutoTable?.finalY ?? y + 20;

  // Interpretation / notes
  if (report.interpretation) {
    finalY += 5;
    if (finalY > 260) { doc.addPage(); finalY = 15; }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Physician Annotation:", 14, finalY);
    finalY += 5;

    doc.setFont("helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(report.interpretation, 178);
    doc.text(lines, 14, finalY);
    finalY += lines.length * 4.5;
  }

  // Thin separator before next section
  finalY += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, finalY, 196, finalY);

  return finalY + 5;
}

function drawFooter(doc: jsPDF, settings: HospitalSettings) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${settings.hospital_name} · Confidential Medical Document · Page ${i} of ${pageCount} · Generated ${new Date().toLocaleString()}`,
      14,
      287
    );
  }
}

// ─── IVF Cycle Report ─────────────────────────────────────────────────────────
/**
 * Generates a comprehensive IVF Cycle clinical report PDF.
 * Pulls all available phase data from the cycle object and renders
 * a dedicated section for each phase that has data.
 *
 * @param settings  Hospital header config (from /api/hospital-settings)
 * @param cycle     Full cycle object (from mockCycles or API)
 */
export function generateCycleReportPDF(settings: HospitalSettings, cycle: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 10;

  // ── Header ────────────────────────────────────────────────────────────────
  y = drawHeader(doc, settings, y);

  // ── Cycle / Patient Block ─────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("IVF CYCLE CLINICAL REPORT", 14, y);
  y += 7;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, 182, 30, 2, 2, "FD");

  doc.setFontSize(9);
  const col1 = 18, col2 = 105;
  let iy = y + 7;

  doc.setFont("helvetica", "bold"); doc.setTextColor(71, 85, 105);
  doc.text("Patient:", col1, iy);
  doc.setFont("helvetica", "normal");
  doc.text(cycle.patientName ?? "—", col1 + 18, iy);

  doc.setFont("helvetica", "bold");
  doc.text("Report Date:", col2, iy);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }), col2 + 24, iy);

  iy += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Age:", col1, iy);
  doc.setFont("helvetica", "normal");
  doc.text(String(cycle.age ?? "—"), col1 + 18, iy);

  doc.setFont("helvetica", "bold");
  doc.text("Protocol:", col2, iy);
  doc.setFont("helvetica", "normal");
  doc.text(cycle.protocol ?? "—", col2 + 24, iy);

  iy += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Cycle Start:", col1, iy);
  doc.setFont("helvetica", "normal");
  doc.text(cycle.start_date ? new Date(cycle.start_date).toLocaleDateString("en-IN") : "—", col1 + 18, iy);

  doc.setFont("helvetica", "bold");
  doc.text("Current Phase:", col2, iy);
  doc.setFont("helvetica", "normal");
  doc.text(cycle.status ?? "—", col2 + 28, iy);

  y += 38;

  // ── Helper: section heading ───────────────────────────────────────────────
  const sectionHeading = (icon: string, title: string) => {
    if (y > 240) { doc.addPage(); y = 15; }
    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y - 3, 182, 10, 1, 1, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 148, 136);
    doc.text(`${icon}  ${title}`, 18, y + 4);
    y += 13;
  };

  // ── Helper: key-value table ───────────────────────────────────────────────
  const kvTable = (rows: [string, string][]) => {
    if (rows.length === 0) return;
    autoTable(doc, {
      startY: y,
      body: rows,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, textColor: [51, 65, 85], cellPadding: 4 },
      alternateRowStyles: { fillColor: [250, 252, 253] },
      columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: "auto" } },
    });
    // @ts-ignore
    y = (doc.lastAutoTable?.finalY ?? y + rows.length * 10) + 6;
  };

  // ── Helper: separator ─────────────────────────────────────────────────────
  const separator = () => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, y, 196, y);
    y += 5;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 1. INVESTIGATION
  // ══════════════════════════════════════════════════════════════════════════
  if (cycle.investigations && cycle.investigations.length > 0) {
    sectionHeading("🔬", "1. INVESTIGATION SUMMARY");
    const rows: [string, string][] = cycle.investigations.map((inv: any) => [
      inv.name,
      `${inv.value ?? "—"}${inv.flag ? "  ⚑ FLAGGED" : ""}  [${inv.status ?? "—"}]`,
    ]);
    kvTable(rows);
    separator();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. OVARIAN STIMULATION
  // ══════════════════════════════════════════════════════════════════════════
  if (cycle.stimulation) {
    const s = cycle.stimulation;
    sectionHeading("💉", "2. OVARIAN STIMULATION LOG");
    const rows: [string, string][] = [
      ["Estradiol (E2) Trend (pg/mL)", s.e2?.join(" → ") ?? "—"],
      ["LH Trend (mIU/mL)", s.lh?.join(" → ") ?? "—"],
      ["Progesterone P4 Trend (ng/mL)", s.p4?.join(" → ") ?? "—"],
      ["Left Ovary Follicles (mm)", s.leftFollicles?.join(", ") ?? "—"],
      ["Right Ovary Follicles (mm)", s.rightFollicles?.join(", ") ?? "—"],
      ["Lead Follicle Size", s.leadFollicle ?? "—"],
      ["Trigger Ready", s.triggerReady ? "✓ Yes" : "Not yet"],
    ];
    kvTable(rows);
    separator();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. EGG PICKUP (OPU)
  // ══════════════════════════════════════════════════════════════════════════
  if (cycle.retrieval) {
    const r = cycle.retrieval;
    sectionHeading("🥚", "3. EGG PICKUP (OPU) REPORT");
    const rows: [string, string][] = [
      ["Scheduled At", r.scheduledAt ?? "—"],
      ["Total Follicles Aspirated", String(r.totalFollicles ?? "—")],
      ["Eggs Retrieved", r.eggsRetrieved != null ? String(r.eggsRetrieved) : "Pending"],
      ["Mature Oocytes (MII)", r.matureOocytes != null ? String(r.matureOocytes) : "Pending"],
      ["Anaesthesia Type", r.anaesthesia ?? "—"],
      ["Embryologist", r.embryologist ?? "—"],
    ];
    kvTable(rows);
    separator();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. EMBRYOLOGY
  // ══════════════════════════════════════════════════════════════════════════
  if (cycle.embryology) {
    const e = cycle.embryology;
    sectionHeading("🧫", "4. EMBRYOLOGY REPORT");

    // Summary row
    const summary: [string, string][] = [
      ["Fertilization Method", e.method ?? "—"],
      ["Oocytes Injected / Inseminated", String(e.oocytesInjected ?? "—")],
      ["Successfully Fertilized (2PN)", String(e.fertilized ?? "—")],
    ];
    kvTable(summary);

    // Per-embryo table
    if (e.embryos && e.embryos.length > 0) {
      if (y > 220) { doc.addPage(); y = 15; }
      autoTable(doc, {
        startY: y,
        head: [["Embryo ID", "Day 1", "Day 3", "Day 5", "Day 6 (Grade)", "Assessment"]],
        body: e.embryos.map((em: any) => [em.id, em.d1 ?? "—", em.d3 ?? "—", em.d5 ?? "—", em.d6 ?? "—", em.status ?? "—"]),
        theme: "grid",
        headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: "bold", fontSize: 8 },
        styles: { font: "helvetica", fontSize: 8, textColor: [51, 65, 85], cellPadding: 3 },
        alternateRowStyles: { fillColor: [250, 252, 253] },
      });
      // @ts-ignore
      y = (doc.lastAutoTable?.finalY ?? y + 30) + 6;
    }
    separator();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. EMBRYO FREEZING
  // ══════════════════════════════════════════════════════════════════════════
  if (cycle.freezing) {
    const f = cycle.freezing;
    sectionHeading("❄️", "5. EMBRYO FREEZING LOG");
    const rows: [string, string][] = [
      ["Total Blastocysts", String(f.totalBlastocysts ?? "—")],
      ["Embryos Frozen (Vitrified)", String(f.frozen ?? "—")],
      ["Discarded", String(f.discarded ?? "—")],
      ["Vitrification Date", f.vitrificationDate ?? "—"],
      ["PGT Status", f.pgtStatus ?? "—"],
      ["Storage Tank / Location", f.storageTank ?? "—"],
    ];
    kvTable(rows);
    separator();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. EMBRYO TRANSFER
  // ══════════════════════════════════════════════════════════════════════════
  if (cycle.transfer) {
    const t = cycle.transfer;
    sectionHeading("🔄", "6. EMBRYO TRANSFER REPORT");
    const rows: [string, string][] = [
      ["Transfer Scheduled At", t.scheduledAt ?? "—"],
      ["Endometrial Thickness", t.endometriumThickness ?? "—"],
      ["Embryo Grade", t.embryoGrade ?? "—"],
      ["Embryos Transferred", String(t.embryosToTransfer ?? "—")],
      ["Luteal Support Protocol", t.lutealSupport ?? "—"],
      ["Catheter Type", t.catheter ?? "—"],
    ];
    kvTable(rows);
    separator();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 7. OUTCOME
  // ══════════════════════════════════════════════════════════════════════════
  if (cycle.outcome) {
    const o = cycle.outcome;
    sectionHeading("📊", "7. OUTCOME");
    const rows: [string, string][] = [
      ["Beta HCG Test Date", o.betaHCGDate ?? "—"],
      ["Beta HCG Value (mIU/mL)", o.betaHCG != null ? String(o.betaHCG) : "Awaiting"],
      ["Previous Beta HCG", o.previousBeta != null ? String(o.previousBeta) : "—"],
      ["Result", o.result ?? "Awaiting"],
      ["Ultrasound Scheduled", o.ultrasoundDate ?? "—"],
      ["Clinical Pregnancy Confirmed", o.clinicalPregnancy != null ? (o.clinicalPregnancy ? "Yes" : "No") : "Pending"],
    ];
    kvTable(rows);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  drawFooter(doc, settings);

  // ── Save ──────────────────────────────────────────────────────────────────
  const safeName = (cycle.patientName ?? "Patient").replace(/\s+/g, "_");
  doc.save(`${safeName}_IVF_Cycle_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

