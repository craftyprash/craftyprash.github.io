#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VAULT_PATH = process.env.VAULT_PATH || './vault';
const CONTENT_PATH = './src/content';
const IMAGES_PATH = './public/images';

// Ensure directories exist
fs.mkdirSync(path.join(CONTENT_PATH, 'notes'), { recursive: true });
fs.mkdirSync(path.join(CONTENT_PATH, 'guides'), { recursive: true });
fs.mkdirSync(IMAGES_PATH, { recursive: true });

function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function processExcalidrawEmbeds(content, sourceDir, imagesPath) {
  // Match ![[filename.excalidraw]] or ![[filename.excalidraw.md]] or ![[filename.excalidraw.png]]
  const excalidrawRegex = /!\[\[([^\]]+\.excalidraw(?:\.(?:md|png))?)\]\]/g;
  
  let processedContent = content;
  const matches = [...content.matchAll(excalidrawRegex)];
  
  for (const match of matches) {
    const excalidrawFile = match[1];
    const baseName = excalidrawFile.replace(/\.excalidraw(?:\.(?:md|png))?$/, '');
    const sanitizedName = sanitizeFilename(baseName);
    const pngName = `${sanitizedName}.png`;
    
    // Look for PNG file - could be .excalidraw.png or just the base name
    let pngPath = path.join(sourceDir, `${baseName}.excalidraw.png`);
    
    // If that doesn't exist, try the exact filename if it ends with .png
    if (!fs.existsSync(pngPath) && excalidrawFile.endsWith('.png')) {
      pngPath = path.join(sourceDir, excalidrawFile);
    }
    
    const destPngPath = path.join(imagesPath, pngName);
    
    if (fs.existsSync(pngPath)) {
      fs.copyFileSync(pngPath, destPngPath);
      console.log(`  📸 Copied: ${path.basename(pngPath)} → ${pngName}`);
    } else {
      console.log(`  ⚠️  PNG not found: ${baseName}.excalidraw.png or ${excalidrawFile}`);
    }
    
    // Replace embed with markdown image
    processedContent = processedContent.replace(
      match[0],
      `![${baseName}](/images/${pngName})`
    );
  }
  
  return processedContent;
}

function processWikiLinks(content) {
  // Convert [[Link]] to [Link](link)
  return content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, link, display) => {
    const text = display || link;
    const slug = sanitizeFilename(link);
    return `[${text}](/notes/${slug})`;
  });
}

function processMarkdownFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: markdownContent } = matter(content);
  
  // Check if should be published
  if (!data.publish) {
    return null;
  }
  
  const type = data.type || 'note';
  const sourceDir = path.dirname(filePath);
  
  // Process content
  let processedContent = markdownContent;
  processedContent = processExcalidrawEmbeds(processedContent, sourceDir, IMAGES_PATH);
  processedContent = processWikiLinks(processedContent);
  
  // Generate slug from filename
  const filename = path.basename(filePath, '.md');
  const slug = sanitizeFilename(filename);
  
  // Prepare frontmatter
  const frontmatter = {
    title: data.title || filename,
    date: data.date || new Date().toISOString().split('T')[0],
    tags: data.tags || [],
    ...(data.description && { description: data.description }),
    ...(type === 'guide' && data.guide && { guide: data.guide }),
    ...(type === 'guide' && data.chapter && { chapter: data.chapter }),
  };
  
  // Reconstruct file
  const output = matter.stringify(processedContent, frontmatter);
  
  return {
    type,
    slug,
    content: output,
    relativePath,
  };
}

function scanDirectory(dir, baseDir = dir) {
  const files = [];
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    // Skip hidden files and .obsidian
    if (item.name.startsWith('.')) continue;
    
    if (item.isDirectory()) {
      files.push(...scanDirectory(fullPath, baseDir));
    } else if (item.isFile() && item.name.endsWith('.md') && !item.name.endsWith('.excalidraw.md')) {
      const relativePath = path.relative(baseDir, fullPath);
      files.push({ fullPath, relativePath });
    }
  }
  
  return files;
}

function main() {
  console.log('🔄 Syncing Obsidian vault to website...\n');
  
  if (!fs.existsSync(VAULT_PATH)) {
    console.error(`❌ Vault path not found: ${VAULT_PATH}`);
    process.exit(1);
  }
  
  const files = scanDirectory(VAULT_PATH);
  console.log(`📁 Found ${files.length} markdown files\n`);
  
  let publishedCount = 0;
  let notesCount = 0;
  let guidesCount = 0;
  
  for (const { fullPath, relativePath } of files) {
    console.log(`Processing: ${relativePath}`);
    
    try {
      const result = processMarkdownFile(fullPath, relativePath);
      
      if (!result) {
        console.log('  ⏭️  Skipped (publish: false)\n');
        continue;
      }
      
      const outputDir = result.type === 'guide' ? 'guides' : 'notes';
      const outputPath = path.join(CONTENT_PATH, outputDir, `${result.slug}.md`);
      
      fs.writeFileSync(outputPath, result.content);
      console.log(`  ✅ Published to ${outputDir}/${result.slug}.md\n`);
      
      publishedCount++;
      if (result.type === 'guide') guidesCount++;
      else notesCount++;
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('📊 Summary:');
  console.log(`  Total processed: ${files.length}`);
  console.log(`  Published: ${publishedCount}`);
  console.log(`  Notes: ${notesCount}`);
  console.log(`  Guides: ${guidesCount}`);
  console.log('\n✨ Sync complete!');
}

main();
