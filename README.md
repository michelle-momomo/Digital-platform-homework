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

- One real session: **Vibe Coding**. No invented sessions, speaker attribution, or session date.
- Five collapsible takeaways and three challenges: reorder a pipeline (drag or buttons), two rounds of task matching, and five launch decisions.
- First-attempt scoring: pipeline 1 point, matching 7 points, decisions 5 points. Corrections do not add points. Completion and scores are separate. Retrying replaces the latest result while preserving the personal best.
- Per-challenge explanations, review suggestions, source pages, and a clearly marked localStorage extra tip.
- Browser-local scores and unfinished attempts, refresh restoration, defensive data validation, content-version invalidation, and graceful in-memory fallback when storage is blocked.
- Keyboard navigation, visible focus, native confirmation dialog for reset, mobile controls, and reduced-motion support.

## Content and sources

`src/data.ts` defines session metadata, takeaways, challenge types, tasks, correct answers, explanations, and PDF page references. The supplied lecture PDF is included at `public/lecture-source.pdf` for checking references. Page numbers are physical PDF pages, counting from 1.

The design → build → commit/push → Vercel pipeline combines the workflow on pages 4, 7, 20 and 21; it is explicitly described as one workflow. The file round concerns a simple static HTML/CSS/JavaScript site, not the file structure of this React implementation. The localStorage decision is supplemental learning content. The slide's example prompt about a 15-lesson course is not used as an assignment requirement. Speaker and date remain `null` because they are not unambiguously established by the material.

The app has not been published or pushed by this implementation task.

## Add a session

1. Add a `Session` object to the exported `sessions` array in `src/data.ts` (or import one from another data file). Use a unique session ID and unique challenge IDs. Pair IDs must be unique across the rounds of a matching challenge.
2. Provide verified content and source references. Leave unknown speaker/date as `null`. Supported challenge discriminators are `pipeline`, `matching`, and `decisions`.
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
