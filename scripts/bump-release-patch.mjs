#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
let root = process.cwd();
let dryRun = false;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--dry-run") {
    dryRun = true;
    continue;
  }
  if (arg === "--root") {
    const value = args[index + 1];
    if (value == null || value.length === 0) {
      throw new Error("--root requires a path");
    }
    root = resolve(value);
    index += 1;
    continue;
  }
  throw new Error(`unknown argument: ${arg}`);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function listPackageJsonFiles(rootDir) {
  const files = ["package.json"];
  for (const parent of ["apps", "packages", "tools"]) {
    const parentPath = join(rootDir, parent);
    if (!existsSync(parentPath)) continue;
    for (const entry of readdirSync(parentPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const packageFile = join(parent, entry.name, "package.json");
      if (statSync(join(rootDir, packageFile), { throwIfNoEntry: false })?.isFile()) {
        files.push(packageFile);
      }
    }
  }
  if (existsSync(join(rootDir, "e2e", "package.json"))) {
    files.push("e2e/package.json");
  }
  return files.sort();
}

function bumpPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (match == null) {
    throw new Error(`patch auto-bump requires a plain x.y.z version; got ${version}`);
  }
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

const rootPackageFile = join(root, "package.json");
const currentVersion = readJson(rootPackageFile).version;
if (typeof currentVersion !== "string" || currentVersion.length === 0) {
  throw new Error("root package.json must declare a version");
}

const nextVersion = bumpPatch(currentVersion);
const changed = [];

for (const relativeFile of listPackageJsonFiles(root)) {
  const file = join(root, relativeFile);
  const packageJson = readJson(file);
  if (packageJson.version !== currentVersion) continue;
  packageJson.version = nextVersion;
  changed.push(relativeFile);
  if (!dryRun) {
    writeJson(file, packageJson);
  }
}

if (changed.length === 0) {
  throw new Error(`no package.json files matched current version ${currentVersion}`);
}

console.error(
  `${dryRun ? "Would bump" : "Bumped"} ${changed.length} package manifest(s) from ${currentVersion} to ${nextVersion}.`,
);
console.log(nextVersion);
