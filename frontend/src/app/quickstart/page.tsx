import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, CodeBlock, Panel, TryIt } from "@/components/ui";

/**
 * The doc's backend, copied out of the Quickstart's sibling pages verbatim.
 * Shown here rather than run, because it does not run — see `backend/API_DRIFT.md`.
 */
const PUBLISHED_AGENT = `from fastapi import FastAPI, Header
from fastapi.responses import StreamingResponse
from autogen import ConversableAgent, LLMConfig
from autogen.ag_ui import AGUIStream, RunAgentInput

agent = ConversableAgent(
    name="assistant",
    system_message="You are a helpful assistant.",
    llm_config=LLMConfig({"model": "gpt-5.4-mini"}),
    human_input_mode="NEVER",
)

stream = AGUIStream(agent)
app = FastAPI()

@app.post("/chat")
async def run_agent(
    message: RunAgentInput,
    accept: str | None = Header(None),
):
    return StreamingResponse(
        stream.dispatch(message, accept=accept),
        media_type=accept or "text/event-stream",
    )`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/quickstart" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Three pieces: a FastAPI server that streams an AG2 agent over AG-UI at{" "}
          <code>/chat</code>, a runtime route that binds it, and a chat
          component. Everything else in this harness is a variation on these.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Worth noting how thin the binding is: <code>AGUIStream</code> on the
          Python side and a plain <code>HttpAgent</code> on the runtime side.
          AG2 emits AG-UI events itself, so there is no framework-specific
          adapter package to install — unlike integrations that ship their own.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Can you tell me a joke?", "What's the weather in London?"]}
            expect="Tokens stream in a word at a time and the reply renders as markdown. The weather prompt calls the agent's get_weather tool first."
            fail="Nothing streams, or an error appears — the agent process is probably down. Check the connection panel on the home page."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="The page's own backend does not import">
        <p>
          Every AG2 backend snippet, this page&apos;s included, opens with{" "}
          <code>from autogen import ConversableAgent, LLMConfig</code> and{" "}
          <code>from autogen.ag_ui import AGUIStream, RunAgentInput</code>. No
          published <code>ag2</code> release resolves both lines:{" "}
          <code>0.9.x</code> has <code>autogen.ConversableAgent</code> but no{" "}
          <code>autogen.ag_ui</code> and no <code>ag-ui</code> extra;{" "}
          <code>1.0.x</code> has <code>ag2.ag_ui.AGUIStream</code> but no{" "}
          <code>autogen</code> namespace at all. Paste the snippet into a file
          and it raises <code>ModuleNotFoundError</code> before reaching any
          agent logic.
        </p>
        <p className="mt-2">
          This harness targets <code>ag2 1.0.3</code>, the line the AG-UI
          integration actually exists in. Every translation is documented in{" "}
          <code>backend/API_DRIFT.md</code>, and the shipped API sits directly
          under the published snippet in <code>backend/agents.py</code>.
        </p>
      </Callout>

      <Panel
        title="The backend, as published"
        description="Reproduced from the doc pages so it can be read against what this repo actually runs, below."
      >
        <CodeBlock code={PUBLISHED_AGENT} filename="agent.py — from the docs" language="python" />
      </Panel>

      <Panel title="The demo">
        <SourceCode file="frontend/src/app/quickstart/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The two files that make it work"
        description="Read from this repo, so they can be diffed against the doc's samples directly."
      >
        <SourceCodeGroup
          files={[
            { file: "frontend/src/app/api/copilotkit/[[...slug]]/route.ts" },
            { file: "backend/main.py" },
          ]}
          note={
            <>
              The runtime registers three agent ids rather than the doc&apos;s
              one, and the server mounts three <code>/chat</code> endpoints
              rather than one. That is the only structural departure, and it
              exists because the Shared State pages and the State Rendering page
              each define their own state shape and system prompt.
            </>
          }
        />
      </Panel>

      <Panel title="The agent and its model config">
        <SourceCodeGroup
          files={[
            { file: "backend/agents.py", region: "get-weather" },
            { file: "backend/model_config.py" },
          ]}
        />
      </Panel>

      <Callout tone="info" title="The doc's runtime snippet now wires Intelligence">
        The Quickstart&apos;s runtime sample replaced{" "}
        <code>runner: new InMemoryAgentRunner()</code> with{" "}
        <code>intelligence: new CopilotKitIntelligence(&#123; apiKey &#125;)</code>{" "}
        plus <code>identifyUser</code>, and reads{" "}
        <code>INTELLIGENCE_API_KEY</code> from <code>.env.local</code>. The same
        step&apos;s callout documents dropping both options to fall back to SSE
        mode with an in-memory runner — that is what{" "}
        <code>/api/copilotkit</code> here does, so Threads and the Inspector stay
        locked on this route. The Intelligence-wired version lives on{" "}
        <code>/api/copilotkit-threads</code>, used by the{" "}
        <a href="/threads" className="underline">
          Rich Threads
        </a>{" "}
        pages.
      </Callout>

      <Callout tone="info" title="Why runtimeUrl can be relative">
        <code>/api/copilotkit</code> resolves because Next.js serves both the app
        and the runtime from one origin, which is the arrangement the doc&apos;s
        provider callout describes. A client-only frontend would need a
        standalone runtime server and an absolute URL instead.
      </Callout>

      <Callout tone="warn" title="The setup steps are a repo clone, not a build">
        The Quickstart&apos;s Python steps are{" "}
        <code>git clone https://github.com/ag2ai/ag2-samples.git</code>,{" "}
        <code>uv sync</code>, <code>uv run python weather.py</code> — it never
        shows the file it is telling you to run, and the agent it describes is
        served at <code>/weather</code>, not the <code>/chat</code> that every
        other AG2 page (and the callout at the top of this one) specifies. The
        backend code on this page comes from the sibling feature pages instead,
        which do publish it.
      </Callout>
    </>
  );
}
