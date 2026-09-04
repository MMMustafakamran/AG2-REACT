import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/write" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The other direction: the app writing into agent state.{" "}
          <code>agent.setState</code> updates the value and re-renders anything
          reading it, and the agent sees the new state on its next run.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Press Toggle Language, then ask: what language are you using?",
              "Press Toggle + re-run agent",
            ]}
            expect="Toggle flips the value immediately in the panel; the agent acknowledges it on the next message you send. Toggle + re-run makes the agent respond straight away without you typing."
            fail="The panel value changes but the agent never acknowledges it — the state is not reaching the run."
          />
        </div>
      </Panel>

      <Callout tone="info" title="`setState` replaces — the doc now spreads">
        The page used to publish{" "}
        <code>agent.setState({"{ language: … }"})</code>. It now publishes{" "}
        <code>agent.setState({"{ ...(agent.state ?? {}), language: … }"})</code>
        . That is a correction, not a style change:{" "}
        <code>setState</code> assigns the whole state object, so the old form
        dropped every other key the agent was carrying. One-key demos never
        showed it; the State Rendering agent, with its own keys alongside{" "}
        <code>language</code>, would have. Both buttons below spread.
      </Callout>

      <Callout tone="info" title="Seeding moved into an effect">
        The starting value used to come from an{" "}
        <code>initialState</code> prop that <code>useAgent</code> does not
        accept. The page now seeds after connect —{" "}
        <code>isReady</code>, then <code>setState</code> if the key is still
        missing — so the Language line reads{" "}
        <code>english</code> on load instead of a dash. The visible effect on
        this route: the first Toggle now flips english → spanish, where before
        it flipped an unset value.
      </Callout>

      <Callout tone="info" title="Set state, then decide when the agent reacts">
        <code>setState</code> alone is passive — the new value waits for the next
        run. When a UI change should provoke the agent immediately, the doc&apos;s
        pattern is to add a short hint message describing what changed and then
        call <code>copilotkit.runAgent()</code>. Both buttons in the demo exist
        to make that difference visible.
      </Callout>

      <Callout tone="warn" title="Why this works here and would not by default">
        <code>AGUIStream</code> resolves a run&apos;s opening state as{" "}
        <code>incoming.state | agent_variables</code> — the browser&apos;s state
        goes <em>under</em> anything seeded on the <code>Agent</code>. Follow the
        page&apos;s <code>read_state</code> fallback literally and seed{" "}
        <code>variables=&#123;&quot;language&quot;: &quot;english&quot;&#125;</code>{" "}
        on the agent, and every <code>setState(&quot;spanish&quot;)</code> is
        reverted before the model sees it, silently. This backend keeps no
        agent-level variables and merges{" "}
        <code>&#123;**defaults, **incoming.state&#125;</code> per request
        instead, which is the order the page assumes. See{" "}
        <code>backend/API_DRIFT.md</code> §5.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/shared-state/write/demo-chat/page.tsx" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The agent and its <code>set_language</code> tool are the same ones
          shown on the{" "}
          <a
            href="/shared-state/read"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            reading route
          </a>{" "}
          — the two doc pages publish the same backend sample, byte for byte.
        </p>
      </Panel>
    </>
  );
}
