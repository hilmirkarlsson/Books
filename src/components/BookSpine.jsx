import { useId, useMemo } from "react";
import { generatedPalette, seedFor, shade } from "../lib/spineColors.js";

const MIN_WIDTH = 30;
const MAX_WIDTH = 62;
const MIN_HEIGHT = 184;
const HEIGHT_RANGE = 30;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? `${str.slice(0, max - 1).trimEnd()}…` : str;
}

// Width tracks page count (thicker books = wider spines); height varies a
// touch per book so the row doesn't look perfectly uniform. Depth is the
// book's front-to-back size, seen as the page-edge band along the top.
function dimsFor(book, seed) {
  const pages = book.pages ?? 300;
  const width = clamp(26 + pages / 9, MIN_WIDTH, MAX_WIDTH);
  const height = MIN_HEIGHT + (seed % HEIGHT_RANGE);
  const depth = 52 + (seed % 18);
  return { width: Math.round(width), height: Math.round(height), depth };
}

function KindleGlyph({ x, y, color }) {
  return (
    <g opacity="0.92" stroke={color} fill="none" strokeWidth="1.1" strokeLinecap="round">
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
    <g fill={color} opacity="0.95">
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
  const { width, height, depth } = useMemo(() => dimsFor(book, seed), [book.pages, seed]);
  const palette = useMemo(
    () => book.spine ?? { source: "generated", ...generatedPalette(seed, book.format) },
    [book.spine, seed, book.format]
  );

  const { baseColor, accentColor, textColor } = palette;
  const format = book.format ?? "physical";
  const isPhysical = format === "physical";
  const useCover = isPhysical && !!book.coverUrl;

  const darker = shade(baseColor, -26);
  const lighter = shade(baseColor, 12);

  // ── text layout (SVG overlay on top of the 3D surface) ───────────────────
  const topMargin = 16;
  const bottomReserve = format === "physical" ? 16 : 30;
  const usable = height - topMargin - bottomReserve;
  const titleLen = usable * 0.56;
  const authorLen = usable * 0.28;
  const titleCenterY = topMargin + titleLen / 2 + 2;
  const authorCenterY = topMargin + titleLen + 10 + authorLen / 2;

  const fontSize = clamp(width * 0.38, 9.5, 13.5);
  const authorFontSize = fontSize * 0.74;
  const fontFamily = format === "kindle" ? "var(--font-body)" : "var(--font-display)";
  const title = truncate(book.title, Math.floor(titleLen / (fontSize * 0.46)));
  const author = truncate(book.author, Math.floor(authorLen / (authorFontSize * 0.46)));

  // Rounded-spine shading: dark at both vertical edges, sheen down the centre.
  const curvature =
    "linear-gradient(90deg," +
    "rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.12) 9%,rgba(255,255,255,0.05) 34%," +
    "rgba(255,255,255,0.14) 50%,rgba(255,255,255,0.05) 66%," +
    "rgba(0,0,0,0.12) 91%,rgba(0,0,0,0.55) 100%)";

  // Page-edge band shown along the top of the book (looks like stacked pages).
  const pageEdge =
    "linear-gradient(180deg,rgba(0,0,0,0.25),transparent 60%)," +
    "repeating-linear-gradient(90deg,#f3ead4 0px,#f3ead4 1.2px,#d2c4a2 1.2px,#d2c4a2 2.6px)";

  const clothTexture = isPhysical
    ? "repeating-linear-gradient(48deg,rgba(0,0,0,0.10) 0px,rgba(0,0,0,0.10) 1px,transparent 1px,transparent 4px)"
    : "none";

  return (
    <button
      type="button"
      className={`group relative shrink-0 cursor-pointer rounded-[2px] outline-offset-4 ${className}`}
      style={{
        width,
        height,
        transformStyle: "preserve-3d",
        transform: `rotate(${tilt}deg) translateY(${selected ? -10 : 0}px)`,
        transition: "transform 0.25s cubic-bezier(0.2,0.7,0.3,1)",
        ...style,
      }}
      {...rest}
    >
      {/* top face — the page-edge band, tipped back in 3D */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height: depth,
          transformOrigin: "top",
          transform: "rotateX(90deg)",
          background: pageEdge,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.35)",
        }}
      >
        {/* the spine cap (binding) at the very front edge of the top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height: 4,
            background: `linear-gradient(90deg,${darker},${baseColor},${darker})`,
          }}
        />
      </div>

      {/* spine face */}
      <div
        className="relative h-full w-full overflow-hidden rounded-[2px]"
        style={{
          background: useCover
            ? darker
            : `linear-gradient(90deg,${lighter},${baseColor} 45%,${darker})`,
          boxShadow:
            "0 7px 11px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(0,0,0,0.4)",
        }}
      >
        {useCover && (
          <img
            src={book.coverUrl}
            alt=""
            aria-hidden="true"
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: "scale(1.35)", filter: "blur(2.2px) saturate(1.12) brightness(0.82)" }}
          />
        )}

        {/* unifying colour tint over the cover */}
        {useCover && (
          <div
            className="absolute inset-0"
            style={{ background: baseColor, opacity: 0.22, mixBlendMode: "multiply" }}
          />
        )}

        {/* cloth weave for coverless physical books */}
        {!useCover && clothTexture !== "none" && (
          <div className="absolute inset-0" style={{ background: clothTexture, opacity: 0.5 }} />
        )}

        {/* rounded-spine curvature shading */}
        <div className="absolute inset-0" style={{ background: curvature }} />

        {/* diagonal sheen */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(165deg,rgba(255,255,255,0.16),transparent 28%)",
          }}
        />

        {/* text + accents + format icon */}
        <svg
          className="absolute inset-0"
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${book.title} by ${book.author}, ${format} book`}
          style={{ overflow: "visible" }}
        >
          <rect x="2.5" y="8" width={width - 5} height="1.3" fill={accentColor} opacity="0.9" />
          <rect x="2.5" y={height - 10} width={width - 5} height="1.3" fill={accentColor} opacity="0.9" />

          <text
            x={width / 2}
            y={titleCenterY}
            transform={`rotate(-90 ${width / 2} ${titleCenterY})`}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textColor}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="0.5"
            paintOrder="stroke"
            fontFamily={fontFamily}
            fontWeight={format === "kindle" ? 600 : 600}
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
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="0.4"
            paintOrder="stroke"
            fontFamily="var(--font-body)"
            fontWeight="400"
            fontSize={authorFontSize}
            opacity="0.85"
          >
            {author}
          </text>

          {format === "kindle" && <KindleGlyph x={width / 2} y={height - 15} color={accentColor} />}
          {format === "audible" && <AudibleGlyph x={width / 2} y={height - 14} color={accentColor} />}
        </svg>

        {/* selection highlight */}
        {selected && (
          <div className="absolute inset-0 rounded-[2px] ring-1 ring-gold-bright/80 ring-inset" />
        )}
      </div>
    </button>
  );
}
