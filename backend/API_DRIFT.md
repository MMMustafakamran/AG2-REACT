# Backend API drift — docs.copilotkit.ai/ag2 vs. shipped `ag2`

Every Python snippet on the AG2 doc pages is written against an API that no
published `ag2` release exposes. This file records what was checked, how, and
what this backend does instead. The frontend routes link here; the QA report
draws from it.

Checked against **`ag2` 1.0.3** (latest on PyPI at snapshot time) and **`ag2`
0.9.9** (last release in the `0.9.x` line), Python 3.13, Windows.

Reproduce any section with the commands inline; they need nothing but `uv`.

---

## 1. `from autogen import ConversableAgent, LLMConfig` + `from autogen.ag_ui import AGUIStream` — no release satisfies both

**Every** backend snippet on
[quickstart](https://docs.copilotkit.ai/ag2/quickstart),
[tool-rendering](https://docs.copilotkit.ai/ag2/generative-ui/tool-rendering),
[frontend-tools](https://docs.copilotkit.ai/ag2/frontend-tools),
[shared-state/read](https://docs.copilotkit.ai/ag2/shared-state/read),
[shared-state/write](https://docs.copilotkit.ai/ag2/shared-state/write),
[state-rendering](https://docs.copilotkit.ai/ag2/generative-ui/state-rendering),
[readables](https://docs.copilotkit.ai/ag2/readables) and
[auth](https://docs.copilotkit.ai/ag2/auth) opens with some subset of:

```python
from autogen import ConversableAgent, LLMConfig
from autogen.agentchat import ContextVariables
from autogen.ag_ui import AGUIStream, RunAgentInput
```

Neither line resolves on the version that has the other:

| | `autogen.ConversableAgent` | `autogen.LLMConfig` | `autogen.agentchat.ContextVariables` | `autogen.ag_ui.AGUIStream` | `ag-ui` extra |
|---|---|---|---|---|---|
| `ag2==0.9.9` | yes | yes | yes | **no** | **no** |
| `ag2==1.0.0` | **no** | **no** | **no** | no (`ag2.ag_ui`) | yes |
| `ag2==1.0.3` | **no** | **no** | **no** | no (`ag2.ag_ui`) | yes |

```sh
# 0.9.9 — ConversableAgent exists, ag_ui does not, and the extra is not defined
uv run --with 'ag2==0.9.9' python -c "from autogen.ag_ui import AGUIStream"
# ModuleNotFoundError: No module named 'autogen.ag_ui'
# warning: The package `ag2==0.9.9` does not have an extra named `ag-ui`

# 1.0.3 — there is no `autogen` namespace at all
uv run --with 'ag2[ag-ui]==1.0.3' python -c "import autogen"
# ModuleNotFoundError: No module named 'autogen'

# 1.0.3 — the streaming class the docs name does exist, under `ag2`
uv run --with 'ag2[ag-ui]==1.0.3' python -c "from ag2.ag_ui import AGUIStream; print('ok')"
# ok
```

The `1.0` rewrite renamed the top-level package `autogen` → `ag2` and replaced
`ConversableAgent(name=, system_message=, llm_config=, human_input_mode=)` with
`Agent(name=, prompt=, config=, tools=)`. The docs were updated for the new
`ag_ui` module — `AGUIStream`, `RunAgentInput`, the `/chat` endpoint shape — but
kept the pre-1.0 agent construction around it. The result is a set of snippets
that describes no version that has ever shipped.

**What this backend does.** Targets 1.0.3, the only line where the AG-UI
integration exists. `model_config.py` builds `OpenAIConfig` where the docs build
`LLMConfig`; `agents.py` builds `Agent` where they build `ConversableAgent`.
Each translation sits directly under the published snippet in a comment, so the
two can be read against each other.

**Severity: blocking.** Copy any AG2 backend page into a file and it raises
`ModuleNotFoundError` before reaching a single line of agent logic.

---

## 2. `agent_state` nesting contradicts the frontend snippet on the same page

[shared-state/read](https://docs.copilotkit.ai/ag2/shared-state/read) and
[shared-state/write](https://docs.copilotkit.ai/ag2/shared-state/write) publish
this pair:

```python
def write_state(context: ContextVariables, state: dict) -> StateSnapshotEvent:
    context["agent_state"] = state
    return StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=state)
```

then, further down the same page:

```tsx
<p>Language: {agent.state.language}</p>
```

The snapshot is what becomes `agent.state`. `write_state` stores under
`agent_state` but snapshots the *unnested* `state`, so the two halves of the
page disagree about where the value lives — the write path and the read path
describe different shapes, and only one of them can be what the reader ends up
with. Read the backend literally and `context["agent_state"]` is dead storage
that no later call reads back except `read_state`, which is itself never called
by the page's own tool.

**What this backend does.** Writes `language` and `searches` flat, at the top
level of the run's variables — the shape `agent.state.language` in the page's
own React code requires.

**Severity: high.** Silent. The page renders `Language: undefined` and nothing
errors.

---

## 3. `useAgentContext` readables never reach the agent

[readables](https://docs.copilotkit.ai/ag2/readables) tells you to read
forwarded frontend context out of the agent's context variables:

```python
def get_readable(context: ContextVariables, description: str):
    copilot = context.get("copilotkit", {})
    context_items = copilot.get("context", [])
    ...
```

Nothing ever writes a `copilotkit` key. CopilotKit forwards `useAgentContext`
entries on the AG-UI run input's `context` array, and `AGUIStream.dispatch`
does not read `incoming.context` at all — the only things it merges into a
run's variables are `agent._agent_variables`, the `variables=` argument, and
`incoming.state`:

```sh
uv run --with 'ag2[ag-ui]==1.0.3' python -c "
import inspect, ag2.ag_ui.stream as s
print('incoming.context read anywhere:', 'incoming.context' in inspect.getsource(s))"
# incoming.context read anywhere: False
```

So `get_readable` returns its fallback on every call, forever, with no error.
The page closes on "Ask your agent a question about the context. It should be
able to answer" — which it cannot.

**What this backend does.** `main.py` lifts `RunAgentInput.context` into
`{"copilotkit": {"context": [...]}}` and passes it to `dispatch(dependencies=)`,
so the doc's lookup shape resolves. Dependencies rather than variables because
variables are published as the AG-UI state snapshot, and readables in
`agent.state` would put every `useAgentContext` value on the frontend and in
the Inspector's state view.

**Severity: high.** Silent, and the feature the page exists to teach does not
work.

---

## 4. `Annotated[str, "description"]` aborts the process at import

[tool-rendering](https://docs.copilotkit.ai/ag2/generative-ui/tool-rendering),
[shared-state/read](https://docs.copilotkit.ai/ag2/shared-state/read),
[shared-state/write](https://docs.copilotkit.ai/ag2/shared-state/write) and
[state-rendering](https://docs.copilotkit.ai/ag2/generative-ui/state-rendering)
describe tool parameters with a bare string in `Annotated`:

```python
def get_weather(location: Annotated[str, "Fully spelled out location"]) -> str:
```

That is the pre-1.0 `ConversableAgent` convention. 1.0.3 resolves tool
signatures through `fast_depends`, which treats a string inside `Annotated` as
a forward reference and calls `typing.ForwardRef` on it:

```sh
uv run --with 'ag2[ag-ui,openai]==1.0.3' python -c "
from typing import Annotated
from ag2 import Agent
def get_weather(location: Annotated[str, 'Fully spelled out location']) -> str:
    'Get the weather.'
    return 'sunny'
Agent(name='a', prompt='p', tools=[get_weather])"
# SyntaxError: Forward reference must be an expression -- got 'Fully spelled out location'
```

The shipped form is `Annotated[str, Field(description=...)]`.

**Severity: blocking, but loud.** Unlike §2 and §3 this one stops the process,
so nobody ships it by accident.

---

## 5. Agent-level state defaults silently outrank `agent.setState`

Not a doc error — a library behaviour that breaks the flow the docs teach, and
the trap you fall into if you follow §2's `read_state` default literally.

[shared-state/write](https://docs.copilotkit.ai/ag2/shared-state/write) is
built on `agent.setState({ language: "spanish" })` followed by a re-run.
`AGUIStream` resolves a run's opening state as:

```python
initial_vars  = agent._agent_variables | command.variables      # stream.py
initial_state = (command.incoming.state or {}) | initial_vars
```

`incoming.state` is what the browser sent. It is merged *under* both the
agent's variables and the `variables=` argument, so any key seeded on the
`Agent` overwrites the frontend's value on every single run. Seed
`variables={"language": "english"}` — the natural reading of the doc's
`read_state` fallback — and `setState("spanish")` is reverted before the model
sees it, with no error and no visible cause.

**What this backend does.** No agent-level `variables`. `main.py` merges
`{**defaults, **incoming.state}` per request and passes the result as
`variables=`, which puts the frontend's value on top where the page assumes it
already is.

---

## 6. The Shared State agent is never given a way to *read* its state

The system message on both Shared State pages is:

> "You are a helpful assistant for tracking language. Always respond in the
> current language."

The agent is given exactly one tool, `set_language`, which writes. Nothing
injects the current `language` into the prompt and there is no reader tool, so
the model has no way to know what the current language *is*. Ask it "what
language are you using?" with `language: "spanish"` in state and it answers in
English and calls `set_language("english")` — observed, reproducibly, against
the implementation in `agents.py`.

The state does reach the UI correctly, so the page's stated deliverable
(`agent.state.language` rendered outside the chat) works. It is the chat half
of the instruction that has no mechanism behind it.

**Left as published.** `agents.py` carries the doc's system message and the
doc's single tool. The `/shared-state/in-app-agent-read` route is where this is
demonstrated.

**Severity: medium.** Ambiguity rather than breakage: the page asks for
behaviour it never wires up.

---

## 7. `-> StateSnapshotEvent` returns are inert, and the page needs them not to be

[state-rendering](https://docs.copilotkit.ai/ag2/generative-ui/state-rendering),
[shared-state/read](https://docs.copilotkit.ai/ag2/shared-state/read) and
[shared-state/write](https://docs.copilotkit.ai/ag2/shared-state/write) all
have tools that *return* an AG-UI event:

```python
@agent.register_for_llm(description="Add a search to the state.")
def add_search(context: ContextVariables, new_query: ...) -> StateSnapshotEvent:
    ...
    return write_state(context, state)   # -> StateSnapshotEvent
```

A tool's return value in 1.0.3 is encoded as an ordinary `TOOL_CALL_RESULT`
(`stream.py`, the `events.ToolResultEvent` branch), so a returned
`StateSnapshotEvent` reaches the browser as the string form of a pydantic
model in a tool result — not as AG-UI state.

For Shared State this costs nothing, because mutating `context.variables` is
enough: `AGUIStream` diffs the variables at run end and emits the snapshot
itself. For State Rendering it is the whole feature. That page's promise is a
list that ticks over as the agent works, and the only two snapshots
`AGUIStream` emits on its own are at run start and run end — so `done: false`
is never observable, and the list arrives fully settled in a single frame.

The page's closing line asks for exactly the missing piece and does not supply
it:

> For smoother long-running workflows, emit additional intermediate snapshots
> from your backend tools.

There *is* a mechanism, and no AG2 page mentions it. `AGUIStream` forwards any
`ag2.ag_ui.AGUIEvent` it receives on the agent's own event stream straight
through to the client, and `ConversationContext.send` is how a tool puts one
there:

```python
await context.send(
    AGUIEvent(StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=snapshot))
)
```

**What this backend does.** `_write_searches` in `agents.py` sends that event.
Verified against the running server — the mid-run snapshot arrives between
`TOOL_CALL_ARGS` and `TOOL_CALL_RESULT`:

```
STATE_SNAPSHOT {"searches": []}
TOOL_CALL_START / TOOL_CALL_ARGS
STATE_SNAPSHOT {"searches": [{"query": "ag2 agui", "done": false}]}
TOOL_CALL_RESULT / TOOL_CALL_END
...
STATE_SNAPSHOT {"searches": [{"query": "ag2 agui", "done": true}]}
RUN_FINISHED
```

**Severity: high on State Rendering, cosmetic elsewhere.** The `->
StateSnapshotEvent` annotation is misleading on every page that carries it,
but only State Rendering depends on the behaviour it implies.

---

## Version pins

```
ag2               1.0.3     (extras: openai, ag-ui)
ag-ui-protocol    0.1.22
fastapi           0.141.1
openai            2.54.0
pydantic          2.13.5
uvicorn           0.52.4
python            3.13
```

`gpt-5.4-mini`, the model id every AG2 snippet passes to `LLMConfig`, *is* a
valid literal in `ag2.config.OpenAIConfig` and is what this backend requests by
default. That part of the snippets is fine.
