import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, CodeBlock, Panel, TryIt } from "@/components/ui";

const DIRECT_SNIPPET = `import { HttpAgent } from "@ag-ui/client";

const myAgent = new HttpAgent({ url: "http://localhost:8000/chat" });

<CopilotKitProvider agents__unsafe_dev_only={{ "my-agent": myAgent }}>
  <YourApp />
</CopilotKitProvider>`;

const COMPARISON: [string, string, string][] = [
  ["Authentication", "Safe defaults provided", "You manage it"],
  ["AG-UI middleware", "Runs server-side", "Not available"],
  ["Agent routing", "Automatic", "Manual"],
  ["Ecosystem features", "Full support", "Limited"],
  ["Support", "Supported", "Not supported"],
  ["Setup", "Needs a backend endpoint", "Frontend only"],
];

export default function Page() {
  return (
    <>
      <RouteHeader path="/copilot-runtime" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The runtime is the server-side bridge between the app and the agents.
          It resolves agents by id, keeps credentials and middleware on the
          server, and re-encodes agent output as SSE for the browser.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Because <code>AGUIStream</code> emits AG-UI events directly, each
          binding is a plain <code>HttpAgent</code> pointed at a{" "}
          <code>/chat</code> endpoint — there is no AG2-specific adapter package
          involved.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Hello"]}
            expect="All three ids stream a reply. Switching ids starts a separate conversation, because each agent id carries its own message list."
            fail="One id errors with an agent-not-found style message — it is missing from the runtime's agents map, or its endpoint is not mounted."
          />
        </div>
      </Panel>

      <Panel
        title="This repo's runtime"
        description="Read from disk — diff it against the doc's single-agent sample."
      >
        <SourceCode file="frontend/src/app/api/copilotkit/[[...slug]]/route.ts" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          <code>InMemoryAgentRunner</code> is used with{" "}
          <code>createCopilotRuntimeHandler</code> in v2 because the agents call
          the model themselves over AG-UI.
        </p>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Note the <code>useSingleEndpoint=&#123;false&#125;</code> warning in
          the doc: it applies to <code>&lt;CopilotKit&gt;</code>, which pins the
          flag to <code>true</code> and would 404 against this multi-route
          handler while <code>GET /info</code> still returned 200 — a stack that
          looks connected and answers nothing. This repo mounts{" "}
          <code>&lt;CopilotKitProvider&gt;</code>, which negotiates the
          transport from <code>/info</code> and needs no such prop.
        </p>
      </Panel>

      <Panel title="The demo page">
        <SourceCode file="frontend/src/app/copilot-runtime/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="Why not connect the browser straight to the agent?"
        description="AG-UI is an open protocol, so a direct connection is possible — with real losses."
      >
        <CodeBlock filename="Direct connection (dev only)" language="tsx" code={DIRECT_SNIPPET} />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th className="pb-2 pr-4 font-medium" />
                <th className="pb-2 pr-4 font-medium">With runtime</th>
                <th className="pb-2 font-medium">Direct</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {COMPARISON.map(([label, withRt, direct]) => (
                <tr key={label}>
                  <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-100">
                    {label}
                  </td>
                  <td className="py-2 pr-4 text-emerald-700 dark:text-emerald-400">
                    {withRt}
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    {direct}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Callout tone="warn" title="`npm install @ag-ui/client` picks the wrong version">
            Both this page and the direct-connection snippet tell you to import{" "}
            <code>HttpAgent</code> from <code>@ag-ui/client</code> without
            naming a version. <code>@copilotkit/runtime</code> 1.69.2 pins{" "}
            <code>@ag-ui/client</code> 0.0.57 internally, so installing the
            current 0.0.58 at the top level gives you two copies and passing an{" "}
            <code>HttpAgent</code> into <code>CopilotRuntime</code> fails with{" "}
            <em>
              Type &apos;HttpAgent&apos; is not assignable to type
              &apos;AbstractAgent&apos;. Types have separate declarations of a
              private property &apos;_debug&apos;
            </em>
            . Runtime behaviour is fine; the build is not. This repo pins 0.0.57
            in <code>frontend/package.json</code> to match.
          </Callout>
        </div>

        <div className="mt-4">
          <Callout tone="warn" title="Not implemented here on purpose">
            The prop is literally named <code>agents__unsafe_dev_only</code>. A
            direct connection would expose the agent endpoint to the browser and
            disable the server-side middleware other features depend on — including
            the bearer-token check on the Authentication route.
          </Callout>
        </div>
      </Panel>
    </>
  );
}
