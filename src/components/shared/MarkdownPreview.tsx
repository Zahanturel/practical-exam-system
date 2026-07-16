interface Props {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className = "" }: Props) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
          {p}
        </p>
      ))}
    </div>
  );
}
