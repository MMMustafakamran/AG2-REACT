import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/state-rendering" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Tool rendering shows you a tool <em>call</em>. State rendering shows
          you the agent&apos;s accumulated <em>state</em> — a list that grows
          across turns rather than a single event. Here that is a set of searches,
          each with a <code>query</code> and a <code>done</code> flag.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The mechanism is the run&apos;s context variables.{" "}
          <code>add_search</code> appends to{" "}
          <code>context.variables[&quot;searches&quot;]</code> and{" "}
          <code>run_searches</code> flips every item&apos;s <code>done</code>{" "}
          flag. Each write also sends an AG-UI{" "}
          <code>StateSnapshotEvent</code> straight onto the agent&apos;s event
          stream, which lands in <code>agent.state.searches</code> the moment
          the tool runs — see the callout below for why that last part is not
          optional.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Search for the tallest mountains",
              "Now also search for the deepest oceans",
            ]}
            expect="An unchecked item appears mid-run, then flips to checked when run_searches fires. The second prompt adds a second item while keeping the first."
            fail="The list stays empty while the chat replies normally — the tools wrote to a key the snapshot does not carry."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="The mid-run snapshots are undocumented, and the page needs them">
        <p>
          Left alone, <code>AGUIStream</code> emits exactly two state snapshots
          — one at run start, one at run end if the variables changed. Nothing
          publishes a partial state in between, so <code>done: false</code>{" "}
          would never reach the browser and the list this page promises will
          tick over would arrive fully settled in one frame.
        </p>
        <p className="mt-2">
          The page&apos;s own tools <em>return</em>{" "}
          <code>StateSnapshotEvent</code>, which does nothing: a tool&apos;s
          return value is encoded as an ordinary <code>TOOL_CALL_RESULT</code>.
          Its closing line asks for the missing piece — &ldquo;emit additional
          intermediate snapshots from your backend tools&rdquo; — without ever
          showing how. The mechanism exists and no AG2 page mentions it:{" "}
          <code>
            await context.send(AGUIEvent(StateSnapshotEvent(...)))
          </code>
          . <code>_write_searches</code> in <code>backend/agents.py</code> uses
          it, which is why the checkboxes below flip live. See{" "}
          <code>backend/API_DRIFT.md</code> §7.
        </p>
      </Callout>

      <Callout tone="info" title="Why this route uses a different agent">
        The state shape belongs to the agent that maintains it, and the docs
        define two — <code>searches</code> here, <code>language</code> on the
        Shared State pages — under two different system prompts. This repo runs
        both as separate agents (<code>search_agent</code> and{" "}
        <code>sample_agent</code>) rather than inventing a merged one that
        appears in neither doc.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/generative-ui/state-rendering/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The state models and the two tools"
        description="Lifted from the doc's Python sample; only the ContextVariables → ag2.Context port differs."
      >
        <SourceCodeGroup
          files={[
            { file: "backend/agents.py", region: "add-search" },
            { file: "backend/agents.py", region: "run-searches" },
          ]}
          note={
            <>
              The doc&apos;s <code>read_state</code> / <code>write_state</code>{" "}
              helpers and its <code>Search</code> / <code>AgentState</code>{" "}
              models are kept. The one substantive change is that the{" "}
              <code>StateSnapshotEvent</code> is <em>sent</em> rather than{" "}
              <em>returned</em>; <code>_write_searches</code> in{" "}
              <code>backend/agents.py</code> shows both forms side by side.
            </>
          }
        />
      </Panel>
    </>
  );
}
