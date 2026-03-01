# craftyprash.github.io

Personal site with notes and guides built with Astro, TailwindCSS, and MDX.

## Features

- 📝 Markdown/MDX support for notes and guides
- 🎨 Dark theme with optimal typography
- 💻 Syntax highlighting with copy button
- 📊 Mermaid diagram support
- 🔗 Social sharing (LinkedIn, X)
- 💬 Giscus comments
- 📱 Fully responsive

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deployment

This site is configured for GitHub Pages deployment:

1. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/craftyprash/craftyprash.github.io.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: GitHub Actions
   - The site will auto-deploy on every push to main

3. **Access your site:**
   - https://craftyprash.github.io

## Content Structure

- `src/content/notes/` - Single-page articles (`.md` or `.mdx`)
- `src/content/guides/` - Multi-chapter guides (`.md` or `.mdx`)
- `public/` - Static assets (images, etc.)

## Writing Content

### Notes

Create a file in `src/content/notes/`:

```markdown
---
title: "My Note"
date: 2024-01-15
tags: ["example"]
---

Your content here...
```

### Guides

Create chapters in `src/content/guides/`:

```markdown
---
title: "Chapter 1"
date: 2024-01-15
tags: ["guide"]
guide: "my-guide"
chapter: 1
---

Your content here...
```

## Changelog

Run `npm run changelog` to generate changelog from git commits.
