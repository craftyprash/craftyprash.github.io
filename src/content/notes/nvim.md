---
title: Neovim 0.12 setup
date: 2024-03-01T00:00:00.000Z
tags:
  - nvim
  - vi
description: Setting up Neovim for a keyboard driven workflow
---

# Neovim 0.12 Configuration

A minimal yet essential Neovim configuration built for modern development workflows. This setup prioritizes keyboard-centric navigation, LSP-native features, and a clean, distraction-free editing experience.

## Philosophy

- **Minimal but Essential**: Only plugins that directly enhance productivity
- **Modern Neovim 0.12**: Leverages native LSP (`vim.lsp.config`/`vim.lsp.enable`) instead of lspconfig wrappers
- **Keyboard-First**: Tmux-style keybindings, no mouse dependency
- **Transparent UI**: All colorschemes use terminal background
- **Performance**: Lazy loading, disabled unnecessary built-ins, optimized for fast startup

## Architecture

![Drawing 2026-03-01 17.30.22](/images/drawing-2026-03-01-17-30-22.png)
### Core Structure

```
~/.config/nvim/
├── init.lua                 # Entry point: sets leader keys, loads config
├── lua/
│   ├── config/
│   │   ├── lazy.lua        # Plugin manager bootstrap
│   │   ├── options.lua     # Editor settings (folding, UI, behavior)
│   │   ├── keymaps.lua     # Global keybindings
│   │   └── autocmds.lua    # Auto-commands (highlight yank, restore cursor, etc.)
│   └── plugins/
│       ├── lsp-lang.lua    # LSP configuration (Java, Go, Rust, TS, Lua)
│       ├── treesitter.lua  # Syntax highlighting
│       ├── completion.lua  # Blink.cmp for autocompletion
│       ├── formatting.lua  # Conform.nvim for code formatting
│       ├── snacks.lua      # Picker, dashboard, git, terminal
│       ├── coding.lua      # Comments, surround, gitsigns
│       ├── explorer.lua    # Oil.nvim file explorer
│       ├── colorscheme.lua # 6 colorschemes with transparency
│       ├── lualine.lua     # Statusline
│       └── ...
├── KEYBINDINGS.md          # Comprehensive keybinding reference
└── README.md               # This file
```

### Plugin Manager: Lazy.nvim

- **Auto-bootstrap**: Clones itself on first run
- **Lazy loading**: Plugins load on events (`BufReadPost`, `InsertEnter`, etc.)
- **Performance optimizations**: Disables unused built-ins (netrw, gzip, tutor, etc.)
- **Spec-based**: All plugins in `lua/plugins/*.lua` are auto-imported

## Core Components

### 1. LSP & Debug (`lsp-lang.lua`, `debug.lua`)

**Modern Neovim 0.12 native LSP** + **nvim-dap debugging**:
- Java, Go, Rust, TypeScript, Lua support
- Auto-install via Mason
- Format on save with Conform.nvim
- Debug with F-keys (F5/F9/F10/F11/F12)
- UI panels for variables, call stack, console

See [LSP.md](LSP.md) for complete setup and usage.

### 2. Treesitter (`treesitter.lua`)

**Configuration**:
- `lazy=false`, `priority=1000` to load before LSP (fixes first-file highlighting)
- 21 languages pre-configured (Java, Go, Rust, TS, Lua, etc.)
- `auto_install=false` to avoid bloat (manual parser installation)
- Textobjects for smart selections (`vaf`, `vif`, `vac`, `vic`)
- Incremental selection with `<C-space>`

**Why Treesitter First**:
- Prevents race condition where first opened file has no syntax highlighting
- LSP loads at priority 900 (after treesitter)

### 3. Completion (`completion.lua`)

**Blink.cmp**:
- Modern, fast completion engine
- Sources: LSP → Path → Buffer → Snippets
- Auto-brackets for functions/methods
- Signature help while typing
- Keybindings: `<CR>` to accept, `<C-y>` alternative, `<Tab>/<S-Tab>` to navigate

**Why Blink over nvim-cmp**:
- Faster performance
- Better LSP integration
- Simpler configuration

### 4. Formatting (`formatting.lua`)

**Conform.nvim**:
- Format on save with 500ms timeout
- LSP fallback if no formatter configured
- Per-language formatters:
  - Lua: stylua
  - Java: google-java-format
  - JS/TS/React: prettier
  - Go/Rust: LSP formatting

**Integration**:
- `gq` operator uses Conform (e.g., `gqap` formats paragraph)
- `:Format` command for manual formatting
- `<leader>f` keybinding (unified across LSP and Conform)

### 5. File Explorer (`explorer.lua`)

**Oil.nvim**:
- Edit directories like buffers (Vim-native workflow)
- `-` opens parent directory
- `<leader>--` opens floating window
- `<C-h>/<C-l>` disabled to allow window navigation
- `<C-r>` to refresh

**Why Oil over Neo-tree**:
- Vim-like editing (delete files with `dd`, rename with `cw`)
- No tree UI complexity
- Minimal and fast

### 6. Snacks.nvim (`snacks.lua`)

**All-in-one QoL plugin**:
- **Picker**: Fuzzy finder (files, grep, buffers, git, LSP symbols)
- **Dashboard**: Startup screen with quick actions
- **Git**: Lazygit integration, blame line
- **Terminal**: Toggle terminal with `<C-/>`
- **Notifier**: Notification system
- **Zoxide**: Project navigation (`<leader>fp`)

**Key Keybindings**:
- `<leader>ff` - Find files
- `<leader>fg` - Grep
- `<leader>fb` - Buffers
- `<leader>fp` - Projects (zoxide)
- `<leader>gg` - Lazygit
- `<C-/>` - Toggle terminal

### 7. Colorschemes (`colorscheme.lua`)

**6 Colorschemes** (all with `transparent=true`):
1. **onedark** (default)
2. tokyonight
3. catppuccin
4. nightfox
5. kanagawa
6. rose-pine

**Switch**: `<leader>sC` opens colorscheme picker

### 8. Coding Enhancements (`coding.lua`)

- **Comment.nvim**: `gcc` to comment line, `gc` in visual mode
- **nvim-surround**: `ys`, `cs`, `ds` for surroundings
- **gitsigns**: Git hunks in sign column, stage/reset hunks
- **todo-comments**: Highlight TODO/FIXME/NOTE, jump with `]t`/`[t`

### 9. Options (`options.lua`)

**Key Settings**:
- **Folding**: LSP-based (`foldmethod=expr`, `foldexpr=vim.lsp.foldexpr()`)
- **No swap files**: `swapfile=false`, `backup=false`, `writebackup=false`
- **Persistent undo**: `undofile=true`, `undolevels=10000`
- **Line numbers**: Relative + absolute
- **Scroll offset**: `scrolloff=4` (keep 4 lines visible)
- **Global statusline**: Single statusline for all windows
- **Smooth scrolling**: For wrapped lines
- **Clipboard**: Syncs with system (except over SSH)

### 10. Keymaps (`keymaps.lua`)

**Window Management** (Tmux-style):
- `<leader>w|` - Split vertical
- `<leader>w-` - Split horizontal
- `<leader>wx` - Close window
- `<leader>wr` - Resize mode (hjkl to resize, smart edge detection)
- `<C-h/j/k/l>` - Navigate windows

**Buffer Navigation**:
- `<S-h>/<S-l>` - Previous/next buffer
- `<leader>bb` - Switch to alternate buffer
- `<leader>bd` - Delete buffer

**Editing**:
- `<A-j>/<A-k>` - Move lines up/down
- `J/K` in visual mode - Move selection up/down
- `</>` in visual mode - Indent (stays in visual mode)
- Visual paste (`p`) - Doesn't yank deleted text

**Quickfix/Location List**:
- `[q`/`]q` - Navigate quickfix
- `<leader>xq` - Close quickfix
- `<leader>xl` - Close location list

**Other**:
- `<Esc>` - Clear search highlight
- `<C-s>` - Save file (works in insert/normal/visual)
- `n/N` - Next/prev search (centered and unfolded)

See [KEYBINDINGS.md](KEYBINDINGS.md) for complete reference.

### 11. Autocmds (`autocmds.lua`)

- **Highlight on yank**: Brief highlight when yanking text
- **Restore cursor position**: Jump to last edit location on file open
- **Auto-resize windows**: Equal splits on terminal resize
- **Close with `q`**: For help, qf, man, etc.
- **Wrap and spell**: For text files (markdown, gitcommit)
- **Auto-create directories**: When saving to non-existent path
- **JSON conceallevel fix**: Disable concealing in JSON files

## Language Support

**LSP & Debugging**: Java, Go, Rust, TypeScript, Lua

**Quick Start**:
- LSP keybindings: `gd` (definition), `K` (hover), `gra` (actions), `grn` (rename)
- Debug keybindings: `F5` (start), `F9` (breakpoint), `F10/F11/F12` (step)
- Format: `<leader>f`

See [LSP.md](LSP.md) for detailed configuration and troubleshooting.

## Debugging & Troubleshooting

### Check Health
```vim
:checkhealth                    " All plugins
:checkhealth nvim-treesitter    " Treesitter
:checkhealth lsp                " LSP
```

### View Logs
```vim
:messages          " All messages
:Lazy log          " Plugin manager logs
:LspLog            " LSP logs
:LspInfo           " Attached LSP clients
:ConformInfo       " Available formatters
```

### Treesitter
```vim
:Inspect           " Show treesitter info under cursor
:InspectTree       " Show syntax tree
:EditQuery         " Edit treesitter queries
```

### Common Issues

**First file has no syntax highlighting**:
- Fixed by setting treesitter `lazy=false` with `priority=1000`

**Java imports not folding**:
- Requires LSP to compute folds first
- Uses `vim.lsp.foldexpr` wrapper to detect when folds are ready
- Only runs once per buffer via `vim.b[bufnr].imports_folded` flag

**Multi-module Maven project errors**:
- Ensure root detection finds parent pom (`.git` → `mvnw` → `gradlew`)
- Clear workspace cache: `rm -rf ~/.local/share/jdtls-workspace/`
- Restart Neovim

**LSP not attaching**:
- Check `:LspInfo` for client status
- Verify Mason installed tools: `:Mason`
- Check root detection: `:lua print(vim.lsp.get_clients()[1].config.root_dir)`

## Installation

1. **Backup existing config**:
   ```bash
   mv ~/.config/nvim ~/.config/nvim.bak
   ```

2. **Clone this config** (via chezmoi or directly):
   ```bash
   # Via chezmoi
   chezmoi init git@github.com:craftyprash/mysetup.git
   chezmoi apply

   # Or directly
   git clone <repo> ~/.config/nvim
   ```

3. **Install Neovim 0.12+**:
   ```bash
   # macOS
   brew install neovim

   # Arch Linux
   sudo pacman -S neovim
   ```

4. **Install dependencies**:
   - **Nerd Font**: For icons (e.g., JetBrainsMono Nerd Font)
   - **ripgrep**: For grep picker (`brew install ripgrep`)
   - **fd**: For file picker (`brew install fd`)
   - **lazygit**: For git UI (`brew install lazygit`)
   - **zoxide**: For project navigation (`brew install zoxide`)

5. **Launch Neovim**:
   ```bash
   nvim
   ```
   - Lazy.nvim auto-installs on first run
   - Mason auto-installs LSP servers and formatters
   - Treesitter parsers install manually: `:TSInstall <language>`

## Customization

### Add a Language

1. **Add LSP config** in `lsp-lang.lua`:
   ```lua
   vim.lsp.config("pyright", {
     settings = { python = { analysis = { typeCheckingMode = "basic" } } }
   })
   vim.lsp.enable({ "pyright", ... })
   ```

2. **Add formatter** in `formatting.lua`:
   ```lua
   formatters_by_ft = {
     python = { "black" },
   }
   ```

3. **Install tools** via Mason:
   ```lua
   ensure_installed = { "pyright", "black", ... }
   ```

### Change Colorscheme

Edit `colorscheme.lua`:
```lua
config = function()
  require("onedark").setup({ transparent = true })
  vim.cmd("colorscheme onedark")  -- Change this line
end
```

### Modify Keybindings

Edit `keymaps.lua`:
```lua
map("n", "<leader>ff", function() Snacks.picker.files() end, { desc = "Find Files" })
```

## Performance

- **Startup time**: ~50-80ms (measured with `nvim --startuptime`)
- **Lazy loading**: Most plugins load on events, not at startup
- **Disabled built-ins**: netrw, gzip, tutor, etc.
- **Treesitter**: No auto-install to avoid bloat
- **LSP**: Native Neovim 0.12 implementation (no lspconfig overhead)

## Credits

- **Neovim**: Modern Vim-based editor
- **Lazy.nvim**: Fast plugin manager by @folke
- **Snacks.nvim**: QoL plugin collection by @folke
- **Blink.cmp**: Fast completion engine by @saghen
- **nvim-jdtls**: Java LSP integration by @mfussenegger
- **Oil.nvim**: File explorer by @stevearc
- **Conform.nvim**: Formatter by @stevearc

