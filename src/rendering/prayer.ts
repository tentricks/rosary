import { $ } from "../dom";
import { mysteries } from "../content/mysteries";
import { prayer } from "../content/prayers";
import {
  scriptureRefs,
  scriptureUrl,
  type ScriptureReference,
} from "../content/scripture";
import { saveProgress } from "../persistence";
import { renderRail } from "./rail";
import type { AppState, Sequence } from "../types";
function renderScriptureLinks(refs: ScriptureReference[]) {
  const list = $("scripture-links");
  list.replaceChildren();
  refs.forEach((ref) => {
    const a = document.createElement("a");
    a.href = scriptureUrl(ref);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = ref.label + " ↗";
    a.setAttribute(
      "aria-label",
      ref.label +
        (ref.url
          ? " (opens in a new tab)"
          : " in RSV-2CE (opens in a new tab)"),
    );
    list.appendChild(a);
  });
}
export function render(
  state: AppState,
  sequence: Sequence,
  goTo: (index: number) => void,
) {
  const s = sequence.steps[state.index],
    p = s.key === "mystery" ? undefined : prayer[s.key];
  const mysteryIndex =
    s.decade !== undefined ? s.decade : s.type === "Concluding prayers" ? 4 : 0;
  const currentMystery = mysteries[state.mystery][mysteryIndex];
  const title =
    s.key === "mystery"
      ? currentMystery[0]
      : s.key === "hail" && s.count
        ? "Hail Mary · " + s.count + " of 10"
        : p!.title;
  const type =
    s.key === "mystery"
      ? "Mystery " + (mysteryIndex + 1) + " · Scripture meditation (RSV-2CE)"
      : p!.type;
  const body =
    s.key === "mystery"
      ? "Read the following passages in the Revised Standard Version, Second Catholic Edition:"
      : p!.text;
  $("step-title").textContent = title;
  $("step-type").textContent = type;
  $("step-text").textContent = body;
  $("step-text").classList.toggle("hidden", !state.textVisible);
  const readingLinks = $("scripture-links");
  if (s.key === "mystery")
    renderScriptureLinks(scriptureRefs[state.mystery][mysteryIndex]);
  readingLinks.classList.toggle(
    "hidden",
    s.key !== "mystery" || !state.textVisible,
  );
  $("toggle-text").textContent = state.textVisible
    ? "Hide prayer text"
    : "Show prayer text";
  $("toggle-text").setAttribute("aria-expanded", String(state.textVisible));
  $("current-mystery-title").textContent =
    mysteryIndex + 1 + ". " + currentMystery[0];
  $("current-mystery-description").textContent = currentMystery[1];
  $("progress-count").textContent =
    state.index + 1 + " of " + sequence.steps.length;
  $("progress-fill").style.width =
    ((state.index + 1) / sequence.steps.length) * 100 + "%";
  const bar = document.querySelector<HTMLElement>("[role=progressbar]")!;
  bar.setAttribute("aria-valuemax", String(sequence.steps.length));
  bar.setAttribute("aria-valuenow", String(state.index + 1));
  $("previous").disabled = state.index === 0;
  $("next").disabled = state.index === sequence.steps.length - 1;
  $("next").textContent =
    state.index === sequence.steps.length - 1
      ? "Rosary complete ✓"
      : "Next prayer →";
  state.activeNode = s.node;
  renderRail(state, sequence, goTo);
  $("live-step").scrollTop = 0;
  saveProgress(state.index);
}
