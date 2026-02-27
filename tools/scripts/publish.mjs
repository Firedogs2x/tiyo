/**
 * Build a release tarball for a workspace package.
 *
 * This script runs inside "dist/path/to/library" and creates a .tgz
 * package artifact with npm pack.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

import devkit from '@nx/devkit';
const { readCachedProjectGraph } = devkit;

function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

// Executing release-pack script: node path/to/publish.mjs {name} --version {version}
const [, , name, version] = process.argv;

// A simple SemVer validation to validate the version
const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?/;
invariant(
  version && validVersion.test(version),
  `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${version}.`
);

const graph = readCachedProjectGraph();
const project = graph.nodes[name];

invariant(
  project,
  `Could not find project "${name}" in the workspace. Is the project.json configured correctly?`
);

const outputPath = project.data?.targets?.build?.options?.outputPath;
invariant(
  outputPath,
  `Could not find "build.options.outputPath" of project "${name}". Is project.json configured  correctly?`
);

process.chdir(outputPath);

// Updating the version in "package.json" before publishing
try {
  const json = JSON.parse(readFileSync(`package.json`).toString());
  json.version = version;
  writeFileSync(`package.json`, JSON.stringify(json, null, 2));
} catch (e) {
  console.error(`Error reading package.json file from library build output.`);
}

// Execute "npm pack" to create release tarball artifact
try {
  execSync(`npm pack`, { stdio: 'inherit' });
} catch (error) {
  const packageName = JSON.parse(readFileSync(`package.json`, 'utf8')).name;
  console.error('\nPackage tarball creation failed.');
  console.error(`- Verify package metadata for ${packageName}.`);
  console.error('- Verify build output exists and package.json is valid.');
  console.error('- Then rerun the Release workflow.');
  process.exit(error?.status || 1);
}
