import { readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/stitch/DESIGN.md', import.meta.url), 'utf8');
const colorSection = source.split('colors:')[1].split('typography:')[0];
const tokens = [...colorSection.matchAll(/^ {2}([\w-]+): '(#[0-9A-Fa-f]+)'/gm)];
writeFileSync(new URL('../src/reference-tokens.css', import.meta.url), '/* Exact reference palette. Application semantic aliases live in styles.css. */\n@theme {\n' + tokens.map(([, name, color]) => `  --color-${name}: ${color};`).join('\n') + '\n}\n');
