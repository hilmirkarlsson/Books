import { useEffect, useState } from "react";
import BookSpine from "../components/BookSpine.jsx";
import { buildSpine } from "../lib/spine.js";

const TEST_BOOKS = [
  {
    id: "1",
    title: "Project Hail Mary",
    author: "Andy Weir",
    pages: 496,
    format: "physical",
    coverUrl: "https://covers.openlibrary.org/b/id/10580480-M.jpg",
  },
  {
    id: "2",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    pages: 310,
    format: "physical",
    coverUrl: null,
  },
  {
    id: "3",
    title: "Atomic Habits",
    author: "James Clear",
    pages: 320,
    format: "kindle",
    coverUrl: null,
  },
  {
    id: "4",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    pages: 443,
    format: "audible",
    coverUrl: null,
  },
];

export default function SpinePreview() {
  const [spines, setSpines] = useState({});

  useEffect(() => {
    TEST_BOOKS.forEach((b) => {
      buildSpine(b).then((spine) =>
        setSpines((prev) => ({ ...prev, [b.id]: spine }))
      );
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #3a2a1d 0%, #2a1d14 100%)",
        padding: "48px",
        display: "flex",
        alignItems: "flex-end",
        gap: "10px",
      }}
    >
      {TEST_BOOKS.map((b, i) => (
        <BookSpine
          key={b.id}
          book={{ ...b, spine: spines[b.id] }}
          tilt={i % 2 === 0 ? -1.5 : 2}
        />
      ))}
    </div>
  );
}
