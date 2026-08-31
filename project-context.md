# Project Goal

QA on the CopilotKit React AG2 docs (<https://docs.copilotkit.ai/ag2>). The job
is **finding bugs and ambiguity in those doc pages**. The deliverable is a
written QA report of the findings plus one recording per page. Everything here
is tooling for that; a clean run that finds nothing when the docs are broken is
a failed run, not a passing one.

## Layout

| Path | What it is |
|---|---|
| `doc-snapshot/` | Version-controlled copy of the upstream doc pages, plus `CHANGELOG.md` of drift |
| `frontend/`, `backend/` | The harness — each doc page is a live route running what that page teaches |
| `backend/API_DRIFT.md` | The doc-vs-shipped-`ag2` record. Start here; it is the headline finding |
| `autorecorder/` | Per-page demo capture (doc → code → live feature), paced to look human |

## Cycle

```
drift check → implement changed pages into the harness → record → report
```

## Rules

1. Snippets go in **verbatim**, highlighted ones especially. A snippet that fails
   as published is the finding — do not fix it.
2. Broken pages keep their broken implementation; the clip exists to show the
   defect.
3. Ambiguity is a defect: missing steps, undefined identifiers, unstated
   prerequisites. Report it even if inference makes the page work.
4. Every finding pins installed vs declared versions.

## The exception rule 1 needs here, and its limit

No AG2 backend snippet runs. They import `autogen.ConversableAgent` and
`autogen.ag_ui.AGUIStream`, and no published `ag2` release has both. Applying
rule 1 literally would mean a backend that does not start and twenty-two routes
with nothing behind them — no recordings, no findings past the first one.

So the backend targets `ag2` 1.0.3 and every translation is written down:
`API_DRIFT.md` gives the reproduction, `agents.py` and `main.py` carry the
published snippet in a comment directly above the shipped equivalent. The rule
still holds everywhere it can — the frontend snippets that fail are kept failing
(Slots level 3, Tool Rendering's render props), because there the page still
loads and the defect is watchable.

The line: translate only what is needed to make the page's own subject
observable, never to make it look correct. If a translation would hide the
defect, it does not happen.

## Gaps the pipeline misses — check by hand

- **New pages** — no route, no recorder entry, no diff; snapshotted but untested.
- **Removed/renamed pages** — leave a live route and a passing recording behind.
- **Legacy code** — the old implementation surviving beside the new one and
  keeping a page falsely green.
- **Pages with no `/demo` route** — unregistered in the recorder, never recorded.
- **Silent failures** — clean console, no error; drift and recording both pass.
  §2, §3 and §5 of `API_DRIFT.md` are all of this kind, and none would have been
  found by running the harness — only by reading the shipped source.
- **Divergence from the Angular build** of the same guide; nothing compares them.

## Done

Drift implemented · §gaps reconciled · superseded code deleted · all routes
recorded · report rebuilt · **clips actually watched**.
