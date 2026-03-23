# claude-code-standards

Smart auto-learning code standards for any project. Detects **10+ languages**, **50+ frameworks/libraries**, scans your actual code patterns, and generates tailored `CLAUDE.md` + `AGENTS.md` + `.cursorrules` + specialized agents.

## Install

```bash
npm install -D claude-code-standards
```

## Initialize

```bash
npx claude-code-standards init
```

This will:
1. Detect your tech stack (language, frameworks, libraries)
2. **Scan your codebase** to discover naming conventions, project structure, import patterns, code style, error handling, and more
3. Generate `CLAUDE.md` with stack-specific rules + auto-discovered patterns
4. Install agents to `.claude/agents/`
5. Install docs to `.claude/docs/`

## Options

```bash
npx claude-code-standards init --format all      # Generate CLAUDE.md + AGENTS.md + .cursorrules
npx claude-code-standards init --format agents    # Generate AGENTS.md only
npx claude-code-standards init --format cursor    # Generate .cursorrules only
npx claude-code-standards init --no-scan          # Skip code scanning (template-only)
npx claude-code-standards init --update           # Re-scan and update (preserves manual edits)
```

## Supported Languages

| Language | Manifest File | Frameworks Detected |
|----------|--------------|-------------------|
| **JavaScript / TypeScript** | `package.json` | Next.js, React, Vue, Angular, Svelte, Astro, Nuxt, NestJS, Express, React Native, Expo |
| **Python** | `requirements.txt`, `pyproject.toml`, `Pipfile` | Django, Flask, FastAPI |
| **PHP** | `composer.json` | Laravel, Symfony, WordPress |
| **Go** | `go.mod` | Gin, Echo, Fiber, Chi |
| **Rust** | `Cargo.toml` | Axum, Actix Web, Rocket |
| **Ruby** | `Gemfile` | Rails, Sinatra |
| **Java / Kotlin** | `pom.xml`, `build.gradle` | Spring Boot |
| **C# / .NET** | `*.csproj` | ASP.NET Core, Blazor |
| **Dart / Flutter** | `pubspec.yaml` | Flutter, Riverpod, Bloc |
| **Swift** | `Package.swift`, `Podfile` | SwiftUI, Vapor |

## Libraries Detected (50+)

**State**: Redux, Zustand, Jotai, MobX, Pinia, Vuex, NgRx, Riverpod, Bloc
**Data Fetching**: TanStack Query, SWR, Apollo Client, tRPC, Axios
**Forms**: Formik, React Hook Form
**UI**: Shadcn/UI, Material UI, Ant Design, Chakra UI, Tailwind CSS, styled-components
**Validation**: Zod, Yup, Pydantic, class-validator
**ORM**: Prisma, Drizzle, TypeORM, Sequelize, Mongoose, SQLAlchemy, Eloquent, GORM, Diesel, Hibernate, Entity Framework, ActiveRecord
**Auth**: NextAuth, Clerk, Supabase, Firebase, Passport, Devise
**Testing**: Jest, Vitest, Playwright, Cypress, pytest, PHPUnit, Pest, RSpec, JUnit, xUnit, Testify

## Code Scanner

The scanner reads your actual source files and discovers:

- **Project structure** — where components, services, models, tests live
- **Naming conventions** — file naming, function naming, constant style
- **Import patterns** — path aliases, barrel exports, import ordering
- **Code style** — semicolons, quotes, indentation, trailing commas
- **Error handling** — custom error classes, API error format
- **API patterns** — REST, GraphQL, tRPC, endpoint naming
- **Component patterns** — functional vs class, styling approach, props style
- **Testing patterns** — framework, file naming, colocated vs separate
- **Existing configs** — ESLint, Prettier, Biome, Ruff, RuboCop, etc.
- **CI/CD** — GitHub Actions, Docker, Vercel, Netlify, etc.

These discoveries are written as a `## Learned Patterns` section in `CLAUDE.md`. On re-run with `--update`, only auto-discovered sections are updated — your manual edits are preserved.

## Agents

### code-learner
Scans the codebase, discovers project-specific patterns, and writes them into CLAUDE.md. Run this to teach the AI how YOUR project works. Re-run to evolve standards as the project grows.

### code-guardian
Audits the codebase against CLAUDE.md rules. Finds violations, discovers undocumented patterns, and reports actionable fixes.

### figma-builder (frontend)
Builds pixel-perfect components from Figma frames. Extracts all assets, preserves exact styling.

### figma-validator (frontend)
Validates built components against Figma screenshots. Catches missing assets, wrong colors, spacing.

### pen-builder (frontend)
Builds components from .pen (Pencil) design files using Pencil MCP tools.

### pen-validator (frontend)
Validates components against .pen designs.

## Multi-Format Output

| Format | File | Compatible With |
|--------|------|----------------|
| `claude` (default) | `CLAUDE.md` | Claude Code |
| `agents` | `AGENTS.md` | Cursor, GitHub Copilot, OpenAI Codex, Continue.dev, Aider |
| `cursor` | `.cursorrules` | Cursor AI |
| `all` | All three | Everything |

## License

MIT
