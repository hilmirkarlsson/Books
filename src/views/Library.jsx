import { useMemo, useState } from "react";
import { SHELVES, useLibrary } from "../lib/store.jsx";
import BookCard from "../components/BookCard.jsx";
import { BookIcon, ChevronDownIcon, PlusIcon } from "../components/Icons.jsx";

const SORTS = {
  recent: { label: "Recently added", fn: (a, b) => (a.dateAdded < b.dateAdded ? 1 : -1) },
  finished: { label: "Date finished", fn: (a, b) => ((a.dateFinished ?? "") < (b.dateFinished ?? "") ? 1 : -1) },
  rating: { label: "Highest rated", fn: (a, b) => b.rating - a.rating },
  priority: { label: "Priority", fn: (a, b) => b.priority - a.priority },
  title: { label: "Title A–Z", fn: (a, b) => a.title.localeCompare(b.title) },
  author: { label: "Author A–Z", fn: (a, b) => a.author.localeCompare(b.author) },
};

const SORTS_FOR_SHELF = {
  reading: ["recent", "title", "author"],
  read: ["finished", "rating", "title", "author", "recent"],
  wishlist: ["priority", "recent", "title", "author"],
};

function Select({ value, onChange, children, label }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none rounded-xl border border-line bg-surface py-2 pr-8 pl-3.5 text-sm text-mut transition-colors duration-150 hover:text-ink focus:border-gold-dim focus:outline-none"
      >
        {children}
      </select>
      <ChevronDownIcon
        size={14}
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-dim"
      />
    </div>
  );
}

export default function Library({ shelf, setShelf, onOpen, onAdd }) {
  const { books } = useLibrary();
  const [sort, setSort] = useState("recent");
  const [genre, setGenre] = useState("all");
  const [minRating, setMinRating] = useState(0);

  const shelfBooks = books.filter((b) => b.shelf === shelf);

  const genres = useMemo(() => {
    const set = new Set();
    for (const b of shelfBooks) for (const g of b.genres) set.add(g);
    return [...set].sort();
  }, [shelfBooks]);

  const sortKey = SORTS_FOR_SHELF[shelf].includes(sort)
    ? sort
    : SORTS_FOR_SHELF[shelf][0];

  const visible = shelfBooks
    .filter((b) => genre === "all" || b.genres.includes(genre))
    .filter((b) => b.rating >= minRating)
    .sort(SORTS[sortKey].fn);

  return (
    <div className="space-y-5">
      <header className="animate-rise">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Shelves</h1>
      </header>

      <div
        role="tablist"
        aria-label="Shelves"
        className="flex gap-1.5 overflow-x-auto rounded-2xl bg-surface p-1.5"
      >
        {Object.entries(SHELVES).map(([key, label]) => {
          const count = books.filter((b) => b.shelf === key).length;
          const active = shelf === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setShelf(key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-raised text-ink shadow-sm"
                  : "text-mut hover:text-ink"
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${
                  active ? "bg-gold/15 text-gold-bright" : "bg-raised text-dim"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={sortKey} onChange={setSort} label="Sort books">
          {SORTS_FOR_SHELF[shelf].map((key) => (
            <option key={key} value={key}>
              {SORTS[key].label}
            </option>
          ))}
        </Select>
        {genres.length > 0 && (
          <Select value={genre} onChange={setGenre} label="Filter by genre">
            <option value="all">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        )}
        {shelf === "read" && (
          <Select
            value={String(minRating)}
            onChange={(v) => setMinRating(Number(v))}
            label="Filter by rating"
          >
            <option value="0">Any rating</option>
            {[3, 3.5, 4, 4.5, 5].map((r) => (
              <option key={r} value={r}>
                {r}★ and up
              </option>
            ))}
          </Select>
        )}
        {(genre !== "all" || minRating > 0) && (
          <button
            type="button"
            onClick={() => {
              setGenre("all");
              setMinRating(0);
            }}
            className="text-xs text-dim transition-colors duration-150 hover:text-gold"
          >
            Clear filters
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="animate-rise rounded-2xl border border-dashed border-line py-16 text-center">
          <BookIcon size={28} className="mx-auto text-dim" />
          <p className="mt-3 text-sm text-mut">
            {shelfBooks.length > 0
              ? "Nothing matches those filters."
              : shelf === "reading"
                ? "Nothing on the go right now."
                : shelf === "read"
                  ? "No finished books yet — they'll land here."
                  : "Your wishlist is empty."}
          </p>
          {shelfBooks.length === 0 && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-mut transition-colors duration-150 hover:bg-hover hover:text-ink"
            >
              <PlusIcon size={15} /> Add a book
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((b, i) => (
            <BookCard
              key={b.id}
              book={b}
              onOpen={onOpen}
              style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
