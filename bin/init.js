#!/usr/bin/env node

const path = require('path');
const { detectStack } = require('../lib/detect');
const { scanAll } = require('../lib/scan');
const {
  generateAllFormats,
  installAgents,
  installDocs,
} = require('../lib/install');
const { promptToolSelection, TOOL_CATALOG, c } = require('../lib/prompt');
const { auditProject, printAuditReport } = require('../lib/audit');

// Parse CLI flags
const args = process.argv.slice(2);
const flags = {
  format: null, // null = not provided → prompt interactively
  noScan: false,
  update: false,
  dryRun: false,
  interactive: false,
  audit: false,
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--format' && args[i + 1]) {
    flags.format = args[i + 1];
    i++;
  } else if (args[i] === '--no-scan') {
    flags.noScan = true;
  } else if (args[i] === '--dry-run') {
    flags.dryRun = true;
  } else if (args[i] === '--update') {
    flags.update = true;
  } else if (args[i] === '--audit') {
    flags.audit = true;
  } else if (args[i] === '--interactive' || args[i] === '-i') {
    flags.interactive = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Claude Code Standards — Auto-detect your stack, scan patterns, generate standards.

Usage:
  npx claude-code-standards init [options]

Options:
  --format <type>   Output format(s) to generate:
                      claude       CLAUDE.md only
                      popular      Top 6: CLAUDE.md, AGENTS.md, Copilot, Cursor, Windsurf, Gemini
                      all          All 17 formats (every AI tool)
                      <name>       Specific tool (comma-separated for multiple):
                                   claude,cursor,copilot
                      Available: claude, agents, gemini, copilot, cursor, cursorrules,
                                 windsurf, aider, cline, zed, junie, amazonq, roo, augment,
                                 tabnine, jetbrains, continue
                    If omitted, an interactive selector is shown.
  --interactive, -i Force interactive tool selector (even if --format is set)
  --no-scan         Skip code scanning (faster, template-only output)
  --update          Re-scan and update existing files (preserves manual edits)
  --dry-run         Preview what would be generated without writing files
  --audit           Audit existing CLAUDE.md/AGENTS.md against actual codebase
  -h, --help        Show this help message

Supported languages:
  Node.js, Python, PHP, Go, Rust, Ruby, Java/Kotlin, C#/.NET, Dart/Flutter, Swift

Supported AI tools (17 formats):
  Claude Code, AGENTS.md (universal), Cursor, GitHub Copilot, Windsurf,
  Gemini CLI, Antigravity, Aider, Cline, Zed, Continue.dev, Amazon Q,
  Roo Code, Augment, Tabnine, JetBrains AI, JetBrains Junie
`);
    process.exit(0);
  }
}

// --update overrides --no-scan (update always needs fresh scan data)
if (flags.update && flags.noScan) {
  console.log('Note: --update overrides --no-scan; scanning will proceed.');
  flags.noScan = false;
}

// Support comma-separated --format values (e.g. --format claude,cursor,copilot)
if (flags.format && flags.format.includes(',')) {
  flags.format = flags.format.split(',').map(f => f.trim()).filter(Boolean);
}

// Main flow (async for interactive prompt)
(async () => {
  const projectDir = process.cwd();

  // Audit mode: run audit and exit
  if (flags.audit) {
    console.log(`\n${c.bold('🔍 Claude Code Standards')} — Auditing...\n`);
    console.log(`${c.dim('Project:')} ${projectDir}\n`);
    const results = auditProject(projectDir);
    const failCount = printAuditReport(results);
    process.exit(failCount > 0 ? 1 : 0);
  }

  console.log(`\n${c.bold('🔍 Claude Code Standards')} — Initializing...\n`);
  console.log(`${c.dim('Project:')} ${projectDir}\n`);

  // Step 0: Interactive tool selection
  let formatSelection = flags.format;
  if (formatSelection === null || flags.interactive) {
    formatSelection = await promptToolSelection(projectDir);
  }

  // Step 1: Detect stack
  console.log(`${c.bold('Detecting tech stack...')}`);
  const stack = detectStack(projectDir);

  // Log detected languages
  const languages = [];
  if (stack.isNode) languages.push('Node.js');
  if (stack.isPython) languages.push('Python');
  if (stack.isPHP) languages.push('PHP');
  if (stack.isGo) languages.push('Go');
  if (stack.isRust) languages.push('Rust');
  if (stack.isRuby) languages.push('Ruby');
  if (stack.isJava) languages.push(stack.kotlin ? 'Kotlin' : 'Java');
  if (stack.isDotnet) languages.push('C# / .NET');
  if (stack.isDart) languages.push('Dart');
  if (stack.isSwift) languages.push('Swift');
  console.log(`  ${c.green('Language:')} ${languages.join(', ')}`);

  // Log detected frameworks and libraries
  const detected = [];
  // Node.js
  if (stack.nextjs) detected.push('Next.js');
  if (stack.react && !stack.nextjs && !stack.reactNative) detected.push('React');
  if (stack.vue) detected.push('Vue.js');
  if (stack.angular) detected.push('Angular');
  if (stack.svelte) detected.push('Svelte');
  if (stack.astro) detected.push('Astro');
  if (stack.nuxt) detected.push('Nuxt');
  if (stack.nestjs) detected.push('NestJS');
  if (stack.express) detected.push('Express');
  if (stack.reactNative || stack.expo) detected.push('React Native' + (stack.expo ? ' (Expo)' : ''));
  if (stack.rtkQuery) detected.push('RTK Query');
  else if (stack.redux) detected.push('Redux');
  if (stack.zustand) detected.push('Zustand');
  if (stack.jotai) detected.push('Jotai');
  if (stack.mobx) detected.push('MobX');
  if (stack.pinia) detected.push('Pinia');
  if (stack.tanstackQuery) detected.push('TanStack Query');
  if (stack.swr) detected.push('SWR');
  if (stack.apollo) detected.push('Apollo Client');
  if (stack.trpc) detected.push('tRPC');
  if (stack.formik) detected.push('Formik');
  if (stack.reactHookForm) detected.push('React Hook Form');
  if (stack.tailwind) detected.push('Tailwind CSS');
  if (stack.shadcn) detected.push('Shadcn/UI');
  if (stack.mui) detected.push('Material UI');
  if (stack.antd) detected.push('Ant Design');
  if (stack.chakra) detected.push('Chakra UI');
  if (stack.zod) detected.push('Zod');
  if (stack.yup) detected.push('Yup');
  if (stack.prisma) detected.push('Prisma');
  if (stack.drizzle) detected.push('Drizzle');
  if (stack.typeorm) detected.push('TypeORM');
  if (stack.mongoose) detected.push('Mongoose');
  if (stack.stripe) detected.push('Stripe');
  if (stack.nextAuth) detected.push('NextAuth');
  if (stack.clerk) detected.push('Clerk');
  if (stack.supabase) detected.push('Supabase');
  if (stack.firebase) detected.push('Firebase');
  // Python
  if (stack.django) detected.push('Django');
  if (stack.flask) detected.push('Flask');
  if (stack.fastapi) detected.push('FastAPI');
  if (stack.sqlalchemy) detected.push('SQLAlchemy');
  if (stack.celery) detected.push('Celery');
  if (stack.djangoRestFramework) detected.push('Django REST Framework');
  if (stack.pytest) detected.push('pytest');
  // PHP
  if (stack.laravel) detected.push('Laravel');
  if (stack.symfony) detected.push('Symfony');
  if (stack.wordpress) detected.push('WordPress');
  if (stack.eloquent && !stack.laravel) detected.push('Eloquent');
  if (stack.doctrine) detected.push('Doctrine');
  // Go
  if (stack.gin) detected.push('Gin');
  if (stack.echo) detected.push('Echo');
  if (stack.fiber) detected.push('Fiber');
  if (stack.gorm) detected.push('GORM');
  // Rust
  if (stack.axum) detected.push('Axum');
  if (stack.actixWeb) detected.push('Actix Web');
  if (stack.tokio) detected.push('Tokio');
  if (stack.diesel) detected.push('Diesel');
  // Ruby
  if (stack.rails) detected.push('Rails');
  if (stack.rspec) detected.push('RSpec');
  if (stack.sidekiq) detected.push('Sidekiq');
  // Java
  if (stack.springBoot) detected.push('Spring Boot');
  if (stack.hibernate) detected.push('Hibernate');
  // .NET
  if (stack.aspnet) detected.push('ASP.NET Core');
  if (stack.efCore) detected.push('Entity Framework Core');
  // Dart/Flutter
  if (stack.flutter) detected.push('Flutter');
  if (stack.riverpod) detected.push('Riverpod');
  if (stack.bloc) detected.push('Bloc');
  // Swift
  if (stack.swiftui) detected.push('SwiftUI');
  if (stack.vapor) detected.push('Vapor');

  console.log(`  ${c.green('Detected:')} ${detected.join(', ') || c.dim('No specific stack detected')}`);

  const types = [];
  if (stack.isFrontend) types.push('Frontend');
  if (stack.isBackend) types.push('Backend');
  if (stack.isMobile) types.push('Mobile');
  console.log(`  ${c.green('Type:')} ${types.join(' + ') || 'Library/Tool'}`);
  console.log('');

  // Step 2: Scan codebase for patterns
  let scanResults = null;
  if (!flags.noScan) {
    console.log(`${c.bold('Scanning codebase for patterns...')}`);
    try {
      scanResults = scanAll(projectDir, stack);
      console.log(`  ${c.green('Scan complete')}`);

      // Log some discoveries
      if (scanResults.existingConfigs.length > 0) {
        console.log(`  ${c.cyan('Found configs:')} ${scanResults.existingConfigs.map(cfg => cfg.name).join(', ')}`);
      }
      if (scanResults.ci.length > 0) {
        console.log(`  ${c.cyan('CI/CD:')} ${scanResults.ci.join(', ')}`);
      }
      if (scanResults.monorepo.isMonorepo) {
        console.log(`  ${c.cyan('Monorepo:')} ${scanResults.monorepo.tool}`);
      }
      // Show config-aware details
      if (scanResults.configDetails && Object.keys(scanResults.configDetails).length > 0) {
        for (const [tool, details] of Object.entries(scanResults.configDetails)) {
          console.log(`  ${c.dim(tool + ':')} ${details.join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`  ${c.yellow('Scan skipped')} (error: ${err.message})`);
    }
    console.log('');
  }

  // Step 3: Generate output files
  console.log(`${c.bold('Generating config files...')}`);
  const generated = generateAllFormats(projectDir, stack, scanResults, formatSelection, flags.update, flags.dryRun);

  // Step 4 & 5: Install agents and docs (skip in update mode)
  if (!flags.update) {
    if (flags.dryRun) {
      console.log(`\n${c.dim('[dry-run] Would install agents and docs to .claude/')}`);
    } else {
      console.log(`\n${c.bold('Installing agents...')}`);
      installAgents(projectDir, stack);

      console.log(`\n${c.bold('Installing docs...')}`);
      installDocs(projectDir, stack);
    }
  }

  console.log(`\n${c.green('✅ Done!')} Generated ${c.bold(String(generated.length))} config file(s).`);
  console.log(`\n${c.bold('Next steps:')}`);
  console.log(`  1. Run the ${c.cyan('code-learner')} agent to discover project-specific patterns`);
  console.log(`  2. Review generated config files and customize project-specific sections`);
  console.log(`  3. Run the ${c.cyan('code-guardian')} agent to audit your codebase`);
  console.log('  4. Commit generated files and .claude/ directory to your repo');

  // Show remaining tools that weren't generated
  const generatedSet = new Set(generated);
  const remaining = TOOL_CATALOG.filter(t => !generatedSet.has(t.key));

  if (remaining.length > 0 && remaining.length < TOOL_CATALOG.length) {
    console.log(`\n${c.bold('Add more tools:')}`);
    for (const tool of remaining) {
      const pad = ' '.repeat(Math.max(0, 14 - tool.key.length));
      console.log(`  ${c.dim('npx claude-code-standards init --format')} ${c.cyan(tool.key)}${pad}${c.dim('#')} ${tool.name} ${c.dim('→')} ${tool.path}`);
    }
    console.log(`\n  ${c.dim('Or re-run the selector:')} npx claude-code-standards init -i`);
  }

  console.log('');
})();
