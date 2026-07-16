import { useState, useCallback, useEffect } from "react";
import type { ExamConfig, Constraint } from "../../lib/types";
import { generateSeed, computeCommitmentHash } from "../../lib/commitment";
import { saveExamConfig, exportConfigAsJson } from "../../lib/storage";
import { composeQuestion } from "../../lib/compose";
import { buildShareableConfig } from "../../lib/roster";
import { encodeForLink } from "../../lib/linkCodec";
import ConstraintEditor from "./ConstraintEditor";
import RosterManager from "./RosterManager";
import MarkdownPreview from "../shared/MarkdownPreview";
import Toast from "../shared/Toast";

interface Props {
  existingConfig?: ExamConfig | null;
  onSaved: (config: ExamConfig) => void;
}

const STEPS = ["Course Details", "Problem Statement", "Constraints", "Roster", "Generate & Share"];

export default function ExamCreator({ existingConfig, onSaved }: Props) {
  const [configId] = useState(() => existingConfig?.id || crypto.randomUUID());
  const [createdAt] = useState(() => existingConfig?.createdAt || new Date().toISOString());
  const [step, setStep] = useState(0);
  const [courseName, setCourseName] = useState(existingConfig?.courseName || "");
  const [courseCode, setCourseCode] = useState(existingConfig?.courseCode || "");
  const [semester, setSemester] = useState(existingConfig?.semester || 1);
  const [examDate, setExamDate] = useState(existingConfig?.examDate || "");
  const [baseProblem, setBaseProblem] = useState(existingConfig?.baseProblem || "");
  const [constraints, setConstraints] = useState<Constraint[]>(existingConfig?.constraints || []);
  const [rollNumbers, setRollNumbers] = useState<string[]>(existingConfig?.rollNumbers || []);
  const [optedOutRollNumbers, setOptedOutRollNumbers] = useState<string[]>(existingConfig?.optedOutRollNumbers || []);
  const [optOutDeadline, setOptOutDeadline] = useState(existingConfig?.optOutDeadline || "");
  const [seed, setSeed] = useState(existingConfig?.seed || "");
  const [commitmentHash, setCommitmentHash] = useState(existingConfig?.commitmentHash || "");
  const [hashedConstraints, setHashedConstraints] = useState(
    existingConfig?.commitmentHash ? JSON.stringify(existingConfig.constraints) : ""
  );
  const [previewIndex, setPreviewIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const [saved, setSaved] = useState(false);
  const [shareableLink, setShareableLink] = useState("");

  const hashStale = commitmentHash !== "" && hashedConstraints !== JSON.stringify(constraints);

  const handleGenerateSeed = async () => {
    const newSeed = generateSeed();
    const hash = await computeCommitmentHash(newSeed, constraints);
    setSeed(newSeed);
    setCommitmentHash(hash);
    setHashedConstraints(JSON.stringify(constraints));
    setSaved(false);
  };

  const buildConfig = (): ExamConfig => ({
    id: configId,
    courseName,
    courseCode,
    examDate,
    semester,
    baseProblem,
    constraints,
    seed,
    commitmentHash,
    rollNumbers,
    optedOutRollNumbers,
    createdAt,
    optOutDeadline,
  });

  useEffect(() => {
    if (!seed || !commitmentHash || hashStale) {
      setShareableLink("");
      return;
    }
    let cancelled = false;
    (async () => {
      const shareable = await buildShareableConfig(buildConfig());
      const encoded = await encodeForLink(shareable);
      const base = window.location.origin + window.location.pathname;
      if (!cancelled) setShareableLink(`${base}#exam=${encoded}`);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, commitmentHash, hashStale, courseName, courseCode, examDate, semester, baseProblem, constraints, rollNumbers, optedOutRollNumbers, optOutDeadline]);

  const handleSave = () => {
    const config = buildConfig();
    saveExamConfig(config);
    setSaved(true);
    onSaved(config);
  };

  const handleDownloadConfig = () => {
    const config = buildConfig();
    const json = exportConfigAsJson(config);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-config-${courseCode}-${examDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToast(`${label} copied to clipboard`);
  };

  const buildAnnouncementMessage = () => {
    return `${courseName} Practical Exam — ${examDate}\n\nYour personal question link:\n${shareableLink}\n\nCommitment hash — save this. After the exam we'll publish the secret seed so you can verify your question wasn't changed:\n${commitmentHash}`;
  };

  const canProceed = () => {
    switch (step) {
      case 0: return courseName.trim() && courseCode.trim() && examDate;
      case 1: return baseProblem.trim();
      case 2: return constraints.length >= 2 && constraints.every(c => c.description.trim());
      case 3: return rollNumbers.length > 0;
      case 4: return seed && commitmentHash && !hashStale;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-px ${i <= step ? "bg-blue-400" : "bg-gray-300"}`} />}
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap px-2 py-1 rounded ${
                  i === step
                    ? "bg-blue-600 text-white"
                    : i < step
                    ? "text-blue-600 hover:bg-blue-50 cursor-pointer"
                    : "text-gray-400 cursor-default"
                }`}
                disabled={i > step}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < step ? "bg-blue-100 text-blue-600" : i === step ? "bg-white/20 text-white" : "bg-gray-200 text-gray-400"
                }`}>
                  {i < step ? "✓" : i + 1}
                </span>
                {s}
              </button>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {step === 0 && (
            <div className="space-y-4 max-w-md">
              <h2 className="text-lg font-semibold text-gray-900">Course Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <input
                    type="number"
                    value={semester}
                    onChange={(e) => setSemester(parseInt(e.target.value) || 1)}
                    min={1} max={10}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Problem Statement</h2>
              <p className="text-sm text-gray-500">Write the base problem that all students will see. Each student gets this plus a unique constraint variation.</p>
              <textarea
                value={baseProblem}
                onChange={(e) => setBaseProblem(e.target.value)}
                rows={10}
                className="w-full text-sm border border-gray-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"

                autoFocus
              />
              {baseProblem.trim() && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Preview:</p>
                  <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                    <MarkdownPreview content={baseProblem} />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Constraint Variations</h2>
              <p className="text-sm text-gray-500">
                Each student gets the base problem plus one of these constraints. Add at least 2.
              </p>
              <ConstraintEditor constraints={constraints} onChange={setConstraints} />

              {constraints.length >= 2 && baseProblem.trim() && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Preview what a student sees</h3>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {constraints.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setPreviewIndex(i)}
                        className={`text-xs px-2.5 py-1 rounded ${
                          previewIndex === i ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="border border-gray-200 rounded-lg p-5 bg-white">
                    <MarkdownPreview content={composeQuestion(baseProblem, constraints[previewIndex])} />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Student Roster</h2>
              <RosterManager
                rollNumbers={rollNumbers}
                optedOutRollNumbers={optedOutRollNumbers}
                onRollNumbersChange={setRollNumbers}
                onOptedOutChange={setOptedOutRollNumbers}
                optOutDeadline={optOutDeadline}
                onDeadlineChange={setOptOutDeadline}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Generate & Share</h2>

              {!seed ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">Generate a secret seed to finalize the exam. This determines which constraint each student gets.</p>
                  <button
                    onClick={handleGenerateSeed}
                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Generate Seed
                  </button>
                </div>
              ) : hashStale ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-700 font-medium mb-1">Constraints changed since this commitment was generated.</p>
                  <p className="text-xs text-red-600 mb-4">
                    The old hash no longer matches the current constraints. Regenerate it before sharing anything with students — if you already published the old hash, tell students it is void.
                  </p>
                  <button
                    onClick={handleGenerateSeed}
                    className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                  >
                    Regenerate Commitment
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Commitment Hash */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-yellow-800 mb-1">Commitment Hash — share this with students</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white border border-yellow-300 rounded p-2 break-all select-all">
                        {commitmentHash}
                      </code>
                      <button
                        onClick={() => handleCopy(commitmentHash, "Commitment hash")}
                        className="text-xs px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 whitespace-nowrap"
                      >
                        Copy Hash
                      </button>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2 font-medium">
                      Post this hash on Google Classroom / WhatsApp now. Do NOT share the seed.
                    </p>
                  </div>

                  {/* Seed (secret) */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Secret Seed — keep this private</label>
                    <code className="block text-xs bg-white border border-gray-200 rounded p-2 break-all select-all">
                      {seed}
                    </code>
                    <button
                      onClick={handleGenerateSeed}
                      className="text-xs text-gray-400 hover:text-gray-600 mt-2 underline"
                    >
                      Regenerate (invalidates previous commitment)
                    </button>
                  </div>

                  {/* Student Link */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-blue-800 mb-1">Student Link — share this so students can see their question</label>
                    <p className="text-xs text-blue-700 mb-2">
                      This link contains the secret seed, so distributing it to any student effectively makes the seed public. Roster and opt-out status are embedded as one-way hashes, not plaintext.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white border border-blue-200 rounded p-2 break-all select-all truncate">
                        {shareableLink ? `${shareableLink.substring(0, 80)}...` : "Generating link..."}
                      </code>
                      <button
                        onClick={() => handleCopy(shareableLink, "Student link")}
                        disabled={!shareableLink}
                        className="text-xs px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap disabled:bg-blue-300 disabled:cursor-not-allowed"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>

                  {/* Combined announcement */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-indigo-800 mb-1">Announcement — post this to the whole class, in one message</label>
                    <p className="text-xs text-indigo-700 mb-2">
                      Bundles the link and the commitment hash together. Post it somewhere you don't fully control afterward (class WhatsApp group, Google Classroom, email) — that's what makes the hash tamper-evident later. Still does NOT include the seed.
                    </p>
                    <button
                      onClick={() => handleCopy(buildAnnouncementMessage(), "Announcement")}
                      disabled={!shareableLink}
                      className="text-xs px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                      Copy Announcement
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
                    >
                      {saved ? "Saved!" : "Save Exam Config"}
                    </button>
                    <button
                      onClick={handleDownloadConfig}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                    >
                      Download Backup (JSON)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(step - 1)}
            className={`text-sm px-4 py-2 text-gray-600 hover:text-gray-900 ${step === 0 ? "invisible" : ""}`}
          >
            ← Back
          </button>
          {step < STEPS.length - 1 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="text-sm px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          )}
        </div>
      </div>
      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
