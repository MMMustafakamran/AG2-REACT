import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, CodeBlock, Panel, TryIt } from "@/components/ui";

/** The doc's lookup, quoted so the missing key is visible. */
const PUBLISHED_GET_READABLE = `def get_readable(context: ContextVariables, description: str):
    copilot = context.get("copilotkit", {})
    context_items = copilot.get("context", [])
    return next(
        (item.get("value") for item in context_items if item.get("description") == description),
        None,
    )`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/readables" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Telling the agent what is going on in your app — the current user, the
          open record, the visible page — without stuffing it into a chat
          message. <code>useAgentContext</code> registers a description and a
          value, and CopilotKit forwards them on every run.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The context is delivered in the AG-UI <code>RunAgentInput</code>, as{" "}
          <code>context</code> entries carrying a description and a value. The
          match is on the description string, so the{" "}
          <code>useAgentContext</code> call and the Python lookup have to agree
          on it character for character.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Who are my colleagues?", "What is Jane Smith's role?"]}
            expect="The agent calls get_colleagues, then answers from the list on the left — which it was never told in a message."
            fail="The agent says it has no information about your colleagues — the context is not reaching the run."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="The published lookup can never resolve">
        <p>The page tells you to read readables out of the context variables:</p>
        <div className="mt-3">
          <CodeBlock code={PUBLISHED_GET_READABLE} language="python" />
        </div>
        <p className="mt-3">
          Nothing ever writes a <code>copilotkit</code> key.{" "}
          <code>AGUIStream.dispatch</code> does not read{" "}
          <code>incoming.context</code> anywhere — the only things it merges
          into a run&apos;s variables are the agent&apos;s own variables, the{" "}
          <code>variables=</code> argument, and <code>incoming.state</code>. So{" "}
          <code>get_readable</code> returns its fallback on every call, forever,
          silently, and the page&apos;s closing step — &ldquo;Ask your agent a
          question about the context. It should be able to answer&rdquo; — is
          something it cannot do.
        </p>
        <p className="mt-2">
          <code>backend/main.py</code> does the forwarding{" "}
          <code>AGUIStream</code> omits, which is what makes this route work.
          One deliberate difference: it arrives on{" "}
          <code>context.dependencies</code> rather than{" "}
          <code>context.variables</code>, because variables are what get
          published as the AG-UI state snapshot — putting readables there would
          republish every <code>useAgentContext</code> value into{" "}
          <code>agent.state</code> and the Inspector. See{" "}
          <code>backend/API_DRIFT.md</code> §3.
        </p>
      </Callout>

      <Callout tone="info" title="Two backend variants, one behaviour">
        The page splits into &ldquo;Custom agent&rdquo; and &ldquo;Minimal
        setup&rdquo; tabs whose Python differs only in whether the lookup is
        factored into a <code>get_readable</code> helper or inlined into the
        tool. Both read the same non-existent <code>copilotkit</code> key, so
        the tabs are a formatting choice, not a choice of approach. This repo
        implements the factored form.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/readables/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The tool that reads the context, and the forwarding it needs"
        description="get_colleagues is the doc's; the RunAgentInput.context lift beneath it is not, and has to be."
      >
        <SourceCodeGroup
          files={[
            { file: "backend/agents.py", region: "get-colleagues" },
            { file: "backend/main.py", region: "chat-endpoint" },
          ]}
        />
      </Panel>
    </>
  );
}
