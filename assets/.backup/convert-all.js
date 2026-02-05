#!/usr/bin/env node
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function convert(name) {
  const svgPath = join(__dirname, `${name}.svg`);
  const pngPath = join(__dirname, `${name}.png`);
  const svgBuffer = readFileSync(svgPath);
  await sharp(svgBuffer).resize(2000, 2000).png().toFile(pngPath);
  console.log(`Created ${pngPath}`);
}

await convert('gsd-logo-style-a');
await convert('gsd-logo-style-b');
