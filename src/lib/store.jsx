import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

import { libraryKeyFor } from "./profiles.js";

export const SHELVES = {
  reading: "Currently Reading",
  read: "Read",
  wishlist: "Want to Read",
};

export const PRIORITIES = ["Someday", "Soon", "Next up"];

const initialState = { books: [], goal: 24 };

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function load(profileId) {
  try {
    const raw = localStorage.getItem(libraryKeyFor(profileId));
    if (raw) return { ...initialState, ...JSON.parse(raw) };
  } catch {
    // corrupt storage — start fresh rather than crash
  }
  return initialState;
}

export function makeBook(partial) {
  return {
    id: crypto.randomUUID(),
    title: "",
    author: "",
    coverUrl: null,
    coverLargeUrl: null,
    isbn: null,
    year: null,
    pages: null,
    currentPage: 0,
    shelf: "wishlist",
    rating: 0,
    notes: "",
    wishReason: "",
    priority: 1,
    genres: [],
    dateAdded: todayISO(),
    dateStarted: null,
    dateFinished: null,
    ...partial,
  };
}

// Moving shelves carries side effects: starting a book stamps dateStarted,
// finishing one stamps dateFinished and completes the page progress.
export function shelfPatch(book, shelf) {
  const patch = { shelf };
  if (shelf === "reading" && !book.dateStarted) patch.dateStarted = todayISO();
  if (shelf === "read") {
    if (!book.dateFinished) patch.dateFinished = todayISO();
    if (book.pages) patch.currentPage = book.pages;
  }
  if (shelf !== "read") patch.dateFinished = null;
  return patch;
}

function reducer(state, action) {
  switch (action.type) {
    case "add":
      return { ...state, books: [action.book, ...state.books] };
    case "update":
      return {
        ...state,
        books: state.books.map((b) =>
          b.id === action.id ? { ...b, ...action.patch } : b
        ),
      };
    case "remove":
      return { ...state, books: state.books.filter((b) => b.id !== action.id) };
    case "setGoal":
      return { ...state, goal: action.goal };
    default:
      return state;
  }
}

const LibraryContext = createContext(null);

export function LibraryProvider({ profileId, children }) {
  const [state, dispatch] = useReducer(reducer, profileId, load);

  useEffect(() => {
    localStorage.setItem(libraryKeyFor(profileId), JSON.stringify(state));
  }, [state, profileId]);

  const api = useMemo(
    () => ({
      books: state.books,
      goal: state.goal,
      addBook: (book) => dispatch({ type: "add", book }),
      updateBook: (id, patch) => dispatch({ type: "update", id, patch }),
      removeBook: (id) => dispatch({ type: "remove", id }),
      moveBook: (book, shelf) =>
        dispatch({ type: "update", id: book.id, patch: shelfPatch(book, shelf) }),
      setGoal: (goal) => dispatch({ type: "setGoal", goal }),
    }),
    [state]
  );

  return (
    <LibraryContext.Provider value={api}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
  return ctx;
}

export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
