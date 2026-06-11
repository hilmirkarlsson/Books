// Lightweight local "accounts": profiles live in localStorage, each with its
// own library key. PINs are stored in plain text by design — this keeps
// readers from mixing up shelves, it is not a security boundary.

const PROFILES_KEY = "shelf.profiles.v1";
const ACTIVE_KEY = "shelf.activeProfile.v1";
const LEGACY_LIBRARY_KEY = "shelf.library.v1";

export function libraryKeyFor(profileId) {
  return `shelf.library.v1::${profileId}`;
}

export function loadProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupt storage — start fresh
  }
  return [];
}

function saveProfiles(profiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function hueFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.codePointAt(0)) % 360;
  return h;
}

export function createProfile(name, pin) {
  const profile = {
    id: crypto.randomUUID(),
    name: name.trim(),
    pin: pin?.trim() || null,
    hue: hueFor(name.trim()),
  };
  const profiles = loadProfiles();
  // The first profile adopts any library saved before profiles existed.
  const legacy = localStorage.getItem(LEGACY_LIBRARY_KEY);
  if (profiles.length === 0 && legacy) {
    localStorage.setItem(libraryKeyFor(profile.id), legacy);
    localStorage.removeItem(LEGACY_LIBRARY_KEY);
  }
  saveProfiles([...profiles, profile]);
  return profile;
}

export function deleteProfile(id) {
  saveProfiles(loadProfiles().filter((p) => p.id !== id));
  localStorage.removeItem(libraryKeyFor(id));
  if (getActiveProfileId() === id) setActiveProfileId(null);
}

export function getActiveProfile() {
  const id = getActiveProfileId();
  return loadProfiles().find((p) => p.id === id) ?? null;
}

export function getActiveProfileId() {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProfileId(id) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function avatarColor(profile) {
  return `hsl(${profile.hue} 42% 52%)`;
}
