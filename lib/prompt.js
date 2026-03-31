const fs = require('fs');
const path = require('path');

// ANSI color helpers
const c = {
  green: (s) => `\x1B[32m${s}\x1B[0m`,
  cyan: (s) => `\x1B[36m${s}\x1B[0m`,
  yellow: (s) => `\x1B[33m${s}\x1B[0m`,
  dim: (s) => `\x1B[2m${s}\x1B[0m`,
  bold: (s) => `\x1B[1m${s}\x1B[0m`,
  red: (s) => `\x1B[31m${s}\x1B[0m`,
};

/**
 * Tool catalog — the single source of truth for all AI tool formats.
 * Each entry: { key, name, path, popular, preselected }
 */
const TOOL_CATALOG = [
  // Popular
  { key: 'claude',      name: 'Claude Code',           path: 'CLAUDE.md',                        popular: true,  preselected: true },
  { key: 'agents',      name: 'AGENTS.md (Universal)', path: 'AGENTS.md',                        popular: true,  preselected: true },
  { key: 'copilot',     name: 'GitHub Copilot',        path: '.github/copilot-instructions.md',  popular: true,  preselected: false },
  { key: 'cursor',      name: 'Cursor',                path: '.cursor/rules/standards.mdc',      popular: true,  preselected: true },
  { key: 'windsurf',    name: 'Windsurf',              path: '.windsurf/rules/standards.md',     popular: true,  preselected: false },
  { key: 'gemini',      name: 'Gemini CLI',            path: 'GEMINI.md',                        popular: true,  preselected: false },
  // Other
  { key: 'aider',       name: 'Aider',                 path: 'CONVENTIONS.md',                   popular: false, preselected: false },
  { key: 'cline',       name: 'Cline',                 path: '.clinerules',                      popular: false, preselected: false },
  { key: 'zed',         name: 'Zed',                   path: '.rules',                           popular: false, preselected: false },
  { key: 'junie',       name: 'JetBrains Junie',       path: '.junie/guidelines.md',             popular: false, preselected: false },
  { key: 'cursorrules', name: 'Cursor (legacy)',        path: '.cursorrules',                     popular: false, preselected: false },
  { key: 'amazonq',     name: 'Amazon Q',              path: '.amazonq/rules/standards.md',      popular: false, preselected: false },
  { key: 'roo',         name: 'Roo Code',              path: '.roo/rules/standards.md',          popular: false, preselected: false },
  { key: 'augment',     name: 'Augment',               path: '.augment/rules/standards.md',      popular: false, preselected: false },
  { key: 'tabnine',     name: 'Tabnine',               path: '.tabnine/guidelines/standards.md', popular: false, preselected: false },
  { key: 'jetbrains',   name: 'JetBrains AI',          path: '.aiassistant/rules/standards.md',  popular: false, preselected: false },
  { key: 'continue',    name: 'Continue.dev',          path: '.continue/rules/standards.md',     popular: false, preselected: false },
];

/**
 * Check which tool config files already exist in the project directory.
 * Returns a Set of format keys that have existing files.
 */
function detectExistingConfigs(projectDir) {
  const existing = new Set();
  for (const tool of TOOL_CATALOG) {
    if (fs.existsSync(path.join(projectDir, tool.path))) {
      existing.add(tool.key);
    }
  }
  return existing;
}

/**
 * Interactive multi-select checkbox prompt.
 * Uses raw stdin mode for arrow key navigation, space to toggle, enter to confirm.
 * Returns a promise that resolves to an array of selected format keys.
 */
function promptToolSelection(projectDir) {
  return new Promise((resolve) => {
    // Check if we're in a TTY
    if (!process.stdin.isTTY) {
      resolve(['claude']);
      return;
    }

    const existingConfigs = projectDir ? detectExistingConfigs(projectDir) : new Set();

    const items = TOOL_CATALOG.map(tool => ({
      ...tool,
      checked: tool.preselected || false,
      exists: existingConfigs.has(tool.key),
    }));

    let cursor = 0;
    const popularCount = items.filter(i => i.popular).length;

    function renderItem(item, index) {
      const check = item.checked ? c.green('✔') : ' ';
      const pointer = cursor === index ? c.cyan('❯') : ' ';
      const existsTag = item.exists ? c.yellow(' (exists)') : '';
      const label = cursor === index ? c.cyan(item.name) : item.name;
      return `  ${pointer} [${check}] ${label}${existsTag}`;
    }

    function render() {
      const output = [];
      output.push('\x1B[?25l'); // hide cursor

      output.push(`Select AI tools to generate configs for:\n`);
      output.push(`  ${c.dim('↑↓ navigate, space toggle, a select all, enter confirm')}\n\n`);

      // Popular section
      output.push(`  ${c.bold('Popular:')}\n`);
      for (let i = 0; i < popularCount; i++) {
        output.push(renderItem(items[i], i) + '\n');
      }

      // Other section
      output.push(`\n  ${c.bold('Other:')}\n`);
      for (let i = popularCount; i < items.length; i++) {
        output.push(renderItem(items[i], i) + '\n');
      }

      const selectedCount = items.filter(i => i.checked).length;
      output.push(`\n  ${selectedCount} tool(s) selected\n`);

      process.stdout.write('\x1B[2J\x1B[H' + output.join(''));
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    render();

    function onKeypress(key) {
      // Ctrl+C
      if (key === '\x03') {
        cleanup();
        process.exit(0);
      }

      // Enter
      if (key === '\r' || key === '\n') {
        const selected = items.filter(i => i.checked).map(i => i.key);
        if (selected.length === 0) return; // don't allow empty
        cleanup();
        process.stdout.write('\x1B[?25h'); // show cursor
        process.stdout.write('\x1B[2J\x1B[H'); // clear screen
        resolve(selected);
        return;
      }

      // Space — toggle
      if (key === ' ') {
        items[cursor].checked = !items[cursor].checked;
        render();
        return;
      }

      // 'a' — select all / deselect all
      if (key === 'a') {
        const allChecked = items.every(i => i.checked);
        items.forEach(i => { i.checked = !allChecked; });
        render();
        return;
      }

      // Arrow up
      if (key === '\x1B[A') {
        cursor = cursor > 0 ? cursor - 1 : items.length - 1;
        render();
        return;
      }

      // Arrow down
      if (key === '\x1B[B') {
        cursor = cursor < items.length - 1 ? cursor + 1 : 0;
        render();
        return;
      }
    }

    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onKeypress);
    }

    process.stdin.on('data', onKeypress);
  });
}

module.exports = { promptToolSelection, TOOL_CATALOG, detectExistingConfigs, c };
