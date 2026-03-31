/**
 * Tool catalog — the single source of truth for all AI tool formats.
 * Each entry: { key, name, path, popular }
 */
const TOOL_CATALOG = [
  // Popular (pre-checked)
  {
    key: "claude",
    name: "Claude Code",
    path: "CLAUDE.md",
    popular: true,
    preselected: true,
  },
  {
    key: "agents",
    name: "AGENTS.md (Universal)",
    path: "AGENTS.md",
    popular: true,
    preselected: true,
  },
  {
    key: "copilot",
    name: "GitHub Copilot",
    path: ".github/copilot-instructions.md",
    popular: true,
    preselected: false,
  },
  {
    key: "cursor",
    name: "Cursor",
    path: ".cursor/rules/standards.mdc",
    popular: true,
    preselected: true,
  },
  {
    key: "windsurf",
    name: "Windsurf",
    path: ".windsurf/rules/standards.md",
    popular: true,
    preselected: false,
  },
  {
    key: "gemini",
    name: "Gemini CLI",
    path: "GEMINI.md",
    popular: true,
    preselected: false,
  },
  // Other
  { key: "aider", name: "Aider", path: "CONVENTIONS.md", popular: false },
  { key: "cline", name: "Cline", path: ".clinerules", popular: false },
  { key: "zed", name: "Zed", path: ".rules", popular: false },
  {
    key: "junie",
    name: "JetBrains Junie",
    path: ".junie/guidelines.md",
    popular: false,
  },
  {
    key: "cursorrules",
    name: "Cursor (legacy)",
    path: ".cursorrules",
    popular: false,
  },
  {
    key: "amazonq",
    name: "Amazon Q",
    path: ".amazonq/rules/standards.md",
    popular: false,
  },
  {
    key: "roo",
    name: "Roo Code",
    path: ".roo/rules/standards.md",
    popular: false,
  },
  {
    key: "augment",
    name: "Augment",
    path: ".augment/rules/standards.md",
    popular: false,
  },
  {
    key: "tabnine",
    name: "Tabnine",
    path: ".tabnine/guidelines/standards.md",
    popular: false,
  },
  {
    key: "jetbrains",
    name: "JetBrains AI",
    path: ".aiassistant/rules/standards.md",
    popular: false,
  },
  {
    key: "continue",
    name: "Continue.dev",
    path: ".continue/rules/standards.md",
    popular: false,
  },
];

/**
 * Interactive multi-select checkbox prompt.
 * Uses raw stdin mode for arrow key navigation, space to toggle, enter to confirm.
 * Returns a promise that resolves to an array of selected format keys.
 */
function promptToolSelection() {
  return new Promise((resolve) => {
    // Check if we're in a TTY
    if (!process.stdin.isTTY) {
      // Non-interactive: default to claude only
      resolve(['claude']);
      return;
    }

    const items = TOOL_CATALOG.map(tool => ({
      ...tool,
      checked: tool.preselected || false, // pre-check claude + cursor
    }));

    let cursor = 0;
    const popularCount = items.filter(i => i.popular).length;

    function render() {
      // Move cursor to start and clear
      const output = [];
      output.push('\x1B[?25l'); // hide cursor

      output.push('Select AI tools to generate configs for:\n');
      output.push('  (↑↓ navigate, space toggle, a select all, enter confirm)\n\n');

      // Popular section
      output.push('  \x1B[1mPopular:\x1B[0m\n');
      for (let i = 0; i < popularCount; i++) {
        const item = items[i];
        const check = item.checked ? '\x1B[32m✔\x1B[0m' : ' ';
        const pointer = cursor === i ? '\x1B[36m❯\x1B[0m' : ' ';
        const label = cursor === i ? `\x1B[36m${item.name}\x1B[0m` : item.name;
        output.push(`  ${pointer} [${check}] ${label}\n`);
      }

      // Other section
      output.push('\n  \x1B[1mOther:\x1B[0m\n');
      for (let i = popularCount; i < items.length; i++) {
        const item = items[i];
        const check = item.checked ? '\x1B[32m✔\x1B[0m' : ' ';
        const pointer = cursor === i ? '\x1B[36m❯\x1B[0m' : ' ';
        const label = cursor === i ? `\x1B[36m${item.name}\x1B[0m` : item.name;
        output.push(`  ${pointer} [${check}] ${label}\n`);
      }

      const selectedCount = items.filter(i => i.checked).length;
      output.push(`\n  ${selectedCount} tool(s) selected\n`);

      // Write everything at once
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
        if (selected.length === 0) {
          // Don't allow empty selection — flash a message
          return;
        }
        cleanup();
        // Show cursor again and clear
        process.stdout.write('\x1B[?25h');
        process.stdout.write('\x1B[2J\x1B[H');
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

module.exports = { promptToolSelection, TOOL_CATALOG };
