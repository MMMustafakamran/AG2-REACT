"""Serves the AG2 agents over AG-UI.

The docs mount exactly one agent, at `/chat`:

    stream = AGUIStream(agent)
    app = FastAPI()

    @app.post("/chat")
    async def run_agent(message: RunAgentInput, accept: str | None = Header(None)):
        return StreamingResponse(
            stream.dispatch(message, accept=accept),
            media_type=accept or "text/event-stream",
        )

That block is reproduced below once per agent, unchanged apart from the path
and the stream it dispatches to. Three agents rather than one because the
Shared State pages and the State Rendering page define different state shapes
under different prompts (see `agents.py`); the documented `/chat` suffix is
kept on each so the shape a reader recognises is still the shape here.

The bearer-token middleware is the Authentication page's Python sample. It
stays inert unless `AUTH_BEARER_TOKEN` is set, so the app runs unauthenticated
by default.

Import note, and it is the headline finding of this repo: the docs' import
lines are

    from autogen import ConversableAgent, LLMConfig
    from autogen.ag_ui import AGUIStream, RunAgentInput

No published `ag2` release resolves both. 0.9.x has `autogen.ConversableAgent`
but no `autogen.ag_ui`; 1.0.x has `ag2.ag_ui.AGUIStream` but no `autogen`
namespace at all. `API_DRIFT.md` documents the check. This file targets
1.0.3, the version the `ag-ui` extra actually exists in.
"""

from __future__ import annotations

import os
from pathlib import Path

import uvicorn
from ag2.ag_ui import AGUIStream, RunAgentInput
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# Prefer backend/.env (what the docs describe as agent/.env), then fall back to
# a repo-root .env so a single top-level file also works.
_BACKEND_ENV = Path(__file__).parent / ".env"
_ROOT_ENV = Path(__file__).parent.parent / ".env"
load_dotenv(_BACKEND_ENV)
load_dotenv(_ROOT_ENV, override=False)

from agents import (  # noqa: E402 - must follow load_dotenv
    LANGUAGE_DEFAULTS,
    SEARCHES_DEFAULTS,
    create_sample_agent,
    create_search_agent,
    create_weather_agent,
)
from model_config import build_model_config  # noqa: E402

PORT = int(os.getenv("AGENT_PORT", "8000"))

_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "AGENT_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if o.strip()
]

if not os.getenv("OPENAI_API_KEY"):
    raise SystemExit(
        "No model provider configured.\n"
        f"Create {_BACKEND_ENV} (or a repo-root .env) from .env.example and set "
        "OPENAI_API_KEY. Every AG2 doc sample uses OpenAI."
    )

app = FastAPI(title="CopilotKit + AG2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENT_PATHS = {"/chat", "/sample_agent/chat", "/search_agent/chat"}

# [1] authentication: bearer middleware
# [!code highlight]
# region auth-middleware
REQUIRED_BEARER_TOKEN = os.getenv("AUTH_BEARER_TOKEN")


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Protect the AG-UI endpoints if a token is configured.
    #
    # The Authentication page reads `authorization` as a `Header(None)`
    # parameter on the route itself and raises before `stream.dispatch`. Doing
    # it in middleware covers all three endpoints from one place and keeps the
    # route bodies identical to the published one; the check is the doc's.
    if REQUIRED_BEARER_TOKEN and request.url.path in AGENT_PATHS:
        authorization = request.headers.get("Authorization", "")
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authorization header",
            )
        token = authorization.replace("Bearer ", "").strip()
        if token != REQUIRED_BEARER_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
            )
    return await call_next(request)
# endregion


@app.get("/health")
async def health() -> dict[str, object]:
    """Not part of the docs — lets the app's home page report reachability."""
    return {
        "status": "ok",
        "agents": sorted(AGENT_PATHS),
        "authRequired": bool(REQUIRED_BEARER_TOKEN),
    }


model_config = build_model_config()

weather_stream = AGUIStream(create_weather_agent(model_config))
sample_stream = AGUIStream(create_sample_agent(model_config))
search_stream = AGUIStream(create_search_agent(model_config))


def _readables(message: RunAgentInput) -> dict[str, object]:
    """Restore the `copilotkit.context` shape the Readables page assumes.

    `useAgentContext` entries arrive on `RunAgentInput.context`. `AGUIStream`
    never hands that array to the agent, so the doc's `get_readable` — which
    reads `context.get("copilotkit", {}).get("context", [])` — finds nothing
    on an unmodified stack. Forwarding it here is the smallest change that
    makes the published lookup return what the page says it returns.

    Passed as a dependency rather than a variable so it does not end up
    republished as AG-UI state. See `API_DRIFT.md` section 3.
    """
    items = [
        {"description": item.description, "value": item.value}
        for item in (message.context or [])
    ]
    return {"copilotkit": {"context": items}}


def _state(message: RunAgentInput, defaults: dict[str, object]) -> dict[str, object]:
    """The run's starting state: our defaults, with the frontend's state on top.

    `AGUIStream` resolves state as `incoming.state | agent_variables`, so
    anything seeded on the `Agent` outranks whatever the browser sent. Merging
    in the correct order here and passing the result as `variables=` is what
    lets `agent.setState(...)` survive a re-run. See `API_DRIFT.md` section 5.
    """
    return {**defaults, **(message.state or {})}


# [2] quickstart: agent endpoint
# [!code highlight]
# region chat-endpoint
@app.post("/chat")
async def run_agent(
    message: RunAgentInput,
    accept: str | None = Header(None),
):
    return StreamingResponse(
        weather_stream.dispatch(
            message, accept=accept, dependencies=_readables(message)
        ),
        media_type=accept or "text/event-stream",
    )
# endregion


# [3] shared state: agent endpoint
# [!code highlight]
@app.post("/sample_agent/chat")
async def run_sample_agent(
    message: RunAgentInput,
    accept: str | None = Header(None),
):
    return StreamingResponse(
        sample_stream.dispatch(
            message,
            accept=accept,
            variables=_state(message, LANGUAGE_DEFAULTS),
            dependencies=_readables(message),
        ),
        media_type=accept or "text/event-stream",
    )


# [4] state rendering: agent endpoint
# [!code highlight]
@app.post("/search_agent/chat")
async def run_search_agent(
    message: RunAgentInput,
    accept: str | None = Header(None),
):
    return StreamingResponse(
        search_stream.dispatch(
            message,
            accept=accept,
            variables=_state(message, SEARCHES_DEFAULTS),
            dependencies=_readables(message),
        ),
        media_type=accept or "text/event-stream",
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
