import { useCallback, useEffect, useRef, useState } from "react";
import { LibraryProvider } from "./lib/store.jsx";
import {
  getActiveProfileId,
  makeProfile,
  setActiveProfileId,
} from "./lib/profiles.js";
import {
  HOUSEHOLD_KEY,
  fetchProfiles,
  migrateFromLocalStorage,
  removeProfileFromDB,
  upsertProfile,
} from "./lib/supabase.js";
import Dashboard from "./views/Dashboard.jsx";
import Library from "./views/Library.jsx";
import Stats from "./views/Stats.jsx";
import AddBookModal from "./components/AddBookModal.jsx";
import BookDetailModal from "./components/BookDetailModal.jsx";
import ProfileGate, { Avatar } from "./components/ProfileGate.jsx";
import {
  BookIcon,
  ChartIcon,
  HomeIcon,
  PlusIcon,
  XIcon,
} from "./components/Icons.jsx";

const NAV = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "library", label: "Shelves", icon: BookIcon },
  { key: "stats", label: "Stats", icon: ChartIcon },
];

function Toast({ message, onDismiss }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex max-w-sm -translate-x-1/2 animate-rise items-start gap-3 rounded-xl border border-danger/30 bg-raised px-4 py-3 shadow-xl shadow-black/40 sm:bottom-6">
      <p className="flex-1 text-sm text-ink">{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 text-dim hover:text-ink">
        <XIcon size={14} />
      </button>
    </div>
  );
}

function NavButton({ item, active, onClick, mobile = false }) {
  const Icon = item.icon;
  if (mobile)
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors duration-200 ${
          active ? "text-gold" : "text-dim hover:text-mut"
        }`}
      >
        <Icon size={21} />
        {item.label}
      </button>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
        active ? "bg-raised text-ink" : "text-mut hover:bg-hover hover:text-ink"
      }`}
    >
      <Icon size={16} />
      {item.label}
    </button>
  );
}

function ProfileMenu({ profile, onSwitch }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Reader: ${profile.name}`}
        className="block rounded-full transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        <Avatar profile={profile} size={34} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 animate-pop overflow-hidden rounded-xl border border-line bg-raised shadow-xl shadow-black/50">
          <p className="truncate px-3 pt-2.5 pb-1 text-xs text-dim">
            Reading as <span className="font-medium text-ink">{profile.name}</span>
          </p>
          <button
            type="button"
            onClick={onSwitch}
            className="w-full px-3 py-2 text-left text-sm text-ink transition-colors duration-150 hover:bg-hover"
          >
            Switch reader
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("home");
  const [shelf, setShelf] = useState("reading");
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(message) {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => {
    fetchProfiles(HOUSEHOLD_KEY)
      .then(async (remote) => {
        if (remote.length === 0) {
          const migrated = await migrateFromLocalStorage(HOUSEHOLD_KEY);
          if (migrated) return fetchProfiles(HOUSEHOLD_KEY);
        }
        return remote;
      })
      .then((ps) => {
        setProfiles(ps);
        const active = ps.find((p) => p.id === getActiveProfileId()) ?? null;
        setProfile(active);
        setLoadingProfiles(false);
      })
      .catch((err) => {
        showToast(`Couldn't load library: ${err.message}`);
        setLoadingProfiles(false);
      });
  }, []);

  const handleCreateProfile = useCallback(async (name, pin) => {
    const p = makeProfile(name, pin);
    await upsertProfile(p, HOUSEHOLD_KEY);
    setProfiles((prev) => [...prev, p]);
    return p;
  }, []);

  const handleDeleteProfile = useCallback(async (id) => {
    await removeProfileFromDB(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (getActiveProfileId() === id) { setActiveProfileId(null); setProfile(null); }
  }, []);

  function enterProfile(p) {
    setActiveProfileId(p.id);
    setProfile(p);
    setView("home");
    setDetailId(null);
  }

  const onError = useCallback(showToast, []);

  if (!profile)
    return (
      <>
        <ProfileGate
          profiles={profiles}
          loading={loadingProfiles}
          onEnter={enterProfile}
          onCreateProfile={handleCreateProfile}
          onDeleteProfile={handleDeleteProfile}
        />
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      </>
    );

  return (
    <LibraryProvider key={profile.id} profileId={profile.id} onError={onError}>
      <div className="min-h-dvh">
        <header className="sticky top-0 z-40 border-b border-line-soft bg-bg/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setView("home")}
              className="mr-2 flex items-center gap-2"
              aria-label="Shelf — home"
            >
              <BookIcon size={20} className="text-gold" />
              <span className="font-display text-xl text-ink italic">Shelf</span>
            </button>
            <nav className="hidden gap-1 sm:flex" aria-label="Primary">
              {NAV.map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  active={view === item.key}
                  onClick={() => setView(item.key)}
                />
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gold px-3.5 py-2 text-sm font-semibold text-bg transition-all duration-200 hover:bg-gold-bright active:scale-[0.97]"
              >
                <PlusIcon size={16} />
                <span className="hidden sm:inline">Add book</span>
                <span className="sm:hidden">Add</span>
              </button>
              <ProfileMenu
                profile={profile}
                onSwitch={() => { setActiveProfileId(null); setProfile(null); }}
              />
            </div>
          </div>
        </header>

        <main
          key={view}
          className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 sm:pt-8 sm:pb-16"
        >
          {view === "home" && (
            <Dashboard
              onOpen={setDetailId}
              onAdd={() => setAddOpen(true)}
              gotoLibrary={(s) => { setShelf(s); setView("library"); }}
            />
          )}
          {view === "library" && (
            <Library
              shelf={shelf}
              setShelf={setShelf}
              onOpen={setDetailId}
              onAdd={() => setAddOpen(true)}
            />
          )}
          {view === "stats" && <Stats />}
        </main>

        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
        >
          <div className="flex items-center justify-around py-1.5">
            {NAV.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                mobile
                active={view === item.key}
                onClick={() => setView(item.key)}
              />
            ))}
          </div>
        </nav>

        <AddBookModal open={addOpen} onClose={() => setAddOpen(false)} />
        {detailId && (
          <BookDetailModal bookId={detailId} onClose={() => setDetailId(null)} />
        )}
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      </div>
    </LibraryProvider>
  );
}
