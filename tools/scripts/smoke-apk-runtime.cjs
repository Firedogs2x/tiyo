const fs = require('node:fs');
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

const hasCliArg = (argName) => {
  const prefix = `${argName}=`;
  return process.argv.some((value) => value.startsWith(prefix));
};

const run = () => {
  const requestedApkDir = getCliArgValue('--apk-dir') || process.env.TIYO_SMOKE_APK_DIR;
  const apkDir = path.resolve(requestedApkDir || DEFAULT_APK_DIR);
  const sourceKey = (getCliArgValue('--source-key') || DEFAULT_SOURCE_KEY).trim().toLowerCase();
  const requestedPackageName = getCliArgValue('--package-name');
  const allSources = hasCliFlag('--all-sources');
  const hasSourceArg = hasCliArg('--source-key');
  const hasDirectoryArg = hasCliArg('--apk-dir') || process.env.TIYO_SMOKE_APK_DIR !== undefined;
  const mode = hasSourceArg ? 'single-source' : allSources || hasDirectoryArg ? 'all-sources' : 'installed';

  process.env.TIYO_APK_EXTENSIONS_DIR = apkDir;

  const client = new TiyoClient({});
  const sourceSetupResult =
    mode === 'single-source'
      ? client.runApkHoudokuApkSourceMethodSetup(sourceKey, apkDir, requestedPackageName)
      : undefined;
  const bulkSetupResult =
    mode === 'all-sources'
      ? client.runApkHoudokuApkBulkSourceMethodSetup(apkDir)
      : mode === 'installed'
      ? client.runApkHoudokuInstalledApkMethodSetup()
      : undefined;
  const runtimeState =
    mode === 'single-source'
      ? sourceSetupResult.setup.startupPreparation.runtimeState
      : bulkSetupResult.setup.startupPreparation.runtimeState;

  const pass =
    fs.existsSync(apkDir) &&
    runtimeState.runtimeConfig.apkOnlyMode === true &&
    (mode === 'single-source' ? sourceSetupResult.success : bulkSetupResult.success);

  console.log('--- Houdoku APK Override Smoke ---');
  console.log('APK directory:', apkDir);
  console.log('APK directory exists:', fs.existsSync(apkDir));
  console.log('Mode:', mode);
  console.log('Setup success:', mode === 'single-source' ? sourceSetupResult.setup.success : bulkSetupResult.setup.success);
  console.log(
    'Setup active source count:',
    mode === 'single-source'
      ? sourceSetupResult.setup.activeSourceKeys.length
      : bulkSetupResult.setup.activeSourceKeys.length
  );
  console.log('Source key:', mode === 'single-source' ? sourceKey : 'all');
  console.log('Requested package:', mode === 'single-source' ? sourceSetupResult.requestedPackageName || 'auto' : 'auto-all');
  console.log('Selected package:', mode === 'single-source' ? sourceSetupResult.selectedPackageName || 'none' : 'multiple');
  console.log('Active package:', mode === 'single-source' ? sourceSetupResult.activePackageName || 'none' : 'multiple');
  console.log('APK-only mode:', runtimeState.runtimeConfig.apkOnlyMode === true);
  console.log('Mapped extension id:', mode === 'single-source' ? sourceSetupResult.extensionId || 'none' : 'multiple');
  console.log(
    'Visible in getExtensions:',
    mode === 'single-source'
      ? sourceSetupResult.extensionVisibleInGetExtensions
      : `${bulkSetupResult.successfulSourceKeys.length}/${bulkSetupResult.sourceResults.length}`
  );
  console.log('Source setup success:', mode === 'single-source' ? sourceSetupResult.success : bulkSetupResult.success);
  if (mode !== 'single-source') {
    console.log('Successful source keys:', bulkSetupResult.successfulSourceKeys.join(', ') || 'none');
    if (bulkSetupResult.failedSourceKeys.length > 0) {
      console.log('Failed source keys:', bulkSetupResult.failedSourceKeys.join(', '));
      console.log('Source setup reasons:', bulkSetupResult.reasons.join(' | '));
    }
  } else if (!sourceSetupResult.success && sourceSetupResult.reasons.length > 0) {
    console.log('Source setup reasons:', sourceSetupResult.reasons.join(' | '));
  }

  if (mode === 'installed') {
    console.log('Installed method directory:', runtimeState.apkExtensionsDirectory);
  }

  if (pass) {
    console.log('SMOKE RESULT: PASS');
    process.exit(0);
  }

  console.error('SMOKE RESULT: FAIL');
  process.exit(1);
};

run();
