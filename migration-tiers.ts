#!/usr/bin/env ts-node
// Run with: npx ts-node migration-tiers.ts [project-root]
// Scans JS files, resolves local dependencies, and groups them into migration tiers.
// Tier 1 files have no local JS dependencies. Tier N files depend only on files in tiers < N.

import * as fs from 'fs';
import * as path from 'path';

const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git', '.claude', 'coverage']);

const REQUIRE_RE = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const IMPORT_RE = /(?:import\s+(?:[^'"]*?\s+from\s+)?|export\s+(?:[^'"]*?\s+from\s+))['"]([^'"]+)['"]/g;

function findJsFiles(dir: string): string[] {
  const results: string[] = [];
  function walk(current: string): void {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) results.push(full);
    }
  }
  walk(dir);
  return results;
}

// Returns the absolute path to the .js file if the import resolves to one,
// or null if it resolves to a .ts file (already converted) or is non-local.
function resolveLocalJsDep(importerDir: string, importPath: string): string | null {
  if (!importPath.startsWith('.')) return null;

  const base = path.resolve(importerDir, importPath);

  // Exact path given
  if (base.endsWith('.js') && fs.existsSync(base)) return base;
  if (base.endsWith('.ts') && fs.existsSync(base)) return null;

  // Extension-less — probe .js then .ts
  if (fs.existsSync(base + '.js')) return base + '.js';
  if (fs.existsSync(base + '.ts')) return null;

  // Directory index
  if (fs.existsSync(base + '/index.js')) return base + '/index.js';
  if (fs.existsSync(base + '/index.ts')) return null;

  return null;
}

function getJsDeps(filepath: string): string[] {
  const source = fs.readFileSync(filepath, 'utf-8');
  const dir = path.dirname(filepath);
  const deps = new Set<string>();

  REQUIRE_RE.lastIndex = 0;
  for (let m = REQUIRE_RE.exec(source); m; m = REQUIRE_RE.exec(source)) {
    const resolved = resolveLocalJsDep(dir, m[1]);
    if (resolved) deps.add(resolved);
  }

  IMPORT_RE.lastIndex = 0;
  for (let m = IMPORT_RE.exec(source); m; m = IMPORT_RE.exec(source)) {
    const resolved = resolveLocalJsDep(dir, m[1]);
    if (resolved) deps.add(resolved);
  }

  return [...deps];
}

function buildTiers(files: string[], depsMap: Map<string, string[]>): {
  tiers: Map<number, string[]>;
  cycles: string[];
} {
  const fileSet = new Set(files);

  // Count how many unresolved JS deps each file has; build reverse graph
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const file of files) {
    const jsDeps = depsMap.get(file)!.filter(d => fileSet.has(d));
    inDegree.set(file, jsDeps.length);
    for (const dep of jsDeps) {
      if (!dependents.has(dep)) dependents.set(dep, []);
      dependents.get(dep)!.push(file);
    }
  }

  // Kahn's algorithm — each wave is one tier
  const tiers = new Map<number, string[]>();
  const assigned = new Set<string>();
  let tierNum = 1;
  let wave = files.filter(f => inDegree.get(f) === 0);

  while (wave.length > 0) {
    tiers.set(tierNum, wave.slice().sort());
    for (const file of wave) assigned.add(file);

    const next: string[] = [];
    for (const file of wave) {
      for (const dep of dependents.get(file) ?? []) {
        const remaining = inDegree.get(dep)! - 1;
        inDegree.set(dep, remaining);
        if (remaining === 0) next.push(dep);
      }
    }
    wave = next;
    tierNum++;
  }

  const cycles = files.filter(f => !assigned.has(f));
  return { tiers, cycles };
}

function main(): void {
  const root = path.resolve(process.argv[2] ?? process.cwd());
  const jsFiles = findJsFiles(root);

  if (jsFiles.length === 0) {
    console.log('No .js files found — nothing to migrate.');
    return;
  }

  const depsMap = new Map<string, string[]>();
  for (const file of jsFiles) depsMap.set(file, getJsDeps(file));

  const { tiers, cycles } = buildTiers(jsFiles, depsMap);

  const rel = (f: string) => path.relative(root, f);

  const tierCount = tiers.size;
  console.log(`Found ${jsFiles.length} JS file(s) across ${tierCount} migration tier(s).\n`);

  for (const [num, files] of [...tiers.entries()].sort(([a], [b]) => a - b)) {
    const label = num === 1
      ? 'Tier 1 — no JS dependencies, migrate first'
      : `Tier ${num} — depends on tier${num > 2 ? 's' : ''} 1${num > 2 ? `–${num - 1}` : ''}`;
    console.log(label);
    for (const file of files) {
      const deps = depsMap.get(file)!.filter(d => jsFiles.includes(d));
      const depNote = deps.length > 0 ? `  ← ${deps.map(rel).join(', ')}` : '';
      console.log(`  ${rel(file)}${depNote}`);
    }
    console.log();
  }

  if (cycles.length > 0) {
    console.log('⚠  Circular dependencies — cannot be automatically tiered:');
    for (const file of cycles) console.log(`  ${rel(file)}`);
    console.log();
  }
}

main();
