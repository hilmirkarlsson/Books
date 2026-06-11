import { useState } from "react";
import { StarShape } from "./Icons.jsx";

// Interactive 5-star rating with quarter-star precision. The pointer's
// horizontal position inside a star picks .25 / .5 / .75 / 1; clicking the
// current value clears the rating.
export default function StarRating({
  value = 0,
  onChange,
  size = 20,
  readOnly = false,
  className = "",
}) {
  const [preview, setPreview] = useState(null);
  const shown = preview ?? value;

  function valueAt(e, index) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const quarter = Math.min(1, Math.max(0.25, Math.ceil(frac * 4) / 4));
    return index + quarter;
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={readOnly ? "img" : "slider"}
      aria-label={readOnly ? `Rated ${value} of 5 stars` : "Rating"}
      aria-valuenow={readOnly ? undefined : value}
      aria-valuemin={readOnly ? undefined : 0}
      aria-valuemax={readOnly ? undefined : 5}
      onMouseLeave={() => setPreview(null)}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, shown - i));
        const star = (
          <span className="relative block" style={{ width: size, height: size }}>
            <StarShape size={size} className="absolute inset-0 text-dim" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <StarShape
                size={size}
                fill="currentColor"
                className={preview != null ? "text-gold-bright" : "text-gold"}
              />
            </span>
          </span>
        );
        if (readOnly) return <span key={i}>{star}</span>;
        return (
          <button
            key={i}
            type="button"
            className="block p-0.5 -m-0.5 transition-transform duration-150 hover:scale-110 active:scale-95"
            onMouseMove={(e) => setPreview(valueAt(e, i))}
            onClick={(e) => {
              const v = valueAt(e, i);
              onChange?.(v === value ? 0 : v);
            }}
            aria-label={`Rate ${i + 1} star${i ? "s" : ""}`}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}

export function ratingLabel(value) {
  if (!value) return "Not rated";
  return `${value} ★`;
}
