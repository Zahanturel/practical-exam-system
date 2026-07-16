import { useState } from "react";

interface Props {
  onSubmit: (rollNumber: string) => void;
  courseName: string;
  examDate: string;
}

export default function RollNumberInput({ onSubmit, courseName, examDate }: Props) {
  const [rollNumber, setRollNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = rollNumber.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">{courseName}</h1>
        <p className="text-sm text-gray-500 mb-8">Practical Examination — {examDate}</p>

        <div className="text-left bg-gray-50 border border-gray-200 rounded-lg p-5 mb-8">
          <p className="text-sm text-gray-700 mb-3">
            You will receive a unique problem statement. Your work will be evaluated on:
          </p>
          <ul className="text-sm text-gray-600 space-y-1.5 mb-4">
            <li className="flex gap-2"><span className="text-gray-400">1.</span> Code Quality</li>
            <li className="flex gap-2"><span className="text-gray-400">2.</span> Decision Reasoning</li>
            <li className="flex gap-2"><span className="text-gray-400">3.</span> Failure Analysis</li>
            <li className="flex gap-2"><span className="text-gray-400">4.</span> Extension</li>
          </ul>
          <p className="text-sm text-gray-700 font-medium">
            Read your question carefully, build something you truly understand, and hope you do well!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roll" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your Enrollment Number
            </label>
            <input
              id="roll"
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="w-full px-4 py-3 text-center text-lg font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={!rollNumber.trim()}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            View Question
          </button>
        </form>
      </div>
    </div>
  );
}
