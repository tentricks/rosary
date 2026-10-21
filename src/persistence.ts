export const safeStorage = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};
// Keep the attachment's existing keys and version 1/2 -> 3 migration.
export function restoreProgress(stepCount: number): number {
  let saved = Number(safeStorage.get("rosary-step"));
  const progressVersion = safeStorage.get("rosary-progress-version");
  if (progressVersion !== "3") {
    if (Number.isFinite(saved) && saved > 0) {
      if (progressVersion === "2") {
        if (saved >= 8) saved--;
      } else if (saved <= 74)
        saved = saved < 7 ? saved : saved + Math.floor((saved - 7) / 13);
    }
    safeStorage.set("rosary-progress-version", "3");
  }

  return Number.isFinite(saved) && saved > 0 && saved < stepCount ? saved : 0;
}
export function saveProgress(index: number): void {
  safeStorage.set("rosary-step", String(index));
}
