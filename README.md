# MAVI frontend interview practice

An intentionally empty React/TypeScript app with Vite, Vitest, Testing Library,
strict type checking, ESLint, Prettier, and VS Code settings. No mock is implemented.

## Start in VS Code

Open this directory as the workspace (not its parent), and open a **new terminal**.
The workspace prepends the local Node runtime to PATH on Windows.

```powershell
node --version
npm run dev
```

Node must be >=22.22.2. In an existing/external PowerShell terminal:

```powershell
. ./scripts/use-node.ps1
npm run dev
```

Dependencies are already installed in this copy. For a fresh checkout, install
Node 22.22.2+ (Node 22 is recorded in .nvmrc), then run `npm ci`.
The ignored `.tools/node` runtime is local convenience, not part of Git.

## Commands

| Command             | Purpose                               |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Local dev server                      |
| `npm test`          | Watch tests                           |
| `npm run test:run`  | Test once                             |
| `npm run typecheck` | Strict TypeScript check               |
| `npm run lint`      | ESLint, warnings fail                 |
| `npm run format`    | Format files                          |
| `npm run check`     | All checks plus production build      |
| `npm run preview`   | Serve production build after building |

Start implementation in `src/App.tsx`. Tests can live next to components as
`*.test.tsx`; shared test setup is in `src/test/setup.ts`. Add folders only as needed.

## Practice workflow

1. Read [confirmed interview details](docs/INTERVIEW.md).
2. Choose a [mock](docs/MOCK-INTERVIEWS.md); start with Product Explorer.
3. Create a branch from the starter tag: `git switch -c mock/product-explorer starter`.
   Save/commit any current work before switching; never discard another attempt.
4. Set a 60-minute timer. Use Codex intentionally; prompts are in [AI workflow](docs/AI-WORKFLOW.md).
5. Run checks and manually try keyboard navigation, narrow screen, and failed network.
6. Submit the branch/path plus the mock number, time spent, and short decision notes.
   Ask: "Evaluate mock 1 using docs/EVALUATION.md. Do not edit my implementation."

For another attempt, create a different branch from `starter` after saving your work.
The exercises and rubric are practice material, not MAVI's actual questions or scoring.
