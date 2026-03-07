---
title: Git Workflow Note
date: 2026-03-07T00:00:00.000Z
tags:
  - git
description: Git workflow note for Tech Leads
---

# Git Workflow Note for Tech Leads

A practical guide for managing personal and work repositories, following [Conventional Commits](https://www.conventionalcommits.org/) and Semantic Versioning.

---

## The Multi-Identity Problem

When you use the same laptop for both personal projects and company work, a number of subtle but frustrating issues start to appear. The first set of problems usually shows up around **access**. SSH keys can easily get mixed up, so your personal GitHub key might try to authenticate against a company repository. At the same time, internal platforms such as Forgejo or GitLab often require completely different credentials than your personal GitHub account. The result is a constant stream of failed push and pull operations, usually ending in the familiar _“Permission denied”_ errors.

There are also **identity problems**. It’s easy to accidentally commit using the wrong author information—for example, using your personal email address in a work repository. 

Over time, repositories tend to accumulate in random places across the filesystem—`~/projects`, `~/code`, `~/work`, and other ad-hoc folders created over months or years. Remembering where a particular project lives becomes harder, and there’s no clear separation between personal and work code. Switching contexts between them becomes unnecessarily difficult.

The end result is a workflow where you constantly fight with SSH keys, repeatedly adjust `user.name` and `user.email` settings for individual repositories, and waste time searching the filesystem just to find the project you want to work on.

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
```

Here, replace `acme-corp` with your actual company or organization name. 

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
```

**Step 4: Clone repos with ghq**
```bash
# Personal project
ghq get github.com/prashant/personal-blog

# Work project
ghq get github.com/acme-corp/api-service
```

**Result:**
```
~/Developer/
├── github.com/
│   ├── prashant/
│   │   └── personal-blog/      # Uses personal@example.com + personal SSH key
│   └── acme-corp/
│       └── api-service/        # Uses prashant@company.com + work SSH key
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

## ghq: Repository Organization

### The Problem

Without **ghq**, repos end up scattered:
```
~/projects/api-service/
~/code/personal-blog/
~/work/auth-service/
~/Downloads/some-repo/
```

You waste time remembering paths and navigating directories.

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

# Jump to repo (with fzf)
cd $(ghq root)/$(ghq list | fzf)
```

---

## Complete Configuration Files

### ~/.gitconfig

```ini
[user]
    name = Prashant P
    email = personal@example.com

[pull]
  ff = only                           # Only fast-forward, prevents accidental merges

[core]
  editor = vim
  excludesfile = ~/.global-ignore
  autocrlf = input
  pager = delta

[interactive]
  diffFilter = delta

[delta]
  syntax-theme = OneHalfDark
  side-by-side = true                 # Split view for diffs
  line-numbers = true
  navigate = true                     # n/N to jump between files
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

## Daily Workflow

### Morning Routine

```bash
# Navigate to repo
cd $(ghq root)/forgejo.company.com/platform/auth-service

# Update main branch
git checkout main
git pull                              # ff-only, safe

# Update feature branch
git checkout feat/oauth-integration
git fetch origin
git rebase origin/main                # Keep history clean
```

### Feature Development

```bash
# Start new feature
git checkout main
git pull
git checkout -b feat/add-2fa-support

# Work and commit
git add -p                            # Stage interactively (review chunks)
git commit                            # Opens vim with template

# Quick commit (when template not needed)
git commit -m "feat: add TOTP generation for 2FA"

# Push to remote
git push -u origin feat/add-2fa-support
```

**Rebase vs Merge:**
```
Feature branch workflow:

main:     A---B---C---D
               \
feature:        E---F---G

After rebase (cleaner history):
main:     A---B---C---D
                       \
feature:                E'--F'--G'

After merge (preserves history):
main:     A---B---C---D---M
               \         /
feature:        E---F---G
```

```bash
# Rebase (recommended for feature branches)
git checkout feat/add-2fa-support
git rebase origin/main

# If conflicts occur
git status                            # See conflicted files
# Fix conflicts in editor
git add <resolved-files>
git rebase --continue
git rebase --abort                    # Abort if needed

# Merge (use for long-lived branches)
git checkout main
git merge --no-ff feat/add-2fa-support
```

### Reviewing Code

```bash
# Fetch latest from remote
git fetch origin

# Review someone's PR branch
git checkout -b review/oauth-pr origin/feat/oauth-integration

# Compare with main (delta shows side-by-side)
git diff main...feat/oauth-integration

# See what commits are in the branch
git log main..feat/oauth-integration --oneline

# Check file history
git log --follow -- src/auth/oauth.js
git blame src/auth/oauth.js           # Who changed what, line by line

# Search for specific changes
git log --grep="oauth"                # Search commit messages
git log -S "generateToken"            # Search code changes (when was this added/removed)
```

### Cleaning Up Commits

```bash
# Squash last 3 commits into one
git rebase -i HEAD~3

# In vim, change 'pick' to 's' (squash):
# pick abc1234 feat: add oauth client
# s    def5678 fix: typo in oauth
# s    ghi9012 refactor: cleanup oauth code
# Save and edit combined commit message

# Squash all commits in feature branch
git rebase -i origin/main

# Amend last commit (fix message or add forgotten files)
git commit --amend
git add forgotten-file.js
git commit --amend --no-edit          # Don't edit message

# Push after rewriting history
git push --force-with-lease           # Safer than --force (checks remote hasn't changed)
```

### Hotfix Workflow

```bash
# Create hotfix from production
git checkout main
git pull
git checkout -b hotfix/fix-payment-crash

# Make fix and test
git add src/payment/processor.js
git commit -m "fix: prevent null pointer in payment processor"

# Review before pushing
git diff origin/main                  # What changed
git log origin/main..HEAD --oneline   # Commits to be pushed

# Push and create PR
git push -u origin hotfix/fix-payment-crash
```

---

## Branch Management

### Comparing Branches

```bash
# See commits in feature not in main
git log main..feat/oauth-integration --oneline

# See commits in main not in feature
git log feat/oauth-integration..main --oneline

# Visual graph of all branches
git log --graph --oneline --all

# Diff between branches (changes in feature only)
git diff main...feat/oauth-integration
```

**Understanding branch divergence:**
```
main:     A---B---C---D
               \
feature:        E---F

git log main..feature        # Shows: E, F (what's new in feature)
git log feature..main        # Shows: C, D (what's new in main)
git diff main...feature      # Shows changes in E, F only
```

### Branch Cleanup

```bash
# Delete merged local branch
git branch -d feat/completed-feature

# Force delete unmerged branch
git branch -D feat/abandoned-feature

# Delete remote branch
git push origin --delete feat/old-feature

# Clean up stale remote references
git fetch --prune

# List branches with tracking info
git branch -vv
```

---

## Context Switching

### Using Stash

```bash
# Save work in progress
git stash                             # Quick stash
git stash push -m "WIP: oauth token refresh logic"

# List stashes
git stash list

# Apply stash (keep in stash list)
git stash apply stash@{0}

# Apply and remove from list
git stash pop

# Create branch from stash
git stash branch feat/recovered-work stash@{0}

# Clear all stashes
git stash clear
```

---

## Merging & Releasing

### Merge Strategies

```bash
# Fast-forward merge (no merge commit)
git checkout main
git merge feat/simple-fix             # Only if ff possible

# No fast-forward (always create merge commit)
git merge --no-ff feat/oauth-integration

# Squash merge (combine all commits into one)
git merge --squash feat/small-feature
git commit -m "feat: add rate limiting"
```

**Merge commit visualization:**
```
Before merge:
main:     A---B---C
               \
feature:        D---E

After --no-ff:
main:     A---B---C-------M
               \         /
feature:        D---E

After --squash:
main:     A---B---C---S
               \
feature:        D---E (not in history, just content)
```

### Tagging Releases

```bash
# Semantic versioning: vMAJOR.MINOR.PATCH
# MAJOR: breaking changes (v2.0.0)
# MINOR: new features (v1.3.0)
# PATCH: bug fixes (v1.2.1)

# Create annotated tag
git tag -a v1.3.0 -m "Release v1.3.0: OAuth integration"

# Tag specific commit
git tag -a v1.2.1 abc1234 -m "Hotfix: payment crash"

# Push tags
git push origin v1.3.0
git push origin --tags                # Push all tags

# List tags (sorted by version)
git tag -l --sort=-v:refname

# Delete tag
git tag -d v1.3.0                     # Local
git push origin --delete v1.3.0       # Remote

# Checkout tag for hotfix
git checkout v1.2.0
git checkout -b hotfix/v1.2.1 v1.2.0
```

---

## Changelog Generation with git-cliff

### The Problem

Manually writing changelogs is tedious and error-prone. You need to:
- Review all commits since last release
- Group by type (features, fixes, breaking changes)
- Format consistently
- Keep updating as you add commits

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
## [1.3.0] - 2024-01-15

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
# Before release
git cliff --unreleased                # Preview what will be in changelog

# Create release
git tag -a v1.3.0 -m "Release v1.3.0"
git cliff --tag v1.3.0 --output CHANGELOG.md
git add CHANGELOG.md
git commit -m "chore: update changelog for v1.3.0"
git push origin main --tags

# Or combine
git cliff --tag v1.3.0 -o CHANGELOG.md && \
  git add CHANGELOG.md && \
  git commit -m "chore: update changelog for v1.3.0" && \
  git push origin main --tags
```

### Configuration (cliff.toml)

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

## Undoing Changes

### Reset (Rewrite History)

```bash
# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Undo last commit, keep changes unstaged
git reset HEAD~1                      # Default is --mixed

# Undo last commit, discard changes
git reset --hard HEAD~1

# Reset to match remote (discard all local changes)
git fetch origin
git reset --hard origin/main
```

**Reset modes:**
```
Initial:  A---B---C (HEAD)
          Changes staged and in working dir

--soft HEAD~1:
          A---B (HEAD)
          Changes still staged (ready to commit)

--mixed HEAD~1 (default):
          A---B (HEAD)
          Changes unstaged but in working dir

--hard HEAD~1:
          A---B (HEAD)
          Changes discarded (gone forever)
```

### Revert (Safe Undo)

```bash
# Create new commit that undoes a commit (safe for shared branches)
git revert abc1234

# Revert without committing (review first)
git revert -n abc1234
```

### Discard Changes

```bash
# Discard unstaged changes
git checkout -- src/auth/login.js     # Single file
git checkout -- .                     # All files

# Unstage files (keep changes in working dir)
git reset HEAD src/auth/login.js

# Remove untracked files and directories
git clean -fd                         # -f force, -d directories
git clean -fdn                        # Dry run (preview what will be deleted)
```

---

## Recovery

### Using Reflog

Reflog records every HEAD movement - your safety net for recovering "lost" commits.

```bash
# View all Git actions (commits, resets, checkouts)
git reflog

# Recover lost commit
git reflog
git checkout abc1234
git checkout -b recovered-branch

# Undo accidental reset
git reflog
git reset --hard HEAD@{2}             # Go back 2 actions

# Recover deleted branch
git reflog
git checkout -b recovered-branch HEAD@{5}
```

**Reflog example:**
```
abc1234 HEAD@{0}: commit: feat: add oauth
def5678 HEAD@{1}: reset: moving to HEAD~1
ghi9012 HEAD@{2}: commit: fix: typo
```

---

## Advanced Operations

### Cherry-pick

Apply specific commits from one branch to another.

```bash
# Apply specific commit to current branch
git cherry-pick abc1234

# Cherry-pick without committing (review first)
git cherry-pick -n abc1234

# Cherry-pick range
git cherry-pick abc1234^..def5678

# Abort cherry-pick
git cherry-pick --abort
```

---

## Pull Strategy

Your config uses `pull.ff = only` - this prevents accidental merge commits.

```bash
# With ff = only configured:
git pull                              # Only succeeds if fast-forward possible

# If remote has diverged:
git pull --rebase                     # Rebase your commits (recommended)
git pull --no-ff                      # Create merge commit
```

**Recommendation:** Keep `pull.ff = only` for main/develop. Use `git pull --rebase` on feature branches.

---

## Quick Reference

### Conventional Commits

See [conventionalcommits.org](https://www.conventionalcommits.org/)

```
feat:     New feature (minor bump)
fix:      Bug fix (patch bump)
docs:     Documentation
refactor: Code restructuring
test:     Tests
chore:    Maintenance
perf:     Performance
ci:       CI/CD
```

### Semantic Versioning

```
v1.0.0 - Initial release
v1.1.0 - New feature (minor bump)
v1.1.1 - Bug fix (patch bump)
v2.0.0 - Breaking change (major bump)
```

### Delta Navigation

```
n / N       Next/previous file
Ctrl+d / u  Scroll down/up
q           Quit
```

### Common Patterns

```bash
# Daily start
git checkout main && git pull
git checkout feat/my-feature && git rebase origin/main

# Before PR
git rebase -i origin/main             # Clean up commits
git push --force-with-lease

# After PR merged
git checkout main && git pull
git branch -d feat/my-feature
git fetch --prune

# Generate changelog and release
git cliff --unreleased                # Preview
git cliff --tag v1.3.0 -o CHANGELOG.md
git add CHANGELOG.md
git commit -m "chore: update changelog for v1.3.0"
git push origin main --tags
```
