---
title: Git Workflow
date: 2026-03-01T00:00:00.000Z
tags:
  - git
description: Git Workflow Cheat Sheet
---

# Git Workflow Cheat Sheet

A practical guide for tech leads managing feature development, code reviews, and releases using ghq, [Conventional Commits](https://www.conventionalcommits.org/), and Semantic Versioning.

---

## Setup

### ghq - Repository Management

```bash
# Install and configure
brew install ghq
git config --global ghq.root ~/Developer

# Clone repos (auto-organized by host/org/repo)
ghq get github.com/acme-corp/api-service
ghq get forgejo.company.com/platform/auth-service

# Navigate
ghq list                              # List all repos
cd $(ghq root)/github.com/acme-corp/api-service
```

**Directory structure:**
```
~/Developer/
├── github.com/
│   ├── acme-corp/
│   │   └── api-service/
│   └── prashant/
│       └── personal-project/
└── forgejo.company.com/
    └── platform/
        └── auth-service/
```

### Multi-Identity Configuration

Separate work and personal Git identities based on repository location.

**~/.gitconfig**
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

# Override identity for work repos
[includeIf "gitdir:~/Developer/github.com/acme-corp/**"]
  path = ~/.git-work-config
[includeIf "gitdir:~/Developer/forgejo.company.com/**"]
  path = ~/.git-work-config
```

**~/.git-work-config**
```ini
[user]
    name = Prashant P
    email = prashant@company.com
```

**~/.global-ignore**
```
# Build artifacts
.gradle/
build/
target/
classes/

# IDEs
.idea/
*.iml
.vscode/
.settings/

# OS
.DS_Store
Thumbs.db

# Temp files
*.swp
*.swo
node_modules/
```

### SSH Key Management

**~/.ssh/config**
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

# Work GitHub (override for specific username)
Match host github.com exec "echo %r | grep -q 'acme-corp'"
  IdentityFile ~/.ssh/keys/github_work_ed25519

# Work Forgejo
Host forgejo.company.com
  HostName forgejo.company.com
  Port 222
  User git
  IdentityFile ~/.ssh/keys/forgejo_work_ed25519
```

### Commit Message Template

**~/.gitmessage**
```
# <type>: <subject> (max 50 chars)
# |<----  Using a Maximum Of 50 Characters  ---->|


# Explain why this change is being made (wrap at 72 chars)
# |<----   Try To Limit Each Line to a Maximum Of 72 Characters   ---->|


# --- CONVENTIONAL COMMIT TYPES ---
# feat:     New feature
# fix:      Bug fix
# docs:     Documentation only
# style:    Formatting, missing semicolons, etc (no code change)
# refactor: Code change that neither fixes a bug nor adds a feature
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

**Rebase vs Merge - When to use what:**
```
Feature branch workflow:

main:     A---B---C---D
               \
feature:        E---F---G

After rebase (recommended for features):
main:     A---B---C---D
                       \
feature:                E'--F'--G'

After merge (use for long-lived branches):
main:     A---B---C---D---M
               \         /
feature:        E---F---G
```

```bash
# Rebase (cleaner history, use for feature branches)
git checkout feat/add-2fa-support
git rebase origin/main

# Merge (preserves history, use for release branches)
git checkout main
git merge --no-ff feat/add-2fa-support
```

### Reviewing Code

```bash
# Fetch latest from remote
git fetch origin

# Review someone's PR branch
git checkout -b review/oauth-pr origin/feat/oauth-integration

# Compare with main
git diff main...feat/oauth-integration  # Delta shows side-by-side

# See what commits are in the branch
git log main..feat/oauth-integration --oneline

# Check file history
git log --follow -- src/auth/oauth.js
git blame src/auth/oauth.js           # Who changed what

# Search for specific changes
git log --grep="oauth"                # Search commit messages
git log -S "generateToken"            # Search code changes
```

### Cleaning Up Commits

```bash
# Squash last 3 commits into one
git rebase -i HEAD~3

# In vim, change 'pick' to 's' (squash):
# pick abc1234 feat: add oauth client
# s    def5678 fix: typo in oauth
# s    ghi9012 refactor: cleanup oauth code
# Result: 1 clean commit

# Squash all commits in feature branch
git rebase -i origin/main

# Amend last commit (fix message or add files)
git commit --amend
git add forgotten-file.js
git commit --amend --no-edit

# Push after rewriting history
git push --force-with-lease           # Safer than --force
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

# Diff between branches
git diff main...feat/oauth-integration
```

**Understanding branch divergence:**
```
main:     A---B---C---D
               \
feature:        E---F

git log main..feature        # Shows: E, F
git log feature..main        # Shows: C, D
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

# List branches
git branch -vv                        # Show tracking info
git branch -a                         # Show all (local + remote)
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
feature:        D---E (not merged, just content)
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

# List tags
git tag -l --sort=-v:refname          # Sort by version

# Delete tag
git tag -d v1.3.0                     # Local
git push origin --delete v1.3.0       # Remote

# Checkout tag for hotfix
git checkout v1.2.0
git checkout -b hotfix/v1.2.1 v1.2.0
```

### Generate Changelog

```bash
# Commits since last release
git log v1.2.0..HEAD --oneline

# Group by conventional commit type
git log v1.2.0..HEAD --pretty=format:"%s" | grep "^feat:"
git log v1.2.0..HEAD --pretty=format:"%s" | grep "^fix:"

# Formatted changelog
git log v1.2.0..HEAD --pretty=format:"- %s (%h)" --reverse
```

---

## Undoing Changes

### Reset (Rewrite History)

```bash
# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Undo last commit, keep changes unstaged
git reset HEAD~1

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
          Changes still staged

--mixed HEAD~1 (default):
          A---B (HEAD)
          Changes unstaged but in working dir

--hard HEAD~1:
          A---B (HEAD)
          Changes discarded
```

### Revert (Safe Undo)

```bash
# Create new commit that undoes a commit
git revert abc1234                    # Safe for shared branches

# Revert without committing
git revert -n abc1234
```

### Discard Changes

```bash
# Discard unstaged changes
git checkout -- src/auth/login.js     # Single file
git checkout -- .                     # All files

# Unstage files
git reset HEAD src/auth/login.js

# Remove untracked files
git clean -fd                         # -f force, -d directories
git clean -fdn                        # Dry run (preview)
```

---

## Recovery

### Using Reflog

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

### Useful Aliases

Add to `~/.gitconfig`:

```ini
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

Usage:
```bash
git st                                # Status
git lg                                # Graph
git amend                             # Amend without editing message
git cleanup                           # Delete merged branches
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
feat:     New feature
fix:      Bug fix
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
```
