# Rosary prayer guide

A Vite + vanilla TypeScript refactor of `rosary-prayer-guide-readable.html`. The attachment is the sole implementation baseline. The older GitHub version was not used. Development takes place on `dev`; `main` remains the deployment branch. This refactor has not been deployed.

## Run locally

Use Node.js 22.12+ (verified with 22.18.0) and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. To build and preview production files:

```sh
npm run build
npm run preview
```

`dist/` includes the verified production build. Serve that directory with a static web server; the source `index.html` needs Vite to process its TypeScript entry.

## Walkthrough

1. `index.html` retains the attachment's semantic markup, controls, SVG icons and initial attributes. The inline stylesheet and script become ordinary Vite inputs.
2. `src/main.ts` creates the application state, restores saved settings and connects the controls. The application uses browser DOM APIs and has no UI framework or runtime dependencies.
3. `src/content/prayers.ts`, `mysteries.ts` and `scripture.ts` hold the original prayer wording, mystery reflections and reading references. Scripture links retain their accessible labels and safe new-tab attributes.
4. `src/sequence.ts` builds the 82 prayer steps and 61 distinct physical beads. `nodeToStep` records the first prayer for each bead. The cross, decade openings and decade endings each support multiple prayers. Their original click targets and concluding sequence are retained. `defaultMystery()` uses the browser's local weekday.
5. `src/rendering/prayer.ts` updates the prayer, mystery context, progress and accessible control state. `src/rendering/rail.ts` builds the moving vertical rail, preserves 40px bead slots and 32px gaps, centers the current bead, preserves the transition, and keeps offscreen beads out of the tab order.
6. `src/styles.css` keeps the entire stylesheet in its original order, including overlapping overrides, responsive breakpoints, theme rules, handedness, focus styling, reduced-motion rules and animations. This is intentional: collapsing apparently redundant rules can alter the baseline.
7. `src/persistence.ts` owns guarded storage access and the existing progress migration. `src/settings.ts` applies theme and handedness. `src/wake-lock.ts` owns the session-only screen lock, release handling, visibility reacquisition and browser support/status messages.
8. `src/types.ts` describes the state, content keys, steps and beads. `src/dom.ts` provides typed element lookup with an explicit error if required markup is missing.

## Saved progress and preferences

The existing keys are unchanged:

| Key | Behavior |
| --- | --- |
| `rosary-step` | Zero-based current prayer index, saved on every prayer render |
| `rosary-progress-version` | Existing version `3`; original migrations from unversioned/v1 and v2 progress retained |
| `rosary-theme` | Dark/light preference |
| `rosary-left-handed` | Handedness preference |

As in the attachment, text size, text visibility, selected mystery set and keep-awake intent are session-only. The default mystery is selected again from the weekday on load. Reset returns to the first prayer while retaining display preferences.

Browser storage belongs to an origin. Existing users retain progress when the app is eventually served at the same HTTPS origin, `https://rosary.novastark.com`, without clearing their storage. A localhost preview has its own independent storage. This refactor does not read or modify anyone's current browser data.

## Custom domain

`public/CNAME` contains `rosary.novastark.com`. Vite copies it to `dist/CNAME`. The Vite base is `/`, appropriate for this custom-domain root. No DNS, hosting configuration or GitHub settings have been changed. A future hosting update should publish the contents of `dist/`, including `CNAME`, at the existing domain.

## Verification

```sh
npm run build
npx playwright install chromium
npm test
```

The browser suite starts a local production preview, serves the untouched attachment as a comparison fixture, and compares both implementations in the same browser with a fixed local date. It uses a system Edge installation when available, otherwise Playwright Chromium. It writes its report and example screenshots to `test-results/`.

The suite covers every prayer step in all mystery sets, all bead click targets, progress and scripture link attributes, navigation controls, keyboard behavior, text visibility and sizes, desktop/tablet/mobile pixel comparisons, both themes and handedness modes, saved preferences, progress migrations, blocked storage and simulated wake-lock outcomes. CSS source comparison also checks that animation declarations and the cascade remain intact.

See `docs/verification.md` for the recorded verification results, or `test-results/verification.md` after rerunning the suite. Pixel equality is checked within the test browser; other browser engines and physical-device sleep behavior remain manual checks. Wake-lock tests simulate the API rather than measuring device sleep.

`tests/fixtures/baseline.html` is an unchanged copy of the attachment for regression testing, not an application entry point.

## Branch workflow

Work on `dev` and validate with `npm run build` and `npm test`. Updates to `dev` do not publish this app through the current Pages deployment, which uses `main`. Merge to `main` only when ready to release and after the deployment process has been updated to build and publish `dist/`. The Vite source entry point cannot replace the live standalone HTML under the old deployment process.

The root `CNAME` is retained for the current GitHub Pages configuration; `public/CNAME` is copied into future builds. Keep both set to `rosary.novastark.com`.
