import { useState, useEffect, useCallback } from "react";
import type { ExamConfig } from "../lib/types";
import { getAllExamConfigs, deleteExamConfig, importConfigFromJson, saveExamConfig } from "../lib/storage";
import { buildShareableConfig } from "../lib/roster";
import { encodeForLink } from "../lib/linkCodec";
import ExamCreator from "../components/faculty/ExamCreator";
import GradingSheetGenerator from "../components/faculty/GradingSheetGenerator";
import Verifier from "../components/faculty/Verifier";
import Toast from "../components/shared/Toast";

type View = "list" | "create" | "edit" | "grading" | "verify";

export default function FacultyPage() {
  const [configs, setConfigs] = useState<ExamConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<ExamConfig | null>(null);
  const [view, setView] = useState<View>("list");
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    setConfigs(getAllExamConfigs());
  }, []);

  const handleSaved = (config: ExamConfig) => {
    setConfigs(getAllExamConfigs());
    setActiveConfig(config);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this exam configuration?")) {
      deleteExamConfig(id);
      setConfigs(getAllExamConfigs());
      if (activeConfig?.id === id) {
        setActiveConfig(null);
        setView("list");
      }
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const config = importConfigFromJson(text);
        saveExamConfig(config);
        setConfigs(getAllExamConfigs());
        setActiveConfig(config);
        setView("list");
      } catch {
        alert("Invalid config file.");
      }
    };
    input.click();
  };

  const handleCopyLink = async (config: ExamConfig) => {
    if (!config.seed || !config.commitmentHash) {
      setToast("Generate the commitment hash for this exam before sharing its link");
      return;
    }
    const shareable = await buildShareableConfig(config);
    const encoded = await encodeForLink(shareable);
    const base = window.location.origin + window.location.pathname;
    const link = `${base}#exam=${encoded}`;
    navigator.clipboard.writeText(link);
    setToast("Student link copied to clipboard");
  };

  const handleCopyVerification = (config: ExamConfig) => {
    if (!config.seed || !config.commitmentHash) {
      setToast("This exam has no commitment hash to verify yet");
      return;
    }
    const constraintsDigest = config.constraints.map((c) => `${c.label}::${c.description}`).join("||");
    const message = `${config.courseName} Practical Exam — ${config.examDate} — Verification\n\nThe secret seed is now revealed: ${config.seed}\n\nTo confirm your question wasn't changed after we published the commitment hash, compute SHA-256(seed + "##" + constraints), where "constraints" is each variant written as "Label::Description" (in order) joined by "||":\n\n${constraintsDigest}\n\nCompare your result to the commitment hash we posted before the exam:\n${config.commitmentHash}\n\nA match means nothing changed. A mismatch means it did.`;
    navigator.clipboard.writeText(message);
    setToast("Verification message copied to clipboard");
  };

  if (view === "create" || view === "edit") {
    return (
      <div>
        <div className="max-w-3xl mx-auto px-6 pt-4">
          <button
            onClick={() => { setView("list"); setActiveConfig(null); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to dashboard
          </button>
        </div>
        <ExamCreator
          existingConfig={view === "edit" ? activeConfig : null}
          onSaved={handleSaved}
        />
      </div>
    );
  }

  if (view === "grading" && activeConfig) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => setView("list")}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            ← Back to dashboard
          </button>
          <h1 className="text-lg font-semibold text-gray-900 mb-4">
            Grading Sheet — {activeConfig.courseName}
          </h1>
          <GradingSheetGenerator config={activeConfig} />
        </div>
      </div>
    );
  }

  if (view === "verify" && activeConfig) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <button
            onClick={() => setView("list")}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            ← Back to dashboard
          </button>
          <h1 className="text-lg font-semibold text-gray-900 mb-4">
            Verify — {activeConfig.courseName}
          </h1>
          <Verifier config={activeConfig} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-900">Faculty Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="text-sm px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Import Config
            </button>
            <button
              onClick={() => setView("create")}
              className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Create Exam
            </button>
          </div>
        </div>

        {configs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No exams configured yet.</p>
            <button
              onClick={() => setView("create")}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create your first exam
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={config.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {config.courseName} ({config.courseCode})
                    </h3>
                    <p className="text-sm text-gray-500">
                      Semester {config.semester} — {config.examDate} — {config.rollNumbers.length} students — {config.constraints.length} constraints
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleCopyLink(config)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Copy Student Link
                  </button>
                  <button
                    onClick={() => handleCopyVerification(config)}
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Copy Verification (post-exam)
                  </button>
                  <button
                    onClick={() => { setActiveConfig(config); setView("grading"); }}
                    className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700"
                  >
                    Grading Sheet
                  </button>
                  <button
                    onClick={() => { setActiveConfig(config); setView("verify"); }}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => { setActiveConfig(config); setView("edit"); }}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="text-xs px-3 py-1.5 text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
