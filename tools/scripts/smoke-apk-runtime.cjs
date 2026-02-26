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

const getFirstPositionalArg = () => {
  return process.argv.slice(2).find((value) => !value.startsWith('--'));
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
  const inputApkDir =
    getCliArgValue('--apk-dir') || process.env.TIYO_SMOKE_APK_DIR || getFirstPositionalArg();
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
  const startupSummary = client.getApkStartupExecutionSummary('test');
  const houdokuTestReady = client.runApkHoudokuTestReady({
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
    maxRemediationRuns: 2,
  });
  const houdokuLaunchModel = client.getApkHoudokuLaunchModel('test', digestBefore.runtimeStateVersion);
  const houdokuLaunchModelWithOverrides = client.getApkHoudokuLaunchModelWithOverrides({
    profile: 'test',
    previousRuntimeStateVersion: digestBefore.runtimeStateVersion,
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
  });
  const houdokuTestingPreset = client.getApkHoudokuTestingPreset('test');
  const houdokuTestingModel = client.getApkHoudokuTestingModel('test', digestBefore.runtimeStateVersion);
  const houdokuTestingModelWithOptions = client.getApkHoudokuTestingModelWithOptions({
    profile: 'test',
    previousRuntimeStateVersion: digestBefore.runtimeStateVersion,
    maxRemediationRuns: 1,
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
  });
  const houdokuIntegrationPlan = client.getApkHoudokuIntegrationPlan('test', digestBefore.runtimeStateVersion);
  const houdokuIntegrationStepRun = client.runApkHoudokuIntegrationStep(
    'test',
    'run-ready',
    digestBefore.runtimeStateVersion
  );
  const houdokuIntegrationPlanRun = client.runApkHoudokuIntegrationPlan(
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuNextStep = client.getApkNextHoudokuIntegrationStep(
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuNextStepRun = client.runApkNextHoudokuIntegrationStep(
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuControllerModel = client.getApkHoudokuIntegrationControllerModel(
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuControllerCycle = client.runApkHoudokuIntegrationControllerCycle(
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuCommandSuggestions = client.getApkHoudokuIntegrationCommandSuggestions(
    'test',
    digestBefore.runtimeStateVersion
  );
  const nextSuggestedCommand = houdokuCommandSuggestions.suggestions.find((entry) => entry.isNextStep);
  const invalidNextSuggestedCommand =
    nextSuggestedCommand === undefined
      ? undefined
      : {
          ...nextSuggestedCommand,
          argsJson: '{invalid-json',
        };
  const houdokuCommandPreflight = client.preflightApkHoudokuIntegrationCommandSuggestion(
    nextSuggestedCommand,
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuNextCommandPreflight = client.preflightApkHoudokuNextIntegrationCommandSuggestion(
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuInvalidCommandPreflight = client.preflightApkHoudokuIntegrationCommandSuggestion(
    invalidNextSuggestedCommand,
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuCommandAuditBundle = client.getApkHoudokuIntegrationCommandAuditBundle(
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuNextCommandAuditBundle = client.getApkHoudokuNextIntegrationCommandAuditBundle(
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuNextCommandTransaction = client.runApkHoudokuNextIntegrationCommandTransaction(
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuNextCommandTransactions = client.runApkHoudokuNextIntegrationCommandTransactions({
    profile: 'test',
    previousRuntimeStateVersion: digestBefore.runtimeStateVersion,
    maxRuns: 3,
  });
  const houdokuCompletionPolicy =
    client.runApkHoudokuNextIntegrationCommandTransactionsWithCompletionPolicy({
      profile: 'test',
      previousRuntimeStateVersion: digestBefore.runtimeStateVersion,
      maxRuns: 3,
      requiredStepCodes: ['refresh-summary'],
      requireDispatchReady: true,
      requireCanRunHoudokuTest: true,
      stableNextStepRuns: 1,
    });
  const houdokuCompletionPolicyPreset = client.getApkHoudokuIntegrationCompletionPolicyPreset('test');
  const houdokuCompletionPolicyPresetRun = client.runApkHoudokuIntegrationCompletionPolicyPreset(
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuCompletionRecommendation =
    client.getApkHoudokuIntegrationCompletionPolicyPresetRecommendation(
      digestBefore.runtimeStateVersion
    );
  const houdokuCompletionRecommendationRun =
    client.runApkHoudokuIntegrationCompletionPolicyPresetRecommendation(
      digestBefore.runtimeStateVersion
    );
  const houdokuAutopilotSession = client.runApkHoudokuIntegrationAutopilotSession(
    digestBefore.runtimeStateVersion
  );
  const houdokuAutopilotQuickStatus = client.getApkHoudokuIntegrationAutopilotQuickStatus(
    digestBefore.runtimeStateVersion
  );
  const houdokuTestingEntryModel = client.getApkHoudokuTestingEntryModel(
    digestBefore.runtimeStateVersion
  );
  const houdokuTestingPrimaryAction = client.runApkHoudokuTestingPrimaryAction(
    digestBefore.runtimeStateVersion
  );
  const houdokuTestingSession = client.runApkHoudokuTestingSession(
    digestBefore.runtimeStateVersion
  );
  const houdokuTestingSessionLoop = client.runApkHoudokuTestingSessionLoop({
    previousRuntimeStateVersion: digestBefore.runtimeStateVersion,
    maxRuns: 3,
    stableCompletionRuns: 1,
  });
  const houdokuTestingControllerModel = client.getApkHoudokuTestingControllerModel({
    previousRuntimeStateVersion: digestBefore.runtimeStateVersion,
    maxRuns: 3,
    stableCompletionRuns: 1,
  });
  const houdokuTestingControllerCycle = client.runApkHoudokuTestingControllerCycle({
    previousRuntimeStateVersion: digestBefore.runtimeStateVersion,
    maxRuns: 3,
    stableCompletionRuns: 1,
  });
  const houdokuTestingAutopilot = client.runApkHoudokuTestingAutopilot({
    previousRuntimeStateVersion: digestBefore.runtimeStateVersion,
    maxRuns: 3,
    stableCompletionRuns: 1,
  });
  const houdokuCommandDispatch = client.runApkHoudokuIntegrationCommandSuggestion(
    nextSuggestedCommand,
    'test',
    digestBefore.runtimeStateVersion
  );
  const houdokuNextCommandDispatch = client.runApkHoudokuNextIntegrationCommandSuggestion(
    'test',
    digestBefore.runtimeStateVersion
  );
  const runtimeBefore = client.getApkRuntimeState();
  const repairResult = client.repairApkRuntimeState();
  const digestAfter = client.getApkRuntimeDigest();
  const quickAfter = client.getApkRuntimeQuickStatus(digestBefore.runtimeStateVersion);
  const bootstrapAfter = client.getApkRuntimeBootstrap(digestAfter.runtimeStateVersion);
  const suggestedAfter = client.runApkRuntimeSuggestedAction(digestAfter.runtimeStateVersion);
  const stabilized = client.stabilizeApkRuntimeState(3);
  const houdokuTestingCommandSuggestions = client.getApkHoudokuTestingCommandSuggestions(
    digestBefore.runtimeStateVersion
  );
  const nextTestingSuggestedCommand = houdokuTestingCommandSuggestions.suggestions.find(
    (entry) => entry.isNextStep
  );
  const invalidNextTestingSuggestedCommand =
    nextTestingSuggestedCommand === undefined
      ? undefined
      : {
          ...nextTestingSuggestedCommand,
          argsJson: '{invalid-json',
        };
  const houdokuTestingCommandPreflight = client.preflightApkHoudokuTestingCommandSuggestion(
    nextTestingSuggestedCommand,
    digestBefore.runtimeStateVersion
  );
  const houdokuInvalidTestingCommandPreflight =
    client.preflightApkHoudokuTestingCommandSuggestion(
      invalidNextTestingSuggestedCommand,
      digestBefore.runtimeStateVersion
    );
  const houdokuTestingCommandDispatch = client.runApkHoudokuTestingCommandSuggestion(
    nextTestingSuggestedCommand,
    digestBefore.runtimeStateVersion
  );
  const houdokuNextTestingCommandDispatch = client.runApkHoudokuNextTestingCommandSuggestion(
    digestBefore.runtimeStateVersion
  );
  const houdokuNextTestingCommandPreflight =
    client.preflightApkHoudokuNextTestingCommandSuggestion(digestBefore.runtimeStateVersion);
  const houdokuTestingCommandAuditBundle = client.getApkHoudokuTestingCommandAuditBundle(
    digestBefore.runtimeStateVersion
  );
  const houdokuNextTestingCommandAuditBundle =
    client.getApkHoudokuNextTestingCommandAuditBundle(digestBefore.runtimeStateVersion);
  const houdokuNextTestingCommandTransaction =
    client.runApkHoudokuNextTestingCommandTransaction(digestBefore.runtimeStateVersion);
  const houdokuNextTestingCommandTransactions =
    client.runApkHoudokuNextTestingCommandTransactions({
      previousRuntimeStateVersion: digestBefore.runtimeStateVersion,
      maxRuns: 3,
    });
  const houdokuTestingCompletionPolicy =
    client.runApkHoudokuNextTestingCommandTransactionsWithCompletionPolicy({
      previousRuntimeStateVersion: digestBefore.runtimeStateVersion,
      maxRuns: 3,
      requiredStepCodes: ['refresh-entry'],
      requireDispatchReady: true,
      requireInteractiveTestReady: true,
      stableNextStepRuns: 1,
    });
  const houdokuTestingCompletionPreset =
    client.getApkHoudokuTestingCompletionPolicyPreset('test');
  const houdokuTestingCompletionPresetRun =
    client.runApkHoudokuTestingCompletionPolicyPreset(
      'test',
      digestBefore.runtimeStateVersion
    );
  const houdokuTestingCompletionRecommendation =
    client.getApkHoudokuTestingCompletionPolicyPresetRecommendation(
      digestBefore.runtimeStateVersion
    );
  const houdokuTestingCompletionRecommendationRun =
    client.runApkHoudokuTestingCompletionPolicyPresetRecommendation(
      digestBefore.runtimeStateVersion
    );
  const houdokuTestingAutopilotSession = client.runApkHoudokuTestingAutopilotSession(
    digestBefore.runtimeStateVersion
  );
  const houdokuTestingAutopilotQuickStatus = client.getApkHoudokuTestingAutopilotQuickStatus(
    digestBefore.runtimeStateVersion
  );
  const houdokuTestingExecutionSummary = client.getApkHoudokuTestingExecutionSummary(
    digestBefore.runtimeStateVersion
  );
  const houdokuTestingQuickStart = client.runApkHoudokuTestingQuickStart(
    digestBefore.runtimeStateVersion
  );
  const houdokuTestingFunctionalRun = client.runApkHoudokuTestingFunctionalRun(
    digestBefore.runtimeStateVersion
  );
  const houdokuTestingDispatchModel = client.getApkHoudokuTestingDispatchModel(
    digestBefore.runtimeStateVersion
  );

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
  console.log('Startup summary gate pass:', startupSummary.recommendedGatePassed, 'action:', startupSummary.suggestedNextAction);
  console.log('Houdoku test ready:', houdokuTestReady.readyForHoudokuTest, 'reasons:', houdokuTestReady.reasons.length);
  console.log('Houdoku launch model can test:', houdokuLaunchModel.canRunHoudokuTest, 'blockers:', houdokuLaunchModel.blockerReasons.length);
  console.log('Houdoku launch model (overrides) can test:', houdokuLaunchModelWithOverrides.canRunHoudokuTest);
  console.log('Houdoku testing model ready:', houdokuTestingModel.testReady.readyForHoudokuTest);
  console.log('Houdoku testing model (options) ready:', houdokuTestingModelWithOptions.testReady.readyForHoudokuTest);
  console.log('Houdoku integration plan steps:', houdokuIntegrationPlan.steps.length);
  console.log('Houdoku integration step run executed:', houdokuIntegrationStepRun.stepResults.length);
  console.log('Houdoku integration plan run executed:', houdokuIntegrationPlanRun.stepResults.length);
  console.log('Houdoku next step:', houdokuNextStep.step ? houdokuNextStep.step.code : 'none');
  console.log(
    'Houdoku next step run executed:',
    houdokuNextStepRun.execution.stepResults.length,
    'requested:',
    houdokuNextStepRun.execution.requestedStepCode || 'none'
  );
  console.log(
    'Houdoku controller suggested step:',
    houdokuControllerModel.suggestedStepCode || 'none'
  );
  console.log(
    'Houdoku controller cycle executed:',
    houdokuControllerCycle.nextStepRun.execution.stepResults.length,
    'refreshed suggested:',
    houdokuControllerCycle.refreshedModel.suggestedStepCode || 'none'
  );
  console.log(
    'Houdoku command suggestions:',
    houdokuCommandSuggestions.suggestions.length,
    'next-step method:',
    houdokuCommandSuggestions.suggestions.find((entry) => entry.isNextStep)?.method || 'none'
  );
  console.log(
    'Houdoku command preflight allowlisted/args:',
    houdokuCommandPreflight.allowlisted,
    '/',
    houdokuCommandPreflight.parsedArgsValid
  );
  console.log(
    'Houdoku next command preflight allowlisted/args:',
    houdokuNextCommandPreflight.preflight.allowlisted,
    '/',
    houdokuNextCommandPreflight.preflight.parsedArgsValid
  );
  console.log(
    'Houdoku invalid command preflight args valid:',
    houdokuInvalidCommandPreflight.parsedArgsValid,
    'error:',
    houdokuInvalidCommandPreflight.error || 'none'
  );
  console.log(
    'Houdoku command audit bundle entries:',
    houdokuCommandAuditBundle.entries.length,
    'ready:',
    houdokuCommandAuditBundle.entries.filter((entry) => entry.dispatchReady).length
  );
  console.log(
    'Houdoku next command audit ready:',
    houdokuNextCommandAuditBundle.dispatchReady,
    'step:',
    houdokuNextCommandAuditBundle.command
      ? houdokuNextCommandAuditBundle.command.stepCode
      : 'none'
  );
  console.log(
    'Houdoku next command transaction executed:',
    houdokuNextCommandTransaction.executed,
    'skip:',
    houdokuNextCommandTransaction.skippedReason || 'none'
  );
  console.log(
    'Houdoku next command transactions:',
    houdokuNextCommandTransactions.runs.length,
    'stop:',
    houdokuNextCommandTransactions.stopReason,
    'converged:',
    houdokuNextCommandTransactions.converged
  );
  console.log(
    'Houdoku completion policy completed:',
    houdokuCompletionPolicy.completed,
    'missing required:',
    houdokuCompletionPolicy.missingRequiredStepCodes.length
  );
  console.log(
    'Houdoku completion preset max runs:',
    houdokuCompletionPolicyPreset.maxRuns,
    'completed:',
    houdokuCompletionPolicyPresetRun.completed
  );
  console.log(
    'Houdoku completion recommendation profile:',
    houdokuCompletionRecommendation.recommendedProfile,
    'completed:',
    houdokuCompletionRecommendationRun.result.completed
  );
  console.log(
    'Houdoku autopilot status/action:',
    houdokuAutopilotSession.status,
    '/',
    houdokuAutopilotSession.suggestedNextAction
  );
  console.log(
    'Houdoku autopilot quick status/action:',
    houdokuAutopilotQuickStatus.status,
    '/',
    houdokuAutopilotQuickStatus.suggestedNextAction
  );
  console.log(
    'Houdoku testing entry can start/action:',
    houdokuTestingEntryModel.canStartInteractiveTest,
    '/',
    houdokuTestingEntryModel.suggestedPrimaryAction
  );
  console.log(
    'Houdoku testing primary action performed/action:',
    houdokuTestingPrimaryAction.performed,
    '/',
    houdokuTestingPrimaryAction.action
  );
  console.log(
    'Houdoku testing session completed/reason:',
    houdokuTestingSession.completed,
    '/',
    houdokuTestingSession.reason
  );
  console.log(
    'Houdoku testing session loop completed/stop/runs:',
    houdokuTestingSessionLoop.completed,
    '/',
    houdokuTestingSessionLoop.stopReason,
    '/',
    houdokuTestingSessionLoop.runs.length
  );
  console.log(
    'Houdoku testing controller model status/action:',
    houdokuTestingControllerModel.status,
    '/',
    houdokuTestingControllerModel.suggestedPrimaryAction
  );
  console.log(
    'Houdoku testing controller cycle completed/next:',
    houdokuTestingControllerCycle.completed,
    '/',
    houdokuTestingControllerCycle.suggestedNextAction
  );
  console.log(
    'Houdoku testing autopilot status/next:',
    houdokuTestingAutopilot.status,
    '/',
    houdokuTestingAutopilot.suggestedNextAction
  );
  console.log(
    'Houdoku testing command suggestions:',
    houdokuTestingCommandSuggestions.suggestions.length,
    'next-step method:',
    houdokuTestingCommandSuggestions.suggestions.find((entry) => entry.isNextStep)?.method || 'none'
  );
  console.log(
    'Houdoku testing command preflight allowlisted/args:',
    houdokuTestingCommandPreflight.allowlisted,
    '/',
    houdokuTestingCommandPreflight.parsedArgsValid
  );
  console.log(
    'Houdoku testing invalid command preflight args valid:',
    houdokuInvalidTestingCommandPreflight.parsedArgsValid,
    'error:',
    houdokuInvalidTestingCommandPreflight.error || 'none'
  );
  console.log(
    'Houdoku testing command dispatch executed:',
    houdokuTestingCommandDispatch.executed,
    'allowlisted:',
    houdokuTestingCommandDispatch.allowlisted
  );
  console.log(
    'Houdoku next testing command dispatch executed:',
    houdokuNextTestingCommandDispatch.execution.executed,
    'step:',
    houdokuNextTestingCommandDispatch.command
      ? houdokuNextTestingCommandDispatch.command.stepCode
      : 'none'
  );
  console.log(
    'Houdoku next testing command preflight allowlisted/args:',
    houdokuNextTestingCommandPreflight.preflight.allowlisted,
    '/',
    houdokuNextTestingCommandPreflight.preflight.parsedArgsValid
  );
  console.log(
    'Houdoku testing command audit entries/ready:',
    houdokuTestingCommandAuditBundle.entries.length,
    '/',
    houdokuTestingCommandAuditBundle.entries.filter((entry) => entry.dispatchReady).length
  );
  console.log(
    'Houdoku next testing command audit ready/step:',
    houdokuNextTestingCommandAuditBundle.dispatchReady,
    '/',
    houdokuNextTestingCommandAuditBundle.command
      ? houdokuNextTestingCommandAuditBundle.command.stepCode
      : 'none'
  );
  console.log(
    'Houdoku next testing command transaction executed/skip:',
    houdokuNextTestingCommandTransaction.executed,
    '/',
    houdokuNextTestingCommandTransaction.skippedReason || 'none'
  );
  console.log(
    'Houdoku next testing command transactions runs/stop/converged:',
    houdokuNextTestingCommandTransactions.runs.length,
    '/',
    houdokuNextTestingCommandTransactions.stopReason,
    '/',
    houdokuNextTestingCommandTransactions.converged
  );
  console.log(
    'Houdoku testing completion policy completed/missing:',
    houdokuTestingCompletionPolicy.completed,
    '/',
    houdokuTestingCompletionPolicy.missingRequiredStepCodes.length
  );
  console.log(
    'Houdoku testing completion preset max runs/completed:',
    houdokuTestingCompletionPreset.maxRuns,
    '/',
    houdokuTestingCompletionPresetRun.completed
  );
  console.log(
    'Houdoku testing completion recommendation profile/completed:',
    houdokuTestingCompletionRecommendation.recommendedProfile,
    '/',
    houdokuTestingCompletionRecommendationRun.result.completed
  );
  console.log(
    'Houdoku testing autopilot status/action:',
    houdokuTestingAutopilotSession.status,
    '/',
    houdokuTestingAutopilotSession.suggestedNextAction
  );
  console.log(
    'Houdoku testing autopilot quick status/action:',
    houdokuTestingAutopilotQuickStatus.status,
    '/',
    houdokuTestingAutopilotQuickStatus.suggestedNextAction
  );
  console.log(
    'Houdoku testing execution summary status/action:',
    houdokuTestingExecutionSummary.status,
    '/',
    houdokuTestingExecutionSummary.suggestedNextAction
  );
  console.log(
    'Houdoku testing quick-start ready/action:',
    houdokuTestingQuickStart.ready,
    '/',
    houdokuTestingQuickStart.suggestedNextAction
  );
  console.log(
    'Houdoku testing functional run ready/action:',
    houdokuTestingFunctionalRun.readyForInteractiveTest,
    '/',
    houdokuTestingFunctionalRun.suggestedNextAction
  );
  console.log(
    'Houdoku testing dispatch action/method:',
    houdokuTestingDispatchModel.suggestedClientAction,
    '/',
    houdokuTestingDispatchModel.dispatchMethod || 'none'
  );
  console.log(
    'Houdoku command dispatch executed:',
    houdokuCommandDispatch.executed,
    'allowlisted:',
    houdokuCommandDispatch.allowlisted
  );
  console.log(
    'Houdoku next command dispatch executed:',
    houdokuNextCommandDispatch.execution.executed,
    'step:',
    houdokuNextCommandDispatch.command ? houdokuNextCommandDispatch.command.stepCode : 'none'
  );
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
    typeof enforcedDefault.directoryStatus.isUsingDefaultDirectory === 'boolean',
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
    startupSummary.profile === 'test',
    typeof startupSummary.runtimeStateVersion === 'string',
    startupSummary.readyStatus !== undefined,
    typeof startupSummary.recommendedGatePassed === 'boolean',
    Array.isArray(startupSummary.recommendedGateReasons),
    typeof startupSummary.suggestedNextAction === 'string',
    houdokuTestReady.profile === 'test',
    houdokuTestReady.maxRemediationRuns === 2,
    houdokuTestReady.remediation !== undefined,
    houdokuTestReady.summary !== undefined,
    typeof houdokuTestReady.readyForHoudokuTest === 'boolean',
    Array.isArray(houdokuTestReady.reasons),
    houdokuLaunchModel.profile === 'test',
    houdokuLaunchModel.uiModel !== undefined,
    houdokuLaunchModel.startupSummary !== undefined,
    houdokuLaunchModel.recommendedStrictGate !== undefined,
    houdokuLaunchModel.remediationPlan !== undefined,
    typeof houdokuLaunchModel.canRunHoudokuTest === 'boolean',
    Array.isArray(houdokuLaunchModel.blockerReasons),
    houdokuLaunchModelWithOverrides.profile === 'test',
    houdokuLaunchModelWithOverrides.usedOverrides !== undefined,
    houdokuLaunchModelWithOverrides.canRunHoudokuTest === true,
    houdokuTestingPreset.profile === 'test',
    houdokuTestingPreset.overrides !== undefined,
    Array.isArray(houdokuTestingPreset.notes),
    houdokuTestingModel.profile === 'test',
    houdokuTestingModel.preset !== undefined,
    houdokuTestingModel.launchModel !== undefined,
    houdokuTestingModel.testReady !== undefined,
    typeof houdokuTestingModel.testReady.readyForHoudokuTest === 'boolean',
    houdokuTestingModelWithOptions.profile === 'test',
    houdokuTestingModelWithOptions.preset !== undefined,
    houdokuTestingModelWithOptions.launchModel !== undefined,
    houdokuTestingModelWithOptions.testReady.maxRemediationRuns === 1,
    houdokuIntegrationPlan.profile === 'test',
    houdokuIntegrationPlan.testingModel !== undefined,
    Array.isArray(houdokuIntegrationPlan.steps),
    houdokuIntegrationPlan.steps.every((entry) => typeof entry.method === 'string'),
    houdokuIntegrationStepRun.profile === 'test',
    houdokuIntegrationStepRun.requestedStepCode === 'run-ready',
    Array.isArray(houdokuIntegrationStepRun.stepResults),
    houdokuIntegrationStepRun.launchModel !== undefined,
    houdokuIntegrationPlanRun.profile === 'test',
    Array.isArray(houdokuIntegrationPlanRun.stepResults),
    houdokuIntegrationPlanRun.stepResults.length === houdokuIntegrationPlan.steps.length,
    houdokuIntegrationPlanRun.launchModel !== undefined,
    houdokuNextStep.profile === 'test',
    typeof houdokuNextStep.canRunHoudokuTest === 'boolean',
    typeof houdokuNextStep.reason === 'string',
    houdokuNextStepRun.profile === 'test',
    houdokuNextStepRun.nextStep !== undefined,
    houdokuNextStepRun.execution !== undefined,
    houdokuNextStepRun.execution.profile === 'test',
    Array.isArray(houdokuNextStepRun.execution.stepResults),
    houdokuControllerModel.profile === 'test',
    houdokuControllerModel.plan !== undefined,
    houdokuControllerModel.nextStep !== undefined,
    typeof houdokuControllerModel.canRunHoudokuTest === 'boolean',
    typeof houdokuControllerModel.suggestedStepCode === 'string' ||
      houdokuControllerModel.suggestedStepCode === undefined,
    houdokuControllerCycle.profile === 'test',
    houdokuControllerCycle.initialModel !== undefined,
    houdokuControllerCycle.nextStepRun !== undefined,
    houdokuControllerCycle.refreshedModel !== undefined,
    Array.isArray(houdokuControllerCycle.nextStepRun.execution.stepResults),
    houdokuCommandSuggestions.profile === 'test',
    Array.isArray(houdokuCommandSuggestions.suggestions),
    houdokuCommandSuggestions.suggestions.length === houdokuIntegrationPlan.steps.length,
    houdokuCommandSuggestions.nextStep !== undefined,
    houdokuCommandSuggestions.suggestions.every((entry) => typeof entry.method === 'string'),
    houdokuCommandSuggestions.suggestions.every((entry) => typeof entry.argsJson === 'string'),
    houdokuCommandSuggestions.suggestions.some((entry) => entry.isNextStep),
    houdokuCommandPreflight.profile === 'test',
    houdokuCommandPreflight.allowlisted === true,
    houdokuCommandPreflight.parsedArgsValid === true,
    Array.isArray(houdokuCommandPreflight.parsedArgs),
    houdokuNextCommandPreflight.profile === 'test',
    houdokuNextCommandPreflight.preflight.allowlisted === true,
    houdokuNextCommandPreflight.preflight.parsedArgsValid === true,
    houdokuInvalidCommandPreflight.profile === 'test',
    invalidNextSuggestedCommand === undefined
      ? houdokuInvalidCommandPreflight.allowlisted === false
      : houdokuInvalidCommandPreflight.allowlisted === true,
    houdokuInvalidCommandPreflight.parsedArgsValid === false,
    typeof houdokuInvalidCommandPreflight.error === 'string',
    houdokuCommandAuditBundle.profile === 'test',
    Array.isArray(houdokuCommandAuditBundle.entries),
    houdokuCommandAuditBundle.entries.length === houdokuCommandSuggestions.suggestions.length,
    houdokuCommandAuditBundle.entries.every((entry) => entry.preflight !== undefined),
    houdokuCommandAuditBundle.entries.every((entry) => typeof entry.dispatchReady === 'boolean'),
    houdokuNextCommandAuditBundle.profile === 'test',
    houdokuNextCommandAuditBundle.preflight !== undefined,
    typeof houdokuNextCommandAuditBundle.dispatchReady === 'boolean',
    houdokuNextCommandTransaction.profile === 'test',
    houdokuNextCommandTransaction.beforeAudit !== undefined,
    houdokuNextCommandTransaction.afterAudit !== undefined,
    typeof houdokuNextCommandTransaction.executed === 'boolean',
    houdokuNextCommandTransaction.beforeAudit.dispatchReady ===
      houdokuNextCommandAuditBundle.dispatchReady,
    houdokuNextCommandTransaction.executed
      ? houdokuNextCommandTransaction.execution !== undefined
      : true,
    houdokuNextCommandTransactions.profile === 'test',
    houdokuNextCommandTransactions.maxRuns === 3,
    Array.isArray(houdokuNextCommandTransactions.runs),
    houdokuNextCommandTransactions.runs.length > 0,
    houdokuNextCommandTransactions.finalAudit !== undefined,
    typeof houdokuNextCommandTransactions.stopReason === 'string',
    typeof houdokuNextCommandTransactions.converged === 'boolean',
    houdokuCompletionPolicy.profile === 'test',
    houdokuCompletionPolicy.policy !== undefined,
    houdokuCompletionPolicy.loop !== undefined,
    typeof houdokuCompletionPolicy.completed === 'boolean',
    Array.isArray(houdokuCompletionPolicy.reasons),
    Array.isArray(houdokuCompletionPolicy.completedRequiredStepCodes),
    Array.isArray(houdokuCompletionPolicy.missingRequiredStepCodes),
    typeof houdokuCompletionPolicy.stableNextStepRunsObserved === 'number',
    houdokuCompletionPolicy.completedRequiredStepCodes.includes('refresh-summary'),
    houdokuCompletionPolicy.completed === true,
    houdokuCompletionPolicyPreset.profile === 'test',
    houdokuCompletionPolicyPreset.policy !== undefined,
    typeof houdokuCompletionPolicyPreset.maxRuns === 'number',
    Array.isArray(houdokuCompletionPolicyPreset.notes),
    houdokuCompletionPolicyPresetRun.profile === 'test',
    houdokuCompletionPolicyPresetRun.completed === true,
    houdokuCompletionPolicyPresetRun.policy !== undefined,
    typeof houdokuCompletionRecommendation.recommendedProfile === 'string',
    houdokuCompletionRecommendation.recommendedPreset !== undefined,
    Array.isArray(houdokuCompletionRecommendation.reasons),
    houdokuCompletionRecommendation.overrideOptions !== undefined,
    houdokuCompletionRecommendation.signals !== undefined,
    houdokuCompletionRecommendationRun.recommendation !== undefined,
    houdokuCompletionRecommendationRun.result !== undefined,
    typeof houdokuCompletionRecommendationRun.result.completed === 'boolean',
    houdokuAutopilotSession.recommendation !== undefined,
    houdokuAutopilotSession.run !== undefined,
    typeof houdokuAutopilotSession.status === 'string',
    typeof houdokuAutopilotSession.summary === 'string',
    typeof houdokuAutopilotSession.suggestedNextAction === 'string',
    typeof houdokuAutopilotQuickStatus.runtimeStateVersion === 'string',
    typeof houdokuAutopilotQuickStatus.changed === 'boolean',
    houdokuAutopilotQuickStatus.runtimeQuickStatus !== undefined,
    typeof houdokuAutopilotQuickStatus.status === 'string',
    typeof houdokuAutopilotQuickStatus.recommendedProfile === 'string',
    typeof houdokuAutopilotQuickStatus.suggestedNextAction === 'string',
    typeof houdokuAutopilotQuickStatus.reason === 'string',
    houdokuTestingEntryModel.runtimeDigest !== undefined,
    houdokuTestingEntryModel.runtimeQuickStatus !== undefined,
    houdokuTestingEntryModel.autopilotQuickStatus !== undefined,
    houdokuTestingEntryModel.testingPreset !== undefined,
    houdokuTestingEntryModel.completionRecommendation !== undefined,
    typeof houdokuTestingEntryModel.canStartInteractiveTest === 'boolean',
    typeof houdokuTestingEntryModel.suggestedPrimaryAction === 'string',
    houdokuTestingPrimaryAction.entryModel !== undefined,
    typeof houdokuTestingPrimaryAction.action === 'string',
    typeof houdokuTestingPrimaryAction.performed === 'boolean',
    typeof houdokuTestingPrimaryAction.reason === 'string',
    houdokuTestingPrimaryAction.action === houdokuTestingEntryModel.suggestedPrimaryAction,
    houdokuTestingPrimaryAction.performed === true,
    houdokuTestingPrimaryAction.testReady !== undefined,
    houdokuTestingSession.beforeEntryModel !== undefined,
    houdokuTestingSession.primaryActionRun !== undefined,
    houdokuTestingSession.afterEntryModel !== undefined,
    typeof houdokuTestingSession.completed === 'boolean',
    typeof houdokuTestingSession.reason === 'string',
    typeof houdokuTestingSessionLoop.maxRuns === 'number',
    typeof houdokuTestingSessionLoop.stableCompletionRuns === 'number',
    Array.isArray(houdokuTestingSessionLoop.runs),
    houdokuTestingSessionLoop.runs.length > 0,
    houdokuTestingSessionLoop.finalSession !== undefined,
    typeof houdokuTestingSessionLoop.completed === 'boolean',
    typeof houdokuTestingSessionLoop.completedRunCount === 'number',
    typeof houdokuTestingSessionLoop.stopReason === 'string',
    typeof houdokuTestingSessionLoop.reason === 'string',
    houdokuTestingControllerModel.entryModel !== undefined,
    typeof houdokuTestingControllerModel.canRunInteractiveTest === 'boolean',
    typeof houdokuTestingControllerModel.suggestedPrimaryAction === 'string',
    typeof houdokuTestingControllerModel.suggestedLoopOptions.maxRuns === 'number',
    typeof houdokuTestingControllerModel.suggestedLoopOptions.stableCompletionRuns === 'number',
    typeof houdokuTestingControllerModel.status === 'string',
    typeof houdokuTestingControllerModel.reason === 'string',
    houdokuTestingControllerCycle.initialModel !== undefined,
    houdokuTestingControllerCycle.loop !== undefined,
    houdokuTestingControllerCycle.refreshedModel !== undefined,
    typeof houdokuTestingControllerCycle.completed === 'boolean',
    typeof houdokuTestingControllerCycle.suggestedNextAction === 'string',
    typeof houdokuTestingControllerCycle.reason === 'string',
    houdokuTestingAutopilot.controllerModel !== undefined,
    houdokuTestingAutopilot.controllerCycle !== undefined,
    houdokuTestingAutopilot.launchModel !== undefined,
    typeof houdokuTestingAutopilot.status === 'string',
    typeof houdokuTestingAutopilot.completed === 'boolean',
    typeof houdokuTestingAutopilot.suggestedNextAction === 'string',
    typeof houdokuTestingAutopilot.reason === 'string',
    typeof houdokuTestingCommandSuggestions.previousRuntimeStateVersion === 'string',
    Array.isArray(houdokuTestingCommandSuggestions.suggestions),
    houdokuTestingCommandSuggestions.suggestions.length > 0,
    houdokuTestingCommandSuggestions.controllerModel !== undefined,
    houdokuTestingCommandSuggestions.suggestions.every((entry) => typeof entry.method === 'string'),
    houdokuTestingCommandSuggestions.suggestions.every((entry) => typeof entry.argsJson === 'string'),
    houdokuTestingCommandSuggestions.suggestions.some((entry) => entry.isNextStep),
    houdokuTestingCommandPreflight.allowlisted === true,
    houdokuTestingCommandPreflight.parsedArgsValid === true,
    Array.isArray(houdokuTestingCommandPreflight.parsedArgs),
    invalidNextTestingSuggestedCommand === undefined
      ? houdokuInvalidTestingCommandPreflight.allowlisted === false
      : houdokuInvalidTestingCommandPreflight.allowlisted === true,
    houdokuInvalidTestingCommandPreflight.parsedArgsValid === false,
    typeof houdokuInvalidTestingCommandPreflight.error === 'string',
    houdokuTestingCommandDispatch.allowlisted === true,
    houdokuTestingCommandDispatch.parsedArgsValid === true,
    houdokuTestingCommandDispatch.executed === true,
    houdokuTestingCommandDispatch.autopilot !== undefined,
    houdokuNextTestingCommandDispatch.command !== undefined,
    houdokuNextTestingCommandDispatch.execution !== undefined,
    houdokuNextTestingCommandDispatch.execution.allowlisted === true,
    typeof houdokuNextTestingCommandDispatch.execution.executed === 'boolean',
    houdokuNextTestingCommandPreflight.command !== undefined,
    houdokuNextTestingCommandPreflight.preflight.allowlisted === true,
    houdokuNextTestingCommandPreflight.preflight.parsedArgsValid === true,
    Array.isArray(houdokuTestingCommandAuditBundle.entries),
    houdokuTestingCommandAuditBundle.entries.length ===
      houdokuTestingCommandSuggestions.suggestions.length,
    houdokuTestingCommandAuditBundle.entries.every((entry) => entry.preflight !== undefined),
    houdokuTestingCommandAuditBundle.entries.every(
      (entry) => typeof entry.dispatchReady === 'boolean'
    ),
    houdokuNextTestingCommandAuditBundle.command !== undefined,
    houdokuNextTestingCommandAuditBundle.preflight !== undefined,
    typeof houdokuNextTestingCommandAuditBundle.dispatchReady === 'boolean',
    houdokuNextTestingCommandTransaction.beforeAudit !== undefined,
    houdokuNextTestingCommandTransaction.afterAudit !== undefined,
    typeof houdokuNextTestingCommandTransaction.executed === 'boolean',
    houdokuNextTestingCommandTransaction.executed
      ? houdokuNextTestingCommandTransaction.execution !== undefined
      : true,
    houdokuNextTestingCommandTransactions.maxRuns === 3,
    Array.isArray(houdokuNextTestingCommandTransactions.runs),
    houdokuNextTestingCommandTransactions.runs.length > 0,
    houdokuNextTestingCommandTransactions.finalAudit !== undefined,
    typeof houdokuNextTestingCommandTransactions.stopReason === 'string',
    typeof houdokuNextTestingCommandTransactions.converged === 'boolean',
    houdokuTestingCompletionPolicy.policy !== undefined,
    houdokuTestingCompletionPolicy.loop !== undefined,
    houdokuTestingCompletionPolicy.finalControllerModel !== undefined,
    typeof houdokuTestingCompletionPolicy.completed === 'boolean',
    Array.isArray(houdokuTestingCompletionPolicy.reasons),
    Array.isArray(houdokuTestingCompletionPolicy.completedRequiredStepCodes),
    Array.isArray(houdokuTestingCompletionPolicy.missingRequiredStepCodes),
    typeof houdokuTestingCompletionPolicy.stableNextStepRunsObserved === 'number',
    houdokuTestingCompletionPolicy.completedRequiredStepCodes.includes('refresh-entry'),
    houdokuTestingCompletionPolicy.completed === true,
    houdokuTestingCompletionPreset.profile === 'test',
    houdokuTestingCompletionPreset.policy !== undefined,
    typeof houdokuTestingCompletionPreset.maxRuns === 'number',
    Array.isArray(houdokuTestingCompletionPreset.notes),
    houdokuTestingCompletionPresetRun.profile === 'test',
    typeof houdokuTestingCompletionPresetRun.completed === 'boolean',
    houdokuTestingCompletionPresetRun.policy !== undefined,
    typeof houdokuTestingCompletionRecommendation.recommendedProfile === 'string',
    houdokuTestingCompletionRecommendation.recommendedPreset !== undefined,
    Array.isArray(houdokuTestingCompletionRecommendation.reasons),
    houdokuTestingCompletionRecommendation.overrideOptions !== undefined,
    houdokuTestingCompletionRecommendation.signals !== undefined,
    houdokuTestingCompletionRecommendationRun.recommendation !== undefined,
    houdokuTestingCompletionRecommendationRun.result !== undefined,
    typeof houdokuTestingCompletionRecommendationRun.result.completed === 'boolean',
    houdokuTestingAutopilotSession.recommendation !== undefined,
    houdokuTestingAutopilotSession.run !== undefined,
    typeof houdokuTestingAutopilotSession.status === 'string',
    typeof houdokuTestingAutopilotSession.summary === 'string',
    typeof houdokuTestingAutopilotSession.suggestedNextAction === 'string',
    typeof houdokuTestingAutopilotQuickStatus.runtimeStateVersion === 'string',
    typeof houdokuTestingAutopilotQuickStatus.changed === 'boolean',
    houdokuTestingAutopilotQuickStatus.runtimeQuickStatus !== undefined,
    typeof houdokuTestingAutopilotQuickStatus.status === 'string',
    typeof houdokuTestingAutopilotQuickStatus.recommendedProfile === 'string',
    typeof houdokuTestingAutopilotQuickStatus.suggestedNextAction === 'string',
    typeof houdokuTestingAutopilotQuickStatus.reason === 'string',
    typeof houdokuTestingExecutionSummary.runtimeStateVersion === 'string',
    typeof houdokuTestingExecutionSummary.changed === 'boolean',
    typeof houdokuTestingExecutionSummary.status === 'string',
    typeof houdokuTestingExecutionSummary.canStartInteractiveTest === 'boolean',
    typeof houdokuTestingExecutionSummary.dispatchReady === 'boolean',
    typeof houdokuTestingExecutionSummary.suggestedNextAction === 'string',
    typeof houdokuTestingExecutionSummary.reason === 'string',
    houdokuTestingExecutionSummary.autopilotQuickStatus !== undefined,
    houdokuTestingExecutionSummary.completionRecommendation !== undefined,
    houdokuTestingQuickStart.beforeSummary !== undefined,
    houdokuTestingQuickStart.afterSummary !== undefined,
    typeof houdokuTestingQuickStart.ready === 'boolean',
    typeof houdokuTestingQuickStart.suggestedNextAction === 'string',
    typeof houdokuTestingQuickStart.reason === 'string',
    houdokuTestingFunctionalRun.summary !== undefined,
    houdokuTestingFunctionalRun.quickStart !== undefined,
    houdokuTestingFunctionalRun.launchModel !== undefined,
    typeof houdokuTestingFunctionalRun.readyForInteractiveTest === 'boolean',
    typeof houdokuTestingFunctionalRun.suggestedNextAction === 'string',
    typeof houdokuTestingFunctionalRun.reason === 'string',
    houdokuTestingDispatchModel.functionalRun !== undefined,
    typeof houdokuTestingDispatchModel.canStartInteractiveTest === 'boolean',
    typeof houdokuTestingDispatchModel.canDispatchCommand === 'boolean',
    typeof houdokuTestingDispatchModel.suggestedClientAction === 'string',
    typeof houdokuTestingDispatchModel.reason === 'string',
    houdokuCommandDispatch.profile === 'test',
    houdokuCommandDispatch.allowlisted === true,
    houdokuCommandDispatch.parsedArgsValid === true,
    houdokuCommandDispatch.executed === true,
    houdokuCommandDispatch.stepExecution !== undefined,
    houdokuNextCommandDispatch.profile === 'test',
    houdokuNextCommandDispatch.nextStep !== undefined,
    houdokuNextCommandDispatch.execution !== undefined,
    typeof houdokuNextCommandDispatch.execution.executed === 'boolean',
    typeof suggestedAfter.action === 'string',
    Array.isArray(stabilized.steps),
    typeof stabilized.repairsRun === 'number',
    stabilized.finalDigest !== undefined,
    stabilized.finalQuickStatus !== undefined,
    typeof repairResult.operation.appliedCount === 'number',
    typeof repairResult.lastRepair.timestamp === 'string',
  ];

  const failedCheckIndexes = sanityChecks
    .map((value, index) => (value ? undefined : index))
    .filter((index) => index !== undefined);

  if (failedCheckIndexes.length === 0) {
    console.log('SMOKE RESULT: PASS');
    process.exit(0);
  }

  console.error('FAILED CHECK INDEXES:', failedCheckIndexes.join(','));
  console.error('SMOKE RESULT: FAIL');
  process.exit(1);
};

run();
