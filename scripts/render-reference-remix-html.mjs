#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const repoRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(repoRoot, 'apps/web/public');
const remixRoot = path.join(publicRoot, 'reference-remix');
const host = '127.0.0.1';
const port = Number(process.env.REFERENCE_REMIX_PORT || 43107);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
]);

function rewritePublicAssetPaths(html) {
  return html.replaceAll('/reference-remix/_uupm-assets/', '../_uupm-assets/');
}

async function inlineStylesheets(html, slug) {
  const referenceDir = path.join(remixRoot, slug);
  const stylesheetLinkPattern = /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']([^"']+\.css)["'])[^>]*>/gi;
  let result = '';
  let lastIndex = 0;
  for (const match of html.matchAll(stylesheetLinkPattern)) {
    const href = match[1];
    const cssPath = path.resolve(referenceDir, href);
    if (!cssPath.startsWith(remixRoot)) {
      throw new Error(`Refusing to inline stylesheet outside reference-remix: ${href}`);
    }
    const css = await fs.readFile(cssPath, 'utf8');
    result += html.slice(lastIndex, match.index);
    result += `<style data-reference-remix-stylesheet="${href}">\n${css}\n</style>`;
    lastIndex = match.index + match[0].length;
  }
  return result + html.slice(lastIndex);
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const absolute = path.join(root, normalized);
  if (!absolute.startsWith(root)) return null;
  return absolute;
}

function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url || '/', `http://${host}:${port}`);
    const filePath = safeJoin(publicRoot, requestUrl.pathname);
    if (!filePath) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    try {
      const stat = await fs.stat(filePath);
      const resolved = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
      const body = await fs.readFile(resolved);
      res.writeHead(200, {
        'content-type': mimeTypes.get(path.extname(resolved)) || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

async function referenceSlugs() {
  const entries = await fs.readdir(remixRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();
}

async function renderSlug(page, slug) {
  const url = `http://${host}:${port}/reference-remix/${slug}/index.html`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    return Boolean(root?.children.length) && document.body.innerText.trim().length > 300;
  }, null, { timeout: 45_000 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

  const html = await page.evaluate((currentSlug) => {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('script').forEach((node) => node.remove());
    clone.querySelectorAll('link[rel="modulepreload"]').forEach((node) => node.remove());
    clone.querySelectorAll('[data-reactroot]').forEach((node) => node.removeAttribute('data-reactroot'));
    clone.setAttribute('data-reference-remix-static', 'true');
    clone.setAttribute('data-reference-remix-slug', currentSlug);
    const head = clone.querySelector('head');
    if (head) {
      const meta = document.createElement('meta');
      meta.name = 'nn-design-reference-remix';
      meta.content = `Static rendered DOM clone for ${currentSlug}. Scripts removed; CSS/assets retained.`;
      head.appendChild(meta);
    }
    return `<!DOCTYPE html>\n${clone.outerHTML}\n`;
  }, slug);
  const portableHtml = rewritePublicAssetPaths(html);
  const staticHtml = await inlineStylesheets(portableHtml, slug);

  const outPath = path.join(remixRoot, slug, 'index.html');
  await fs.writeFile(outPath, staticHtml, 'utf8');
  return {
    slug,
    bytes: Buffer.byteLength(staticHtml),
    bodyLength: await page.evaluate(() => document.body.innerText.trim().length),
  };
}

async function main() {
  const slugs = await referenceSlugs();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 1 });
  const results = [];
  try {
    for (const slug of slugs) {
      const result = await renderSlug(page, slug);
      results.push(result);
      console.log(`${result.slug}: ${result.bodyLength} chars, ${result.bytes} bytes`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  const failures = results.filter((result) => result.bodyLength <= 300);
  if (failures.length > 0) {
    throw new Error(`Rendered body too small for: ${failures.map((item) => item.slug).join(', ')}`);
  }
  console.log(`Rendered ${results.length} reference remix HTML files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
