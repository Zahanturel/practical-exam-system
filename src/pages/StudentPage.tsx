import { useState, useEffect } from "react";
import type { ExamConfig, ShareableExamConfig } from "../lib/types";
import { computeConstraintIndex } from "../lib/assignment";
import { composeQuestion } from "../lib/compose";
import { getExamConfig } from "../lib/storage";
import { checkRosterMembership, normalizeRoll, getConstraintCount, getConstraintDescription } from "../lib/roster";
import { decodeFromLink, isCompressionSupported } from "../lib/linkCodec";
import RollNumberInput from "../components/student/RollNumberInput";
import QuestionDisplay from "../components/student/QuestionDisplay";

interface Props {
  examId?: string;
  encodedConfig?: string;
}

export default function StudentPage({ examId, encodedConfig }: Props) {
  const [config, setConfig] = useState<ExamConfig | ShareableExamConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rollNumber, setRollNumber] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (encodedConfig) {
        if (!isCompressionSupported()) {
          setError("This link needs a recent Chrome, Edge, Firefox, or Safari to open. Please update your browser or try a different one.");
          return;
        }
        try {
          const decoded = await decodeFromLink<ShareableExamConfig>(encodedConfig);
          setConfig(decoded);
          return;
        } catch {
          // fall through
        }
      }

      if (examId) {
        const stored = getExamConfig(examId);
        if (stored) {
          setConfig(stored);
          return;
        }
      }

      setError("Exam not found. Please check the link or contact your faculty.");
    })();
  }, [examId, encodedConfig]);

  const handleRollSubmit = async (roll: string) => {
    if (!config) return;
    const normalized = normalizeRoll(roll);

    const { inRoster, optedOut } = await checkRosterMembership(normalized, config);
    if (!inRoster) {
      setRollNumber(normalized);
      setQuestion(null);
      setError("Enrollment number not found. Check your entry or contact your faculty.");
      return;
    }

    setError(null);
    setRollNumber(normalized);

    if (optedOut) {
      setQuestion(null);
      setError("Your question is not available on this platform. Please contact your faculty.");
      return;
    }

    const idx = await computeConstraintIndex(
      normalized,
      config.seed,
      getConstraintCount(config)
    );
    const description = getConstraintDescription(config, idx);
    const composed = composeQuestion(config.baseProblem, description);
    setQuestion(composed);
  };

  const handleBack = () => {
    setRollNumber(null);
    setQuestion(null);
    setError(null);
  };

  if (error && !rollNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <p className="text-gray-600 text-center">{error}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (question && rollNumber) {
    return (
      <QuestionDisplay
        questionMarkdown={question}
        rollNumber={rollNumber}
        onBack={handleBack}
      />
    );
  }

  return (
    <>
      {error && rollNumber && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg z-10">
          {error}
        </div>
      )}
      <RollNumberInput
        onSubmit={handleRollSubmit}
        courseName={config.courseName}
        examDate={config.examDate}
      />
    </>
  );
}
