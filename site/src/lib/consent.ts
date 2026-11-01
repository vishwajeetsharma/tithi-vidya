/** The visitor's cookie choice, kept in this browser only. */
export type Consent = "granted" | "denied" | null;

const KEY = "tithi-cookie-choice";
const listeners = new Set<() => void>();
let open = false;

const notify = () => listeners.forEach((listener) => listener());

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readConsent(): Consent {
  try {
    const value = localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function chooseConsent(choice: "granted" | "denied") {
  // Tags run until declined, so declining from "no choice yet" must stop them too.
  const withdrawn = readConsent() !== "denied" && choice === "denied";
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    // Blocked storage: the choice lasts for this page only.
  }
  open = false;
  notify();
  if (withdrawn) {
    // Tags cannot be unloaded, so clear their cookies and start the page again.
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0].trim();
      if (!/^(_ga|_gid|_fbp|_fbc)/.test(name)) continue;
      const domain = location.hostname.replace(/^www\./, "");
      document.cookie = `${name}=; Max-Age=0; path=/`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
    }
    location.reload();
  }
}

export const settingsOpen = () => open;

export function openSettings() {
  open = true;
  notify();
}
