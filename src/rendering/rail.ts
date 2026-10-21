import { $ } from "../dom";
import type { AppState, Sequence, Bead } from "../types";
export function renderRail(
  state: AppState,
  sequence: Sequence,
  goTo: (index: number) => void,
) {
  const rail = $("bead-rail");
  let rows = Math.floor(rail.clientHeight / 40);
  rows = Math.max(5, rows);
  if (rows % 2 === 0) rows--;
  rail.style.setProperty("--visible-rows", String(rows));
  $("rail-count").textContent =
    sequence.orderedNodes.findIndex((item) => item.id === state.activeNode) +
    1 +
    " / " +
    sequence.orderedNodes.length;
  let track = rail.querySelector<HTMLElement>(".rail-track"),
    firstRender = !track,
    oldTransform = track ? track.style.transform : "translateY(0px)";
  if (!track) {
    track = document.createElement("div");
    track.className = "rail-track";
    rail.appendChild(track);
  }
  track.style.transform = oldTransform;
  track.replaceChildren();
  const layout: (Bead | { gap: true })[] = [];
  sequence.orderedNodes.forEach((item) => {
    const gap =
      item.id === "intro-our" ||
      item.id === "intro-hail-1" ||
      item.id === "intro-glory" ||
      /^decade-\d+-our$/.test(item.id) ||
      /^decade-\d+-hail-1$/.test(item.id);
    if (gap)
      layout.push({
        gap: true,
      });
    layout.push(item);
  });
  let y = 0,
    currentY = 0;
  const positionedButtons: { button: HTMLButtonElement; center: number }[] = [];
  const visual = layout.slice().reverse();
  visual.forEach((entry) => {
    if ("gap" in entry) {
      const spacer = document.createElement("div");
      spacer.className = "rail-gap";
      spacer.setAttribute("aria-hidden", "true");
      track.appendChild(spacer);
      y += 32;
      return;
    }
    const slot = document.createElement("div");
    slot.className = "rail-slot";
    const current = entry.id === state.activeNode,
      decadeEnd = /^decade-\d+-hail-10$/.test(entry.id);
    const kind =
      entry.id === "cross"
        ? "cross"
        : entry.id === "intro-glory" || entry.id.endsWith("-our")
          ? "large"
          : "small";
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "rail-item " +
      kind +
      (decadeEnd ? " decade-end" : "") +
      (current ? " current" : "") +
      (entry.stepIndex < state.index ? " done" : "");
    button.setAttribute(
      "aria-label",
      entry.label +
        (decadeEnd ? ", final bead of the decade" : "") +
        (current ? ", current bead" : ""),
    );
    if (current) {
      button.setAttribute("aria-current", "step");
      button.setAttribute("aria-pressed", "true");
    } else button.setAttribute("aria-pressed", "false");
    if (kind === "cross") {
      button.innerHTML =
        '<svg class="rail-cross-icon" viewBox="0 0 48 56" aria-hidden="true"><path d="M18 2h12v16h16v12H30v24H18V30H2V18h16z"/></svg>';
    } else {
      const bead = document.createElement("span");
      bead.className = "rail-bead";
      bead.setAttribute("aria-hidden", "true");
      button.appendChild(bead);
    }
    button.addEventListener("click", () => goTo(entry.stepIndex));
    slot.appendChild(button);
    track.appendChild(slot);
    positionedButtons.push({
      button,
      center: y + 20,
    });
    if (current) currentY = y + 20;
    y += 40;
  });
  const target = rail.clientHeight / 2 - currentY;
  positionedButtons.forEach((x) => {
    const screenY = x.center + target;
    x.button.tabIndex = screenY >= 0 && screenY <= rail.clientHeight ? 0 : -1;
  });
  if (firstRender) {
    track.style.transition = "none";
    track.style.transform = "translateY(" + target + "px)";
    void track.offsetHeight;
    track.style.transition = "";
  } else {
    void track.offsetHeight;
    track.style.transform = "translateY(" + target + "px)";
  }
}
