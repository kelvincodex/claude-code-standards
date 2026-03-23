const fs = require('fs');
const path = require('path');

/**
 * Detect the tech stack of a project by reading its package.json
 * Returns an object with boolean flags for each detected technology
 */
function detectStack(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    console.error('No package.json found in', projectDir);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
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

module.exports = { detectStack };
