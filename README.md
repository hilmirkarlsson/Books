# Shelf 📚

A personal book tracker. Dark, minimal, fast.

**Live:** https://hilmirkarlsson.github.io/Books/

## Features

- Three shelves — Currently Reading, Read, Want to Read
- Search & add books via the Open Library API (title, author or ISBN)
- Quarter-star ratings, notes, genre tags, dates
- Page-progress tracking and a yearly reading goal
- Reading stats with charts (books per month, favourite genres)
- Prioritised wishlist with "why I want to read it"
- Multiple readers per device — pick your name on the "Who's reading?"
  screen, optionally lock your shelves with a PIN. The device remembers
  the last reader. (PINs are a courtesy lock, not real security — all
  data lives in the browser's localStorage.)

## Development

Built with React 19, Vite and Tailwind CSS v4.

```sh
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

Pushing to `main` deploys automatically to GitHub Pages via Actions.
