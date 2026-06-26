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
    coverUrl: "/cover-sample-1.svg",
  },
  {
    id: "2",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    pages: 310,
    format: "physical",
    coverUrl: "/cover-sample-2.svg",
  },
  {
    id: "3",
    title: "Meditations",
    author: "Marcus Aurelius",
    pages: 254,
    format: "physical",
    coverUrl: null,
  },
  {
    id: "4",
    title: "Atomic Habits",
    author: "James Clear",
    pages: 320,
    format: "kindle",
    coverUrl: null,
  },
  {
    id: "5",
    title: "Sapiens",
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
        background: "radial-gradient(120% 90% at 50% 0%, #2a1f15 0%, #1a120c 70%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        gap: 40,
      }}
    >
      {/* a single shelf */}
      <div
        style={{
          position: "relative",
          perspective: "1400px",
          perspectiveOrigin: "50% -55%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 4,
            transformStyle: "preserve-3d",
            padding: "0 16px",
          }}
        >
          {TEST_BOOKS.map((b, i) => (
            <BookSpine
              key={b.id}
              book={{ ...b, spine: spines[b.id] }}
              tilt={[0, -1.5, 0, 1.5, 0][i]}
            />
          ))}
        </div>
        {/* shelf board */}
        <div
          style={{
            height: 22,
            background: "linear-gradient(180deg,#5a3f28,#3c2817)",
            borderRadius: "2px 2px 4px 4px",
            boxShadow: "0 14px 22px rgba(0,0,0,0.55), inset 0 2px 2px rgba(255,255,255,0.12)",
            transform: "translateY(-2px)",
          }}
        />
      </div>
    </div>
  );
}
