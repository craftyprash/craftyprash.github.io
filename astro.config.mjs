import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://craftyprash.in',
  integrations: [
    mdx(),
    sitemap()
  ],
  markdown: {
    //https://shiki.style/themes
    syntaxHighlight: 'shiki',
    shikiConfig: {
      // theme: 'nord',
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
