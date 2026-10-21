// Fail early with a useful message if the static document and renderer disagree.
interface Controls {
  "mystery-choice": HTMLSelectElement;
  "theme-color-meta": HTMLMetaElement;
  previous: HTMLButtonElement;
  next: HTMLButtonElement;
  "wake-toggle": HTMLButtonElement;
}
export function $<K extends keyof Controls>(id: K): Controls[K];
export function $(id: string): HTMLElement;
export function $(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error("Missing app element: " + id);
  return element;
}
