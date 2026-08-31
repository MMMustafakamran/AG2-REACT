"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

type Level = "classes" | "props" | "component";

const LEVELS: { id: Level; label: string; blurb: string }[] = [
  {
    id: "classes",
    label: "1 · Tailwind classes",
    blurb: "A class string merges with the slot's own classes. Nothing is replaced.",
  },
  {
    id: "props",
    label: "2 · Props override",
    blurb: "An object sets props on the default component — className, autoFocus.",
  },
  {
    id: "component",
    label: "3 · Custom component",
    blurb: "Your own component replaces a slot, plus a custom layout.",
  },
];

/**
 * Slot level 3, from the doc's "Custom Components" section.
 *
 * The body is the doc's, unchanged. The two things around it are not, because
 * the published version does not compile:
 *
 *   1. `({ messages, isRunning })` is untyped, which is `noImplicitAny` errors
 *      on both bindings and on `msg` inside the map. The annotation below is
 *      the narrowest thing that names what the slot actually passes.
 *   2. Assigning this to `messageView` still fails — see the ts-expect-error
 *      further down.
 */
const CustomMessageView = ({
  messages,
  isRunning,
}: {
  messages?: { id: string; role: string; content?: string }[];
  isRunning?: boolean;
}) => (
  <div className="space-y-4 p-6">
    {messages?.map((msg) => (
      <div
        key={msg.id}
        className={msg.role === "user" ? "text-right" : "text-left"}
      >
        {msg.content}
      </div>
    ))}
    {isRunning && <div className="animate-pulse">Thinking...</div>}
  </div>
);

export default function Page() {
  const [level, setLevel] = useState<Level>("classes");
  const active = LEVELS.find((l) => l.id === level)!;

  return (
    <DemoFrame parentPath="/custom-look-and-feel/slots" subtitle={active.blurb}>
       <div className="flex h-full flex-col">
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLevel(l.id)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                level === l.id
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1">
          {/* [1] slots: class overrides */}
          {/* [!code highlight] */}
          {level === "classes" && (
            <CopilotChat
              agentId="my_agent"
              key="classes"
               messageView={{
                assistantMessage: "bg-blue-50 rounded-xl p-2",
                userMessage: "bg-blue-100 rounded-xl",
              }}
              input="border-2 border-[var(--accent)] rounded-xl text-purple-800"
              labels={{
                welcomeMessageText:
                  "Slot level 1 — classes merged into messageView and input.",
              }}
            />
          )}

          {/* [2] slots: prop overrides */}
          {/* [!code highlight] */}
          {level === "props" && (
            <CopilotChat
              agentId="my_agent"
              key="props"
              messageView={{
                className: "rounded-lg bg-slate-50 dark:bg-slate-300 p-4",
              }}
              input={{ autoFocus: true }}
              labels={{
                welcomeMessageText:
                  "Slot level 2 — the input is focused automatically via a prop override.",
              }}
            />
          )}

          {/* [3] slots: custom component */}
          {/* [!code highlight] */}
          {level === "component" && (
            <CopilotChat
              agentId="my_agent"
              key="component"
              // The doc's sample is `<CopilotChat messageView={CustomMessageView} />`
              // and it does not typecheck. `SlotValue<typeof CopilotChatMessageView>`
              // is the *component type*, statics included, so a replacement must
              // also carry `CopilotChatMessageView.Cursor`. "It receives all the
              // same props as the default component" is true and insufficient.
              // Runtime behaviour is fine; this is a types-only failure, which is
              // why it is suppressed rather than worked around.
              // @ts-expect-error -- doc sample, kept verbatim. See the route notes.
              messageView={CustomMessageView}
              labels={{
                welcomeMessageText:
                  "Slot level 3 — the streaming cursor and the whole layout are ours.",
              }}
            >
              
            </CopilotChat>
          )}
        </div>
      </div>
    </DemoFrame>
  );
}
