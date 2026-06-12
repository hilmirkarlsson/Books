import { useCallback, useEffect, useRef, useState } from "react";
import { LibraryProvider } from "./lib/store.jsx";
import {
  avatarColor,
  getActiveProfileId,
  makeProfile,
  setActiveProfileId,
} from "./lib/profiles.js";
import { getHouseholdKey, setHouseholdKey } from "./lib/household.js";
import {
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
import SyncSetup from "./components/SyncSetup.jsx";
import {
  BookIcon,
  ChartIcon,
  HomeIcon,
  PlusIcon,
  SyncIcon,
  XIcon,
} from "./components/Icons.jsx";

const NAV = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "library", label: "Shelves", icon: BookIcon },
  { key: "stats", label: "Stats", icon: ChartIcon },
];

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex max-w-sm -translate-x-1/2 animate-rise items-start gap-3 rounded-xl border border-danger/30 bg-raised px-4 py-3 shadow-xl shadow-black/40 sm:bottom-6">
      <p className="flex-1 text-sm text-ink">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-dim transition-colors duration-150 hover:text-ink"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

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

// ── Profile menu ──────────────────────────────────────────────────────────────

function ProfileMenu({ profile, onSwitch }) {
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
            Reading as{" "}
            <span className="font-medium text-ink">{profile.name}</span>
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

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [householdKey, setKey] = useState(getHouseholdKey);
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("home");
  const [shelf, setShelf] = useState("reading");
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(message) {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  // Load profiles from Supabase on mount (or when household key changes).
  useEffect(() => {
    setLoadingProfiles(true);
    setProfile(null);

    fetchProfiles(householdKey)
      .then(async (remote) => {
        // First-ever load on this Supabase project: migrate from localStorage.
        if (remote.length === 0) {
          const migrated = await migrateFromLocalStorage(householdKey);
          if (migrated) return fetchProfiles(householdKey);
        }
        return remote;
      })
      .then((ps) => {
        setProfiles(ps);
        // Restore the previously active profile if it still exists.
        const activeId = getActiveProfileId();
        const active = ps.find((p) => p.id === activeId) ?? null;
        setProfile(active);
        setLoadingProfiles(false);
      })
      .catch((err) => {
        showToast(`Couldn't connect to Supabase: ${err.message}`);
        setLoadingProfiles(false);
      });
  }, [householdKey]);

  // ── Profile handlers ────────────────────────────────────────────────────────

  const handleCreateProfile = useCallback(
    async (name, pin) => {
      const p = makeProfile(name, pin);
      await upsertProfile(p, householdKey);
      setProfiles((prev) => [...prev, p]);
      return p;
    },
    [householdKey]
  );

  const handleDeleteProfile = useCallback(
    async (id) => {
      await removeProfileFromDB(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      if (getActiveProfileId() === id) {
        setActiveProfileId(null);
        setProfile(null);
      }
    },
    []
  );

  function enterProfile(p) {
    setActiveProfileId(p.id);
    setProfile(p);
    setView("home");
    setDetailId(null);
  }

  function switchProfile() {
    setActiveProfileId(null);
    setProfile(null);
  }

  // ── Sync / household key handlers ───────────────────────────────────────────

  function handleLink(newKey) {
    setHouseholdKey(newKey);
    setKey(newKey);         // triggers the useEffect above to re-fetch everything
    setActiveProfileId(null);
    setSyncOpen(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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
        {/* Sync button in the corner of the profile gate */}
        <button
          type="button"
          onClick={() => setSyncOpen(true)}
          aria-label="Sync settings"
          className="fixed right-4 bottom-4 flex items-center gap-1.5 rounded-xl border border-line bg-raised px-3 py-2 text-xs font-medium text-dim transition-colors duration-150 hover:bg-hover hover:text-ink sm:right-6 sm:bottom-6"
        >
          <SyncIcon size={13} />
          Sync
        </button>
        {syncOpen && (
          <SyncSetup
            householdKey={householdKey}
            onLink={handleLink}
            onClose={() => setSyncOpen(false)}
          />
        )}
        {toast && (
          <Toast message={toast} onDismiss={() => setToast(null)} />
        )}
      </>
    );

  return (
    <LibraryProvider
      key={profile.id}
      profileId={profile.id}
      householdKey={householdKey}
      onError={onError}
    >
      <div className="min-h-dvh">
        {/* Desktop / tablet header */}
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
              <button
                type="button"
                onClick={() => setSyncOpen(true)}
                aria-label="Sync settings"
                className="hidden items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-mut transition-colors duration-150 hover:bg-hover hover:text-ink sm:flex"
              >
                <SyncIcon size={14} />
                Sync
              </button>
              <ProfileMenu profile={profile} onSwitch={switchProfile} />
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

        {/* Mobile bottom navigation */}
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
        {syncOpen && (
          <SyncSetup
            householdKey={householdKey}
            onLink={handleLink}
            onClose={() => setSyncOpen(false)}
          />
        )}
        {toast && (
          <Toast message={toast} onDismiss={() => setToast(null)} />
        )}
      </div>
    </LibraryProvider>
  );
}
