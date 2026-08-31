import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

const ROOT_SLOTS: [string, string][] = [
  ["messageView", "The message list container."],
  ["scrollView", "The scroll container with auto-scroll behaviour."],
  ["input", "The text input area with send/transcribe controls."],
  ["suggestionView", "The suggestion pills shown below messages."],
  ["welcomeScreen", "The empty-state screen. Pass false to disable."],
  ["header / toggleButton", "Sidebar and Popup only."],
];

export default function Page() {
  return (
    <>
      <RouteHeader path="/custom-look-and-feel/slots" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Every chat component is assembled from named sub-components — slots —
          each overridable at one of three levels: a Tailwind class string merged
          into the default, an object of props set on the default, or your own
          component replacing it. Slots nest, so{" "}
          <code>messageView.assistantMessage.copyButton</code> is a valid path.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th className="pb-2 pr-4 font-medium">Root slot</th>
                <th className="pb-2 font-medium">What it is</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ROOT_SLOTS.map(([slot, desc]) => (
                <tr key={slot}>
                  <td className="py-2 pr-4 font-mono text-xs text-slate-800 dark:text-slate-100">
                    {slot}
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    {desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <TryIt
            prompts={["Hello there"]}
            expect="Level 1 tints the message area and outlines the input. Level 2 focuses the input on mount. Level 3 shows a custom layout"
            fail="The chat looks identical across all three tabs — the slot props are not reaching the component."
          />
        </div>
      </Panel>

     
      <Callout tone="warn" title="Level 3's sample does not typecheck">
        <p>
          &ldquo;For full control, pass your own React component. It receives
          all the same props as the default component.&rdquo; Both sentences are
          true, and the sample under them still fails to compile:
        </p>
        <p className="mt-2">
          <code>messageView</code> is typed{" "}
          <code>SlotValue&lt;typeof CopilotChatMessageView&gt;</code> — the{" "}
          <em>component type</em>, statics included. The default carries a{" "}
          <code>Cursor</code> static, so a replacement has to as well, and the
          doc&apos;s plain arrow function does not. The props contract is what
          the page describes; the slot contract is a little larger than that.
        </p>
        <p className="mt-2">
          Separately, its <code>({"{ messages, isRunning }"})</code> destructure
          carries no annotation, which is three <code>noImplicitAny</code>{" "}
          errors under the default <code>strict</code> tsconfig that{" "}
          <code>create-next-app</code> generates. The source below keeps the
          doc&apos;s body verbatim and marks both departures in place.
        </p>
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/custom-look-and-feel/slots/demo-chat/page.tsx" />
      </Panel>
    </>
  );
}
