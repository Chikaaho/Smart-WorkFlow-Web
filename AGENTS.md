# Frontend Codex instructions

Read `.claude/system.md` in full before changing frontend code, running
frontend commands, or making an implementation decision.  It is the canonical
frontend engineering constitution; this file is only its Codex-compatible
entry point.  Also read `../Smart-WorkFlow-Knowledge/system.md` when the task
uses the shared role, receipt, knowledge, or workflow rules.

This directory is **frontend executor scope**.  Work only on this repository;
do not read, edit, build, test, or analyse `../Smart-WorkFlow/`, and do not run
backend commands.  Do not create or alter product direction: execute an
already-issued direction and report any infeasibility through the prescribed
receipt path.

For pnpm/npm/node compilation, tests, or builds, use
`NODE_OPTIONS="--max-old-space-size=512"`.  Before any compile/test/build
operation, check that no backend compile/test/build process is running; wait
rather than run the two stacks concurrently.  The required completion gate is
`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, subject to the
canonical constitution's rules and any applicable task scope.

Claude-only settings under `.claude/settings.json` do not replace Codex's
approval and sandbox policies.

