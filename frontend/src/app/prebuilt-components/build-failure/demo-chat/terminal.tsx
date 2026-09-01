"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Replays a captured terminal session at human reading speed.
 *
 * The lines come from the server component, which reads
 * `prior-testing/ag2-samples/BUILD-ERROR.log` off disk — the output of
 * `npx next build` in `ag2-samples/ui` after adding the Prebuilt Components
 * page's Setup line. Nothing here writes terminal text; it only paces what was
 * captured.
 *
 * Two transformations were applied when capturing, both noted in the log's own
 * header: ANSI colour codes stripped, and lines over 300 characters truncated
 * with a visible marker — the minified stylesheet webpack echoes back is 89,680
 * characters on one line.
 *
 * Pacing is uneven on purpose. A build does not emit at a constant rate: it
 * stalls on the compile step and then dumps the error at once, and a replay
 * that scrolls smoothly reads as a fake.
 */

/** How long to hold before the next line, by what the line is. */
function delayFor(line: string, index: number): number {
  if (index === 0) return 900;
  if (line.includes("Creating an optimized production build")) return 2800;
  if (line.includes("Compiled with warnings")) return 1200;
  if (line.includes("Failed to compile")) return 1400;
  if (line.startsWith("Syntax error:")) return 900;
  if (line.includes("tailwindcss v4.1.18")) return 800;
  if (line.trim() === "") return 120;
  return 150;
}

function classFor(line: string): string {
  if (line.includes("Failed to compile.")) return "text-red-400 font-semibold";
  if (line.startsWith("Syntax error:")) return "text-red-400";
  if (line.trimStart().startsWith(">")) return "text-red-300";
  if (line.trimStart().startsWith("⚠")) return "text-amber-300/80";
  if (line.startsWith("<w>")) return "text-slate-600";
  if (line.includes("▲ Next.js")) return "text-slate-200 font-semibold";
  if (line.includes("tailwindcss v4.1.18")) return "text-amber-200";
  if (/^\s*\|/.test(line) || /^\s+\d+ \|/.test(line)) return "text-slate-400";
  if (line.startsWith("./")) return "text-cyan-300";
  return "text-slate-300";
}

export function TerminalReplay({ lines }: { lines: string[] }) {
  const [shown, setShown] = useState(0);
  const [typed, setTyped] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const COMMAND = "npx next build";

  // Type the command first, the way a person would, then start the output.
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTyped(COMMAND.slice(0, i));
      if (i >= COMMAND.length) clearInterval(t);
    }, 85);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (typed !== COMMAND) return;
    if (shown >= lines.length) return;
    const t = setTimeout(
      () => setShown((n) => n + 1),
      delayFor(lines[shown] ?? "", shown),
    );
    return () => clearTimeout(t);
  }, [shown, typed, lines]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  const done = shown >= lines.length;

  return (
    <div className="flex h-full flex-col bg-[#0c0c0c]">
      {/* Windows Terminal-style tab strip */}
      <div className="flex shrink-0 items-center gap-2 bg-[#1f1f1f] px-3 py-1.5">
        <div className="flex items-center gap-2 rounded-t bg-[#0c0c0c] px-3 py-1.5">
          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M2 3.5 L6.5 8 L2 12.5"
              stroke="#cccccc"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M8 12.5 H13.5" stroke="#cccccc" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-xs text-slate-300">
            ag2-samples/ui — PowerShell
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3 pr-1 text-slate-500">
          <span className="text-xs">—</span>
          <span className="text-xs">▢</span>
          <span className="text-xs">✕</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-[1.55]"
      >
        <div>
          <span className="text-emerald-400">PS </span>
          <span className="text-cyan-300">C:\work\ag2-samples\ui</span>
          <span className="text-slate-400">&gt; </span>
          <span className="text-slate-100">{typed}</span>
          {typed !== COMMAND && (
            <span className="ml-0.5 inline-block h-[15px] w-[7px] translate-y-[2px] animate-pulse bg-slate-200" />
          )}
        </div>

        {lines.slice(0, shown).map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap ${classFor(line)}`}>
            {line === "" ? "\u00a0" : line}
          </div>
        ))}

        {done && (
          <div className="mt-1">
            <span className="text-emerald-400">PS </span>
            <span className="text-cyan-300">C:\work\ag2-samples\ui</span>
            <span className="text-slate-400">&gt; </span>
            <span className="inline-block h-[15px] w-[7px] translate-y-[2px] animate-pulse bg-slate-200" />
          </div>
        )}
      </div>
    </div>
  );
}
