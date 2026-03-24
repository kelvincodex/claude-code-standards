const fs = require('fs');
const path = require('path');
const { scanAll, formatScanResults } = require('./scan');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * Copy a file from templates to project, creating directories as needed
 */
function copyTemplate(templatePath, destPath) {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(
    path.join(TEMPLATES_DIR, templatePath),
    destPath
  );
}

/**
 * Build a technology stack table from detected stack.
 */
function buildTechStackTable(stack) {
  const rows = [];

  // Language
  if (stack.isNode) rows.push('| Language | JavaScript / TypeScript |');
  if (stack.isPython) rows.push('| Language | Python |');
  if (stack.isPHP) rows.push('| Language | PHP |');
  if (stack.isGo) rows.push('| Language | Go |');
  if (stack.isRust) rows.push('| Language | Rust |');
  if (stack.isRuby) rows.push('| Language | Ruby |');
  if (stack.isJava) rows.push(`| Language | ${stack.kotlin ? 'Kotlin' : 'Java'} |`);
  if (stack.isDotnet) rows.push('| Language | C# / .NET |');
  if (stack.isDart) rows.push('| Language | Dart |');
  if (stack.isSwift) rows.push('| Language | Swift |');

  // Frameworks — JS/TS
  if (stack.nextjs) rows.push('| Framework | Next.js |');
  else if (stack.react && !stack.reactNative) rows.push('| Framework | React |');
  if (stack.vue) rows.push('| Framework | Vue.js |');
  if (stack.angular) rows.push('| Framework | Angular |');
  if (stack.svelte) rows.push('| Framework | Svelte |');
  if (stack.astro) rows.push('| Framework | Astro |');
  if (stack.nuxt) rows.push('| Framework | Nuxt |');
  if (stack.nestjs) rows.push('| Framework | NestJS |');
  if (stack.express) rows.push('| Framework | Express |');
  if (stack.reactNative || stack.expo) rows.push('| Mobile | React Native' + (stack.expo ? ' (Expo)' : '') + ' |');

  // Frameworks — Python
  if (stack.django) rows.push('| Framework | Django |');
  if (stack.flask) rows.push('| Framework | Flask |');
  if (stack.fastapi) rows.push('| Framework | FastAPI |');

  // Frameworks — PHP
  if (stack.laravel) rows.push('| Framework | Laravel |');
  if (stack.symfony) rows.push('| Framework | Symfony |');

  // Frameworks — Go
  if (stack.gin) rows.push('| Framework | Gin |');
  else if (stack.echo) rows.push('| Framework | Echo |');
  else if (stack.fiber) rows.push('| Framework | Fiber |');
  else if (stack.chi) rows.push('| Framework | Chi |');

  // Frameworks — Rust
  if (stack.axum) rows.push('| Framework | Axum |');
  else if (stack.actixWeb) rows.push('| Framework | Actix Web |');
  else if (stack.rocket) rows.push('| Framework | Rocket |');

  // Frameworks — Ruby
  if (stack.rails) rows.push('| Framework | Ruby on Rails |');

  // Frameworks — Java
  if (stack.springBoot) rows.push('| Framework | Spring Boot |');

  // Frameworks — .NET
  if (stack.aspnet) rows.push('| Framework | ASP.NET Core |');

  // Frameworks — Dart/Flutter
  if (stack.flutter) rows.push('| Framework | Flutter |');

  // Frameworks — Swift
  if (stack.vapor) rows.push('| Framework | Vapor |');
  if (stack.swiftui) rows.push('| UI | SwiftUI |');

  // UI / Styling
  if (stack.tailwind) rows.push('| Styling | Tailwind CSS |');
  if (stack.shadcn) rows.push('| UI | Shadcn/UI |');
  if (stack.mui) rows.push('| UI | Material UI |');
  if (stack.antd) rows.push('| UI | Ant Design |');
  if (stack.chakra) rows.push('| UI | Chakra UI |');
  if (stack.styledComponents) rows.push('| Styling | styled-components |');

  // State management
  if (stack.rtkQuery) rows.push('| State | Redux Toolkit + RTK Query |');
  else if (stack.redux) rows.push('| State | Redux |');
  if (stack.zustand) rows.push('| State | Zustand |');
  if (stack.jotai) rows.push('| State | Jotai |');
  if (stack.mobx) rows.push('| State | MobX |');
  if (stack.pinia) rows.push('| State | Pinia |');
  if (stack.ngrx) rows.push('| State | NgRx |');
  if (stack.riverpod) rows.push('| State | Riverpod |');
  else if (stack.bloc) rows.push('| State | Bloc |');

  // Data fetching
  if (stack.tanstackQuery) rows.push('| Data Fetching | TanStack Query |');
  if (stack.swr) rows.push('| Data Fetching | SWR |');
  if (stack.apollo) rows.push('| Data Fetching | Apollo Client |');
  if (stack.trpc) rows.push('| API | tRPC |');

  // Forms
  if (stack.formik) rows.push('| Forms | Formik |');
  if (stack.reactHookForm) rows.push('| Forms | React Hook Form |');

  // Validation
  if (stack.zod) rows.push('| Validation | Zod |');
  else if (stack.yup) rows.push('| Validation | Yup |');
  else if (stack.classValidator) rows.push('| Validation | class-validator |');
  else if (stack.pydantic) rows.push('| Validation | Pydantic |');

  // ORM / Database
  if (stack.typeorm) rows.push('| ORM | TypeORM |');
  else if (stack.prisma) rows.push('| ORM | Prisma |');
  else if (stack.drizzle) rows.push('| ORM | Drizzle |');
  else if (stack.sequelize) rows.push('| ORM | Sequelize |');
  else if (stack.mongoose) rows.push('| ORM | Mongoose |');
  else if (stack.sqlalchemy) rows.push('| ORM | SQLAlchemy |');
  else if (stack.eloquent) rows.push('| ORM | Eloquent |');
  else if (stack.doctrine) rows.push('| ORM | Doctrine |');
  else if (stack.gorm) rows.push('| ORM | GORM |');
  else if (stack.diesel) rows.push('| ORM | Diesel |');
  else if (stack.hibernate) rows.push('| ORM | Hibernate |');
  else if (stack.efCore) rows.push('| ORM | Entity Framework Core |');
  else if (stack.activerecord) rows.push('| ORM | ActiveRecord |');

  // Auth
  if (stack.nextAuth) rows.push('| Auth | NextAuth / Auth.js |');
  else if (stack.clerk) rows.push('| Auth | Clerk |');
  else if (stack.supabase) rows.push('| Auth | Supabase |');
  else if (stack.firebase) rows.push('| Auth | Firebase |');
  else if (stack.devise) rows.push('| Auth | Devise |');

  // Testing
  if (stack.vitest) rows.push('| Testing | Vitest |');
  else if (stack.jest) rows.push('| Testing | Jest |');
  if (stack.playwright) rows.push('| E2E Testing | Playwright |');
  else if (stack.cypress) rows.push('| E2E Testing | Cypress |');
  if (stack.pytest) rows.push('| Testing | pytest |');
  if (stack.phpunit) rows.push('| Testing | PHPUnit |');
  else if (stack.pest) rows.push('| Testing | Pest |');
  if (stack.rspec) rows.push('| Testing | RSpec |');
  if (stack.junit) rows.push('| Testing | JUnit |');
  if (stack.xunit) rows.push('| Testing | xUnit |');
  if (stack.testify) rows.push('| Testing | Testify |');

  // Payments
  if (stack.stripe) rows.push('| Payments | Stripe |');

  return rows.join('\n');
}

/**
 * Build the full conditional sections mapping.
 */
function buildConditionalSections(stack) {
  return {
    // Node.js frameworks
    '{{#IF_NODE}}': stack.isNode,
    '{{#IF_NEXTJS}}': stack.nextjs,
    '{{#IF_NESTJS}}': stack.nestjs,
    '{{#IF_VUE}}': stack.vue,
    '{{#IF_ANGULAR}}': stack.angular,
    '{{#IF_SVELTE}}': stack.svelte,
    '{{#IF_ASTRO}}': stack.astro,

    // Node.js libraries
    '{{#IF_RTK_QUERY}}': stack.rtkQuery,
    '{{#IF_REDUX}}': stack.redux && !stack.rtkQuery,
    '{{#IF_ZUSTAND}}': stack.zustand,
    '{{#IF_JOTAI}}': stack.jotai,
    '{{#IF_MOBX}}': stack.mobx,
    '{{#IF_TANSTACK_QUERY}}': stack.tanstackQuery,
    '{{#IF_SWR}}': stack.swr,
    '{{#IF_APOLLO}}': stack.apollo,
    '{{#IF_TRPC}}': stack.trpc,
    '{{#IF_FORMIK}}': stack.formik,
    '{{#IF_REACT_HOOK_FORM}}': stack.reactHookForm,
    '{{#IF_SHADCN}}': stack.shadcn,
    '{{#IF_MUI}}': stack.mui,
    '{{#IF_ANTD}}': stack.antd,
    '{{#IF_CHAKRA}}': stack.chakra,
    '{{#IF_ZOD}}': stack.zod,
    '{{#IF_YUP}}': stack.yup,
    '{{#IF_NICE_MODAL}}': stack.niceModal,
    '{{#IF_CYPRESS}}': stack.cypress,

    // Python
    '{{#IF_PYTHON}}': stack.isPython,
    '{{#IF_DJANGO}}': stack.django,
    '{{#IF_FASTAPI}}': stack.fastapi,
    '{{#IF_FLASK}}': stack.flask,

    // PHP
    '{{#IF_PHP}}': stack.isPHP,
    '{{#IF_LARAVEL}}': stack.laravel,
    '{{#IF_SYMFONY}}': stack.symfony,

    // Go
    '{{#IF_GO}}': stack.isGo,
    '{{#IF_GIN}}': stack.gin,

    // Rust
    '{{#IF_RUST}}': stack.isRust,
    '{{#IF_AXUM}}': stack.axum,

    // Ruby
    '{{#IF_RUBY}}': stack.isRuby,
    '{{#IF_RAILS}}': stack.rails,

    // Java/Kotlin
    '{{#IF_JAVA}}': stack.isJava,
    '{{#IF_SPRING_BOOT}}': stack.springBoot,

    // .NET
    '{{#IF_DOTNET}}': stack.isDotnet,
    '{{#IF_ASPNET}}': stack.aspnet,

    // Dart/Flutter
    '{{#IF_DART}}': stack.isDart,
    '{{#IF_FLUTTER}}': stack.flutter,

    // Swift
    '{{#IF_SWIFT}}': stack.isSwift,
    '{{#IF_SWIFTUI}}': stack.swiftui,

    // Meta
    '{{#IF_FRONTEND}}': stack.isFrontend,
    '{{#IF_BACKEND}}': stack.isBackend,
    '{{#IF_MOBILE}}': stack.isMobile,
  };
}

/**
 * Process a template string with conditional sections and placeholders.
 */
function processTemplate(template, stack, scanResults) {
  let output = template;

  // Replace placeholders
  output = output.replace(/\{\{PROJECT_NAME\}\}/g, stack.name);
  output = output.replace(/\{\{PROJECT_DESCRIPTION\}\}/g, stack.description);
  output = output.replace('{{TECH_STACK_TABLE}}', buildTechStackTable(stack));

  // Learned patterns from scanner
  if (scanResults) {
    output = output.replace('{{LEARNED_PATTERNS}}', formatScanResults(scanResults));
  } else {
    output = output.replace('{{LEARNED_PATTERNS}}', '');
  }

  // Conditional sections
  const conditionalSections = buildConditionalSections(stack);

  for (const [tag, condition] of Object.entries(conditionalSections)) {
    const endTag = tag.replace('#IF_', '/IF_');
    const regex = new RegExp(`${escapeRegex(tag)}([\\s\\S]*?)${escapeRegex(endTag)}`, 'g');

    if (condition) {
      output = output.replace(regex, '$1');
    } else {
      output = output.replace(regex, '');
    }
  }

  // Clean up empty lines
  output = output.replace(/\n{3,}/g, '\n\n');

  return output;
}

/**
 * Write a file with backup if exists, creating directories as needed.
 */
function writeWithBackup(destPath, content) {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(destPath)) {
    fs.copyFileSync(destPath, destPath + '.backup');
  }
  fs.writeFileSync(destPath, content);
}

/**
 * Generate processed content from a template name.
 */
function generateFromTemplate(templateName, stack, scanResults) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  if (!fs.existsSync(templatePath)) return null;
  const template = fs.readFileSync(templatePath, 'utf-8');
  return processTemplate(template, stack, scanResults);
}

// =============================================
// FORMAT DEFINITIONS
// =============================================

// Full content formats — use CLAUDE.md.template (or AGENTS.md.template for AGENTS.md)
const FULL_FORMATS = {
  claude:    { path: 'CLAUDE.md',                         template: 'CLAUDE.md.template' },
  agents:    { path: 'AGENTS.md',                         template: 'AGENTS.md.template' },
  gemini:    { path: 'GEMINI.md',                         template: 'AGENTS.md.template' },
  aider:     { path: 'CONVENTIONS.md',                    template: 'AGENTS.md.template' },
  copilot:   { path: '.github/copilot-instructions.md',   template: 'AGENTS.md.template' },
  cline:     { path: '.clinerules',                       template: 'AGENTS.md.template' },
  zed:       { path: '.rules',                            template: 'AGENTS.md.template' },
  junie:     { path: '.junie/guidelines.md',              template: 'AGENTS.md.template' },
};

// Condensed content formats — use cursorrules.template
const CONDENSED_FORMATS = {
  cursorrules: { path: '.cursorrules',                       template: 'cursorrules.template' },
  amazonq:     { path: '.amazonq/rules/standards.md',        template: 'cursorrules.template' },
  roo:         { path: '.roo/rules/standards.md',            template: 'cursorrules.template' },
  augment:     { path: '.augment/rules/standards.md',        template: 'cursorrules.template' },
  tabnine:     { path: '.tabnine/guidelines/standards.md',   template: 'cursorrules.template' },
  jetbrains:   { path: '.aiassistant/rules/standards.md',    template: 'cursorrules.template' },
};

// Frontmatter-wrapped formats — condensed content with YAML frontmatter prepended
const FRONTMATTER_FORMATS = {
  cursor: {
    path: '.cursor/rules/standards.mdc',
    template: 'cursorrules.template',
    frontmatter: '---\ndescription: Project coding standards and conventions\nglobs:\nalwaysApply: true\n---\n\n',
  },
  windsurf: {
    path: '.windsurf/rules/standards.md',
    template: 'cursorrules.template',
    frontmatter: '---\ntrigger: always_on\n---\n\n',
  },
  continue: {
    path: '.continue/rules/standards.md',
    template: 'cursorrules.template',
    frontmatter: '---\nname: Project Standards\nalwaysApply: true\n---\n\n',
  },
};

// Popular subset
const POPULAR_FORMATS = ['claude', 'agents', 'copilot', 'cursor', 'windsurf', 'gemini'];

/**
 * Get the list of format keys to generate based on the --format flag.
 */
function resolveFormats(format) {
  const allKeys = [
    ...Object.keys(FULL_FORMATS),
    ...Object.keys(CONDENSED_FORMATS),
    ...Object.keys(FRONTMATTER_FORMATS),
  ];

  if (format === 'all') return allKeys;
  if (format === 'popular') return POPULAR_FORMATS;
  if (allKeys.includes(format)) return [format];

  // Default to claude
  return ['claude'];
}

/**
 * Generate all requested output formats.
 */
function generateAllFormats(projectDir, stack, scanResults, format) {
  const formatKeys = resolveFormats(format);
  const generated = [];

  for (const key of formatKeys) {
    let destPath, content;

    if (FULL_FORMATS[key]) {
      const fmt = FULL_FORMATS[key];
      destPath = path.join(projectDir, fmt.path);
      content = generateFromTemplate(fmt.template, stack, scanResults);
    } else if (CONDENSED_FORMATS[key]) {
      const fmt = CONDENSED_FORMATS[key];
      destPath = path.join(projectDir, fmt.path);
      content = generateFromTemplate(fmt.template, stack, scanResults);
    } else if (FRONTMATTER_FORMATS[key]) {
      const fmt = FRONTMATTER_FORMATS[key];
      destPath = path.join(projectDir, fmt.path);
      const body = generateFromTemplate(fmt.template, stack, scanResults);
      if (body) content = fmt.frontmatter + body;
    }

    if (!content) continue;

    // Special handling for CLAUDE.md update mode
    if (key === 'claude' && fs.existsSync(destPath)) {
      const existing = fs.readFileSync(destPath, 'utf-8');
      const autoMarker = '## Learned Patterns <!-- auto-discovered -->';
      if (existing.includes(autoMarker) && scanResults) {
        const newLearnedPatterns = formatScanResults(scanResults);
        const updated = existing.replace(
          /## Learned Patterns <!-- auto-discovered -->[\s\S]*?(?=\n## (?!#)|$)/,
          newLearnedPatterns
        );
        fs.writeFileSync(destPath, updated);
        console.log('  Updated CLAUDE.md (Learned Patterns refreshed, manual edits preserved)');
        generated.push(key);
        continue;
      }
    }

    // For GEMINI.md, replace the title
    if (key === 'gemini') {
      content = content.replace(/^# AGENTS\.md/m, '# GEMINI.md');
    }
    // For CONVENTIONS.md (Aider), replace the title
    if (key === 'aider') {
      content = content.replace(/^# AGENTS\.md/m, '# CONVENTIONS.md');
    }

    writeWithBackup(destPath, content);
    generated.push(key);
    console.log(`  Created ${FULL_FORMATS[key]?.path || CONDENSED_FORMATS[key]?.path || FRONTMATTER_FORMATS[key]?.path}`);
  }

  return generated;
}

// Keep legacy functions for backwards compatibility
function generateClaudeMd(projectDir, stack, scanResults) {
  generateAllFormats(projectDir, stack, scanResults, 'claude');
}
function generateAgentsMd(projectDir, stack, scanResults) {
  generateAllFormats(projectDir, stack, scanResults, 'agents');
}
function generateCursorRules(projectDir, stack, scanResults) {
  generateAllFormats(projectDir, stack, scanResults, 'cursorrules');
}

/**
 * Install agents based on detected stack
 */
function installAgents(projectDir, stack) {
  const agentsDir = path.join(projectDir, '.claude', 'agents');

  // Always install code-guardian and code-learner
  copyTemplate('agents/code-guardian.md', path.join(agentsDir, 'code-guardian.md'));
  console.log('  Installed agent: code-guardian');

  copyTemplate('agents/code-learner.md', path.join(agentsDir, 'code-learner.md'));
  console.log('  Installed agent: code-learner');

  // Frontend-only agents (design-to-code)
  if (stack.isFrontend) {
    copyTemplate('agents/figma-builder.md', path.join(agentsDir, 'figma-builder.md'));
    copyTemplate('agents/figma-validator.md', path.join(agentsDir, 'figma-validator.md'));
    copyTemplate('agents/pen-builder.md', path.join(agentsDir, 'pen-builder.md'));
    copyTemplate('agents/pen-validator.md', path.join(agentsDir, 'pen-validator.md'));
    console.log('  Installed agent: figma-builder');
    console.log('  Installed agent: figma-validator');
    console.log('  Installed agent: pen-builder');
    console.log('  Installed agent: pen-validator');
  }
}

/**
 * Install docs based on detected stack
 */
function installDocs(projectDir, stack) {
  const docsDir = path.join(projectDir, '.claude', 'docs');

  copyTemplate('docs/architectural_patterns.md', path.join(docsDir, 'architectural_patterns.md'));
  console.log('  Installed doc: architectural_patterns');

  if (stack.isFrontend && stack.shadcn) {
    copyTemplate('docs/dashboard_redesign.md', path.join(docsDir, 'dashboard_redesign.md'));
    console.log('  Installed doc: dashboard_redesign');
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  generateAllFormats,
  resolveFormats,
  generateClaudeMd,
  generateAgentsMd,
  generateCursorRules,
  installAgents,
  installDocs,
  copyTemplate,
  processTemplate,
  scanAll,
};
