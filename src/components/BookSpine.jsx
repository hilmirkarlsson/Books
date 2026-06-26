import { useId, useMemo } from "react";
import { generatedPalette, seedFor, shade } from "../lib/spineColors.js";

const MIN_WIDTH = 26;
const MAX_WIDTH = 58;
const MIN_HEIGHT = 168;
const MAX_HEIGHT = 204;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? `${str.slice(0, max - 1).trimEnd()}…` : str;
}

// Width tracks page count (thicker books = wider spines); height varies a
// touch per book so the row doesn't look perfectly uniform.
function dimsFor(book, seed) {
  const pages = book.pages ?? 280;
  const width = clamp(22 + pages / 11, MIN_WIDTH, MAX_WIDTH);
  const height = MIN_HEIGHT + (seed % (MAX_HEIGHT - MIN_HEIGHT));
  return { width: Math.round(width), height: Math.round(height) };
}

function KindleGlyph({ x, y, color }) {
  return (
    <g opacity="0.9" stroke={color} fill="none" strokeWidth="1.1" strokeLinecap="round">
      <rect x={x - 4.5} y={y - 8} width="9" height="16" rx="1.8" />
      <line x1={x - 2.4} y1={y - 3} x2={x + 2.4} y2={y - 3} />
      <line x1={x - 2.4} y1={y} x2={x + 1} y2={y} />
      <line x1={x - 2.4} y1={y + 3} x2={x + 2} y2={y + 3} />
    </g>
  );
}

function AudibleGlyph({ x, y, color }) {
  const bars = [4, 8, 12, 7, 3.5];
  const gap = 3.4;
  const barWidth = 1.6;
  const startX = x - ((bars.length - 1) * gap) / 2;
  return (
    <g fill={color} opacity="0.9">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={startX + i * gap - barWidth / 2}
          y={y - h}
          width={barWidth}
          height={h}
          rx={barWidth / 2}
        />
      ))}
    </g>
  );
}

export default function BookSpine({
  book,
  tilt = 0,
  selected = false,
  className = "",
  style,
  ...rest
}) {
  const gradId = useId();

  const seed = useMemo(() => seedFor(book), [book.title, book.author]);
  const { width, height } = useMemo(() => dimsFor(book, seed), [book.pages, seed]);
  const palette = useMemo(
    () => book.spine ?? { source: "generated", ...generatedPalette(seed, book.format) },
    [book.spine, seed, book.format]
  );

  const { baseColor, accentColor, textColor } = palette;
  const format = book.format ?? "physical";
  const isPhysical = format === "physical";

  const topMargin = 15;
  const bottomReserve = isPhysical ? 16 : 30;
  const usable = height - topMargin - bottomReserve;
  const titleLen = usable * 0.56;
  const authorLen = usable * 0.28;
  const titleCenterY = topMargin + titleLen / 2 + 2;
  const authorCenterY = topMargin + titleLen + 10 + authorLen / 2;

  const fontSize = clamp(width * 0.4, 9, 13.5);
  const authorFontSize = fontSize * 0.74;
  const fontFamily = format === "kindle" ? "var(--font-body)" : "var(--font-display)";

  // Conservative average glyph-width estimate (no textLength stretching —
  // that distorts letterforms when squeezed). Slight overshoot is safer
  // than overflow since margins absorb a couple of extra px either way.
  const title = truncate(book.title, Math.floor(titleLen / (fontSize * 0.46)));
  const author = truncate(book.author, Math.floor(authorLen / (authorFontSize * 0.46)));

  const darker = shade(baseColor, -22);
  const lighter = shade(baseColor, 10);

  return (
    <button
      type="button"
      className={`group relative shrink-0 cursor-pointer rounded-[2px] outline-offset-2 transition-transform duration-200 ease-out ${className}`}
      style={{
        transform: `rotate(${tilt}deg) translateY(${selected ? -6 : 0}px)`,
        filter: `drop-shadow(${1 + Math.abs(tilt) * 0.4}px 5px 4px rgba(0,0,0,${selected ? 0.55 : 0.4}))`,
        ...style,
      }}
      {...rest}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${book.title} by ${book.author}, ${format} spine`}
      >
        <defs>
          <linearGradient id={`${gradId}-body`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={lighter} />
            <stop offset="45%" stopColor={baseColor} />
            <stop offset="100%" stopColor={darker} />
          </linearGradient>
          {format === "audible" && (
            <linearGradient id={`${gradId}-sheen`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="48%" stopColor="#ffffff" stopOpacity="0.16" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          )}
          {isPhysical && (
            <pattern
              id={`${gradId}-cloth`}
              width="3"
              height="3"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="3" stroke={darker} strokeWidth="0.5" />
            </pattern>
          )}
        </defs>

        <rect
          x="0.5"
          y="0.5"
          width={width - 1}
          height={height - 1}
          rx="1.5"
          fill={`url(#${gradId}-body)`}
          stroke={darker}
          strokeWidth="0.75"
        />

        {isPhysical && (
          <rect
            x="0.5"
            y="0.5"
            width={width - 1}
            height={height - 1}
            rx="1.5"
            fill={`url(#${gradId}-cloth)`}
            opacity="0.5"
          />
        )}
        {format === "audible" && (
          <rect x="0.5" y="0.5" width={width - 1} height={height - 1} rx="1.5" fill={`url(#${gradId}-sheen)`} />
        )}

        {/* accent bands */}
        <rect x="2" y="7" width={width - 4} height="1.4" fill={accentColor} opacity="0.85" />
        <rect x="2" y={height - 9} width={width - 4} height="1.4" fill={accentColor} opacity="0.85" />

        <text
          x={width / 2}
          y={titleCenterY}
          transform={`rotate(-90 ${width / 2} ${titleCenterY})`}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontFamily={fontFamily}
          fontWeight={format === "kindle" ? 600 : 500}
          fontSize={fontSize}
        >
          {title}
        </text>

        <text
          x={width / 2}
          y={authorCenterY}
          transform={`rotate(-90 ${width / 2} ${authorCenterY})`}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontFamily="var(--font-body)"
          fontWeight="400"
          fontSize={authorFontSize}
          opacity="0.78"
        >
          {author}
        </text>

        {format === "kindle" && <KindleGlyph x={width / 2} y={height - 14} color={accentColor} />}
        {format === "audible" && <AudibleGlyph x={width / 2} y={height - 13} color={accentColor} />}
      </svg>

      {selected && (
        <span
          className="absolute inset-0 rounded-[2px] ring-1 ring-gold-bright/70"
          style={{ transform: "none" }}
        />
      )}
    </button>
  );
}
