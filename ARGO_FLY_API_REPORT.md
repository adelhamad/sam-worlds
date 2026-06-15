# Argo-Fly B2B — API Extraction Feasibility Report

**Target:** `https://b2b.argo-fly.com/login`
**Goal:** Determine whether the platform's APIs can be extracted to build automations (booking, search, ticketing, reporting).
**Date:** 2026-06-15
**Status:** Feasibility assessment — no live API was captured (see "Limitations").

---

## 1. TL;DR

| Question | Answer |
|---|---|
| Does the site use an extractable backend API? | **Almost certainly yes.** The front end is a client-rendered single-page app (SPA), which by definition talks to a backend over HTTP. |
| Can you extract/document it yourself? | **Yes — you are authorized** (you hold valid demo credentials). The right method is capturing your *own* browser session traffic, not breaking in. |
| Is there a public/official API? | **None found.** No published docs, no `swagger`/OpenAPI at common paths (returned 404), no developer portal indexed. |
| Recommended path | **Ask Argo-Fly for official API access first.** Fall back to documenting the private web API only if they decline and their terms allow it. |
| Effort to reverse-engineer the web API | **Medium.** Auth + session handling is the hard part; the search/booking calls themselves are usually plain JSON. |

---

## 2. What I was able to observe

- `https://b2b.argo-fly.com/login` and `/` return only a thin HTML navigation shell (logo image `/navback.png`, links to `/login`, `/about-us`, `/signup`). All real content is rendered client-side → **this is a Single-Page Application** (React/Vue/Angular-class app).
- No API documentation is publicly exposed. `https://b2b.argo-fly.com/swagger/index.html` → **HTTP 404**.
- No public information about an Argo-Fly developer API, SDK, or integration guide is indexed on the web.

**Implication:** Because it's an SPA, every screen you see after login (flight search, fare quote, PNR/booking, ticket issue, balance/reports) is driven by background HTTP calls — typically JSON/REST, sometimes XML/SOAP for GDS-style travel backends. Those calls **are** the API. They can be discovered, documented, and replayed.

---

## 3. Limitations of this assessment (important)

I could **not** capture the live API from this environment because:

1. My fetch tooling cannot execute JavaScript, so it only sees the empty SPA shell.
2. It cannot perform an interactive login, so it never reaches the authenticated calls where the real API lives.
3. The environment has restricted outbound network access.

So this report tells you **how to extract the API and what to expect**, not the final endpoint list. The actual capture must be done in a real browser logged in with your demo account (steps in §5).

---

## 4. Is extraction legitimate? (read before proceeding)

Building automation against a B2B platform **you have an account on** is normal industry practice. To keep it clean:

- ✅ You have authorized credentials (DEMO / Agent Code `2L24TDEMO`). Capturing your *own* session's traffic is allowed inspection of your own data flow.
- ⚠️ **Check the Terms of Service / agent agreement.** Many B2B travel platforms restrict automated access, scraping, or non-UI use of their endpoints. Reverse-engineering the private web API may breach those terms even with valid login.
- ⭐ **Best practice:** email Argo-Fly / Fly Sham and request **official API access + docs and a sandbox/test agent code**. GDS aggregators almost always have a partner API. An official contract gives you: a stable contract, higher rate limits, support, and no ToS risk — versus a private web API that can break without notice.
- 🚫 Do **not** load-test, brute-force, scrape inventory at volume, or share the demo credentials. Keep automation to the booking volume your agreement permits.

**Recommendation: pursue the official API in parallel with the capture below. Use the captured private API only as a stopgap or if no official API exists.**

---

## 5. How to extract the API (method)

You run this in a normal browser with the demo login. ~30–60 min for a first pass.

### Step A — Capture with browser DevTools
1. Open Chrome/Edge → `F12` → **Network** tab → enable **Preserve log** → filter to **Fetch/XHR**.
2. Log in at `https://b2b.argo-fly.com/login` (DEMO / DEMO8585 / Agent Code `2L24TDEMO`).
3. Perform each workflow you want to automate, one at a time: flight search → select fare → create booking → issue ticket → view balance/reports.
4. For each XHR/fetch request, record from the **Headers / Payload / Response** panes:
   - Request **URL** + method (GET/POST)
   - **Auth** mechanism — look for `Authorization: Bearer …`, a session cookie, a CSRF/XSRF token header, or an agent/token field in the body
   - Request **payload** (JSON/XML shape)
   - **Response** body shape
5. Right-click the request list → **Save all as HAR** → this `.har` file is a complete machine-readable record of every call.

### Step B — Reproduce a single call
- In DevTools, right-click the key request → **Copy → Copy as cURL** (or "Copy as fetch"). Paste into a terminal/Postman and confirm it returns the same data outside the browser. This proves the call is replayable programmatically.

### Step C — Optional deeper capture
- **Postman / Insomnia** — import the HAR, turn calls into a reusable collection, parameterize auth.
- **mitmproxy / Charles / Fiddler** — system proxy that captures everything including non-DevTools traffic; good for confirming token refresh and any mobile endpoints.

### Step D — Map the auth flow (the hard part)
Most automation effort goes here. Identify:
- How login returns a token/session (response of the login POST).
- Whether the token is a cookie or a header value, and its **expiry / refresh** mechanism.
- Whether the **Agent Code** is sent per-request or only at login.
- Any anti-automation: CSRF tokens, `nonce`, request signing, captcha, IP/device binding, rate limits.

---

## 6. Endpoints to expect (typical B2B flight platform)

You'll likely find calls resembling these — confirm exact paths during capture:

| Capability | Typical call |
|---|---|
| Authentication | `POST /api/auth/login` → returns token/session + agent context |
| Token refresh | `POST /api/auth/refresh` |
| Flight search | `POST /api/flights/search` (origin, dest, dates, pax, cabin) |
| Fare rules / revalidate | `POST /api/flights/fare-rules` / `/revalidate` |
| Create booking / PNR | `POST /api/booking/create` |
| Issue / ticket | `POST /api/booking/{id}/issue` |
| Retrieve / list bookings | `GET /api/booking/{id}`, `GET /api/bookings` |
| Cancel / void | `POST /api/booking/{id}/cancel` |
| Agent balance / ledger | `GET /api/account/balance`, `/api/account/transactions` |

(Travel/GDS backends sometimes use XML/SOAP instead of JSON — same capture method applies.)

---

## 7. Automation feasibility by use case

| Use case | Feasibility | Notes |
|---|---|---|
| Automated fare/price monitoring | High | Search endpoint is usually simple JSON; watch rate limits & ToS on polling. |
| Auto-booking / issuing on rules | Medium | Needs reliable auth refresh + idempotency + error handling; money is involved, so build guardrails. |
| Reporting / reconciliation export | High | Balance/transaction endpoints are typically clean reads — lowest risk first project. |
| Reselling inventory to your own site | Medium–High | Most exposed to ToS; **must** be covered by an agreement / official API. |

**Suggested first automation:** read-only **reporting/balance sync** — lowest risk, proves the auth + capture pipeline, no booking-money exposure.

---

## 8. Recommended next steps

1. **Email Argo-Fly / Fly Sham** asking for official API documentation, a sandbox, and the integration terms. (Best long-term path.)
2. **In parallel**, do a DevTools/HAR capture (§5) of the 3–4 workflows you care about and save the `.har`.
3. Send me (or commit) the **sanitized HAR** — credentials/tokens redacted — and I'll turn it into a documented endpoint reference + a typed API client + a first automation script.
4. Decide architecture: a thin client library wrapping the captured endpoints, with a central auth/session manager and a config-driven agent profile.

---

## 9. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| ToS / agent-agreement breach | High | Get written OK or official API before going live. |
| Private API changes without notice | Medium | Centralize endpoints in one client module; add contract tests; prefer official API. |
| Auth/session expiry breaks jobs | Medium | Robust token-refresh + retry/backoff. |
| Booking errors cost real money | High | Idempotency keys, dry-run mode, confirmation gates, start read-only. |
| Anti-bot (captcha/signing/rate limit) | Medium | Detect during capture; respect limits; official API removes this. |
| Credential leakage | High | Never commit creds/tokens/HAR with secrets; use a secrets store. |

---

## Appendix — Observations log

- `GET https://b2b.argo-fly.com/login` → SPA shell only (no inline API refs visible without JS execution).
- `GET https://b2b.argo-fly.com/` → same SPA shell.
- `GET https://b2b.argo-fly.com/swagger/index.html` → **404** (no public OpenAPI at this path; try `/swagger`, `/api-docs`, `/openapi.json` during your authenticated session).
- Web search → no public Argo-Fly developer/API documentation found.
