import MarkdownPreview from "../shared/MarkdownPreview";

interface Props {
  questionMarkdown: string;
  rollNumber: string;
  onBack: () => void;
}

export default function QuestionDisplay({ questionMarkdown, rollNumber, onBack }: Props) {
  return (
    <div
      className="min-h-screen bg-white select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <span className="text-xs font-mono text-gray-400">{rollNumber}</span>
        </div>

        <MarkdownPreview content={questionMarkdown} className="text-base leading-relaxed" />
      </div>
    </div>
  );
}
