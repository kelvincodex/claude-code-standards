# claude-code-standards

Reusable Claude Code agents, rules, and conventions for any project. Auto-detects your tech stack and generates a tailored `CLAUDE.md` + specialized agents.

## Install

```bash
npm install -D claude-code-standards
```

## Initialize

```bash
npx claude-code-standards init
```

This will:
1. Read your `package.json` to detect your tech stack
2. Generate a `CLAUDE.md` with relevant rules for your stack
3. Install agents to `.claude/agents/` (code-guardian, figma-builder, figma-validator)
4. Install docs to `.claude/docs/`

## What gets detected

| Dependency | Rules Applied |
|---|---|
| `next` | App Router conventions, layout patterns, route organization |
| `@reduxjs/toolkit` | RTK Query service patterns, tag constants, Object.values |
| `@radix-ui/react-slot` | Shadcn/UI read-only rule, wrapper pattern |
| `@nestjs/core` | Module structure, DTO validation, guard patterns |
| `zod` | Centralized validation schemas |
| `@ebay/nice-modal-react` | ModalConstant pattern, barrel registration |
| `tailwindcss` | Tailwind conventions |
| And more... | Stripe, LiveKit, TypeORM, Prisma, etc. |

## Agents

### code-guardian
Run **first** before any task. Audits the codebase against CLAUDE.md rules and discovers undocumented patterns.

### figma-builder (frontend only)
Builds pixel-perfect components from Figma frames. Extracts all assets, preserves exact styling.

### figma-validator (frontend only)
Validates built components against Figma screenshots. Catches missing assets, wrong colors, spacing issues.

## Customization

After `init`, edit `CLAUDE.md` to add project-specific rules. The generated file is a starting point — customize it for your project's unique conventions.

## License

MIT
