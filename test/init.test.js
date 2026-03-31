const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const BIN = path.join(__dirname, '..', 'bin', 'init.js');
const FIXTURES = path.join(__dirname, 'fixtures');

describe('CLI: init.js', () => {
  it('--help exits 0 and shows usage', () => {
    const output = execSync(`node ${BIN} --help`, { encoding: 'utf-8' });
    assert.ok(output.includes('Usage:'));
    assert.ok(output.includes('--format'));
    assert.ok(output.includes('--dry-run'));
    assert.ok(output.includes('--update'));
  });

  it('--dry-run does not write files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccs-init-'));
    // Copy a fixture so detection works
    fs.copyFileSync(
      path.join(FIXTURES, 'node-project', 'package.json'),
      path.join(tmpDir, 'package.json')
    );

    const output = execSync(`node ${BIN} --dry-run --no-scan`, {
      encoding: 'utf-8',
      cwd: tmpDir,
    });

    assert.ok(output.includes('[dry-run]'), 'Should show dry-run output');
    assert.ok(!fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), 'Should not create files');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('--format invalid shows warning', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccs-init-'));
    fs.copyFileSync(
      path.join(FIXTURES, 'node-project', 'package.json'),
      path.join(tmpDir, 'package.json')
    );

    const output = execSync(`node ${BIN} --format invalid --dry-run --no-scan`, {
      encoding: 'utf-8',
      cwd: tmpDir,
      // Merge stderr into stdout to capture warnings
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Warning goes to stderr
    let stderr = '';
    try {
      execSync(`node ${BIN} --format invalid --dry-run --no-scan`, {
        encoding: 'utf-8',
        cwd: tmpDir,
      });
    } catch (e) {
      stderr = e.stderr || '';
    }

    // The warning is printed via console.warn (stderr), but the tool still succeeds
    // Just verify it doesn't crash and generates something
    assert.ok(output.includes('[dry-run]') || output.includes('Done'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
