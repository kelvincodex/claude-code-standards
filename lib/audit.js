const fs = require('fs');
const path = require('path');
const { collectFiles, readSafe, sampleFiles } = require('./scan');
const { c } = require('./prompt');

/**
 * Extract backtick-wrapped paths from markdown content.
 * Matches paths like `src/components/`, `app/(dashboard)/`, `BaseServiceApi.ts`
 */
function extractPaths(content) {
  const paths = new Set();

  // Remove fenced code blocks (``` ... ```) to avoid grabbing directory tree listings
  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');

  // Backtick-wrapped paths (src/..., app/..., .filename, etc.)
  const backtickMatches = withoutCodeBlocks.match(/`([^`\n]+)`/g) || [];
  for (const m of backtickMatches) {
    const inner = m.slice(1, -1).trim();
    // Skip if too long, contains spaces, looks like code, or is a pattern/example
    if (inner.length > 80 || inner.includes(' ') || inner.includes('(') || inner.includes('{')) continue;
    if (inner.includes('*') || inner.includes('<') || inner.includes('>')) continue; // glob/template patterns
    if (inner.match(/:\d+$/)) continue; // line number references like file.ts:191
    // Filter to things that look like file/dir paths
    if (inner.match(/^(src|app|lib|public|\.?\w+)\// ) ||
        inner.match(/\.(ts|tsx|js|jsx|json|md|yml|yaml|css|mjs|cjs)$/)) {
      // Normalize: remove trailing slashes for dir comparison
      paths.add(inner.replace(/\/$/, ''));
    }
  }
  return [...paths];
}

/**
 * Extract library/package names from markdown tech stack tables and mentions.
 */
function extractLibraries(content) {
  const libs = new Set();
  // Common npm package patterns in backticks
  const pkgMatches = content.match(/`(@[\w-]+\/[\w-]+|[\w-]+)`/g) || [];
  for (const m of pkgMatches) {
    const inner = m.slice(1, -1).trim();
    // Filter to things that look like npm packages (not paths or code)
    if (inner.match(/^@[\w-]+\/[\w-]+$/) || // scoped packages
        (inner.match(/^[\w-]+$/) && !inner.match(/^(src|app|lib|const|let|var|function|return|true|false|null|undefined|class|import|export|from|if|else|for|while|switch|case|break|continue|default|new|this|typeof|instanceof)$/))) {
      libs.add(inner);
    }
  }
  return [...libs];
}

/**
 * Check if a path exists relative to the project directory.
 * Handles parenthesized route groups like (dashboard) by checking both forms.
 */
function pathExists(projectDir, docPath) {
  const full = path.join(projectDir, docPath);
  if (fs.existsSync(full)) return true;
  // Also check without parentheses for Next.js route groups
  const withoutParens = docPath.replace(/\(([^)]+)\)/g, '$1');
  if (withoutParens !== docPath) {
    return fs.existsSync(path.join(projectDir, withoutParens));
  }
  return false;
}

/**
 * Find a file anywhere in the project (recursive search).
 */
function findFileAnywhere(projectDir, filename) {
  const skipDirs = new Set([
    'node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage',
    '__pycache__', '.venv', 'vendor', '.cache', '.turbo',
  ]);

  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return false; }
    for (const entry of entries) {
      if (entry.isDirectory() && !skipDirs.has(entry.name) && !entry.name.startsWith('.')) {
        if (walk(path.join(dir, entry.name))) return true;
      } else if (entry.name === filename) {
        return true;
      }
    }
    return false;
  }

  return walk(projectDir);
}

/**
 * Check Redux dispatch pattern compliance.
 */
function checkReduxDispatch(projectDir) {
  const exts = ['.ts', '.tsx', '.js', '.jsx'];
  const files = collectFiles(projectDir, exts, 200);
  let actionsCount = 0;
  let mutationCount = 0;

  for (const file of files) {
    const content = readSafe(file);
    if (!content) continue;
    const actionsMatches = content.match(/\.actions\.\w+\(/g);
    if (actionsMatches) actionsCount += actionsMatches.length;
    const mutationMatches = content.match(/\.mutation\.\w+\(/g);
    if (mutationMatches) mutationCount += mutationMatches.length;
  }

  return { actionsCount, mutationCount };
}

/**
 * Check for inline Zod schemas outside validation directory.
 */
function checkInlineZodSchemas(projectDir) {
  const exts = ['.ts', '.tsx'];
  const files = collectFiles(projectDir, exts, 200);
  const violations = [];

  for (const file of files) {
    const relPath = path.relative(projectDir, file);
    // Skip files inside validation directories
    if (relPath.includes('validation/') || relPath.includes('validation\\')) continue;
    const content = readSafe(file);
    if (!content) continue;
    if (content.match(/z\.(object|string|number|array|enum|boolean|union|intersection|tuple)\s*\(/)) {
      violations.push(relPath);
    }
  }

  return violations;
}

/**
 * Check for inline types in service files.
 */
function checkInlineTypesInServices(projectDir) {
  const servicesDirs = ['src/services', 'services', 'src/api'];
  const violations = [];

  for (const dir of servicesDirs) {
    const fullDir = path.join(projectDir, dir);
    if (!fs.existsSync(fullDir)) continue;
    const files = collectFiles(fullDir, ['.ts', '.tsx'], 100);
    for (const file of files) {
      const content = readSafe(file);
      if (!content) continue;
      const typeMatches = content.match(/^(export\s+)?(interface|type)\s+\w+/gm);
      if (typeMatches && typeMatches.length > 0) {
        violations.push({
          path: path.relative(projectDir, file),
          count: typeMatches.length,
        });
      }
    }
  }

  return violations;
}

/**
 * Check for forbidden dependencies.
 */
function checkForbiddenDeps(projectDir, docContent) {
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];
  let pkg;
  try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')); } catch { return []; }
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  const violations = [];
  // Check for "Do not add X" / "No X" patterns
  const forbiddenPatterns = docContent.match(/(?:do not add|no|never use|don't add|do NOT add)\s+[`"]?(@[\w-]+\/[\w-]+|[\w-]+)[`"]?/gi) || [];
  for (const pattern of forbiddenPatterns) {
    const match = pattern.match(/[`"]?(@[\w-]+\/[\w-]+|[\w-]+)[`"]?$/);
    if (match && allDeps[match[1]]) {
      violations.push(match[1]);
    }
  }

  return violations;
}

/**
 * Check console.log debris.
 */
function checkConsoleLogs(projectDir) {
  const exts = ['.ts', '.tsx', '.js', '.jsx'];
  const files = collectFiles(projectDir, exts, 200);
  let total = 0;
  const fileResults = [];

  for (const file of files) {
    const content = readSafe(file);
    if (!content) continue;
    const matches = content.match(/console\.(log|warn|error)\s*\(/g);
    if (matches) {
      total += matches.length;
      fileResults.push({ path: path.relative(projectDir, file), count: matches.length });
    }
  }

  fileResults.sort((a, b) => b.count - a.count);
  return { total, files: fileResults };
}

/**
 * Run a full audit of existing documentation against the codebase.
 */
function auditProject(projectDir) {
  const results = { pass: [], warn: [], fail: [] };

  // Find docs to audit
  const docFiles = ['CLAUDE.md', 'AGENTS.md'].filter(f =>
    fs.existsSync(path.join(projectDir, f))
  );

  if (docFiles.length === 0) {
    results.fail.push('No CLAUDE.md or AGENTS.md found to audit');
    return results;
  }

  // Read all doc content
  let docContent = '';
  for (const f of docFiles) {
    docContent += '\n' + fs.readFileSync(path.join(projectDir, f), 'utf-8');
  }

  // 1. Phantom path detection
  const paths = extractPaths(docContent);
  const phantomDirs = [];
  const phantomFiles = [];

  for (const p of paths) {
    // Skip short bare names without directory prefix (likely examples in docs)
    // e.g., `JobsForYou.tsx`, `job-posting-service.ts` are example names
    const hasDir = p.includes('/');

    // Determine if it's a file or directory reference
    const isFile = p.match(/\.\w+$/);
    if (isFile) {
      // Only check files that have a directory path (src/..., .claude/...)
      if (!hasDir) continue;
      const exactPath = path.join(projectDir, p);
      if (!fs.existsSync(exactPath)) {
        phantomFiles.push(p);
      }
    } else {
      // Only check directory references that start with known prefixes
      if (!hasDir && !['app', 'src', 'lib', 'public', 'config', 'test', 'tests'].includes(p)) continue;
      if (!pathExists(projectDir, p)) {
        phantomDirs.push(p);
      }
    }
  }

  if (phantomDirs.length > 0) {
    for (const d of phantomDirs) {
      results.fail.push(`Phantom directory: ${d}/ — referenced in docs but does not exist`);
    }
  }
  if (phantomFiles.length > 0) {
    for (const f of phantomFiles) {
      results.fail.push(`Phantom file: ${f} — referenced in docs but not found`);
    }
  }
  if (phantomDirs.length === 0 && phantomFiles.length === 0) {
    results.pass.push(`All ${paths.length} referenced paths exist`);
  }

  // 2. Redux dispatch pattern
  const redux = checkReduxDispatch(projectDir);
  if (redux.actionsCount === 0 && redux.mutationCount > 0) {
    results.pass.push(`Redux dispatch pattern: .mutation. used (${redux.mutationCount}x), no .actions. violations`);
  } else if (redux.actionsCount > 0) {
    results.fail.push(`Redux dispatch: ${redux.actionsCount} .actions. usages (should use .mutation.)`);
  }

  // 3. Inline Zod schemas
  const zodViolations = checkInlineZodSchemas(projectDir);
  if (zodViolations.length === 0) {
    results.pass.push('Zod schemas centralized (none found outside validation/)');
  } else {
    results.warn.push(`Inline Zod schemas in ${zodViolations.length} file(s): ${zodViolations.slice(0, 3).join(', ')}`);
  }

  // 4. Inline types in services
  const typeViolations = checkInlineTypesInServices(projectDir);
  if (typeViolations.length === 0) {
    results.pass.push('No inline types in service files');
  } else {
    results.warn.push(`Inline types in ${typeViolations.length} service file(s): ${typeViolations.map(v => v.path).slice(0, 3).join(', ')}`);
  }

  // 5. Forbidden dependencies
  const forbiddenDeps = checkForbiddenDeps(projectDir, docContent);
  if (forbiddenDeps.length === 0) {
    results.pass.push('No forbidden dependencies installed');
  } else {
    for (const dep of forbiddenDeps) {
      results.fail.push(`Forbidden dependency installed: ${dep}`);
    }
  }

  // 6. Console.log debris
  const consoleLogs = checkConsoleLogs(projectDir);
  if (consoleLogs.total === 0) {
    results.pass.push('No console.log debris');
  } else {
    const worst = consoleLogs.files[0];
    results.warn.push(`Console.log debris: ${consoleLogs.total} across ${consoleLogs.files.length} file(s)${worst ? ` (worst: ${worst.path} — ${worst.count})` : ''}`);
  }

  // 7. TODO/FIXME count
  const exts = ['.ts', '.tsx', '.js', '.jsx'];
  const allFiles = collectFiles(projectDir, exts, 200);
  let todoTotal = 0;
  for (const file of allFiles) {
    const content = readSafe(file);
    if (!content) continue;
    const matches = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX)\b/g);
    if (matches) todoTotal += matches.length;
  }
  if (todoTotal === 0) {
    results.pass.push('No TODO/FIXME comments');
  } else if (todoTotal <= 5) {
    results.pass.push(`Minimal TODOs: ${todoTotal} found`);
  } else {
    results.warn.push(`TODO/FIXME comments: ${todoTotal} found`);
  }

  return results;
}

/**
 * Print a formatted audit report.
 */
function printAuditReport(results) {
  console.log(`\n${c.bold('📋 Documentation Audit Report')}\n`);

  if (results.pass.length > 0) {
    console.log(`${c.green(`✅ PASS (${results.pass.length})`)}`);
    for (const msg of results.pass) {
      console.log(`  ${c.green('✔')} ${msg}`);
    }
  }

  if (results.warn.length > 0) {
    console.log(`\n${c.yellow(`⚠️  WARN (${results.warn.length})`)}`);
    for (const msg of results.warn) {
      console.log(`  ${c.yellow('⚠')} ${msg}`);
    }
  }

  if (results.fail.length > 0) {
    console.log(`\n${c.red(`❌ FAIL (${results.fail.length})`)}`);
    for (const msg of results.fail) {
      console.log(`  ${c.red('✖')} ${msg}`);
    }
  }

  const total = results.pass.length + results.warn.length + results.fail.length;
  const score = Math.round((results.pass.length / total) * 100);
  console.log(`\n${c.bold('Score:')} ${score >= 80 ? c.green(score + '%') : score >= 50 ? c.yellow(score + '%') : c.red(score + '%')} (${results.pass.length}/${total} checks passed)\n`);

  return results.fail.length;
}

module.exports = { auditProject, printAuditReport, extractPaths, extractLibraries };
