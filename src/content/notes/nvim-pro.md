---
title: Neovim - Crafting a Minimal Yet Capable Editor
date: 2026-03-01T00:00:00.000Z
tags:
  - nvim
  - lsp
  - editor
  - productivity
  - java
description: Building a minimal yet powerful Neovim setup for polyglot programmers
---

# Neovim - Crafting a Minimal Yet Capable Editor

I've tried many Linux distros over the years. Arch based or Debian, Ubuntu based—you name it. Each one taught me something. What works. What doesn't. What matters.

The same goes for editors. I've explored LazyVim and NvChad, both are impressive. At times, I feel they offer too much, but plain Neovim also feels lacking. So, experienced Neovim users end up crafting their own config. I did too, and here I would like to share the one that strikes the right balance for me. It's like choosing between a framework and building from scratch. Sometimes you need the framework. Sometimes you need control, a preferred style is to start with a baseline and then add just enough to achieve your goal.

So what do I need Neovim for? I have primarily programmed in Java for nearly two decades now. I also work with Go and React for my project needs. I would like to try Rust. Given my polyglot style, I prefer a cohesive, VIM-based, keyboard-driven workflow for my programming needs. 

To build a truly cohesive environment, I leverage Neovim alongside:

- Ghostty: My preferred terminal emulator
- Tmux: For managing multiple terminal sessions (or workspaces) 
- Karabiner modifications: A single press of Caps Lock maps it to Esc; pressing and holding maps it to Ctrl.
- Aerospace: a keyboard-driven tiling window manager for macOS that allows fast workspace switching and more. It's an i3-like tiling window manager, but for macOS.

Not to forget, Aesthetics aren't optional. Font, colorscheme, transparency, blur. It all needs to align. Ghostty, Neovim, and tmux themes have to play nicely together.

The final crafted product is Nvim-Pro. Cutting-edge but pragmatic.

## Dependencies

For the full experience:

- **Neovim 0.12+**: At the time I wrote this, 0.12 wasn't released. I installed with `brew install --HEAD neovim`. You can check its availability and then use `brew install neovim`.
- **Nerd Font**: JetBrainsMono Nerd Font for icons
- **ripgrep**: `brew install ripgrep` (grep picker)
- **fd**: `brew install fd` (file picker)
- **lazygit**: `brew install lazygit` (git UI)
- **zoxide**: `brew install zoxide` (project navigation)

## Philosophy: Minimal but Essential

Think of it like system design. You don't add services you don't need. Same with plugins. What you get now is:

- **Modern Neovim 0.12**: Utilizes native LSP (no lspconfig wrapper) for zero overhead.
- **Keyboard-First**: Tmux-style keybindings and zero mouse dependency.
- **Aesthetics**: A transparent UI where themes for Neovim, Ghostty, and tmux align perfectly.
- **Performance**: Features lazy loading and disabled built-ins, achieving a 50-80ms startup time.
- **Polyglot Support**: First-class support for Java, Go, Rust, TypeScript, TailwindCSS, and Lua.

## Getting Started: Clone and Use

You can find the repository and full documentation here: https://github.com/craftyprash/nvim-pro.git

Two paths. Fresh install or run alongside your current config.

### Quick Install

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

Alternatively, you can run it alongside your current setup:

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

### Keyboard-Driven Workflow

Everything is keyboard-driven. Leader key is `<Space>`. Local leader is `\`.

Vim-tmux-navigator allows `<C-h/j/k/l>` to navigate both Neovim windows and tmux panes. Seamlessly.

**File Navigation** (via Snacks picker):
- `<leader>ff` - Find files
- `<leader>fg` - Grep across project
- `<leader>fb` - Switch buffers
- `<leader>fp` - Projects (zoxide integration)
- `<leader>fr` - Recent files

**Window Management** (Tmux-style):

Here, we use <leader>w for all window operations. The resize function I added makes it very similar (natural) to how Tmux resizes.

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

**Git** (via Snacks + Lazygit):
- `<leader>gg` - Lazygit
- `<leader>gf` - File history
- `<leader>gl` - Git log
- `<leader>gs` - Git status picker

**File Explorer** (Oil.nvim):
- `-` - Open parent directory
- `<leader>-` - Open in floating window

Full reference: [KEYBINDINGS.md](https://github.com/craftyprash/nvim-pro/blob/main/KEYBINDINGS.md)

### LSP Keybindings: Standard First, Custom Second

Here's the thing about keybindings. Neovim 0.12 ships with sensible LSP defaults. Why customize mindlessly?

I use the standard for the most part and only add custom ones where needed. Think of it like extending a base class. Don't override everything. Just what you need.

**Standard Neovim 0.12 LSP bindings** (along with few custom ones):
- `gd` - Go to definition
- `gD` - Go to declaration
- `K` - Hover documentation
- `gra` - Code actions
- `grn` - Rename symbol
- `grr` - Find references
- `gri` - Go to implementation
- `gO` - Document symbols

**Few useful additions**:
- `[d` and `]d` - Navigate diagnostics
- `<leader>f` - Format (unified via Conform.nvim)
- `<leader>ih` - Toggle inlay hints

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
- `<C-n>/<C-p>` - Navigate items
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

Programming is a visual task. Your editor should look good.

**Treesitter**: Loaded before LSP (`priority=1000`). Prevents first-file highlighting issues. Supports my preferred languages (21).

**Colorschemes**: While i added six themes, the default is **onedark** Atom's iconic theme which also aligns with the Ghostty and tmux themes.

**Icons and UI**: mini.icons for file icons. dressing.nvim for better vim.ui.select/input. lualine for a clean statusline. No bloat. Just polish.

**Terminal Integration**: Ghostty terminal. JetBrainsMono Nerd Font. 95% opacity. Background blur. Tmux with vim-tmux-navigator for seamless pane navigation. Toggle terminal in Neovim with `<C-/>`.

Everything aligned. Ghostty theme matches Neovim theme. Tmux theme matches both. Cohesive.

## Ghostty and Tmux Config

Ghostty makes use of Atom One Dark theme alongside font and blur effects:
`~/.config/ghostty/config`
```toml
theme = "Atom One Dark"
font-family = "JetBrainsMono Nerd Font"
font-size = 15
background-opacity = 0.95
background-blur-radius = 20
# macOS-specific settings
macos-titlebar-style = hidden
macos-option-as-alt = true

mouse-hide-while-typing = true

# Cursor
cursor-style = block
cursor-style-blink = false
```

Here's my Tmux config for reference:
`~/.tmux.conf`
```bash
# This ensures that tmux itself uses its 256-color mode
# Ghostty echo $TERM will also show tmux-256color
set -g default-terminal "tmux-256color" 

# ensure that xterm-256color (used by many terminals) supports true-color RGB
set -ag terminal-overrides ",xterm-256color:RGB" 

set -g escape-time 10            # escape time delay
set -g history-limit 1000000     # increase history size (from 2,000)
set -g renumber-windows on       # renumber all windows when any window is closed

# Enable tmux to pass clipboard operations through the terminal
set -g set-clipboard on          # use system clipboard
set -g allow-passthrough on

set -g status-position bottom    # top / bottom
set -g focus-events on           # enable focus events for terminals that support them, REQUIRED for vim-tmux-navigator to work

# remap prefix to Control + a
set -g prefix C-a
unbind C-b
bind C-a send-prefix

bind x kill-pane # skip "kill-pane 1? (y/n)" prompt

# switch mouse support on
set-option -g mouse on

# Set the base index for windows to 1 instead of 0
set -g base-index 1
setw -g pane-base-index 1

# Use vim keybindings in copy mode
setw -g mode-keys vi

# Resize panes using h, j, k, l
bind -r h resize-pane -L 2   # Resize 2 cells to the left
bind -r j resize-pane -D 2   # Resize 2 cells down
bind -r k resize-pane -U 2   # Resize 2 cells up
bind -r l resize-pane -R 2   # Resize 2 cells to the right

# split panes using | and -
unbind %
bind | split-window -h -c "#{pane_current_path}"

unbind '"'
bind - split-window -v -c "#{pane_current_path}"

bind c new-window -c "#{pane_current_path}"

bind C-l send-keys 'C-l'

# reload tmux C-a + r
unbind r
bind r source-file ~/.tmux.conf \; display-message "~/.tmux.conf reloaded"

# Copy and paste shortcuts (use "space" for selection)
bind -T copy-mode-vi 'v' send-keys -X begin-selection # start selecting text with "v"
bind -T copy-mode-vi 'y' send-keys -X copy-pipe-and-cancel "pbcopy"
unbind -T copy-mode-vi MouseDragEnd1Pane # don't exit copy mode when dragging with mouse

# Check if tpm is installed, if not, clone it
if-shell "[ ! -d ~/.tmux/plugins/tpm ]" \
  "run 'git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm && ~/.tmux/plugins/tpm/bin/install_plugins'"

# Set up tpm
set -g @plugin 'tmux-plugins/tpm'

# Set theme
source-file ~/.config/tmux/zed_inspired.tmux

# status overrides
set -g status-right ''
set -g status-left '#S'
set -g status-left-style 'fg=color8'
set -g status-position top
set -g status-justify absolute-centre

# for navigating panes and vim/nvim with Ctrl-hjkl
set -g @plugin 'christoomey/vim-tmux-navigator'

set -g @plugin 'tmux-plugins/tmux-yank'
set -g @yank_selection 'clipboard'
set -g @yank_selection_mouse 'clipboard'

# Initialize TMUX plugin manager (keep this line at the very bottom of tmux.conf)
run -b '~/.tmux/plugins/tpm/tpm'

# Default shell
set -g default-shell /bin/zsh
set -g default-command "zsh -l"
```

Here's the zed inspired theme used for Tmux:
`~/.config/tmux/zed_inspired.tmux`
```bash
### One Dark inspired tmux theme

# Base colors
set -g status-style "bg=#282c34 fg=#abb2bf"
set -g message-style "bg=#282c34 fg=#61afef"
set -g message-command-style "bg=#282c34 fg=#61afef"

# Pane borders
set -g pane-border-style "fg=#3e4451"
set -g pane-active-border-style "fg=#61afef"

# Status left/right
set -g status-left "#[fg=#61afef] #S "
set -g status-right "#[fg=#56b6c2] %Y-%m-%d  %H:%M "

# Window list
setw -g window-status-style "fg=#5c6370 bg=#282c34"
setw -g window-status-current-style "fg=#abb2bf bg=#282c34 bold"

setw -g window-status-format " #I:#W "
setw -g window-status-current-format " #I:#W "

# Mode (copy-mode etc.)
setw -g mode-style "bg=#3e4451 fg=#61afef"
```

## Java: The Special Case

Let's talk about Java. It's my primary language. Getting it to work in Neovim? Historically painful.

jdtls is powerful but complex. Multi-module Maven projects? Workspace collisions? Lombok? Debug adapters? Each one is a potential headache.

Our config in `nvim-pro` handles all of it. Out of the box.

### Java needs more parts setup to make it work 

**The components**:
1. **jdtls** - The LSP server
2. **Mason** - Tool installer
3. **Lombok** - Annotation processor
4. **java-debug-adapter** - For debugging
5. **Workspace** - Per-project isolation
6. **Root detection** - Finding project root

All of this is configured to work out of the box.

**Import Folding**: Java files have lots of imports. They clutter the view. This config automatically folds them when you open the file.

**Runtime Configuration**: Uses `mise` to find Java installation. No hardcoded paths.

```lua
runtimes = {
  {
    name = "JavaSE-21",
    path = vim.fn.trim(vim.fn.system("mise where java")),
  },
}
```

### The Result

Open a Java file. jdtls starts. Lombok works. Imports fold. Completions appear. Debugging works. It even works with multi-module Maven project.

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

## What's Missing: AI (For Now)

No AI editor integration yet. I do use opencode and alternatives more on that in future.
For now, Nvim-Pro is about fundamentals. A fast, focused editor that gets out of your way.
Like building a solid foundation before adding features.

## Final Thoughts

This isn't for everyone, and for what its worth, use it to learn and tweak to your needs. If you want batteries-included, stick with LazyVim or NvChad.

Clone it. Try it. Fork it. Make it yours.
The goal isn't to give you my editor. It's to show you how to build your own.
Cut the noise. Focus on code.

---

**Resources**:
- [GitHub: craftyprash/nvim-pro](https://github.com/craftyprash/nvim-pro)
- [KEYBINDINGS.md](https://github.com/craftyprash/nvim-pro/blob/main/KEYBINDINGS.md) - Complete keybinding reference
- [LSP.md](https://github.com/craftyprash/nvim-pro/blob/main/LSP.md) - Detailed LSP setup and troubleshooting
- [README.md](https://github.com/craftyprash/nvim-pro/blob/main/README.md) - Technical overview
