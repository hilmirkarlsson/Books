import { useMemo } from "react";
import { useLibrary } from "../lib/store.jsx";
import StarRating from "../components/StarRating.jsx";
import { ChartIcon } from "../components/Icons.jsx";

function StatCard({ label, value, sub, delay = 0 }) {
  return (
    <div
      className="animate-rise rounded-2xl border border-line bg-surface p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs font-semibold tracking-wider text-dim uppercase">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-ink tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-dim">{sub}</p>}
    </div>
  );
}

// Last 12 months of finished books as a hand-rolled SVG bar chart.
function MonthChart({ books }) {
  const months = useMemo(() => {
    const now = new Date();
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      out.push({
        key,
        label: d.toLocaleDateString("en-GB", { month: "narrow" }),
        full: d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        count: books.filter(
          (b) => b.shelf === "read" && b.dateFinished?.startsWith(key)
        ).length,
      });
    }
    return out;
  }, [books]);

  const max = Math.max(1, ...months.map((m) => m.count));
  const W = 480;
  const H = 150;
  const pad = 4;
  const bw = (W - pad * 2) / 12;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 22}`}
      className="w-full"
      role="img"
      aria-label={`Books finished per month over the last year. Peak: ${max} in one month.`}
    >
      {months.map((m, i) => {
        const h = m.count === 0 ? 3 : (m.count / max) * (H - 24);
        const x = pad + i * bw;
        return (
          <g key={m.key}>
            <title>{`${m.full}: ${m.count} book${m.count === 1 ? "" : "s"}`}</title>
            <rect
              x={x + bw * 0.18}
              y={H - h}
              width={bw * 0.64}
              height={h}
              rx="4"
              className={m.count > 0 ? "fill-gold" : "fill-line"}
              opacity={m.count > 0 ? 0.55 + 0.45 * (m.count / max) : 1}
            />
            {m.count > 0 && (
              <text
                x={x + bw / 2}
                y={H - h - 7}
                textAnchor="middle"
                className="fill-mut"
                fontSize="11"
              >
                {m.count}
              </text>
            )}
            <text
              x={x + bw / 2}
              y={H + 16}
              textAnchor="middle"
              className="fill-dim"
              fontSize="10"
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GenreBars({ books }) {
  const top = useMemo(() => {
    const counts = new Map();
    for (const b of books)
      if (b.shelf === "read")
        for (const g of b.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [books]);

  if (top.length === 0)
    return (
      <p className="py-6 text-center text-sm text-dim">
        Tag finished books with genres to see your taste profile.
      </p>
    );

  const max = top[0][1];
  return (
    <ul className="space-y-3">
      {top.map(([genre, count], i) => (
        <li key={genre} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate text-mut sm:w-36">{genre}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-raised">
            <span
              className="block h-full rounded-full bg-gold transition-[width] duration-700 ease-out"
              style={{
                width: `${(count / max) * 100}%`,
                opacity: 1 - i * 0.1,
              }}
            />
          </span>
          <span className="w-6 shrink-0 text-right text-mut tabular-nums">
            {count}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Stats() {
  const { books } = useLibrary();
  const read = books.filter((b) => b.shelf === "read");
  const year = new Date().getFullYear();
  const thisYear = read.filter((b) =>
    b.dateFinished?.startsWith(String(year))
  ).length;

  const pagesRead =
    read.reduce((sum, b) => sum + (Number(b.pages) || 0), 0) +
    books
      .filter((b) => b.shelf === "reading")
      .reduce((sum, b) => sum + (Number(b.currentPage) || 0), 0);

  const rated = read.filter((b) => b.rating > 0);
  const avg = rated.length
    ? rated.reduce((s, b) => s + b.rating, 0) / rated.length
    : 0;

  const favourite = rated.length
    ? [...rated].sort(
        (a, b) => b.rating - a.rating || (a.dateFinished < b.dateFinished ? 1 : -1)
      )[0]
    : null;

  if (books.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="animate-rise font-display text-3xl text-ink sm:text-4xl">
          Reading stats
        </h1>
        <div className="animate-rise rounded-2xl border border-dashed border-line py-16 text-center">
          <ChartIcon size={30} className="mx-auto text-dim" />
          <p className="mx-auto mt-3 max-w-xs text-sm text-mut">
            Once you've added and finished a few books, your reading life shows
            up here in charts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="animate-rise font-display text-3xl text-ink sm:text-4xl">
        Reading stats
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Books read" value={read.length} sub="all time" />
        <StatCard
          label="This year"
          value={thisYear}
          sub={`finished in ${year}`}
          delay={40}
        />
        <StatCard
          label="Pages read"
          value={pagesRead.toLocaleString("en-GB")}
          sub="incl. current progress"
          delay={80}
        />
        <StatCard
          label="Average rating"
          value={avg ? avg.toFixed(2) : "—"}
          sub={rated.length ? `across ${rated.length} rated` : "rate books to see"}
          delay={120}
        />
      </div>

      <div
        className="animate-rise rounded-2xl border border-line bg-surface p-5"
        style={{ animationDelay: "100ms" }}
      >
        <h2 className="mb-4 text-xs font-semibold tracking-wider text-dim uppercase">
          Books finished per month
        </h2>
        <MonthChart books={books} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className="animate-rise rounded-2xl border border-line bg-surface p-5"
          style={{ animationDelay: "140ms" }}
        >
          <h2 className="mb-4 text-xs font-semibold tracking-wider text-dim uppercase">
            Favourite genres
          </h2>
          <GenreBars books={books} />
        </div>

        <div
          className="animate-rise rounded-2xl border border-line bg-surface p-5"
          style={{ animationDelay: "180ms" }}
        >
          <h2 className="mb-4 text-xs font-semibold tracking-wider text-dim uppercase">
            Highest rated
          </h2>
          {favourite ? (
            <div className="flex items-center gap-4">
              {favourite.coverUrl && (
                <img
                  src={favourite.coverUrl}
                  alt={`Cover of ${favourite.title}`}
                  className="h-24 w-16 rounded-md border border-line-soft object-cover shadow-md shadow-black/40"
                />
              )}
              <div className="min-w-0">
                <p className="font-display text-lg leading-snug text-ink text-balance">
                  {favourite.title}
                </p>
                <p className="mt-0.5 text-sm text-mut">{favourite.author}</p>
                <StarRating
                  value={favourite.rating}
                  size={16}
                  readOnly
                  className="mt-1.5"
                />
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-dim">
              Rate a finished book and your favourite shows up here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
