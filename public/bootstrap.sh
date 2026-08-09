#!/usr/bin/env bash
#
# bootstrap.sh — provision a fresh macOS or Fedora machine from scratch.
#
# This script contains NO secrets, so it is published on my public site and can
# be fetched on a brand-new machine that has nothing set up yet:
#
#     curl -fsSLO https://craftyprash.in/bootstrap.sh
#     bash bootstrap.sh
#
# Source of truth is this file in the mysetup repo; the copy under the website's
# public/ dir is what gets served at the URL above.
#
# Use download-then-run (NOT `curl ... | bash`): the GitHub and Bitwarden logins
# below are interactive and need a real terminal.
#
# The only credentials you need are ones you already carry:
#   - your GitHub login + 2FA   (authenticated in the browser via `gh auth login`)
#   - your Bitwarden master password (`bw login` / `bw unlock`)
# Nothing is stored on disk or a USB; everything else derives from these two.

set -euo pipefail

REPO="craftyprash/mysetup"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }

# ---------------------------------------------------------------------------
# 1. OS-specific prerequisites + minimal bootstrap toolchain
#    (chezmoi = apply engine, gh = repo auth, bitwarden-cli = secret decryption)
# ---------------------------------------------------------------------------
os="$(uname -s)"
if [[ "$os" == "Darwin" ]]; then
  log "macOS detected"

  if ! xcode-select -p >/dev/null 2>&1; then
    log "Installing Xcode Command Line Tools (accept the GUI prompt, then re-run this script)"
    xcode-select --install || true
    echo "Waiting for Command Line Tools to finish installing..."
    until xcode-select -p >/dev/null 2>&1; do sleep 5; done
  fi

  if ! have brew; then
    log "Installing Homebrew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  # Ensure brew is on PATH for the rest of this script (Apple Silicon path).
  eval "$(/opt/homebrew/bin/brew shellenv)"

  log "Installing bootstrap tools (chezmoi, gh, bitwarden-cli)"
  brew install chezmoi gh bitwarden-cli

elif [[ -f /etc/fedora-release ]]; then
  log "Fedora detected"
  log "Installing bootstrap tools (git, gh, node/npm; chezmoi + bitwarden-cli via installers)"
  sudo dnf install -y git gh nodejs npm
  have chezmoi || sudo sh -c "$(curl -fsLS get.chezmoi.io)" -- -b /usr/local/bin
  have bw       || sudo npm install -g @bitwarden/cli

else
  echo "Unsupported OS: $os. This script supports macOS and Fedora." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Authenticate to GitHub via browser (no PAT stored anywhere)
# ---------------------------------------------------------------------------
if ! gh auth status >/dev/null 2>&1; then
  log "Authenticating to GitHub (browser device flow — log in with your account + 2FA)"
  gh auth login --hostname github.com --git-protocol https --web
fi
gh auth setup-git   # make git use gh's credential helper for private clones

# ---------------------------------------------------------------------------
# 3. Unlock the Bitwarden vault (holds the Forgejo registry token)
# ---------------------------------------------------------------------------
if ! bw login --check >/dev/null 2>&1; then
  log "Logging in to Bitwarden (email + master password)"
  bw login
fi
log "Unlocking Bitwarden vault"
export BW_SESSION="$(bw unlock --raw)"

# ---------------------------------------------------------------------------
# 4. Retrieve the age key that decrypts the SSH keys / PEMs (kept in Bitwarden,
#    never in the repo). chezmoi decrypts with it at apply time.
# ---------------------------------------------------------------------------
log "Fetching age decryption key from Bitwarden (item: chezmoi-age-key)"
mkdir -p "$HOME/.config/chezmoi"
bw get notes chezmoi-age-key > "$HOME/.config/chezmoi/key.txt"
chmod 600 "$HOME/.config/chezmoi/key.txt"
grep -q 'AGE-SECRET-KEY' "$HOME/.config/chezmoi/key.txt" \
  || { echo "age key not found in Bitwarden item 'chezmoi-age-key' — aborting"; exit 1; }

# ---------------------------------------------------------------------------
# 5. Pull dotfiles and apply everything (runs the run_once_* setup scripts)
# ---------------------------------------------------------------------------
log "Initializing and applying chezmoi from $REPO"
# Bare machine has no SSH key yet, so clone the dotfiles over HTTPS (gh set up
# the credential helper above). Apply then installs your SSH keys into ~/.ssh.
chezmoi init --apply "https://github.com/$REPO.git"

# Now that the SSH keys are in place, switch the chezmoi source remote to SSH so
# future `chezmoi git -- push` uses your github_ed25519 key (craftyprash), matching
# the rest of your repos (which you clone via `ghq get -p git@github.com:...`).
chezmoi git -- remote set-url origin "git@github.com:$REPO.git" || true

log "Done. Open a new shell to pick up the new environment."
