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
  const main = client.runApkHoudokuMainProgramMethod({
    targetDirectory: apkDir,
    sourceKey,
    requestedPackageName,
    profile: 'test',
  });

  const payload = {
    apkDirectory: apkDir,
    sourceKey,
    requestedPackageName: requestedPackageName || 'auto',
    sourceSetupSuccess: main.goodSourceSetup.sourceSetup.success,
    sourceSetupReasons: main.goodSourceSetup.sourceSetup.reasons,
    selectedPackageName: main.goodSourceSetup.sourceSetup.selectedPackageName,
    activePackageName: main.goodSourceSetup.sourceSetup.activePackageName,
    extensionId: main.goodSourceSetup.sourceSetup.extensionId,
    extensionVisibleInGetExtensions: main.goodSourceSetup.sourceSetup.extensionVisibleInGetExtensions,
    usableByHoudoku: main.goodSourceSetup.usableByHoudoku,
    usabilityReasons: main.goodSourceSetup.reasons,
    mainSuccess: main.success,
    mainReasons: main.reasons,
    update: {
      changed: main.pollingUpdate.changed,
      runtimeStateVersion: main.pollingUpdate.runtimeStateVersion,
      activeSourceKeys: main.pollingUpdate.activeSourceKeys,
      canRunHoudokuTest: main.pollingUpdate.launchModel.canRunHoudokuTest,
      blockerReasons: main.pollingUpdate.launchModel.blockerReasons,
      activeMappings: main.pollingUpdate.sync.runtimeState.activeMappings,
    },
  };

  process.stdout.write(`${JSON.stringify(payload, undefined, 2)}\n`);

  if (!main.success) {
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
