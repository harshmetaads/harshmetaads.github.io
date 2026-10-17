# Agent notes

## What this project is
A static website: `index.html`, `ai-employee.html`, `ai-employee-pipeline.html` plus
`assets/`. No build step, no package manager, no backend and no database — the HTML
files link their assets by relative path and all three pages are self-contained
client-side demos. Hosted on GitHub Pages in production (see `README.md`).

## Running it here
```
docker compose -f docker-compose.base44.yml up -d   # http://localhost:3000
docker compose -f docker-compose.base44.yml logs -f web
```
`web` is plain `nginx:alpine` with the repo bind-mounted as the document root, so
editing a file in the repo is visible on the next page load — no rebuild, no dev
server to restart. `nginx.base44.conf` only adds `no-store` caching; nothing in the
repo is modified to run in the sandbox. There are no secrets or external services.

## Things that are easy to get wrong
- **`ai-employee.html` and `ai-employee-pipeline.html` contain an anti-framing
  script** (`if (top !== self) { documentElement.style.display = 'none'; top.location = self.location }`).
  It is deliberate clickjacking protection, so inside an embedded preview frame
  those two pages blank themselves out. `index.html` has no such script and previews
  normally. The sub-pages work when opened directly (own tab / the 3000-… URL).
- Each page carries a `Content-Security-Policy` **meta tag**. `index.html` allows
  only external `fonts.googleapis.com` / `fonts.gstatic.com`; the two sub-pages pin
  inline scripts with `sha256-…` hashes, so **editing an inline script on those pages
  breaks its CSP hash and the script silently stops running**. Update the hash in the
  meta tag whenever you touch `<script>` content there.
- `/ai-employee.html` is served as a real file path — there is no clean-URL routing.

## Base44 preview override (sandbox only)
`BASE44_PREVIEW_MODE` is passed into the `web` service and compared to `"1"` in its
command. When it equals `"1"`, `nginx.base44.preview.conf` is copied into
`/etc/nginx/conf.d/`, which neutralises the pages' CSP meta tag in the served HTML
and replaces it with a response-header policy extended for Base44's preview bridge
(`https://app.base44.com` plus `'unsafe-inline'` for its inline bootstrap). Without
this the preview panel never goes live: the repo's strict `script-src 'self'` blocks
the injected bridge script. When the variable is unset or any other value, that file
is not loaded and the repo's own CSP is served byte-for-byte. Only the sandbox nginx
config does this — no file in the repo is modified, and the GitHub Pages deployment
keeps its strict policy.

## Verifying a change
No test suite. Curl the entry point and confirm the served bytes are the working-copy
source (unhashed names, live edits) rather than a prebuilt bundle:
```
curl -s http://localhost:3000/ | head
curl -sI http://localhost:3000/ai-employee-pipeline.html
```
