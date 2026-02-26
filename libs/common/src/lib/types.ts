import { SeriesStatus, LanguageKey } from "./enums";

export type ExtensionMetadata = {
  id: string;
  name: string;
  url: string;
  translatedLanguage: LanguageKey | undefined;
};

export type PageRequesterData = {
  server: string;
  hash: string;
  numPages: number;
  pageFilenames: string[];
};

export type WebviewResponse = {
  text: string;
  url: string;
  title: string;
};

export type SeriesListResponse = {
  seriesList: Series[];
  hasMore: boolean;
};

export type Series = {
  id?: string;
  extensionId: string;
  sourceId: string;
  title: string;
  altTitles: string[];
  description: string;
  authors: string[];
  artists: string[];
  tags: string[];
  status: SeriesStatus;
  originalLanguageKey: LanguageKey;
  numberUnread: number;
  remoteCoverUrl: string;
  trackerKeys?: { [trackerId: string]: string };
  categories?: string[];
  preview?: boolean;
};

export type Chapter = {
  id?: string;
  seriesId?: string;
  sourceId: string;
  title: string;
  chapterNumber: string;
  volumeNumber: string;
  languageKey: LanguageKey;
  groupName: string;
  time: number;
  read: boolean;
};

export type Language = {
  key: LanguageKey;
  name: string;
  flagCode: string;
  iso639_1: string;
};

export type FilterValues = { [id: string]: unknown };

export type ExternalExtension = {
  id: string;
  languageKey: LanguageKey;
};

export type ConvertExternalDataResponse = {
  series: Series | undefined;
  chapters: Chapter[];
  messages?: {
    text: string;
    type: "info" | "warning" | "error";
  }[];
};

export type ApkExtensionInfo = {
  filePath: string;
  fileName: string;
  packageName: string;
  sourceKey: string;
  sourceName: string;
  version: string | undefined;
};

export type ApkSourceMapping = {
  apk: ApkExtensionInfo;
  extensionId: string | undefined;
  extensionName: string | undefined;
  supported: boolean;
};

export type ApkUnneededExtensionReason = 'unsupported-source' | 'not-selected-duplicate';

export type ApkUnneededExtensionCandidate = {
  filePath: string;
  fileName: string;
  packageName: string;
  sourceKey: string;
  version: string | undefined;
  reason: ApkUnneededExtensionReason;
  selectedPackageName: string | undefined;
};

export type ApkUnneededExtensionCleanupStatus =
  | 'dry-run'
  | 'removed'
  | 'skipped-missing-file'
  | 'skipped-outside-directory'
  | 'failed';

export type ApkUnneededExtensionCleanupEntry = {
  candidate: ApkUnneededExtensionCandidate;
  status: ApkUnneededExtensionCleanupStatus;
  error: string | undefined;
};

export type ApkUnneededExtensionCleanupResult = {
  apply: boolean;
  policy: ApkUnneededExtensionCleanupPolicy;
  apkDirectory: string;
  totalCandidates: number;
  removedCount: number;
  skippedCount: number;
  failedCount: number;
  results: ApkUnneededExtensionCleanupEntry[];
  unneededAfter: ApkUnneededExtensionCandidate[];
};

export type ApkUnneededExtensionCleanupPolicy = 'all-unneeded' | 'unsupported-only';

export type ApkUnneededExtensionCleanupOptions = {
  apply?: boolean;
  policy?: ApkUnneededExtensionCleanupPolicy;
};

export type ApkSelectionState = {
  [sourceKey: string]: {
    selectedPackageName: string;
    extensionId: string | undefined;
  };
};

export type ApkSelectionCleanupEntry = {
  sourceKey: string;
  selectedPackageName: string;
};

export type ApkSelectionCleanupResult = {
  removed: ApkSelectionCleanupEntry[];
  selectionState: ApkSelectionState;
};

export type ApkSelectionReason = 'newest-supported' | 'persisted-selection' | 'env-override';

export type ApkSelectionRecommendation = {
  sourceKey: string;
  selectedPackageName: string;
  selectedVersion: string | undefined;
  reason: ApkSelectionReason;
};

export type ApkActiveMapping = {
  sourceKey: string;
  selectedPackageName: string;
  extensionId: string;
  extensionName: string;
  filePath: string;
  version: string | undefined;
};

export type ApkRuntimeConfig = {
  apkExtensionsDirectory?: string;
  apkOnlyMode?: boolean;
  adapterRequiredMode?: boolean;
  lastRepair?: ApkLastRepairMetadata;
};

export type ApkLastRepairMetadata = {
  timestamp: string;
  appliedCount: number;
  skippedCount: number;
};

export type ApkRuntimeMessage = {
  type: 'info' | 'warning' | 'error';
  code: string;
  text: string;
};

export type ApkRuntimeDiagnostic = {
  type: 'info' | 'warning' | 'error';
  code: string;
  fileName: string;
  packageName: string;
  sourceKey: string;
  text: string;
};

export type ApkRuntimeHealthSummary = {
  totalApkFiles: number;
  totalSourceGroups: number;
  totalSupportedMappings: number;
  totalUnsupportedMappings: number;
  totalActiveMappings: number;
  totalAdapterReadyActiveMappings: number;
  warningCount: number;
  errorCount: number;
  hasBlockingErrors: boolean;
  blockingCodes: string[];
};

export type ApkRuntimeActionHintCode =
  | 'open-apk-directory-settings'
  | 'add-apk-files'
  | 'review-unsupported-apks'
  | 'review-source-selection'
  | 'select-supported-apk'
  | 'disable-apk-only-mode'
  | 'disable-adapter-required-mode'
  | 'select-adapter-supported-apk'
  | 'repair-applied'
  | 'repair-noop';

export type ApkRuntimeActionHint = {
  code: ApkRuntimeActionHintCode;
  type: 'info' | 'warning' | 'error';
  text: string;
};

export type ApkSourceOption = {
  fileName: string;
  packageName: string;
  version: string | undefined;
  sourceName: string;
  supported: boolean;
  extensionId: string | undefined;
  extensionName: string | undefined;
  hasAdapterProfile: boolean;
  isSelected: boolean;
  isActive: boolean;
};

export type ApkSourceGroup = {
  sourceKey: string;
  sourceName: string;
  extensionId: string | undefined;
  extensionName: string | undefined;
  selectedPackageName: string | undefined;
  options: ApkSourceOption[];
};

export type ApkSourceReadinessStatus =
  | 'ready'
  | 'no-selection'
  | 'selected-not-active'
  | 'unsupported-only'
  | 'adapter-required-missing-adapter';

export type ApkSourceReadinessSummary = {
  sourceKey: string;
  sourceName: string;
  status: ApkSourceReadinessStatus;
  selectedPackageName: string | undefined;
  optionCount: number;
  hasSupportedOption: boolean;
  hasActiveSelection: boolean;
  hasAdapterReadyOption: boolean;
};

export type ApkPreferredSelectionReason =
  | 'selected-still-valid'
  | 'newest-supported'
  | 'adapter-required-supported'
  | 'none-eligible';

export type ApkPreferredSelectionCandidate = {
  sourceKey: string;
  sourceName: string;
  suggestedPackageName: string | undefined;
  suggestedVersion: string | undefined;
  reason: ApkPreferredSelectionReason;
};

export type ApkPreferredSelectionOperationStatus =
  | 'applied'
  | 'skipped-no-source'
  | 'skipped-no-candidate'
  | 'skipped-invalid-candidate'
  | 'skipped-already-selected';

export type ApkPreferredSelectionOperationResult = {
  sourceKey: string;
  status: ApkPreferredSelectionOperationStatus;
  previousPackageName: string | undefined;
  selectedPackageName: string | undefined;
};

export type ApkPreferredSelectionBulkOperationResult = {
  selectionState: ApkSelectionState;
  appliedCount: number;
  skippedCount: number;
  results: ApkPreferredSelectionOperationResult[];
};

export type ApkMigrationStatus = 'adapter-ready' | 'mapped' | 'unmapped';

export type ApkMigrationEntry = {
  extensionId: string;
  extensionName: string;
  sourceKey: string;
  status: ApkMigrationStatus;
  availableApkCount: number;
  selectedPackageName: string | undefined;
  selectedVersion: string | undefined;
  hasSupportedMapping: boolean;
  hasActiveAdapter: boolean;
  hasAnyApkForSourceKey: boolean;
};

export type ApkMigrationReport = {
  summary: {
    total: number;
    adapterReady: number;
    mapped: number;
    unmapped: number;
  };
  entries: ApkMigrationEntry[];
};

export type ApkRuntimeState = {
  runtimeStateVersion: string;
  runtimeConfig: ApkRuntimeConfig;
  adapterSupportedSourceKeys: string[];
  healthSummary: ApkRuntimeHealthSummary;
  actionHints: ApkRuntimeActionHint[];
  apkExtensionsDirectory: string;
  apkExtensions: ApkExtensionInfo[];
  sourceMappings: ApkSourceMapping[];
  sourceGroups: ApkSourceGroup[];
  sourceReadinessSummaries: ApkSourceReadinessSummary[];
  preferredSelectionCandidates: ApkPreferredSelectionCandidate[];
  selectionState: ApkSelectionState;
  selectionRecommendations: ApkSelectionRecommendation[];
  activeMappings: ApkActiveMapping[];
  messages: ApkRuntimeMessage[];
  diagnostics: ApkRuntimeDiagnostic[];
};

export type ApkRuntimeRepairResult = {
  lastRepair: ApkLastRepairMetadata;
  operation: ApkPreferredSelectionBulkOperationResult;
  runtimeState: ApkRuntimeState;
};

export type ApkRuntimeDigest = {
  runtimeStateVersion: string;
  healthSummary: ApkRuntimeHealthSummary;
  lastRepair: ApkLastRepairMetadata | undefined;
};

export type ApkRuntimePollingDecision = {
  changed: boolean;
  digest: ApkRuntimeDigest;
};

export type ApkRuntimeQuickStatus = {
  changed: boolean;
  hasBlockingErrors: boolean;
  shouldAutoRepair: boolean;
  appliedCount: number;
  skippedCount: number;
  runtimePollIntervalHintMs: number;
  suggestedNextAction: ApkRuntimeQuickStatusNextAction;
};

export type ApkRuntimeQuickStatusNextAction = 'none' | 'fetch-runtime-state' | 'run-repair';

export type ApkRuntimeBootstrapResult = {
  quickStatus: ApkRuntimeQuickStatus;
  digest: ApkRuntimeDigest;
  runtimeState: ApkRuntimeState | undefined;
};

export type ApkDirectoryStatus = {
  defaultDirectory: string;
  currentDirectory: string;
  isUsingDefaultDirectory: boolean;
  directoryExists: boolean;
  apkCount: number;
};

export type ApkDefaultDirectoryEnforceResult = {
  runtimeConfig: ApkRuntimeConfig;
  directoryStatus: ApkDirectoryStatus;
};

export type ApkRuntimeSuggestedActionResult = {
  action: ApkRuntimeQuickStatusNextAction;
  performed: boolean;
  quickStatus: ApkRuntimeQuickStatus;
  digest: ApkRuntimeDigest;
  runtimeState: ApkRuntimeState | undefined;
  repairResult: ApkRuntimeRepairResult | undefined;
};

export type ApkRuntimeStabilizeStep = {
  action: ApkRuntimeQuickStatusNextAction;
  performed: boolean;
  runtimeStateVersion: string;
  hasBlockingErrors: boolean;
};

export type ApkRuntimeStabilizeResult = {
  steps: ApkRuntimeStabilizeStep[];
  repairsRun: number;
  finalQuickStatus: ApkRuntimeQuickStatus;
  finalDigest: ApkRuntimeDigest;
  finalRuntimeState: ApkRuntimeState | undefined;
};

export type ApkUiModel = {
  directoryStatus: ApkDirectoryStatus;
  bootstrap: ApkRuntimeBootstrapResult;
  migrationReport: ApkMigrationReport;
};

export type ApkRuntimeStartupPreparationResult = {
  directoryStatus: ApkDirectoryStatus;
  runtimeConfig: ApkRuntimeConfig;
  cleanupResult: ApkSelectionCleanupResult;
  autoSelectResult: ApkPreferredSelectionBulkOperationResult;
  runtimeState: ApkRuntimeState;
};

export type ApkHoudokuReadyLevel = 'ready' | 'warning' | 'blocked';

export type ApkHoudokuReadyStatus = {
  level: ApkHoudokuReadyLevel;
  isReady: boolean;
  runtimeStateVersion: string;
  directoryStatus: ApkDirectoryStatus;
  activeMappingCount: number;
  unsupportedApkCount: number;
  unneededApkCount: number;
  blockingCodes: string[];
  warningCodes: string[];
  suggestedNextAction: ApkRuntimeQuickStatusNextAction;
};

export type ApkRuntimeMaintenanceCycleOptions = {
  applyUnneededCleanup?: boolean;
  unneededCleanupPolicy?: ApkUnneededExtensionCleanupPolicy;
  stabilizeMaxSteps?: number;
};

export type ApkRuntimeMaintenanceCycleResult = {
  options: {
    applyUnneededCleanup: boolean;
    unneededCleanupPolicy: ApkUnneededExtensionCleanupPolicy;
    stabilizeMaxSteps: number;
  };
  startupPreparation: ApkRuntimeStartupPreparationResult;
  unneededCleanup: ApkUnneededExtensionCleanupResult;
  stabilization: ApkRuntimeStabilizeResult;
  readyStatus: ApkHoudokuReadyStatus;
};

export type ApkRuntimeStrictStartupGateOptions = {
  maintenanceOptions?: ApkRuntimeMaintenanceCycleOptions;
  requireReadyLevel?: ApkHoudokuReadyLevel;
  requireNoUnsupportedApks?: boolean;
  requireNoUnneededApks?: boolean;
};

export type ApkRuntimeStrictStartupGateResult = {
  options: {
    requireReadyLevel: ApkHoudokuReadyLevel;
    requireNoUnsupportedApks: boolean;
    requireNoUnneededApks: boolean;
  };
  maintenanceCycle: ApkRuntimeMaintenanceCycleResult;
  readyStatus: ApkHoudokuReadyStatus;
  passed: boolean;
  reasons: string[];
};

export type ApkRuntimeStrictStartupProfile = 'dev' | 'test' | 'prod';

export type ApkRuntimeStrictStartupGateRecommendation = {
  profile: ApkRuntimeStrictStartupProfile;
  options: ApkRuntimeStrictStartupGateOptions;
  notes: string[];
};

export type ApkStartupRemediationMethod =
  | 'setApkExtensionsDirectory'
  | 'refreshApkRuntimeState'
  | 'cleanupUnneededApkExtensions'
  | 'autoSelectAllPreferredApksWithResult'
  | 'setApkOnlyMode'
  | 'setAdapterRequiredMode'
  | 'runApkRuntimeMaintenanceCycle'
  | 'runApkRuntimeStrictStartupGate';

export type ApkStartupRemediationStep = {
  code: string;
  type: 'info' | 'warning' | 'error';
  text: string;
  method: ApkStartupRemediationMethod;
  autoRunnable: boolean;
};

export type ApkStartupRemediationPlan = {
  profile: ApkRuntimeStrictStartupProfile;
  recommendation: ApkRuntimeStrictStartupGateRecommendation;
  strictGate: ApkRuntimeStrictStartupGateResult;
  steps: ApkStartupRemediationStep[];
};

export type ApkStartupRemediationStepRunResult = {
  code: string;
  method: ApkStartupRemediationMethod;
  attempted: boolean;
  performed: boolean;
  note: string;
};

export type ApkStartupRemediationRunResult = {
  profile: ApkRuntimeStrictStartupProfile;
  plan: ApkStartupRemediationPlan;
  usedOverrides: ApkRuntimeStrictStartupGateOptions | undefined;
  beforeGate: ApkRuntimeStrictStartupGateResult;
  afterGate: ApkRuntimeStrictStartupGateResult;
  improved: boolean;
  stepResults: ApkStartupRemediationStepRunResult[];
};

export type ApkStartupRemediationOverrides = ApkRuntimeStrictStartupGateOptions;

export type ApkStartupRemediationUntilStableOptions = {
  profile?: ApkRuntimeStrictStartupProfile;
  overrides?: ApkStartupRemediationOverrides;
  maxRuns?: number;
};

export type ApkStartupRemediationUntilStableStopReason =
  | 'passed'
  | 'no-improvement'
  | 'max-runs';

export type ApkStartupRemediationUntilStableResult = {
  profile: ApkRuntimeStrictStartupProfile;
  maxRuns: number;
  runs: ApkStartupRemediationRunResult[];
  finalRun: ApkStartupRemediationRunResult;
  stopReason: ApkStartupRemediationUntilStableStopReason;
  converged: boolean;
};
