# EduScan PH

[![CodSpeed](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://app.codspeed.io/domzmojar/eduscan-ph-test?utm_source=badge)

A QR-code attendance Progressive Web App for Philippine classrooms. The full
application ships as a single self-contained `index.html` plus a service worker
(`sw.js`) and PWA manifest (`manifest.json`).

## Development

Verify the PWA build artifacts are present:

```bash
node build.js
```

## Performance benchmarks

Performance-critical pure helpers (date/term computations, name formatting, HTML
escaping, and sync key derivation) are extracted into `src/eduscan-utils.js` and
benchmarked with [Vitest](https://vitest.dev) via the
[CodSpeed](https://codspeed.io) plugin. Benchmarks live in `bench/`.

Run them locally:

```bash
npm install
npm run bench
```

Benchmarks run automatically in CI on every push and pull request, with results
tracked on [CodSpeed](https://app.codspeed.io/domzmojar/eduscan-ph-test).
