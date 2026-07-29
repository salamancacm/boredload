#!/usr/bin/env node
import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(__dirname, '..', 'dist', 'index.mjs');
const LIMIT_BYTES = 15 * 1024; // 15kb gzip

if (!existsSync(target)) {
  console.error(`boredload: cannot find ${target}. Run "npm run build" first.`);
  process.exit(1);
}

const source = readFileSync(target);
const gzipped = gzipSync(source, { level: 9 });
const sizeKb = (gzipped.byteLength / 1024).toFixed(2);
const limitKb = (LIMIT_BYTES / 1024).toFixed(0);

console.log(`boredload core bundle (dist/index.mjs): ${sizeKb} KB gzip (limit ${limitKb} KB)`);

if (gzipped.byteLength > LIMIT_BYTES) {
  console.error(
    `boredload: bundle size ${sizeKb} KB exceeds the ${limitKb} KB gzip budget.`,
  );
  process.exit(1);
}
