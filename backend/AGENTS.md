# AGENTS.md

This file provides guidance to coding agents like Claude Code when working with code in this repository.

## Project Overview

This is a NestJS backend API for an Activity Management System. It provides REST endpoints for managing users, activities, events, and participants.

## Commands

```bash
pnpm install         # Install dependencies
pnpm run start:dev   # Start with hot reload
pnpm run build       # Production build
pnpm run lint        # Run ESLint
pnpm run test        # Run unit tests
pnpm run test:cov    # Test coverage
pnpm run test:e2e    # E2E tests
```

## Architecture

### Modules
- **auth**: JWT authentication, login/register, refresh tokens
- **user**: User CRUD with role-based access
- **activity**: Activities, Events, Participants management
- **health**: Health check endpoint at `/health`

### Key Technologies
- **NestJS 11** with TypeORM
- **MySQL** database
- **Passport.js** with JWT strategy
- **bcrypt** for password hashing

### API Response Format
All API responses follow `ApiResponse<T>` structure:
```typescript
{ code: number; success: boolean; data: T; message: string }
```

## Testing Patterns

- Test files are located alongside source files with `.spec.ts` suffix
- Use `jest --watch` for TDD workflow
- E2E tests use `./test/jest-e2e.json` config

## Code Style

- Uses ESLint with Prettier integration
- Run `pnpm run format` before committing
- TypeScript strict mode enabled

## Important Notes

- Database credentials are managed via environment variables (see `.env` file)
- JWT tokens are used for authentication
- Role-based access control via `@Roles()` decorator
