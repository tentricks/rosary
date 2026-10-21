import { $ } from "./dom";
export function setTheme(theme: string) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("theme-color-meta").content = dark ? "#080b09" : "#f4f1e9";
  $("sun-icon").hidden = dark;
  $("moon-icon").hidden = !dark;
  $("theme-toggle").setAttribute(
    "aria-label",
    dark ? "Switch to light mode" : "Switch to dark mode",
  );
  $("theme-toggle").setAttribute("aria-pressed", String(dark));
}
export function setLeftHanded(left: boolean): void {
  $("workspace").classList.toggle("left-handed", left);
  const button = $("left-handed-toggle");
  button.setAttribute("aria-pressed", String(left));
  button.setAttribute(
    "aria-label",
    left ? "Left-handed layout enabled" : "Left-handed layout disabled",
  );
  button.title = left
    ? "Move rosary to the right side"
    : "Move rosary to the left side";
}
