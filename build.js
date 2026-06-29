import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { injectManifest } from 'workbox-build';
import sharp from 'sharp';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');

// Development/build artefacts that must not go into the deployed site.
const SKIP = new Set([
  'node_modules', 'dist', '.git', '.github', '.claude',
  // Local data-analysis workspace: notebooks + exported CSVs of user data.
  // Must never be copied into the deployed site (privacy + size).
  'data_analysis',
  'package.json', 'package-lock.json',
  'vite.config.js', 'build.js',
  'README.md', '.gitignore', '.gitattributes'
]);

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (SKIP.has(entry)) continue;
    const s = join(src, entry);
    const d = join(dest, entry);
    statSync(s).isDirectory() ? copyDir(s, d) : copyFileSync(s, d);
  }
}

// ── 1. Clean and copy all source files ────────────────────────────────────────
console.log('Copying source files to dist/...');
rmSync(DIST, { recursive: true, force: true });
copyDir(ROOT, DIST);

// ── 2. Generate PNG icons ──────────────────────────────────────────────────────
// Chrome requires PNG icons (192 × 192 and 512 × 512) to show the PWA install
// prompt. SVG alone is rejected. We rasterise the existing SVG sources.
console.log('Generating PNG icons...');
try {
  await sharp(join(ROOT, 'icons/icon-192.svg')).resize(192, 192).png()
    .toFile(join(DIST, 'icons/icon-192.png'));
  await sharp(join(ROOT, 'icons/icon-512.svg')).resize(512, 512).png()
    .toFile(join(DIST, 'icons/icon-512.png'));
  console.log('  ✓ icon-192.png + icon-512.png');
} catch (err) {
  console.warn('  ⚠ PNG generation failed:', err.message);
  console.warn('  PWA install prompt may not appear in Chrome.');
}

// ── 3. Write manifest.json with PNG icons ─────────────────────────────────────
// Overwrite the copied manifest.json so it includes the generated PNG entries.
// Absolute icon paths work from any page depth on the deployed domain.
console.log('Writing manifest.json...');
const manifest = {
  name: 'Redlos',
  short_name: 'Redlos',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#E5E9F0',
  theme_color: '#2C3E50',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }
  ]
};
writeFileSync(join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));

// ── 4. Inject precache manifest into service-worker.js ────────────────────────
// workbox-build scans dist/ and replaces self.__WB_MANIFEST in the source SW
// with a versioned list of every app asset, enabling full offline caching.
console.log('Building service worker...');
const { count, size } = await injectManifest({
  swSrc: join(ROOT, 'service-worker.js'),
  swDest: join(DIST, 'service-worker.js'),
  globDirectory: DIST,
  globPatterns: ['**/*.{html,js,css,svg,png}'],
  globIgnores: ['service-worker.js']
});

console.log(`\n✓ Build complete.`);
console.log(`  SW precaches ${count} files (${(size / 1024).toFixed(0)} KiB total).`);
