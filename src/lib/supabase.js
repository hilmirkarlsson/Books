import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "https://mlgehuccskeycoexedsc.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_1e96yGLr_oSVnDbVxAOjKQ_A3L8wOzX"
);

// Single fixed key for this deployment — no user setup needed.
export const HOUSEHOLD_KEY = "f5474ace-5727-48ca-b48a-8001966463a8";

// ── Field mapping (app camelCase ↔ DB snake_case) ────────────────────────────

function bookToRow(book, profileId, householdKey) {
  return {
    id: book.id,
    profile_id: profileId,
    household_key: householdKey,
    title: book.title,
    author: book.author,
    cover_url: book.coverUrl,
    cover_large_url: book.coverLargeUrl,
    isbn: book.isbn,
    year: book.year,
    pages: book.pages,
    current_page: book.currentPage,
    shelf: book.shelf,
    rating: book.rating,
    notes: book.notes,
    wish_reason: book.wishReason,
    priority: book.priority,
    genres: book.genres,
    formats: book.formats,
    date_added: book.dateAdded,
    date_started: book.dateStarted,
    date_finished: book.dateFinished,
  };
}

function rowToBook(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    coverUrl: row.cover_url,
    coverLargeUrl: row.cover_large_url,
    isbn: row.isbn,
    year: row.year,
    pages: row.pages,
    currentPage: row.current_page,
    shelf: row.shelf,
    rating: Number(row.rating),
    notes: row.notes ?? "",
    wishReason: row.wish_reason ?? "",
    priority: row.priority ?? 1,
    genres: row.genres ?? [],
    formats: row.formats ?? [],
    dateAdded: row.date_added,
    dateStarted: row.date_started,
    dateFinished: row.date_finished,
  };
}

// Handles both camelCase (mapped) and already-snake_case patch keys.
const CAMEL_TO_SNAKE = {
  coverUrl: "cover_url",
  coverLargeUrl: "cover_large_url",
  currentPage: "current_page",
  wishReason: "wish_reason",
  dateAdded: "date_added",
  dateStarted: "date_started",
  dateFinished: "date_finished",
};

function patchToRow(patch) {
  const row = {};
  for (const [key, val] of Object.entries(patch)) {
    row[CAMEL_TO_SNAKE[key] ?? key] = val;
  }
  return row;
}

// ── Profiles ─────────────────────────────────────────────────────────────────

export async function fetchProfiles(householdKey) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, hue, pin, reading_goal")
    .eq("household_key", householdKey)
    .order("created_at");
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    hue: r.hue,
    pin: r.pin,
    goal: r.reading_goal,
  }));
}

export async function upsertProfile(profile, householdKey) {
  const { error } = await supabase.from("profiles").upsert({
    id: profile.id,
    household_key: householdKey,
    name: profile.name,
    hue: profile.hue,
    pin: profile.pin ?? null,
    reading_goal: profile.goal ?? 24,
  });
  if (error) throw error;
}

export async function removeProfileFromDB(id) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
}

// ── Books ─────────────────────────────────────────────────────────────────────

export async function fetchLibrary(profileId, householdKey) {
  const [booksRes, profileRes] = await Promise.all([
    supabase
      .from("books")
      .select("*")
      .eq("profile_id", profileId)
      .eq("household_key", householdKey)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("reading_goal")
      .eq("id", profileId)
      .single(),
  ]);
  if (booksRes.error) throw booksRes.error;
  return {
    books: (booksRes.data ?? []).map(rowToBook),
    goal: profileRes.data?.reading_goal ?? 24,
  };
}

export async function upsertBook(book, profileId, householdKey) {
  const { error } = await supabase
    .from("books")
    .upsert(bookToRow(book, profileId, householdKey));
  if (error) throw error;
}

export async function patchBook(id, patch) {
  const { error } = await supabase
    .from("books")
    .update(patchToRow(patch))
    .eq("id", id);
  if (error) throw error;
}

export async function removeBookFromDB(id) {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

export async function updateGoal(profileId, goal) {
  const { error } = await supabase
    .from("profiles")
    .update({ reading_goal: goal })
    .eq("id", profileId);
  if (error) throw error;
}

// ── Migration from localStorage ───────────────────────────────────────────────
// Called once on first Supabase load if remote is empty but local data exists.

export async function migrateFromLocalStorage(householdKey) {
  const rawProfiles = localStorage.getItem("shelf.profiles.v1");
  if (!rawProfiles) return false;

  let localProfiles;
  try {
    localProfiles = JSON.parse(rawProfiles);
  } catch {
    return false;
  }
  if (!localProfiles?.length) return false;

  for (const profile of localProfiles) {
    let goal = 24;
    let books = [];
    const rawLib = localStorage.getItem(`shelf.library.v1::${profile.id}`);
    if (!rawLib) {
      const rawLegacy = localStorage.getItem("shelf.library.v1");
      if (rawLegacy) {
        try {
          const parsed = JSON.parse(rawLegacy);
          books = parsed.books ?? [];
          goal = parsed.goal ?? 24;
        } catch { /* ignore */ }
      }
    } else {
      try {
        const parsed = JSON.parse(rawLib);
        books = parsed.books ?? [];
        goal = parsed.goal ?? 24;
      } catch { /* ignore */ }
    }

    await upsertProfile({ ...profile, goal }, householdKey);
    for (const book of books) {
      await upsertBook(book, profile.id, householdKey);
    }
  }

  return true;
}
