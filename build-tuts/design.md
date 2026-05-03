# Tutorial App — Design System & Replication Guide

This document is the **single source of truth** for replicating this tutorial app format for any other repository. Follow it to produce a tutorial that looks and behaves identically to this one.

---

## 1. What This App Is

A client-side React + TypeScript SPA that acts as an interactive "learning book" for a software repository. The learner reads steps in the app and makes changes in the **target repo** — the app itself is never modified by the learner.

**Key properties:**
- No backend. No database. Runs entirely in the browser.
- Progress persists in `localStorage`.
- Content is plain TypeScript files — no MDX, no CMS, no build-time markdown processing.
- Navigation is hash-based (`#/chapter/1/step/1`) — no react-router required.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Bundler | Vite |
| Syntax highlighting | highlight.js (register only the languages you need) |
| Styling | Hand-rolled CSS (no UI library, no Tailwind) |
| Fonts | Google Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (code) |
| Routing | Hash-based, custom hook — no react-router |
| State | React `useState` + `useEffect` + `localStorage` |

**`package.json` dependencies (minimum):**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "highlight.js": "^11.11.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react": "^4.4.1",
    "typescript": "^5.8.3",
    "vite": "^5.4.21"
  }
}
```

---

## 3. Folder Structure

```
your-tutorial/
├── index.html                  ← Google Fonts link tags go here
├── package.json
├── tsconfig.json
├── vite.config.ts
├── design.md                   ← This file
├── README.md
└── src/
    ├── main.tsx                ← React root mount
    ├── App.tsx                 ← Two-panel layout shell
    ├── styles/
    │   └── globals.css         ← Entire design system (see Section 4)
    ├── data/
    │   ├── types.ts            ← All TypeScript interfaces
    │   ├── chapters.ts         ← Re-exports all chapter files as array
    │   └── chapters/
    │       ├── chapter01.ts
    │       ├── chapter02.ts
    │       └── ...             ← One file per chapter
    ├── hooks/
    │   ├── useProgress.ts      ← localStorage persistence
    │   └── useNavigation.ts    ← Hash-based routing
    └── components/
        ├── Sidebar.tsx
        ├── ChapterList.tsx
        ├── MainContent.tsx
        ├── StepBody.tsx
        ├── StepNavigation.tsx
        └── CodeBlock.tsx
```

---

## 4. Neo-Brutalist Design System

### 4.1 Design Principles

| Rule | Detail |
|---|---|
| No shadows | Never use `box-shadow` or `text-shadow` |
| No gradients | Never use `linear-gradient` or `radial-gradient` |
| No border-radius | Never use `border-radius` on interactive elements (buttons, inputs, code blocks) |
| No animations | No `transition` on layout. Transitions on `background-color` only (100ms max) |
| Flat colours | All fills are solid hex values from the palette below |
| Thick borders | Primary border is always `3px solid #000` |
| Large headings | Step titles are min `2.2rem`, `font-weight: 900` |
| Uppercase labels | Section labels are `text-transform: uppercase`, `letter-spacing: 0.08em` |

### 4.2 Colour Palette

```css
:root {
  --color-bg:         #ffffff;
  --color-yellow:     #FFD600;   /* sidebar progress, hover, callout-objective */
  --color-cyan:       #00E5FF;   /* callout-task, current step highlight */
  --color-green:      #69FF47;   /* callout-whyItMatters, completed checklist items */
  --color-red:        #FF2D55;   /* callout-challenge border */
  --color-code-bg:    #F0F0F0;   /* code block background */
  --color-black:      #000000;
  --color-grey-light: #F5F5F5;   /* sidebar background, file entries */
  --color-grey-mid:   #E0E0E0;   /* hover states, step number badge */
  --color-sidebar-bg: #F5F5F5;
}
```

### 4.3 Typography

```css
--font-heading: 'Space Grotesk', system-ui, sans-serif;
--font-body:    'Inter', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;
```

Load via Google Fonts in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
```

### 4.4 Border Tokens

```css
--border:      3px solid #000000;   /* primary — all cards, buttons, callouts */
--border-thin: 2px solid #000000;   /* secondary — file entries, sidebar steps */
--border-red:  3px solid #FF2D55;   /* challenge callout only */
```

### 4.5 Layout Dimensions

```css
--sidebar-width:      290px;
--content-max-width:  860px;
```

### 4.6 Callout Box Colour Map

| Callout type | CSS class | Background |
|---|---|---|
| Objective | `.callout-objective` | `var(--color-yellow)` |
| Task | `.callout-task` | `var(--color-cyan)` |
| Why it matters | `.callout-why` | `var(--color-green)` |
| Challenge | `.callout-challenge` | `var(--color-bg)` + `var(--border-red)` |

### 4.7 Sidebar Header

The sidebar header is always **black background, white text**. The title is the repo/tutorial name in uppercase. Below it is a `font-mono` subtitle at 0.72rem, 70% opacity.

### 4.8 Progress Bar

Yellow background section (`var(--color-yellow)`) immediately below the sidebar header. Contains a `font-mono` uppercase label and a `10px` tall track. The fill is `var(--color-black)`. Track has `--border-thin`.

### 4.9 Current Step Indicator

The active step in the sidebar uses `background: var(--color-cyan)` and `font-weight: 600`. Completed steps use `color: #555`. Both use `--border-thin` implicitly via the step list structure.

### 4.10 Step Number Badge

Large `3.5rem`, `font-weight: 700`, `color: var(--color-grey-mid)` number displayed above the step title. Purely decorative — provides visual rhythm.

---

## 5. TypeScript Content Interfaces

Define these in `src/data/types.ts`. **Do not change these without updating all chapter files.**

```typescript
export interface CommitRef {
  sha: string;
  message: string;
  annotation?: string;
}

export interface FileRef {
  path: string;
  annotation: string;
}

export interface ChecklistItem {
  id: string;   // format: "chapterNum.stepNum.itemNum" e.g. "3.2.1"
  label: string;
}

export interface Step {
  id: string;           // format: "chapterNum.stepNum" e.g. "3.2"
  title: string;
  objective: string;    // One sentence, displayed in yellow callout
  explanation: string;  // Paragraphs joined with \n\n — supports **bold** and `inline code`
  files: FileRef[];     // Files the learner should open in the target repo
  task: string;         // Displayed in cyan callout — the hands-on task
  whyItMatters: string; // Displayed in green callout — the "so what"
  checklist: ChecklistItem[];
  commit?: CommitRef;   // Optional real commit SHA from the repo
  advancedChallenge?: string; // Optional red-border callout
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  steps: Step[];
}

export interface ProgressState {
  completedSteps: string[];
  checklistItems: Record<string, Record<string, boolean>>;
  currentStep: string;
}
```

---

## 6. Content Authoring Rules

### 6.1 Chapter File Structure

Each chapter is a single TypeScript file exporting a `Chapter` object:

```typescript
import type { Chapter } from '../types'

const chapter: Chapter = {
  id: 1,
  title: 'Chapter Title',
  subtitle: 'One sentence describing the chapter goal',
  steps: [ /* Step objects */ ]
}

export default chapter
```

### 6.2 The `p()` Helper — REQUIRED for all explanation strings

**Always** define and use the `p()` helper at the top of every chapter file. This prevents TypeScript template literal errors when explanation text contains backtick characters (e.g., for file globs like `*Tests.cs`):

```typescript
// At the top of every chapter file, after the import:
const p = (...paragraphs: string[]) => paragraphs.join('\n\n')
```

Then write every `explanation` field as:
```typescript
explanation: p(
  'First paragraph — use single quotes. Backticks like `MyClass` are literal here.',
  'Second paragraph — **bold** and `inline code` both work in the renderer.',
  'Third paragraph.',
),
```

**Never** use template literals (backticks) for explanation strings. Always use single-quoted strings passed to `p()`.

### 6.3 Explanation Text Mini-Markdown

The `StepBody` component renders `explanation` strings with a lightweight Markdown parser. Supported syntax:

| Syntax | Renders as |
|---|---|
| `**text**` | `<strong>text</strong>` |
| `` `code` `` | `<code>code</code>` with `--color-code-bg` background |
| ` ```lang\ncode\n``` ` | Syntax-highlighted code block with copy button |
| `\n\n` | New paragraph |

Nothing else is parsed — no headings, no lists, no links inside explanation text.

### 6.4 Code Blocks in Explanation Text

Fenced code blocks work in explanation strings when using the `p()` helper:

```typescript
explanation: p(
  'Here is an example:',
  '```csharp\npublic class MyService\n{\n    // ...\n}\n```',
  'Note that the constructor is private.',
),
```

Supported `highlight.js` language identifiers: `csharp`, `json`, `bash`, `xml`, `plaintext`. Register only these in `main.tsx` (or wherever you initialise highlight.js):

```typescript
import hljs from 'highlight.js/lib/core'
import csharp from 'highlight.js/lib/languages/csharp'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import xml from 'highlight.js/lib/languages/xml'
import plaintext from 'highlight.js/lib/languages/plaintext'

hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('plaintext', plaintext)
```

### 6.5 Commit References

Add a `commit` field to any step that maps to a real commit in the target repository:

```typescript
commit: {
  sha: 'abc1234',           // First 7 characters of the real commit SHA
  message: 'add retry policy with Polly',
  annotation: 'This commit introduced the Polly NuGet package and wrapped the HTTP client factory registration with a retry policy. Read the diff carefully — what does DecorrelatedJitterBackoffV2 do differently from a fixed retry interval?',
}
```

The `annotation` is rendered below the commit badge as a block-quoted prompt to guide the learner's git exploration.

### 6.6 Step Checklist Item IDs

Use the format `"chapterNum.stepNum.itemNum"` — e.g., `"4.3.1"`, `"4.3.2"`. These IDs are stored in `localStorage` so **changing them will reset learner progress for that item**.

### 6.7 Target Step Count

Aim for **5–8 steps per chapter**. Fewer than 5 feels thin; more than 8 creates fatigue. 6–7 is the sweet spot.

---

## 7. Navigation Model

Navigation is hash-based with no dependency on react-router.

**URL format:** `#/chapter/{N}/step/{N}`  
**Default (no hash):** Chapter 1, Step 1

The `useNavigation` hook:
- Reads `window.location.hash` on mount and on `hashchange` events
- Parses chapter/step from the hash
- `goTo(chapterId, stepId)` — sets `window.location.hash`
- `goNext()` / `goPrev()` — advances through steps, crossing chapter boundaries automatically
- `isFirst` / `isLast` — boolean flags for disabling Prev/Next buttons
- `sidebarOpen` / `setSidebarOpen` — mobile sidebar toggle state

---

## 8. Progress Tracking

Progress is stored in `localStorage` under the key `{repo-name}-tutorial-progress`.

**Change the key for each new tutorial** (e.g., `sonic-tutorial-progress`, `myapp-tutorial-progress`) to prevent cross-tutorial state collisions.

`ProgressState` shape:
```typescript
{
  completedSteps: string[];                            // ["1.1", "1.2", ...]
  checklistItems: Record<string, Record<string, boolean>>; // {"1.1": {"1.1.1": true}}
  currentStep: string;                                 // "3.2"
}
```

The progress bar in the sidebar is: `completedSteps.length / totalSteps * 100`.

---

## 9. Component Responsibilities

| Component | Responsibility |
|---|---|
| `App.tsx` | Two-panel layout. Wires `useProgress` + `useNavigation`. Passes data down. Mobile toggle logic. |
| `Sidebar.tsx` | Fixed left panel. Progress bar. Contains `ChapterList`. |
| `ChapterList.tsx` | Renders all chapters as collapsible sections. Highlights current step in cyan. Shows green tick for completed steps. |
| `MainContent.tsx` | Scrollable right panel. Renders step header (breadcrumb, number badge, title) + `StepBody` + `StepNavigation`. |
| `StepBody.tsx` | Renders all step sub-sections: objective, explanation, files, commit ref, task, checklist, why it matters, challenge. Contains the mini Markdown parser. |
| `StepNavigation.tsx` | Prev / Mark Complete / Next buttons. Mark Complete toggles `completedSteps` and turns green when done. |
| `CodeBlock.tsx` | Renders a syntax-highlighted code block with a black header bar (showing language) and a Copy button. Uses `highlight.js`. |

---

## 10. Replication Checklist for a New Repo

When applying this template to a different repository, work through this list:

### Setup
- [ ] Copy `sonic-tutorial/` to `{new-repo-tutorial}/`
- [ ] Update `package.json` name field to `{new-repo}-tutorial`
- [ ] Update `localStorage` key in `useProgress.ts` to `{new-repo}-tutorial-progress`
- [ ] Update sidebar title in `App.tsx` (or pass as a prop) to the new repo/technology name
- [ ] Update `README.md` with correct run instructions

### Content
- [ ] Delete all `src/data/chapters/chapter01.ts` … `chapter12.ts`
- [ ] Analyse the new repo: architecture, key patterns, technologies, commit history
- [ ] Design new chapter structure (aim for 8–12 chapters, 5–8 steps each)
- [ ] Author new chapter files using `p()` helper and single-quoted strings
- [ ] Update `src/data/chapters.ts` to import and export the new chapter files
- [ ] Verify TypeScript compiles: `npx tsc --noEmit`
- [ ] Verify build: `npm run build`

### Styling (should not need changes)
- [ ] `globals.css` is self-contained — no changes needed for a new repo
- [ ] The only CSS change needed: optionally update `--sidebar-width` if chapter/step titles are longer
- [ ] Fonts load from Google Fonts — no changes needed

### Content Quality Check
- [ ] Every step has a real `files` entry pointing to an actual file in the target repo
- [ ] Every step with a `commit` field uses a real, verifiable SHA from the repo's git history
- [ ] Step IDs follow `"chapterNum.stepNum"` format without gaps
- [ ] Checklist IDs follow `"chapterNum.stepNum.itemNum"` format
- [ ] Each chapter has a `subtitle` that describes the learning outcome in one sentence

---

## 11. What NOT to Change

These decisions are load-bearing — changing them requires cascading updates:

| What | Why it's fixed |
|---|---|
| `Step.id` format `"N.N"` | Used as localStorage keys — changing format resets all user progress |
| `ChecklistItem.id` format `"N.N.N"` | Same — stored in localStorage |
| `localStorage` key structure | ProgressState shape must stay stable across deployments |
| Callout colour associations | Yellow=objective, cyan=task, green=why — learners build muscle memory |
| `p()` helper pattern | Required to avoid TypeScript template literal parsing bugs with backticks |
| `highlight.js` language registration | Must be done once at app init — registering in components causes duplicate registration |

---

## 12. AI Agent Instructions for Content Generation

When using an AI agent to generate chapter files for a new repo, provide this instruction block:

```
Write a chapter file for a React tutorial app.

STRICT REQUIREMENTS:
1. File must be valid TypeScript that compiles with `tsc --strict`
2. Import: `import type { Chapter } from '../types'`
3. FIRST LINE AFTER IMPORT: `const p = (...paragraphs: string[]) => paragraphs.join('\n\n')`
4. ALL explanation fields MUST use p() with single-quoted string arguments
5. NEVER use template literals (backtick strings) for explanation text
6. Backticks inside single-quoted strings are fine: 'call `MyMethod()` to...'
7. Export default: `export default chapter`
8. Step IDs: "chapterNum.stepNum" (e.g., "3.1", "3.2")
9. Checklist IDs: "chapterNum.stepNum.itemNum" (e.g., "3.1.1")
10. Aim for 6–7 steps

CONTENT REQUIREMENTS:
- Every step must reference real files from the target repo (verified to exist)
- Commit SHAs must be real and verifiable from `git log`
- Explanation text: junior-friendly first, then senior-level depth
- Task field: a concrete, actionable thing to do in the target repo
- whyItMatters field: the "so what" — career/architecture relevance
```
