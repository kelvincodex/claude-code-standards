const fs = require('fs');
const path = require('path');

/**
 * Read a text file and return its content, or null if not found.
 */
function readFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Detect Node.js stack from package.json
 */
function detectNode(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');
  const raw = readFileIfExists(pkgPath);
  if (!raw) return null;

  const pkg = JSON.parse(raw);
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };
  const has = (dep) => !!allDeps[dep];

  return {
    // Frameworks
    nextjs: has('next'),
    react: has('react'),
    nestjs: has('@nestjs/core'),
    express: has('express'),

    // State management
    rtkQuery: has('@reduxjs/toolkit'),
    redux: has('react-redux') || has('@reduxjs/toolkit'),
    zustand: has('zustand'),
    tanstackQuery: has('@tanstack/react-query'),

    // UI
    tailwind: has('tailwindcss'),
    shadcn: has('@radix-ui/react-slot') || has('class-variance-authority'),
    niceModal: has('@ebay/nice-modal-react'),

    // Validation
    zod: has('zod'),
    yup: has('yup'),
    classValidator: has('class-validator'),

    // ORM / Database
    typeorm: has('typeorm'),
    prisma: has('@prisma/client'),
    drizzle: has('drizzle-orm'),

    // Auth
    passport: has('passport'),
    nextAuth: has('next-auth'),

    // Payments
    stripe: has('stripe') || has('@stripe/react-stripe-js'),

    // Real-time
    livekit: has('@livekit/components-react') || has('livekit-server-sdk'),
    socketio: has('socket.io') || has('socket.io-client'),

    // Testing
    jest: has('jest'),
    vitest: has('vitest'),
    playwright: has('@playwright/test'),

    // Meta
    isMonorepo: fs.existsSync(path.join(projectDir, 'packages')) ||
                fs.existsSync(path.join(projectDir, 'apps')) ||
                has('turborepo') || has('lerna'),
    isFrontend: has('react') || has('vue') || has('svelte') || has('next') || has('nuxt'),
    isBackend: has('@nestjs/core') || has('express') || has('fastify') || has('hono'),

    // Package info
    name: pkg.name || 'unknown',
    description: pkg.description || '',
  };
}

/**
 * Detect Python stack from requirements.txt, pyproject.toml, setup.py, or Pipfile
 */
function detectPython(projectDir) {
  let deps = '';

  const requirements = readFileIfExists(path.join(projectDir, 'requirements.txt'));
  if (requirements) deps += requirements.toLowerCase();

  const pipfile = readFileIfExists(path.join(projectDir, 'Pipfile'));
  if (pipfile) deps += pipfile.toLowerCase();

  const setupPy = readFileIfExists(path.join(projectDir, 'setup.py'));
  if (setupPy) deps += setupPy.toLowerCase();

  const pyproject = readFileIfExists(path.join(projectDir, 'pyproject.toml'));
  if (pyproject) deps += pyproject.toLowerCase();

  if (!deps) return null;

  const has = (name) => deps.includes(name);

  const name = path.basename(projectDir);

  return {
    // Frameworks
    django: has('django'),
    flask: has('flask'),
    fastapi: has('fastapi'),

    // ORM / Database
    sqlalchemy: has('sqlalchemy'),
    djangoORM: has('django'),

    // Task queues
    celery: has('celery'),

    // Testing
    pytest: has('pytest'),
    unittest: has('unittest'),

    // Linting / Formatting
    black: has('black'),
    ruff: has('ruff'),
    mypy: has('mypy'),

    // API
    djangoRestFramework: has('djangorestframework') || has('rest_framework'),
    pydantic: has('pydantic'),

    // Meta
    poetry: pyproject ? pyproject.includes('[tool.poetry]') : false,
    isFrontend: false,
    isBackend: has('django') || has('flask') || has('fastapi'),

    // Project info
    name: name,
    description: '',
  };
}

/**
 * Detect PHP stack from composer.json
 */
function detectPHP(projectDir) {
  const composerPath = path.join(projectDir, 'composer.json');
  const raw = readFileIfExists(composerPath);
  if (!raw) return null;

  const composer = JSON.parse(raw);
  const allDeps = {
    ...composer.require,
    ...composer['require-dev'],
  };
  const has = (dep) => !!allDeps[dep];

  return {
    // Frameworks
    laravel: has('laravel/framework'),
    symfony: has('symfony/framework-bundle'),
    wordpress: has('wp-cli/wp-cli') || fs.existsSync(path.join(projectDir, 'wp-content')),

    // ORM / Database
    eloquent: has('illuminate/database') || has('laravel/framework'),
    doctrine: has('doctrine/orm'),

    // Testing
    phpunit: has('phpunit/phpunit'),
    pest: has('pestphp/pest'),

    // API
    sanctum: has('laravel/sanctum'),
    passport: has('laravel/passport'),

    // Tooling
    phpstan: has('phpstan/phpstan'),
    larastan: has('nunomaduro/larastan'),
    pint: has('laravel/pint'),

    // Meta
    isFrontend: false,
    isBackend: has('laravel/framework') || has('symfony/framework-bundle'),

    // Project info
    name: composer.name || path.basename(projectDir),
    description: composer.description || '',
  };
}

/**
 * Detect the tech stack of a project.
 * Checks for Node.js (package.json), Python (requirements.txt/pyproject.toml), and PHP (composer.json).
 * Returns an object with boolean flags for each detected technology.
 */
function detectStack(projectDir) {
  const nodeStack = detectNode(projectDir);
  const pythonStack = detectPython(projectDir);
  const phpStack = detectPHP(projectDir);

  if (!nodeStack && !pythonStack && !phpStack) {
    console.error('No supported project found in', projectDir);
    console.error('Supported: package.json (Node.js), requirements.txt/pyproject.toml (Python), composer.json (PHP)');
    process.exit(1);
  }

  return {
    // Language flags
    isNode: !!nodeStack,
    isPython: !!pythonStack,
    isPHP: !!phpStack,

    // Spread detected stacks (with defaults to avoid undefined access)
    ...(nodeStack || {}),
    ...(pythonStack || {}),
    ...(phpStack || {}),

    // Override meta flags to combine across stacks
    isFrontend: (nodeStack && nodeStack.isFrontend) || false,
    isBackend: (nodeStack && nodeStack.isBackend) ||
               (pythonStack && pythonStack.isBackend) ||
               (phpStack && phpStack.isBackend) || false,

    // Use first available name/description
    name: (nodeStack && nodeStack.name) ||
          (phpStack && phpStack.name) ||
          (pythonStack && pythonStack.name) || 'unknown',
    description: (nodeStack && nodeStack.description) ||
                 (phpStack && phpStack.description) ||
                 (pythonStack && pythonStack.description) || '',
  };
}

module.exports = { detectStack };
