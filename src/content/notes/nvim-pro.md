---
title: Neovim - Crafting a Minimal Yet Capable Editor
date: 2026-08-09T00:00:00.000Z
tags:
  - nvim
  - lsp
  - editor
  - productivity
  - java
description: A high-level overview of nvim-pro — a minimal yet capable Neovim setup for polyglot programmers, and where to learn it.
---

# Neovim - Crafting a Minimal Yet Capable Editor

I've tried the batteries-included distros — LazyVim, NvChad — and they're impressive. But they often offer too much, while plain Neovim feels lacking. So like most long-time users, I ended up crafting my own: start from a baseline, add just enough to get the job done, and keep control of the rest.

The result is **[nvim-pro](https://github.com/craftyprash/nvim-pro)** — cutting-edge but pragmatic. This is a high-level overview of what it offers and where to learn it. The repository is always the source of truth.

## What it is

A cohesive, keyboard-driven editor for polyglot work. I've programmed in Java for nearly two decades, and also work across Go, TypeScript/React, and Rust — so nvim-pro is built for switching languages without switching mental models.

The philosophy is minimal but essential: no plugins you don't need, native Neovim 0.12 LSP (no lspconfig wrapper), lazy loading, and fast startup. Think system design — you don't add services you won't use.

## What it offers

- **Native LSP (Neovim 0.12)** with first-class support for Java, Go, Rust, TypeScript/React, and Lua.
- **Java, done properly** — jdtls with Lombok, a debug adapter, per-project workspace isolation, multi-module Maven support, and automatic import folding. Historically the painful part; here it works out of the box.
- **Keyboard-first workflow** — `<Space>` leader, window and buffer management with no mouse dependency, and `Ctrl-h/j/k/l` navigation.
- **Completion & formatting** — Blink.cmp for fast completion, Conform.nvim for format-on-save with per-language formatters.
- **Debugging** — nvim-dap with F-key controls and UI panels for variables, call stack, and console.
- **Files & pickers** — Oil.nvim (edit directories like a buffer) and Snacks (picker, git, terminal, zoxide).
- **Aesthetics that align** — six transparent colorschemes (default **kanagawa-wave**), chosen to match the terminal so everything shares one palette.
- **Optional AI** — an in-editor bridge to the Claude CLI (`claudecode.nvim`) under the `<leader>a` keys, if you want it.

## Pairs well with, but doesn't require, Ghostty + Herdr

I run it inside **Ghostty** with **Herdr** (my tmux replacement). Paired that way, the theme carries across Ghostty, Herdr, and Neovim, and `Ctrl-h/j/k/l` flows seamlessly between editor splits and Herdr panes.

That's an enhancement, not a dependency. nvim-pro works in any terminal — the Herdr integration (`herdr-splits`) stays inactive outside Herdr, so a standalone `nvim` or an IDE terminal behaves normally.

## Getting started

```bash
# Fresh install (back up any existing config first)
mv ~/.config/nvim ~/.config/nvim.bak 2>/dev/null
git clone https://github.com/craftyprash/nvim-pro.git ~/.config/nvim
nvim
```

On first launch, Lazy.nvim bootstraps and Mason installs the LSP servers and formatters. To trial it alongside your current config instead:

```bash
git clone https://github.com/craftyprash/nvim-pro.git ~/.config/nvim-pro
NVIM_APPNAME=nvim-pro nvim
```

Requires Neovim 0.12+, a Nerd Font (JetBrainsMono), and a few CLI tools: `ripgrep`, `fd`, `lazygit`, `zoxide`.

## Where to learn it

The repo carries the full documentation and a set of hands-on tutorials — start there rather than a long note here:

- **[Tutorials](https://github.com/craftyprash/nvim-pro/tree/main/tutorials)** — a guided series covering navigation, LSP and code, editing, the terminal, debugging, Java and Quarkus workflows, git, and Claude Code.
- **[KEYBINDINGS.md](https://github.com/craftyprash/nvim-pro/blob/main/KEYBINDINGS.md)** — complete keybinding reference.
- **[LSP.md](https://github.com/craftyprash/nvim-pro/blob/main/LSP.md)** — LSP setup and troubleshooting, including the Java details.
- **[README.md](https://github.com/craftyprash/nvim-pro/blob/main/README.md)** — technical overview.

## Final thoughts

This isn't meant to be everyone's editor. If you want batteries-included, stick with LazyVim or NvChad. nvim-pro is for learning how the pieces fit and then making it yours.

Clone it. Try it. Fork it. Cut the noise, focus on code.
