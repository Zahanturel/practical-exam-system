import { useState } from "react";
import { computeConstraintIndex } from "../../lib/assignment";
import { computeCommitmentHash } from "../../lib/commitment";
import type { ExamConfig } from "../../lib/types";
import { getTraditionalSet } from "../../lib/traditional";

interface Props {
  config: ExamConfig;
}

export default function Verifier({ config }: Props) {
  const [rollNumber, setRollNumber] = useState("");
  const [seedInput, setSeedInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [seedVerification, setSeedVerification] = useState<{
    computedHash: string;
    matches: boolean;
  } | null>(null);

  const handleVerifyAssignment = async () => {
    if (!rollNumber.trim()) return;
    const normalized = rollNumber.trim().toUpperCase();
    const isOptedOut = config.optedOutRollNumbers
      .map((r) => r.trim().toUpperCase())
      .includes(normalized);

    if (!config.rollNumbers.map((r) => r.trim().toUpperCase()).includes(normalized)) {
      setResult("Roll number not found in roster.");
      return;
    }

    if (isOptedOut) {
      const set = getTraditionalSet(normalized);
      setResult(`Traditional Track — Set ${set}`);
    } else {
      const seed = seedInput.trim() || config.seed;
      const idx = await computeConstraintIndex(normalized, seed, config.constraints.length);
      const constraint = config.constraints[idx];
      setResult(`Project Track — ${constraint.label}: ${constraint.description}`);
    }
  };

  const handleVerifySeed = async () => {
    if (!seedInput.trim()) return;
    const computedHash = await computeCommitmentHash(seedInput.trim(), config.constraints);
    setSeedVerification({
      computedHash,
      matches: computedHash === config.commitmentHash,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Verify Student Assignment</h3>
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Roll Number</label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="text-sm font-mono border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Seed (optional, uses saved seed)</label>
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="text-sm font-mono border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
          <button
            onClick={handleVerifyAssignment}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Verify
          </button>
        </div>
        {result && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
            {result}
          </div>
        )}
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Verify Commitment Hash</h3>
        <p className="text-xs text-gray-500 mb-2">
          Enter the seed to verify it matches the published commitment hash, computed against the exam's current constraints. A mismatch means the constraints changed after this hash was published.
        </p>
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Seed</label>
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="text-sm font-mono border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-96"
            />
          </div>
          <button
            onClick={handleVerifySeed}
            className="text-sm px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Check
          </button>
        </div>
        {seedVerification && (
          <div className={`mt-3 p-3 rounded text-sm ${seedVerification.matches ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <p className="font-mono text-xs break-all">SHA-256(seed) = {seedVerification.computedHash}</p>
            <p className="font-mono text-xs break-all mt-1">Commitment = {config.commitmentHash}</p>
            <p className="mt-2 font-medium">
              {seedVerification.matches ? "Match — seed is authentic." : "MISMATCH — seed does not match the published commitment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
