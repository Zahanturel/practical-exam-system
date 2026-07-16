import { useState } from "react";
import type { ExamConfig } from "../../lib/types";
import { computeAllAssignments, generateGradingSheetPDF, generateGradingSheetCSV } from "../../lib/export";

interface Props {
  config: ExamConfig;
}

interface StudentRow {
  rollNumber: string;
  isTraditional: boolean;
  constraintLabel?: string;
  traditionalSet?: 1 | 2;
}

export default function GradingSheetGenerator({ config }: Props) {
  const [assignments, setAssignments] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await computeAllAssignments(config);
    setAssignments(result);
    setGenerated(true);
    setLoading(false);
  };

  const handleExportPDF = async () => {
    const doc = await generateGradingSheetPDF(config);
    doc.save(`grading-sheet-${config.courseCode}-${config.examDate}.pdf`);
  };

  const handleExportCSV = async () => {
    const csv = await generateGradingSheetCSV(config);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grading-sheet-${config.courseCode}-${config.examDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!config.rollNumbers.length) {
    return <p className="text-sm text-gray-500">Add roll numbers in the Roster tab first.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? "Generating..." : "Generate Grading Sheet"}
        </button>
        {generated && (
          <>
            <button
              onClick={handleExportPDF}
              className="text-sm px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            >
              Export PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="text-sm px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Export CSV
            </button>
          </>
        )}
      </div>

      {generated && (
        <div className="overflow-x-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Project Track ({assignments.filter((a) => !a.isTraditional).length} students)
          </h4>
          <table className="w-full text-sm border-collapse mb-6">
            <thead>
              <tr className="bg-blue-50">
                <th className="text-left px-3 py-2 border">Roll Number</th>
                <th className="text-left px-3 py-2 border">Question Variant</th>
                <th className="text-center px-3 py-2 border">Code Quality (/12)</th>
                <th className="text-center px-3 py-2 border">Walkthrough (/4)</th>
                <th className="text-center px-3 py-2 border">Decisions (/5)</th>
                <th className="text-center px-3 py-2 border">Failure Analysis (/5)</th>
                <th className="text-center px-3 py-2 border">Extension (/4)</th>
                <th className="text-center px-3 py-2 border">Total (/30)</th>
              </tr>
            </thead>
            <tbody>
              {assignments
                .filter((a) => !a.isTraditional)
                .map((a) => (
                  <tr key={a.rollNumber} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border font-mono">{a.rollNumber}</td>
                    <td className="px-3 py-2 border">{a.constraintLabel}</td>
                    <td className="px-3 py-2 border"></td>
                    <td className="px-3 py-2 border"></td>
                    <td className="px-3 py-2 border"></td>
                    <td className="px-3 py-2 border"></td>
                    <td className="px-3 py-2 border"></td>
                    <td className="px-3 py-2 border"></td>
                  </tr>
                ))}
            </tbody>
          </table>

          {assignments.some((a) => a.isTraditional) && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Traditional Track ({assignments.filter((a) => a.isTraditional).length} students)
              </h4>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="text-left px-3 py-2 border">Roll Number</th>
                    <th className="text-left px-3 py-2 border">Set</th>
                    <th className="text-center px-3 py-2 border">Code Output (/15)</th>
                    <th className="text-center px-3 py-2 border">Code Quality (/10)</th>
                    <th className="text-center px-3 py-2 border">Completeness (/5)</th>
                    <th className="text-center px-3 py-2 border">Total (/30)</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments
                    .filter((a) => a.isTraditional)
                    .map((a) => (
                      <tr key={a.rollNumber} className="hover:bg-gray-50">
                        <td className="px-3 py-2 border font-mono">{a.rollNumber}</td>
                        <td className="px-3 py-2 border">Set {a.traditionalSet}</td>
                        <td className="px-3 py-2 border"></td>
                        <td className="px-3 py-2 border"></td>
                        <td className="px-3 py-2 border"></td>
                        <td className="px-3 py-2 border"></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
