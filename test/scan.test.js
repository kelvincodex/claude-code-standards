const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { collectFiles, scanAll, formatScanResults, sampleFiles, readSafe } = require('../lib/scan');
const { detectStack } = require('../lib/detect');

const FIXTURES = path.join(__dirname, 'fixtures');
const NODE_PROJECT = path.join(FIXTURES, 'node-project');

describe('collectFiles', () => {
  it('finds files matching given extensions', () => {
    const files = collectFiles(NODE_PROJECT, ['.tsx', '.ts']);
    assert.ok(files.length > 0, 'Should find .tsx/.ts files');
    assert.ok(files.every(f => f.endsWith('.tsx') || f.endsWith('.ts')));
  });

  it('respects the limit parameter', () => {
    const files = collectFiles(NODE_PROJECT, ['.tsx', '.ts'], 1);
    assert.ok(files.length <= 1);
  });

  it('returns empty array when no matches', () => {
    const files = collectFiles(NODE_PROJECT, ['.xyz']);
    assert.equal(files.length, 0);
  });
});

describe('sampleFiles', () => {
  it('returns all files when under limit', () => {
    const input = ['a.ts', 'b.ts', 'c.ts'];
    const result = sampleFiles(input, 10);
    assert.deepEqual(result, input);
  });

  it('samples evenly when over limit', () => {
    const input = Array.from({ length: 100 }, (_, i) => `file${i}.ts`);
    const result = sampleFiles(input, 10);
    assert.equal(result.length, 10);
  });
});

describe('readSafe', () => {
  it('returns content for valid files', () => {
    const content = readSafe(path.join(NODE_PROJECT, 'package.json'));
    assert.ok(content !== null);
    assert.ok(content.includes('test-node-project'));
  });

  it('returns null for non-existent files', () => {
    const content = readSafe(path.join(NODE_PROJECT, 'nonexistent.txt'));
    assert.equal(content, null);
  });
});

describe('scanAll', () => {
  it('returns all expected result keys', () => {
    const stack = detectStack(NODE_PROJECT);
    const results = scanAll(NODE_PROJECT, stack);

    assert.ok(results.projectStructure);
    assert.ok(results.namingConventions);
    assert.ok(results.importPatterns);
    assert.ok(results.codeStyle);
    assert.ok(results.testingPatterns);
    assert.ok(results.errorHandling);
    assert.ok(results.apiPatterns);
    assert.ok(Array.isArray(results.existingConfigs));
    assert.ok(Array.isArray(results.ci));
    assert.ok(results.monorepo !== undefined);
  });

  it('detects test files correctly (Bug #1 fix)', () => {
    const stack = detectStack(NODE_PROJECT);
    const results = scanAll(NODE_PROJECT, stack);

    // The test fixture has Button.test.tsx, so testing patterns should detect it
    assert.ok(results.testingPatterns, 'Should have testing patterns');
    assert.equal(results.testingPatterns.framework, 'Vitest');
  });
});

describe('formatScanResults', () => {
  it('returns well-formed Markdown', () => {
    const stack = detectStack(NODE_PROJECT);
    const results = scanAll(NODE_PROJECT, stack);
    const markdown = formatScanResults(results);

    assert.ok(markdown.includes('## Learned Patterns'));
    assert.ok(markdown.includes('### Code Style'));
  });
});
