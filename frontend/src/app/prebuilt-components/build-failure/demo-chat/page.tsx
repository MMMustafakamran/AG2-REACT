import { readSource } from "@/lib/source";

import { TerminalReplay } from "./terminal";

/**
 * The Prebuilt Components page's own Setup step, applied to the repo the
 * Quickstart tells you to clone — and the build error that follows.
 *
 * `/prebuilt-components` implements the same page by hand, in a Tailwind v4
 * app, and it passes. This route is the other path through it:
 *
 *   git clone https://github.com/ag2ai/ag2-samples.git     # the Quickstart's step
 *   cd ag2-samples/ui && pnpm install                      # its pinned 1.67.1
 *   # the Prebuilt Components Setup step, added verbatim to app/layout.tsx:
 *   #   import "@copilotkit/react-core/v2/styles.css";
 *   npx next build
 *
 * That stylesheet ships pre-compiled by Tailwind v4, so it contains
 * `@layer properties` and `@layer base`. `ag2-samples/ui` is a Tailwind v3
 * project, and v3's PostCSS plugin refuses a bare `@layer`. Nothing is
 * upgraded and nothing is misconfigured — the two documented steps simply do
 * not go together.
 *
 * The output is read off disk from `prior-testing/ag2-samples/BUILD-ERROR.log`,
 * captured from that build. Nothing is retyped: if the log changes, this page
 * changes with it. The two capture-time transformations — ANSI stripped, very
 * long lines truncated with a visible marker — are recorded in the log itself
 * and in `terminal.tsx`.
 *
 * Next.js's own error overlay would have been the nicer surface, and it is what
 * the original report screenshotted, but the dev overlay refuses to mount
 * inside an iframe, so framing the live sample showed a blank page. The
 * terminal is the same error from the same run.
 */

export const dynamic = "force-dynamic";

export default async function Page() {
  const log = await readSource("prior-testing/ag2-samples/BUILD-ERROR.log");

  const lines = log.error
    ? [`Could not read the captured build log: ${log.error}`]
    : log.code.split("\n");

  return (
    <main className="h-dvh bg-[#0c0c0c]" data-demo-ready="true">
      {/*
        The app-wide provider mounts CopilotKit's Inspector on localhost. Every
        other demo route wants it — it is the subject of `/inspector` — but this
        one is a terminal with no agent behind it, and a CopilotKit button
        hovering over a build log would suggest the two are related. Scoped to
        this route: the style unmounts with the page.
      */}
      <style>{`cpk-web-inspector { display: none !important; }`}</style>
      <TerminalReplay lines={lines} />
    </main>
  );
}
