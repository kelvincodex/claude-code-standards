const fs = require('fs');
const path = require('path');

// Directories to always skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build', 'out',
  'vendor', '__pycache__', '.venv', 'venv', 'env',
  '.idea', '.vscode', '.gradle', 'target', 'bin', 'obj',
  'coverage', '.cache', '.turbo', '.output', '.vercel',
  'Pods', '.dart_tool', '.flutter-plugins',
]);

// File extensions by language
const EXTENSIONS = {
  js: ['.js', '.jsx', '.mjs', '.cjs'],
  ts: ['.ts', '.tsx'],
  python: ['.py'],
  php: ['.php'],
  go: ['.go'],
  rust: ['.rs'],
  ruby: ['.rb'],
  java: ['.java'],
  csharp: ['.cs'],
  dart: ['.dart'],
  swift: ['.swift'],
  kotlin: ['.kt', '.kts'],
};

/**
 * Recursively collect files matching given extensions, up to a limit.
 */
function collectFiles(dir, extensions, limit = 200) {
  const results = [];

  function walk(d) {
    if (results.length >= limit) return;
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (results.length >= limit) return;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          walk(path.join(d, entry.name));
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        results.push(path.join(d, entry.name));
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Read a file safely, return content or null.
 */
function readSafe(filePath, maxSize = 100000) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > maxSize) return null;
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Sample up to N files from a list (evenly distributed).
 */
function sampleFiles(files, n = 30) {
  if (files.length <= n) return files;
  const step = Math.floor(files.length / n);
  const sampled = [];
  for (let i = 0; i < files.length && sampled.length < n; i += step) {
    sampled.push(files[i]);
  }
  return sampled;
}

/**
 * Determine the dominant value in a frequency map.
 */
function dominant(freqMap) {
  let max = 0;
  let result = null;
  for (const [key, count] of Object.entries(freqMap)) {
    if (count > max) {
      max = count;
      result = key;
    }
  }
  return result;
}

/**
 * Detect which language extensions are present in the project.
 */
function detectLanguageExtensions(projectDir) {
  const found = {};
  for (const [lang, exts] of Object.entries(EXTENSIONS)) {
    const files = collectFiles(projectDir, exts, 5);
    if (files.length > 0) found[lang] = exts;
  }
  return found;
}

/**
 * Get all relevant source extensions for this project.
 */
function getProjectExtensions(stack) {
  const exts = [];
  if (stack.isNode) exts.push(...EXTENSIONS.js, ...EXTENSIONS.ts);
  if (stack.isPython) exts.push(...EXTENSIONS.python);
  if (stack.isPHP) exts.push(...EXTENSIONS.php);
  if (stack.isGo) exts.push(...EXTENSIONS.go);
  if (stack.isRust) exts.push(...EXTENSIONS.rust);
  if (stack.isRuby) exts.push(...EXTENSIONS.ruby);
  if (stack.isJava) exts.push(...EXTENSIONS.java);
  if (stack.isDotnet) exts.push(...EXTENSIONS.csharp);
  if (stack.isDart) exts.push(...EXTENSIONS.dart);
  if (stack.isSwift) exts.push(...EXTENSIONS.swift);
  // Fallback: detect what's actually in the project
  if (exts.length === 0) {
    const detected = detectLanguageExtensions(projectDir);
    for (const langExts of Object.values(detected)) {
      exts.push(...langExts);
    }
  }
  return [...new Set(exts)];
}

// =============================================
// SCANNERS
// =============================================

/**
 * Scan project structure — discover where things live.
 */
function scanProjectStructure(projectDir) {
  const structure = {};
  const knownDirs = {
    components: ['src/components', 'app/components', 'components', 'src/app/components'],
    pages: ['src/pages', 'app', 'pages', 'src/app'],
    services: ['src/services', 'src/api', 'services', 'api', 'lib/api'],
    models: ['src/models', 'src/types', 'models', 'types', 'src/interfaces', 'src/entities', 'app/Models'],
    utils: ['src/utils', 'src/helpers', 'src/lib', 'utils', 'helpers', 'lib'],
    hooks: ['src/hooks', 'hooks', 'src/composables', 'composables'],
    tests: ['__tests__', 'tests', 'test', 'spec', 'src/__tests__'],
    config: ['config', 'src/config'],
    middleware: ['src/middleware', 'middleware', 'app/Http/Middleware'],
    controllers: ['src/controllers', 'app/Http/Controllers', 'app/controllers'],
    views: ['src/views', 'views', 'app/views', 'resources/views'],
    routes: ['src/routes', 'routes', 'app/routes', 'config/routes'],
    migrations: ['migrations', 'database/migrations', 'prisma/migrations', 'src/migrations'],
    store: ['src/store', 'store', 'src/stores', 'stores', 'src/state'],
    styles: ['src/styles', 'styles', 'css', 'src/css'],
    assets: ['src/assets', 'assets', 'public/assets', 'public'],
  };

  for (const [role, candidates] of Object.entries(knownDirs)) {
    for (const candidate of candidates) {
      const fullPath = path.join(projectDir, candidate);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        structure[role] = candidate;
        break;
      }
    }
  }

  return structure;
}

/**
 * Scan naming conventions from file names and code.
 */
function scanNamingConventions(projectDir, files) {
  const fileNamePatterns = { kebab: 0, pascal: 0, camel: 0, snake: 0 };
  const functionPatterns = { camel: 0, snake: 0, pascal: 0 };
  const constantPatterns = { upper_snake: 0, camel: 0 };

  for (const file of sampleFiles(files, 40)) {
    const basename = path.basename(file, path.extname(file));

    // Classify file naming
    if (/^[a-z]+(-[a-z]+)+$/.test(basename)) fileNamePatterns.kebab++;
    else if (/^[A-Z][a-zA-Z0-9]+$/.test(basename)) fileNamePatterns.pascal++;
    else if (/^[a-z][a-zA-Z0-9]+$/.test(basename)) fileNamePatterns.camel++;
    else if (/^[a-z]+(_[a-z]+)+$/.test(basename)) fileNamePatterns.snake++;

    // Analyze code content
    const content = readSafe(file);
    if (!content) continue;

    // Function names
    const fnMatches = content.match(/(?:function|const|let|var|def|fn|func)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
    if (fnMatches) {
      for (const m of fnMatches) {
        const name = m.split(/\s+/).pop();
        if (!name || name.length < 3) continue;
        if (/^[a-z][a-zA-Z0-9]+$/.test(name) && name !== name.toLowerCase()) functionPatterns.camel++;
        else if (/^[a-z]+(_[a-z]+)+$/.test(name)) functionPatterns.snake++;
        else if (/^[A-Z][a-zA-Z0-9]+$/.test(name)) functionPatterns.pascal++;
      }
    }

    // Constants
    const constMatches = content.match(/(?:const|final|static)\s+([A-Z][A-Z0-9_]+)\s*=/g);
    if (constMatches) constantPatterns.upper_snake += constMatches.length;
  }

  return {
    fileNaming: dominant(fileNamePatterns),
    functionNaming: dominant(functionPatterns),
    constants: dominant(constantPatterns) === 'upper_snake' ? 'UPPER_SNAKE_CASE' : 'camelCase',
  };
}

/**
 * Scan import patterns.
 */
function scanImportPatterns(projectDir, files) {
  const patterns = {
    pathAlias: null,
    barrelExports: 0,
    relativeImports: 0,
    absoluteImports: 0,
  };

  const aliasPatterns = {};

  for (const file of sampleFiles(files, 30)) {
    const content = readSafe(file);
    if (!content) continue;

    // Detect path aliases
    const aliasMatches = content.match(/from\s+['"](@[^'"\/]+|~|#)[^'"]*['"]/g);
    if (aliasMatches) {
      for (const m of aliasMatches) {
        const alias = m.match(/['"]([^'"]+)['"]/)[1].split('/')[0];
        aliasPatterns[alias] = (aliasPatterns[alias] || 0) + 1;
      }
    }

    // Relative vs absolute imports
    const relMatches = content.match(/from\s+['"]\.\//g);
    const relDeepMatches = content.match(/from\s+['"]\.\.\//g);
    if (relMatches) patterns.relativeImports += relMatches.length;
    if (relDeepMatches) patterns.relativeImports += relDeepMatches.length;

    // Python absolute imports
    const pyAbsMatches = content.match(/^from\s+[a-zA-Z]/gm);
    if (pyAbsMatches) patterns.absoluteImports += pyAbsMatches.length;
  }

  // Detect barrel exports (index files)
  const indexFiles = collectFiles(projectDir, ['index.ts', 'index.js', 'index.tsx', '__init__.py'], 50);
  patterns.barrelExports = indexFiles.length;

  // Dominant alias
  patterns.pathAlias = dominant(aliasPatterns);

  return patterns;
}

/**
 * Scan code style (semicolons, quotes, indentation).
 */
function scanCodeStyle(projectDir, files) {
  let semicolons = 0;
  let noSemicolons = 0;
  let singleQuotes = 0;
  let doubleQuotes = 0;
  let tabs = 0;
  let spaces2 = 0;
  let spaces4 = 0;
  let trailingCommas = 0;
  let noTrailingCommas = 0;

  for (const file of sampleFiles(files, 20)) {
    const content = readSafe(file);
    if (!content) continue;
    const lines = content.split('\n');

    for (const line of lines.slice(0, 100)) {
      const trimmed = line.trimEnd();
      if (!trimmed) continue;

      // Semicolons (JS/TS only)
      if (trimmed.endsWith(';')) semicolons++;
      else if (trimmed.match(/^(?:const|let|var|import|export|return)\b/) && !trimmed.endsWith('{') && !trimmed.endsWith(',')) {
        noSemicolons++;
      }

      // Quotes
      const sq = (trimmed.match(/'/g) || []).length;
      const dq = (trimmed.match(/"/g) || []).length;
      if (sq > dq) singleQuotes++;
      else if (dq > sq) doubleQuotes++;

      // Indentation
      if (line.startsWith('\t')) tabs++;
      else if (line.startsWith('  ') && !line.startsWith('    ')) spaces2++;
      else if (line.startsWith('    ')) spaces4++;
    }

    // Trailing commas (check array/object endings)
    const tcMatches = content.match(/,\s*[\]\}]/g);
    const ntcMatches = content.match(/[^\s,]\s*[\]\}]/g);
    if (tcMatches) trailingCommas += tcMatches.length;
    if (ntcMatches) noTrailingCommas += ntcMatches.length;
  }

  return {
    semicolons: semicolons > noSemicolons ? 'yes' : 'no',
    quotes: singleQuotes > doubleQuotes ? 'single' : 'double',
    indentation: tabs > spaces2 + spaces4 ? 'tabs' : (spaces2 > spaces4 ? '2 spaces' : '4 spaces'),
    trailingCommas: trailingCommas > noTrailingCommas ? 'yes' : 'no',
  };
}

/**
 * Scan testing patterns.
 */
function scanTestingPatterns(projectDir, stack) {
  const testExtensions = ['.test.ts', '.test.tsx', '.test.js', '.test.jsx',
    '.spec.ts', '.spec.tsx', '.spec.js', '.spec.jsx',
    '_test.go', '_test.py', 'Test.java', 'Test.php'];

  const patterns = {
    location: null,
    namingConvention: null,
    framework: null,
  };

  // Detect test file naming
  const testFiles = collectFiles(projectDir, ['.test.', '.spec.', '_test.', 'Test.'], 50);
  const specCount = testFiles.filter(f => f.includes('.spec.')).length;
  const testCount = testFiles.filter(f => f.includes('.test.') || f.includes('_test.') || f.includes('Test.')).length;
  patterns.namingConvention = specCount > testCount ? '*.spec.*' : '*.test.*';

  // Detect location (colocated vs separate)
  const hasTestDir = fs.existsSync(path.join(projectDir, '__tests__')) ||
    fs.existsSync(path.join(projectDir, 'tests')) ||
    fs.existsSync(path.join(projectDir, 'test'));
  const colocatedTests = testFiles.filter(f =>
    f.includes('/src/') || f.includes('/app/') || f.includes('/lib/')
  ).length;

  if (colocatedTests > testFiles.length * 0.5) {
    patterns.location = 'colocated (next to source files)';
  } else if (hasTestDir) {
    patterns.location = 'separate directory';
  }

  // Test framework (from stack detection)
  if (stack.vitest) patterns.framework = 'Vitest';
  else if (stack.jest) patterns.framework = 'Jest';
  else if (stack.pytest) patterns.framework = 'pytest';
  else if (stack.phpunit) patterns.framework = 'PHPUnit';
  else if (stack.pest) patterns.framework = 'Pest';
  else if (stack.rspec) patterns.framework = 'RSpec';

  return patterns;
}

/**
 * Scan error handling patterns.
 */
function scanErrorHandling(projectDir, files) {
  const patterns = {
    customErrorClasses: [],
    tryCatchStyle: null,
    errorResponseFormat: null,
  };

  for (const file of sampleFiles(files, 30)) {
    const content = readSafe(file);
    if (!content) continue;

    // Custom error classes
    const errorClassMatches = content.match(/class\s+(\w*Error\w*)\s+extends\s+(?:Error|Exception|RuntimeException|BaseException)/g);
    if (errorClassMatches) {
      for (const m of errorClassMatches) {
        const name = m.match(/class\s+(\w+)/)[1];
        if (!patterns.customErrorClasses.includes(name)) {
          patterns.customErrorClasses.push(name);
        }
      }
    }

    // Error response format (look for common API response shapes)
    const responseShapes = content.match(/\{\s*(?:error|message|status|data|success)\s*[:=]/g);
    if (responseShapes && responseShapes.length > 0) {
      const hasData = content.includes('"data"') || content.includes("'data'") || content.includes('.data');
      const hasMessage = content.includes('"message"') || content.includes("'message'") || content.includes('.message');
      const hasError = content.includes('"error"') || content.includes("'error'") || content.includes('.error');
      const hasSuccess = content.includes('"success"') || content.includes("'success'") || content.includes('.success');

      if (hasData && hasMessage) {
        patterns.errorResponseFormat = '{ data, message }';
      } else if (hasSuccess && hasData) {
        patterns.errorResponseFormat = '{ success, data, error }';
      }
    }
  }

  return patterns;
}

/**
 * Scan component patterns (frontend).
 */
function scanComponentPatterns(projectDir, files) {
  const patterns = {
    style: null, // functional, class, mixed
    stylingApproach: null, // tailwind, css-modules, styled-components, etc.
    propsStyle: null, // inline, separate interface
  };

  let functional = 0;
  let classBased = 0;
  let tailwind = 0;
  let cssModules = 0;
  let styledComponents = 0;
  let inlineProps = 0;
  let separateProps = 0;

  const componentFiles = files.filter(f =>
    f.endsWith('.tsx') || f.endsWith('.jsx') || f.endsWith('.vue') || f.endsWith('.svelte')
  );

  for (const file of sampleFiles(componentFiles, 25)) {
    const content = readSafe(file);
    if (!content) continue;

    // Functional vs class
    if (content.match(/(?:export\s+(?:default\s+)?)?function\s+[A-Z]|const\s+[A-Z]\w+\s*[=:]\s*(?:\([^)]*\)|[A-Z]\w*)\s*=>/)) {
      functional++;
    }
    if (content.match(/class\s+\w+\s+extends\s+(?:React\.)?(?:Component|PureComponent)/)) {
      classBased++;
    }

    // Styling approach
    if (content.includes('className=') && content.match(/["'`](?:[^"'`]*\s)?(?:flex|grid|p-|m-|text-|bg-|w-|h-)/)) {
      tailwind++;
    }
    if (content.match(/import\s+\w+\s+from\s+['"].*\.module\.(css|scss|less)['"]/)) {
      cssModules++;
    }
    if (content.includes('styled.') || content.includes('styled(')) {
      styledComponents++;
    }

    // Props style
    if (content.match(/(?:interface|type)\s+\w+Props\s*[{=]/)) {
      separateProps++;
    }
    if (content.match(/\(\s*\{[^}]+\}\s*:\s*\{[^}]+\}\s*\)/)) {
      inlineProps++;
    }
  }

  patterns.style = classBased > functional ? 'class-based' : 'functional';
  patterns.propsStyle = separateProps > inlineProps ? 'separate interface' : 'inline';

  if (tailwind > cssModules && tailwind > styledComponents) patterns.stylingApproach = 'Tailwind CSS';
  else if (cssModules > styledComponents) patterns.stylingApproach = 'CSS Modules';
  else if (styledComponents > 0) patterns.stylingApproach = 'styled-components';

  return patterns;
}

/**
 * Scan API patterns.
 */
function scanAPIPatterns(projectDir, files) {
  const patterns = {
    style: null, // REST, GraphQL, tRPC
    endpointNaming: null,
    responseShape: null,
  };

  let restCount = 0;
  let graphqlCount = 0;
  let trpcCount = 0;

  for (const file of sampleFiles(files, 30)) {
    const content = readSafe(file);
    if (!content) continue;

    // REST patterns
    if (content.match(/app\.(get|post|put|patch|delete)\s*\(|@(Get|Post|Put|Patch|Delete)\b|Route::(get|post|put|patch|delete)/)) {
      restCount++;
    }

    // GraphQL
    if (content.match(/gql`|graphql`|@Query\(|@Mutation\(|type\s+Query\s*\{/)) {
      graphqlCount++;
    }

    // tRPC
    if (content.match(/\.query\(|\.mutation\(|createTRPCRouter|publicProcedure/)) {
      trpcCount++;
    }

    // Endpoint naming (look for route definitions)
    const routeMatches = content.match(/['"`](\/api\/[^'"`]+)['"`]/g);
    if (routeMatches && routeMatches.length > 2) {
      const hasVersion = routeMatches.some(r => r.match(/\/v\d+\//));
      patterns.endpointNaming = hasVersion ? 'versioned (/api/v1/...)' : 'unversioned (/api/...)';
    }
  }

  if (restCount > graphqlCount && restCount > trpcCount) patterns.style = 'REST';
  else if (graphqlCount > trpcCount) patterns.style = 'GraphQL';
  else if (trpcCount > 0) patterns.style = 'tRPC';

  return patterns;
}

/**
 * Detect existing lint/format configurations.
 */
function scanExistingConfigs(projectDir) {
  const configs = [];

  const configFiles = {
    'ESLint': ['eslint.config.js', 'eslint.config.mjs', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc'],
    'Prettier': ['.prettierrc', '.prettierrc.js', '.prettierrc.json', '.prettierrc.yml', 'prettier.config.js'],
    'Biome': ['biome.json', 'biome.jsonc'],
    'EditorConfig': ['.editorconfig'],
    'Ruff': ['ruff.toml', '.ruff.toml', 'pyproject.toml'],
    'RuboCop': ['.rubocop.yml'],
    'golangci-lint': ['.golangci.yml', '.golangci.yaml'],
    'rustfmt': ['rustfmt.toml', '.rustfmt.toml'],
    'Clippy': ['clippy.toml', '.clippy.toml'],
    'PHPStan': ['phpstan.neon', 'phpstan.neon.dist'],
    'PHP CS Fixer': ['.php-cs-fixer.php', '.php-cs-fixer.dist.php'],
    'StyleLint': ['.stylelintrc', '.stylelintrc.json', '.stylelintrc.js'],
    'TypeScript': ['tsconfig.json'],
    'Tailwind': ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs'],
  };

  for (const [name, files] of Object.entries(configFiles)) {
    for (const file of files) {
      if (fs.existsSync(path.join(projectDir, file))) {
        configs.push({ name, file });
        break;
      }
    }
  }

  return configs;
}

/**
 * Detect CI/CD setup.
 */
function scanCI(projectDir) {
  const ci = [];

  const ciConfigs = {
    'GitHub Actions': ['.github/workflows'],
    'GitLab CI': ['.gitlab-ci.yml'],
    'Jenkins': ['Jenkinsfile'],
    'CircleCI': ['.circleci/config.yml', '.circleci'],
    'Travis CI': ['.travis.yml'],
    'Vercel': ['vercel.json'],
    'Netlify': ['netlify.toml'],
    'Docker': ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
    'Fly.io': ['fly.toml'],
    'Railway': ['railway.json'],
  };

  for (const [name, paths] of Object.entries(ciConfigs)) {
    for (const p of paths) {
      if (fs.existsSync(path.join(projectDir, p))) {
        ci.push(name);
        break;
      }
    }
  }

  return ci;
}

/**
 * Detect monorepo setup.
 */
function scanMonorepo(projectDir) {
  const indicators = {
    'Turborepo': 'turbo.json',
    'Nx': 'nx.json',
    'Lerna': 'lerna.json',
    'Rush': 'rush.json',
    'pnpm workspaces': 'pnpm-workspace.yaml',
  };

  for (const [tool, file] of Object.entries(indicators)) {
    if (fs.existsSync(path.join(projectDir, file))) {
      return { isMonorepo: true, tool };
    }
  }

  // Check package.json workspaces
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.workspaces) {
        return { isMonorepo: true, tool: 'npm/yarn workspaces' };
      }
    } catch {}
  }

  return { isMonorepo: false, tool: null };
}

// =============================================
// MAIN SCANNER
// =============================================

/**
 * Run all scanners and return a structured result.
 */
function scanAll(projectDir, stack) {
  const exts = getProjectExtensions(stack);
  const allFiles = collectFiles(projectDir, exts, 200);

  console.log(`  Scanning ${allFiles.length} files...`);

  const results = {
    projectStructure: scanProjectStructure(projectDir),
    namingConventions: scanNamingConventions(projectDir, allFiles),
    importPatterns: scanImportPatterns(projectDir, allFiles),
    codeStyle: scanCodeStyle(projectDir, allFiles),
    testingPatterns: scanTestingPatterns(projectDir, stack),
    errorHandling: scanErrorHandling(projectDir, allFiles),
    apiPatterns: scanAPIPatterns(projectDir, allFiles),
    componentPatterns: (stack.isFrontend) ? scanComponentPatterns(projectDir, allFiles) : null,
    existingConfigs: scanExistingConfigs(projectDir),
    ci: scanCI(projectDir),
    monorepo: scanMonorepo(projectDir),
  };

  return results;
}

/**
 * Format scan results as Markdown for injection into CLAUDE.md.
 */
function formatScanResults(results) {
  const lines = [];

  lines.push('## Learned Patterns <!-- auto-discovered -->');
  lines.push('');
  lines.push('> These patterns were auto-discovered from your codebase. Manual edits outside this section are preserved on re-run.');
  lines.push('');

  // Project Structure
  if (Object.keys(results.projectStructure).length > 0) {
    lines.push('### Project Structure');
    for (const [role, dir] of Object.entries(results.projectStructure)) {
      lines.push(`- **${role}**: \`${dir}/\``);
    }
    lines.push('');
  }

  // Naming Conventions
  const nc = results.namingConventions;
  if (nc.fileNaming || nc.functionNaming) {
    lines.push('### Naming Conventions');
    if (nc.fileNaming) lines.push(`- File naming: \`${nc.fileNaming}\``);
    if (nc.functionNaming) lines.push(`- Function naming: \`${nc.functionNaming}\``);
    if (nc.constants) lines.push(`- Constants: \`${nc.constants}\``);
    lines.push('');
  }

  // Import Patterns
  const ip = results.importPatterns;
  if (ip.pathAlias || ip.barrelExports > 0) {
    lines.push('### Import Style');
    if (ip.pathAlias) lines.push(`- Path alias: \`${ip.pathAlias}\``);
    if (ip.barrelExports > 5) lines.push(`- Barrel exports: yes (${ip.barrelExports} index files found)`);
    if (ip.relativeImports > ip.absoluteImports) lines.push('- Import style: relative imports preferred');
    else if (ip.absoluteImports > ip.relativeImports) lines.push('- Import style: absolute imports preferred');
    lines.push('');
  }

  // Code Style
  const cs = results.codeStyle;
  lines.push('### Code Style');
  lines.push(`- Semicolons: ${cs.semicolons}`);
  lines.push(`- Quotes: ${cs.quotes}`);
  lines.push(`- Indentation: ${cs.indentation}`);
  lines.push(`- Trailing commas: ${cs.trailingCommas}`);
  lines.push('');

  // Testing
  const tp = results.testingPatterns;
  if (tp.framework || tp.location) {
    lines.push('### Testing');
    if (tp.framework) lines.push(`- Framework: ${tp.framework}`);
    if (tp.namingConvention) lines.push(`- File naming: \`${tp.namingConvention}\``);
    if (tp.location) lines.push(`- Location: ${tp.location}`);
    lines.push('');
  }

  // Error Handling
  const eh = results.errorHandling;
  if (eh.customErrorClasses.length > 0 || eh.errorResponseFormat) {
    lines.push('### Error Handling');
    if (eh.customErrorClasses.length > 0) {
      lines.push(`- Custom error classes: ${eh.customErrorClasses.join(', ')}`);
    }
    if (eh.errorResponseFormat) {
      lines.push(`- API error response shape: \`${eh.errorResponseFormat}\``);
    }
    lines.push('');
  }

  // API Patterns
  const ap = results.apiPatterns;
  if (ap.style) {
    lines.push('### API Patterns');
    lines.push(`- Style: ${ap.style}`);
    if (ap.endpointNaming) lines.push(`- Endpoint naming: ${ap.endpointNaming}`);
    lines.push('');
  }

  // Component Patterns (frontend)
  const cp = results.componentPatterns;
  if (cp) {
    lines.push('### Component Patterns');
    if (cp.style) lines.push(`- Component style: ${cp.style}`);
    if (cp.stylingApproach) lines.push(`- Styling: ${cp.stylingApproach}`);
    if (cp.propsStyle) lines.push(`- Props definition: ${cp.propsStyle}`);
    lines.push('');
  }

  // Existing Configs
  if (results.existingConfigs.length > 0) {
    lines.push('### Existing Configs');
    lines.push('These tools are already configured — respect their settings:');
    for (const cfg of results.existingConfigs) {
      lines.push(`- ${cfg.name} (\`${cfg.file}\`)`);
    }
    lines.push('');
  }

  // CI/CD
  if (results.ci.length > 0) {
    lines.push('### CI/CD');
    lines.push(`- Deployment: ${results.ci.join(', ')}`);
    lines.push('');
  }

  // Monorepo
  if (results.monorepo.isMonorepo) {
    lines.push('### Monorepo');
    lines.push(`- Tool: ${results.monorepo.tool}`);
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = {
  scanAll,
  formatScanResults,
  collectFiles,
  sampleFiles,
  readSafe,
};
