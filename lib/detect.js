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
 * Find the first file matching any of the given names in projectDir.
 */
function findFirst(projectDir, fileNames) {
  for (const name of fileNames) {
    const full = path.join(projectDir, name);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

// =============================================
// LANGUAGE DETECTORS
// =============================================

/**
 * Detect Node.js/TypeScript stack from package.json
 */
function detectNode(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');
  const raw = readFileIfExists(pkgPath);
  if (!raw) return null;

  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch {
    return null;
  }
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const has = (dep) => !!allDeps[dep];

  return {
    // Frameworks
    nextjs: has('next'),
    react: has('react'),
    nestjs: has('@nestjs/core'),
    express: has('express'),
    vue: has('vue'),
    angular: has('@angular/core'),
    svelte: has('svelte'),
    astro: has('astro'),
    nuxt: has('nuxt'),
    solidjs: has('solid-js'),

    // State management
    rtkQuery: has('@reduxjs/toolkit'),
    redux: has('react-redux') || has('@reduxjs/toolkit'),
    zustand: has('zustand'),
    jotai: has('jotai'),
    recoil: has('recoil'),
    mobx: has('mobx'),
    pinia: has('pinia'),
    vuex: has('vuex'),
    ngrx: has('@ngrx/store'),
    tanstackQuery: has('@tanstack/react-query'),

    // Forms
    formik: has('formik'),
    reactHookForm: has('react-hook-form'),
    tanstackForm: has('@tanstack/react-form'),

    // Data fetching
    swr: has('swr'),
    apollo: has('@apollo/client'),
    trpc: has('@trpc/client') || has('@trpc/server'),
    axios: has('axios'),
    graphql: has('graphql'),

    // UI
    tailwind: has('tailwindcss'),
    shadcn: has('@radix-ui/react-slot') || has('class-variance-authority'),
    niceModal: has('@ebay/nice-modal-react'),
    mui: has('@mui/material'),
    antd: has('antd'),
    chakra: has('@chakra-ui/react'),
    styledComponents: has('styled-components'),
    emotion: has('@emotion/react'),

    // Validation
    zod: has('zod'),
    yup: has('yup'),
    classValidator: has('class-validator'),

    // ORM / Database
    typeorm: has('typeorm'),
    prisma: has('@prisma/client'),
    drizzle: has('drizzle-orm'),
    sequelize: has('sequelize'),
    mongoose: has('mongoose'),

    // Auth
    passport: has('passport'),
    nextAuth: has('next-auth') || has('@auth/core'),
    clerk: has('@clerk/nextjs') || has('@clerk/clerk-react'),
    supabase: has('@supabase/supabase-js'),
    firebase: has('firebase') || has('firebase-admin'),

    // Payments
    stripe: has('stripe') || has('@stripe/react-stripe-js'),

    // Real-time
    livekit: has('@livekit/components-react') || has('livekit-server-sdk'),
    socketio: has('socket.io') || has('socket.io-client'),

    // Testing
    jest: has('jest'),
    vitest: has('vitest'),
    playwright: has('@playwright/test'),
    cypress: has('cypress'),
    testingLibrary: has('@testing-library/react'),

    // Mobile
    reactNative: has('react-native'),
    expo: has('expo'),

    // Meta
    typescript: has('typescript'),
    isMonorepo: fs.existsSync(path.join(projectDir, 'packages')) ||
                fs.existsSync(path.join(projectDir, 'apps')) ||
                has('turborepo') || has('lerna'),
    isFrontend: has('react') || has('vue') || has('svelte') || has('next') || has('nuxt') ||
                has('@angular/core') || has('astro') || has('solid-js'),
    isBackend: has('@nestjs/core') || has('express') || has('fastify') || has('hono') || has('koa'),
    isMobile: has('react-native') || has('expo'),

    // Package info
    name: pkg.name || 'unknown',
    description: pkg.description || '',
  };
}

/**
 * Detect Python stack
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
  return {
    django: has('django'),
    flask: has('flask'),
    fastapi: has('fastapi'),
    sqlalchemy: has('sqlalchemy'),
    djangoORM: has('django'),
    celery: has('celery'),
    pytest: has('pytest'),
    unittest: has('unittest'),
    black: has('black'),
    ruff: has('ruff'),
    mypy: has('mypy'),
    djangoRestFramework: has('djangorestframework') || has('rest_framework'),
    pydantic: has('pydantic'),
    poetry: pyproject ? pyproject.includes('[tool.poetry]') : false,
    isFrontend: false,
    isBackend: has('django') || has('flask') || has('fastapi'),
    name: path.basename(projectDir),
    description: '',
  };
}

/**
 * Detect PHP stack
 */
function detectPHP(projectDir) {
  const composerPath = path.join(projectDir, 'composer.json');
  const raw = readFileIfExists(composerPath);
  if (!raw) return null;

  let composer;
  try {
    composer = JSON.parse(raw);
  } catch {
    return null;
  }
  const allDeps = { ...composer.require, ...composer['require-dev'] };
  const has = (dep) => !!allDeps[dep];

  return {
    laravel: has('laravel/framework'),
    symfony: has('symfony/framework-bundle'),
    wordpress: has('wp-cli/wp-cli') || fs.existsSync(path.join(projectDir, 'wp-content')),
    eloquent: has('illuminate/database') || has('laravel/framework'),
    doctrine: has('doctrine/orm'),
    phpunit: has('phpunit/phpunit'),
    pest: has('pestphp/pest'),
    sanctum: has('laravel/sanctum'),
    passport: has('laravel/passport'),
    phpstan: has('phpstan/phpstan'),
    larastan: has('nunomaduro/larastan'),
    pint: has('laravel/pint'),
    isFrontend: false,
    isBackend: has('laravel/framework') || has('symfony/framework-bundle'),
    name: composer.name || path.basename(projectDir),
    description: composer.description || '',
  };
}

/**
 * Detect Go stack from go.mod
 */
function detectGo(projectDir) {
  const gomod = readFileIfExists(path.join(projectDir, 'go.mod'));
  if (!gomod) return null;

  const has = (name) => gomod.includes(name);
  const moduleMatch = gomod.match(/^module\s+(.+)/m);

  return {
    gin: has('github.com/gin-gonic/gin'),
    echo: has('github.com/labstack/echo'),
    fiber: has('github.com/gofiber/fiber'),
    chi: has('github.com/go-chi/chi'),
    gorm: has('gorm.io/gorm'),
    sqlx: has('github.com/jmoiron/sqlx'),
    ent: has('entgo.io/ent'),
    testify: has('github.com/stretchr/testify'),
    zap: has('go.uber.org/zap'),
    zerolog: has('github.com/rs/zerolog'),
    wire: has('github.com/google/wire'),
    cobra: has('github.com/spf13/cobra'),
    viper: has('github.com/spf13/viper'),
    isFrontend: false,
    isBackend: has('github.com/gin-gonic/gin') || has('github.com/labstack/echo') ||
               has('github.com/gofiber/fiber') || has('github.com/go-chi/chi') ||
               has('net/http'),
    name: moduleMatch ? moduleMatch[1].trim() : path.basename(projectDir),
    description: '',
  };
}

/**
 * Detect Rust stack from Cargo.toml
 */
function detectRust(projectDir) {
  const cargo = readFileIfExists(path.join(projectDir, 'Cargo.toml'));
  if (!cargo) return null;

  const has = (name) => cargo.includes(name);
  const nameMatch = cargo.match(/^name\s*=\s*"(.+)"/m);

  return {
    axum: has('axum'),
    actixWeb: has('actix-web'),
    rocket: has('rocket'),
    warp: has('warp'),
    diesel: has('diesel'),
    seaOrm: has('sea-orm'),
    sqlxRust: has('sqlx'),
    tokio: has('tokio'),
    asyncStd: has('async-std'),
    serde: has('serde'),
    tracing: has('tracing'),
    clap: has('clap'),
    isFrontend: false,
    isBackend: has('axum') || has('actix-web') || has('rocket') || has('warp'),
    name: nameMatch ? nameMatch[1] : path.basename(projectDir),
    description: '',
  };
}

/**
 * Detect Ruby stack from Gemfile
 */
function detectRuby(projectDir) {
  const gemfile = readFileIfExists(path.join(projectDir, 'Gemfile'));
  if (!gemfile) return null;

  const has = (name) => gemfile.includes(`'${name}'`) || gemfile.includes(`"${name}"`);

  return {
    rails: has('rails'),
    sinatra: has('sinatra'),
    devise: has('devise'),
    rspec: has('rspec') || has('rspec-rails'),
    minitest: has('minitest'),
    sidekiq: has('sidekiq'),
    rubocop: has('rubocop'),
    activerecord: has('activerecord') || has('rails'),
    pundit: has('pundit'),
    cancancan: has('cancancan'),
    factoryBot: has('factory_bot') || has('factory_bot_rails'),
    isFrontend: false,
    isBackend: has('rails') || has('sinatra'),
    name: path.basename(projectDir),
    description: '',
  };
}

/**
 * Detect Java/Kotlin stack from pom.xml or build.gradle
 */
function detectJava(projectDir) {
  const pom = readFileIfExists(path.join(projectDir, 'pom.xml'));
  const gradle = readFileIfExists(path.join(projectDir, 'build.gradle')) ||
                 readFileIfExists(path.join(projectDir, 'build.gradle.kts'));
  if (!pom && !gradle) return null;

  const content = (pom || '') + (gradle || '');
  const has = (name) => content.includes(name);

  return {
    springBoot: has('spring-boot') || has('org.springframework.boot'),
    hibernate: has('hibernate'),
    jpa: has('spring-boot-starter-data-jpa') || has('javax.persistence') || has('jakarta.persistence'),
    junit: has('junit'),
    mockito: has('mockito'),
    lombok: has('lombok'),
    maven: !!pom,
    gradle: !!gradle,
    kotlin: !!readFileIfExists(path.join(projectDir, 'build.gradle.kts')) ||
            fs.existsSync(path.join(projectDir, 'src/main/kotlin')),
    isFrontend: false,
    isBackend: has('spring-boot') || has('org.springframework.boot'),
    name: path.basename(projectDir),
    description: '',
  };
}

/**
 * Detect .NET/C# stack from .csproj files
 */
function detectDotnet(projectDir) {
  // Find any .csproj file
  let csproj = null;
  try {
    const entries = fs.readdirSync(projectDir);
    const csprojFile = entries.find(f => f.endsWith('.csproj'));
    if (csprojFile) csproj = readFileIfExists(path.join(projectDir, csprojFile));
  } catch {}
  if (!csproj) return null;

  const has = (name) => csproj.includes(name);

  return {
    aspnet: has('Microsoft.AspNetCore') || has('Microsoft.NET.Sdk.Web'),
    efCore: has('Microsoft.EntityFrameworkCore'),
    xunit: has('xunit'),
    nunit: has('NUnit'),
    mediatr: has('MediatR'),
    blazor: has('Microsoft.AspNetCore.Components'),
    minimalApi: has('Microsoft.NET.Sdk.Web'),
    isFrontend: has('Microsoft.AspNetCore.Components'),
    isBackend: has('Microsoft.AspNetCore') || has('Microsoft.NET.Sdk.Web'),
    name: path.basename(projectDir),
    description: '',
  };
}

/**
 * Detect Dart/Flutter stack from pubspec.yaml
 */
function detectDart(projectDir) {
  const pubspec = readFileIfExists(path.join(projectDir, 'pubspec.yaml'));
  if (!pubspec) return null;

  const has = (name) => pubspec.includes(name);

  return {
    flutter: has('flutter:'),
    riverpod: has('flutter_riverpod') || has('riverpod'),
    bloc: has('flutter_bloc') || has('bloc'),
    provider: has('provider:'),
    getx: has('get:'),
    dio: has('dio:'),
    freezed: has('freezed'),
    hive: has('hive:') || has('hive_flutter'),
    drift: has('drift:'),
    goRouter: has('go_router'),
    isFrontend: has('flutter:'),
    isBackend: false,
    isMobile: has('flutter:'),
    name: path.basename(projectDir),
    description: '',
  };
}

/**
 * Detect Swift stack from Package.swift or Podfile
 */
function detectSwift(projectDir) {
  const packageSwift = readFileIfExists(path.join(projectDir, 'Package.swift'));
  const podfile = readFileIfExists(path.join(projectDir, 'Podfile'));
  if (!packageSwift && !podfile) return null;

  const content = (packageSwift || '') + (podfile || '');
  const has = (name) => content.includes(name);

  return {
    vapor: has('vapor'),
    alamofire: has('Alamofire'),
    realm: has('RealmSwift') || has('Realm'),
    snapkit: has('SnapKit'),
    kingfisher: has('Kingfisher'),
    swiftui: fs.existsSync(path.join(projectDir, 'ContentView.swift')) ||
             (packageSwift && packageSwift.includes('SwiftUI')),
    isFrontend: true,
    isBackend: has('vapor'),
    isMobile: !has('vapor'),
    name: path.basename(projectDir),
    description: '',
  };
}

// =============================================
// MAIN DETECTION
// =============================================

/**
 * Detect the tech stack of a project across all supported languages.
 */
function detectStack(projectDir) {
  const nodeStack = detectNode(projectDir);
  const pythonStack = detectPython(projectDir);
  const phpStack = detectPHP(projectDir);
  const goStack = detectGo(projectDir);
  const rustStack = detectRust(projectDir);
  const rubyStack = detectRuby(projectDir);
  const javaStack = detectJava(projectDir);
  const dotnetStack = detectDotnet(projectDir);
  const dartStack = detectDart(projectDir);
  const swiftStack = detectSwift(projectDir);

  const allStacks = [nodeStack, pythonStack, phpStack, goStack, rustStack,
                     rubyStack, javaStack, dotnetStack, dartStack, swiftStack];

  if (allStacks.every(s => !s)) {
    console.error('No supported project found in', projectDir);
    console.error('Supported: package.json, requirements.txt, pyproject.toml, composer.json, go.mod, Cargo.toml, Gemfile, pom.xml, build.gradle, *.csproj, pubspec.yaml, Package.swift');
    process.exit(1);
  }

  // Merge all detected stacks
  const merged = {};
  for (const stack of allStacks) {
    if (stack) Object.assign(merged, stack);
  }

  return {
    ...merged,

    // Language flags
    isNode: !!nodeStack,
    isPython: !!pythonStack,
    isPHP: !!phpStack,
    isGo: !!goStack,
    isRust: !!rustStack,
    isRuby: !!rubyStack,
    isJava: !!javaStack,
    isDotnet: !!dotnetStack,
    isDart: !!dartStack,
    isSwift: !!swiftStack,

    // Combined meta flags
    isFrontend: allStacks.some(s => s && s.isFrontend),
    isBackend: allStacks.some(s => s && s.isBackend),
    isMobile: allStacks.some(s => s && s.isMobile),

    // Use first available name/description
    name: allStacks.find(s => s && s.name && s.name !== 'unknown')?.name || 'unknown',
    description: allStacks.find(s => s && s.description)?.description || '',
  };
}

module.exports = { detectStack };
