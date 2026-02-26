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
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

const getCliArgValue = (argName) => {
  const prefix = `${argName}=`;
  const entry = process.argv.find((value) => value.startsWith(prefix));
  if (entry === undefined) {
    return undefined;
  }

  return entry.slice(prefix.length).trim();
};

const run = () => {
  const apkDir = path.resolve(getCliArgValue('--apk-dir') || process.env.TIYO_SMOKE_APK_DIR || DEFAULT_APK_DIR);
  const sourceKey = (getCliArgValue('--source-key') || DEFAULT_SOURCE_KEY).trim().toLowerCase();
  const requestedPackageName = getCliArgValue('--package-name');
  const parsedInterval = Number.parseInt(getCliArgValue('--interval-ms') || '', 10);
  const intervalMs = Number.isFinite(parsedInterval) && parsedInterval > 0 ? parsedInterval : DEFAULT_INTERVAL_MS;

  process.env.TIYO_APK_EXTENSIONS_DIR = apkDir;

  const client = new TiyoClient({});
  const setup = client.runApkHoudokuInstalledApkMethodSetup();
  const sourceSetup = client.runApkHoudokuApkSourceMethodSetup(
    sourceKey,
    apkDir,
    requestedPackageName
  );

  console.log('--- Houdoku APK Runtime Polling ---');
  console.log('APK directory:', apkDir);
  console.log('Source key:', sourceKey);
  console.log('Interval (ms):', intervalMs);
  console.log('Initial setup success:', setup.success);
  if (!setup.success && setup.reasons.length > 0) {
    console.log('Initial setup reasons:', setup.reasons.join(' | '));
  }
  console.log('Initial source setup success:', sourceSetup.success);
  if (!sourceSetup.success && sourceSetup.reasons.length > 0) {
    console.log('Initial source setup reasons:', sourceSetup.reasons.join(' | '));
  }

  let previousRuntimeStateVersion = setup.setup.startupPreparation.runtimeState.runtimeStateVersion;

  const poll = () => {
    const stamp = new Date().toISOString();
    try {
      const result = client.getApkHoudokuPollingUpdate(previousRuntimeStateVersion, 'test');
      previousRuntimeStateVersion = result.runtimeStateVersion;

      console.log(`[${stamp}] changed=${result.changed} active=${result.activeSourceKeys.length}`);
      if (result.changed) {
        const refreshedSourceSetup = client.runApkHoudokuApkSourceMethodSetup(
          sourceKey,
          apkDir,
          requestedPackageName
        );
        console.log(`[${stamp}] activeSourceKeys=${result.activeSourceKeys.join(', ') || 'none'}`);
        console.log(
          `[${stamp}] canRunHoudokuTest=${result.launchModel.canRunHoudokuTest} blockers=${result.launchModel.blockerReasons.length}`
        );
        console.log(
          `[${stamp}] sourceSetupSuccess=${refreshedSourceSetup.success} activePackage=${refreshedSourceSetup.activePackageName || 'none'}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${stamp}] poll-error=${message}`);
    }
  };

  const timer = setInterval(poll, intervalMs);
  poll();

  process.on('SIGINT', () => {
    clearInterval(timer);
    console.log('Stopped Houdoku APK polling.');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    clearInterval(timer);
    console.log('Stopped Houdoku APK polling.');
    process.exit(0);
  });

  console.log('Polling started. Press Ctrl+C to stop.');
};

run();