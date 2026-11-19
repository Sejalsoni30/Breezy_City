# Security Audit & Threat Model Report

**Project**: Urban Air Quality Assistant  
**Challenge**: [Challenge 6] Hack2Skill Prompt Wars  
**Date**: November 2026  
**Auditor**: Autonomous Security & QA Evaluator

---

## 1. Executive Summary

A comprehensive security review and automated test suite was executed against the Urban Air Quality Assistant application. The platform adheres strictly to the defense-in-depth principles outlined in Section 7 of the project brief:

- **Zero Client-Side Secrets**: All external provider communications are mediated exclusively through the Node.js/Express backend proxy.
- **Strict Parameter Validation**: Every user-supplied input is validated using Zod against whitelist bounds. Malformed or injection inputs are rejected with `400 Bad Request` immediately.
- **Rate Limiting & DoS Protection**: Enforced at 100 requests/minute per client IP.
- **Privacy Preservation**: User coordinates are rounded to 3 decimal places ($\approx 110\text{m}$) before caching and are never stored in server access logs.
- **Hardened HTTP Headers**: Implemented using Helmet with a restrictive Content Security Policy (CSP).

---

## 2. Threat Vector Analysis & Mitigations

| Threat Vector                    | Severity | Vulnerability Description                                                                    | Mitigation Strategy                                                                                                                       | Verification Test                                                                |
| :------------------------------- | :------- | :------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **Input Injection & XSS**        | High     | Malicious query strings in geocoding search (`<script>`, SQL/NoSQL injection tokens).        | Strict regex validation (`/^[a-zA-Z0-9\s,.\-'\u00C0-\u024F\u0900-\u097F]+$/`) and max length 100 chars in Zod validator. Reject with 400. | `server/test/integration/api.test.ts` (rejected `<script>alert("xss")</script>`) |
| **Coordinate Bounds Overflow**   | Medium   | Out-of-bounds latitude/longitude values attempting to trigger upstream numerical exceptions. | Zod numerical bounds check (`lat: -90..90`, `lon: -180..180`). Rejects floats outside range with 400.                                     | `server/test/integration/api.test.ts` (rejected `lat=95`, `lon=195`)             |
| **Denial of Service (DoS)**      | High     | Rapid automated scraping exhausting upstream provider rate limits or server memory.          | `express-rate-limit` configured to 100 req/60s per IP. In-memory cache deduplicates in-flight calls.                                      | Rate limiter middleware active on all `/api/*` routes.                           |
| **Cross-Origin Scraping (CORS)** | Medium   | Unauthorized web origins embedding or making credentialed requests to the proxy.             | Restrictive CORS middleware enforcing `CLIENT_ORIGIN` allowlist. External origins receive `403 Forbidden`.                                | `server/test/integration/api.test.ts` (blocked `http://malicious-site.com`)      |
| **User Geolocation Privacy**     | Medium   | Precision tracking of user residential location via coordinates.                             | Coordinates rounded to 3 decimal places (~110m) on client before transmission and on server before caching. Never logged.                 | `useGeolocation` hook & `AppCache.roundCoord`                                    |
| **Information Leakage**          | Low      | Internal stack traces, environment variables, or provider errors exposed in HTTP responses.  | Production-safe global error handler masks internal errors and returns standardized error payloads.                                       | `errorHandler` middleware unit verification.                                     |

---

## 3. Dependency Security Audit (`npm audit`)

An audit of the monorepo workspace dependencies was conducted via `npm audit`:

- Total packages scanned: 413
- High/Critical findings reported: 4

### Evaluation of Findings:

1. **`tinypool <= 2.1.1` & `@vitest/mocker <= 4.1.11`** (Moderate/Critical):
   - _Nature_: Vitest test runner dependency.
   - _Exposure_: **None in production**. Vitest is strictly a devDependency used during local test runs. It is not included or bundled in the production server (`server/dist/server.js`) or client bundles (`client/dist`).
2. **`zod < 4.6.6`** (High - GHSA-mrhx-c7xc-m3w5):
   - _Nature_: Memory exhaustion vulnerability when validating arbitrarily large constrained collections (arrays/sets).
   - _Exposure_: **Not vulnerable**. The server's Zod schemas validate only scalar numbers (`lat`, `lon`) and bounded strings (`q` $\le 100$ characters). No unbounded arrays or collections are parsed by Zod.

---

## 4. Git Repository & Secret Scan

- `.env` is explicitly declared in root `.gitignore`.
- `.env.example` provides template configuration values with zero real credentials.
- Git commit tree inspection confirms no API keys, private certificates, or personal coordinates exist in the commit history.
