import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, CodeBlock, Panel, TryIt } from "@/components/ui";

/** The page's own `write_state`, quoted so the nesting problem is visible. */
const PUBLISHED_STATE_HELPERS = `def read_state(context: ContextVariables) -> dict:
    return context.get("agent_state", {"language": "english"})

def write_state(context: ContextVariables, state: dict) -> StateSnapshotEvent:
    context["agent_state"] = state
    return StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=state)`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/read" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Agent state is not confined to the chat. <code>agent.state</code> is
          reactive, so any component can read it and re-render when the agent
          changes it — here a language preference shown next to the conversation
          rather than inside it.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The link between the tool and the state is the run&apos;s context
          variables. <code>set_language</code> writes{" "}
          <code>context.variables[&quot;language&quot;]</code>, and{" "}
          <code>AGUIStream</code> emits whatever those variables hold as an AG-UI{" "}
          <code>StateSnapshotEvent</code> — at run start, and again at run end
          if they changed. The frontend never parses a message to learn the
          value.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Switch to Spanish", "Change it back to English"]}
            expect="The Language line updates when the run finishes, and the raw state block shows the new value."
            fail="The agent confirms the change in text but the panel stays on 'english' — the tool wrote to a key the snapshot does not carry."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="`initialState` and `render` do not exist on useAgent">
        Both Shared State pages seed the starting value with{" "}
        <code>useAgent({"{ agentId, initialState }"})</code>, and this one also
        shows a <code>render</code> prop for drawing state inside the chat. In{" "}
        <code>@copilotkit/react-core</code> 1.69.2 <code>UseAgentProps</code>{" "}
        accepts only <code>agentId</code>, <code>threadId</code>,{" "}
        <code>runtimeAgentId</code>, <code>updates</code> and{" "}
        <code>throttleMs</code> — the string <code>initialState</code> does not
        occur anywhere in the shipped type declarations. Passing either is a type
        error. This repo seeds the value on the server instead, with{" "}
        <code>LANGUAGE_DEFAULTS</code> merged per request in{" "}
        <code>backend/main.py</code>.
      </Callout>

      <Callout tone="warn" title="The backend snippet and the frontend snippet disagree">
        <p>
          The page&apos;s <code>write_state</code> stores the payload under an{" "}
          <code>agent_state</code> key but snapshots the un-nested{" "}
          <code>state</code>:
        </p>
        <div className="mt-3">
          <CodeBlock code={PUBLISHED_STATE_HELPERS} language="python" />
        </div>
        <p className="mt-3">
          The snapshot is what becomes <code>agent.state</code>, and further down
          the same page the React sample reads{" "}
          <code>agent.state.language</code> — not{" "}
          <code>agent.state.agent_state.language</code>. The two halves describe
          different shapes, and <code>context[&quot;agent_state&quot;]</code>{" "}
          is written but never read back by anything the page calls. This repo
          writes the key flat, which is what the page&apos;s own React code
          needs. Full write-up in <code>backend/API_DRIFT.md</code> §2.
        </p>
      </Callout>

      <Callout tone="warn" title="The agent is never given a way to read its own state">
        The system message is &quot;always respond in the current language&quot;,
        but the agent&apos;s only tool is <code>set_language</code>, which
        writes. Nothing injects the current value into the prompt and there is no
        reader tool, so the model cannot know what the language currently is —
        ask it and it answers in English and calls{" "}
        <code>set_language(&quot;english&quot;)</code>. The panel on the left is
        correct throughout; it is the chat half of the instruction that has no
        mechanism behind it. Left as published — see{" "}
        <code>backend/API_DRIFT.md</code> §6.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/shared-state/read/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The agent's tool, and how state reaches the snapshot"
        description="The doc's set_language, ported to ag2 1.0.3, plus the per-request state merge it depends on."
      >
        <SourceCodeGroup
          files={[
            { file: "backend/agents.py", region: "set-language" },
            { file: "backend/main.py", region: "chat-endpoint" },
          ]}
        />
      </Panel>
    </>
  );
}
