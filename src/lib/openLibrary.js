const KNOWN_GENRES = [
  "fantasy",
  "science fiction",
  "mystery",
  "thriller",
  "romance",
  "horror",
  "historical fiction",
  "literary fiction",
  "nonfiction",
  "biography",
  "memoir",
  "poetry",
  "philosophy",
  "psychology",
  "self-help",
  "history",
  "classics",
  "young adult",
  "children",
  "adventure",
  "crime",
  "drama",
  "humor",
  "essays",
  "short stories",
  "graphic novels",
  "dystopia",
  "science",
  "travel",
  "true crime",
];

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function extractGenres(subjects) {
  if (!subjects?.length) return [];
  const lower = subjects.map((s) => s.toLowerCase());
  const found = KNOWN_GENRES.filter((g) =>
    lower.some((s) => s === g || s.includes(g))
  );
  return found.slice(0, 3).map(titleCase);
}

function looksLikeIsbn(q) {
  const stripped = q.replace(/[-\s]/g, "");
  return /^\d{9}[\dXx]$/.test(stripped) || /^\d{13}$/.test(stripped);
}

export async function searchBooks(query, signal) {
  const q = looksLikeIsbn(query)
    ? `isbn:${query.replace(/[-\s]/g, "")}`
    : query;
  const fields =
    "key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject,isbn";
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    q
  )}&fields=${fields}&limit=12`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Open Library returned ${res.status}`);
  const data = await res.json();
  return (data.docs ?? []).map((d) => ({
    olKey: d.key,
    title: d.title,
    author: d.author_name?.[0] ?? "Unknown author",
    coverUrl: d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
      : null,
    coverLargeUrl: d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
      : null,
    year: d.first_publish_year ?? null,
    pages: d.number_of_pages_median ?? null,
    isbn: d.isbn?.[0] ?? null,
    genres: extractGenres(d.subject),
  }));
}
