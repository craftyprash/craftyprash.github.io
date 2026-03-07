---
title: Git Setup Guide - Multi-Identity & Best Practices
date: 2026-02-28T00:00:00.000Z
tags:
  - git
  - setup
  - workflow
description: >-
  Complete note on setting up Git to handle personal and work repositories on
  the same machine, with multi-identity support, conventional commits, ghq, and
  git-cliff
---

# Git Setup: Multi-Identity & Best Practices

A note for setting up Git to handle personal and work repositories on the same machine, with support for [Conventional Commits](https://www.conventionalcommits.org/) and automated changelog generation.

For daily Git commands and workflows, see [Git Workflow Cheat Sheet](/notes/git-workflow-cheat-sheet)

---

## The Multi-Identity Problem

When you use the same laptop for both personal projects and company work, a number of subtle but frustrating issues start to appear. The first set of problems usually shows up around **access**. SSH keys can easily get mixed up, so your personal GitHub key might try to authenticate against a company repository. At the same time, internal platforms such as Forgejo or GitLab often require completely different credentials than your personal GitHub account. The result is a constant stream of failed push and pull operations, usually ending in the familiar _"Permission denied"_ errors.

There are also **identity problems**. It's easy to accidentally commit using the wrong author information—for example, using your personal email address in a work repository. Company policy often requires work email for all work commits, but Git doesn't automatically know which identity to use. You end up manually setting `user.name` and `user.email` for each repository, or worse, discovering the wrong identity after commits are already pushed.

There's the **organization problem** too. Over time, repositories tend to accumulate in random places across the filesystem—`~/projects`, `~/code`, `~/work`, and other ad-hoc folders created over months or years. Remembering where a particular project lives becomes harder, and there's no clear separation between personal and work code. Switching contexts between them becomes unnecessarily difficult.

The end result is a workflow where you constantly fight with SSH keys, repeatedly adjust configuration settings for individual repositories, and waste time searching the filesystem just to find the project you want to work on.

---

## Solution: Multi-Identity Setup

We'll solve this with three tools working together:

1. **ghq** - Organizes repos by host/org/repo structure
2. **Git includeIf** - Auto-switches identity based on directory
3. **SSH config** - Routes correct SSH key based on host/username

### Recipe

Let's create a `~/Developer` folder which will be our root folder for all git repos.

**Step 1: Install ghq**
```bash
brew install ghq
git config --global ghq.root ~/Developer
```

**Step 2: Configure Git with conditional includes**

Edit `~/.gitconfig` to set default identity and override for work repos:

```ini
[user]
    name = Prashant P
    email = personal@example.com

# Work repos auto-use work identity
[includeIf "gitdir:~/Developer/github.com/acme-corp/**"]
  path = ~/.git-work-config
[includeIf "gitdir:~/Developer/forgejo.company.com/**"]
  path = ~/.git-work-config
```

Replace `acme-corp` with your actual company or organization name.

Then create `~/.git-work-config`:
```ini
[user]
    name = Prashant P
    email = prashant@company.com
```

**Step 3: Configure SSH keys per host**

Edit `~/.ssh/config`:
```
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentitiesOnly yes

# Personal GitHub
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/keys/github_personal_ed25519

# Work GitHub (override for company org)
Match host github.com exec "echo %r | grep -q 'acme-corp'"
  IdentityFile ~/.ssh/keys/github_work_ed25519

# Work Forgejo
Host forgejo.company.com
  HostName forgejo.company.com
  Port 222
  User git
  IdentityFile ~/.ssh/keys/forgejo_work_ed25519
```

**Step 4: Clone repos with ghq**
```bash
# Personal project
ghq get github.com/prashant/personal-blog

# Work project
ghq get github.com/acme-corp/api-service
ghq get forgejo.company.com/platform/auth-service
```

**Result:**
```
~/Developer/
├── github.com/
│   ├── prashant/
│   │   └── personal-blog/      # Uses personal@example.com + personal SSH key
│   └── acme-corp/
│       └── api-service/        # Uses prashant@company.com + work SSH key
└── forgejo.company.com/
    └── platform/
        └── auth-service/       # Uses prashant@company.com + work SSH key
```

**Verify it works:**
```bash
cd $(ghq root)/github.com/prashant/personal-blog
git config user.email              # Shows: personal@example.com

cd $(ghq root)/github.com/acme-corp/api-service
git config user.email              # Shows: prashant@company.com
```

---

## Conventional Commits: Why & How

### The Problem

Without commit message standards:
- Unclear what changed: "fix stuff", "updates", "wip"
- Can't auto-generate changelogs
- Hard to understand impact (bug fix vs breaking change)
- Difficult to filter commits by type
- No way to automatically determine version bumps

### The Solution

[Conventional Commits](https://www.conventionalcommits.org/) provides a standard format:

```
<type>: <description>

[optional body]

[optional footer]
```

**Benefits:**
- **Automated changelogs** - Tools can group commits by type
- **Semantic versioning** - Auto-determine version bumps (feat = minor, fix = patch, BREAKING = major)
- **Clear history** - Instantly understand what each commit does
- **Better collaboration** - Team speaks same language
- **Easier code review** - Reviewers quickly understand scope of changes

### Setup: Commit Message Template

Create `~/.gitmessage`:
```
# <type>: <subject> (max 50 chars)
# |<----  Using a Maximum Of 50 Characters  ---->|


# Explain why this change is being made (wrap at 72 chars)
# |<----   Try To Limit Each Line to a Maximum Of 72 Characters   ---->|


# --- CONVENTIONAL COMMIT TYPES ---
# feat:     New feature (minor version bump)
# fix:      Bug fix (patch version bump)
# docs:     Documentation only
# style:    Formatting, missing semicolons (no code change)
# refactor: Code change that neither fixes bug nor adds feature
# perf:     Performance improvement
# test:     Adding or updating tests
# chore:    Maintenance (dependencies, build, etc)
# ci:       CI/CD changes
# build:    Build system changes
# revert:   Revert previous commit
#
# --- EXAMPLES ---
# feat: add user authentication endpoint
# fix: resolve payment timeout on slow networks
# docs: update API documentation for v2 endpoints
# refactor: simplify error handling in auth service
#
# --- BREAKING CHANGES ---
# Add "BREAKING CHANGE:" in body or append "!" after type
# feat!: remove deprecated v1 API endpoints
#
# BREAKING CHANGE: v1 endpoints no longer supported
```

Configure Git to use it:
```bash
git config --global commit.template ~/.gitmessage
```

**Usage:**
```bash
git commit                    # Opens vim with template as guide
```

---

## Repository Organization with ghq

### The Problem

Without **ghq**, repos end up scattered:
```
~/projects/api-service/
~/code/personal-blog/
~/work/auth-service/
~/Downloads/some-repo/
```

You waste time remembering paths and navigating directories. Worse, you might have naming conflicts (two different `api-service` repos from different companies).

### The Solution

**ghq** organizes repos by their remote URL structure:

```bash
ghq get github.com/acme-corp/api-service
# Clones to: ~/Developer/github.com/acme-corp/api-service

ghq get forgejo.company.com/platform/auth-service
# Clones to: ~/Developer/forgejo.company.com/platform/auth-service
```

**Benefits:**
- **Predictable paths** - Always know where repos live
- **No naming conflicts** - Different orgs can have same repo name
- **Easy navigation** - Use `ghq list` and fuzzy finders
- **Works with includeIf** - Directory structure enables auto-identity switching
- **Consistent across machines** - Same structure on all your computers

### Setup & Usage

```bash
# Install
brew install ghq

# Configure root directory
git config --global ghq.root ~/Developer

# Clone repos
ghq get github.com/acme-corp/api-service
ghq get forgejo.company.com/platform/auth-service

# List all repos
ghq list

# List with full paths
ghq list -p

# Jump to repo (with fzf for fuzzy finding)
cd $(ghq root)/$(ghq list | fzf)

# Or use ghq look (fuzzy match)
ghq look api-service
```

---

## Changelog Generation with git-cliff

### The Problem

Manually writing changelogs is tedious and error-prone. You need to:
- Review all commits since last release
- Group by type (features, fixes, breaking changes)
- Format consistently
- Keep updating as you add commits
- Remember what was already documented

### The Solution

[git-cliff](https://git-cliff.org/) auto-generates changelogs from conventional commits.

### Setup

```bash
# Install
brew install git-cliff

# Create config (optional, has good defaults)
git cliff --init
```

### Usage

```bash
# Generate changelog for all commits
git cliff

# Generate for specific range
git cliff v1.2.0..HEAD

# Generate for latest tag
git cliff --latest

# Output to file
git cliff --output CHANGELOG.md

# Preview next version changelog (unreleased)
git cliff --unreleased

# Generate and tag release
git cliff --tag v1.3.0
```

**Example output:**
```markdown
## [1.3.0] - 2026-01-15

### Features
- add OAuth2 integration
- add rate limiting middleware
- add user profile endpoints

### Bug Fixes
- resolve payment timeout on slow networks
- fix null pointer in auth handler

### Documentation
- update API documentation for v2 endpoints
```

### Workflow Integration

```bash
# Before release - preview what will be in changelog
git cliff --unreleased

# Create release with changelog
git tag -a v1.3.0 -m "Release v1.3.0"
git cliff --tag v1.3.0 --output CHANGELOG.md
git add CHANGELOG.md
git commit -m "chore: update changelog for v1.3.0"
git push origin main --tags

# Or combine into one command
git cliff --tag v1.3.0 -o CHANGELOG.md && \
  git add CHANGELOG.md && \
  git commit -m "chore: update changelog for v1.3.0" && \
  git push origin main --tags
```

### Configuration (cliff.toml)

Create `cliff.toml` in your repo root for custom formatting:

```toml
[changelog]
header = """
# Changelog\n
All notable changes to this project will be documented in this file.\n
"""
body = """
{% for group, commits in commits | group_by(attribute="group") %}
    ### {{ group | upper_first }}
    {% for commit in commits %}
        - {{ commit.message | upper_first }}
    {% endfor %}
{% endfor %}
"""

[git]
conventional_commits = true
filter_unconventional = true
commit_parsers = [
    { message = "^feat", group = "Features"},
    { message = "^fix", group = "Bug Fixes"},
    { message = "^doc", group = "Documentation"},
    { message = "^perf", group = "Performance"},
    { message = "^refactor", group = "Refactoring"},
    { message = "^style", group = "Styling"},
    { message = "^test", group = "Testing"},
    { message = "^chore", group = "Miscellaneous"},
]
```

---

## Complete Configuration Files

### ~/.gitconfig

```ini
[user]
    name = Prashant P
    email = personal@example.com

[pull]
  ff = only                   # Only fast-forward, prevents accidental merges

[core]
  editor = vim
  excludesfile = ~/.global-ignore
  autocrlf = input
  pager = delta

[interactive]
  diffFilter = delta

[delta]
  syntax-theme = OneHalfDark
  side-by-side = true                # Split view for diffs
  line-numbers = true
  navigate = true                    # n/N to jump between files
  dark = true
  plus-style = syntax
  minus-style = syntax

[commit]
  template = ~/.gitmessage

[ghq]
  root = ~/Developer

# Override identity for work repos
[includeIf "gitdir:~/Developer/github.com/acme-corp/**"]
  path = ~/.git-work-config
[includeIf "gitdir:~/Developer/forgejo.company.com/**"]
  path = ~/.git-work-config

[alias]
  st = status -sb
  co = checkout
  br = branch -vv
  ci = commit
  unstage = reset HEAD
  last = log -1 HEAD
  lg = log --graph --oneline --all --decorate
  ll = log --pretty=format:'%C(yellow)%h%Creset %C(blue)%ad%Creset %s %C(green)(%an)%Creset' --date=short
  amend = commit --amend --no-edit
  undo = reset --soft HEAD~1
  wip = commit -am "WIP"
  cleanup = !git branch --merged | grep -v '\\*\\|main\\|develop' | xargs -n 1 git branch -d
```

### ~/.git-work-config

```ini
[user]
    name = Prashant P
    email = prashant@company.com
```

### ~/.gitmessage

```
# <type>: <subject> (max 50 chars)
# |<----  Using a Maximum Of 50 Characters  ---->|


# Explain why this change is being made (wrap at 72 chars)
# |<----   Try To Limit Each Line to a Maximum Of 72 Characters   ---->|


# --- CONVENTIONAL COMMIT TYPES ---
# feat:     New feature (minor version bump)
# fix:      Bug fix (patch version bump)
# docs:     Documentation only
# style:    Formatting, missing semicolons (no code change)
# refactor: Code change that neither fixes bug nor adds feature
# perf:     Performance improvement
# test:     Adding or updating tests
# chore:    Maintenance (dependencies, build, etc)
# ci:       CI/CD changes
# build:    Build system changes
# revert:   Revert previous commit
#
# --- EXAMPLES ---
# feat: add user authentication endpoint
# fix: resolve payment timeout on slow networks
# docs: update API documentation for v2 endpoints
# refactor: simplify error handling in auth service
#
# --- BREAKING CHANGES ---
# Add "BREAKING CHANGE:" in body or append "!" after type
# feat!: remove deprecated v1 API endpoints
#
# BREAKING CHANGE: v1 endpoints no longer supported
```

### ~/.global-ignore

```
# Build artifacts
.gradle/
build/
target/
classes/

# IDEs
.idea/
*.iml
*.ipr
*.iws
.vscode/
.settings/
.project
.classpath

# OS
.DS_Store
Thumbs.db

# Temp files
*.swp
*.swo
node_modules/
npm-debug.log
```

### ~/.ssh/config

```
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentitiesOnly yes

# Personal GitHub
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/keys/github_personal_ed25519

# Work GitHub (override for company org)
Match host github.com exec "echo %r | grep -q 'acme-corp'"
  IdentityFile ~/.ssh/keys/github_work_ed25519

# Work Forgejo
Host forgejo.company.com
  HostName forgejo.company.com
  Port 222
  User git
  IdentityFile ~/.ssh/keys/forgejo_work_ed25519
```

---

## Next Steps

Once you have this setup configured, see  [Git Workflow Cheat Sheet](/notes/git-workflow-cheat-sheet) for daily Git commands and workflows including:
- Feature development
- Code review
- Branch management
- Merging and releasing
- Undoing changes
- Recovery operations
