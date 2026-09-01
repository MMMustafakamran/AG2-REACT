#!/usr/bin/env node
/**
 * Redact credentials from the server logs before they are uploaded.
 *
 * The shard artifact carries backend.log verbatim, and a dying AG-UI stream
 * prints the Authorization header it was using. The runner's own masking does
 * not reach inside an artifact, so the file is rewritten here instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { LOGS_DIR } from './lib/config.mjs';
import { redactSecrets } from './lib/redact.mjs';

let scrubbed = 0;
let files = [];
try {
  files = fs.readdirSync(LOGS_DIR).filter((f) => f.endsWith('.log'));
} catch {
  console.log('ℹ️ [Scrub] No logs directory; nothing to redact.');
  process.exit(0);
}

for (const file of files) {
  const full = path.join(LOGS_DIR, file);
  const raw = fs.readFileSync(full, 'utf8');
  const clean = redactSecrets(raw);
  if (clean !== raw) {
    fs.writeFileSync(full, clean);
    scrubbed += 1;
    console.log(`🔒 [Scrub] Redacted credentials in ${file}`);
  }
}

console.log(`✅ [Scrub] ${files.length} log(s) checked, ${scrubbed} rewritten.`);
