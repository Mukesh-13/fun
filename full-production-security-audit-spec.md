# Full Production Security, Authentication & Content-Exposure Audit

**Type:** Standing audit specification
**Scope:** Entire codebase — application, routing, middleware, server, API, database, storage, build, framework, and deployment layers
**Status:** Active requirement — applies to current codebase and all future additions (see §30)

---

## Core Security Requirement

> Nothing in this application should be publicly accessible except the login page and the minimum infrastructure absolutely required to render and authenticate that login page.

Do not assume that hiding UI elements, adding client-side route guards, or relying on frontend redirects provides security. Security must be audited and enforced at the **server, middleware, routing, API, database, storage, build, framework, and deployment layers**.

The goal is to identify every possible path through which an unauthenticated or unauthorized user could **access, discover, download, infer, enumerate, or interact with** any protected application resource.

---

## 1. Security Objective

The application is a fully private application. The required security model:

- An unauthenticated visitor can access **only** the login/authentication entry point.
- No unauthenticated visitor may access, via any mechanism whatsoever:
  - Any application page (root, nested, or dynamic route)
  - Any protected route, API endpoint, server action, or RPC endpoint
  - Any data endpoint, downloadable file, document, image, video/audio asset, or generated file
  - Any static file containing application content, source/config artifact, internal JSON, or metadata endpoint
  - Any sitemap or manifest revealing protected application information
  - Any alternate file format
  - Any route reached through: query parameters, URL manipulation, non-GET HTTP methods, redirects, prefetching, browser caching, framework-internal endpoints, SSR/RSC/streaming, service workers, source maps, or CDN/cache behavior
  - Any public storage object, database endpoint, or backend endpoint
  - Any content exposed indirectly through an otherwise public page
- Authorization must be enforced **server-side**, never merely in client-side code.
- Authentication and authorization must be enforced **before** protected content is rendered, fetched, streamed, prefetched, cached, or returned.
- A user must never receive protected content first and then be redirected away — no flash, partial render, hydration leak, SSR leak, API leak, or prefetch leak before authentication is established.
- If a user is authenticated but not authorized, they must receive **no** protected application content.
- Logout / session expiration / revocation must immediately prevent further protected access.

---

## 2. Full Codebase Audit Scope

Read and understand the entire repository — do not perform a superficial review, and do not skip files merely because they appear unrelated to authentication. Includes:

Application source · routing · middleware · server code · API routes · server actions · components · layouts · pages · loading states · error pages · not-found pages · authentication logic · authorization logic · database access · Supabase integration · storage integration · configuration · build configuration · framework configuration · environment handling · static/public directories · generated assets · service workers · web workers · scripts · package configuration · dependency configuration · deployment configuration · CI/CD configuration · Docker configuration (if present) · reverse-proxy configuration (if present) · CDN configuration (if present) · documentation that could expose operational/security information · source maps · manifest files · robots/sitemap configuration · any miscellaneous files servable by the production server.

---

## 3. Complete Attack Surface Inventory

Before proposing fixes, enumerate every:

- Public, protected, dynamic, catch-all, API, internal, authentication, error, metadata, health-check, framework-generated, static, file-serving, download, and redirect route.

For **every** route (not representative examples), determine exactly what happens when requested:

- Logged out
- Logged in
- Authenticated but unauthorized
- Session expired
- Invalid session
- Tampered session
- Invalid token / missing token / malformed token
- User attempting another user's resource

Produce a route-access matrix, e.g.:

| Route | Anonymous | Authenticated | Authorized | Server-enforced | Potential leak |
|---|---|---|---|---|---|
| `/login` | ALLOW | ALLOW/REDIRECT | N/A | YES | NONE |
| `/dashboard` | DENY | ALLOW | YES | YES | NONE |
| `/api/...` | DENY | ALLOW | YES | YES | NONE |

---

## 4. Authentication Audit

Determine exactly how authentication works. Audit: Supabase Auth configuration · session handling · cookies · access/refresh tokens · JWT validation, expiration, and refresh · session persistence and invalidation · logout · password authentication · OAuth · magic links · email verification · MFA · password reset · account recovery · invite flows · session fixation risks · token leakage/storage/client-side exposure · server-side session validation · middleware, server-component, and API authentication.

Determine whether the application ever trusts:

- Client-provided user IDs, roles, permissions, or authorization claims
- Client-side state, LocalStorage, or SessionStorage values
- URL parameters
- Cookies that are not cryptographically verified
- JWT payloads without proper signature verification

**Any such trust boundary must be treated as a security issue.**

---

## 5. Authorization Audit

Authentication alone is not sufficient. For every protected resource, answer: *who is allowed to access this, and where is that decision enforced?*

Audit: user-level authorization · RBAC · permission checks · resource ownership · tenant isolation · admin/internal routes · database authorization · Supabase RLS · storage policies · API authorization · server actions · RPC functions · direct database queries.

Pay particular attention to **IDOR/BOLA** vulnerabilities. Test conceptually:

```
/api/users/USER_A  →  replace with USER_B
/documents/123     →  change to 124
?user_id=another-user
?file_id=another-user-file
```

Authorization must be based on the **authenticated server-side identity and policy**, never on identifiers supplied by the client.

---

## 6. Supabase Security Audit

Inspect: `auth.users` · public/private schema tables · views · materialized views · functions · RPC functions · triggers · foreign keys · RLS policies · storage buckets/policies · database grants · service-role usage · anon-key usage · server-only secrets · client-exposed environment variables · JWT claims · auth hooks · Edge Functions.

### RLS
Verify every application data table exposed to a client-capable role has RLS enabled. **"The frontend checks ownership" is not sufficient** — the database must enforce authorization independently of the frontend.

Audit every policy for: SELECT / INSERT / UPDATE / DELETE / UPDATE-with-ownership-change / INSERT-with-forged-ownership / cross-user access / cross-tenant access / privilege escalation.

Check whether users can manipulate fields such as `user_id`, `owner_id`, `tenant_id`, `role`, `is_admin`, `permissions`, `status` to obtain unauthorized access.

---

## 7. Supabase Storage Audit

For every bucket determine:

- Is it public? Can anonymous users list or read objects?
- Can authenticated users access other users' objects?
- Can users guess object paths, upload arbitrary files, overwrite, or delete files?
- Are signed URLs used, how long are they valid, and can they be generated without authorization?
- Are object paths predictable? Do storage policies enforce ownership?

**Requirement:** no protected application content may be retrievable from Supabase Storage by an unauthenticated user or unauthorized authenticated user. Prefer private buckets with server-authorized access and short-lived, appropriately scoped signed URLs.

---

## 8. Static/Public Asset Audit

Inspect `/public`, `/static`, `/assets`, `/uploads`, `/downloads`, and framework-generated static output. Determine whether any protected content is physically located where the production web server/CDN will serve it without authentication.

> A route guard does not protect `/public/private-document.pdf` if the server serves `/private-document.pdf` directly.

Protected content must not be placed in publicly served static directories. If files must be downloadable, implement an authenticated server-side download mechanism that validates auth, resolves the resource server-side, prevents path traversal and unauthorized object access, and uses appropriate cache controls.

---

## 9. First-Load / SSR / Hydration Leak Audit

Verify an unauthenticated request to a protected route never receives protected HTML or data before redirecting. Check: SSR · Server Components · RSC · streaming · Suspense · nested layouts · loaders · server-side data fetching · prefetching · hydration payloads · RSC payloads · JSON responses · initial page state · embedded serialized data.

**Unacceptable:** render protected page → fetch protected data → client determines logged out → redirect.

**Required:** request → authenticate → authorize → *only then* render/fetch protected content.

---

## 10. Middleware / Route Protection Audit

Determine: matched/excluded routes and whether exclusions accidentally expose content · coverage of nested routes, API routes, file routes, framework-generated routes · whether malformed paths, URL encoding, case variations, trailing-slash variants, alternate HTTP methods, query parameters, or redirects bypass it.

Test conceptual bypasses: `/protected`, `/protected/`, `/PROTECTED`, `//protected`, `/%70rotected`, `/protected?x=1`, `/protected#anything`, and framework-specific variations.

Middleware alone is not sufficient — protected server resources must also validate authentication/authorization at their actual trust boundary.

---

## 11. API / Endpoint Security Audit

For each endpoint verify: authentication/authorization required · correct HTTP methods · input validation · output filtering · rate limiting · CSRF protection · CORS policy · error handling · information disclosure · SQL/command injection · SSRF · path traversal · file-upload security · object-level authorization · mass assignment · parameter tampering · replay risks · excessive data exposure.

No API should be accidentally public merely because the frontend doesn't link to it.

---

## 12. HTTP / Browser Security

Investigate and configure based on actual application architecture (not generic defaults): `Content-Security-Policy` · `Strict-Transport-Security` · `X-Content-Type-Options` · `Referrer-Policy` · `Permissions-Policy` · `frame-ancestors` · `X-Frame-Options` · `Cache-Control` · cookie security attributes (`Secure`, `HttpOnly`, `SameSite`) on authentication cookies.

---

## 13. Caching / CDN Security

A protected response must never become available to another user or anonymous visitor via a shared cache. Audit browser cache · CDN cache · reverse proxy · framework cache · server-side cache · ISR · static generation · route/API/prefetch caching. Pay particular attention to `Cache-Control`, `Vary`, `Authorization`, `Cookie`, and framework-specific caching semantics.

---

## 14. Metadata / SEO / Discovery Audit

Verify the app does not expose information via `robots.txt`, `sitemap.xml`, web manifests, OpenGraph/Twitter metadata, structured data, public page titles/route names, error pages, search engine indexing/caches, or link previews. **Do not treat `robots.txt` as an access-control mechanism.**

---

## 15. Error / Debug / Development Leakage

Audit 404/500 pages, error boundaries, stack traces, debug/development/test/playground routes, Swagger/OpenAPI endpoints, GraphQL introspection, health endpoints, diagnostics, logging endpoints, source maps, debug environment variables.

Production must never expose: stack traces, source code, environment variables, database credentials, Supabase service-role keys, internal URLs, infrastructure details, or user information.

---

## 16. Environment / Production Configuration

The application must be production-secure **by default**. Development behavior must only activate through explicit development environment configuration (e.g. `NODE_ENV=development`) — production security must never depend on a variable being manually set correctly.

Avoid insecure defaults such as `if (!NODE_ENV) assume development` or `if (NODE_ENV !== "production") disable security`. Production must be the fail-closed/default behavior; if essential security configuration is missing in production, the application should fail closed.

---

## 17. Secrets Audit

Search the entire repository for API keys, service-role keys, JWT secrets, database passwords, private tokens, OAuth secrets, signing keys, encryption keys, credentials. Determine whether anything sensitive is hardcoded, bundled into frontend JS, included in public env vars, logged, returned through APIs, exposed through errors, or included in source maps.

**`SUPABASE_SERVICE_ROLE_KEY` must never be exposed to browser/client code.**

---

## 18. Dependency / Supply-Chain Audit

Audit `package.json`, lockfiles, direct dependencies, known-vulnerable/deprecated/dangerous/unnecessary packages, dependency scripts, build scripts, postinstall scripts. Do not recommend arbitrary upgrades without understanding compatibility and security impact.

---

## 19. Authentication State Race Conditions

Look for race conditions in login, logout, token refresh, session expiration, multiple tabs, concurrent requests, navigation during refresh, expired JWTs, stale client state. Protected requests must never accidentally execute using stale or invalid authentication state.

---

## 20. Authorization Fail-Closed Requirement

> If authentication or authorization cannot be positively established, deny access.

Never: auth check failed → assume authenticated. Never: authorization lookup failed → allow access. Never: DB/RLS check failed → return data anyway. Never: session unavailable → treat as guest with protected content. Security-sensitive failures must **fail closed**.

---

## 21. Attack-Path Analysis

After the static audit, reason through realistic attack paths for:

- **Anonymous attacker** — route discovery, protected page/file/API access, direct Supabase/DB/storage access, ID enumeration, middleware bypass, alternate HTTP methods, redirect/cache/SSR/RSC/source-map exploitation, generated assets, metadata, error responses.
- **Authenticated but unauthorized attacker** — access/modify another user's data, download another user's files, change ownership, escalate roles, invoke admin functions, manipulate IDs, bypass UI restrictions, call APIs or Supabase directly.
- **Compromised/expired session** — can stale sessions continue accessing resources?
- **Malicious client** — assume the browser is completely hostile and can modify JS, LocalStorage, SessionStorage, cookies where possible, requests, responses, URL params, headers, form fields, API payloads. The server must remain secure regardless.

---

## 22. No Placeholder Fixes

Do not recommend generic solutions ("add authentication middleware," "check if logged in," "hide the route," "use RLS," etc.) without specifics. Instead, for each finding:

1. Identify the exact vulnerable implementation.
2. Explain why it is vulnerable and the exact attack path.
3. Identify the correct trust boundary.
4. Provide the production-grade architectural fix.
5. Implement the fix where possible.
6. Verify the fix covers all equivalent paths.
7. Search the repository again for related vulnerable patterns.

---

## 23. Architectural Security Over UI Security

Assume all client-side code is compromised. Required model:

```
Internet → TLS/Edge → Authentication enforcement → Authorization enforcement
   → Protected application → Database RLS / server authorization → Protected storage
```

**Not acceptable:** `Internet → Public application → React checks auth → Redirect`

---

## 24. Full Architectural Restructuring (Authorized)

If the current architecture cannot reliably guarantee the stated requirements, do not preserve it for convenience. Restructuring is explicitly authorized for: routing, middleware, server/client boundary, API, database, Supabase schema, RLS, storage, authentication, authorization, framework, rendering strategy, deployment, CDN, reverse-proxy, or stack changes. **Security takes priority over minimizing code changes.**

---

## 25. Production Security Standard

Evaluate against: OWASP ASVS · OWASP Top 10 · OWASP API Security Top 10 · Zero Trust principles · least privilege · defense in depth · secure-by-default · fail-closed authorization · server/database-enforced authorization · secure session management · secure storage access. Do not claim "100% secure" from a checklist alone — explain residual risk and what can/cannot realistically be guaranteed.

---

## 26. Required Final Deliverable

**A. Executive Security Assessment** — overall rating: CRITICAL / HIGH RISK / MEDIUM RISK / LOW RISK / PRODUCTION READY (only if evidence supports it).

**B. Complete Attack Surface** — every route, endpoint, asset surface, storage surface, database surface, authentication surface discovered.

**C. Vulnerabilities** — for each: severity, location/file, exact code/architecture involved, attack scenario, why it fails, impact, recommended production-grade solution, mandatory or not, requires architectural change or not.

**D. Authentication Assessment**
**E. Authorization Assessment**
**F. Supabase Assessment** — Auth, RLS, Storage, Database, RPC, API, Keys, Policies
**G. Route Security Matrix** — complete, route-by-route
**H. Static Asset Exposure** — every potentially publicly reachable asset and whether it must be moved/protected
**I. API Security Matrix** — every endpoint and its auth/authorization requirements
**J. Production Configuration Assessment**
**K. Recommended Target Architecture** — if inadequate, the architecture for a production MNC-grade private application

**L. Remediation Plan** — prioritized:
- P0 — Must fix before deployment
- P1 — Must fix immediately after P0
- P2 — Strong hardening
- P3 — Optional defense-in-depth

**M. Verification Plan** — after remediation, re-audit and verify: anonymous access, authenticated access, unauthorized access, cross-user access, direct API/file/Supabase access, route manipulation, cache behavior, SSR/RSC behavior, error behavior, logout behavior, expired session behavior.

---

## 27. Implementation Requirement

If able to modify the repository, do not merely report vulnerabilities — implement the fixes. After implementation:

- Run existing tests, lint/type checks, and a production build.
- Inspect the production build.
- Search for remaining public assets, unprotected routes, and client-side use of server-only secrets.
- Audit RLS and storage policies; re-check middleware, server-side authorization, caching, and error handling.
- Re-run the security audit against the modified architecture.

If a test cannot be performed because required infrastructure is unavailable, state that explicitly rather than claiming it passed.

---

## 28. Critical Acceptance Criteria

**Anonymous user:**
- `GET /` → login page only
- `GET /any-protected-route` → denied/redirected before protected content is generated
- `GET /any-api-endpoint` → unauthorized
- `GET /any-protected-file` / `/any-protected-storage-object` → unauthorized
- Direct DB access using public client credentials → only explicitly RLS-authorized data
- Direct ID manipulation → no unauthorized access

**Authenticated authorized user:** login → authenticated session → authorization verified → protected application accessible

**Authenticated unauthorized user:** authenticated → authorization fails → no protected application content

**Expired/revoked session:** protected requests denied

**Direct URL access (unauthenticated):** no protected HTML, JSON, RSC payload, file, or API response

**Client compromise:** even with attacker-controlled browser (modified frontend, forged requests, manipulated IDs/payloads, direct API calls) — protected backend remains secure

---

## 29. Most Important Rule

Do not optimize for preserving the current implementation. Optimize for:

> An unauthenticated or unauthorized party must have no practical path to obtain protected application content — regardless of whether they bypass the UI, manipulate URLs, call APIs directly, inspect network requests, modify browser state, access static files, query Supabase directly, manipulate object IDs, exploit caching, or invoke framework-generated endpoints.

If achieving this requires a significant rewrite, recommend and implement the rewrite. Do not declare the application secure based solely on frontend route guards or redirects. Perform the audit as if this application were going through a serious enterprise/MNC security review and an external penetration test immediately before production deployment.

---

## 30. Standing Requirement: Secure-by-Default for All Future Additions

This project will continue to grow — new pages, routes, API endpoints, server actions, storage objects, and features will be added over time. This audit's security model is not a one-time pass; it is the **permanent baseline standard** for the project going forward.

Accordingly:

- **Every new page, route, nested route, dynamic route, API endpoint, server action, RPC endpoint, or storage object added to this project must be private and protected by default**, following the exact same trust model established in this document (§1, §23) — unless it is explicitly and deliberately designated public, following the same scrutiny applied to the current login page in this audit.
- No new route, endpoint, or asset should ever be assumed safe merely because it is new, small, temporary, internal-only in intent, or not yet linked from the UI. "Not linked" is not "not accessible" (§11).
- Authentication and authorization enforcement must be added at the server/middleware/database trust boundary **as part of building the feature**, not as a follow-up hardening pass.
- Any new Supabase table, view, function, or storage bucket must ship with RLS/storage policies enforcing ownership and access control from the moment it is created — never added later "once it's needed" (§6, §7).
- Any new caching, prefetching, SSR/RSC, or static-generation behavior introduced for new pages must be checked against §9 and §13 before shipping — protected content must never be cacheable or servable pre-authentication.
- This file should be treated as a living checklist: each future audit or review of newly added functionality should be evaluated against §1–§29 in full, not just spot-checked.

**The default state of anything new in this codebase is private. Public accessibility is the exception, and it must be an explicit, deliberate, and documented decision — never the default.**
