---
title: Neovim Editor
date: 2026-03-01T00:00:00.000Z
tags:
  - nvim
  - lsp
  - editor
description: Setting up Neovim
---

# Minimal Neovim Editor Setup

A minimal yet essential Neovim configuration built for modern development workflows. This setup prioritizes keyboard-centric navigation, LSP-native features, and a clean, distraction-free editing experience.
## Philosophy

- **Minimal but Essential**: Only plugins that directly enhance productivity
- **Modern Neovim 0.12**: Leverages native LSP (`vim.lsp.config`/`vim.lsp.enable`) 
- **Keyboard-First**: Tmux-style keybindings, no mouse dependency
- **Transparent UI**: All colorschemes use terminal background
- **Performance**: Lazy loading, disabled unnecessary built-ins, optimized for fast startup
- 
## Getting Started

### Plugin Manager: Lazy.nvim

- **Auto-bootstrap**: Clones itself on first run
- **Lazy loading**: Plugins load on events (`BufReadPost`, `InsertEnter`, etc.)
- **Performance optimizations**: Disables unused built-ins (netrw, gzip, tutor, etc.)
- **Spec-based**: All plugins in `lua/plugins/*.lua` are auto-imported

### Fresh Setup (Replace Existing Config)

```bash
# Backup your existing config if you have it (optional)  
mv ~/.config/nvim ~/.config/nvim.bak 2>/dev/null  
  
# Clone nvim-pro config  
git clone https://github.com/craftyprash/nvim-pro.git ~/.config/nvim  
  
# Start Neovim  
nvim
```

### Run Alongside Existing Config

Trying out without breaking your existing `nvim` config:
```bash
git clone https://github.com/craftyprash/nvim-pro.git ~/.config/nvim-pro

NVIM_APPNAME=nvim-pro nvim
```

You can add an alias for this setup this way in your `~/.zshrc` or `~/.bashrc`:
```bash
alias nvim-pro='NVIM_APPNAME=nvim-pro nvim'
```

Then depending on your shell you can `source ~/.zshrc` Or `source ~/.bashrc` and launch `nvim-pro`.
Or just restart your terminal and start:
```bash
nvim-pro
```

## Capabilities and Settings

```bash
~/.config/nvim/
├── init.lua        # Entry point: sets leader keys, loads config
├── lua/
│   ├── config/
│   │   ├── lazy.lua          # Plugin manager bootstrap
│   │   ├── options.lua       # Editor settings (folding, UI, behavior)
│   │   ├── keymaps.lua       # Global keybindings
│   │   └── autocmds.lua      # Auto-commands (highlight yank and more.)
│   └── plugins/
│       ├── lsp-lang.lua      # LSP configuration (Java, Go, Rust, TS, Lua)
│       ├── treesitter.lua    # Syntax highlighting
│       ├── completion.lua    # Blink.cmp for autocompletion
│       ├── formatting.lua    # Conform.nvim for code formatting
│       ├── snacks.lua        # Picker, dashboard, git, terminal
│       ├── coding.lua        # Comments, surround, gitsigns
│       ├── explorer.lua      # Oil.nvim file explorer
│       ├── colorscheme.lua   # 6 colorschemes with transparency
│       ├── lualine.lua       # Statusline
│       ├── tmux-navigator.lua
│       ├── icons.lua
│       ├── dressing.lua
│       └── ...
├── KEYBINDINGS.md          # Comprehensive keybinding reference
└── README.md               # Overview of nvim-pro
```

