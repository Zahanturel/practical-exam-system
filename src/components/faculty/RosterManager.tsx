import { useState, useEffect } from "react";

interface Props {
  rollNumbers: string[];
  optedOutRollNumbers: string[];
  onRollNumbersChange: (rolls: string[]) => void;
  onOptedOutChange: (rolls: string[]) => void;
  optOutDeadline: string;
  onDeadlineChange: (date: string) => void;
}

export default function RosterManager({
  rollNumbers,
  optedOutRollNumbers,
  onRollNumbersChange,
  onOptedOutChange,
  optOutDeadline,
  onDeadlineChange,
}: Props) {
  const [bulkInput, setBulkInput] = useState(rollNumbers.join("\n"));
  const [optOutInput, setOptOutInput] = useState(optedOutRollNumbers.join(", "));

  useEffect(() => {
    const rolls = bulkInput
      .split(/[\n,]/)
      .map((r) => r.trim())
      .filter(Boolean);
    onRollNumbersChange(rolls);
  }, [bulkInput]);

  useEffect(() => {
    const rolls = optOutInput
      .split(/[\n,]/)
      .map((r) => r.trim())
      .filter(Boolean);
    onOptedOutChange(rolls);
  }, [optOutInput]);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Roll Numbers
        </label>
        <p className="text-xs text-gray-500 mb-2">One per line, or comma-separated. {rollNumbers.length > 0 && <span className="text-blue-600 font-medium">{rollNumbers.length} students</span>}</p>
        <textarea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          rows={8}
          className="w-full text-sm font-mono border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opted-Out Roll Numbers (Traditional Track)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Students who chose the traditional track. They won't see a question on this platform.
          {optedOutRollNumbers.length > 0 && <span className="text-blue-600 font-medium"> {optedOutRollNumbers.length} opted out</span>}
        </p>
        <textarea
          value={optOutInput}
          onChange={(e) => setOptOutInput(e.target.value)}
          rows={2}
          className="w-full text-sm font-mono border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opt-Out Deadline
        </label>
        <input
          type="date"
          value={optOutDeadline}
          onChange={(e) => onDeadlineChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
