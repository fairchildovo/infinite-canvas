# Local Release Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reopen user-facing version updates by switching the user UI to our own local release notes, keep the admin backend showing upstream GitHub version updates, and add backend support for admin-editable release notes with AI auto-record.

**Architecture:** Split the release system into two independent sources. The user frontend will call a new public backend API that returns local release notes stored in the database. The admin backend will keep the existing upstream GitHub version checker untouched. A new backend `releases` domain will handle CRUD, public listing, and an AI-assisted generation endpoint that writes structured `+ [类型] 内容` release items using the system default text model.

**Tech Stack:** Go, Gin, GORM, SQLite/MySQL/PostgreSQL, Next.js App Router, React, TypeScript, Ant Design, Zustand, TanStack Query

---

## File Structure

### Backend

- `model/release.go`
  - Define `Release`, `ReleaseItem`, `ReleaseList`, `PublicRelease`, `PublicReleaseItem`, and admin request/response structs.
  - Keep format compatible with existing frontend release rendering style.

- `repository/release.go`
  - Implement GORM access for public active releases and admin paginated releases.
  - Add save/delete helpers for single release and batch delete.

- `service/release.go`
  - Implement public listing, admin listing, save, delete, batch delete, and AI generation logic.
  - Reuse model-channel routing from `service/settings.go` and parse AI output into structured release items.

- `handler/release.go`
  - Implement public and admin HTTP handlers.
  - Use existing `parseQuery`, `OK`, `FailError`, JSON decode patterns from `handler/admin.go` and `handler/announcement.go`.

- `router/release_routes.go`
  - Register public `GET /api/releases` and admin routes under `/api/admin/releases`.

- `router/router.go`
  - Call `registerReleaseRoutes(api, admin)`.

- `docs/content/docs/backend/backend-database.mdx`
  - Add documentation for the new `releases` table.

### Frontend

- `web/src/services/api/releases.ts`
  - Add public release API client: `fetchPublicReleases()`.

- `web/src/services/api/admin-releases.ts`
  - Add admin release API client functions for list/save/delete/batch-delete/AI-generate.

- `web/src/hooks/use-local-release.ts`
  - New hook for the user frontend that fetches local releases from `/api/releases` and exposes modal open state.

- `web/src/components/layout/version-release-modal.tsx`
  - Refactor to support two sources: `local` (user UI) and `upstream` (admin UI).

- `web/src/components/layout/user-status-actions.tsx`
  - Add `versionSource?: "local" | "upstream"` prop and pass it into the modal.

- `web/src/components/layout/app-top-nav.tsx`
  - Reopen the user version button by rendering `UserStatusActions` with `showVersion={true}` and `versionSource="local"`.

- `web/src/app/(admin)/admin/layout.tsx`
  - Keep the current upstream version button by setting `versionSource="upstream"`.

- `web/src/app/(admin)/admin/releases/page.tsx`
  - New admin page for managing local release notes.

- `web/src/app/(admin)/admin/releases/use-admin-releases.ts`
  - New admin hook for release list, pagination, save, delete, and AI generate.

---

## Key Changes

### Backend schema
Create a new `releases` table with these fields:
- `id` string PK
- `version` string unique index
- `title` string
- `release_date` string
- `items` JSON array of `{ type: string, content: string }`
- `summary` text
- `source` string, values: `manual` | `ai_record`
- `active` bool
- `created_by` string
- `created_at` string
- `updated_at` string

### Public API
`GET /api/releases`
- Returns only active releases ordered by `release_date desc`, then `created_at desc`.
- Response shape should match the existing frontend `ReleaseInfo` rendering model so the modal can reuse the current timeline UI with minimal change.

### Admin API
- `GET /api/admin/releases` with `model.Query` keyword/page/pageSize
- `POST /api/admin/releases` save single release
- `POST /api/admin/releases/batch-delete` delete by ids
- `DELETE /api/admin/releases/:id`
- `POST /api/admin/releases/generate` AI auto-record from admin input notes/version/title

### AI auto-record
Use the current public default text model configured in backend settings.
- If `defaultTextModel` is empty, fall back to the first enabled text-like available model.
- If no usable model exists, return a safe message error.
- Request path: `/chat/completions` on the selected model channel.
- Prompt contract:
  - Input: `version`, optional `title`, admin-provided notes
  - Output: only `+ [新增|修复|调整|优化|文档] 内容` lines
- Parse AI output with the same pattern used by `web/src/lib/release.ts` (`/^\+\s+\[(.+?)\]\s+(.+)$/`).
- If parsing produces zero valid items, return error to admin instead of saving empty record.
- Save source as `ai_record`.

### Frontend behavior
User frontend:
- Reopen the version entry point in top nav.
- Default display is our own release notes from backend.
- Keep current version badge text style (`APP_VERSION`) and timeline UI.
- Remove direct GitHub `CHANGELOG.md` dependency from the user-facing flow.

Admin backend:
- Keep the existing upstream GitHub version check exactly as it is.
- Add a separate “版本记录” admin page for local release management.
- Admin page should support manual CRUD and one-click AI auto-record.

---

## Test Plan

### Backend unit tests
1. `TestParseReleaseItemsFromAIOutput`
   - Input multiline mixed text with valid and invalid lines.
   - Expected: only valid structured items are returned in order.

2. `TestGenerateReleaseNoteRejectsEmptyModel`
   - Expected: safe message error when no usable text model exists.

3. `TestGenerateReleaseNoteParsesChatResponse`
   - Use `httptest.NewServer` to mock `/v1/chat/completions`.
   - Expected: returned release items match mocked content.

4. `TestPublicReleasesReturnsOnlyActiveAndOrdered`
   - Insert mixed active/inactive releases.
   - Expected: public endpoint returns active items sorted by date desc.

5. `TestAdminSaveReleaseValidatesVersion`
   - Expected: missing/blank version returns validation error.

### Frontend component checks
1. User nav renders version button again with `showVersion={true}`.
2. Local release modal shows backend releases without calling GitHub.
3. Admin layout still opens upstream version checker unchanged.
4. Admin release page supports save/delete/AI-generate flows.

---

## Assumptions and Defaults
- Upstream admin display remains GitHub-based and is intentionally left unchanged.
- User frontend will only show our own release notes, not upstream GitHub content.
- The project continues using GORM `AutoMigrate`; no manual migration scripts are required for the new table.
- AI auto-record uses the backend-configured default text model instead of adding a new dedicated AI setting, to avoid expanding the settings schema unnecessarily.
- Release note format stays compatible with the current `+ [类型] 内容` parsing and rendering style.

---

## Task Checklist

- [ ] Task 1: Backend release model, repository, service
- [ ] Task 2: Backend release handlers and routes
- [ ] Task 3: Backend AI auto-record endpoint
- [ ] Task 4: Frontend public release API and hook
- [ ] Task 5: Frontend release modal split by source
- [ ] Task 6: Reopen user version entry and keep admin upstream entry
- [ ] Task 7: Admin local release management page
- [ ] Task 8: Docs and pending-test updates
