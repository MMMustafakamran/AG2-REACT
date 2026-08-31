/**
 * The nav, the route headers, and the README status table all read from here,
 * so a doc page and its implementation status are described exactly once.
 *
 * Route paths mirror the doc URLs under docs.copilotkit.ai/ag2. `offNav: true`
 * marks pages that resolve fine but are absent from that sidebar as of the
 * last sync — the AG2 sidebar expands by section, so "absent" here means
 * absent from every section's expansion, not just the current page's.
 */

/**
 * There is exactly one doc-sync date in this repo, and it is not here: it is
 * `syncedAt` in `doc-snapshot/manifest.json`, written every time the sync
 * button runs. A hand-maintained date alongside it only ever drifted out of
 * agreement with the machine one, so it was removed — `/doc-sync` is the
 * single place that answers "how current are these docs".
 */
export const DOCS_ROOT = "https://docs.copilotkit.ai/ag2";

/**
 * Working  — implemented and exercisable against the local stack.
 * Partial  — implemented, but something outside this repo limits it.
 * Reference — intentionally not a live feature; doc/notes surface.
 * Broken   — implemented but currently failing.
 */
export type RouteStatus = "working" | "partial" | "reference" | "broken" | "not-started";

export interface RouteMeta {
  /** App route path. */
  path: string;
  /** Nav label. */
  title: string;
  /** Doc page this route tests, relative to docs.copilotkit.ai. */
  docPath: string;
  /** One-line description in our own words. */
  summary: string;
  status: RouteStatus;
  /** Shown in the route header when status is not plain "working". */
  statusNote?: string;
  /** Page exists in the docs but is absent from the current sidebar. */
  offNav?: boolean;
  /**
   * This route owns a live interactive surface, which lives at
   * `<path>/demo-chat` rather than on the page itself. The doc page keeps the
   * explanation and the source; the demo route is chrome-free so it can be
   * screen-recorded on its own.
   */
  hasDemo?: boolean;
}

/** Where a route's interactive demo lives, if it has one. */
export function demoPath(route: RouteMeta): string | undefined {
  if (!route.hasDemo) return undefined;
  return route.path === "/" ? "/demo-chat" : `${route.path}/demo-chat`;
}

export interface NavGroup {
  title: string;
  routes: RouteMeta[];
}

export const NAV: NavGroup[] = [
  {
    title: "Getting Started",
    routes: [
      {
        path: "/",
        title: "Introduction",
        docPath: "/ag2",
        summary:
          "What this harness covers and how the three processes fit together.",
        status: "reference",
        statusNote: "Landing page — orientation and live connection check.",
      },
      {
        path: "/quickstart",
        hasDemo: true,
        title: "Quickstart",
        docPath: "/ag2/quickstart",
        summary:
          "An AG2 agent served over AG-UI at /chat, a runtime route in front of it, and a chat.",
        status: "partial",
        statusNote:
          "The page's own backend does not run: its imports resolve on no published ag2 release. See backend/API_DRIFT.md §1.",
      },
    ],
  },
  {
    title: "Basics",
    routes: [
      {
        path: "/prebuilt-components",
        hasDemo: true,
        title: "Prebuilt Components",
        docPath: "/ag2/prebuilt-components",
        summary:
          "CopilotChat, CopilotPopup, and CopilotSidebar side by side, each driving the same agent.",
        status: "working",
      },
    ],
  },
  {
    title: "Custom Look and Feel",
    routes: [
      {
        path: "/custom-look-and-feel/slots",
        hasDemo: true,
        title: "Slots",
        docPath: "/ag2/custom-look-and-feel/slots",
        summary:
          "Replacing chat sub-components at three levels: class strings, prop overrides, and whole components.",
        status: "working",
        offNav: true,
      },
      {
        path: "/custom-look-and-feel/headless-ui",
        hasDemo: true,
        title: "Headless UI",
        docPath: "/ag2/custom-look-and-feel/headless-ui",
        summary:
          "A chat interface built from scratch on the headless hooks, with no CopilotKit chrome.",
        status: "working",
        offNav: true,
      },
      {
        path: "/programmatic-control",
        hasDemo: true,
        title: "Programmatic Control",
        docPath: "/ag2/programmatic-control",
        summary:
          "Driving the agent with no chat UI: read state and messages, run it, and stop it mid-run.",
        status: "working",
      },
      {
        path: "/inspector",
        hasDemo: true,
        title: "Inspector",
        docPath: "/ag2/inspector",
        summary:
          "The built-in debugging overlay showing AG-UI events, agents, state, and registered tools.",
        status: "working",
      },
    ],
  },
  {
    title: "Generative UI",
    routes: [
      {
        path: "/generative-ui/your-components/display-only",
        hasDemo: true,
        title: "Your Components · Display-only",
        docPath: "/ag2/generative-ui/your-components/display-only",
        summary:
          "Registering a React component as a tool the agent can render in the chat, with no handler.",
        status: "working",
      },
      {
        path: "/generative-ui/your-components/interactive",
        hasDemo: true,
        title: "Your Components · Interactive",
        docPath: "/ag2/generative-ui/your-components/interactive",
        summary:
          "An approval gate built with useHumanInTheLoop — the run suspends until the user responds.",
        status: "working",
      },
      {
        path: "/generative-ui/tool-rendering",
        hasDemo: true,
        title: "Tool Rendering",
        docPath: "/ag2/generative-ui/tool-rendering",
        summary:
          "The agent's get_weather tool call rendered as a custom component, plus a catch-all renderer.",
        status: "working",
      },
      {
        path: "/generative-ui/state-rendering",
        hasDemo: true,
        title: "State Rendering",
        docPath: "/ag2/generative-ui/state-rendering",
        summary:
          "Streaming agent state to the UI: a searches list kept in sync through AG-UI state snapshots.",
        status: "working",
      },
    ],
  },
  {
    title: "App Control",
    routes: [
      {
        path: "/frontend-tools",
        hasDemo: true,
        title: "Frontend Tools",
        docPath: "/ag2/frontend-tools",
        summary:
          "A tool the agent calls that executes in the browser, forwarded automatically over AG-UI.",
        status: "working",
      },
    ],
  },
  {
    title: "Shared State",
    routes: [
      {
        path: "/shared-state/read",
        hasDemo: true,
        title: "Reading agent state",
        docPath: "/ag2/shared-state/read",
        summary:
          "Reading the agent's live state in your own UI through agent.state.",
        status: "partial",
        statusNote:
          "State reaches the UI. The chat half of the page — 'always respond in the current language' — has no mechanism behind it. See backend/API_DRIFT.md §6.",
      },
      {
        path: "/shared-state/write",
        hasDemo: true,
        title: "Writing agent state",
        docPath: "/ag2/shared-state/write",
        summary:
          "Writing back into agent state with agent.setState, and re-running with a hint message.",
        status: "working",
        statusNote:
          "Works, but only because this backend merges state in the opposite order to the shipped default. See backend/API_DRIFT.md §5.",
      },
      {
        path: "/readables",
        hasDemo: true,
        title: "Readables",
        docPath: "/ag2/readables",
        summary:
          "Sharing app state with the agent via useAgentContext, forwarded as AG-UI run context.",
        status: "partial",
        statusNote:
          "AGUIStream drops the run's context array, so the page's own lookup can never resolve. This backend forwards it by hand. See backend/API_DRIFT.md §3.",
      },
    ],
  },
  {
    title: "AG2",
    routes: [
      {
        path: "/auth",
        hasDemo: true,
        title: "Authentication",
        docPath: "/ag2/auth",
        summary:
          "Forwarding a bearer token from the provider to the AG-UI server, and validating it there.",
        status: "working",
      },
    ],
  },
  {
    title: "Rich Threads",
    routes: [
      {
        path: "/threads",
        title: "Overview",
        docPath: "/ag2/threads",
        summary:
          "What Rich Threads persist, and the credentials this section needs before any of it works.",
        status: "partial",
        statusNote:
          "Runs on its own Intelligence-backed runtime endpoint, on a free-tier license that expires 2026-09-12.",
      },
      {
        path: "/prebuilt-components/copilot-threads-drawer",
        hasDemo: true,
        title: "Threads Drawer",
        docPath: "/ag2/prebuilt-components/copilot-threads-drawer",
        summary:
          "The drop-in conversation sidebar, in both its zero-prop form and with all three documented escape hatches.",
        status: "partial",
        statusNote: "Requires the license above. Rename is absent by design.",
      },
      {
        path: "/headless-threads",
        hasDemo: true,
        title: "Headless Threads",
        docPath: "/ag2/headless-threads",
        summary:
          "A thread sidebar built from scratch on useThreads: rename, archive, delete, switching, and pagination.",
        status: "partial",
        statusNote: "Requires the license above for mutations.",
      },
      {
        path: "/threads-lifecycle",
        hasDemo: true,
        title: "Thread & History Lifecycle",
        docPath: "/ag2/threads-lifecycle",
        summary:
          "Mint, replay, switch: how a threadId comes to exist and what makes history hydrate into the view.",
        status: "partial",
        statusNote: "Requires the license above for server-side replay.",
      },
    ],
  },
  {
    title: "Backend",
    routes: [
      {
        path: "/copilot-runtime",
        hasDemo: true,
        title: "Copilot Runtime",
        docPath: "/ag2/copilot-runtime",
        summary:
          "This repo's live runtime config, agent routing across three ids, and the direct-connection tradeoff.",
        status: "working",
      },
      {
        path: "/ag-ui",
        hasDemo: true,
        title: "AG-UI",
        docPath: "/ag2/ag-ui",
        summary:
          "A live capture of the raw AG-UI event stream flowing between the runtime and this page.",
        status: "working",
      },
    ],
  },
  {
    title: "Doc Sync",
    routes: [
      {
        path: "/doc-sync",
        title: "Doc drift",
        docPath: "/ag2",
        summary:
          "Re-fetches the markdown behind every tracked doc page and diffs it against the stored snapshot, flagging changes inside code blocks.",
        status: "reference",
      },
    ],
  },
];

export const ALL_ROUTES: RouteMeta[] = NAV.flatMap((g) => g.routes);

export function findRoute(path: string): RouteMeta | undefined {
  return ALL_ROUTES.find((r) => r.path === path);
}

export function docUrl(route: RouteMeta): string {
  return `https://docs.copilotkit.ai${route.docPath}`;
}

export const STATUS_LABEL: Record<RouteStatus, string> = {
  working: "Working",
  partial: "Partial",
  reference: "Reference",
  broken: "Broken",
  "not-started": "Not started",
};
