"use client";

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
 * The doc seeds the starting value with `useAgent({ initialState })`. That prop
 * does not exist on `useAgent` in @copilotkit/react-core 1.69.2, so the seed
 * lives on the server instead — `LANGUAGE_DEFAULTS`, merged per request in
 * `backend/main.py`.
 */

type AgentState = {
  language: "english" | "spanish";
};

export default function Page() {
  // [1] shared state: read agent state
  // [!code highlight]
  const { agent } = useAgent({ agentId: "sample_agent" });
  const state = agent.state as AgentState | undefined;

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
            Language:{" "}
            <strong className="text-[var(--accent)]">
              {state?.language ?? "—"}
            </strong>
          </p>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Raw agent.state
          </h2>
          {/* [2] shared state: display state */}
          {/* [!code highlight] */}
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
