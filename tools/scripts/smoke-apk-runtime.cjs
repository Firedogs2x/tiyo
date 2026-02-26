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

const run = () => {
  const apkDir = path.resolve(getCliArgValue('--apk-dir') || process.env.TIYO_SMOKE_APK_DIR || DEFAULT_APK_DIR);
  const sourceKey = (getCliArgValue('--source-key') || DEFAULT_SOURCE_KEY).trim().toLowerCase();
  const requestedPackageName = getCliArgValue('--package-name');

  process.env.TIYO_APK_EXTENSIONS_DIR = apkDir;

  const client = new TiyoClient({});
  client.setApkExtensionsDirectory(apkDir);
  client.refreshApkExtensions();

  const sourceGroup = client
    .getApkSourceGroups()
    .find((entry) => entry.sourceKey.toLowerCase() === sourceKey);

  if (sourceGroup === undefined) {
    console.error('SMOKE RESULT: FAIL');
    console.error(`Source '${sourceKey}' was not found from APK mappings.`);
    process.exit(1);
  }

  const supportedOptions = sourceGroup.options.filter((entry) => entry.supported);
  if (supportedOptions.length === 0) {
    console.error('SMOKE RESULT: FAIL');
    console.error(`Source '${sourceKey}' has no supported APK options.`);
    process.exit(1);
  }

  const packageToSelect =
    requestedPackageName && requestedPackageName.length > 0
      ? requestedPackageName
      : supportedOptions[0].packageName;

  const requestedOption = supportedOptions.find((entry) => entry.packageName === packageToSelect);
  if (requestedOption === undefined) {
    console.error('SMOKE RESULT: FAIL');
    console.error(`Requested package '${packageToSelect}' is not a supported option for '${sourceKey}'.`);
    process.exit(1);
  }

  client.setApkSourceSelection(sourceKey, packageToSelect);
  client.setApkOnlyMode(true);

  const runtimeState = client.refreshApkRuntimeState();
  const activeMapping = runtimeState.activeMappings.find((entry) => entry.sourceKey === sourceKey);
  const extensions = client.getExtensions();

  const extensionVisible =
    activeMapping !== undefined &&
    activeMapping.extensionId !== undefined &&
    extensions[activeMapping.extensionId] !== undefined;

  const pass =
    fs.existsSync(apkDir) &&
    runtimeState.runtimeConfig.apkOnlyMode === true &&
    activeMapping !== undefined &&
    activeMapping.selectedPackageName === packageToSelect &&
    extensionVisible;

  console.log('--- Houdoku APK Override Smoke ---');
  console.log('APK directory:', apkDir);
  console.log('APK directory exists:', fs.existsSync(apkDir));
  console.log('Source key:', sourceKey);
  console.log('Requested package:', packageToSelect);
  console.log('Supported package count:', supportedOptions.length);
  console.log('Active package:', activeMapping ? activeMapping.selectedPackageName : 'none');
  console.log('APK-only mode:', runtimeState.runtimeConfig.apkOnlyMode === true);
  console.log('Mapped extension id:', activeMapping ? activeMapping.extensionId : 'none');
  console.log('Visible in getExtensions:', extensionVisible);

  if (pass) {
    console.log('SMOKE RESULT: PASS');
    process.exit(0);
  }

  console.error('SMOKE RESULT: FAIL');
  process.exit(1);
};

run();
