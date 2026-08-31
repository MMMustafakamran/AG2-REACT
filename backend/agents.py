"""The three agents this harness serves.

Each one is lifted from a documentation page rather than designed here. No
tool, prompt, or state key in this file was invented — if it is not in a doc
sample, it is not here.

What *is* ours is the API surface. Every AG2 backend snippet in the docs is
written against `autogen.ConversableAgent` + `autogen.ag_ui.AGUIStream`, which
no published `ag2` release provides (`API_DRIFT.md` has the receipts). Each
agent below therefore carries the doc's snippet verbatim in a comment and the
ag2 1.0.3 translation underneath, so the two can be read against each other.
The translation is mechanical and documented; nothing else is changed.

Why three agents instead of one: the Shared State pages and the State
Rendering page define two different state shapes — `language` and `searches` —
under two different system prompts. One agent cannot carry both without
departing from what the pages show, so each keeps its own endpoint.

  weather_agent  ->  Quickstart, Tool Rendering, Frontend Tools, and every
                     page whose agent is just "a helpful assistant"
  sample_agent   ->  Shared State read + write, Readables
  search_agent   ->  State Rendering
"""

from __future__ import annotations

from typing import Annotated, Any

from ag_ui.core import EventType, StateSnapshotEvent
from ag2 import Agent, Context
from ag2.ag_ui import AGUIEvent
from ag2.config import ModelConfig
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Quickstart + Tool Rendering + Frontend Tools
# docs.copilotkit.ai/ag2/generative-ui/tool-rendering
# ---------------------------------------------------------------------------
#
# As published:
#
#     @agent.register_for_llm(
#         description="Get the weather for a given location. Ensure location is fully spelled out."
#     )
#     def get_weather(location: Annotated[str, "Fully spelled out location"]) -> str:
#         return f"The weather in {location} is sunny."
#
#     agent.register_for_execution(name="get_weather")(get_weather)
#
# `register_for_llm` / `register_for_execution` are `ConversableAgent` methods.
# In ag2 1.0.3 a plain callable passed to `Agent(tools=[...])` is registered for
# both, and the tool description is read off the docstring, so the two
# decorators collapse into the function itself.
#
# `Annotated[str, "Fully spelled out location"]` does not survive either, and
# this one is not cosmetic: ag2 1.0.3 resolves tool signatures through
# `fast_depends`, which treats a bare string inside `Annotated` as a forward
# reference and calls `typing.ForwardRef` on it. Registering the tool exactly
# as published aborts the process at import with
#
#     SyntaxError: Forward reference must be an expression --
#     got 'Fully spelled out location'
#
# The shipped way to describe a parameter is `Field(description=...)`, so every
# `Annotated` in this file carries one. See `API_DRIFT.md` section 4.


# [1] tool rendering: get_weather
# [!code highlight]
# region get-weather
def get_weather(
    location: Annotated[str, Field(description="Fully spelled out location")],
) -> str:
    """Get the weather for a given location. Ensure location is fully spelled out."""
    return f"The weather in {location} is sunny."
# endregion


def create_weather_agent(config: ModelConfig) -> Agent:
    """The Quickstart's agent, plus the one tool the Tool Rendering page adds."""
    # [2] quickstart: agent
    # [!code highlight]
    return Agent(
        name="assistant",
        prompt="You are a helpful assistant.",
        config=config,
        tools=[get_weather],
    )


# ---------------------------------------------------------------------------
# Shared State (read + write) and Readables
# docs.copilotkit.ai/ag2/shared-state/read
# docs.copilotkit.ai/ag2/shared-state/write
# docs.copilotkit.ai/ag2/readables
# ---------------------------------------------------------------------------
#
# As published:
#
#     def read_state(context: ContextVariables) -> dict:
#         return context.get("agent_state", {"language": "english"})
#
#     def write_state(context: ContextVariables, state: dict) -> StateSnapshotEvent:
#         context["agent_state"] = state
#         return StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=state)
#
# Two things do not survive the port, and both are worth reading twice:
#
#   1. `ContextVariables` is a `ConversableAgent` type. ag2 1.0.3's equivalent
#      is `ag2.Context`, injected by annotation, whose `.variables` is the dict.
#
#   2. The docs nest the whole payload under an `agent_state` key, then hand
#      that same nested dict to `StateSnapshotEvent(snapshot=...)`. But the
#      AG-UI snapshot *is* `agent.state` on the frontend, and every frontend
#      snippet on those pages reads `agent.state.language` — not
#      `agent.state.agent_state.language`. Following the backend snippet
#      verbatim puts the value one level deeper than the frontend snippet on
#      the same page looks for it. This harness writes the key flat, which is
#      what makes the page's own React code work. See `API_DRIFT.md` section 2.
#
# `StateSnapshotEvent` is not constructed by hand here either: `AGUIStream`
# already emits one at run start and again at run end whenever the context
# variables changed, so mutating `context.variables` is the whole mechanism.

DEFAULT_LANGUAGE = "english"


# [3] shared state: set_language
# [!code highlight]
# region set-language
def set_language(
    language: Annotated[
        str, Field(description="language such as english or spanish")
    ],
    context: Context,
) -> str:
    """Update the language in shared state."""
    context.variables["language"] = language.lower()
    return f"Language updated to {language.lower()}."
# endregion


# [4] readables: get_colleagues
# [!code highlight]
# region get-colleagues
def get_colleagues(context: Context) -> list[dict[str, Any]]:
    """Return the current user's colleagues from CopilotKit readables."""
    return _read_readable(context, "The current user's colleagues") or []
# endregion


def _read_readable(context: Context, description: str) -> Any:
    """The docs' `get_readable`, with one correction.

    Published as:

        copilot = context.get("copilotkit", {})
        context_items = copilot.get("context", [])

    Nothing under a `copilotkit` key ever reaches an AG2 agent on its own.
    CopilotKit forwards `useAgentContext` entries in the AG-UI run input's
    `context` array, and `AGUIStream` drops that array on the floor — it is
    never copied into the run's variables or anywhere else the agent can see.
    So the published lookup returns `[]` on every call, silently, and the page
    ends with "Ask your agent a question about the context. It should be able
    to answer." when it cannot. `main.py` does the forwarding `AGUIStream`
    omits.

    One deliberate difference from the snippet: the payload arrives on
    `context.dependencies`, not `context.variables`. Variables are what
    `AGUIStream` publishes as the AG-UI state snapshot, so putting readables
    there would republish every `useAgentContext` value into `agent.state` on
    the frontend and into the Inspector's state view. Dependencies are
    request-scoped and are not snapshotted. See `API_DRIFT.md` section 3.
    """
    copilot = context.dependencies.get("copilotkit", {})
    context_items = copilot.get("context", [])
    return next(
        (
            item.get("value")
            for item in context_items
            if item.get("description") == description
        ),
        None,
    )


def create_sample_agent(config: ModelConfig) -> Agent:
    return Agent(
        name="assistant",
        prompt=(
            "You are a helpful assistant for tracking language. "
            "Always respond in the current language."
        ),
        config=config,
        tools=[set_language, get_colleagues],
    )


# The docs' `read_state` fallback, `{"language": "english"}`. It is applied per
# request in `main.py` rather than passed to `Agent(variables=...)`, because
# `AGUIStream` resolves a run's state as `incoming.state | agent_variables` —
# agent-level variables win. Seed `language` on the agent and the frontend's
# `agent.setState({ language: "spanish" })` is silently overwritten by
# `"english"` on the very next run, which is exactly the flow the Shared State
# write page documents. See `API_DRIFT.md` section 5.
LANGUAGE_DEFAULTS: dict[str, Any] = {"language": DEFAULT_LANGUAGE}


# ---------------------------------------------------------------------------
# State Rendering
# docs.copilotkit.ai/ag2/generative-ui/state-rendering
# ---------------------------------------------------------------------------
#
# The models below are the doc's, unchanged. Only the two tools are ported:
# `context: ContextVariables` becomes `context: Context`, `read_state` /
# `write_state` go through `context.variables`, and the hand-built
# `StateSnapshotEvent` return is dropped because `AGUIStream` emits it.


# [5] state rendering: state models
# [!code highlight]
class Search(BaseModel):
    query: str
    done: bool


class AgentState(BaseModel):
    searches: list[Search] = Field(default_factory=list)


def _read_searches(context: Context) -> AgentState:
    return AgentState.model_validate({"searches": context.variables.get("searches", [])})


async def _write_searches(context: Context, state: AgentState) -> dict[str, Any]:
    """The doc's `write_state`, and the one place its `StateSnapshotEvent` survives.

    Published as:

        def write_state(context: ContextVariables, state: AgentState) -> StateSnapshotEvent:
            snapshot = state.model_dump()
            context["agent_state"] = snapshot
            return StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=snapshot)

    *Returning* the event does nothing in ag2 1.0.3 — a tool's return value is
    encoded as an ordinary `TOOL_CALL_RESULT`, so the snapshot would reach the
    browser as the string form of a pydantic model. `AGUIStream` does forward a
    real AG-UI event, but only one it receives on the agent's own event stream,
    wrapped in `ag2.ag_ui.AGUIEvent`. That is what `context.send` below does.

    Without it the page does not do what it says. `AGUIStream` emits a snapshot
    at run start and one more at run end if the variables changed, and nothing
    in between — so `done: false` would never be observable, and a list the page
    promises will "tick over" would arrive fully settled in one frame. The
    page's own closing line asks for exactly this ("emit additional intermediate
    snapshots from your backend tools") without ever showing the mechanism.
    See `API_DRIFT.md` section 7.
    """
    snapshot = state.model_dump()
    context.variables["searches"] = snapshot["searches"]
    await context.send(
        AGUIEvent(StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=snapshot))
    )
    return snapshot


# [6] state rendering: add_search
# [!code highlight]
# region add-search
async def add_search(
    new_query: Annotated[str, Field(description="The query to add to state")],
    context: Context,
) -> dict[str, Any]:
    """Add a search to the state."""
    state = _read_searches(context)
    state.searches.append(Search(query=new_query, done=False))
    return await _write_searches(context, state)
# endregion


# [7] state rendering: run_searches
# [!code highlight]
# region run-searches
async def run_searches(context: Context) -> dict[str, Any]:
    """Run the queued searches and mark them done."""
    state = _read_searches(context)
    for search in state.searches:
        search.done = True
    return await _write_searches(context, state)
# endregion


def create_search_agent(config: ModelConfig) -> Agent:
    return Agent(
        name="assistant",
        prompt=(
            "You are a helpful assistant for storing searches. "
            "Use `add_search` once per query, then call `run_searches`."
        ),
        config=config,
        tools=[add_search, run_searches],
    )


# Same story as LANGUAGE_DEFAULTS above.
SEARCHES_DEFAULTS: dict[str, Any] = {"searches": []}
