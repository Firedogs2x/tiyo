const fs = require('node:fs');
const os = require('node:os');
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

const getCliArgValue = (argName) => {
  const prefix = `${argName}=`;
  const entry = process.argv.find((value) => value.startsWith(prefix));
  if (entry === undefined) {
    return undefined;
  }

  return entry.slice(prefix.length).trim();
};

const createFakeApkFiles = (apkDir) => {
  const fileNames = [
    'tachiyomi-all.mangadex-v1.4.206.apk',
    'tachiyomi-all.mangasee-v2.1.0.apk',
    'tachiyomi-all.unknownsource-v1.0.0.apk',
  ];

  fileNames.forEach((fileName) => {
    const filePath = path.join(apkDir, fileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', { encoding: 'utf-8' });
    }
  });
};

const run = () => {
  const inputApkDir = getCliArgValue('--apk-dir') || process.env.TIYO_SMOKE_APK_DIR;
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tiyo-apk-smoke-'));
  const usingRealDirectory = inputApkDir !== undefined && inputApkDir.length > 0;
  const apkDir = usingRealDirectory ? path.resolve(inputApkDir) : path.join(tempRoot, 'apks');
  const configFile = path.join(tempRoot, 'apk-config.json');
  const selectionFile = path.join(tempRoot, 'apk-selection.json');

  fs.mkdirSync(apkDir, { recursive: true });
  if (!usingRealDirectory) {
    createFakeApkFiles(apkDir);
  }

  process.env.TIYO_APK_EXTENSIONS_DIR = apkDir;
  process.env.TIYO_APK_CONFIG_FILE = configFile;
  process.env.TIYO_APK_SELECTION_FILE = selectionFile;

  const client = new TiyoClient({});

  const digestBefore = client.getApkRuntimeDigest();
  const directoryStatus = client.getApkDirectoryStatus();
  const enforcedDefault = client.enforceDefaultApkDirectory();
  const quickBefore = client.getApkRuntimeQuickStatus(undefined);
  const pollBefore = client.getApkRuntimePollingDecision(digestBefore.runtimeStateVersion);
  const bootstrapBefore = client.getApkRuntimeBootstrap(undefined);
  const suggestedBefore = client.runApkRuntimeSuggestedAction(undefined);
  const uiModelBefore = client.getApkUiModel(undefined);
  const unneededBefore = client.getApkUnneededExtensions();
  const unneededCleanupDryRun = client.cleanupUnneededApkExtensions({
    apply: false,
    policy: 'unsupported-only',
  });
  const unneededCleanupApply = usingRealDirectory
    ? client.cleanupUnneededApkExtensions({ apply: false, policy: 'all-unneeded' })
    : client.cleanupUnneededApkExtensions({ apply: true, policy: 'all-unneeded' });
  const cleanupBefore = client.cleanupApkSelectionState();
  const startupPrep = client.prepareApkRuntimeForHoudokuStartup();
  const houdokuReady = client.getApkHoudokuReadyStatus();
  const maintenanceCycle = client.runApkRuntimeMaintenanceCycle({
    applyUnneededCleanup: false,
    unneededCleanupPolicy: 'unsupported-only',
    stabilizeMaxSteps: 2,
  });
  const strictGate = client.runApkRuntimeStrictStartupGate({
    maintenanceOptions: {
      applyUnneededCleanup: false,
      unneededCleanupPolicy: 'unsupported-only',
      stabilizeMaxSteps: 2,
    },
    requireReadyLevel: 'warning',
    requireNoUnsupportedApks: false,
    requireNoUnneededApks: false,
  });
  const strictRecommendation = client.getApkRecommendedStrictStartupGate('test');
  const strictGateRecommended = client.runApkRecommendedStrictStartupGate('test');
  const remediationPlan = client.getApkStartupRemediationPlan('test');
  const remediationRun = client.runApkStartupRemediation('test');
  const remediationRunWithOverrides = client.runApkStartupRemediationWithOverrides('test', {
    maintenanceOptions: {
      applyUnneededCleanup: false,
      unneededCleanupPolicy: 'unsupported-only',
      stabilizeMaxSteps: 1,
    },
    requireReadyLevel: 'warning',
    requireNoUnsupportedApks: false,
    requireNoUnneededApks: false,
  });
  const remediationUntilStable = client.runApkStartupRemediationUntilStable({
    profile: 'test',
    overrides: {
      maintenanceOptions: {
        applyUnneededCleanup: false,
        unneededCleanupPolicy: 'unsupported-only',
        stabilizeMaxSteps: 1,
      },
      requireReadyLevel: 'warning',
      requireNoUnsupportedApks: false,
      requireNoUnneededApks: false,
    },
    maxRuns: 3,
  });
  const runtimeBefore = client.getApkRuntimeState();
  const repairResult = client.repairApkRuntimeState();
  const digestAfter = client.getApkRuntimeDigest();
  const quickAfter = client.getApkRuntimeQuickStatus(digestBefore.runtimeStateVersion);
  const bootstrapAfter = client.getApkRuntimeBootstrap(digestAfter.runtimeStateVersion);
  const suggestedAfter = client.runApkRuntimeSuggestedAction(digestAfter.runtimeStateVersion);
  const stabilized = client.stabilizeApkRuntimeState(3);

  console.log('--- APK Runtime Smoke Test ---');
  console.log('Mode:', usingRealDirectory ? 'real-directory' : 'fixture-directory');
  console.log('APK directory:', apkDir);
  console.log('Discovered APK files:', runtimeBefore.apkExtensions.length);
  console.log('Directory status:', JSON.stringify(directoryStatus, null, 2));
  console.log('Enforced default status:', JSON.stringify(enforcedDefault.directoryStatus, null, 2));
  console.log('Source groups:', runtimeBefore.sourceGroups.length);
  console.log('Active mappings (before repair):', runtimeBefore.activeMappings.length);
  console.log('Digest version (before):', digestBefore.runtimeStateVersion);
  console.log('Polling changed (same version):', pollBefore.changed);
  console.log('Quick status (before):', JSON.stringify(quickBefore, null, 2));
  console.log('Bootstrap (before) has runtime state:', bootstrapBefore.runtimeState !== undefined);
  console.log('Suggested action (before):', suggestedBefore.action, 'performed:', suggestedBefore.performed);
  console.log('UI model (before) has runtime state:', uiModelBefore.bootstrap.runtimeState !== undefined);
  console.log('Unneeded APK candidates (before):', unneededBefore.length);
  console.log('Unneeded cleanup dry-run removed:', unneededCleanupDryRun.removedCount);
  console.log('Unneeded cleanup dry-run policy:', unneededCleanupDryRun.policy);
  console.log('Unneeded cleanup apply mode:', unneededCleanupApply.apply, 'removed:', unneededCleanupApply.removedCount);
  console.log('Cleanup removed selections (before):', cleanupBefore.removed.length);
  console.log('Startup prep runtime state version:', startupPrep.runtimeState.runtimeStateVersion);
  console.log('Houdoku ready level:', houdokuReady.level, 'action:', houdokuReady.suggestedNextAction);
  console.log('Maintenance cycle ready level:', maintenanceCycle.readyStatus.level);
  console.log('Strict gate passed:', strictGate.passed, 'reasons:', strictGate.reasons.length);
  console.log('Recommended strict profile:', strictRecommendation.profile, 'passed:', strictGateRecommended.passed);
  console.log('Remediation plan steps:', remediationPlan.steps.length);
  console.log('Remediation run improved:', remediationRun.improved, 'steps attempted:', remediationRun.stepResults.filter((entry) => entry.attempted).length);
  console.log('Remediation run (overrides) passed after:', remediationRunWithOverrides.afterGate.passed);
  console.log('Remediation until stable:', remediationUntilStable.stopReason, 'runs:', remediationUntilStable.runs.length);
  console.log('Repair applied/skipped:', repairResult.operation.appliedCount, '/', repairResult.operation.skippedCount);
  console.log('Last repair:', JSON.stringify(repairResult.lastRepair, null, 2));
  console.log('Digest version (after):', digestAfter.runtimeStateVersion);
  console.log('Quick status (after):', JSON.stringify(quickAfter, null, 2));
  console.log('Bootstrap (after) has runtime state:', bootstrapAfter.runtimeState !== undefined);
  console.log('Suggested action (after):', suggestedAfter.action, 'performed:', suggestedAfter.performed);
  console.log('Stabilize steps:', stabilized.steps.length, 'repairsRun:', stabilized.repairsRun);

  const sanityChecks = [
    typeof digestBefore.runtimeStateVersion === 'string' && digestBefore.runtimeStateVersion.length > 0,
    typeof directoryStatus.isUsingDefaultDirectory === 'boolean',
    typeof directoryStatus.directoryExists === 'boolean',
    typeof directoryStatus.apkCount === 'number',
    enforcedDefault.directoryStatus.isUsingDefaultDirectory === true,
    typeof quickBefore.changed === 'boolean',
    typeof quickBefore.hasBlockingErrors === 'boolean',
    typeof quickBefore.runtimePollIntervalHintMs === 'number',
    typeof quickBefore.suggestedNextAction === 'string',
    typeof quickBefore.shouldAutoRepair === 'boolean',
    bootstrapBefore.runtimeState !== undefined,
    bootstrapAfter.runtimeState === undefined,
    typeof suggestedBefore.action === 'string',
    typeof suggestedBefore.performed === 'boolean',
    suggestedBefore.quickStatus !== undefined,
    suggestedBefore.digest !== undefined,
    uiModelBefore.directoryStatus !== undefined,
    uiModelBefore.bootstrap !== undefined,
    uiModelBefore.migrationReport !== undefined,
    Array.isArray(unneededBefore),
    unneededCleanupDryRun.apply === false,
    unneededCleanupDryRun.policy === 'unsupported-only',
    Array.isArray(unneededCleanupDryRun.results),
    unneededCleanupDryRun.results.every((entry) => entry.status === 'dry-run'),
    Array.isArray(unneededCleanupApply.results),
    unneededCleanupApply.policy === 'all-unneeded',
    Array.isArray(cleanupBefore.removed),
    cleanupBefore.selectionState !== undefined,
    startupPrep.directoryStatus !== undefined,
    startupPrep.runtimeConfig.apkOnlyMode === true,
    startupPrep.cleanupResult !== undefined,
    startupPrep.autoSelectResult !== undefined,
    startupPrep.runtimeState !== undefined,
    typeof houdokuReady.level === 'string',
    typeof houdokuReady.isReady === 'boolean',
    typeof houdokuReady.runtimeStateVersion === 'string',
    typeof houdokuReady.activeMappingCount === 'number',
    typeof houdokuReady.suggestedNextAction === 'string',
    maintenanceCycle.options.applyUnneededCleanup === false,
    maintenanceCycle.options.unneededCleanupPolicy === 'unsupported-only',
    maintenanceCycle.options.stabilizeMaxSteps === 2,
    maintenanceCycle.startupPreparation !== undefined,
    maintenanceCycle.unneededCleanup !== undefined,
    maintenanceCycle.stabilization !== undefined,
    maintenanceCycle.readyStatus !== undefined,
    strictGate.options.requireReadyLevel === 'warning',
    strictGate.options.requireNoUnsupportedApks === false,
    strictGate.options.requireNoUnneededApks === false,
    strictGate.maintenanceCycle !== undefined,
    strictGate.readyStatus !== undefined,
    strictGate.passed === true,
    Array.isArray(strictGate.reasons),
    strictRecommendation.profile === 'test',
    strictRecommendation.options !== undefined,
    Array.isArray(strictRecommendation.notes),
    strictGateRecommended.options !== undefined,
    typeof strictGateRecommended.passed === 'boolean',
    remediationPlan.profile === 'test',
    remediationPlan.recommendation !== undefined,
    remediationPlan.strictGate !== undefined,
    Array.isArray(remediationPlan.steps),
    remediationPlan.steps.every((step) => typeof step.method === 'string'),
    remediationRun.profile === 'test',
    remediationRun.plan !== undefined,
    remediationRun.beforeGate !== undefined,
    remediationRun.afterGate !== undefined,
    typeof remediationRun.improved === 'boolean',
    Array.isArray(remediationRun.stepResults),
    remediationRun.usedOverrides === undefined,
    remediationRunWithOverrides.usedOverrides !== undefined,
    remediationRunWithOverrides.usedOverrides.requireReadyLevel === 'warning',
    remediationRunWithOverrides.afterGate.options.requireNoUnsupportedApks === false,
    Array.isArray(remediationRunWithOverrides.stepResults),
    remediationUntilStable.profile === 'test',
    remediationUntilStable.maxRuns === 3,
    Array.isArray(remediationUntilStable.runs),
    remediationUntilStable.finalRun !== undefined,
    typeof remediationUntilStable.stopReason === 'string',
    typeof remediationUntilStable.converged === 'boolean',
    typeof suggestedAfter.action === 'string',
    Array.isArray(stabilized.steps),
    typeof stabilized.repairsRun === 'number',
    stabilized.finalDigest !== undefined,
    stabilized.finalQuickStatus !== undefined,
    typeof repairResult.operation.appliedCount === 'number',
    typeof repairResult.lastRepair.timestamp === 'string',
  ];

  if (sanityChecks.every(Boolean)) {
    console.log('SMOKE RESULT: PASS');
    process.exit(0);
  }

  console.error('SMOKE RESULT: FAIL');
  process.exit(1);
};

run();
