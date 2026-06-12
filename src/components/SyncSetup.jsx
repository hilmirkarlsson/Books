import { useState } from "react";
import Modal from "./Modal.jsx";
import { CheckIcon, SyncIcon } from "./Icons.jsx";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default function SyncSetup({ householdKey, onLink, onClose }) {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  function copy() {
    navigator.clipboard.writeText(householdKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function validate() {
    const trimmed = input.trim().toLowerCase();
    if (!UUID_RE.test(trimmed)) {
      setError("That doesn't look like a valid sync key.");
      return null;
    }
    if (trimmed === householdKey) {
      setError("That's already your sync key — nothing to change.");
      return null;
    }
    return trimmed;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const key = validate();
    if (!key) return;
    setConfirming(true);
  }

  function handleConfirm() {
    const key = input.trim().toLowerCase();
    onLink(key);
  }

  return (
    <Modal open onClose={onClose}>
      <div className="space-y-8 px-1">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold">
            <SyncIcon size={18} />
          </span>
          <h2 className="font-display text-xl text-ink">Sync across devices</h2>
        </div>

        {confirming ? (
          /* Confirmation step */
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
              <p className="font-semibold">Replace this device's library?</p>
              <p className="mt-1 text-amber-400">
                All profiles and books on this device will be replaced with the
                data from the other device. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-mut transition-colors duration-150 hover:bg-hover hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:bg-gold-bright active:scale-[0.98]"
              >
                Yes, link this device
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Your sync key */}
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Your sync key
                </h3>
                <p className="mt-0.5 text-xs text-dim">
                  Copy this and paste it on another device to share your
                  library.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5">
                <code className="flex-1 truncate font-mono text-xs text-mut">
                  {householdKey}
                </code>
                <button
                  type="button"
                  onClick={copy}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    copied
                      ? "bg-green-500/20 text-green-400"
                      : "bg-raised text-ink hover:bg-hover"
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckIcon size={12} />
                      Copied
                    </>
                  ) : (
                    "Copy"
                  )}
                </button>
              </div>
            </section>

            {/* Link another device */}
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Link this device
                </h3>
                <p className="mt-0.5 text-xs text-dim">
                  Paste a sync key from another device to use that library here.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setError("");
                  }}
                  placeholder="Paste sync key…"
                  spellCheck={false}
                  className={`w-full rounded-xl border bg-raised px-3.5 py-2.5 font-mono text-xs text-ink placeholder:font-sans placeholder:text-dim focus:outline-none ${
                    error
                      ? "border-danger focus:border-danger"
                      : "border-line focus:border-gold-dim"
                  }`}
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-full rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:bg-gold-bright active:scale-[0.98] disabled:opacity-40"
                >
                  Link this device
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
