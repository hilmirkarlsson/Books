const KEY = "shelf.household.v1";

export function getHouseholdKey() {
  let key = localStorage.getItem(KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(KEY, key);
  }
  return key;
}

export function setHouseholdKey(key) {
  localStorage.setItem(KEY, key.trim().toLowerCase());
}
