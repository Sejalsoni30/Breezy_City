# Requirements, Risks, and Implementation Plan
**Project**: Urban Air Quality Assistant  
**Challenge**: [Challenge 6] Hack2Skill Prompt Wars  
**Primary AQI Standard**: India CPCB (National Air Quality Index - NAQI, Oct 2014)  
**Date**: November 2026  

---

## 1. Requirements Traceability Matrix

| ID | Requirement Statement | Type | Implementation (File/Module) | Verification / Test | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OFF-01** | Challenge Name: "[Challenge 6] Urban Air Quality Assistant" | OFFICIAL | `README.md`, `client/index.html` | Visual inspection | Pending Approval |
| **OFF-02** | Submission requires a PUBLIC GitHub repository link | OFFICIAL | Git repository setup, clean history, `.gitignore`, `.env.example`, documentation | Git commit log & audit | Pending Approval |
| **BASE-01** | Stack: React + TypeScript + Vite, Tailwind CSS, Express backend proxy | BASELINE | `client/`, `server/`, `package.json` | Build & run commands | Pending Approval |
| **BASE-02** | Single commands: one command to install, dev, build, test | BASELINE | Root `package.json` scripts | `npm run test`, `npm run build` | Pending Approval |
| **BASE-03** | Real Data Only: Open-Meteo Geocoding, Air Quality, and Weather APIs | BASELINE | `server/src/services/openMeteo.ts` | Supertest + Saved Fixtures | Pending Approval |
| **BASE-04** | Data Nature Transparency: Explicitly label model-based grid data (not station readings) | BASELINE | `client/src/components/DataAttribution.tsx` | RTL / Visual check | Pending Approval |
| **BASE-05** | Save sanitized real API responses with capture date for fixtures | BASELINE | `server/test/fixtures/` | Contract tests | Pending Approval |
| **BASE-06** | India CPCB AQI Calculation: Breakpoints from Oct 2014 official document (PM2.5, PM10, NO2, SO2, CO, O3) | BASELINE | `server/src/aqi/cpcbBreakpoints.ts`, `server/src/aqi/calculator.ts` | Vitest Unit Tests (all boundaries) | Pending Approval |
| **BASE-07** | Unit conversions (µg/m³ to mg/m³ for CO, handling O3 8h, etc.) | BASELINE | `server/src/aqi/conversions.ts` | Unit tests | Pending Approval |
| **BASE-08** | CPCB Dominant pollutant & minimum valid pollutant rules (min 3 pollutants, PM10 or PM2.5 mandatory) | BASELINE | `server/src/aqi/calculator.ts` | Unit tests | Pending Approval |
| **BASE-09** | AQI edge cases: boundary values, top-end overflow, NaN/nulls, missing pollutants | BASELINE | `server/src/aqi/calculator.ts` | Unit test edge cases | Pending Approval |
| **BASE-10** | Data-State Integrity: source, observation/model time, fetch time, state badge (`Live`, `Cached`, `Forecast`, `Estimated`, `Unavailable`) | BASELINE | `client/src/components/StateBadge.tsx`, `server/src/types/` | RTL & integration tests | Pending Approval |
| **BASE-11** | Location Search: debounced autocomplete, disambiguation (region/country), cancellation, validation | BASELINE | `client/src/components/LocationSearch.tsx` | RTL unit tests | Pending Approval |
| **BASE-12** | Browser Geolocation: graceful error handling (denied, timeout, unavailable), rounded coordinates, no auto-prompt | BASELINE | `client/src/hooks/useGeolocation.ts` | RTL tests with mock navigator | Pending Approval |
| **BASE-13** | Current AQI Dashboard: AQI number, category, color + text label + icon, dominant pollutant, plain-language description | BASELINE | `client/src/components/AqiHero.tsx` | RTL component tests | Pending Approval |
| **BASE-14** | Pollutant Panel: PM2.5, PM10, O3, NO2, SO2, CO with value, unit, sub-index, category, missing status | BASELINE | `client/src/components/PollutantGrid.tsx` | RTL component tests | Pending Approval |
| **BASE-15** | Health Guidance: official CPCB health advice, vulnerable groups (children, elderly, asthma/respiratory, heart), exposure reduction tips, medical disclaimer | BASELINE | `client/src/components/HealthGuidance.tsx` | RTL tests | Pending Approval |
| **BASE-16** | Trends Panel: 24h past observed/modelled & forecast, accessible text summary (min, max, avg, trend direction) | BASELINE | `client/src/components/TrendsChart.tsx` | RTL & lazy load test | Pending Approval |
| **BASE-17** | Weather Context: Temperature, relative humidity, wind speed & direction (strictly contextual, no causal claims) | BASELINE | `client/src/components/WeatherContext.tsx` | RTL tests | Pending Approval |
| **BASE-18** | UI Resilience States: Skeletons for loading, error banners with retry, offline detection, partial data tolerance | BASELINE | `client/src/components/FeedbackStates.tsx` | RTL failure mode tests | Pending Approval |
| **BASE-19** | Accessibility (WCAG 2.1 AA): Contrast >= 4.5:1, semantic HTML, visible focus ring, keyboard navigation, aria-live, axe-core clean | BASELINE | All UI components | Playwright Axe checks | Pending Approval |
| **BASE-20** | Responsive Viewports: Verified layout at 360px, 768px, and 1280px+ without horizontal overflow | BASELINE | Tailwind responsive classes | Browser screenshots | Pending Approval |
| **BASE-21** | Security: Server-side environment variables, strict Zod input validation, rate limiting, helmet, CORS, coordinate rounding in logs | BASELINE | `server/src/middleware/`, `server/src/app.ts` | Supertest security tests | Pending Approval |
| **BASE-22** | Performance & Reliability: In-memory cache with TTL & age header, request deduplication, lazy-loaded charts, bundle audit | BASELINE | `server/src/services/cache.ts`, `client/src/App.tsx` | Supertest cache tests & build audit | Pending Approval |
| **BASE-23** | Test Coverage: Comprehensive Unit, Integration (Supertest), E2E (Playwright), Accessibility (Axe), Security tests | BASELINE | `server/test/`, `client/test/`, `e2e/` | Vitest & Playwright test runs | Pending Approval |
| **BASE-24** | Documentation: `README.md`, `ARCHITECTURE.md`, `TEST_REPORT.md`, `SECURITY_AUDIT.md`, `.env.example` | BASELINE | `README.md`, `docs/` | Manual inspection & audit | Pending Approval |
| **OPT-01** | Standard Switch: Toggle between India CPCB NAQI and US EPA AQI | OPTIONAL | `server/src/aqi/epaCalculator.ts`, `client/src/components/StandardToggle.tsx` | Unit & RTL tests | Deferred to Post-Baseline |
| **OPT-02** | Favorite Locations in `localStorage` with versioned schema and error guards | OPTIONAL | `client/src/hooks/useFavorites.ts` | RTL tests | Deferred to Post-Baseline |
| **OPT-03** | Compare Locations side-by-side | OPTIONAL | `client/src/components/LocationCompare.tsx` | RTL tests | Deferred to Post-Baseline |
| **OPT-04** | Share Location URL (Web Share API / copy link fallback) | OPTIONAL | `client/src/components/ShareButton.tsx` | RTL tests | Deferred to Post-Baseline |
| **OPT-05** | Sensitive Group Filter / User Preferences stored locally | OPTIONAL | `client/src/components/UserPreferences.tsx` | RTL tests | Deferred to Post-Baseline |

---

## 2. Assumptions

1. **Official Problem Authority**: The user confirmed that the official problem consists of Challenge Name: "[Challenge 6] Urban Air Quality Assistant" and that the submission is a public GitHub repository. All baseline requirements from the user's master brief are treated as binding working scope.
2. **Primary AQI Standard**: India CPCB (National Air Quality Index - NAQI, October 2014) is the authoritative primary calculation standard. US EPA AQI will be implemented as an optional toggle only after all mandatory baseline features pass.
3. **Data Source**: Open-Meteo Geocoding, Air Quality, and Weather APIs provide real global atmospheric data without requiring an API key. Open-Meteo data will be explicitly communicated as *Atmospheric Model Grid Estimates* rather than physical ground station measurements.
4. **Attribution**: Full Open-Meteo attribution will be visible in the application footer and README.
5. **No AI/LLM Fabrication**: All recommendations, category analyses, and trend summaries will be strictly deterministic and rule-based derived from CPCB guidelines.

---

## 3. Risks & Mitigations

| Risk Area | Specific Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **AQI Accuracy** | Discrepancy between CPCB standards and model units/intervals (e.g. CO in mg/m³, O3 8-hour averaging, PM 24-hour averaging). | High (Evaluator deduction for invalid AQI) | Pull exact breakpoint tables from official CPCB Oct 2014 document. Document formulas in code. Unit-test all boundary values, transitions, and edge cases. Calculate true moving averages from hourly arrays where possible. |
| **Data Nature Transparency** | Evaluator confusing Open-Meteo atmospheric model grid data with physical monitoring station measurements. | High | Display clear, prominent badges: "Atmospheric Model Estimate (Open-Meteo)", cite model grid limitations, and never use the words "ground station sensor". |
| **Upstream Availability & Rate Limits** | Open-Meteo temporary throttling or network latency during evaluation. | Medium | Server-side memory caching with TTL (15-30 min) keyed by rounded coordinates. In-flight request deduplication. Client retry with exponential backoff and friendly error fallbacks. |
| **Input Security & Injection** | Malicious geocoding query strings, latitude/longitude bounds overflow, prototype pollution. | High | Strict Zod validation on all query parameters (`lat`: -90 to 90, `lon`: -180 to 180, query length <= 100 chars, alphanumeric/safe chars). Reject invalid input with 400 Bad Request immediately. |
| **Accessibility Compliance** | Low color contrast on standard AQI alert colors (e.g. bright yellow or light green text), missing keyboard traps. | Medium | Never use color alone: pair every AQI level with text labels and distinct icons. Use high-contrast color variants (WCAG AA >= 4.5:1 for text). Full ARIA attributes and automated Axe testing. |
| **Public Repo Readiness** | Accidental commit of secrets or messy commit history. | High | Enforce `.gitignore` for `.env`, verify with git scans before submission, provide `.env.example`, make clean semantic commits. |

---

## 4. Implementation Plan

### 4.1 Architecture & Monorepo Layout
```
urban-air-quality-assistant/
├── package.json               # Root monorepo workspace scripts (install, dev, build, test)
├── .gitignore
├── .env.example
├── README.md
├── docs/
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── TEST_REPORT.md
│   ├── SECURITY_AUDIT.md
│   └── screenshots/
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── aqi/               # CPCB breakpoints, sub-index formulas, unit conversions
│   │   ├── services/          # Open-Meteo client, cache manager, deduplicator
│   │   ├── middleware/        # Rate limiter, Zod validators, error handler, security headers
│   │   ├── routes/            # /api/geocode, /api/air-quality, /api/weather, /api/health
│   │   ├── types/             # Shared TypeScript schemas and interfaces
│   │   └── app.ts / server.ts
│   └── test/
│       ├── fixtures/          # Sanitized real Open-Meteo API JSON captures with date
│       ├── unit/              # Breakpoints, calculations, unit conversion tests
│       └── integration/       # Supertest route tests, caching, rate limiting, security
└── client/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── src/
    │   ├── components/        # AqiHero, PollutantGrid, HealthGuidance, TrendsChart, WeatherContext, Search
    │   ├── hooks/             # useGeolocation, useAirQuality, useDebounce
    │   ├── types/
    │   ├── utils/             # Formatters, accessibility helpers
    │   └── App.tsx / main.tsx
    └── test/                  # Vitest + RTL component tests, user interactions
```

### 4.2 Data Flow & Caching
1. Client issues search or coordinates to Express API (`/api/geocode` or `/api/air-quality`).
2. Server validates coordinates (rounded to 3 decimal places for cache key, preserving privacy).
3. Server checks in-memory cache:
   - Hit: returns cached data with `state: "Cached"` and `age_seconds`.
   - Miss: in-flight request deduplication fires; calls Open-Meteo API with timeout.
4. Server calculates CPCB AQI, sub-indices, dominant pollutant, and health guidance deterministically.
5. Server stores in cache with 15-minute TTL and returns standardized JSON payload.
6. Client updates reactive state, rendering hero AQI card, pollutant breakdown, trends, and weather context.

### 4.3 Ordered Execution Roadmap
- **Phase 1: Project Scaffolding & Fixture Capture**
  - Setup root `package.json`, workspaces (`client`, `server`), TypeScript configs, ESLint.
  - Make real live calls to Open-Meteo (Delhi, London, NY) and save dated fixtures in `server/test/fixtures/`.
- **Phase 2: AQI Core Engine & Unit Testing**
  - Implement CPCB NAQI breakpoints (Oct 2014) in `server/src/aqi/cpcbBreakpoints.ts`.
  - Implement sub-index calculation, averaging logic, conversions, and dominant pollutant algorithm.
  - Write exhaustive unit tests for every boundary (0, 50, 100, 200, 300, 400, 500, overflow, nulls).
- **Phase 3: Backend API, Cache, Security & Integration Tests**
  - Build Express app with Helmet, CORS, Rate Limiting, Zod request validation, and Cache manager.
  - Implement `/api/geocode`, `/api/air-quality`, `/api/weather`, and `/api/health`.
  - Write Supertest integration tests for cache hits/misses, upstream failure handling, security fuzzing.
- **Phase 4: Frontend Development**
  - Vite + React + Tailwind setup with WCAG compliant colors.
  - Search with debounced autocomplete, Geolocation trigger with graceful denial handling.
  - Hero AQI Card with CPCB category colors, text badges, and icons.
  - Pollutant Grid with sub-indices and missing status.
  - Deterministic Health Guidance for sensitive groups and exposure reduction.
  - Trends Chart (lazy-loaded Recharts) with accessible text summary.
  - Weather context card.
  - UI resilience states (skeletons, error banner with retry, offline detector).
- **Phase 5: Verification, E2E & Accessibility Testing**
  - Client component tests with Vitest + React Testing Library.
  - Playwright E2E test suite (Search flow, Geolocation flow, Keyboard navigation, Error flow).
  - Automated Axe accessibility checks; manual keyboard walkthrough.
  - Browser verification: run dev/preview server, take screenshots at 360px, 768px, 1280px, test error/offline states.
  - Run production build and Lighthouse audit.
- **Phase 6: Optional Features (Only after baseline PASS)**
  - US EPA toggle, Favorites with `localStorage`, Location share URL.
- **Phase 7: Final Documentation & Submission Verification**
  - Generate `README.md`, `ARCHITECTURE.md`, `TEST_REPORT.md`, `SECURITY_AUDIT.md`.
  - Run evaluator scorecard and verify all checklist items pass.
