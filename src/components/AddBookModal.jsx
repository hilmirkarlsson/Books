import { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";
import { searchBooks } from "../lib/openLibrary.js";
import { SHELVES, makeBook, shelfPatch, useLibrary } from "../lib/store.jsx";
import { Cover } from "./BookCard.jsx";
import { BookIcon, CheckIcon, SearchIcon } from "./Icons.jsx";

function ShelfPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5 rounded-xl bg-raised p-1">
      {Object.entries(SHELVES).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200 sm:text-sm ${
            value === key
              ? "bg-gold text-bg shadow-sm"
              : "text-mut hover:bg-hover hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function AddBookModal({ open, onClose }) {
  const { addBook, books } = useLibrary();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [picked, setPicked] = useState(null);
  const [shelf, setShelf] = useState("wishlist");
  const [added, setAdded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setStatus("idle");
      setPicked(null);
      setShelf("wishlist");
      setAdded(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced live search against Open Library.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const docs = await searchBooks(q, controller.signal);
        setResults(docs);
        setStatus("done");
      } catch (err) {
        if (err.name !== "AbortError") setStatus("error");
      }
    }, 400);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  function confirmAdd() {
    const base = makeBook({
      title: picked.title,
      author: picked.author,
      coverUrl: picked.coverUrl,
      coverLargeUrl: picked.coverLargeUrl,
      isbn: picked.isbn,
      year: picked.year,
      pages: picked.pages,
      genres: picked.genres,
    });
    addBook({ ...base, ...shelfPatch(base, shelf) });
    setAdded(true);
    setTimeout(onClose, 650);
  }

  const alreadyOwned = (r) =>
    books.some(
      (b) => b.title === r.title && b.author === r.author
    );

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="p-5 sm:p-6">
        <h2 className="font-display text-xl text-ink">Add a book</h2>

        {!picked ? (
          <>
            <div className="relative mt-4">
              <SearchIcon
                size={17}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-dim"
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author or ISBN…"
                aria-label="Search Open Library"
                className="w-full rounded-xl border border-line bg-raised py-3 pr-4 pl-10 text-[15px] text-ink placeholder:text-dim transition-colors duration-200 focus:border-gold-dim focus:outline-none"
              />
            </div>

            <div className="mt-4 min-h-44">
              {status === "idle" && (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <BookIcon size={26} className="text-dim" />
                  <p className="text-sm text-mut">
                    Search Open Library and book details fill in automatically.
                  </p>
                </div>
              )}
              {status === "loading" && (
                <ul className="space-y-2" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <li
                      key={i}
                      className="flex animate-pulse gap-3 rounded-xl p-2"
                    >
                      <div className="h-18 w-12 rounded-md bg-raised" />
                      <div className="flex-1 space-y-2 py-2">
                        <div className="h-3 w-2/3 rounded bg-raised" />
                        <div className="h-3 w-1/3 rounded bg-raised" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {status === "error" && (
                <p className="py-10 text-center text-sm text-danger">
                  Couldn’t reach Open Library. Check your connection and try
                  again.
                </p>
              )}
              {status === "done" && results.length === 0 && (
                <p className="py-10 text-center text-sm text-mut">
                  No matches for “{query}”. Try the ISBN instead.
                </p>
              )}
              {status === "done" && results.length > 0 && (
                <ul className="space-y-1">
                  {results.map((r, i) => (
                    <li key={r.olKey} className="animate-rise" style={{ animationDelay: `${i * 30}ms` }}>
                      <button
                        type="button"
                        onClick={() => setPicked(r)}
                        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors duration-150 hover:bg-hover"
                      >
                        <Cover
                          book={r}
                          className="h-18 w-12 shrink-0 rounded-md border border-line-soft"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-ink">
                            {r.title}
                          </p>
                          <p className="truncate text-sm text-mut">
                            {r.author}
                            {r.year ? ` · ${r.year}` : ""}
                            {r.pages ? ` · ${r.pages} pp` : ""}
                          </p>
                          {r.genres.length > 0 && (
                            <p className="mt-0.5 truncate text-xs text-dim">
                              {r.genres.join(" · ")}
                            </p>
                          )}
                        </div>
                        {alreadyOwned(r) && (
                          <span className="shrink-0 rounded-full bg-raised px-2 py-0.5 text-[11px] text-dim">
                            In library
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="mt-5 animate-rise">
            <div className="flex gap-4">
              <Cover
                book={picked}
                className="h-36 w-24 shrink-0 rounded-lg border border-line-soft shadow-lg shadow-black/40"
              />
              <div className="min-w-0">
                <h3 className="font-display text-lg leading-snug text-ink text-balance">
                  {picked.title}
                </h3>
                <p className="mt-1 text-sm text-mut">{picked.author}</p>
                <p className="mt-1 text-xs text-dim">
                  {[picked.year, picked.pages && `${picked.pages} pages`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {picked.genres.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {picked.genres.map((g) => (
                      <span
                        key={g}
                        className="rounded-full border border-line bg-raised px-2 py-0.5 text-[11px] text-mut"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="mt-5 mb-2 text-xs font-semibold tracking-wider text-dim uppercase">
              Add to shelf
            </p>
            <ShelfPicker value={shelf} onChange={setShelf} />

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-mut transition-colors duration-150 hover:bg-hover hover:text-ink"
              >
                Back
              </button>
              <button
                type="button"
                onClick={confirmAdd}
                disabled={added}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:bg-gold-bright active:scale-[0.98] disabled:opacity-80"
              >
                {added ? (
                  <>
                    <CheckIcon size={16} /> Added
                  </>
                ) : (
                  `Add to ${SHELVES[shelf]}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
