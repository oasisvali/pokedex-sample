# Pokédex implementation plan

## Review workflow

Implement one slice at a time. Each slice requires user review, acceptance and a
manual commit before starting the next. Preserve existing edits; do not commit
on the user's behalf.

## Slices 1–2 — Basic listing and details

Status: Accepted for continuation; committed in dd84cad and d0cab0b.

Ten-item listing, sprite/type presentation, measurements, metadata, expandable
abilities/stats/moves and cry controls are implemented. Slice 3 replaces the
per-card fetching and retry behavior with complete startup loading.

## Slice 3 — Complete startup loading

Status: Accepted for continuation; startup committed in a9d565e, cleanup in 37a1f20.

- Discover the API catalogue count with `pokemon?limit=1`; fetch the full catalogue
  and follow additional pages if needed. Preserve API order and all forms rather
  than hardcoding 1,351 or assuming sequential resource IDs.
- Load validated details with 20 concurrent requests by default (1–100 via
  `VITE_POKEMON_CONCURRENCY`) and a configurable
  20-second timeout per request.
- Show a dedicated startup screen: explanatory text, labelled determinate progress,
  percentage and loaded/total counts. Start at 0% during discovery; only successful
  detail downloads advance progress.
- Block browsing until every detail succeeds. Keep successes on retry and request
  only failed entries. Catalogue failures have a separate retry action.
- Maintain a shared in-memory dataset; pass details to cards as props. Cancel
  obsolete work, ignore late responses and share StrictMode startup subscriptions.
- On completion, show the first ten Pokémon and the complete catalogue count.
- Test concurrency, progress, partial failures/retry, catalogue pagination,
  non-sequential IDs, cancellation, StrictMode, timeouts and existing presentation.

Verification: `npm run check` passed (22 tests, type checking, lint, formatting and
production build). The live discovery/full-list requests returned all 1,351
entries. Full live detail loading was not exercised; network behavior was tested
with mocks. Browser access remained unavailable, so visual layout and screen-reader
announcements remain unverified. The source diff and whitespace checks passed.

## Slice 4 — Pagination

Status: Accepted for continuation; committed in 71e3095.

- Add Mantine pagination for ten Pokémon per page, derived from dataset length.
- Show current range and total, including a partial final page.
- Navigate without API requests; return focus/scroll to the listing heading and
  unmount the previous cards so their audio stops.

Verification: `npm run check` passed (29 tests, types, lint, formatting and production
build). Tests cover keyboard navigation, page ranges and boundaries, all 136 pages
for 1,351 entries, the partial final page, audio cleanup and no additional API
requests when changing pages. Diff and whitespace checks passed. Browser access
remained unavailable, so responsive layout and actual scrolling/audio remain
unverified in a browser.

## Slice 5 — Type filter and name search

Status: Implemented; automated checks passed. Awaiting user review and manual commit.

- Add a labelled single-type selector, name input and Clear filters button.
- Derive alphabetical type options from the complete dataset; default to All types.
- Trim and lowercase search input; match any part of the API name, including full names.
- Combine type and name with AND, filter before pagination, update as input changes,
  reset to page 1 and announce result counts. Include a helpful empty state.
- Test combined matching, case/whitespace, resets, empty results and pagination.

Verification: `npm run check` passed (33 tests, types, lint, formatting and production
build). Tests cover full-dataset type filtering, alphabetical options, full/partial names,
case/whitespace and hyphens, combined filters, secondary types, empty-state recovery,
page resets and no additional API requests. Diff and whitespace checks passed.
Browser access remained unavailable; responsive layout remains unverified.

## Slice 6 — localStorage persistence

Status: Planned; awaiting slice 5 review, acceptance and manual commit.

- Persist a complete ordered dataset of names and consumed validated detail fields,
  plus media URLs. Do not store raw responses or media files.
- Use an application-specific cache key and schema version; validate completeness.
- Use a valid cache indefinitely with no API requests, expiry or automatic refresh.
- Missing/corrupt/incomplete/incompatible caches trigger normal startup loading.
  Save only after all details succeed.
- Catch storage/quota failures, keep the in-memory app usable and show a non-blocking
  message. Do not persist page/filter/search state.
- Test cache hits with zero API calls, round trips, invalid caches and storage errors.

## Verification and defaults

Run `npm run check` and inspect the diff for each slice. Verify keyboard navigation,
narrow layouts, progress announcements and audio behavior in a browser when
available. Browser verification was previously blocked by an unavailable host;
jsdom tests do not establish visual layout or audible playback.

Images and cries remain remote resources; localStorage does not provide offline
media playback. API reference: https://pokeapi.co/docs/v2/.
