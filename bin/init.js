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

const detected = [];
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
