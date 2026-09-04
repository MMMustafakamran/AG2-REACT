"use client";

import { useEffect } from "react";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Reading the agent's live state in your own UI.
 *
 * `sample_agent`'s `set_language` tool writes `language` into the run's
 * context variables, and `AGUIStream` publishes those variables as an AG-UI
 * state snapshot — so asking the agent to switch language updates
 * `agent.state.language`, and this panel, with no message parsing on the
 * frontend.
 *
 * The page used to seed the starting value with `useAgent({ initialState })`,
 * a prop that has never existed on the hook. It now seeds in an effect gated
 * on `isReady`, which is a real return value of `useAgent` in
 * @copilotkit/react-core 1.69.2 — so the published snippet finally compiles and
 * is reproduced verbatim below.
 */

type AgentState = {
  language: "english" | "spanish";
};

/**
 * "Rendering agent state in your app", verbatim.
 *
 * The page names this `YourMainContent` — the same name as the component in
 * the step above, which draws the whole page. Reproduced under that name so
 * the collision is visible; rendered as a small widget so the route survives
 * it. `agentId` is the harness's `sample_agent` rather than the page's
 * `my_agent`, as everywhere else here.
 */
// [5] shared state: render state in your app
// [!code highlight]
function YourMainContent() {
  const { agent } = useAgent({
    agentId: "sample_agent",
  });
  const state = (agent.state ?? {}) as Partial<AgentState>;

  if (!state.language) return null;
  return <div>Language: {state.language}</div>;
}

export default function Page() {
  // [1] shared state: read agent state
  // [!code highlight]
  const { agent, isReady } = useAgent({ agentId: "sample_agent" });
  const state = (agent.state ?? {}) as Partial<AgentState>;

  // [2] shared state: seed state once the agent is ready
  // [!code highlight]
  useEffect(() => {
    if (!isReady || state.language !== undefined) return;
    agent.setState({ ...(agent.state ?? {}), language: "english" });
  }, [agent, isReady, state.language]);

  return (
    <DemoFrame
      parentPath="/shared-state/read"
      subtitle="agent.state read from sample_agent"
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r dark:border-slate-800">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Your main content
          </h1>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            {/* [3] shared state: display state */}
            {/* [!code highlight] */}
            Language:{" "}
            <strong className="text-[var(--accent)]">
              {agent.state.language}
            </strong>
          </p>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            The page&apos;s render sample
          </h2>
          <div className="mt-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm dark:border-slate-600">
            <YourMainContent />
          </div>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Raw agent.state
          </h2>
          {/* [4] shared state: raw state */}
          <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(agent.state ?? {}, null, 2)}
          </pre>
        </div>

        <div className="min-h-0">
          <CopilotChat
            agentId="sample_agent"
            labels={{
              welcomeMessageText:
                'Try "Switch to Spanish" and watch the panel on the left.',
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
