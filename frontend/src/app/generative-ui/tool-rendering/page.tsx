import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/tool-rendering" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A tool call is an event in the stream, not just a function result — so
          you can render it. <code>useRenderTool</code> attaches a component to
          one tool by name, and <code>useDefaultRenderTool</code> registers a
          wildcard that catches everything without a dedicated renderer.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The renderer name must equal the Python tool name exactly. That is the
          single most common reason a tool runs but its UI never appears.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["What's the weather in Tokyo?"]}
            expect="The reply is preceded by 'Calling weather API...' which becomes 'Called the weather API for Tokyo.' once the call completes."
            fail="The tool call renders as raw JSON or not at all — the renderer name and the Python tool name disagree."
          />
        </div>
      </Panel>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The tool being rendered"
        description="An ordinary AG2 tool — nothing about it is CopilotKit-specific."
      >
        <SourceCodeGroup
          files={[{ file: "backend/agents.py", region: "get-weather" }]}
        />
      </Panel>

      <Callout tone="warn" title="Neither React sample on this page compiles">
        <p>
          The named renderer is published as{" "}
          <code>useRenderTool(&#123; name: &quot;get_weather&quot;, render &#125;)</code>{" "}
          with no <code>parameters</code>. <code>useRenderTool</code> has exactly
          two overloads in <code>@copilotkit/react-core</code> 1.69.2: the
          wildcard form, which requires <code>name: &quot;*&quot;</code>, and the
          named form, which requires a <code>parameters</code> schema. A named
          renderer without one matches neither.
        </p>
        <p className="mt-2">
          Both samples then destructure <code>args</code> in{" "}
          <code>render</code> — the doc reads{" "}
          <code>args.location</code> and{" "}
          <code>JSON.stringify(result)</code>. The shipped render props carry{" "}
          <code>parameters</code>, not <code>args</code>:{" "}
          <code>RenderToolProps</code> for the named form and{" "}
          <code>
            &#123; name, toolCallId, parameters, status, result &#125;
          </code>{" "}
          for the wildcard. <code>args</code> is <code>undefined</code> at
          runtime and a type error at build. The source above uses the shipped
          names.
        </p>
        <p className="mt-2">
          Smaller: the wildcard section&apos;s prose says a fallback catches any
          tool without a specific <code>useRenderToolCall</code>, but{" "}
          <code>useRenderToolCall</code> is a different exported hook — it
          returns a render function and takes no name. The hook the sentence
          means is <code>useRenderTool</code>. Also, <code>result</code> is
          typed <code>string | undefined</code>, so the doc&apos;s{" "}
          <code>JSON.stringify(result, null, 2)</code> re-encodes an
          already-encoded string and renders it with escaped quotes.
        </p>
      </Callout>

    </>
  );
}
