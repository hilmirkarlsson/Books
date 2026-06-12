import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

import { libraryKeyFor } from "./profiles.js";
import {
  fetchLibrary,
  patchBook,
  removeBookFromDB,
  updateGoal,
  upsertBook,
} from "./supabase.js";

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

function loadFromCache(profileId) {
  try {
    const raw = localStorage.getItem(libraryKeyFor(profileId));
    if (raw) return { ...initialState, ...JSON.parse(raw) };
  } catch {
    // corrupt cache — start fresh
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
    case "hydrate":
      return action.state;
    default:
      return state;
  }
}

const LibraryContext = createContext(null);

export function LibraryProvider({ profileId, householdKey, onError, children }) {
  // Boot from localStorage cache immediately so UI is never blank.
  const [state, dispatch] = useReducer(reducer, profileId, loadFromCache);

  // Prevent a late-arriving hydration from overwriting user changes.
  const userEdited = useRef(false);

  // Stable error reporter that always calls the latest onError prop.
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  const report = useCallback(
    (err) => onErrorRef.current?.(`Sync error: ${err?.message ?? err}`),
    []
  );

  // Hydrate from Supabase once on mount.
  useEffect(() => {
    fetchLibrary(profileId, householdKey)
      .then((remote) => {
        if (!userEdited.current) {
          dispatch({ type: "hydrate", state: remote });
        }
      })
      .catch(report);
  }, [profileId, householdKey, report]);

  // Write-through to localStorage so the next cold load is instant.
  useEffect(() => {
    localStorage.setItem(libraryKeyFor(profileId), JSON.stringify(state));
  }, [state, profileId]);

  const api = useMemo(
    () => ({
      books: state.books,
      goal: state.goal,

      addBook(book) {
        userEdited.current = true;
        dispatch({ type: "add", book });
        upsertBook(book, profileId, householdKey).catch(report);
      },

      updateBook(id, patch) {
        userEdited.current = true;
        dispatch({ type: "update", id, patch });
        patchBook(id, patch).catch(report);
      },

      removeBook(id) {
        userEdited.current = true;
        dispatch({ type: "remove", id });
        removeBookFromDB(id).catch(report);
      },

      moveBook(book, shelf) {
        const patch = shelfPatch(book, shelf);
        userEdited.current = true;
        dispatch({ type: "update", id: book.id, patch });
        patchBook(book.id, patch).catch(report);
      },

      setGoal(goal) {
        userEdited.current = true;
        dispatch({ type: "setGoal", goal });
        updateGoal(profileId, goal).catch(report);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, profileId, householdKey]
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
