const fs = require('fs');
const path = require('path');

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
 * Generate CLAUDE.md from template with stack-aware sections
 */
function generateClaudeMd(projectDir, stack) {
  const template = fs.readFileSync(
    path.join(TEMPLATES_DIR, 'CLAUDE.md.template'),
    'utf-8'
  );

  let output = template;

  // Replace placeholders
  output = output.replace(/\{\{PROJECT_NAME\}\}/g, stack.name);
  output = output.replace(/\{\{PROJECT_DESCRIPTION\}\}/g, stack.description);

  // Build tech stack table
  const techStack = [];
  if (stack.nextjs) techStack.push('| Framework | Next.js (App Router) |');
  else if (stack.react) techStack.push('| Framework | React |');
  else if (stack.nestjs) techStack.push('| Framework | NestJS |');
  else if (stack.express) techStack.push('| Framework | Express |');

  if (stack.tailwind) techStack.push('| Styling | Tailwind CSS |');
  if (stack.shadcn) techStack.push('| UI Components | Shadcn/UI |');
  if (stack.rtkQuery) techStack.push('| State | Redux Toolkit + RTK Query |');
  else if (stack.zustand) techStack.push('| State | Zustand |');
  else if (stack.tanstackQuery) techStack.push('| Data Fetching | TanStack Query |');
  if (stack.zod) techStack.push('| Validation | Zod |');
  else if (stack.classValidator) techStack.push('| Validation | class-validator |');
  if (stack.typeorm) techStack.push('| ORM | TypeORM |');
  else if (stack.prisma) techStack.push('| ORM | Prisma |');
  if (stack.stripe) techStack.push('| Payments | Stripe |');

  output = output.replace('{{TECH_STACK_TABLE}}', techStack.join('\n'));

  // Conditional sections
  const conditionalSections = {
    '{{#IF_RTK_QUERY}}': stack.rtkQuery,
    '{{#IF_NEXTJS}}': stack.nextjs,
    '{{#IF_SHADCN}}': stack.shadcn,
    '{{#IF_ZOD}}': stack.zod,
    '{{#IF_NICE_MODAL}}': stack.niceModal,
    '{{#IF_NESTJS}}': stack.nestjs,
    '{{#IF_FRONTEND}}': stack.isFrontend,
    '{{#IF_BACKEND}}': stack.isBackend,
  };

  for (const [tag, condition] of Object.entries(conditionalSections)) {
    const endTag = tag.replace('#IF_', '/IF_');
    const regex = new RegExp(`${escapeRegex(tag)}([\\s\\S]*?)${escapeRegex(endTag)}`, 'g');

    if (condition) {
      // Keep the content, remove the tags
      output = output.replace(regex, '$1');
    } else {
      // Remove the entire section including content
      output = output.replace(regex, '');
    }
  }

  // Clean up empty lines
  output = output.replace(/\n{3,}/g, '\n\n');

  const destPath = path.join(projectDir, 'CLAUDE.md');
  if (fs.existsSync(destPath)) {
    // Backup existing
    fs.copyFileSync(destPath, destPath + '.backup');
    console.log('  Backed up existing CLAUDE.md → CLAUDE.md.backup');
  }
  fs.writeFileSync(destPath, output);
}

/**
 * Install agents based on detected stack
 */
function installAgents(projectDir, stack) {
  const agentsDir = path.join(projectDir, '.claude', 'agents');

  // Always install code-guardian
  copyTemplate('agents/code-guardian.md', path.join(agentsDir, 'code-guardian.md'));
  console.log('  Installed agent: code-guardian');

  // Frontend-only agents
  if (stack.isFrontend) {
    copyTemplate('agents/figma-builder.md', path.join(agentsDir, 'figma-builder.md'));
    copyTemplate('agents/figma-validator.md', path.join(agentsDir, 'figma-validator.md'));
    console.log('  Installed agent: figma-builder');
    console.log('  Installed agent: figma-validator');
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

module.exports = { generateClaudeMd, installAgents, installDocs, copyTemplate };
