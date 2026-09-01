import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Page } from 'playwright';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { humanGlide, sleep } from '../core/overlays/cursor';
import {
  closeNotepad,
  openNotepad,
  typeInNotepad,
} from '../core/overlays/notepad';

/**
 * The one page in this suite whose demo is a failure rather than a feature.
 *
 * `/prebuilt-components` implements the page by hand, in a Tailwind v4 app, and
 * it works. This clip is the same page followed in the app the Quickstart tells
 * you to clone — `ag2-samples/ui`, which is Tailwind v3. Adding the Setup step's
 * `import "@copilotkit/react-core/v2/styles.css"` there stops the build, because
 * that stylesheet ships pre-compiled by Tailwind v4.
 *
 * The demo route replays that build's captured output. There is no chat and
 * nothing to prompt; this handler waits for the replay to reach the failure,
 * reads down it, then writes the finding in Notepad the way
 * `readables.action.ts` does — the video carries its own report.
 */

/** Versions read from the sample's own package.json, not this harness's. */
function sampleVersions(rootPath: string): string {
  try {
    const pkg = JSON.parse(
      readFileSync(
        join(rootPath, 'prior-testing', 'ag2-samples', 'ui', 'package.json'),
        'utf8',
      ),
    ) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    return [
      `copilotkit ${pkg.dependencies['@copilotkit/react-core']}`,
      `tailwind ${pkg.devDependencies.tailwindcss}`,
      `next ${pkg.dependencies.next}`,
    ].join(' / ');
  } catch {
    // Dropped rather than guessed at, same as the readables note.
    return '';
  }
}

/**
 * Lowercase and comma-free on purpose — a tester's scratch note, not a report.
 * Identifiers keep their real casing: `@tailwind base` written any other way
 * would not be the directive the error names.
 */
function buildIssueNote(rootPath: string): string {
  const versions = sampleVersions(rootPath);

  return [
    'prebuilt components - ag2',
    '',
    'the setup step breaks the build',
    '',
    'quickstart says clone ag2-samples',
    'that app is tailwind v3',
    '',
    'prebuilt components says add this to layout',
    'import "@copilotkit/react-core/v2/styles.css"',
    '',
    'but that css ships prebuilt with tailwind v4',
    'so it has @layer with no @tailwind directive',
    'and tailwind v3 stops on it',
    '',
    '@layer base is used but no matching @tailwind base directive is present',
    '',
    'nothing renders so everything after this page is blocked',
    ...(versions ? ['', versions] : []),
  ].join('\n');
}

/** Move to a line of terminal output by its text, if it is on screen. */
async function restOnLine(
  page: Page,
  contains: string,
  holdMs: number,
): Promise<boolean> {
  const line = page.locator('div', { hasText: contains }).last();
  const box = await line.boundingBox().catch(() => null);
  if (!box || box.height > 140) return false;
  await humanGlide(
    page,
    box.x + Math.min(box.width / 2, 460),
    box.y + box.height / 2,
    18,
  );
  await sleep(holdMs);
  return true;
}

export const runPrebuiltErrorAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
) => {
  console.log('   ⏳ Waiting for the build replay to finish...');
  const finished = await page
    .waitForFunction(
      () => document.body.innerText.includes('Failed to compile.'),
      undefined,
      { timeout: 60_000 },
    )
    .then(() => true)
    .catch(() => false);

  if (!finished) {
    throw new Error(
      'The terminal replay never reached the compile failure. Check that ' +
        'prior-testing/ag2-samples/BUILD-ERROR.log is readable.',
    );
  }
  console.log('   ✅ Build output finished replaying.');

  await sleep(1400);

  // Read down the error the way a person does: that it failed, which file,
  // then the two versions that cannot meet.
  await restOnLine(page, 'Failed to compile.', 1800);
  await restOnLine(page, '@layer base` is used but no matching', 2800);
  await restOnLine(page, 'tailwindcss v4.1.18', 2400);

  console.log('   [PrebuiltError] Writing the issue note in Notepad...');
  await sleep(900);
  await openNotepad(page, 'prebuilt-components-issue.txt');
  await typeInNotepad(page, buildIssueNote(rootPath), {
    charDelayMs: 44,
    jitter: 0.5,
  });
  await closeNotepad(page, config.waitAfterPromptMs ?? 7000);
};
