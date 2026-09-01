# CopilotKit + AG2 Test Suite

A navigable, working test harness for the CopilotKit AG2 integration — each doc page is a route that actually runs the thing it describes.

|                         |                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **Doc sync date**       | Machine-maintained — `doc-snapshot/manifest.json` → `syncedAt`, rewritten on every sync                   |
| **CopilotKit packages** | `@copilotkit/react-core` 1.69.2 · `@copilotkit/runtime` 1.69.2                                            |
| **AG-UI package**       | `@ag-ui/client` 0.0.57 — pinned, not `^`. See Known issues #4                                             |
| **Frontend**            | Next.js 16.3.2 (App Router) · React 19.2.8 · TypeScript · Tailwind 4                                      |
| **Backend**             | Python 3.13 · `ag2` 1.0.3 (`openai`, `ag-ui` extras) · `ag-ui-protocol` 0.1.22 · FastAPI 0.141.1          |
| **Build status**        | No CI. `next build` ✅ · `npm run doctor` (recorder) ✅ · backend verified against a live model ✅        |

> **Read [`backend/API_DRIFT.md`](backend/API_DRIFT.md) first.** No Python snippet on any AG2 doc page imports successfully against any published `ag2` release. That is the headline finding of this repo, and it shapes how the backend here is written.

---

## 2. Overview

[AG2](https://ag2.ai/) (formerly AutoGen) is an open-source agent framework. Its `ag-ui` extra exposes an agent over [AG-UI](https://ag-ui.com), the event protocol CopilotKit speaks, which is what lets a React app drive it with streaming, tool calls, shared state, and generative UI.

This repo is a test harness for that integration, covering a **scoped set of 22 doc pages** (listed in §8). Each route implements what its page teaches and shows the exact source that makes it work.

**Everything here comes from the documentation.** No tool, prompt, or state key was invented — the backend exposes exactly the tools the docs define (`get_weather`, `set_language`, `get_colleagues`, `add_search`, `run_searches`) and nothing else. Where a published snippet does not run, the divergence is written down rather than smoothed over.

Tracks: **<https://docs.copilotkit.ai/ag2>**

---

## 3. Architecture

```
Browser
  │  chat components + hooks from @copilotkit/react-core/v2
  ▼
Next.js app  (frontend/, :3000)
  │  POST /api/copilotkit/*        → CopilotRuntime + InMemoryAgentRunner
  │  POST /api/copilotkit-threads/* → CopilotRuntime + CopilotKitIntelligence
  ▼  HttpAgent (@ag-ui/client), one per agent id
FastAPI  (backend/, :8000)
  │  AGUIStream.dispatch(...)  →  SSE stream of AG-UI events
  ▼
ag2 Agent  →  OpenAI
```

The model provider key lives only in the agent process. The browser never holds it, because it never talks to the agent directly.

### Request lifecycle

1. A chat component posts to `/api/copilotkit` in the Next app.
2. The Copilot Runtime resolves the agent id and forwards the run to the matching AG-UI endpoint through an `HttpAgent`.
3. `AGUIStream` runs the ag2 agent — model call, server-side tools — and translates ag2's own event stream into AG-UI events.
4. Those events stream back as SSE. Browser-executed tools (`useFrontendTool`, `useHumanInTheLoop`) arrive as `TOOL_CALL_CHUNK`, run in the page, and their results go back so the run can continue.

### The three agents

The docs mount one agent at `/chat`. This harness mounts three, because state shape and system prompt belong to the agent that carries them and the docs define two of each. Every endpoint keeps the documented `/chat` suffix.

| Runtime id     | Endpoint                    | Tools                          | Used by                                                                  |
| -------------- | --------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| `my_agent`     | `:8000/chat`                | `get_weather`                  | Quickstart, Tool Rendering, Frontend Tools, and every "helpful assistant" route |
| `sample_agent` | `:8000/sample_agent/chat`   | `set_language`, `get_colleagues` | Shared State read/write, Readables                                       |
| `search_agent` | `:8000/search_agent/chat`   | `add_search`, `run_searches`   | State Rendering                                                          |

---

## 4. Prerequisites

| Requirement          | Version                              | Why                                                               |
| -------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| Node.js              | ^18.18.0 \|\| ^19.8.0 \|\| >= 20.0.0 | Next.js 16                                                          |
| Python               | 3.10 – 3.13                          | `ag2` requires `>=3.10`; this repo pins 3.13 in `.python-version`   |
| [uv](https://docs.astral.sh/uv/) | any recent               | Backend dependency management, as the AG2 quickstart specifies      |
| OpenAI API key       | —                                    | Every AG2 doc sample uses OpenAI                                    |

No CopilotKit account is needed for 18 of the 22 routes. The four Rich Threads routes need CopilotKit Intelligence credentials; without them they degrade rather than break (see §8).

---

## 5. Setup

```bash
git clone https://github.com/MMMustafakamran/AG2-REACT.git
cd AG2-REACT

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && uv sync && cd ..

# Config
cp .env.example .env
```

Then fill in `.env`:

| Variable                             | Required | What it does                                                                                    |
| ------------------------------------ | -------- | ------------------------------------------------------------------------------------------------ |
| `OPENAI_API_KEY`                     | **yes**  | The model provider. Read by the backend only.                                                     |
| `OPENAI_CHAT_MODEL_ID`               | no       | Overrides the model. Defaults to `gpt-5.4-mini`, the id every AG2 snippet names.                   |
| `AGENT_PORT`                         | no       | FastAPI port. Change this and `AG2_AGENT_URL` together.                                           |
| `AGENT_CORS_ORIGINS`                 | no       | Origins allowed to call the agent directly.                                                       |
| `AUTH_BEARER_TOKEN`                  | no       | Turns on the Authentication page's bearer middleware. Unset = open endpoints.                     |
| `AG2_AGENT_URL`                      | no       | Where the runtime reaches the agent. Use `127.0.0.1` if `localhost` resolves to IPv6.             |
| `NEXT_PUBLIC_AUTH_BEARER_TOKEN`      | no       | The token the provider forwards. Must match `AUTH_BEARER_TOKEN`. Belongs in `frontend/.env.local`. |
| `COPILOTKIT_LICENSE_TOKEN`           | no       | Rich Threads only. Verified offline; no login, no network call.                                   |
| `INTELLIGENCE_API_KEY`               | no       | Rich Threads only. The project key for the managed thread store.                                  |

`backend/.env` is read first, then a repo-root `.env`, so a single top-level file works. Next.js does not read either — frontend variables belong in `frontend/.env.local`.

**Default ports:** frontend `3000`, backend `8000`.

### Upgrading dependencies

```bash
# Frontend — respects peer dependencies
cd frontend && npx npm-check-updates -u && npm install

# Backend
cd backend && uv sync --upgrade

# Verify, then regenerate the version manifest the Quickstart clip shows
cd frontend && npx next build
cd ../autorecorder && npm run versions
```

Do not widen `@ag-ui/client` back to a caret range without reading Known issues #4.

---

## 6. Running the project

Two processes, two terminals.

```bash
# Terminal 1 — agent
cd backend && uv run main.py
```

Successful startup:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

```bash
# Terminal 2 — app
cd frontend && npm run dev
```

Successful startup:

```
▲ Next.js 16.3.2 (Turbopack)
- Local:  http://localhost:3000
```

Open **<http://localhost:3000>**. The home page probes the agent server during render — a green *"AG2 AG-UI server"* row reading `200 from http://localhost:8000/health` means both halves are talking.

If it is red, `curl http://localhost:8000/health` directly. A missing `OPENAI_API_KEY` makes the backend exit at startup with a message naming the file it wants.

---

## 7. What to expect — walkthrough per section

### How each route is split

Routes with a live feature are split in two:

|                         |                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **`<route>`**           | Notes, pass/fail criteria, and **the exact source** of the implementation, read off disk at render time. No live chat.                     |
| **`<route>/demo-chat`** | Just the running feature, no sidebar or page chrome — built for screen recording. Reached via **Open demo ↗**, which opens in a new tab.   |

The code on a page is never a re-typed approximation: each page reads real files from the repo via `frontend/src/lib/source.ts`, so what you compare against the doc is what actually runs. Some excerpts use `#region` markers, which stay visible in the source and are labelled with line numbers.

### Getting Started

**`/`** — Orientation plus a live connection check. **Pass:** the AG-UI server row is green.

**`/quickstart`** — An AG2 agent streamed over AG-UI at `/chat`, a runtime route, and a chat. Shows the published backend beside the one that runs. **Try:** `What's the weather in London?` **Pass:** a `get_weather` tool call, then a streamed reply. **Fail:** nothing streams — the agent process is down.

### Basics

**`/prebuilt-components`** — `CopilotChat`, `CopilotSidebar` and `CopilotPopup` behind a tab switcher, all on one agent. **Try:** `What is CopilotKit?` **Pass:** the same reply in each; only the chrome differs, and switching tabs keeps the conversation.

### Custom Look and Feel

**`/custom-look-and-feel/slots`** — All three override levels: class strings, prop overrides, whole-component replacement. **Pass:** level 1 shows a tinted input, level 2 auto-focuses it, level 3 replaces the bubbles entirely. **Note:** level 3's doc sample does not typecheck — Known issues #3.

**`/custom-look-and-feel/headless-ui`** — A chat built from scratch on the headless hooks. **Try:** `Tell me a joke` **Pass:** messages stream into hand-written bubbles with a "Thinking…" indicator.

**`/programmatic-control`** — Driving the agent with no chat UI. **Try:** the *Run* button, then *Stop* mid-run. **Pass:** state and messages update live; stop halts the stream.

**`/inspector`** — CopilotKit's debugging overlay. **Pass:** the Inspector button appears bottom-right, and Agents → AG-UI Events fills as you chat. Localhost only, by design.

### Generative UI

**`/generative-ui/your-components/display-only`** — A React component registered as a tool via `useComponent`. **Try:** `Show the weather card for Tokyo: 77 degrees, clear` **Pass:** a card renders in the chat. The backend never declares this tool.

**`/generative-ui/your-components/interactive`** — An approval gate on `useHumanInTheLoop`. **Try:** `Run the command rm -rf /tmp/cache` **Pass:** the run suspends on Approve/Deny and resumes on click.

**`/generative-ui/tool-rendering`** — A named renderer for `get_weather` plus a wildcard fallback. **Try:** `What's the weather in Tokyo?` **Pass:** "Calling weather API…" becomes "Called the weather API for Tokyo." **Note:** neither doc sample compiles — Known issues #2.

**`/generative-ui/state-rendering`** — A searches list streamed from agent state. **Try:** `Search for the tallest mountains` **Pass:** an unchecked item appears *mid-run*, then flips to checked. That mid-run update needs a mechanism no AG2 page documents — Known issues #7.

### App Control

**`/frontend-tools`** — A tool the agent calls that runs in the browser. **Try:** `Say hello to Damien` **Pass:** a browser alert fires, and after dismissing it the agent confirms. **Fail:** a text reply with no alert.

### Shared State

**`/shared-state/read`** — `agent.state` rendered outside the chat. **Try:** `Switch to Spanish` **Pass:** the Language line updates when the run finishes. **Known limit:** asking the agent *what* language it is using does not work — the page never gives it a way to read its own state (Known issues #6).

**`/shared-state/write`** — `agent.setState` plus an optional re-run. **Try:** *Toggle Language*, then *Toggle + re-run agent*. **Pass:** the first flips the panel and the agent picks it up on your next message; the second makes it respond immediately.

**`/readables`** — `useAgentContext` forwarded as AG-UI run context. **Try:** `Who are my colleagues?` **Pass:** the agent calls `get_colleagues` and answers from the list on the left. This only works because the backend forwards context the docs assume is already there — Known issues #5.

### AG2

**`/auth`** — Bearer-token forwarding, end to end. The page reports the live state of both sides and gives you a chat to send through it; whether that chat succeeds *is* the test. **Note:** the doc's frontend and backend halves do not connect — Known issues #8.

### Rich Threads

All four run on `/api/copilotkit-threads`, a separate Intelligence-backed runtime.

**`/threads`** — What Rich Threads persist and which credentials each part needs.

**`/prebuilt-components/copilot-threads-drawer`** — The drop-in sidebar, zero-prop and with all three documented escape hatches. **Pass:** conversations list and switch. Locked without a license.

**`/headless-threads`** — A thread sidebar built on `useThreads`: rename, archive, delete, switch, paginate. **Pass:** reads work unlicensed; mutations return 422 without a license.

**`/threads-lifecycle`** — Mint, replay, switch. **Pass:** a `threadId` appears on first message and history hydrates on switch.

### Backend

**`/copilot-runtime`** — The live runtime config, agent routing across three ids, and the direct-connection tradeoff.

**`/ag-ui`** — A live capture of the raw AG-UI event stream. **Try:** `What's the weather in Tokyo?` **Pass:** `RUN_STARTED`, `TOOL_CALL_*`, `TEXT_MESSAGE_*`, `RUN_FINISHED` scroll past in order.

### Doc Sync

**`/doc-sync`** — Re-fetches the markdown behind all 22 tracked pages, diffs each against `doc-snapshot/`, and flags changes inside code blocks at higher severity than prose.

---

## 8. Testing checklist / current status

| Doc page                                              | Route                                          | Status       | Notes                                                                       |
| ----------------------------------------------------- | ---------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| `/ag2`                                                | `/`                                            | 📖 Reference | Server-side agent probe.                                                     |
| `/ag2/quickstart`                                     | `/quickstart`                                  | ⚠️ Partial   | Runs, but not from the page's own code. Known issues #1.                    |
| `/ag2/prebuilt-components`                            | `/prebuilt-components`                         | ✅ Working   |                                                                              |
| `/ag2/custom-look-and-feel/slots`                     | `/custom-look-and-feel/slots`                  | ✅ Working   | **Not in the doc sidebar**, but resolves. Level 3 sample fails typecheck.    |
| `/ag2/custom-look-and-feel/headless-ui`               | `/custom-look-and-feel/headless-ui`            | ✅ Working   | **Not in the doc sidebar**; resolves.                                        |
| `/ag2/programmatic-control`                           | `/programmatic-control`                        | ✅ Working   |                                                                              |
| `/ag2/inspector`                                      | `/inspector`                                   | ✅ Working   | Dev-only by design.                                                          |
| `/ag2/generative-ui/your-components/display-only`     | `/generative-ui/your-components/display-only`  | ✅ Working   | Needs no backend declaration.                                                |
| `/ag2/generative-ui/your-components/interactive`      | `/generative-ui/your-components/interactive`   | ✅ Working   | `useHumanInTheLoop` approval gate.                                           |
| `/ag2/generative-ui/tool-rendering`                   | `/generative-ui/tool-rendering`                | ✅ Working   | Both React samples on the page fail to compile — #2.                        |
| `/ag2/generative-ui/state-rendering`                  | `/generative-ui/state-rendering`               | ✅ Working   | Uses `search_agent`. Mid-run snapshots undocumented — #7.                    |
| `/ag2/frontend-tools`                                 | `/frontend-tools`                              | ✅ Working   |                                                                              |
| `/ag2/shared-state/read`                              | `/shared-state/read`                           | ⚠️ Partial   | State reaches the UI; the chat half of the prompt has no mechanism — #6.     |
| `/ag2/shared-state/write`                             | `/shared-state/write`                          | ✅ Working   | Works only because state is merged in the opposite order to the default — #9. |
| `/ag2/readables`                                      | `/readables`                                   | ⚠️ Partial   | The published lookup can never resolve — #5.                                 |
| `/ag2/auth`                                           | `/auth`                                        | ✅ Working   | Doc's own frontend/backend pair does not connect — #8.                       |
| `/ag2/threads`                                        | `/threads`                                     | ⚠️ Partial   | Overview + credentials. Free-tier license expires 2026-09-12.                |
| `/ag2/prebuilt-components/copilot-threads-drawer`     | `/prebuilt-components/copilot-threads-drawer`  | ⚠️ Partial   | Requires the license. Rename absent by design.                              |
| `/ag2/headless-threads`                               | `/headless-threads`                            | ⚠️ Partial   | All four doc steps. Mutations need the license.                             |
| `/ag2/threads-lifecycle`                              | `/threads-lifecycle`                           | ⚠️ Partial   | Server-side replay needs the license.                                       |
| `/ag2/copilot-runtime`                                | `/copilot-runtime`                             | ✅ Working   |                                                                              |
| `/ag2/ag-ui`                                          | `/ag-ui`                                       | ✅ Working   |                                                                              |

**Legend:** ✅ Working · ⚠️ Partial · 📖 Reference · 🚧 Not started · ❌ Broken

Out of scope by request: CLI, Build with agents, MCP Apps, A2UI, Intelligence Platform, Troubleshooting, Cookbook, Tutorials. Also out of scope: `/ag2/threads-import` and `/ag2/threads-self-managed`.

**Sidebar note.** `/ag2/custom-look-and-feel/slots` and `/ag2/custom-look-and-feel/headless-ui` resolve and are fully written, but appear in no expansion of the AG2 sidebar. The only in-nav pointer to the slot system is a five-line snippet at the end of `/ag2/prebuilt-components`. `/ag2/generative-ui/your-components` is a sidebar group whose own URL 404s; its two children resolve.

---

## 9. Known issues / doc-vs-implementation discrepancies

Found while building against `@copilotkit/react-core` 1.69.2, `@copilotkit/runtime` 1.69.2 and `ag2` 1.0.3. Items #1 and #5–#9 have reproduction commands in [`backend/API_DRIFT.md`](backend/API_DRIFT.md).

**1. No AG2 backend snippet imports.** Every Python sample opens with `from autogen import ConversableAgent, LLMConfig` and `from autogen.ag_ui import AGUIStream, RunAgentInput`. `ag2` 0.9.9 has `autogen.ConversableAgent` but no `autogen.ag_ui` and no `ag-ui` extra; `ag2` 1.0.x has `ag2.ag_ui.AGUIStream` but no `autogen` namespace at all. The 1.0 rewrite renamed the package and replaced `ConversableAgent` with `Agent`; the docs picked up the new `ag_ui` module but kept the old agent construction around it. **Blocking, and it affects eight pages.** → API_DRIFT §1

**2. The Quickstart's repo and the Prebuilt Components page cannot both be followed.** The Quickstart says clone `ag2-samples`; that project is Tailwind v3. Prebuilt Components' Setup step says `import "@copilotkit/react-core/v2/styles.css"`; that file ships pre-compiled by Tailwind v4 and opens with `@layer properties`. Tailwind v3's PostCSS plugin stops on it — <code>`@layer base` is used but no matching `@tailwind base` directive is present</code> — and the app will not build or serve. Nothing needs upgrading: it reproduces at the sample's own pinned 1.67.1. Prebuilt Components is the first page after the Quickstart, so everything after it is unreachable. Write-up and recording in `prior-testing/retest-2026-09-01.md`.

**3. Neither React sample on Tool Rendering compiles.** The named renderer is published without a `parameters` schema, which matches neither `useRenderTool` overload. Both samples then read `args` in `render`, where the shipped props carry `parameters`. `useDefaultRenderTool`'s `result` is typed `string | undefined`, so the doc's `JSON.stringify(result, null, 2)` re-encodes an already-encoded string. The page's prose also names `useRenderToolCall` where it means `useRenderTool` — both are exported, and they are different hooks.

**4. Slots level 3 does not typecheck.** "Pass your own React component. It receives all the same props as the default component" is true and insufficient: `messageView` is typed `SlotValue<typeof CopilotChatMessageView>`, the *component type*, so a replacement must also carry the default's `Cursor` static. The sample's untyped `({ messages, isRunning })` destructure is three further `noImplicitAny` errors under the default `create-next-app` tsconfig. Kept verbatim in this repo under a `@ts-expect-error`.

**5. `@ag-ui/client` version is unpinned in the docs and matters.** `@copilotkit/runtime` 1.69.2 bundles `@ag-ui/client` 0.0.57. Installing whatever `latest` gives you at the top level — as `import { HttpAgent } from "@ag-ui/client"` implies, and that was 0.0.58 when this was found and 0.0.59 a day later — yields two copies and `Type 'HttpAgent' is not assignable to type 'AbstractAgent'. Types have separate declarations of a private property '_debug'`. Runtime behaviour is fine; the build is not. This repo pins 0.0.57 to match what the runtime bundles. The same defect reaches the CLI starter, which ships *three* `@ag-ui/client` versions in its own lockfile — see `prior-testing/retest-2026-09-01.md`.

**6. `useAgentContext` readables never reach the agent.** The Readables page reads them from `context.get("copilotkit", {})`. Nothing writes that key: CopilotKit forwards them on `RunAgentInput.context`, and `AGUIStream.dispatch` never reads `incoming.context` at all. The lookup returns its fallback on every call, silently, and the page closes on "it should be able to answer" — which it cannot. `backend/main.py` forwards the array by hand. → API_DRIFT §3

**7. The Shared State agent cannot read its own state.** The system message is "always respond in the current language", but the only tool is `set_language`, which writes. Nothing injects the current value into the prompt and there is no reader tool. Asking the agent what language it is using returns English and a call to `set_language("english")`, reproducibly. Left as published. → API_DRIFT §6

**8. `-> StateSnapshotEvent` returns are inert.** Several pages have tools that *return* an AG-UI event; in 1.0.3 a tool's return value is encoded as an ordinary `TOOL_CALL_RESULT`. For State Rendering this is the whole feature: `AGUIStream` emits snapshots only at run start and run end, so `done: false` is never observable and the list the page promises will tick over arrives fully settled. The page asks for "additional intermediate snapshots from your backend tools" and never shows how. The mechanism — `await context.send(AGUIEvent(StateSnapshotEvent(...)))` — appears on no AG2 page. → API_DRIFT §7

**9. The Authentication page's two halves do not connect.** The frontend step is `properties={{ authorization: userToken }}`, described as forwarded "as a request header". `properties` is a v1 prop that lands in the run's `forwardedProps` — JSON body, not header. The backend step then reads `authorization: str | None = Header(None)`. Nothing in the documented frontend sets the header the documented backend requires. This repo uses `headers` instead. The page also splits into "LangGraph Platform Deployment" and "Self-hosted Deployment" sections: the first names a product from another framework's docs, and the two samples differ only in whether `validate_your_token` has a body.

**10. Agent-level state defaults silently outrank `agent.setState`.** `AGUIStream` resolves opening state as `incoming.state | agent_variables`, so anything seeded on the `Agent` overwrites the browser's value on every run. Seed `variables={"language": "english"}` — the natural reading of the docs' `read_state` fallback — and every `setState("spanish")` is reverted before the model sees it, with no error. This repo keeps no agent-level variables and merges per request instead. Library behaviour rather than a doc error, but it breaks the flow the docs teach. → API_DRIFT §5

**11. `agent_state` nesting contradicts the frontend snippet on the same page.** Both Shared State pages store under `context["agent_state"]` but snapshot the un-nested `state`, while their React samples read `agent.state.language`. The two halves describe different shapes and the stored key is never read back. → API_DRIFT §2

**12. `useAgent` has no `initialState` or `render` prop.** Both Shared State pages and State Rendering use them. In `@copilotkit/react-core` 1.69.2 `UseAgentProps` accepts only `agentId`, `threadId`, `runtimeAgentId`, `updates` and `throttleMs`; the string `initialState` does not occur anywhere in the shipped declarations. This repo seeds state server-side.

**13. `Annotated[str, "description"]` aborts at import.** Four pages describe tool parameters with a bare string in `Annotated` — the pre-1.0 convention. 1.0.3 resolves signatures through `fast_depends`, which treats it as a forward reference: `SyntaxError: Forward reference must be an expression`. The shipped form is `Annotated[str, Field(description=...)]`. → API_DRIFT §4

**14. The Quickstart never shows the code it tells you to run.** Its Python steps are `git clone ag2ai/ag2-samples`, `uv sync`, `uv run python weather.py`, and it states the agent is served at `/weather` — while the callout at the top of the same page, and every other AG2 page, specifies `/chat`.

---

## 10. Troubleshooting

**The connection panel is red.** `curl http://localhost:8000/health`. If it refuses, the backend is not running or bound elsewhere. If it 401s, `AUTH_BEARER_TOKEN` is set but the provider is not forwarding a matching token — see `/auth`.

**The backend exits immediately.** It refuses to start without `OPENAI_API_KEY` and names the file it wants. `backend/.env` wins over the repo-root `.env`.

**Chats fail everywhere at once.** Almost always auth: the token is set on one side only. Both processes need restarting after an env change.

**`localhost` resolves to IPv6.** The agent binds IPv4. Set `AG2_AGENT_URL=http://127.0.0.1:8000`.

**Threads routes are locked.** Expected without `COPILOTKIT_LICENSE_TOKEN`. Read-only thread routes still answer off the in-memory runner; mutations return 422 and `/info` omits `licenseStatus`, which leaves the prebuilt drawer locked.

**The Inspector button is missing.** It mounts on localhost only. `CopilotKitProvider` defaults `showDevConsole` to false, so this repo sets `"auto"` explicitly. Never mount `<CopilotKitInspector />` by hand — it forwards `core ?? null` and reports "CopilotKit core not attached".

**A demo route times out on first hit.** Turbopack compiles routes on demand; the first request to each takes 5–8s. Warm them before running the recorder.

### Doc drift detection

`/doc-sync` re-fetches the markdown behind all 22 tracked pages, diffs each against `doc-snapshot/pages/`, and classifies: changes inside fenced code blocks outrank prose, because a changed snippet may mean a changed API. Drift is appended to `doc-snapshot/CHANGELOG.md`, which keeps the three most recent dated entries. The snapshot is committed; `doc-snapshot/reports/` is not — it is derived.

---

## 11. Project structure

```
AG2-REACT/
├── backend/
│   ├── main.py             FastAPI app: three /chat endpoints, auth middleware, /health
│   ├── agents.py           The three agents and their five tools, each under its doc snippet
│   ├── model_config.py     OpenAIConfig, where the docs build LLMConfig
│   ├── API_DRIFT.md        Docs vs shipped ag2 — seven findings, each reproducible
│   └── pyproject.toml      ag2[openai,ag-ui] >= 1.0.3
│
├── frontend/
│   ├── src/app/
│   │   ├── api/copilotkit/[[...slug]]/route.ts          Runtime: 3 HttpAgents, in-memory runner
│   │   ├── api/copilotkit-threads/[[...slug]]/route.ts  Runtime: Intelligence-backed
│   │   ├── <doc-route>/page.tsx                         Notes, findings, source read off disk
│   │   └── <doc-route>/demo-chat/page.tsx               The live feature, chrome-free
│   ├── src/components/     Route header, nav, code figures, doc-drift panel
│   └── src/lib/
│       ├── nav-config.ts   The single registry: route ↔ doc page ↔ status
│       ├── source.ts       Reads repo files so a page shows its own implementation
│       └── doc-sync/       Fetch, diff, changelog, snapshot store
│
├── doc-snapshot/
│   ├── pages/              22 markdown files — the committed baseline
│   ├── manifest.json       Hashes, routes, sitemap; `syncedAt` is the repo's one sync date
│   └── CHANGELOG.md        Drift history, three most recent dated entries
│
└── autorecorder/
    ├── config/             Project identity, the 20-page registry, selectors
    ├── actions/            Per-page interaction handlers
    ├── core/               Engine, IDE simulator, overlays  (do not edit — see ADAPT.md)
    └── videos/             Output, gitignored
```

---

## 12. References

Grouped as the AG2 doc nav groups them.

**Getting Started** — [Introduction](https://docs.copilotkit.ai/ag2) · [Quickstart](https://docs.copilotkit.ai/ag2/quickstart)

**Basics** — [Prebuilt Components](https://docs.copilotkit.ai/ag2/prebuilt-components)

**Custom Look and Feel** — [Slots](https://docs.copilotkit.ai/ag2/custom-look-and-feel/slots) · [Headless UI](https://docs.copilotkit.ai/ag2/custom-look-and-feel/headless-ui) · [Programmatic Control](https://docs.copilotkit.ai/ag2/programmatic-control) · [Inspector](https://docs.copilotkit.ai/ag2/inspector)

**Generative UI** — [Display-only](https://docs.copilotkit.ai/ag2/generative-ui/your-components/display-only) · [Interactive](https://docs.copilotkit.ai/ag2/generative-ui/your-components/interactive) · [Tool Rendering](https://docs.copilotkit.ai/ag2/generative-ui/tool-rendering) · [State Rendering](https://docs.copilotkit.ai/ag2/generative-ui/state-rendering)

**App Control** — [Frontend Tools](https://docs.copilotkit.ai/ag2/frontend-tools)

**Shared State** — [Reading agent state](https://docs.copilotkit.ai/ag2/shared-state/read) · [Writing agent state](https://docs.copilotkit.ai/ag2/shared-state/write) · [Readables](https://docs.copilotkit.ai/ag2/readables)

**AG2** — [Authentication](https://docs.copilotkit.ai/ag2/auth)

**Rich Threads** — [Overview](https://docs.copilotkit.ai/ag2/threads) · [Threads Drawer](https://docs.copilotkit.ai/ag2/prebuilt-components/copilot-threads-drawer) · [Headless Threads](https://docs.copilotkit.ai/ag2/headless-threads) · [Thread & History Lifecycle](https://docs.copilotkit.ai/ag2/threads-lifecycle)

**Backend** — [Copilot Runtime](https://docs.copilotkit.ai/ag2/copilot-runtime) · [AG-UI](https://docs.copilotkit.ai/ag2/ag-ui)

**Upstream** — [AG2](https://ag2.ai/) · [AG2 AG-UI integration](https://docs.ag2.ai/latest/docs/user-guide/ag-ui/) · [AG-UI protocol](https://ag-ui.com)
