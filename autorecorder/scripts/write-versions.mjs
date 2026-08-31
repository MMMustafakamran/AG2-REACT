/**
 * frontend/VERSIONS.md — the file the Quickstart clip puts on screen.
 *
 * The Quickstart recording leads with the dependency manifest, on the
 * reasoning that a demo is only meaningful against known versions. But
 * `package.json` declares RANGES: it shows `^1.69.2` while the run it is
 * documenting may have installed 1.69.3.
 *
 * `package-lock.json` does carry the resolved versions, but it is 24k lines
 * and scatters the interesting entries hundreds of lines apart, so no
 * highlight range shows them together and every dependency change moves the
 * line numbers.
 *
 * Hence this: small, ordered, and generated after install. Not committed — it
 * describes one run.
 *
 * Self-contained on purpose. The reference repo this recorder came from kept
 * the equivalent under `ci/lib/`, so `npm run doctor` could not run without a
 * CI directory. This repo has no `ci/`, and the recorder should not need one.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(HERE, '..', '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const OUT = path.join(FRONTEND_DIR, 'VERSIONS.md');

/** The frontend packages worth naming in a clip. */
const FRONTEND_PACKAGES = [
  '@copilotkit/react-core',
  '@copilotkit/runtime',
  '@ag-ui/client',
  'next',
  'react',
];

/**
 * Declared vs installed, collapsed when they agree.
 *
 * Reporting only the declared range hides what actually ran; reporting only
 * the installed version hides a stale range. Naming both when they differ is
 * the only form that cannot mislead.
 */
function resolveVersion(dir, pkg, name) {
  const declared = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  let installed;
  try {
    const manifest = path.join(dir, 'node_modules', ...name.split('/'), 'package.json');
    installed = JSON.parse(fs.readFileSync(manifest, 'utf8')).version;
  } catch {
    // Not installed: run before `npm install`, or after a failed one.
  }
  if (!declared && !installed) return 'n/a';
  if (!installed) return `${declared} (not installed)`;
  if (!declared) return installed;
  return declared === installed ? installed : `${installed} (declared ${declared})`;
}

/**
 * Backend versions, read from `uv.lock` rather than the pyproject specifiers.
 *
 * Same defect the frontend map would have: pyproject declares floors
 * (`ag2[openai,ag-ui]>=1.0.3`) while `uv sync --upgrade` resolves past them.
 * The lock names what is actually installed, which makes it the backend's
 * equivalent of reading `node_modules`.
 */
function lockedVersions(dir) {
  const locked = new Map();
  try {
    const lock = fs.readFileSync(path.join(dir, 'uv.lock'), 'utf8');
    // uv.lock is generated TOML and every entry is a [[package]] table whose
    // first two keys are name and version, in that order. A regex reads that
    // reliably and saves taking on a TOML parser for four lines of work.
    const entry = /\[\[package\]\]\s*\nname = "([^"]+)"\s*\nversion = "([^"]+)"/g;
    for (const m of lock.matchAll(entry)) locked.set(m[1], m[2]);
  } catch {
    // No lock file: `uv sync` never ran, or this backend is not Python.
  }
  return locked;
}

function backendVersions(dir) {
  const out = {};
  let pyproject;
  try {
    pyproject = fs.readFileSync(path.join(dir, 'pyproject.toml'), 'utf8');
  } catch {
    return out;
  }

  out['requires-python'] = pyproject.match(/requires-python\s*=\s*"([^"]+)"/)?.[1] || 'n/a';

  const locked = lockedVersions(dir);
  const block = pyproject.match(/^dependencies\s*=\s*\[([\s\S]*?)^\]/m)?.[1] ?? '';

  // Requiring the leading quote skips comment lines inside the array. The
  // optional group after the name drops extras — `ag2[openai,ag-ui]` is locked
  // under plain `ag2`.
  for (const m of block.matchAll(/^\s*"([A-Za-z0-9._-]+)(?:\[[^\]]*\])?\s*([^"]*)"/gm)) {
    const [, name, spec] = m;
    const declared = spec.trim();
    const installed = locked.get(name.toLowerCase());
    if (installed) {
      out[name] = declared ? `${installed} (declared ${declared})` : installed;
    } else {
      out[name] = declared ? `${declared} (not installed)` : 'n/a';
    }
  }
  return out;
}

function getPackageVersions() {
  const versions = { frontend: {}, backend: {} };
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, 'package.json'), 'utf8'));
    for (const name of FRONTEND_PACKAGES) {
      versions.frontend[name] = resolveVersion(FRONTEND_DIR, pkg, name);
    }
  } catch {
    // ignore
  }
  try {
    versions.backend = backendVersions(BACKEND_DIR);
  } catch {
    // ignore
  }
  return versions;
}

function pad(rows) {
  const width = Math.max(0, ...rows.map(([name]) => name.length));
  return rows.map(([name, version]) => `${name.padEnd(width)}  ${version}`);
}

export function writeVersionsFile() {
  const { frontend, backend } = getPackageVersions();

  const lines = [
    '# Versions in this recording',
    '',
    '# Generated after install. package.json declares RANGES; these are the',
    '# versions those ranges actually resolved to for this run.',
    '',
    '## Frontend',
    '',
    ...pad(Object.entries(frontend ?? {})),
  ];

  if (backend && Object.keys(backend).length) {
    lines.push('', '## Backend', '', ...pad(Object.entries(backend)));
  }
  lines.push('');

  fs.writeFileSync(OUT, lines.join('\n'));
  return OUT;
}

// Runnable on its own so `npm run doctor` and a bare checkout can both
// materialise the file without doing a full recording run.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`Wrote ${writeVersionsFile()}`);
}
