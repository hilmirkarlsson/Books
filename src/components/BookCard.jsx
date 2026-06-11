import { useEffect, useRef, useState } from "react";
import { SHELVES, PRIORITIES, useLibrary } from "../lib/store.jsx";
import StarRating from "./StarRating.jsx";
import { BookIcon, CheckIcon, DotsIcon, FlagIcon, TrashIcon } from "./Icons.jsx";

export function Cover({ book, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (!book.coverUrl || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-raised p-3 text-center ${className}`}
      >
        <BookIcon size={22} className="text-dim" />
        <span className="font-display text-xs leading-snug text-mut line-clamp-4">
          {book.title}
        </span>
      </div>
    );
  }
  return (
    <img
      src={book.coverUrl}
      alt={`Cover of ${book.title}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

export function ProgressBar({ value, className = "" }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-raised ${className}`}>
      <div
        className="h-full rounded-full bg-gold transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function CardMenu({ book }) {
  const { moveBook, removeBook } = useLibrary();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="absolute top-2 right-2 z-10">
      <button
        type="button"
        aria-label={`Actions for ${book.title}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`rounded-full bg-black/55 p-1.5 text-ink backdrop-blur-sm transition-all duration-200 hover:bg-black/75 ${
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        }`}
      >
        <DotsIcon size={16} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1.5 w-48 animate-pop overflow-hidden rounded-xl border border-line bg-raised shadow-xl shadow-black/50"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold tracking-wider text-dim uppercase">
            Move to
          </p>
          {Object.entries(SHELVES).map(([key, label]) => (
            <button
              key={key}
              type="button"
              disabled={book.shelf === key}
              onClick={() => {
                moveBook(book, key);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink transition-colors duration-150 hover:bg-hover disabled:cursor-default disabled:text-dim"
            >
              {label}
              {book.shelf === key && <CheckIcon size={14} className="text-gold" />}
            </button>
          ))}
          <div className="my-1 border-t border-line-soft" />
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove “${book.title}” from your library?`))
                removeBook(book.id);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition-colors duration-150 hover:bg-hover"
          >
            <TrashIcon size={14} /> Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default function BookCard({ book, onOpen, style }) {
  const progress =
    book.pages > 0 ? Math.round((book.currentPage / book.pages) * 100) : null;

  return (
    <div className="group relative animate-rise" style={style}>
      <CardMenu book={book} />
      <button
        type="button"
        onClick={() => onOpen(book.id)}
        className="block w-full text-left"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-line-soft shadow-lg shadow-black/30 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/50">
          <Cover book={book} className="h-full w-full" />
          {book.shelf === "wishlist" && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-gold-bright backdrop-blur-sm">
              <FlagIcon size={11} />
              {PRIORITIES[book.priority]}
            </span>
          )}
        </div>
        {book.shelf === "reading" && progress != null && (
          <ProgressBar value={progress} className="mt-2" />
        )}
        <h3 className="mt-2 line-clamp-2 text-sm leading-snug font-medium text-ink">
          {book.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-mut">{book.author}</p>
        {book.shelf === "read" && book.rating > 0 && (
          <StarRating value={book.rating} size={13} readOnly className="mt-1" />
        )}
        {book.shelf === "reading" && progress != null && (
          <p className="mt-1 text-xs text-dim">
            {book.currentPage} / {book.pages} pages · {progress}%
          </p>
        )}
        {book.shelf === "wishlist" && book.wishReason && (
          <p className="mt-1 line-clamp-2 text-xs text-dim italic">
            “{book.wishReason}”
          </p>
        )}
      </button>
    </div>
  );
}
