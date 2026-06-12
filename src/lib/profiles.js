// Reader profiles — identity (name/PIN/avatar) stored in Supabase per household.
// Only the active-profile pointer is device-local (localStorage).

const ACTIVE_KEY = "shelf.activeProfile.v1";

export function libraryKeyFor(profileId) {
  return `shelf.library.v1::${profileId}`;
}

export function getActiveProfileId() {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProfileId(id) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

function hueFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.codePointAt(0)) % 360;
  return h;
}

export function makeProfile(name, pin) {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    pin: pin?.trim() || null,
    hue: hueFor(name.trim()),
    goal: 24,
  };
}

export function avatarColor(profile) {
  return `hsl(${profile.hue} 42% 52%)`;
}
