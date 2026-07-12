# bilibili-client fleet worklog

Repo: /Users/sethburkart/Downloads/bilibili-client (main @ 9ca6f27 = scaffold: frozen
packages/types contract, vendored FastStream, PLAN.md + docs/). Scratch: this dir (orch/).

## Conflict map / lanes
Disjoint by directory; NO lane edits packages/types (frozen contract), root configs, docs/.
- fleet/api        packages/bilibili-api   codex (network live-test vs BV1p94y1z7jX + CDN Referer probe)
- fleet/translator packages/translator     cursor
- fleet/player     packages/player (+minimal vendor/faststream build fixes allowed, documented)  cursor
- fleet/app        apps/desktop            cursor (mocks only; services/index.ts is the swap point)

Worktrees at .claude/worktrees/<lane>, branches fleet/<lane>. bun.lock gitignored during fleet.

## Merge order (smallest blast radius first)
translator -> player -> api -> app; combined typecheck+tests on main after each.
Then INTEGRATION slice on main: swap mock -> real services in apps/desktop, copy
packages/player dist into renderer public/player, e2e headed run vs BV1p94y1z7jX.

## Review policy (user: light review, no megafix)
Orchestrator gates per lane: tsc --noEmit, bun test, lane acceptance (live-test for api,
build-player+demo 200s for player, build for app), risky-diff read. One light codex read-only
review at integration only if warranted.

## Status
- [ ] api lane (codex) launched
- [ ] translator lane launched
- [ ] player lane launched
- [ ] app lane launched

## Incidents / decisions
- Original bilibili-API-collect wiped upstream; spec extracted from Goooler fork (docs/bilibili-api-spec.md).
- FastStream license: all-rights-reserved; user will demo to author before distribution. Local use OK per user.

## Progress
- 2026-07-12: translator lane DONE. 13 tests green, live gtx smoke OK. Orchestrator fix:
  withCache no longer caches failure-fallback originals (cache poisoning). Committed 26b1ae2,
  merged to main, post-merge gate green. NUL-byte incident: Write tool corrupted 2 spaces in
  translator.txt prompt -> cursor spawn failed; perl-fixed, relaunched.
- api/player/app lanes still running.
- player lane DONE: 4 tests/51 asserts, web build OK, demo 200s, payload derived
  (autoSetSource:true required). Vendor fix: build.mjs --web flag (13 lines). Merged c3a61dc.
- app lane DONE: typecheck+build green, headed dev boot clean, no forbidden imports.
  Merged 4bc58ef. Preload emits index.mjs (main loads it explicitly).
- api lane (codex): all live steps PASS except comments page-2 (anonymous mode=3 returns
  is_end:true, no next_offset, all_count=812). CDN probe HTTP 206 (Referer contract PROVEN).
  Focused codex fix agent launched for pagination (logs/api-fix-pagination.log). NOT merged yet.
- integration prompt ready (prompts/integration.txt) — launch on main after api merges.
- api pagination fix DONE: root cause = video has 3 root comments, all_count includes replies;
  client falls back to paging thread replies (opaque cursor). Orchestrator re-ran live-test:
  all 7 steps PASS. api merged 9f595e9. Combined main gate: 20 tests green.
- integration slice launched on main (cursor, logs/integration-impl.log). Worktrees kept until
  integration verified. Remaining after integration: headed e2e vs BV1p94y1z7jX, cleanup.
- integration DONE + headed E2E ALL PASS via CDP probe (e2e-probe.ts): bridge OK, real
  resolveVideo OK, UI rendered w/ translated title, translate OK, FastStream playing
  (readyState 4, t advancing, 801s buffered => Referer injection proven in-app).
  Committed c4b6045. Worktrees + fleet branches removed. FLEET RUN COMPLETE.
