import { $ } from "./dom";
import { buildSequence, defaultMystery } from "./sequence";
import { restoreProgress, safeStorage } from "./persistence";
import { render as renderPrayer } from "./rendering/prayer";
import { renderRail } from "./rendering/rail";
import { setTheme, setLeftHanded } from "./settings";
import { setupWakeLock } from "./wake-lock";
import type { AppState, Mystery } from "./types";

const sequence = buildSequence();
const state: AppState = {
  mystery: defaultMystery(),
  index: restoreProgress(sequence.steps.length),
  activeNode: "cross",
  textVisible: true,
};
state.activeNode = sequence.steps[state.index].node;
const render = () => renderPrayer(state, sequence, goTo);
function goTo(index: number): void {
  state.index = Math.max(0, Math.min(index, sequence.steps.length - 1));
  state.activeNode = sequence.steps[state.index].node;
  render();
}
$("mystery-choice").value = state.mystery;
setLeftHanded(safeStorage.get("rosary-left-handed") === "true");
$("left-handed-toggle").addEventListener("click", () => {
  const next = !$("workspace").classList.contains("left-handed");
  setLeftHanded(next);
  safeStorage.set("rosary-left-handed", String(next));
});
setTheme(safeStorage.get("rosary-theme") || "dark");
$("theme-toggle").addEventListener("click", () => {
  const theme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(theme);
  safeStorage.set("rosary-theme", theme);
});
setupWakeLock();
$("reset").addEventListener("click", () => goTo(0));
$("mystery-choice").addEventListener("change", (e) => {
  state.mystery = (e.target as HTMLSelectElement).value as Mystery;
  render();
});
$("previous").addEventListener("click", () => goTo(state.index - 1));
$("next").addEventListener("click", () => goTo(state.index + 1));
$("toggle-text").addEventListener("click", () => {
  state.textVisible = !state.textVisible;
  render();
});
document.querySelectorAll<HTMLButtonElement>("[data-size]").forEach((b) =>
  b.addEventListener("click", () => {
    document.body.classList.remove("large", "larger");
    if (b.dataset.size === "large") document.body.classList.add("large");
    if (b.dataset.size === "larger") document.body.classList.add("larger");
    document
      .querySelectorAll("[data-size]")
      .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }),
);
document.addEventListener("keydown", (e) => {
  if (
    e.altKey ||
    e.ctrlKey ||
    e.metaKey ||
    ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(
      document.activeElement?.tagName || "",
    )
  )
    return;
  if (e.key === "ArrowRight") goTo(state.index + 1);
  if (e.key === "ArrowLeft") goTo(state.index - 1);
});
window.addEventListener("resize", () => renderRail(state, sequence, goTo));
render();
