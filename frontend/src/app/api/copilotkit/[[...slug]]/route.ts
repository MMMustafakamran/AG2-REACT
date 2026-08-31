import {
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

// The AG-UI server from `backend/main.py`. AG2 streams AG-UI directly out of
// `AGUIStream`, so the runtime binds a plain `HttpAgent` — there is no
// AG2-specific adapter package to install.
const AGENT_URL = process.env.AG2_AGENT_URL ?? "http://localhost:8000";

// Three agents, one per AG-UI endpoint. `my_agent` is the Quickstart agent —
// the id every AG2 frontend snippet passes to `useAgent`. The other two exist
// because the Shared State pages and the State Rendering page each define
// their own state shape and system prompt, which are properties of the agent
// they belong to and cannot be shared.
//
// The paths keep the documented `/chat` suffix. AG2's pages mount exactly one
// agent, at `/chat`; this harness needs three, so the two extras are namespaced
// in front of it rather than renamed.
//
// The Quickstart's snippet wires `intelligence` + `identifyUser` here; this
// route deliberately takes the fallback that step documents (no Intelligence,
// in-memory runner). The wired version is in `api/copilotkit-threads`.
// [1] quickstart: runtime config
// [!code highlight]
const runtime = new CopilotRuntime({
  agents: {
    my_agent: new HttpAgent({ url: `${AGENT_URL}/chat` }),
    sample_agent: new HttpAgent({ url: `${AGENT_URL}/sample_agent/chat` }),
    search_agent: new HttpAgent({ url: `${AGENT_URL}/search_agent/chat` }),
  },
  runner: new InMemoryAgentRunner(),
});

// A Next.js catch-all route handler for the CopilotKit runtime requests.
// [2] copilot-runtime: request handler
// [!code highlight]
const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
