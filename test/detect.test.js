const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { detectStack } = require('../lib/detect');

const FIXTURES = path.join(__dirname, 'fixtures');

describe('detectStack', () => {
  it('detects a Node.js/Next.js project correctly', () => {
    const stack = detectStack(path.join(FIXTURES, 'node-project'));
    assert.equal(stack.isNode, true);
    assert.equal(stack.nextjs, true);
    assert.equal(stack.react, true);
    assert.equal(stack.typescript, true);
    assert.equal(stack.zod, true);
    assert.equal(stack.tailwind, true);
    assert.equal(stack.shadcn, true);
    assert.equal(stack.vitest, true);
    assert.equal(stack.isFrontend, true);
    assert.equal(stack.name, 'test-node-project');
  });

  it('detects a Python/Django project correctly', () => {
    const stack = detectStack(path.join(FIXTURES, 'python-project'));
    assert.equal(stack.isPython, true);
    assert.equal(stack.django, true);
    assert.equal(stack.djangoRestFramework, true);
    assert.equal(stack.celery, true);
    assert.equal(stack.pytest, true);
    assert.equal(stack.isBackend, true);
  });

  it('handles malformed package.json without crashing', () => {
    // detectStack calls process.exit(1) when no stacks are found,
    // so we test via a subprocess to avoid killing the test runner
    const { execSync } = require('child_process');
    const script = `
      const { detectStack } = require('./lib/detect');
      detectStack('${path.join(FIXTURES, 'malformed').replace(/\\/g, '\\\\')}');
    `;
    let exitCode = 0;
    let stderr = '';
    try {
      execSync(`node -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
        encoding: 'utf-8',
        cwd: path.join(__dirname, '..'),
      });
    } catch (err) {
      exitCode = err.status;
      stderr = err.stderr || '';
    }
    // Should exit 1 (no supported project), NOT crash with SyntaxError
    assert.equal(exitCode, 1, 'Should exit with code 1');
    assert.ok(!stderr.includes('SyntaxError'), 'Should not throw SyntaxError on malformed JSON');
    assert.ok(stderr.includes('No supported project found'), 'Should print helpful error');
  });

  it('detects combined language flags', () => {
    const stack = detectStack(path.join(FIXTURES, 'node-project'));
    assert.equal(stack.isPython, false);
    assert.equal(stack.isPHP, false);
    assert.equal(stack.isGo, false);
    assert.equal(stack.isRust, false);
  });
});
