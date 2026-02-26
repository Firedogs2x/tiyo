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

const run = () => {
  const apkDir = path.resolve(getCliArgValue('--apk-dir') || process.env.TIYO_SMOKE_APK_DIR || DEFAULT_APK_DIR);
  const sourceKey = (getCliArgValue('--source-key') || DEFAULT_SOURCE_KEY).trim().toLowerCase();
  const requestedPackageName = getCliArgValue('--package-name');

  process.env.TIYO_APK_EXTENSIONS_DIR = apkDir;

  const client = new TiyoClient({});
  const sourceSetup = client.runApkHoudokuApkSourceMethodSetup(
    sourceKey,
    apkDir,
    requestedPackageName
  );
  const previousRuntimeStateVersion = sourceSetup.setup.startupPreparation.runtimeState.runtimeStateVersion;
  const update = client.getApkHoudokuPollingUpdate(previousRuntimeStateVersion, 'test');
  const usabilityReasons = [];

  if (!sourceSetup.success) {
    usabilityReasons.push('Source setup did not succeed.');
  }
  if (!sourceSetup.extensionVisibleInGetExtensions) {
    usabilityReasons.push('Resolved source extension is not visible in getExtensions().');
  }
  if (sourceSetup.selectedPackageName === undefined || sourceSetup.activePackageName === undefined) {
    usabilityReasons.push('Selected/active package mapping is incomplete.');
  }
  if (sourceSetup.selectedPackageName !== sourceSetup.activePackageName) {
    usabilityReasons.push('Selected package and active package do not match.');
  }

  const usableByHoudoku = usabilityReasons.length === 0;

  const payload = {
    apkDirectory: apkDir,
    sourceKey,
    requestedPackageName: requestedPackageName || 'auto',
    sourceSetupSuccess: sourceSetup.success,
    sourceSetupReasons: sourceSetup.reasons,
    selectedPackageName: sourceSetup.selectedPackageName,
    activePackageName: sourceSetup.activePackageName,
    extensionId: sourceSetup.extensionId,
    extensionVisibleInGetExtensions: sourceSetup.extensionVisibleInGetExtensions,
    usableByHoudoku,
    usabilityReasons,
    update: {
      changed: update.changed,
      runtimeStateVersion: update.runtimeStateVersion,
      activeSourceKeys: update.activeSourceKeys,
      canRunHoudokuTest: update.launchModel.canRunHoudokuTest,
      blockerReasons: update.launchModel.blockerReasons,
      activeMappings: update.sync.runtimeState.activeMappings,
    },
  };

  process.stdout.write(`${JSON.stringify(payload, undefined, 2)}\n`);

  if (!usableByHoudoku) {
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
