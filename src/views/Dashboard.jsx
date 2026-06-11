import { useState } from "react";
import { PRIORITIES, formatDate, useLibrary } from "../lib/store.jsx";
import { Cover, ProgressBar } from "../components/BookCard.jsx";
import StarRating from "../components/StarRating.jsx";
import {
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  FlagIcon,
  PlusIcon,
} from "../components/Icons.jsx";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late reading?";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function ReadingNowCard({ book, onOpen, index }) {
  const { updateBook, moveBook } = useLibrary();
  const [page, setPage] = useState(book.currentPage ?? 0);
  const progress = book.pages > 0 ? Math.round((page / book.pages) * 100) : null;

  function commit(value) {
    const p = Math.max(0, Math.min(Number(value) || 0, book.pages ?? Infinity));
    setPage(p);
    if (p !== book.currentPage) updateBook(book.id, { currentPage: p });
  }

  return (
    <div
      className="flex animate-rise gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors duration-200 hover:border-gold-dim/50"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button type="button" onClick={() => onOpen(book.id)} className="shrink-0">
        <Cover
          book={book}
          className="h-36 w-24 rounded-lg border border-line-soft shadow-lg shadow-black/40 transition-transform duration-300 hover:scale-[1.03]"
        />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => onOpen(book.id)}
          className="text-left"
        >
          <h3 className="font-display text-lg leading-snug text-ink text-balance">
            {book.title}
          </h3>
          <p className="mt-0.5 text-sm text-mut">{book.author}</p>
        </button>
        <div className="mt-auto pt-3">
          {book.pages ? (
            <>
              <div className="flex items-center justify-between text-xs text-dim">
                <span className="flex items-center gap-1.5">
                  Page
                  <input
                    type="number"
                    min="0"
                    max={book.pages}
                    value={page}
                    aria-label={`Current page of ${book.title}`}
                    onChange={(e) => setPage(e.target.value)}
                    onBlur={(e) => commit(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && commit(e.target.value)}
                    className="w-14 rounded-md border border-line bg-raised px-1.5 py-0.5 text-center text-xs text-ink tabular-nums focus:border-gold-dim focus:outline-none"
                  />
                  of {book.pages}
                </span>
                <span className="font-medium text-gold tabular-nums">
                  {progress}%
                </span>
              </div>
              <ProgressBar value={progress} className="mt-2" />
            </>
          ) : (
            <p className="text-xs text-dim">
              Started {formatDate(book.dateStarted) || "recently"}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              moveBook(book, "read");
              onOpen(book.id);
            }}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-mut transition-colors duration-150 hover:text-gold"
          >
            <CheckIcon size={13} /> Mark as finished
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalCard() {
  const { books, goal, setGoal } = useLibrary();
  const [editing, setEditing] = useState(false);
  const year = new Date().getFullYear();
  const finished = books.filter(
    (b) => b.shelf === "read" && b.dateFinished?.startsWith(String(year))
  ).length;
  const pct = goal > 0 ? Math.min(100, Math.round((finished / goal) * 100)) : 0;

  return (
    <div className="animate-rise rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-dim uppercase">
          {year} reading goal
        </h3>
        {editing ? (
          <input
            type="number"
            min="1"
            autoFocus
            defaultValue={goal}
            aria-label="Yearly reading goal"
            onBlur={(e) => {
              setGoal(Math.max(1, Number(e.target.value) || goal));
              setEditing(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
            className="w-16 rounded-md border border-line bg-raised px-2 py-0.5 text-right text-sm text-ink focus:border-gold-dim focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-dim transition-colors duration-150 hover:text-gold"
          >
            Edit
          </button>
        )}
      </div>
      <p className="mt-3 font-display text-3xl text-ink">
        {finished}
        <span className="text-lg text-dim"> / {goal} books</span>
      </p>
      <ProgressBar value={pct} className="mt-3 h-2" />
      <p className="mt-2 text-xs text-dim">
        {finished >= goal
          ? "Goal reached — set a bolder one?"
          : `${goal - finished} to go · ${pct}% there`}
      </p>
    </div>
  );
}

const VERB_RANK = { Added: 0, Started: 1, Finished: 2 };

function buildActivity(books) {
  const events = [];
  for (const b of books) {
    if (b.dateFinished)
      events.push({ ts: b.dateFinished, verb: "Finished", book: b });
    if (b.dateStarted)
      events.push({ ts: b.dateStarted, verb: "Started", book: b });
    events.push({ ts: b.dateAdded, verb: "Added", book: b });
  }
  return events
    .sort(
      (a, b) =>
        b.ts.localeCompare(a.ts) || VERB_RANK[b.verb] - VERB_RANK[a.verb]
    )
    .slice(0, 6);
}

export default function Dashboard({ onOpen, onAdd, gotoLibrary }) {
  const { books } = useLibrary();
  const reading = books.filter((b) => b.shelf === "reading");
  const upNext = books
    .filter((b) => b.shelf === "wishlist")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);
  const activity = buildActivity(books);

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-sm text-dim">{greeting()}</p>
        <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">
          Your library
        </h1>
      </header>

      {books.length === 0 ? (
        <div className="animate-rise rounded-2xl border border-dashed border-line py-16 text-center">
          <BookIcon size={32} className="mx-auto text-dim" />
          <h2 className="mt-4 font-display text-xl text-ink">
            Your shelves are empty
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-mut">
            Add your first book and start tracking what you read, what you
            loved, and what's next.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:bg-gold-bright active:scale-[0.98]"
          >
            <PlusIcon size={16} /> Add a book
          </button>
        </div>
      ) : (
        <>
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-lg text-ink">Reading now</h2>
              {reading.length > 0 && (
                <button
                  type="button"
                  onClick={() => gotoLibrary("reading")}
                  className="flex items-center gap-1 text-xs text-dim transition-colors duration-150 hover:text-gold"
                >
                  All shelves <ArrowRightIcon size={12} />
                </button>
              )}
            </div>
            {reading.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-6 text-center">
                <p className="text-sm text-mut">
                  Nothing on the go.{" "}
                  <button
                    type="button"
                    onClick={() => gotoLibrary("wishlist")}
                    className="font-medium text-gold transition-colors duration-150 hover:text-gold-bright"
                  >
                    Pick something from your wishlist →
                  </button>
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {reading.map((b, i) => (
                  <ReadingNowCard key={b.id} book={b} onOpen={onOpen} index={i} />
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <GoalCard />

            <div
              className="animate-rise rounded-2xl border border-line bg-surface p-5"
              style={{ animationDelay: "60ms" }}
            >
              <h3 className="text-xs font-semibold tracking-wider text-dim uppercase">
                Recent activity
              </h3>
              {activity.length === 0 ? (
                <p className="mt-3 text-sm text-dim">Nothing yet.</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {activity.map((e, i) => (
                    <li key={`${e.book.id}-${e.verb}-${i}`}>
                      <button
                        type="button"
                        onClick={() => onOpen(e.book.id)}
                        className="group flex w-full items-baseline gap-2 text-left text-sm"
                      >
                        <span
                          className={
                            e.verb === "Finished" ? "text-gold" : "text-dim"
                          }
                        >
                          {e.verb}
                        </span>
                        <span className="truncate text-ink transition-colors duration-150 group-hover:text-gold-bright">
                          {e.book.title}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-dim">
                          {formatDate(e.ts)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {upNext.length > 0 && (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-lg text-ink">Up next</h2>
                <button
                  type="button"
                  onClick={() => gotoLibrary("wishlist")}
                  className="flex items-center gap-1 text-xs text-dim transition-colors duration-150 hover:text-gold"
                >
                  Full wishlist <ArrowRightIcon size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {upNext.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onOpen(b.id)}
                    className="group animate-rise rounded-xl border border-line bg-surface p-3 text-left transition-colors duration-200 hover:border-gold-dim/50"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <Cover
                      book={b}
                      className="aspect-[2/3] w-full rounded-lg border border-line-soft transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium text-ink">
                      {b.title}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-gold-bright">
                      <FlagIcon size={10} />
                      {PRIORITIES[b.priority]}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
