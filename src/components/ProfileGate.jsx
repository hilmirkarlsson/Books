import { useRef, useState } from "react";
import { avatarColor } from "../lib/profiles.js";
import { BookIcon, PlusIcon, XIcon } from "./Icons.jsx";

export function Avatar({ profile, size = 64, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-full font-display font-semibold text-bg select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: avatarColor(profile),
      }}
    >
      {profile.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

function PinPad({ profile, onUnlock, onCancel }) {
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);
  const ref = useRef(null);

  function tryPin(value) {
    setPin(value);
    setWrong(false);
    if (value.length === profile.pin.length) {
      if (value === profile.pin) {
        onUnlock();
      } else {
        setWrong(true);
        setPin("");
      }
    }
  }

  return (
    <div className="animate-rise flex flex-col items-center gap-3">
      <Avatar profile={profile} size={56} />
      <p className="text-sm text-mut">
        Enter PIN for <span className="font-medium text-ink">{profile.name}</span>
      </p>
      <input
        ref={ref}
        autoFocus
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={profile.pin.length}
        value={pin}
        onChange={(e) => tryPin(e.target.value.replace(/\D/g, ""))}
        aria-label={`PIN for ${profile.name}`}
        className={`w-32 rounded-xl border bg-raised px-4 py-3 text-center text-2xl tracking-[0.4em] text-ink focus:outline-none ${
          wrong ? "animate-shake border-danger" : "border-line focus:border-gold-dim"
        }`}
      />
      <p className={`h-4 text-xs ${wrong ? "text-danger" : "text-dim"}`}>
        {wrong ? "Wrong PIN — try again" : " "}
      </p>
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-dim transition-colors duration-150 hover:text-ink"
      >
        Back
      </button>
    </div>
  );
}

function NewProfileForm({ onCreateProfile, onCancel, firstProfile }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onCreateProfile(name, pin);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="animate-rise w-full max-w-xs space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wider text-dim uppercase">
          Your name
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hilmir"
          maxLength={24}
          className="w-full rounded-xl border border-line bg-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-dim focus:border-gold-dim focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wider text-dim uppercase">
          PIN <span className="font-normal normal-case">(optional, digits)</span>
        </span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Leave empty for none"
          className="w-full rounded-xl border border-line bg-raised px-3.5 py-2.5 text-sm tracking-widest text-ink placeholder:tracking-normal placeholder:text-dim focus:border-gold-dim focus:outline-none"
        />
      </label>
      <div className="flex gap-2 pt-1">
        {!firstProfile && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-mut transition-colors duration-150 hover:bg-hover hover:text-ink"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="flex-1 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:bg-gold-bright active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? "Creating…" : "Start reading"}
        </button>
      </div>
    </form>
  );
}

export default function ProfileGate({
  profiles,
  loading,
  onEnter,
  onCreateProfile,
  onDeleteProfile,
}) {
  const [pinFor, setPinFor] = useState(null);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState(false);

  const firstProfile = !loading && profiles.length === 0;

  async function handleCreate(name, pin) {
    const profile = await onCreateProfile(name, pin);
    onEnter(profile);
  }

  async function handleDelete(p) {
    if (
      !confirm(
        `Delete ${p.name} and their whole library? This can't be undone.`
      )
    )
      return;
    await onDeleteProfile(p.id);
  }

  function pick(profile) {
    if (profile.pin) setPinFor(profile);
    else onEnter(profile);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="mb-10 flex animate-rise items-center gap-2.5">
        <BookIcon size={26} className="text-gold" />
        <span className="font-display text-3xl text-ink italic">Shelf</span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 text-dim">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold" />
          <p className="text-sm">Loading…</p>
        </div>
      ) : pinFor ? (
        <PinPad
          profile={pinFor}
          onUnlock={() => onEnter(pinFor)}
          onCancel={() => setPinFor(null)}
        />
      ) : creating || firstProfile ? (
        <>
          <h1 className="mb-6 animate-rise font-display text-2xl text-ink">
            {firstProfile ? "Set up your first reader" : "New reader"}
          </h1>
          <NewProfileForm
            firstProfile={firstProfile}
            onCancel={() => setCreating(false)}
            onCreateProfile={handleCreate}
          />
        </>
      ) : (
        <>
          <h1 className="mb-8 animate-rise font-display text-2xl text-ink">
            Who's reading?
          </h1>
          <div className="flex max-w-md flex-wrap items-start justify-center gap-6">
            {profiles.map((p, i) => (
              <div
                key={p.id}
                className="relative animate-rise"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {managing && (
                  <button
                    type="button"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => handleDelete(p)}
                    className="absolute -top-1 -right-1 z-10 rounded-full bg-danger p-1 text-bg shadow-md"
                  >
                    <XIcon size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => !managing && pick(p)}
                  className="group flex w-20 flex-col items-center gap-2"
                >
                  <Avatar
                    profile={p}
                    size={64}
                    className="transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
                  />
                  <span className="max-w-full truncate text-sm text-mut transition-colors duration-150 group-hover:text-ink">
                    {p.name}
                  </span>
                  {p.pin && <span className="-mt-1 text-[10px] text-dim">PIN</span>}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="group flex w-20 animate-rise flex-col items-center gap-2"
              style={{ animationDelay: `${profiles.length * 50}ms` }}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-line text-dim transition-all duration-200 group-hover:border-gold-dim group-hover:text-gold">
                <PlusIcon size={24} />
              </span>
              <span className="text-sm text-dim transition-colors duration-150 group-hover:text-ink">
                New
              </span>
            </button>
          </div>
          {profiles.length > 0 && (
            <button
              type="button"
              onClick={() => setManaging((m) => !m)}
              className="mt-10 text-xs text-dim transition-colors duration-150 hover:text-mut"
            >
              {managing ? "Done" : "Manage readers"}
            </button>
          )}
        </>
      )}

      <p className="mt-12 max-w-xs text-center text-xs text-dim">
        Each reader keeps their own shelves, synced across your devices. PINs
        are a courtesy lock, not real security.
      </p>
    </div>
  );
}
