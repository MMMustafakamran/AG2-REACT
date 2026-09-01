/**
 * Blank out anything shaped like an API key.
 *
 * GitHub masks a secret by matching its stored value against each log line, so
 * a secret saved with a trailing newline never matches one and prints in full.
 * That is how a live key reached a run log here. Redacting on the text itself
 * does not depend on how the secret was stored -- and unlike the runner's mask,
 * it follows a log file into an uploaded artifact.
 */
export function redactSecrets(text) {
  return String(text)
    .replace(/\b(sk|rk)-[A-Za-z0-9_-]{16,}/g, '$1-***REDACTED***')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]{16,}/gi, '$1***REDACTED***');
}
