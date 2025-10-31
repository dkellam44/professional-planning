import * as React from "react";
type ExpandableBlurbProps = {
  text: string; collapsedLines?: number; className?: string;
  moreLabel?: string; lessLabel?: string; id?: string;
};
export default function ExpandableBlurb({
  text, collapsedLines = 4, className, moreLabel = "More", lessLabel = "Less", id,
}: ExpandableBlurbProps) {
  const [expanded, setExpanded] = React.useState(false);
  const needsToggle = React.useMemo(() => text.trim().length > 180 || text.includes("\n"), [text]);
  const clampStyle: React.CSSProperties = expanded ? {} : {
    display: "-webkit-box", WebkitBoxOrient: "vertical" as any, WebkitLineClamp: String(collapsedLines) as any, overflow: "hidden",
  };
  return (
    <div className="expandable-blurb">
      <div id={id} className={className} style={clampStyle} aria-expanded={expanded}>
        {text}
      </div>
      {needsToggle && (
        <button
          type="button" onClick={() => setExpanded(v => !v)}
          className="mt-2 inline-flex items-center gap-1 text-sm underline underline-offset-2 hover:opacity-90"
          aria-controls={id} aria-label={expanded ? "Collapse blurb" : "Expand blurb"}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
