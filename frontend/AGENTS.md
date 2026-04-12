# AGENTS.md

This file provides guidance to coding agent like Claude Code, Codex, etc. when working with code in this repository.

## Project Overview

This is an Activity Management System frontend using **Next.js 16.2.2** with React 19. It communicates with a backend API at `http://localhost:8000/api`.

## Commands

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Architecture

### App Router Structure
- `app/layout.tsx` - Root layout with `QueryProvider` and `TooltipProvider`
- `app/(dashboard)/layout.tsx` - Dashboard layout with sidebar navigation
- Route groups use `(dashboard)` syntax for grouped layouts

### Key Libraries
- **TanStack Query** (`@tanstack/react-query`) - Server state management via `lib/providers.tsx`
- **TanStack Form** (`@tanstack/react-form`) - Form handling with Zod validation
- **TanStack Table** (`@tanstack/react-table`) - Data tables via `components/data-table.tsx`
- **Zod** (`zod`) - Schema validation for forms and API types
- **shadcn/ui** - UI components in `components/ui/`
- **date-fns** - Date manipulation

### API Layer (`lib/api/`)
- `activity-api.ts` - Activity CRUD operations
- `participant-api.ts` - Participant CRUD operations
- All APIs return `ApiResponse<T>` with `{ code, success, data, message }` structure
- Uses `handleResponse<T>()` helper to unwrap responses

### Component Patterns
- Form fields in `components/form/` use TanStack Form's `form.Field` render-prop pattern
- `components/data-table.tsx` provides reusable table wrapper with loading/empty states
- `components/ui/` contains shadcn components

### Important Notes

**Next.js 16 Breaking Changes**: This version has significant breaking changes from earlier Next.js versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing code.

**TypeScript Strict Mode**: All TypeScript is strict mode enabled.

**Path Aliases**: Use `@/*` to reference root (e.g., `@/components/ui/button`).
