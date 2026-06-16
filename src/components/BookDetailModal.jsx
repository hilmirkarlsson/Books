import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import StarRating from "./StarRating.jsx";
import { Cover, ProgressBar } from "./BookCard.jsx";
import { PRIORITIES, SHELVES, shelfPatch, useLibrary } from "../lib/store.jsx";
import { BookIcon, HeadphonesIcon, PlusIcon, TabletIcon, TrashIcon, XIcon } from "./Icons.jsx";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wider text-dim uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-dim transition-colors duration-200 focus:border-gold-dim focus:outline-none";

function GenreEditor({ genres, onChange }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const g = draft.trim();
    if (g && !genres.some((x) => x.toLowerCase() === g.toLowerCase()))
      onChange([...genres, g]);
    setDraft("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {genres.map((g) => (
        <span
          key={g}
          className="flex items-center gap-1 rounded-full border border-line bg-raised py-1 pr-1.5 pl-2.5 text-xs text-ink"
        >
          {g}
          <button
            type="button"
            aria-label={`Remove genre ${g}`}
            onClick={() => onChange(genres.filter((x) => x !== g))}
            className="rounded-full p-0.5 text-dim transition-colors duration-150 hover:text-danger"
          >
            <XIcon size={12} />
          </button>
        </span>
      ))}
      <span className="flex items-center gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder="Add tag"
          aria-label="Add genre tag"
          className="w-20 rounded-full border border-dashed border-line bg-transparent px-2.5 py-1 text-xs text-ink placeholder:text-dim focus:border-gold-dim focus:outline-none"
        />
        {draft && (
          <button
            type="button"
            onClick={commit}
            aria-label="Confirm genre tag"
            className="rounded-full bg-raised p-1 text-mut hover:text-gold"
          >
            <PlusIcon size={12} />
          </button>
        )}
      </span>
    </div>
  );
}

export default function BookDetailModal({ bookId, onClose }) {
  const { books, updateBook, removeBook } = useLibrary();
  const book = books.find((b) => b.id === bookId);
  const [draft, setDraft] = useState(book);

  useEffect(() => {
    setDraft(book);
  }, [bookId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!book || !draft) return null;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  function save() {
    const pages = draft.pages ? Number(draft.pages) : null;
    updateBook(book.id, {
      ...draft,
      pages,
      currentPage: Math.min(Number(draft.currentPage) || 0, pages ?? Infinity),
    });
    onClose();
  }

  function changeShelf(shelf) {
    setDraft((d) => ({ ...d, ...shelfPatch(d, shelf) }));
  }

  const progress =
    draft.pages > 0
      ? Math.round(((Number(draft.currentPage) || 0) / draft.pages) * 100)
      : null;

  return (
    <Modal open onClose={onClose} wide>
      <div className="p-5 sm:p-6">
        <div className="flex gap-4 sm:gap-5">
          <Cover
            book={book}
            className="h-44 w-29 shrink-0 rounded-lg border border-line-soft shadow-lg shadow-black/40 sm:h-52 sm:w-35"
          />
          <div className="min-w-0 flex-1 pr-8">
            <h2 className="font-display text-xl leading-snug text-ink text-balance sm:text-2xl">
              {draft.title}
            </h2>
            <p className="mt-1 text-sm text-mut">{draft.author}</p>
            {(draft.year || draft.isbn) && (
              <p className="mt-1 text-xs text-dim">
                {[draft.year, draft.isbn && `ISBN ${draft.isbn}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <div className="mt-3">
              <StarRating
                value={draft.rating}
                onChange={(rating) => set({ rating })}
                size={24}
              />
              <p className="mt-1 text-xs text-dim">
                {draft.rating ? `${draft.rating} of 5` : "Tap to rate — quarter stars supported"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-1.5 rounded-xl bg-raised p-1">
          {Object.entries(SHELVES).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeShelf(key)}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200 sm:text-sm ${
                draft.shelf === key
                  ? "bg-gold text-bg shadow-sm"
                  : "text-mut hover:bg-hover hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {draft.shelf === "reading" && (
            <div className="rounded-xl border border-line bg-raised/50 p-4">
              <div className="flex items-end justify-between gap-3">
                <Field label="Current page">
                  <input
                    type="number"
                    min="0"
                    max={draft.pages ?? undefined}
                    value={draft.currentPage ?? 0}
                    onChange={(e) => set({ currentPage: e.target.value })}
                    className={`${inputCls} w-24`}
                  />
                </Field>
                <Field label="Total pages">
                  <input
                    type="number"
                    min="1"
                    value={draft.pages ?? ""}
                    placeholder="?"
                    onChange={(e) => set({ pages: e.target.value })}
                    className={`${inputCls} w-24`}
                  />
                </Field>
                {progress != null && (
                  <p className="pb-2.5 text-sm font-medium text-gold tabular-nums">
                    {progress}%
                  </p>
                )}
              </div>
              {progress != null && <ProgressBar value={progress} className="mt-3" />}
            </div>
          )}

          {draft.shelf === "wishlist" && (
            <>
              <Field label="Priority">
                <div className="flex gap-1.5">
                  {PRIORITIES.map((p, i) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set({ priority: i })}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-all duration-200 ${
                        draft.priority === i
                          ? "border-gold-dim bg-gold/10 font-medium text-gold-bright"
                          : "border-line text-mut hover:bg-hover"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Why do you want to read it?">
                <textarea
                  rows={2}
                  value={draft.wishReason}
                  onChange={(e) => set({ wishReason: e.target.value })}
                  placeholder="Recommended by… / Sequel to… / That cover though"
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </>
          )}

          {draft.shelf === "read" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date finished">
                <input
                  type="date"
                  value={draft.dateFinished ?? ""}
                  onChange={(e) => set({ dateFinished: e.target.value || null })}
                  className={inputCls}
                />
              </Field>
              <Field label="Pages">
                <input
                  type="number"
                  min="1"
                  value={draft.pages ?? ""}
                  placeholder="?"
                  onChange={(e) => set({ pages: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          <Field label="Owned formats">
            <div className="flex gap-2">
              {[
                { key: "physical", label: "Physical", Icon: BookIcon },
                { key: "kindle", label: "Kindle", Icon: TabletIcon },
                { key: "audio", label: "Audiobook", Icon: HeadphonesIcon },
              ].map(({ key, label, Icon }) => {
                const active = (draft.formats ?? []).includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const current = draft.formats ?? [];
                      set({
                        formats: active
                          ? current.filter((f) => f !== key)
                          : [...current, key],
                      });
                    }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-all duration-200 ${
                      active
                        ? "border-gold-dim bg-gold/10 font-medium text-gold-bright"
                        : "border-line text-mut hover:bg-hover"
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Genre tags">
            <GenreEditor
              genres={draft.genres}
              onChange={(genres) => set({ genres })}
            />
          </Field>

          <Field label="Notes & review">
            <textarea
              rows={4}
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Thoughts, favourite quotes, who you'd recommend it to…"
              className={`${inputCls} resize-y`}
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            aria-label="Remove book"
            onClick={() => {
              if (confirm(`Remove “${book.title}” from your library?`)) {
                removeBook(book.id);
                onClose();
              }
            }}
            className="rounded-xl border border-line p-2.5 text-dim transition-colors duration-150 hover:border-danger/40 hover:text-danger"
          >
            <TrashIcon size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-mut transition-colors duration-150 hover:bg-hover hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:bg-gold-bright active:scale-[0.98]"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
