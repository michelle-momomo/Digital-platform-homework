# Du Over

A responsive guest-session recap website. React + TypeScript + Vite; no account, database, paid service, or API key is required.

## Run locally

Use Node.js 22.12+ (Node 24 was used for validation) and npm.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

## What is included

A pastel world map. Players make a boy or girl pixel pal, then clear three regions of six short levels each. One line of feedback per move. Stars, a mute toggle, and a shareable result card.

- **Vibe Coding · 9 Oct · LaunchLab:** order the ship path, match tools and files, then a launch-day boss.
- **Agentic AI · 30 Oct · Nick Goh:** hire the six-seat handoff, then run one big client.
- **LinkedIn · 13 Nov · Cindy Leong:** headlines, names, formats, a hold-or-fold bonus, then See / Think / Respond.
- Two locked “Coming soon” islands.
- Optional Google Sheet logging. See `docs/RESULTS_SETUP.md`. `/admin` lists runs when `VITE_ADMIN_PASSCODE` is set.

Progress stays in this browser. A failed log never stops the game.

## Content and sources

`src/data.ts` defines session metadata, takeaways, challenge types, tasks, correct answers, explanations, and PDF page references. The supplied lecture PDF is included at `public/lecture-source.pdf` for checking references. Page numbers are physical PDF pages, counting from 1.

The design → build → commit/push → Vercel pipeline combines the workflow on pages 4, 7, 20 and 21; it is explicitly described as one workflow. The file round concerns a simple static HTML/CSS/JavaScript site, not the file structure of this React implementation. The localStorage decision is supplemental learning content. The slide's example prompt about a 15-lesson course is not used as an assignment requirement. LaunchLab is the name in the source title. The Vibe Coding date is the course date 9 Oct 2026. The lecture PDF does not name an individual speaker, so none is shown.

Agentic AI uses Session 4 (media-team and guest-session pages) and Nick Goh’s 55-page deck. Deck page numbers follow the original deck: part 2’s first page is deck page 29. LinkedIn uses Session 5 pages 2 and 28 for the guest slide, plus class notes from Cindy Leong’s 13 Nov 2026 talk for the GEO section the PDF did not include. Only points attributed to her are used. Counts the notes mark as uncertain are omitted. Her name and title follow the guest slide.

The app has not been published or pushed by this implementation task.

## Add a session

1. Add a `Session` object to the exported `sessions` array in `src/data.ts` (or import one from another data file). Use a unique session ID and unique challenge IDs. Pair IDs must be unique across the rounds of a matching challenge.
2. Provide verified content and source references. Leave unknown speaker, role, or date as `null`. Supported challenge discriminators are `pipeline`, `matching`, `decisions`, `staffing`, and `holdem`.
3. Use nonempty challenge lists, at least two pipeline steps, and nonempty matching rounds/scenario options. Answers must refer to existing option IDs.
4. Increment the session's `contentVersion` when questions, answers, scoring, or challenge membership change. Old progress for that session is discarded; other sessions keep theirs.
5. Run the build and tests. Navigation, challenge cards, and completion totals are generated from the actual data, so future placeholders do not count toward progress.

`src/model.ts` owns transitions, scoring and storage validation; `src/App.tsx` renders the shared session and game interfaces; `src/styles.css` contains the responsive visual design.

## Progress limitations

Progress is stored under `after-class.progress` in localStorage on the current origin, browser and device. It does not sync across devices or between a local development address and a deployed site. Clearing site data, private browsing, changing origin, or a content-version change can remove it. If storage is blocked or full, the app remains playable and warns that progress is temporary. Reset removes every session's saved results, best scores, and active attempts after one confirmation. No personal data or credentials are collected.

## Validation

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser tests start an isolated Vite server on port 4174. To use an installed Chromium instead of downloading one:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Unit tests exercise score rules, retries, invalid transitions, refresh serialization, corrupt/old storage, and real challenge totals. Browser tests exercise actual game controls, resets, refreshes, mobile layout, and accessibility checks. Automated accessibility checks supplement manual review; they are not a complete accessibility audit.

## Deploy to Vercel

1. Push this project to your GitHub repository when you are ready.
2. In Vercel, import the repository as a new project.
3. Use the **Vite** preset, build command `npm run build`, output directory `dist`, and the repository root as the root directory.
4. No environment variables are needed. Deploy when you choose to make the site public.

This is a single-page interface without URL routing, so no rewrite rules or server are required. `public/` assets are copied into the production build. This task prepares the project for deployment and does not publish it.
