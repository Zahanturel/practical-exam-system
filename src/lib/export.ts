import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExamConfig } from "./types";
import { computeConstraintIndex } from "./assignment";
import { getTraditionalSet } from "./traditional";

interface StudentAssignment {
  rollNumber: string;
  isTraditional: boolean;
  constraintLabel?: string;
  constraintIndex?: number;
  traditionalSet?: 1 | 2;
}

export async function computeAllAssignments(
  config: ExamConfig
): Promise<StudentAssignment[]> {
  const assignments: StudentAssignment[] = [];
  for (const roll of config.rollNumbers) {
    const normalized = roll.trim().toUpperCase();
    if (!normalized) continue;
    const isTraditional = config.optedOutRollNumbers
      .map((r) => r.trim().toUpperCase())
      .includes(normalized);

    if (isTraditional) {
      const set = getTraditionalSet(normalized);
      assignments.push({
        rollNumber: normalized,
        isTraditional: true,
        traditionalSet: set,
      });
    } else {
      const idx = await computeConstraintIndex(
        normalized,
        config.seed,
        config.constraints.length
      );
      assignments.push({
        rollNumber: normalized,
        isTraditional: false,
        constraintIndex: idx,
        constraintLabel: config.constraints[idx]?.label || `Variant ${idx + 1}`,
      });
    }
  }
  return assignments;
}

export async function generateGradingSheetPDF(
  config: ExamConfig
): Promise<jsPDF> {
  const assignments = await computeAllAssignments(config);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.text(
    `${config.courseName} (${config.courseCode}) — Practical Exam Grading Sheet`,
    14,
    15
  );
  doc.setFontSize(10);
  doc.text(`Semester: ${config.semester} | Date: ${config.examDate}`, 14, 22);

  const projectStudents = assignments.filter((a) => !a.isTraditional);
  const traditionalStudents = assignments.filter((a) => a.isTraditional);

  let startY = 28;

  if (projectStudents.length > 0) {
    doc.setFontSize(11);
    doc.text("Project Track", 14, startY);
    startY += 2;

    autoTable(doc, {
      startY,
      head: [
        [
          "Roll Number",
          "Question Variant",
          "Code Quality\n(__/12)",
          "Viva: Walkthrough\n(__/4)",
          "Viva: Decisions\n(__/5)",
          "Viva: Failure Analysis\n(__/5)",
          "Viva: Extension\n(__/4)",
          "Total\n(__/30)",
        ],
      ],
      body: projectStudents.map((s) => [
        s.rollNumber,
        s.constraintLabel || "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
      },
    });

    startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (traditionalStudents.length > 0) {
    if (startY > 170) {
      doc.addPage();
      startY = 15;
    }
    doc.setFontSize(11);
    doc.text("Traditional Track", 14, startY);
    startY += 2;

    autoTable(doc, {
      startY,
      head: [
        [
          "Roll Number",
          "Set (1/2)",
          "Total\n(__/30)",
        ],
      ],
      body: traditionalStudents.map((s) => [
        s.rollNumber,
        `Set ${s.traditionalSet}`,
        "",
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [39, 174, 96], fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
      },
    });
  }

  doc.addPage();
  doc.setFontSize(12);
  doc.text("Viva Rubric Reference (Project Track)", 14, 15);
  doc.setFontSize(9);
  const rubric = [
    ["Walkthrough (4 marks)", "Student explains code line by line. Proves authorship."],
    ["Decision Reasoning (5 marks)", "Why this data structure, pattern, alternatives considered. Proves understanding."],
    ["Failure Analysis (5 marks)", "What breaks if input doubles, dependency removed, constraint changed. Proves depth."],
    ["Extension (4 marks)", "How to add feature Y without rewriting. Proves architectural thinking."],
    ["Code Quality (12 marks)", "Working solution meets constraint. Runs, handles edge cases, readable."],
  ];
  autoTable(doc, {
    startY: 20,
    head: [["Category", "Description"]],
    body: rubric,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [44, 62, 80] },
    columnStyles: { 0: { cellWidth: 50 } },
  });

  return doc;
}

export async function generateGradingSheetCSV(
  config: ExamConfig
): Promise<string> {
  const assignments = await computeAllAssignments(config);
  const lines: string[] = [];

  lines.push("Roll Number,Track,Variant/Set,Code Quality,Walkthrough,Decisions,Failure Analysis,Extension,Total");

  for (const a of assignments) {
    if (a.isTraditional) {
      lines.push(`${a.rollNumber},Traditional,Set ${a.traditionalSet},,,,,,`);
    } else {
      lines.push(`${a.rollNumber},Project,${a.constraintLabel},,,,,,`);
    }
  }

  return lines.join("\n");
}
