export function formatFlagSentence(
  items: { label: string; count: number }[],
  kind: "crime" | "311"
): string {
  const active = items.filter(i => i.count > 0);
  if (active.length === 0) return "";
  const parts = active.map(i => `${i.count.toLocaleString()} ${i.label}`);
  const list =
    parts.length === 1
      ? parts[0]
      : parts.length === 2
      ? `${parts[0]} and ${parts[1]}`
      : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
  return kind === "311"
    ? `${list} requests in 2026`
    : `${list} incidents on this street`;
}

export function AnalysisCard({
  label,
  content,
  flagItems,
  flagKind,
  recommendation,
  variant = "default",
}: {
  label: string;
  content: string;
  flagItems?: { label: string; count: number }[];
  flagKind?: "crime" | "311";
  recommendation?: string;
  variant?: "default" | "verdict";
}) {
  if (variant === "verdict") {
    return (
      <div className="rounded-xl bg-white border border-[#649E97]/25 p-4 col-span-1 sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          {label}
        </p>
        <p className="text-sm/6 text-gray-900 font-medium">
          {content}
          {recommendation && (
            <>{" "}<span className="bg-[#649E97]/15 rounded-sm px-0.5 box-decoration-clone">{recommendation}</span></>
          )}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-white border border-[#649E97]/25 p-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
      </div>
      <p className="text-sm/6 text-gray-800 leading-relaxed font-medium">{content}</p>
      {flagItems && flagKind && (
        <p className="mt-3 text-xs text-red-600 border-t border-[#649E97]/20 pt-2">
          {formatFlagSentence(flagItems, flagKind)}
        </p>
      )}
    </div>
  );
}
