/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 3 of 3
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * One entry per doc page, in the order the doc nav lists them.
 *
 * Entries are deliberately short. `docUrl`, `demoUrl` and the output filename
 * are derived from `project.config.ts` plus the fields below, so no entry can
 * point at the wrong framework's docs and filenames stay in nav order without
 * anyone numbering them by hand.
 *
 * Adapting means: delete the pages this framework does not document, add the
 * ones it does, and fix the line ranges. `npm run doctor` then tells you which
 * ranges no longer point at real code.
 *
 * ── The line ranges ────────────────────────────────────────────────────────
 * `startLine`/`endLine` are what the simulated IDE highlights. They are
 * hardcoded, which means they drift the moment someone edits a demo page.
 * Doctor guards this: where a file carries `[!code highlight]` or `#region`
 * markers, it checks the range still covers one and names the marker's current
 * line when it does not. Keep those markers in the frontend and the guard keeps
 * working.
 */

import { definePages } from '../core/types';

export const PAGES = definePages([
  {
    id: 'quickstart',
    name: 'Quickstart',
    videoName: 'Quickstart',
    docPath: 'quickstart',
    route: 'quickstart',
    // Leads with the versions, not the manifest. package.json declares
    // RANGES, so this clip used to show a floor while the run it
    // documented had installed something newer. VERSIONS.md is generated
    // after install (ci/write-versions.mjs) and names what resolved.
    // package.json stays as the first tab: the range is still what a
    // reader would write in their own project.
    ideFile: 'frontend/VERSIONS.md',
    startLine: 6,
    endLine: 21,
    extraTabs: [
      {
        filePath: 'frontend/package.json',
        startLine: 12,
        endLine: 22,
      },
      {
        filePath: 'frontend/src/app/quickstart/demo-chat/page.tsx',
        startLine: 28,
        endLine: 38,
      },
    ],
    prompt: 'Hey, are you connected? Tell me a quick fun fact about kites.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'prebuilt-components',
    name: 'Prebuilt Components',
    videoName: 'PrebuiltComponents',
    docPath: 'prebuilt-components',
    route: 'prebuilt-components',
    ideFile: 'frontend/src/app/prebuilt-components/demo-chat/page.tsx',
    startLine: 58,
    endLine: 104,
    prompt: 'In two sentences, what does CopilotKit do?',
    prompts: ['In two sentences, what does CopilotKit do?'],
    waitAfterPromptMs: 1500,
  },
  {
    // The same doc page followed in the app the Quickstart tells you to clone.
    // Sits next to `prebuilt-components` because the two are the two ways of
    // following one page: by hand in a Tailwind v4 app, which works, and in
    // ag2-samples, which is Tailwind v3 and stops on the Setup step.
    id: 'prebuilt-error',
    name: 'Prebuilt Components - setup step breaks the build',
    videoName: 'PrebuiltComponentsBuildError',
    docPath: 'prebuilt-components',
    route: 'prebuilt-components/build-failure',
    // This clip's demo is a terminal replaying the failed build, so the
    // taskbar switch back out of VS Code opens Windows Terminal, not Chrome.
    demoApp: 'terminal',
    // Versions first, same as the Quickstart clip: the tailwind v3 / v4 split
    // listed here IS the error, so the frame that explains the failure comes
    // before the failure itself.
    ideFile: 'prior-testing/ag2-samples/VERSIONS.md',
    startLine: 7,
    endLine: 25,
    extraTabs: [
      {
        // The sample's own pins -- tailwindcss ^3.4.1 on line 29.
        filePath: 'prior-testing/ag2-samples/ui/package.json',
        startLine: 10,
        endLine: 31,
      },
      {
        // Line 6 is the Prebuilt Components page's Setup step, added verbatim.
        filePath: 'prior-testing/ag2-samples/ui/app/layout.tsx',
        startLine: 1,
        endLine: 8,
      },
    ],
    // Not sent to a chat -- this page has none. `core/doctor.ts` requires every
    // page to declare a non-empty prompt, an assumption that holds for the
    // other twenty and not for this one; noted rather than patched out of
    // frozen code. This is the line the clip is about.
    prompt: 'import "@copilotkit/react-core/v2/styles.css"',
    // Doubles as the Notepad dwell: how long the finished note stays up.
    waitAfterPromptMs: 7000,
  },
  {
    id: 'slots',
    name: 'Custom Look and Feel - Slots',
    videoName: 'Slots',
    docPath: 'custom-look-and-feel/slots',
    route: 'custom-look-and-feel/slots',
    ideFile: 'frontend/src/app/custom-look-and-feel/slots/demo-chat/page.tsx',
    startLine: 66,
    endLine: 116,
    prompt: 'Testing level one: the default slots. Say hi back.',
    prompts: [
      'Testing level one: the default slots. Say hi back.',
      'Level two now, with the props override. Still with me?',
      'And level three, the custom component. Say something short.',
    ],
    waitAfterPromptMs: 1500,
  },
  {
    id: 'headless-ui',
    name: 'Custom Look and Feel - Headless UI',
    videoName: 'HeadlessUI',
    docPath: 'custom-look-and-feel/headless-ui',
    route: 'custom-look-and-feel/headless-ui',
    ideFile: 'frontend/src/app/custom-look-and-feel/headless-ui/demo-chat/page.tsx',
    startLine: 28,
    endLine: 78,
    prompt: 'Suggest one good name for a headless chat UI.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'programmatic-control',
    name: 'Custom Look and Feel - Programmatic Control',
    videoName: 'ProgrammaticControl',
    docPath: 'programmatic-control',
    route: 'programmatic-control',
    ideFile: 'frontend/src/app/programmatic-control/demo-chat/page.tsx',
    startLine: 28,
    endLine: 102,
    prompt: 'Is it raining in Tokyo right now?',
    waitAfterPromptMs: 1500,
  },
  {
    id: 'inspector',
    name: 'Custom Look and Feel - Inspector',
    videoName: 'Inspector',
    docPath: 'inspector',
    route: 'inspector',
    ideFile: 'frontend/src/components/providers.tsx',
    startLine: 30,
    endLine: 47,
    prompt: 'Quick check: what is 17 times 23?',
    waitAfterPromptMs: 1500,
  },
  {
    id: 'display-only',
    name: 'Generative UI - Display Only Component',
    videoName: 'DisplayOnly',
    docPath: 'generative-ui/your-components/display-only',
    route: 'generative-ui/your-components/display-only',
    ideFile:
      'frontend/src/app/generative-ui/your-components/display-only/demo-chat/page.tsx',
    startLine: 27,
    endLine: 55,
    prompt: 'Show me a weather card for Tokyo. It is 77 degrees and clear today.',
    waitAfterPromptMs: 4000,
    demo: {
      sendTimeoutMs: 12000,
      render: {
        selector: 'div:has-text("Tokyo"), div:has-text("77°F")',
        last: true,
        timeoutMs: 25000,
        beatMs: 3500,
      },
      glideTo: [{ x: 960, y: 500, beatMs: 600 }],
    },
  },
  {
    id: 'interactive',
    name: 'Generative UI - Interactive Component (Approval Gate)',
    videoName: 'Interactive',
    docPath: 'generative-ui/your-components/interactive',
    route: 'generative-ui/your-components/interactive',
    ideFile:
      'frontend/src/app/generative-ui/your-components/interactive/demo-chat/page.tsx',
    startLine: 23,
    endLine: 64,
    prompt: 'Clear the temp cache for me by running rm -rf /tmp/cache',
    waitAfterPromptMs: 4000,
    demo: {
      sendTimeoutMs: 12000,
      render: {
        selector: 'button:has-text("Approve")',
        timeoutMs: 20000,
        beatMs: 1500,
        required:
          '[Human in the Loop] The Approve button never rendered — the approval card did not appear, so the gate was never exercised.',
      },
      click: {
        selector: 'button:has-text("Approve")',
        missing: '[Human in the Loop] The Approve button vanished before it could be clicked.',
      },
      checks: [
        {
          selector: 'button:has-text("Approve")',
          enabled: false,
          severity: 'warn',
          ok: '[Human in the Loop] Approval taken and a follow-up reply arrived.',
          message: '[Human in the Loop] Approve is still clickable after the reply — the decision may not have reached the agent.',
        },
      ],
    },
  },
  {
    id: 'tool-rendering',
    name: 'Generative UI - Tool Rendering',
    videoName: 'ToolRendering',
    docPath: 'generative-ui/tool-rendering',
    route: 'generative-ui/tool-rendering',
    ideFile: 'frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx',
    startLine: 23,
    endLine: 63,
    prompt: 'Any rain expected in Tokyo this week?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'state-rendering',
    name: 'Generative UI - State Rendering',
    videoName: 'StateRendering',
    docPath: 'generative-ui/state-rendering',
    route: 'generative-ui/state-rendering',
    ideFile: 'frontend/src/app/generative-ui/state-rendering/demo-chat/page.tsx',
    startLine: 28,
    endLine: 53,
    prompt: 'Look up the longest rivers in the world, then the highest waterfalls.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'frontend-tools',
    name: 'App Control - Frontend Tools',
    videoName: 'FrontendTools',
    docPath: 'frontend-tools',
    route: 'frontend-tools',
    ideFile: 'frontend/src/app/frontend-tools/demo-chat/page.tsx',
    startLine: 20,
    endLine: 33,
    prompt: 'Can you say hello to Malaika for me?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'shared-state-read',
    name: 'Shared State - Reading agent state',
    videoName: 'SharedStateRead',
    docPath: 'shared-state/read',
    route: 'shared-state/read',
    ideFile: 'frontend/src/app/shared-state/read/demo-chat/page.tsx',
    startLine: 20,
    endLine: 55,
    prompt: 'Please switch the language to Spanish.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'shared-state-write',
    name: 'Shared State - Writing agent state',
    videoName: 'SharedStateWrite',
    docPath: 'shared-state/write',
    route: 'shared-state/write',
    ideFile: 'frontend/src/app/shared-state/write/demo-chat/page.tsx',
    startLine: 30,
    endLine: 54,
    prompt: 'Which language is set right now?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'readables',
    name: 'Readables',
    videoName: 'Readables',
    docPath: 'readables',
    route: 'readables',
    ideFile: 'frontend/src/app/readables/demo-chat/page.tsx',
    startLine: 18,
    endLine: 34,
    prompt: 'Who do I work with? Name them.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'auth',
    name: 'Authentication - Bearer Token',
    videoName: 'Auth',
    docPath: 'auth',
    route: 'auth',
    ideFile: 'backend/main.py',
    startLine: 94,
    endLine: 122,
    prompt: 'Quick ping: did this request come through authenticated?',
    waitAfterPromptMs: 4000,
    demo: {
      sendTimeoutMs: 12000,
      before: [
        {
          selector:
            'div[class*="border-emerald"], div[class*="border-amber"], div[class*="border-rose"], h2:has-text("Current configuration")',
          offset: { x: 100, y: 40 },
          beatMs: 2500,
        },
      ],
    },
  },
  {
    id: 'threads-drawer',
    name: 'Rich Threads - Threads Drawer',
    videoName: 'ThreadsDrawer',
    docPath: 'prebuilt-components/copilot-threads-drawer',
    route: 'prebuilt-components/copilot-threads-drawer',
    ideFile:
      'frontend/src/app/prebuilt-components/copilot-threads-drawer/demo-chat/page.tsx',
    startLine: 80,
    endLine: 116,
    prompt: 'Tell me a short joke about programmers.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'threads-headless',
    name: 'Rich Threads - Headless Threads',
    videoName: 'ThreadsHeadless',
    docPath: 'headless-threads',
    route: 'headless-threads',
    ideFile: 'frontend/src/app/headless-threads/demo-chat/page.tsx',
    startLine: 30,
    endLine: 50,
    extraTabs: [
      {
        // "Driving one agent per thread": the three-prop useAgent call.
        filePath: 'frontend/src/app/headless-threads/demo-chat/page.tsx',
        startLine: 181,
        endLine: 205,
      },
    ],
    prompt: 'Summarize what an AG-UI agent is, in one line.',
    waitAfterPromptMs: 4000,
    demo: {
      // The panel mounts one `useAgent({ agentId, runtimeAgentId, threadId })`
      // per thread. Registering two private agents against one runtime agent is
      // the whole claim of the section, so a panel that never paints is the
      // defect.
      render: {
        selector: '[data-testid="per-thread-agents"]',
        required:
          'The per-thread agent panel never rendered — useAgent({ agentId, runtimeAgentId, threadId }) did not mount.',
      },
      checks: [
        {
          selector: '[data-testid="thread-agent-run"]',
          enabled: true,
          ok: 'Thread-scoped agent is ready; runAgent() would address its own thread.',
          message:
            'The thread-scoped agent never became ready (isReady stayed false), so runAgent() could not address its thread.',
        },
      ],
    },
  },
  {
    id: 'threads-lifecycle',
    name: 'Rich Threads - Thread & History Lifecycle',
    videoName: 'ThreadsLifecycle',
    docPath: 'threads-lifecycle',
    route: 'threads-lifecycle',
    ideFile: 'frontend/src/app/threads-lifecycle/demo-chat/page.tsx',
    startLine: 25,
    endLine: 40,
    extraTabs: [
      {
        filePath: 'frontend/src/app/threads-lifecycle/demo-chat/page.tsx',
        startLine: 70,
        endLine: 100,
      },
    ],
    prompt: 'Give me a one-line joke, then I will start a new thread.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'copilot-runtime',
    name: 'Backend - Copilot Runtime',
    videoName: 'CopilotRuntime',
    docPath: 'copilot-runtime',
    route: 'copilot-runtime',
    ideFile: 'frontend/src/app/api/copilotkit/[[...slug]]/route.ts',
    startLine: 19,
    endLine: 37,
    prompt: 'What is the weather in Berlin today?',
    prompts: ['What is the weather in Berlin today?', 'Now switch the language to Spanish.'],
    waitAfterPromptMs: 1500,
  },
  {
    id: 'ag-ui',
    name: 'Backend - AG-UI Protocol Stream',
    videoName: 'AgUi',
    docPath: 'ag-ui',
    route: 'ag-ui',
    ideFile: 'frontend/src/app/ag-ui/demo-chat/page.tsx',
    startLine: 70,
    endLine: 102,
    prompt: "What's the weather in Tokyo?",
    waitAfterPromptMs: 4000,
    demo: {
      sendTimeoutMs: 8000,
      glideTo: [
        { x: 450, y: 300, beatMs: 1500 },
        { x: 450, y: 550, beatMs: 1500 },
      ],
    },
  },
  {
    id: 'intelligence-quickstart',
    name: 'Intelligence - Connect Intelligence in 5 minutes',
    videoName: 'IntelligenceQuickstart',
    docPath: 'intelligence/quickstart',
    route: 'intelligence/quickstart',
    // The doc's step 3: a plain `route.ts` with `mode: "single-route"` and one
    // verb, where the page used to publish `[[...slug]]` and four.
    ideFile: 'frontend/src/app/api/copilotkit-single/route.ts',
    startLine: 1,
    endLine: 37,
    extraTabs: [
      // Step 4: the matching provider flag.
      {
        filePath: 'frontend/src/components/single-endpoint-provider.tsx',
        startLine: 32,
        endLine: 48,
      },
      // Step 5: the read-back. The take's verdict is this component's count
      // growing by one, not the chat producing a reply.
      {
        filePath: 'frontend/src/components/intelligence-status.tsx',
        startLine: 62,
        endLine: 84,
      },
    ],
    prompt: 'What is the weather in Berlin today?',
    // The only page in this suite whose runtime route is never touched by any
    // other take, so its first request is also the first time `next dev`
    // compiles `/api/copilotkit-single`. On a cold CI runner that lands past
    // the 30s default and the take fails with the agent apparently silent.
    // `core/timeouts.ts` says the defaults suit a warm dev server and that a
    // legitimately slow page should say so here; this is that page.
    timeouts: { replyStartMs: 90_000 },
    waitAfterPromptMs: 4000,
  },
  {
    id: 'human-in-the-loop-governed-actions',
    name: 'App Control - Governed Action Approval',
    videoName: 'GovernedActions',
    docPath: 'human-in-the-loop/governed-actions',
    route: 'human-in-the-loop/governed-actions',
    // The tool registration -- the half that makes the run stop.
    ideFile: 'frontend/src/app/human-in-the-loop/governed-actions/demo-chat/page.tsx',
    startLine: 113,
    endLine: 152,
    extraTabs: [
      // The approval card the tool renders.
      {
        filePath: 'frontend/src/app/human-in-the-loop/governed-actions/demo-chat/page.tsx',
        startLine: 46,
        endLine: 107,
      },
    ],
    prompt:
      'Please send an invoice reminder to acme@example.com, but check with me before it goes out.',
    // Two turns, because the card has two answers and only one of them was
    // ever filmed. The first request is harmless and gets approved; the second
    // is destructive and gets rejected, which is the half that shows the
    // policy actually stopping something.
    prompts: [
      'Please send an invoice reminder to acme@example.com, but check with me before it goes out.',
      'Now permanently delete the acme@example.com customer record, but check with me before it goes through.',
    ],
    waitAfterPromptMs: 6000,
  },
]);
