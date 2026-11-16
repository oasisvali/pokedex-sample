# Pokédex listing plan

Display the first ten Pokémon in API order, eventually with images, names and types.
Use native fetch, Zod transport validation and the shared Mantine theme.

## Slice 1 — Names listing

Status: Implemented; verification and user review pending.

- Fetch `/pokemon?limit=10&offset=0`; display names in a responsive semantic list.
- Include accessible loading, empty, error and retry states.
- Separate transport code and configuration; validate only consumed fields.
- Cache successes in memory; cancel and ignore obsolete requests.
- Test mocked network behavior, run `npm run check`, inspect the diff and verify
  keyboard use and narrow layouts where available.

## Slice 2 — Images and types

Status: Planned; awaiting slice 1 review, acceptance and manual commit.

- Fetch each entry's details concurrently; preserve list order.
- Add `sprites.front_default` images and type badges ordered by `slot`.
- Retain names when details fail; offer per-card retry and image placeholders.
- Cache successes; retry only failed resources.
- Test partial failures, out-of-order completion, missing/broken images and cleanup.

## Workflow and defaults

Each slice must be reviewed, accepted and manually committed before the next starts.
Search, pagination controls and a detail screen are future work.
Direct API requests were blocked during planning; structure was verified against
https://pokeapi.co/docs/v2/.
