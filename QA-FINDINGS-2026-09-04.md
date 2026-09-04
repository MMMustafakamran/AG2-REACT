# QA findings — 2026-09-04 sync

**Repo:** AG2-react · **Docs:** <https://docs.copilotkit.ai/ag2>

**Versions pinned for every finding below:**

| Package | Declared | Installed |
| --- | --- | --- |
| `@copilotkit/react-core` | `^1.69.2` | 1.69.2 |
| `@ag-ui/client` | `0.0.57` | 0.0.57 |
| `ag2` | — | 1.0.3 (see `backend/API_DRIFT.md`) |

6 pages drifted. The headline is that a long-standing finding of ours was fixed
upstream — and what replaced it brought three new problems.

---

## 1. Shared State: `initialState` and `render` are gone — HIGH

**Pages:** `/ag2/shared-state/read`, `/ag2/shared-state/write`

Neither prop has ever existed on `useAgent` in 1.69.2; `UseAgentProps` accepts
only `agentId`, `threadId`, `runtimeAgentId`, `updates` and `throttleMs`. This
repo has flagged that since the first pass and worked around it by seeding on
the server.

Both are now gone from the docs. Seeding moved into a `useEffect` gated on
`isReady`, which *is* a real return value of the shipped hook, so the published
snippet finally compiles. `setState` also gained the spread it needed.

Implemented as published. The server seed (`LANGUAGE_DEFAULTS` in
`backend/main.py`) stays — it is what stops a re-run reverting `setState`, which
is a separate defect (§5 of `API_DRIFT.md`).

### 1a. `isReady` does not mean the state has loaded

The seed writes `english` whenever `state.language` is undefined at the moment
`isReady` flips true. But `isReady` only reports that the runtime `/info` sync
resolved — nothing about whether a state snapshot has arrived.

Harmless here, because the backend merges `LANGUAGE_DEFAULTS` per request. On a
persisted thread already holding `spanish`, the same snippet races the replay,
and the page offers no guard.

### 1b. The snippet builds a guarded `state` and then ignores it

It computes `const state = (agent.state ?? {}) as Partial<AgentState>`, uses it
in the effect, then renders `{agent.state.language}` — raw, on the one line the
page highlights. The guarded const exists only to feed the effect's dependency
array.

It does not crash: `AbstractAgent` initialises `state` to `{}`, so the read
yields `undefined` and React renders nothing. But the page demonstrates a
defensive pattern it does not follow itself.

### 1c. The fix landed in one snippet and not its sibling

The Implementation step now spreads:

```tsx
agent.setState({ ...(agent.state ?? {}), language: … })
```

"Re-run the agent with a hint about what's changed", further down the same page,
still publishes:

```tsx
agent.setState({ language: newLanguage })
```

No spread, and it reads `agent.state.language` rather than the `state` const the
same page builds. The un-spread one is the worse place for it — it is the
snippet that calls `runAgent()`, so wiped keys reach the agent immediately
rather than on a later turn. A one-key state hides it; the State Rendering
agent's schema would not have.

Both buttons in the demo are as published: **Toggle** spreads, **Toggle +
re-run** does not.

### 1d. The render sample is named after the component it would replace

"Rendering agent state in your app" reuses the name `YourMainContent` from the
step above — the component that draws the whole page — with a body of
`if (!state.language) return null;` plus one `div`. Taken at its word, your main
content becomes a line that vanishes whenever state is empty.

The old `render` prop at least failed to compile. This one compiles and deletes
your UI, which is the harder failure to spot.

Implemented verbatim under its published name and rendered in a dashed box on
the demo, so the return-null behaviour is watchable rather than asserted.

### 1e. In-chat rendering is no longer documented anywhere

The section was retitled from "Rendering agent state in the chat" to "in your
app", and the in-chat option went with the title. No replacement page is linked.

---

## 2. The same line is spelled two ways across the guides — MEDIUM

| Guide | Published |
| --- | --- |
| **AG2** | `{agent.state.language}` |
| Mastra | `{agent.state?.language}` |
| MS Agent Framework | `{agent.state?.language}` |

Same guide, same step, same line. AG2 is the one *without* the optional chaining
— the single character that decides whether the page survives an undefined
state. Nothing says which is intended. Each repo reproduces its own page's
spelling, so the divergence stays visible.

---

## 3. Credentials — HIGH

`INTELLIGENCE_API_KEY` → `CPK_INTELLIGENCE_API_KEY` across headless-threads,
inspector and threads-lifecycle. The placeholder changed from
`your_license_key` to `cpk-...`, and the prose stopped calling it a license key
— the first time the pages separate the project key from a license.

Nothing says whether the old name still works, so
`api/copilotkit-threads` reads the new name first and falls back to the old one.
`daily-recorder.yml` masks and re-exports both spellings.

**Unresolved contradiction:** Headless Threads now states that managed project
setup does *not* issue `COPILOTKIT_LICENSE_TOKEN`, and that it is for offline or
self-hosted licensing only. But `<CopilotThreadsDrawer>` requires a license
status of `valid` or `expiring` and stays locked without one. Nothing
reconciles these; the two claims are only compatible if the drawer is not meant
for managed projects, and no page says that. This repo unlocks only because it
holds a token an older CLI wrote.

Also newly named and never defined: `SL_ENABLED`. `CPK_TELEMETRY_ID` is
described only as "a non-secret analytics identity".

---

## 4. `/premium/*` → `/intelligence/*` — LOW to read, HIGH to detect

Every doc link moved. AG2 tracks none of these pages directly, so no snapshot
changed — but the mechanism is worth recording, because it defeats drift
detection outright:

The `/premium/*` URLs are now **absent from the sitemap entirely** while still
returning 200 with byte-identical content. Not a redirect: a delisted live
duplicate. A snapshot pinned to an old path sees no 404 and no hash change, and
will go on reporting "no drift" however far the two copies diverge. Agno-react
was pinned to exactly such a page.

---

## 5. Tooling gap found while doing this sync — HIGH

`npm run drift:sync` compares hashes of pages already in the manifest. It never
fetches the sitemap, so a page appearing or disappearing upstream is invisible
to it — that comparison lives solely in the `/doc-sync` server action.

A clean CLI run prints **NO DOC DRIFT**, which reads as "the docs have not
moved" when it only means "the pages we already knew about have not moved".

Running the sitemap comparison by hand found **10 URLs** under `/ag2` that were
neither tracked nor previously recorded: 8 `/intelligence/*` renames, plus
`/webmcp` and `/human-in-the-loop/governed-actions`, both genuinely new.

**Fixed:** the CLI script now prints its own scope on every run, and the
manifest's `sitemap` block is rebuilt from what the sitemap actually lists.

---

## A process note

Three of the changes in the first pass of this sync were mine, not the docs'.
The harness rendered `{state.language ?? "—"}` where the page publishes
`{agent.state.language}`; it spread state in the re-run button where the page
does not; and it described the render sample in a callout instead of building
it. Each looked like an improvement and each removed a defect from view.

Rule 1 exists precisely against that instinct. The findings in §1b, §1c and §1d
above only became visible once the published code was restored.

---

## Coverage after this sync

| Area | State |
| --- | --- |
| 6 drifted pages | implemented |
| Sitemap record | rebuilt, clean |
| `webmcp` | **not covered** — new top-level page, no route |
| `human-in-the-loop/governed-actions` | **not covered** — this repo tracks no HITL page |
| Recordings | **not re-run.** Every clip predates these changes. |

Both Shared State clips will differ: the Language line now reads `english` from
load rather than a dash (the dash was ours, never the docs'), a dashed box shows
the render sample returning nothing before the seed lands, and the first Toggle
flips `english → spanish` instead of flipping an unset value.
