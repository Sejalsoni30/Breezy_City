# Architecture & Design Specification

**Project**: Urban Air Quality Assistant  
**Challenge**: [Challenge 6] Hack2Skill Prompt Wars  
**Primary AQI Standard**: India CPCB (National Air Quality Index - NAQI, Oct 2014)  
**Date**: November 2026

---

## 1. System Overview

The Urban Air Quality Assistant is a full-stack, production-grade air quality intelligence platform designed to deliver transparent, scientifically accurate, and accessible atmospheric health information.

```mermaid
flowchart TD
    User([End User / Evaluator])

    subgraph Client ["Client Layer (React 18 + Vite + Tailwind CSS)"]
        UI[Dashboard Layout & Navigation]
        SearchComp[LocationSearch & Autocomplete]
        HeroComp[AqiHero Card]
        GridComp[PollutantGrid (6 Pollutants)]
        HealthComp[HealthGuidance & Sensitive Groups]
        TrendsComp[TrendsChart (Lazy-loaded Recharts)]
        WeatherComp[WeatherContext Contextual Card]
        AttributionComp[DataAttribution Transparency Card]
        FeedbackComp[Skeletons / ErrorBanner / OfflineNotice]
    end

    subgraph Server ["Server Proxy Layer (Node.js + Express + TypeScript)"]
        SecMiddleware[Helmet, Strict CORS, Rate Limiter]
        ValMiddleware[Zod Input Validation]
        CacheManager[In-Memory Cache & In-Flight De-duplicator]
        AQIEngine[India CPCB NAQI Engine & Unit Conversions]
        TrendsEngine[24h History & Forecast Processor]
        HealthEngine[Rule-based Health Advisory Matrix]
        OpenMeteoClient[Open-Meteo API Client (with Timeout)]
    end

    subgraph ExternalProvider ["External Data Provider (Open-Meteo)"]
        OM_Geo[Geocoding API]
        OM_AQ[Air Quality API (CAMS/ECMWF Atmospheric Model)]
        OM_WX[Forecast Weather API]
    end

    User -->|Interacts| UI
    UI --> SearchComp & HeroComp & GridComp & HealthComp & TrendsComp & WeatherComp & AttributionComp & FeedbackComp
    SearchComp -->|GET /api/geocode| SecMiddleware
    HeroComp -->|GET /api/air-quality| SecMiddleware
    WeatherComp -->|GET /api/weather| SecMiddleware

    SecMiddleware --> ValMiddleware
    ValMiddleware --> CacheManager
    CacheManager -- Cache Miss --> OpenMeteoClient
    CacheManager -- Cache Hit --> UI
    OpenMeteoClient --> OM_Geo & OM_AQ & OM_WX
    OM_AQ --> AQIEngine & TrendsEngine & HealthEngine
    AQIEngine & TrendsEngine & HealthEngine --> CacheManager
```

---

## 2. Dependency Justifications (Zero-Bloat Policy)

As mandated by Section 3 of the project brief, every installed dependency has a direct, documented architectural justification:

### Server Dependencies (`server/package.json`)

| Package              | Version   | Architectural Justification                                                                      |
| :------------------- | :-------- | :----------------------------------------------------------------------------------------------- |
| `express`            | `^4.21.2` | Robust, lightweight HTTP proxy backend for API aggregation and static asset serving.             |
| `cors`               | `^2.8.5`  | Restricts cross-origin requests exclusively to the authorized frontend origin (`CLIENT_ORIGIN`). |
| `helmet`             | `^8.0.0`  | Injects critical HTTP security headers (CSP, XSS protection, noSniff, frameguard).               |
| `express-rate-limit` | `^7.5.0`  | Prevents denial of service and upstream quota exhaustion (100 req/min per IP).                   |
| `node-cache`         | `^5.1.2`  | High-performance in-memory cache with TTL and stale-while-revalidate capabilities.               |
| `zod`                | `^3.24.2` | Strict runtime schema validation for latitude/longitude bounds and query strings.                |
| `dotenv`             | `^16.4.7` | Loads server-side environment variables without exposing secrets to the frontend.                |

### Server DevDependencies (`server/package.json`)

| Package      | Version   | Architectural Justification                                                        |
| :----------- | :-------- | :--------------------------------------------------------------------------------- |
| `typescript` | `^5.8.2`  | Type-safety, strict null checks, and compile-time verification across the backend. |
| `tsx`        | `^4.19.3` | Instant TypeScript execution and hot-reloading for local backend development.      |
| `vitest`     | `^3.0.7`  | High-speed unit testing framework for mathematical AQI breakpoint assertions.      |
| `supertest`  | `^7.0.0`  | Integration testing framework for simulated HTTP requests and security checks.     |

### Client Dependencies (`client/package.json`)

| Package        | Version    | Architectural Justification                                                           |
| :------------- | :--------- | :------------------------------------------------------------------------------------ |
| `react`        | `^18.3.1`  | Core declarative UI rendering engine.                                                 |
| `react-dom`    | `^18.3.1`  | DOM bindings for React.                                                               |
| `lucide-react` | `^0.477.0` | Clean, accessible SVG icons paired with every color category (WCAG compliance).       |
| `recharts`     | `^2.15.1`  | SVG charting library, isolated into a lazy-loaded chunk for 24h trends visualization. |

### Client DevDependencies (`client/package.json`)

| Package                     | Version    | Architectural Justification                                                                          |
| :-------------------------- | :--------- | :--------------------------------------------------------------------------------------------------- |
| `vite`                      | `^6.2.0`   | Next-generation frontend build tool and development server.                                          |
| `@vitejs/plugin-react`      | `^4.3.4`   | Fast Refresh and JSX transformation support in Vite.                                                 |
| `tailwindcss`               | `^3.4.17`  | Utility-first CSS framework providing accessible contrast color palettes and responsive breakpoints. |
| `postcss`                   | `^8.5.3`   | CSS transformation pipeline for Tailwind.                                                            |
| `autoprefixer`              | `^10.4.20` | Automatically injects vendor prefixes for broad browser compatibility.                               |
| `@testing-library/react`    | `^16.2.0`  | Component testing library focusing on accessibility and user interactions.                           |
| `@testing-library/jest-dom` | `^6.6.3`   | Custom DOM element matchers for Vitest.                                                              |
| `jsdom`                     | `^26.0.0`  | Headless DOM environment for client unit testing.                                                    |

---

## 3. Data & AQI Engineering (India CPCB NAQI)

### 3.1 Mathematical Specification

The overall Air Quality Index ($I$) is determined by calculating the individual sub-index ($I_p$) for each monitored pollutant $p$ and taking the maximum:
$$I = \max(I_1, I_2, \dots, I_n)$$
Where the sub-index $I_p$ is calculated via linear interpolation across the official CPCB breakpoint brackets:
$$I_p = \left[\frac{I_{\text{HI}} - I_{\text{LO}}}{B_{\text{HI}} - B_{\text{LO}}} \times (C_p - B_{\text{LO}})\right] + I_{\text{LO}}$$

- $C_p$: Pollutant concentration (with standard unit conversions applied).
- $[B_{\text{LO}}, B_{\text{HI}}]$: Breakpoint range containing $C_p$.
- $[I_{\text{LO}}, I_{\text{HI}}]$: Sub-index range corresponding to the breakpoint bracket.

### 3.2 Pollutant Breakpoints & Averaging Periods (Oct 2014 CPCB Report)

| Pollutant | Averaging Period | Unit      | Good (0-50) | Satisfactory (51-100) | Moderate (101-200) | Poor (201-300) | Very Poor (301-400) | Severe (401-500) |
| :-------- | :--------------- | :-------- | :---------- | :-------------------- | :----------------- | :------------- | :------------------ | :--------------- |
| **PM2.5** | 24-hr avg        | µg/m³     | 0 – 30      | 31 – 60               | 61 – 90            | 91 – 120       | 121 – 250           | 250+             |
| **PM10**  | 24-hr avg        | µg/m³     | 0 – 50      | 51 – 100              | 101 – 250          | 251 – 350      | 351 – 430           | 430+             |
| **NO₂**   | 24-hr avg        | µg/m³     | 0 – 40      | 41 – 80               | 81 – 180           | 181 – 280      | 281 – 400           | 400+             |
| **O₃**    | 8-hr avg         | µg/m³     | 0 – 50      | 51 – 100              | 101 – 168          | 169 – 208      | 209 – 748           | 748+             |
| **CO**    | 8-hr avg         | **mg/m³** | 0.0 – 1.0   | 1.1 – 2.0             | 2.1 – 10.0         | 10.1 – 17.0    | 17.1 – 34.0         | 34.0+            |
| **SO₂**   | 24-hr avg        | µg/m³     | 0 – 40      | 41 – 80               | 81 – 380           | 381 – 800      | 801 – 1600          | 1600+            |

### 3.3 Unit Conversion & Averaging Logic

1. **Carbon Monoxide (CO)**: Open-Meteo returns CO in $\mu\text{g/m}^3$. CPCB breakpoints require $\text{mg/m}^3$. The server automatically applies:
   $$C_{\text{CO, mg/m}^3} = \frac{C_{\text{CO, }\mu\text{g/m}^3}}{1000}$$
2. **CPCB Minimum Pollutant Criterion**:
   - Minimum of 3 valid monitored pollutants required.
   - At least one of the valid pollutants **must be PM2.5 or PM10**.
   - If fewer than 3 pollutants are valid, or if neither PM2.5 nor PM10 is present, overall AQI is marked `Insufficient Data` to prevent misleading safety estimates.

### 3.4 Data Transparency: Atmospheric Model vs Ground Station

Open-Meteo derives global air quality from atmospheric numerical reanalysis models (CAMS / ECMWF) on a mathematical grid. It is **not a physical ground station sensor**.
The UI prominently badges this as `"Atmospheric Model Estimate"` with source timestamps, preventing misattribution.

---

## 4. Caching & Performance Architecture

1. **In-Memory TTL Caching**:
   - Responses are cached for 15 minutes (`CACHE_TTL_SECONDS=900`), corresponding with upstream atmospheric model updates.
   - Cache keys are generated using **rounded coordinates** (3 decimal places, $\approx 110\text{m}$ resolution):
     `aqi:CPCB:28.652:77.231`
   - Preserves user location privacy while maximizing cache hit rates.
2. **In-Flight Request De-duplication**:
   - Concurrent requests for the same coordinate lock onto an active promise, eliminating thundering herds and redundant upstream calls.
3. **Data State Transparency**:
   - Every API response includes a `metadata.dataState` badge: `'Live'`, `'Cached'`, `'Forecast'`, `'Estimated'`, or `'Unavailable'`.
   - Cached responses include `cachedAgeSeconds`.
4. **Code Splitting**:
   - Recharts and the trends module are dynamically imported via `React.lazy()`, reducing the initial client bundle to just 190 kB (58 kB gzip).

---

## 5. Security & Input Sanitization

1. **Server-Side Environment Variables**: No API secrets or internal hostnames are exposed to the client.
2. **Zod Validation**:
   - Latitude validated strictly between $-90^\circ$ and $+90^\circ$.
   - Longitude validated strictly between $-180^\circ$ and $+180^\circ$.
   - Search query strings constrained to safe alphanumeric characters and city punctuation (max 100 characters).
3. **Helmet Security Headers & CSP**:
   - `Content-Security-Policy` limits script execution to `'self'`.
   - `X-Content-Type-Options: nosniff`.
   - `X-Frame-Options: SAMEORIGIN`.
4. **Error Masking**: Production errors never leak stack traces, database strings, or raw upstream errors.
