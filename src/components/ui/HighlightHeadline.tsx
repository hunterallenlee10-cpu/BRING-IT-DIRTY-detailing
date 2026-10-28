import type { CSSProperties, ElementType } from "react";

export interface HighlightHeadlineProps {
  lead: string;
  highlight: string;
  tone?: "amber" | "orange";
  align?: "left" | "right";
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** Adds the time-based reveal (.hl-reveal); pair with useReveal() to add .is-in. */
  reveal?: boolean;
  id?: string;
}

/**
 * White lead line + a highlighted word on a skewed slab with a gradient bar underneath.
 * Animation is driven by two CSS custom properties, --p-lead and --p-hl (0..1), so the film
 * can scrub them from scroll and the sections can transition them in time.
 */
export function HighlightHeadline({
  lead,
  highlight,
  tone = "amber",
  align = "left",
  as: Tag = "h2",
  className = "",
  style,
  reveal = false,
  id,
}: HighlightHeadlineProps) {
  return (
    <Tag id={id} className={`display hl ${reveal ? "hl-reveal" : ""} ${className}`} data-align={align} style={style}>
      <span className="hl-lead glow-white">{lead}</span>{" "}
      <span className="hl-word" data-tone={tone}>
        <span className="hl-slab" aria-hidden="true" />
        <span className="hl-text">{highlight}</span>
        <span className="hl-bar" aria-hidden="true" />
      </span>
    </Tag>
  );
}
