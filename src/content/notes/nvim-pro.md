---
title: Nvim-Pro - A Minimal Yet Capable Editor
date: 2026-03-01T00:00:00.000Z
tags:
  - nvim
  - lsp
  - editor
  - productivity
  - java
description: Building a minimal yet powerful Neovim setup for polyglot programmers
---

# Nvim-Pro - Cut the Noise, Focus on Code

I've tried many Linux distros over the years. Arch, Manjaro, Ubuntu derivatives—you name it. Each one taught me something. What works. What doesn't. What matters.

The same goes for editors. I've explored LazyVim, NvChad, AstroNvim. They're impressive. But I prefer crafting my own. It's like choosing between a framework and building from scratch. Sometimes you need the framework. Sometimes you need control.

I'm primarily a Java programmer. I also work with Go and React. Recently picked up Rust. Left Windows long ago. Never looked back. Now on macOS with Aerospace—a keyboard-driven tiling window manager. Similar to i3 on Linux, which I still use when I'm there.

My setup: Ghostty terminal, tmux, and now Neovim 0.12. Everything keyboard-first. Everything minimal. But also—and this matters—everything looks good. Aesthetics aren't optional. Font, colorscheme, transparency, blur. It all needs to align. Ghostty themes, Neovim themes, tmux themes. Cohesive.

This is Nvim-Pro. Cutting-edge but pragmatic. Native LSP without wrappers. Not going full native (vim.pack) because Lazy.nvim still provides value. Use what works. Skip what doesn't. Wait to see what we gain.

Getting jdtls and DAP working for Java? Normally a pain. But it doesn't have to be.

## Philosophy: Minimal but Essential

Think of it like system design. You don't add services you don't need. Same with plugins.

- **Modern Neovim 0.12**: Native LSP (`vim.lsp.config`/`vim.lsp.enable`). No lspconfig wrapper.
- **Keyboard-First**: Tmux-style keybindings. Zero mouse dependency.
- **Transparent UI**: All colorschemes respect your terminal background.
- **Performance**: Lazy loading. Disabled built-ins. ~50-80ms startup.
- **Polyglot Support**: Java, Go, Rust, TypeScript, Lua. All first-class.

## Getting Started: Clone and Use

Two paths. Fresh install or run alongside your current config.

### Fresh Setup (Replace Existing Config)

```bash
# Backup your existing config (optional)
mv ~/.config/nvim ~/.config/nvim.bak 2>/dev/null

# Clone nvim-pro
git clone https://github.com/craftyprash/nvim-pro.git ~/.config/nvim

# Launch Neovim
nvim
```

First launch? Lazy.nvim auto-bootstraps. Mason installs LSP servers and formatters. You're ready.

### Run Alongside Existing Config

Don't want to replace your setup? Run in parallel.

```bash
git clone https://github.com/craftyprash/nvim-pro.git ~/.config/nvim-pro

# Launch with custom NVIM_APPNAME
NVIM_APPNAME=nvim-pro nvim
```

Add an alias to your shell config (`~/.zshrc` or `~/.bashrc`):

```bash
alias nvim-pro='NVIM_APPNAME=nvim-pro nvim'
```

Reload and launch with `nvim-pro`.

### Dependencies

For the full experience:

- **Neovim 0.12+**: At the time I wrote this, 0.12 wasn't released. I installed with `brew install --HEAD neovim`. Check if stable is available now.
- **Nerd Font**: JetBrainsMono Nerd Font for icons
- **ripgrep**: `brew install ripgrep` (grep picker)
- **fd**: `brew install fd` (file picker)
- **lazygit**: `brew install lazygit` (git UI)
- **zoxide**: `brew install zoxide` (project navigation)

## The Editor: Usage and Workflow

### Structure

Think of it like a well-organized codebase. Clear separation of concerns.

```
~/.config/nvim/
├── init.lua                 # Entry point
├── lua/
│   ├── config/
│   │   ├── lazy.lua        # Plugin manager bootstrap
│   │   ├── options.lua     # Editor settings
│   │   ├── keymaps.lua     # Global keybindings
│   │   └── autocmds.lua    # Auto-commands
│   └── plugins/
│       ├── lsp-lang.lua    # LSP (Java, Go, Rust, TS, Lua)
│       ├── debug.lua       # nvim-dap debugging
│       ├── treesitter.lua  # Syntax highlighting
│       ├── completion.lua  # Blink.cmp
│       ├── formatting.lua  # Conform.nvim
│       ├── snacks.lua      # Picker, git, terminal
│       ├── explorer.lua    # Oil.nvim
│       ├── colorscheme.lua # 6 themes with transparency
│       └── ...
```

### Keyboard-Driven Workflow

Everything is keyboard-driven. Leader key is `<Space>`. Local leader is `\`.

**File Navigation** (via Snacks picker):
- `<leader>ff` - Find files
- `<leader>fg` - Grep across project
- `<leader>fb` - Switch buffers
- `<leader>fp` - Projects (zoxide integration)
- `<leader>fr` - Recent files

**Window Management** (Tmux-style):
- `<leader>w|` - Split vertical
- `<leader>w-` - Split horizontal
- `<leader>wx` - Close window
- `<leader>wr` - Resize mode (hjkl to resize, smart edge detection)
- `<C-h/j/k/l>` - Navigate windows (seamless with tmux via vim-tmux-navigator)

**Buffer Navigation**:
- `<S-h>/<S-l>` - Previous/next buffer
- `<leader>bb` - Switch to alternate buffer
- `<leader>bd` - Delete buffer

**Editing**:
- `<A-j>/<A-k>` - Move lines up/down
- `J/K` in visual mode - Move selection
- `</>` in visual mode - Indent (stays in visual mode)
- `<C-s>` - Save (works in normal/insert/visual)

**Git** (via Snacks + Lazygit):
- `<leader>gg` - Lazygit
- `<leader>gb` - Git blame line
- `<leader>gs` - Git status picker

**File Explorer** (Oil.nvim):
- `-` - Open parent directory
- `<leader>-` - Open in floating window

Full reference: [KEYBINDINGS.md](https://github.com/craftyprash/nvim-pro/blob/main/KEYBINDINGS.md)

### LSP Keybindings: Standard First, Custom Second

Here's the thing about keybindings. Neovim 0.12 ships with sensible LSP defaults. Why customize mindlessly?

I use the standard bindings first. Only add custom ones where needed. Think of it like extending a base class. Don't override everything. Just what you need.

**Standard Neovim 0.12 LSP bindings** (auto-created):
- `gd` - Go to definition
- `gD` - Go to declaration
- `K` - Hover documentation
- `gra` - Code actions
- `grn` - Rename symbol
- `grr` - Find references
- `gri` - Go to implementation
- `gO` - Document symbols
- `<C-s>` (insert mode) - Signature help

**Custom additions** (complementing the standard):
- `[d`/`]d` - Navigate diagnostics
- `<leader>f` - Format (unified via Conform.nvim)
- `<leader>ih` - Toggle inlay hints

See the pattern? Standard first. Custom as needed. No reinventing the wheel.

### Programming Capabilities

This is where it matters. Native Neovim 0.12 LSP. Zero overhead.

**Supported Languages**:
- **Java**: jdtls with lombok, debug adapter, multi-module Maven support
- **Go**: gopls with gofumpt formatting
- **Rust**: rust-analyzer with clippy checks
- **TypeScript/React**: vtsls (faster than tsserver) + eslint + tailwindcss
- **Lua**: lua_ls for Neovim config development

**Completion** (Blink.cmp):
- `<CR>` - Accept completion
- `<C-y>` - Alternative accept
- `<Tab>/<S-Tab>` - Navigate items
- Auto-brackets for functions/methods
- Signature help while typing

Why Blink over nvim-cmp? Faster. Better LSP integration. Simpler config. It's built for modern Neovim.

**Debugging** (nvim-dap):
- `F5` - Start/continue debugging
- `F9` - Toggle breakpoint
- `F10` - Step over
- `F11` - Step into
- `F12` - Step out
- UI panels for variables, call stack, console

**Formatting** (Conform.nvim):
- Format on save (500ms timeout)
- LSP fallback if no formatter configured
- Per-language formatters: stylua (Lua), google-java-format (Java), prettier (JS/TS/React), gopls (Go)

### The Editor Experience: Aesthetics Matter

Programming is visual work. Your editor should look good.

**Treesitter**: Loaded before LSP (`priority=1000`). Prevents first-file highlighting issues. Supports 21 languages. Textobjects for smart selections (`vaf`, `vif` for functions, `vac`, `vic` for classes).

**Colorschemes**: Six themes. All with `transparent=true`. Respect your terminal background.

1. **onedark** (default) - Atom's iconic theme
2. tokyonight - Clean, inspired by Tokyo's night skyline
3. catppuccin - Modern, polished
4. nightfox - Highly customizable
5. kanagawa - Warm, muted, inspired by Japanese art
6. rose-pine - Low-contrast, easy on eyes

Switch with `<leader>sC` (colorscheme picker). Pick what matches your mood. Or your terminal theme.

**Icons and UI**: mini.icons for file icons. dressing.nvim for better vim.ui.select/input. lualine for a clean statusline. No bloat. Just polish.

**Terminal Integration**: Ghostty terminal. JetBrainsMono Nerd Font. 95% opacity. Background blur. Tmux with vim-tmux-navigator for seamless pane navigation. Toggle terminal in Neovim with `<C-/>`.

Everything aligned. Ghostty theme matches Neovim theme. Tmux theme matches both. Cohesive.

## Java: The Special Case

Let's talk about Java. It's my primary language. Getting it to work in Neovim? Historically painful.

jdtls is powerful but complex. Multi-module Maven projects? Workspace collisions? Lombok? Debug adapters? Each one is a potential headache.

Nvim-Pro handles all of it. Out of the box.

### What Makes Java Hard

Think of it like microservices. Each component needs configuration. They need to talk to each other. One misconfiguration breaks everything.

**The components**:
1. **jdtls** - The LSP server
2. **Mason** - Tool installer
3. **Lombok** - Annotation processor
4. **java-debug-adapter** - For debugging
5. **Workspace** - Per-project isolation
6. **Root detection** - Finding project root

### How Nvim-Pro Solves It

**Root Detection**: Uses `.git` → `mvnw` → `gradlew` in that order. Finds the right root even in multi-module projects.

**Workspace Isolation**: Each project gets its own workspace directory. No collisions. Like Docker containers for your LSP.

```lua
local project_name = root_dir:gsub("[/\\]", "_")
local workspace_dir = home .. "/.local/share/jdtls-workspace/" .. project_name
```

**Lombok Support**: Auto-configured javaagent. Just works.

```lua
cmd = {
  "java",
  "-javaagent:" .. lombok_path,
  -- ... rest of config
}
```

**Debug Adapter**: java-debug-adapter installed via Mason. Bundles loaded automatically.

```lua
local bundles = {}
local java_debug_jar = vim.fn.glob(java_debug_path .. "/extension/server/com.microsoft.java.debug.plugin-*.jar")
if java_debug_jar ~= "" then
  table.insert(bundles, java_debug_jar)
end
```

**Import Folding**: Java files have lots of imports. They clutter the view. Nvim-Pro auto-folds them on file open.

```lua
-- Wraps vim.lsp.foldexpr to auto-fold Java imports
if vim.bo[bufnr].filetype == "java" and not vim.b[bufnr].imports_folded then
  vim.b[bufnr].imports_folded = true
  -- ... fold logic
end
```

**Runtime Configuration**: Uses mise (or asdf) to find Java installation. No hardcoded paths.

```lua
runtimes = {
  {
    name = "JavaSE-21",
    path = vim.fn.trim(vim.fn.system("mise where java")),
  },
}
```

### The Result

Open a Java file. jdtls starts. Lombok works. Imports fold. Completions appear. Debugging works. Multi-module Maven project? No problem.

It just works.

Full details: [LSP.md](https://github.com/craftyprash/nvim-pro/blob/main/LSP.md)

## Crafting the Editor: Choices and Mindset

Want to build your own? Here's the thinking.

### Oil.nvim vs Tree Explorers

Vim already has a way to edit things: buffers. Oil treats directories as buffers.

Want to rename a file? Use `cw`. Delete? Use `dd`. Move? Cut and paste. It's the Vim way.

Neo-tree is powerful. But it's another mental model. Another set of keybindings. Another abstraction.

Oil is just... Vim. Like using standard library functions instead of a framework.

### Snacks.nvim vs Telescope/fzf-lua

Snacks is a collection of small QoL plugins by folke. Picker, dashboard, git, terminal, notifier, zoxide.

Why Snacks over Telescope? Integration and simplicity. Telescope is feature-rich but heavy. Like using a full ORM when you just need a query builder.

fzf-lua is fast but requires external dependencies. Snacks is lightweight. Integrates with Lazy.nvim. Covers 90% of use cases.

Think of it like choosing between a monolith and microservices. Sometimes the monolith is simpler.

### Native LSP (Neovim 0.12) vs lspconfig

Neovim 0.12 introduced `vim.lsp.config` and `vim.lsp.enable`. Makes lspconfig optional.

Why use a wrapper when the native API is cleaner?

```lua
-- Old way (lspconfig)
require('lspconfig').gopls.setup({ settings = {...} })

-- New way (native)
vim.lsp.config('gopls', { settings = {...} })
vim.lsp.enable({ 'gopls', ... })
```

More explicit. Less magic. One less dependency. Like using fetch instead of axios.

### Lazy.nvim vs vim.pack

Why not go full native with `vim.pack`? Because Lazy.nvim still provides value.

- Lazy loading (plugins load on events, not at startup)
- Auto-bootstrap (clones itself on first run)
- UI for managing plugins
- Performance optimizations (disables unused built-ins)

Going native is tempting. But Lazy.nvim is pragmatic. Like using TypeScript instead of pure JavaScript. The tooling adds value.

Let's wait to see what we gain before switching.

### Tmux and Terminal Synergy

Vim-tmux-navigator allows `<C-h/j/k/l>` to navigate both Neovim windows and tmux panes. Seamlessly.

Combined with Ghostty's transparency and Aerospace's tiling? Cohesive keyboard-driven environment.

Like having a well-designed API. Everything works together.

### Options and Autocmds

Key settings in `options.lua`:
- **Folding**: LSP-based (`foldmethod=expr`, `foldexpr=vim.lsp.foldexpr()`)
- **No swap files**: `swapfile=false`, `backup=false`
- **Persistent undo**: `undofile=true`, `undolevels=10000`
- **Global statusline**: Single statusline for all windows
- **Smooth scrolling**: For wrapped lines
- **Clipboard**: Syncs with system (except over SSH)

Autocmds in `autocmds.lua`:
- Highlight on yank
- Restore cursor position on file open
- Auto-resize windows on terminal resize
- Close help/quickfix with `q`
- Auto-create directories when saving to non-existent path

Small things. But they add up. Like good logging in production.

## What's Missing: AI (For Now)

No AI editor integration yet. A future article will cover Amazon Q Developer and other AI tools.

For now, Nvim-Pro is about fundamentals. A fast, focused editor that gets out of your way.

Like building a solid foundation before adding features.

## Final Thoughts

Nvim-Pro isn't for everyone. If you want batteries-included, stick with LazyVim or NvChad.

But if you value minimalism, performance, and control? This is for you.

It's cutting-edge (Neovim 0.12) but pragmatic (Lazy.nvim, not vim.pack). Minimal but capable (LSP, DAP, formatting, completion). Keyboard-first (tmux-style keybindings, no mouse). And transparent (literally—all themes respect your terminal background).

Clone it. Try it. Fork it. Make it yours.

The goal isn't to give you my editor. It's to show you how to build your own.

Cut the noise. Focus on code.

---

**Resources**:
- [GitHub: craftyprash/nvim-pro](https://github.com/craftyprash/nvim-pro)
- [KEYBINDINGS.md](https://github.com/craftyprash/nvim-pro/blob/main/KEYBINDINGS.md) - Complete keybinding reference
- [LSP.md](https://github.com/craftyprash/nvim-pro/blob/main/LSP.md) - Detailed LSP setup and troubleshooting
- [README.md](https://github.com/craftyprash/nvim-pro/blob/main/README.md) - Technical overview
