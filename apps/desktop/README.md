# @bili/desktop

Electron desktop shell for the bilibili client with translation. This package talks to main-process services only through the frozen `BiliBridge` IPC contract (`@bili/types`). During the fleet build it runs against **mock** fixtures; real `@bili/api` / `@bili/translate` / `@bili/player` wiring happens in a later integration step.

## Setup

```bash
bun install
```

From the monorepo root (workspaces) or from `apps/desktop`.

## Develop

```bash
bun run dev
```

Opens Electron with hot reload via electron-vite.

## Build / typecheck

```bash
bun run typecheck
bun run build
```

## Mock → real swap

The single integration line is in `src/main/services/index.ts`:

```ts
export const service: BiliBridge = new MockBiliService();
```

Replace `MockBiliService` with the real composed service when `@bili/api`, `@bili/translate`, and player assets are ready. Player assets are copied into `src/renderer/public/player/` (see comment in `electron.vite.config.ts`).
