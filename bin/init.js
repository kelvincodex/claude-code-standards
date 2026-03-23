#!/usr/bin/env node

const path = require('path');
const { detectStack } = require('../lib/detect');
const { generateClaudeMd, installAgents, installDocs } = require('../lib/install');

const projectDir = process.cwd();

console.log('\n🔍 Claude Code Standards — Initializing...\n');
console.log(`Project: ${projectDir}\n`);

// Step 1: Detect stack
console.log('Detecting tech stack...');
const stack = detectStack(projectDir);

// Log detected language
const languages = [];
if (stack.isNode) languages.push('Node.js');
if (stack.isPython) languages.push('Python');
if (stack.isPHP) languages.push('PHP');
console.log(`  Language: ${languages.join(', ')}`);

const detected = [];
// Node.js
if (stack.nextjs) detected.push('Next.js');
if (stack.react && !stack.nextjs) detected.push('React');
if (stack.nestjs) detected.push('NestJS');
if (stack.express) detected.push('Express');
if (stack.rtkQuery) detected.push('RTK Query');
if (stack.tailwind) detected.push('Tailwind CSS');
if (stack.shadcn) detected.push('Shadcn/UI');
if (stack.niceModal) detected.push('nice-modal-react');
if (stack.zod) detected.push('Zod');
if (stack.typeorm) detected.push('TypeORM');
if (stack.prisma) detected.push('Prisma');
if (stack.stripe) detected.push('Stripe');
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
if (stack.phpunit) detected.push('PHPUnit');
if (stack.pest) detected.push('Pest');

console.log(`  Detected: ${detected.join(', ') || 'No specific stack detected'}`);
console.log(`  Type: ${stack.isFrontend ? 'Frontend' : ''}${stack.isFrontend && stack.isBackend ? ' + ' : ''}${stack.isBackend ? 'Backend' : ''}`);
console.log('');

// Step 2: Generate CLAUDE.md
console.log('Generating CLAUDE.md...');
generateClaudeMd(projectDir, stack);
console.log('  Created CLAUDE.md');

// Step 3: Install agents
console.log('\nInstalling agents...');
installAgents(projectDir, stack);

// Step 4: Install docs
console.log('\nInstalling docs...');
installDocs(projectDir, stack);

console.log('\n✅ Done! Claude Code Standards initialized.');
console.log('\nNext steps:');
console.log('  1. Review CLAUDE.md and customize project-specific sections');
console.log('  2. Run the code-guardian agent to audit your codebase');
console.log('  3. Commit .claude/ directory to your repo\n');
