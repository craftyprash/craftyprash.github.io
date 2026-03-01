# Obsidian Vault Sync Setup

## Prerequisites

1. Create private repo: `craftyprash/CraftyOrg`
2. Push your Obsidian vault to it
3. Create Personal Access Token (PAT) with `repo` scope
4. Add PAT as secret `VAULT_ACCESS_TOKEN` in craftyprash.github.io repo

## Frontmatter Format

### For Notes
```markdown
---
title: "My Note Title"
date: 2024-03-01
tags: ["tag1", "tag2"]
publish: true
type: note
description: "Optional description"
---
```

### For Guides
```markdown
---
title: "Chapter 1: Getting Started"
date: 2024-03-01
tags: ["tutorial"]
publish: true
type: guide
guide: "my-guide-name"
chapter: 1
---
```

## Excalidraw Support

Embed diagrams in your notes:
```markdown
![[diagram.excalidraw]]
```

The sync script will convert to:
```markdown
![diagram](/images/diagram.png)
```

**Note:** Export Excalidraw to PNG manually and place in vault's images folder.

## Manual Sync

```bash
VAULT_PATH=/Users/prashant.p/Documents/CraftyOrg npm run sync
```

## Automatic Sync

GitHub Action runs every 6 hours or manually via workflow dispatch.
