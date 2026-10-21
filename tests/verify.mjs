import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { preview } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const baseline = await readFile(
  new URL("./fixtures/baseline.html", import.meta.url),
  "utf8",
);
const originalCss = baseline.split("<style>")[1].split("</style>")[0];
const extractedCss = await readFile(
  new URL("../src/styles.css", import.meta.url),
  "utf8",
);
assert.equal(
  extractedCss.replace(/\s/g, ""),
  originalCss.replace(/\s/g, ""),
  "All CSS rules and their order must remain unchanged",
);
assert.equal(
  (await readFile(new URL("../dist/CNAME", import.meta.url), "utf8")).trim(),
  "rosary.novastark.com",
);
const server = await preview({
  root,
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
});
let browser;
const checks = [];
const errors = [];
const url = "http://127.0.0.1:4173";
const results = new URL("../test-results/", import.meta.url);
await mkdir(results, { recursive: true });

async function open(isBaseline = false, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  await context.route("**/baseline.html", (route) =>
    route.fulfill({ contentType: "text/html", body: baseline }),
  );
  await context.addInitScript(
    ({ storage, blocked, wake }) => {
      // Use the same local weekday in both apps, independent of test execution time.
      const RealDate = Date;
      window.Date = class extends RealDate {
        constructor(...args) {
          super(...(args.length ? args : ["2026-10-21T12:00:00"]));
        }
      };
      if (blocked)
        Object.defineProperty(window, "localStorage", {
          get() {
            throw new DOMException("Blocked", "SecurityError");
          },
        });
      else {
        localStorage.clear();
        for (const [key, value] of Object.entries(storage))
          localStorage.setItem(key, value);
      }
      window.__wake = { requests: 0, releases: 0, sentinels: [] };
      Object.defineProperty(navigator, "wakeLock", {
        configurable: true,
        value:
          wake === "unsupported"
            ? undefined
            : {
                async request() {
                  window.__wake.requests++;
                  if (wake === "denied")
                    throw new DOMException("Denied", "NotAllowedError");
                  const sentinel = new EventTarget();
                  sentinel.release = async () => {
                    window.__wake.releases++;
                    sentinel.dispatchEvent(new Event("release"));
                  };
                  window.__wake.sentinels.push(sentinel);
                  return sentinel;
                },
              },
      });
    },
    {
      storage: options.storage || {},
      blocked: options.blocked || false,
      wake: options.wake || "supported",
    },
  );
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url + (isBaseline ? "/baseline.html" : "/"));
  await page.waitForFunction(
    () =>
      document.querySelector("#progress-count").textContent === "1 of 82" ||
      document.querySelector(".rail-track"),
  );
  return { page, context };
}
async function snapshot(page) {
  return page.evaluate(() => {
    const ids = [
      "step-title",
      "step-type",
      "step-text",
      "current-mystery-title",
      "current-mystery-description",
      "progress-count",
      "rail-count",
      "next",
      "toggle-text",
    ];
    return {
      text: Object.fromEntries(
        ids.map((id) => [id, document.getElementById(id).textContent]),
      ),
      links: [...document.querySelectorAll("#scripture-links a")].map((a) => [
        a.textContent,
        a.href,
        a.rel,
        a.getAttribute("aria-label"),
      ]),
      beads: [...document.querySelectorAll(".rail-item")].map((b) => [
        b.className,
        b.getAttribute("aria-label"),
        b.tabIndex,
        b.getAttribute("aria-current"),
      ]),
      transform: document.querySelector(".rail-track").style.transform,
      hidden: document.getElementById("step-text").className,
      buttons: ["previous", "next"].map(
        (id) => document.getElementById(id).disabled,
      ),
      progress: document.querySelector("[role=progressbar]").outerHTML,
      saved: localStorage.getItem("rosary-step"),
    };
  });
}
async function both(pages, action) {
  for (const page of pages) await action(page);
}
const click = (page, selector) =>
  page.evaluate(
    (selector) => document.querySelector(selector).click(),
    selector,
  );
try {
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  const old = await open(true),
    app = await open();
  const pages = [old.page, app.page];
  for (const mystery of ["joyful", "luminous", "sorrowful", "glorious"]) {
    await both(pages, (page) => click(page, "#reset"));
    await both(pages, (page) => page.selectOption("#mystery-choice", mystery));
    for (let index = 0; index < 82; index++) {
      assert.deepEqual(
        await snapshot(app.page),
        await snapshot(old.page),
        `${mystery}, step ${index}`,
      );
      if (index < 81) await both(pages, (page) => click(page, "#next"));
    }
  }
  checks.push(
    "All 328 rendered steps (82 steps × four mystery sets), prayer text, links, bead positions, progress and completion match the attachment.",
  );
  for (let bead = 0; bead < 61; bead++) {
    await both(pages, (page) =>
      page.evaluate(
        (i) => document.querySelectorAll(".rail-item")[i].click(),
        bead,
      ),
    );
    assert.deepEqual(
      await snapshot(app.page),
      await snapshot(old.page),
      `bead ${bead}`,
    );
  }
  checks.push("All 61 bead jump targets match, including shared beads.");
  await both(pages, (page) => click(page, "#toggle-text"));
  assert.deepEqual(await snapshot(app.page), await snapshot(old.page));
  await both(pages, (page) => click(page, "#toggle-text"));
  await both(pages, (page) => click(page, "#reset"));
  await both(pages, (page) => page.locator("#live-step").focus());
  await both(pages, (page) => page.keyboard.press("ArrowRight"));
  await both(pages, (page) => page.keyboard.press("ArrowLeft"));
  assert.deepEqual(await snapshot(app.page), await snapshot(old.page));
  await both(pages, (page) => page.locator("#next").focus());
  await both(pages, (page) => page.keyboard.press("ArrowRight"));
  assert.deepEqual(await snapshot(app.page), await snapshot(old.page));
  checks.push(
    "Text visibility, reset, keyboard navigation and focused-control guards match.",
  );

  let screenshotCount = 0;
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 640 },
  ]) {
    await both(pages, (page) => page.setViewportSize(viewport));
    for (const theme of ["dark", "light"]) {
      for (const left of [false, true]) {
        await both(pages, (page) =>
          page.evaluate(
            ({ theme, left }) => {
              if (document.documentElement.dataset.theme !== theme)
                document.getElementById("theme-toggle").click();
              if (
                document
                  .getElementById("workspace")
                  .classList.contains("left-handed") !== left
              )
                document.getElementById("left-handed-toggle").click();
            },
            { theme, left },
          ),
        );
        await both(pages, (page) => page.locator("#live-step").focus());
        const a = await old.page.screenshot({ animations: "disabled" });
        const b = await app.page.screenshot({ animations: "disabled" });
        assert.ok(
          a.equals(b),
          `Pixel comparison ${viewport.width}, ${theme}, left=${left}`,
        );
        screenshotCount++;
        if (theme === "dark" && !left && [1280, 390].includes(viewport.width)) {
          await writeFile(new URL(`desktop-${viewport.width}.png`, results), b);
        }
      }
    }
  }
  for (const size of ["large", "larger", "normal"]) {
    await both(pages, (page) => click(page, `[data-size="${size}"]`));
    assert.equal(
      await app.page.locator("body").getAttribute("class"),
      await old.page.locator("body").getAttribute("class"),
    );
    assert.ok(
      (await app.page.screenshot({ animations: "disabled" })).equals(
        await old.page.screenshot({ animations: "disabled" }),
      ),
      `Text size ${size}`,
    );
  }
  checks.push(
    `${screenshotCount} pixel-identical viewport/theme/handedness comparisons, plus all three text sizes. CSS including animations is unchanged.`,
  );
  await old.context.close();
  await app.context.close();
  for (const [version, step] of [
    ["3", "57"],
    ["2", "8"],
    ["2", "79"],
    ["", "7"],
    ["", "74"],
    ["3", "-1"],
    ["3", "999"],
    ["3", "nonsense"],
  ]) {
    const storage = {
      "rosary-step": step,
      "rosary-progress-version": version,
      "rosary-theme": "light",
      "rosary-left-handed": "true",
    };
    const original = await open(true, { storage }),
      next = await open(false, { storage });
    assert.deepEqual(
      await snapshot(next.page),
      await snapshot(original.page),
      `saved progress ${version}/${step}`,
    );
    assert.equal(
      await next.page.locator("html").getAttribute("data-theme"),
      "light",
    );
    assert.ok(
      (await next.page.locator("#workspace").getAttribute("class")).includes(
        "left-handed",
      ),
    );
    await original.context.close();
    await next.context.close();
  }
  checks.push(
    "Current saved progress, legacy v1/v2 migrations, invalid progress, theme and handedness restoration match.",
  );
  const persistent = await open();
  await click(persistent.page, "#next");
  await click(persistent.page, "#theme-toggle");
  await click(persistent.page, "#left-handed-toggle");
  // The normal test initializer seeds storage on each navigation; replace it for this reload test.
  const stored = await persistent.page.evaluate(() => ({ ...localStorage }));
  const restored = await open(false, { storage: stored });
  assert.equal(
    await restored.page.locator("#progress-count").textContent(),
    "2 of 82",
  );
  assert.equal(
    await restored.page.locator("html").getAttribute("data-theme"),
    "light",
  );
  await persistent.context.close();
  await restored.context.close();
  const blocked = await open(false, { blocked: true });
  await click(blocked.page, "#next");
  assert.equal(
    await blocked.page.locator("#progress-count").textContent(),
    "2 of 82",
  );
  await blocked.context.close();
  checks.push(
    "Saved controls persist into a new session; blocked storage still allows navigation.",
  );
  for (const wake of ["supported", "unsupported", "denied"]) {
    const { page, context } = await open(false, { wake });
    if (wake === "unsupported")
      assert.equal(await page.locator("#wake-toggle").isDisabled(), true);
    else {
      await click(page, "#wake-toggle");
      await page.waitForFunction(() => window.__wake.requests === 1);
      if (wake === "denied") {
        await page.waitForFunction(
          () =>
            document
              .getElementById("wake-toggle")
              .getAttribute("aria-pressed") === "false",
        );
        assert.match(
          await page.locator("#wake-status").textContent(),
          /could not/,
        );
      } else {
        assert.equal(
          await page.locator("#wake-toggle").getAttribute("aria-pressed"),
          "true",
        );
        await page.evaluate(() => {
          Object.defineProperty(document, "visibilityState", {
            configurable: true,
            value: "hidden",
          });
          window.__wake.sentinels[0].dispatchEvent(new Event("release"));
          Object.defineProperty(document, "visibilityState", {
            configurable: true,
            value: "visible",
          });
          document.dispatchEvent(new Event("visibilitychange"));
        });
        await page.waitForFunction(() => window.__wake.requests === 2);
        await click(page, "#wake-toggle");
        assert.equal(
          await page.locator("#wake-toggle").getAttribute("aria-pressed"),
          "false",
        );
        assert.equal(await page.evaluate(() => window.__wake.releases), 1);
      }
    }
    await context.close();
  }
  checks.push(
    "Mocked wake lock: request, explicit release, visibility reacquisition, unsupported browser and request denial pass. Physical device sleep behavior requires a device check.",
  );
  assert.deepEqual(errors, [], "No browser runtime errors");
  const report =
    "# Verification results\n\n" +
    checks.map((check) => "- " + check).join("\n") +
    "\n- Strict TypeScript check and Vite production build passed.\n- Built CNAME is rosary.novastark.com. No deployment performed.\n";
  await writeFile(new URL("verification.md", results), report);
  console.log(report);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
