const path = require('node:path');
const Module = require('node:module');

const originalResolveFilename = Module._resolveFilename;
const builtCommonEntry = path.resolve(__dirname, '../../dist/libs/common/src/index.js');

Module._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
  if (request === '@tiyo/common') {
    return builtCommonEntry;
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const { TiyoClient } = require('../../dist/libs/core/src/index.js');

const DEFAULT_APK_DIR = 'C:/Users/dnvm8/AppData/Roaming/Houdoku/Keiyoushi APK Extensions';
const DEFAULT_SOURCE_KEY = 'mangadex';

const getCliArgValue = (argName) => {
  const prefix = `${argName}=`;
  const entry = process.argv.find((value) => value.startsWith(prefix));
  if (entry === undefined) {
    return undefined;
  }

  return entry.slice(prefix.length).trim();
};

const hasCliFlag = (flagName) => {
  return process.argv.includes(flagName);
};

const run = () => {
  const apkDir = path.resolve(getCliArgValue('--apk-dir') || process.env.TIYO_SMOKE_APK_DIR || DEFAULT_APK_DIR);
  const sourceKey = (getCliArgValue('--source-key') || DEFAULT_SOURCE_KEY).trim().toLowerCase();
  const apply = hasCliFlag('--apply');

  process.env.TIYO_APK_EXTENSIONS_DIR = apkDir;

  const client = new TiyoClient({});
  const setup = client.runApkHoudokuInstalledApkMethodSetup();
  const cleanup = client.cleanupUnneededApkExtensions({
    apply,
    policy: 'unsupported-only',
  });
  const source = client.runApkHoudokuGoodSourceMethodSetup(sourceKey, apkDir);

  const payload = {
    apkDirectory: apkDir,
    apply,
    setupSuccess: setup.success,
    cleanupSummary: {
      totalCandidates: cleanup.totalCandidates,
      removedCount: cleanup.removedCount,
      skippedCount: cleanup.skippedCount,
      failedCount: cleanup.failedCount,
      policy: cleanup.policy,
    },
    sourceKey,
    usableByHoudoku: source.usableByHoudoku,
    reasons: source.reasons,
    activePackageName: source.sourceSetup.activePackageName,
  };

  process.stdout.write(`${JSON.stringify(payload, undefined, 2)}\n`);

  if (!source.usableByHoudoku) {
    process.exit(2);
  }
};

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
}
