import { $ } from "./dom";
// Screen locks are session-only. Restore after returning to a visible page.
export function setupWakeLock(): void {
  let wakeLock: WakeLockSentinel | null = null;
  let keepAwake = false;
  function updateWakeButton() {
    const button = $("wake-toggle");
    if (button.disabled) return;
    button.setAttribute("aria-pressed", String(keepAwake));
    button.setAttribute(
      "aria-label",
      keepAwake ? "Stop keeping the screen awake" : "Keep screen awake",
    );
    button.title = keepAwake
      ? "Allow the screen to sleep"
      : "Keep the screen awake while praying";
    button.classList.toggle("active", keepAwake);
  }
  async function requestWakeLock() {
    if (
      !keepAwake ||
      document.visibilityState !== "visible" ||
      !navigator.wakeLock
    )
      return;
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      if (!keepAwake) {
        await sentinel.release();
        return;
      }
      wakeLock = sentinel;
      sentinel.addEventListener("release", () => {
        if (wakeLock === sentinel) wakeLock = null;
        if (keepAwake && document.visibilityState === "visible") {
          keepAwake = false;
          updateWakeButton();
          $("wake-status").textContent =
            "Your browser released the screen lock.";
        }
      });
      $("wake-status").textContent =
        "The screen will stay awake while this page is visible.";
    } catch (error) {
      keepAwake = false;
      wakeLock = null;
      updateWakeButton();
      $("wake-status").textContent =
        "This browser could not keep the screen awake.";
    }
  }
  async function toggleWakeLock() {
    if (keepAwake) {
      keepAwake = false;
      const sentinel = wakeLock;
      wakeLock = null;
      if (sentinel)
        try {
          await sentinel.release();
        } catch {}
      updateWakeButton();
      $("wake-status").textContent = "The screen may sleep normally.";
      return;
    }
    keepAwake = true;
    updateWakeButton();
    await requestWakeLock();
  }
  const wakeButton = $("wake-toggle");
  if (!navigator.wakeLock || !navigator.wakeLock.request) {
    wakeButton.disabled = true;
    wakeButton.setAttribute(
      "aria-label",
      "Screen wake lock is not supported by this browser",
    );
    wakeButton.title = "Screen wake lock is not supported by this browser";
    $("wake-status").textContent =
      "This browser does not support keeping the screen awake.";
  } else {
    wakeButton.addEventListener("click", toggleWakeLock);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && keepAwake && !wakeLock)
        requestWakeLock();
    });
  }
  updateWakeButton();
}
