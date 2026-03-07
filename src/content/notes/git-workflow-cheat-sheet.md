---
title: Git Workflow Cheat Sheet
date: 2026-02-28T00:00:00.000Z
tags:
  - git
  - workflow
  - cheatsheet
description: >-
  Daily Git commands and workflows for tech leads managing feature development,
  code reviews, and releases
---

# Git Workflow Cheat Sheet

Daily Git commands and workflows for technical leads managing feature development, code reviews, and releases.

For setup instructions (multi-identity, conventional commits, ghq, git-cliff), see [Git Setup](/notes/git-setup)

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
git log --author="Prashant"           # Filter by author
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

# Clean up all merged branches (except main/develop)
git branch --merged | grep -v '\*\|main\|develop' | xargs -n 1 git branch -d
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

# Drop specific stash
git stash drop stash@{0}

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

### Release with Changelog

```bash
# Preview unreleased changes
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

# Revert merge commit
git revert -m 1 <merge-commit-hash>   # -m 1 keeps first parent
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
git clean -fdx                        # Also remove ignored files
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

### Interactive Staging

```bash
# Stage changes interactively (review each chunk)
git add -p

# Options during interactive staging:
# y - stage this hunk
# n - don't stage this hunk
# s - split into smaller hunks
# e - manually edit the hunk
# q - quit
```

### Bisect (Find Bug Introduction)

```bash
# Start bisect
git bisect start
git bisect bad                        # Current commit is bad
git bisect good v1.2.0                # Known good commit

# Git checks out middle commit, test it
git bisect good                       # If test passes
git bisect bad                        # If test fails

# Repeat until bug is found
git bisect reset                      # Return to original state
```

---

## Pull Strategy

Config uses `pull.ff = only` - this prevents accidental merge commits.

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
build:    Build system
revert:   Revert commit
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

### Git Aliases

From `~/.gitconfig`:

```bash
git st                                # status -sb
git co <branch>                       # checkout
git br                                # branch -vv
git ci                                # commit
git unstage <file>                    # reset HEAD
git last                              # log -1 HEAD
git lg                                # log --graph --oneline --all
git amend                             # commit --amend --no-edit
git undo                              # reset --soft HEAD~1
git wip                               # commit -am "WIP"
git cleanup                           # delete merged branches
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

### Useful Log Formats

```bash
# Compact log with graph
git log --graph --oneline --all --decorate

# Detailed log with dates
git log --pretty=format:'%C(yellow)%h%Creset %C(blue)%ad%Creset %s %C(green)(%an)%Creset' --date=short

# Show files changed in each commit
git log --stat

# Show actual changes
git log -p

# One-line summary
git log --oneline -10
```

---

## Tips for Leads

### Code Review Workflow

```bash
# Fetch all branches
git fetch --all

# List remote branches
git branch -r

# Review PR locally
git checkout -b review/feature-123 origin/feat/feature-123
git diff main...review/feature-123
git log main..review/feature-123 --oneline

# Test locally, then delete review branch
git checkout main
git branch -D review/feature-123
```

### Managing Multiple Features

```bash
# List all feature branches
git branch | grep feat/

# See what's in each feature
for branch in $(git branch | grep feat/); do
  echo "=== $branch ==="
  git log main..$branch --oneline
done

# Clean up merged features
git branch --merged main | grep feat/ | xargs -n 1 git branch -d
```

### Emergency Hotfix

```bash
# Quick hotfix from production tag
git checkout v1.2.0
git checkout -b hotfix/critical-fix
# Make fix
git commit -m "fix: critical security issue"
git tag -a v1.2.1 -m "Hotfix: security patch"
git push origin hotfix/critical-fix --tags
```

---

For setup instructions, see [Git Setup](/notes/git-setup)
