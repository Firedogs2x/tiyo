import {
  ApkActiveMapping,
  ApkDefaultDirectoryEnforceResult,
  ApkDirectoryStatus,
  ApkExtensionInfo,
  ApkLastRepairMetadata,
  ApkSourceGroup,
  ApkSourceOption,
  ExtensionClientInterface,
  ExtensionMetadata,
  ApkMigrationEntry,
  ApkMigrationReport,
  ApkPreferredSelectionBulkOperationResult,
  ApkPreferredSelectionCandidate,
  ApkPreferredSelectionOperationResult,
  ApkPreferredSelectionReason,
  ApkRuntimeActionHint,
  ApkRuntimeBootstrapResult,
  ApkRuntimeActionHintCode,
  ApkRuntimeConfig,
  ApkRuntimeDigest,
  ApkRuntimeDiagnostic,
  ApkRuntimeHealthSummary,
  ApkHoudokuReadyStatus,
  ApkRuntimeMaintenanceCycleOptions,
  ApkRuntimeMaintenanceCycleResult,
  ApkRuntimeStrictStartupGateRecommendation,
  ApkRuntimeStrictStartupProfile,
  ApkRuntimeStrictStartupGateOptions,
  ApkRuntimeStrictStartupGateResult,
  ApkStartupRemediationPlan,
  ApkStartupRemediationOverrides,
  ApkStartupRemediationRunResult,
  ApkStartupRemediationStep,
  ApkStartupRemediationStepRunResult,
  ApkStartupRemediationUntilStableOptions,
  ApkStartupRemediationUntilStableResult,
  ApkStartupRemediationUntilStableStopReason,
  ApkRuntimeMessage,
  ApkRuntimePollingDecision,
  ApkRuntimeQuickStatus,
  ApkRuntimeRepairResult,
  ApkRuntimeStartupPreparationResult,
  ApkRuntimeStabilizeResult,
  ApkRuntimeStabilizeStep,
  ApkRuntimeSuggestedActionResult,
  ApkUiModel,
  ApkRuntimeState,
  ApkSelectionCleanupResult,
  ApkSelectionReason,
  ApkSelectionRecommendation,
  ApkSelectionState,
  ApkSourceReadinessStatus,
  ApkSourceReadinessSummary,
  ApkSourceMapping,
  ApkUnneededExtensionCleanupOptions,
  ApkUnneededExtensionCleanupPolicy,
  ApkUnneededExtensionCleanupEntry,
  ApkUnneededExtensionCleanupResult,
  ApkUnneededExtensionCandidate,
  TiyoClientAbstract,
  WebviewFunc,
} from '@tiyo/common';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import * as anatanomotokare from './extensions/anatanomotokare';
import * as arcrelight from './extensions/arcrelight';
import * as assortedscans from './extensions/assortedscans';
import * as comick from './extensions/comick';
import * as deathtollscans from './extensions/deathtollscans';
import * as disasterscans from './extensions/disasterscans';
import * as guya from './extensions/guya';
import * as hniscantrad from './extensions/hniscantrad';
import * as immortalupdates from './extensions/immortalupdates';
import * as isekaiscan from './extensions/isekaiscan';
import * as kireicake from './extensions/kireicake';
import * as komga from './extensions/komga';
import * as komikcast from './extensions/komikcast';
import * as kouhaiwork from './extensions/kouhaiwork';
import * as lecercleduscan from './extensions/lecercleduscan';
import * as leviatanscans from './extensions/leviatanscans';
import * as lilyreader from './extensions/lilyreader';
import * as lupiteam from './extensions/lupiteam';
import * as manga347 from './extensions/manga347';
import * as mangabat from './extensions/mangabat';
import * as mangadex from './extensions/mangadex';
import * as mangakakalot from './extensions/mangakakalot';
import * as mangakatana from './extensions/mangakatana';
import * as mangakik from './extensions/mangakik';
import * as mangalife from './extensions/mangalife';
import * as manganato from './extensions/manganato';
import * as mangapill from './extensions/mangapill';
import * as mangasee from './extensions/mangasee';
import * as mangatellers from './extensions/mangatellers';
import * as menudofansub from './extensions/menudofansub';
import * as nana from './extensions/nana';
import * as nhentai from './extensions/nhentai';
import * as nifteam from './extensions/nifteam';
import * as phoenixscans from './extensions/phoenixscans';
import * as readcomiconline from './extensions/readcomiconline';
import * as sensescans from './extensions/sensescans';
import * as silentsky from './extensions/silentsky';
import * as sleepingknightscans from './extensions/sleepingknightscans';
import * as tcbscans from './extensions/tcb-scans';
import * as toonily from './extensions/toonily';
import * as tortugaceviri from './extensions/tortugaceviri';
import * as tritiniascans from './extensions/tritiniascans';
import * as tuttoanimemanga from './extensions/tuttoanimemanga';
import * as yuriism from './extensions/yuriism';
import * as zandynofansub from './extensions/zandynofansub';
import { BrowserWindow } from 'electron';
import { loadInWebView } from './util/webview';
import packageJson from '../package.json';
import {
  ensureApkExtensionsDirectory,
  getApkExtensionInfoList,
  getDefaultApkConfigFilePath,
  getDefaultApkExtensionsDirectory,
  getDefaultApkSelectionFilePath,
  readApkRuntimeConfig,
  readApkSelectionState,
  writeApkRuntimeConfig,
  writeApkSelectionState,
} from './external/apk';
import {
  getApkAdapterProfile,
  getSupportedApkAdapterSourceKeys,
  hasApkAdapterProfile,
} from './external/apk-adapters';
import {
  buildSourceKeyToExtensionInfo,
  toCanonicalSourceKey,
} from './external/apk-source-keys';

export class TiyoClient extends TiyoClientAbstract {
  private _apkExtensionsCache: ApkExtensionInfo[] | undefined;
  private _apkSelectionStateCache: ApkSelectionState | undefined;
  private _apkRuntimeConfigCache: ApkRuntimeConfig | undefined;

  constructor(spoofWindow: BrowserWindow) {
    super(spoofWindow);
  }

  _webviewFn: WebviewFunc = (url, options) => loadInWebView(this.spoofWindow, url, options);

  // @ts-expect-error version is added to packageJson after build
  override getVersion = () => packageJson.version || '0.0.0';

  override getDefaultApkExtensionsDirectoryPath = (): string => {
    return ensureApkExtensionsDirectory(getDefaultApkExtensionsDirectory());
  };

  override useDefaultApkExtensionsDirectory = (): ApkRuntimeConfig => {
    const currentConfig = this._getPersistedRuntimeConfig();
    const nextConfig: ApkRuntimeConfig = {
      ...currentConfig,
      apkExtensionsDirectory: this.getDefaultApkExtensionsDirectoryPath(),
    };

    this._writeRuntimeConfig(nextConfig);
    this.refreshApkExtensions();
    return this.getApkRuntimeConfig();
  };

  override getApkDirectoryStatus = (): ApkDirectoryStatus => {
    const defaultDirectory = this.getDefaultApkExtensionsDirectoryPath();
    const currentDirectory = this.getApkExtensionsDirectory();

    return {
      defaultDirectory,
      currentDirectory,
      isUsingDefaultDirectory: currentDirectory === defaultDirectory,
      directoryExists: fs.existsSync(currentDirectory),
      apkCount: this.getApkExtensions().length,
    };
  };

  override enforceDefaultApkDirectory = (): ApkDefaultDirectoryEnforceResult => {
    const runtimeConfig = this.useDefaultApkExtensionsDirectory();
    return {
      runtimeConfig,
      directoryStatus: this.getApkDirectoryStatus(),
    };
  };

  override getApkExtensionsDirectory = () => {
    const configuredDirectory = process.env['TIYO_APK_EXTENSIONS_DIR'];
    if (configuredDirectory !== undefined && configuredDirectory.length > 0) {
      return ensureApkExtensionsDirectory(configuredDirectory);
    }

    const persistedDirectory = this.getApkRuntimeConfig().apkExtensionsDirectory;
    if (persistedDirectory !== undefined && persistedDirectory.length > 0) {
      return ensureApkExtensionsDirectory(persistedDirectory);
    }

    return ensureApkExtensionsDirectory(getDefaultApkExtensionsDirectory());
  };

  private _getApkConfigFilePath = () => {
    const configuredFilePath = process.env['TIYO_APK_CONFIG_FILE'];
    if (configuredFilePath !== undefined && configuredFilePath.length > 0) {
      return configuredFilePath;
    }

    return getDefaultApkConfigFilePath();
  };

  private _getPersistedRuntimeConfig = (): ApkRuntimeConfig => {
    if (this._apkRuntimeConfigCache === undefined) {
      this._apkRuntimeConfigCache = readApkRuntimeConfig(this._getApkConfigFilePath());
    }

    return this._apkRuntimeConfigCache;
  };

  private _setPersistedRuntimeConfig = (config: ApkRuntimeConfig) => {
    this._apkRuntimeConfigCache = config;
    writeApkRuntimeConfig(config, this._getApkConfigFilePath());
  };

  private _writeRuntimeConfig = (nextConfig: ApkRuntimeConfig) => {
    if (
      nextConfig.apkExtensionsDirectory === undefined &&
      nextConfig.apkOnlyMode === undefined &&
      nextConfig.adapterRequiredMode === undefined &&
      nextConfig.lastRepair === undefined
    ) {
      this._setPersistedRuntimeConfig({});
      return;
    }

    this._setPersistedRuntimeConfig(nextConfig);
  };

  override getApkRuntimeConfig = () => {
    return this._getPersistedRuntimeConfig();
  };

  override getLastApkRepairMetadata = (): ApkLastRepairMetadata | undefined => {
    return this.getApkRuntimeConfig().lastRepair;
  };

  override setApkExtensionsDirectory = (directory: string) => {
    const normalizedDirectory = directory.trim();
    const currentConfig = this._getPersistedRuntimeConfig();
    const nextConfig: ApkRuntimeConfig =
      normalizedDirectory.length > 0
        ? { ...currentConfig, apkExtensionsDirectory: normalizedDirectory }
        : { ...currentConfig, apkExtensionsDirectory: undefined };

    this._writeRuntimeConfig(nextConfig);

    this.refreshApkExtensions();
    return this.getApkRuntimeConfig();
  };

  override clearApkExtensionsDirectory = () => {
    const currentConfig = this._getPersistedRuntimeConfig();
    const nextConfig: ApkRuntimeConfig = {
      ...currentConfig,
      apkExtensionsDirectory: undefined,
    };

    this._writeRuntimeConfig(nextConfig);

    this.refreshApkExtensions();
    return this.getApkRuntimeConfig();
  };

  override setApkOnlyMode = (enabled: boolean) => {
    const currentConfig = this._getPersistedRuntimeConfig();
    const nextConfig: ApkRuntimeConfig = {
      ...currentConfig,
      apkOnlyMode: enabled,
    };
    this._writeRuntimeConfig(nextConfig);
    return this.getApkRuntimeConfig();
  };

  override setAdapterRequiredMode = (enabled: boolean) => {
    const currentConfig = this._getPersistedRuntimeConfig();
    const nextConfig: ApkRuntimeConfig = {
      ...currentConfig,
      adapterRequiredMode: enabled,
    };
    this._writeRuntimeConfig(nextConfig);
    return this.getApkRuntimeConfig();
  };

  private _getBuiltInMetadataList = () => {
    return [
      anatanomotokare.METADATA,
      arcrelight.METADATA,
      assortedscans.METADATA,
      comick.METADATA,
      deathtollscans.METADATA,
      disasterscans.METADATA,
      guya.METADATA,
      hniscantrad.METADATA,
      immortalupdates.METADATA,
      isekaiscan.METADATA,
      kireicake.METADATA,
      komga.METADATA,
      komikcast.METADATA,
      kouhaiwork.METADATA,
      lecercleduscan.METADATA,
      leviatanscans.METADATA,
      lilyreader.METADATA,
      lupiteam.METADATA,
      manga347.METADATA,
      mangabat.METADATA,
      mangadex.METADATA,
      mangakakalot.METADATA,
      mangakatana.METADATA,
      mangakik.METADATA,
      mangalife.METADATA,
      manganato.METADATA,
      mangapill.METADATA,
      mangasee.METADATA,
      mangatellers.METADATA,
      menudofansub.METADATA,
      nana.METADATA,
      nhentai.METADATA,
      nifteam.METADATA,
      phoenixscans.METADATA,
      readcomiconline.METADATA,
      sensescans.METADATA,
      silentsky.METADATA,
      sleepingknightscans.METADATA,
      tcbscans.METADATA,
      toonily.METADATA,
      tortugaceviri.METADATA,
      tritiniascans.METADATA,
      tuttoanimemanga.METADATA,
      yuriism.METADATA,
      zandynofansub.METADATA,
    ];
  };

  override getApkMigrationReport = (): ApkMigrationReport => {
    const sourceGroups = this.getApkSourceGroups();
    const activeMappings = this.getActiveApkMappings();

    const entries: ApkMigrationEntry[] = this._getBuiltInMetadataList()
      .map((metadata) => {
        const sourceKey = toCanonicalSourceKey(metadata.name);

        const sourceGroup = sourceGroups.find((group) => group.sourceKey === sourceKey);
        const hasSupportedMapping =
          sourceGroup !== undefined &&
          sourceGroup.extensionId === metadata.id &&
          sourceGroup.options.some((option) => option.supported);

        const hasAnyApkForSourceKey = sourceGroup !== undefined && sourceGroup.options.length > 0;
        const selectedOption = sourceGroup?.options.find((option) => option.isSelected);

        const hasActiveAdapter = activeMappings.some(
          (mapping) => mapping.extensionId === metadata.id && hasApkAdapterProfile(mapping.sourceKey)
        );

        const status = hasActiveAdapter
          ? 'adapter-ready'
          : hasSupportedMapping
            ? 'mapped'
            : 'unmapped';

        return {
          extensionId: metadata.id,
          extensionName: metadata.name,
          sourceKey,
          status,
          availableApkCount: sourceGroup?.options.length || 0,
          selectedPackageName: selectedOption?.packageName,
          selectedVersion: selectedOption?.version,
          hasSupportedMapping,
          hasActiveAdapter,
          hasAnyApkForSourceKey,
        } as ApkMigrationEntry;
      })
      .sort((left, right) => left.extensionName.localeCompare(right.extensionName));

    const summary = entries.reduce(
      (acc, entry) => {
        acc.total += 1;
        if (entry.status === 'adapter-ready') {
          acc.adapterReady += 1;
        } else if (entry.status === 'mapped') {
          acc.mapped += 1;
        } else {
          acc.unmapped += 1;
        }
        return acc;
      },
      {
        total: 0,
        adapterReady: 0,
        mapped: 0,
        unmapped: 0,
      }
    );

    return {
      summary,
      entries,
    };
  };

  private _getAdapterEligibleMappings = (activeMappings: ApkActiveMapping[]) => {
    return activeMappings.filter((mapping) => hasApkAdapterProfile(mapping.sourceKey));
  };

  private _getApkDirectoryValidationResult = (apkExtensionsDirectory: string) => {
    if (!fs.existsSync(apkExtensionsDirectory)) {
      return {
        canContinue: false,
        messages: [
          {
            type: 'warning' as const,
            code: 'APK_DIR_MISSING',
            text: `APK directory does not exist: ${apkExtensionsDirectory}`,
          },
        ],
      };
    }

    const stat = fs.statSync(apkExtensionsDirectory);
    if (!stat.isDirectory()) {
      return {
        canContinue: false,
        messages: [
          {
            type: 'error' as const,
            code: 'APK_DIR_INVALID',
            text: `Configured APK path is not a directory: ${apkExtensionsDirectory}`,
          },
        ],
      };
    }

    return {
      canContinue: true,
      messages: [] as ApkRuntimeMessage[],
    };
  };

  private _appendUnsupportedPresenceMessage = (
    messages: ApkRuntimeMessage[],
    sourceMappings: ApkSourceMapping[]
  ) => {
    const unsupportedCount = sourceMappings.filter((entry) => !entry.supported).length;
    if (unsupportedCount > 0) {
      messages.push({
        type: 'warning',
        code: 'APK_UNSUPPORTED_PRESENT',
        text: `${unsupportedCount} APK file(s) are detected but not mapped to a supported source yet.`,
      });
    }
  };

  private _appendSelectionUnresolvedMessages = (
    messages: ApkRuntimeMessage[],
    selectionState: ApkSelectionState,
    activeMappings: ApkActiveMapping[]
  ) => {
    Object.entries(selectionState).forEach(([sourceKey, selection]) => {
      const isActive = activeMappings.some(
        (entry) =>
          entry.sourceKey === sourceKey && entry.selectedPackageName === selection.selectedPackageName
      );
      if (!isActive) {
        messages.push({
          type: 'warning',
          code: 'APK_SELECTION_UNRESOLVED',
          text: `Selection for source '${sourceKey}' could not be resolved to an active mapping.`,
        });
      }
    });
  };

  private _appendModeConstraintMessages = (
    messages: ApkRuntimeMessage[],
    activeMappings: ApkActiveMapping[],
    runtimeConfig: ApkRuntimeConfig
  ) => {
    if (activeMappings.length === 0) {
      messages.push({
        type: 'warning',
        code: 'APK_NO_ACTIVE_MAPPING',
        text: 'No active APK-to-source mapping is currently applied.',
      });
    }

    if (runtimeConfig.apkOnlyMode === true && activeMappings.length === 0) {
      messages.push({
        type: 'error',
        code: 'APK_ONLY_MODE_EMPTY',
        text: 'APK-only mode is enabled, but no active APK mappings are available.',
      });
    }

    if (runtimeConfig.adapterRequiredMode === true) {
      const adapterEligibleMappings = this._getAdapterEligibleMappings(activeMappings);
      if (adapterEligibleMappings.length === 0) {
        messages.push({
          type: 'error',
          code: 'APK_ADAPTER_REQUIRED_EMPTY',
          text: 'Adapter-required mode is enabled, but no active APK mappings have adapter profiles.',
        });
      }
    }
  };

  private _getApkRuntimeMessages = (
    apkExtensionsDirectory: string,
    sourceMappings: ApkSourceMapping[],
    selectionState: ApkSelectionState,
    activeMappings: ApkActiveMapping[],
    runtimeConfig: ApkRuntimeConfig
  ): ApkRuntimeMessage[] => {
    const validationResult = this._getApkDirectoryValidationResult(apkExtensionsDirectory);
    if (!validationResult.canContinue) {
      return validationResult.messages;
    }

    const messages: ApkRuntimeMessage[] = [...validationResult.messages];

    if (sourceMappings.length === 0) {
      messages.push({
        type: 'info',
        code: 'APK_NONE_FOUND',
        text: 'No APK files found in the configured directory.',
      });
      return messages;
    }

    this._appendUnsupportedPresenceMessage(messages, sourceMappings);
    this._appendSelectionUnresolvedMessages(messages, selectionState, activeMappings);
    this._appendModeConstraintMessages(messages, activeMappings, runtimeConfig);

    return messages;
  };

  private _pushUnsupportedSourceDiagnostics = (
    diagnostics: ApkRuntimeDiagnostic[],
    sourceMappings: ApkSourceMapping[]
  ) => {
    sourceMappings
      .filter((entry) => !entry.supported)
      .forEach((entry) => {
        diagnostics.push({
          type: 'warning',
          code: 'APK_SOURCE_UNSUPPORTED',
          fileName: entry.apk.fileName,
          packageName: entry.apk.packageName,
          sourceKey: entry.apk.sourceKey,
          text: `Source key '${entry.apk.sourceKey}' is not mapped to a supported extension yet.`,
        });
      });
  };

  private _groupMappingsByPackageName = (sourceMappings: ApkSourceMapping[]) => {
    return sourceMappings.reduce((acc, entry) => {
      if (acc[entry.apk.packageName] === undefined) {
        acc[entry.apk.packageName] = [];
      }
      acc[entry.apk.packageName].push(entry);
      return acc;
    }, {} as { [packageName: string]: ApkSourceMapping[] });
  };

  private _groupMappingsBySourceVersion = (sourceMappings: ApkSourceMapping[]) => {
    return sourceMappings.reduce((acc, entry) => {
      const versionKey = entry.apk.version || 'unknown';
      const key = `${entry.apk.sourceKey}::${versionKey}`;
      if (acc[key] === undefined) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    }, {} as { [key: string]: ApkSourceMapping[] });
  };

  private _toSelectionReason = (
    source: 'default' | 'persisted' | 'env'
  ): ApkSelectionReason => {
    if (source === 'env') {
      return 'env-override';
    }

    if (source === 'persisted') {
      return 'persisted-selection';
    }

    return 'newest-supported';
  };

  private _toSourceKey = (value: string): string => {
    return toCanonicalSourceKey(value);
  };

  private _buildMappingsByCanonicalSourceKey = (sourceMappings: ApkSourceMapping[]) => {
    return sourceMappings.reduce((acc, mapping) => {
      const sourceKey = this._toSourceKey(mapping.apk.sourceKey);
      if (acc[sourceKey] === undefined) {
        acc[sourceKey] = [];
      }
      acc[sourceKey].push(mapping);
      return acc;
    }, {} as { [sourceKey: string]: ApkSourceMapping[] });
  };

  private _buildSourceOption = (
    sourceKey: string,
    mapping: ApkSourceMapping,
    selectedPackageName: string | undefined,
    activeMappings: ApkActiveMapping[]
  ): ApkSourceOption => {
    const isSelected = selectedPackageName === mapping.apk.packageName;
    const isActive = activeMappings.some(
      (entry) =>
        entry.sourceKey === sourceKey && entry.selectedPackageName === mapping.apk.packageName
    );

    return {
      fileName: mapping.apk.fileName,
      packageName: mapping.apk.packageName,
      version: mapping.apk.version,
      sourceName: mapping.apk.sourceName,
      supported: mapping.supported,
      extensionId: mapping.extensionId,
      extensionName: mapping.extensionName,
      hasAdapterProfile: hasApkAdapterProfile(mapping.apk.sourceKey),
      isSelected,
      isActive,
    };
  };

  private _sortSourceOptions = (options: ApkSourceOption[]): ApkSourceOption[] => {
    return [...options].sort((left, right) => {
      if (left.isSelected !== right.isSelected) {
        return left.isSelected ? -1 : 1;
      }

      const versionCompare = this._compareVersionDesc(left.version, right.version);
      if (versionCompare !== 0) {
        return versionCompare;
      }

      return left.fileName.localeCompare(right.fileName);
    });
  };

  private _buildSourceGroup = (
    sourceKey: string,
    mappings: ApkSourceMapping[],
    selectionState: ApkSelectionState,
    activeMappings: ApkActiveMapping[]
  ): ApkSourceGroup => {
    const selectedPackageName = selectionState[this._toSourceKey(sourceKey)]?.selectedPackageName;
    const firstMapping = mappings[0];
    const groupExtensionName = firstMapping?.extensionName;
    const groupSourceName = groupExtensionName || firstMapping?.apk.sourceName || sourceKey;
    const options = mappings.map((mapping) =>
      this._buildSourceOption(sourceKey, mapping, selectedPackageName, activeMappings)
    );

    return {
      sourceKey,
      sourceName: groupSourceName,
      extensionId: firstMapping?.extensionId,
      extensionName: groupExtensionName,
      selectedPackageName,
      options: this._sortSourceOptions(options),
    };
  };

  private _buildApkSourceGroups = (
    sourceMappings: ApkSourceMapping[],
    selectionState: ApkSelectionState,
    activeMappings: ApkActiveMapping[]
  ): ApkSourceGroup[] => {
    return Object.entries(this._buildMappingsByCanonicalSourceKey(sourceMappings))
      .map(([sourceKey, mappings]) =>
        this._buildSourceGroup(sourceKey, mappings, selectionState, activeMappings)
      )
      .sort((left, right) => left.sourceName.localeCompare(right.sourceName));
  };

  private _getSourceReadinessStatus = (
    sourceGroup: ApkSourceGroup,
    runtimeConfig: ApkRuntimeConfig
  ): ApkSourceReadinessStatus => {
    const selectedOption = sourceGroup.options.find((option) => option.isSelected);
    const hasSupportedOption = sourceGroup.options.some((option) => option.supported);
    const hasActiveSelection = sourceGroup.options.some((option) => option.isActive);

    if (!hasSupportedOption) {
      return 'unsupported-only';
    }

    if (selectedOption === undefined) {
      return 'no-selection';
    }

    if (!hasActiveSelection) {
      return 'selected-not-active';
    }

    if (runtimeConfig.adapterRequiredMode === true && !selectedOption.hasAdapterProfile) {
      return 'adapter-required-missing-adapter';
    }

    return 'ready';
  };

  private _buildApkSourceReadinessSummaries = (
    sourceGroups: ApkSourceGroup[],
    runtimeConfig: ApkRuntimeConfig
  ): ApkSourceReadinessSummary[] => {
    return sourceGroups
      .map((sourceGroup) => {
        const selectedOption = sourceGroup.options.find((option) => option.isSelected);

        return {
          sourceKey: sourceGroup.sourceKey,
          sourceName: sourceGroup.sourceName,
          status: this._getSourceReadinessStatus(sourceGroup, runtimeConfig),
          selectedPackageName: selectedOption?.packageName,
          optionCount: sourceGroup.options.length,
          hasSupportedOption: sourceGroup.options.some((option) => option.supported),
          hasActiveSelection: sourceGroup.options.some((option) => option.isActive),
          hasAdapterReadyOption: sourceGroup.options.some((option) => option.hasAdapterProfile),
        } as ApkSourceReadinessSummary;
      })
      .sort((left, right) => left.sourceName.localeCompare(right.sourceName));
  };

  private _isPreferredSelectionEligible = (
    option: ApkSourceOption,
    runtimeConfig: ApkRuntimeConfig
  ) => {
    if (!option.supported) {
      return false;
    }

    if (runtimeConfig.adapterRequiredMode === true && !option.hasAdapterProfile) {
      return false;
    }

    return true;
  };

  private _buildPreferredSelectionReason = (
    selectedOption: ApkSourceOption | undefined,
    candidateOption: ApkSourceOption | undefined,
    runtimeConfig: ApkRuntimeConfig
  ): ApkPreferredSelectionReason => {
    if (candidateOption === undefined) {
      return 'none-eligible';
    }

    if (selectedOption !== undefined && selectedOption.packageName === candidateOption.packageName) {
      return 'selected-still-valid';
    }

    if (runtimeConfig.adapterRequiredMode === true) {
      return 'adapter-required-supported';
    }

    return 'newest-supported';
  };

  private _buildPreferredSelectionCandidate = (
    sourceGroup: ApkSourceGroup,
    runtimeConfig: ApkRuntimeConfig
  ): ApkPreferredSelectionCandidate => {
    const selectedOption = sourceGroup.options.find((option) => option.isSelected);
    const candidateOption = sourceGroup.options.find((option) =>
      this._isPreferredSelectionEligible(option, runtimeConfig)
    );

    return {
      sourceKey: sourceGroup.sourceKey,
      sourceName: sourceGroup.sourceName,
      suggestedPackageName: candidateOption?.packageName,
      suggestedVersion: candidateOption?.version,
      reason: this._buildPreferredSelectionReason(selectedOption, candidateOption, runtimeConfig),
    };
  };

  private _buildApkPreferredSelectionCandidates = (
    sourceGroups: ApkSourceGroup[],
    runtimeConfig: ApkRuntimeConfig
  ): ApkPreferredSelectionCandidate[] => {
    return sourceGroups
      .map((sourceGroup) => this._buildPreferredSelectionCandidate(sourceGroup, runtimeConfig))
      .sort((left, right) => left.sourceName.localeCompare(right.sourceName));
  };

  private _pushDuplicatePackageDiagnostics = (
    diagnostics: ApkRuntimeDiagnostic[],
    mappingsByPackageName: { [packageName: string]: ApkSourceMapping[] }
  ) => {
    Object.values(mappingsByPackageName)
      .filter((entries) => entries.length > 1)
      .forEach((entries) => {
        entries.forEach((entry) => {
          diagnostics.push({
            type: 'warning',
            code: 'APK_DUPLICATE_PACKAGE',
            fileName: entry.apk.fileName,
            packageName: entry.apk.packageName,
            sourceKey: entry.apk.sourceKey,
            text: `Package '${entry.apk.packageName}' appears in multiple APK files.`,
          });
        });
      });
  };

  private _pushDuplicateSourceVersionDiagnostics = (
    diagnostics: ApkRuntimeDiagnostic[],
    mappingsBySourceVersion: { [key: string]: ApkSourceMapping[] }
  ) => {
    Object.values(mappingsBySourceVersion)
      .filter((entries) => entries.length > 1)
      .forEach((entries) => {
        entries.forEach((entry) => {
          diagnostics.push({
            type: 'info',
            code: 'APK_DUPLICATE_SOURCE_VERSION',
            fileName: entry.apk.fileName,
            packageName: entry.apk.packageName,
            sourceKey: entry.apk.sourceKey,
            text: `Multiple APK files share source '${entry.apk.sourceKey}' and version '${entry.apk.version || 'unknown'}'.`,
          });
        });
      });
  };

  private _pushSelectionNotActiveDiagnostics = (
    diagnostics: ApkRuntimeDiagnostic[],
    sourceMappings: ApkSourceMapping[],
    selectionState: ApkSelectionState,
    activeMappings: ApkActiveMapping[]
  ) => {
    Object.entries(selectionState).forEach(([sourceKey, selection]) => {
      const selectedMapping = sourceMappings.find(
        (entry) =>
          entry.apk.sourceKey === sourceKey &&
          entry.apk.packageName === selection.selectedPackageName
      );
      if (selectedMapping === undefined) {
        return;
      }

      const isActive = activeMappings.some(
        (entry) =>
          entry.sourceKey === sourceKey &&
          entry.selectedPackageName === selection.selectedPackageName
      );
      if (!isActive) {
        diagnostics.push({
          type: 'warning',
          code: 'APK_SELECTED_NOT_ACTIVE',
          fileName: selectedMapping.apk.fileName,
          packageName: selectedMapping.apk.packageName,
          sourceKey: selectedMapping.apk.sourceKey,
          text: 'This APK is selected for its source but is not currently active.',
        });
      }
    });
  };

  private _pushActiveMappingAdapterDiagnostics = (
    diagnostics: ApkRuntimeDiagnostic[],
    sourceMappings: ApkSourceMapping[],
    activeMappings: ApkActiveMapping[]
  ) => {
    activeMappings.forEach((mapping) => {
      const sourceMapping = sourceMappings.find(
        (entry) =>
          entry.apk.sourceKey === mapping.sourceKey &&
          entry.apk.packageName === mapping.selectedPackageName
      );
      if (sourceMapping === undefined) {
        return;
      }

      const profile = getApkAdapterProfile(mapping);
      if (profile !== undefined) {
        diagnostics.push({
          type: 'info',
          code: 'APK_ADAPTER_PROFILE_ACTIVE',
          fileName: sourceMapping.apk.fileName,
          packageName: sourceMapping.apk.packageName,
          sourceKey: sourceMapping.apk.sourceKey,
          text: `Adapter profile is active for source '${sourceMapping.apk.sourceKey}'.`,
        });

        if (
          Object.keys(profile.settingsOverride).some(
            (key) => key === 'API base URL' || key === 'Uploads base URL'
          )
        ) {
          diagnostics.push({
            type: 'info',
            code: 'APK_ENDPOINT_OVERRIDE_ACTIVE',
            fileName: sourceMapping.apk.fileName,
            packageName: sourceMapping.apk.packageName,
            sourceKey: sourceMapping.apk.sourceKey,
            text: `Endpoint override settings are active for source '${sourceMapping.apk.sourceKey}'.`,
          });
        }
      } else {
        diagnostics.push({
          type: 'warning',
          code: 'APK_ACTIVE_MAPPING_NO_ADAPTER',
          fileName: sourceMapping.apk.fileName,
          packageName: sourceMapping.apk.packageName,
          sourceKey: sourceMapping.apk.sourceKey,
          text: `No adapter profile is defined for active source '${sourceMapping.apk.sourceKey}'.`,
        });
      }
    });
  };

  private _sortDiagnostics = (diagnostics: ApkRuntimeDiagnostic[]) => {
    return diagnostics.sort((left, right) => {
      const sourceCompare = left.sourceKey.localeCompare(right.sourceKey);
      if (sourceCompare !== 0) {
        return sourceCompare;
      }
      return left.fileName.localeCompare(right.fileName);
    });
  };

  private _getApkRuntimeDiagnostics = (
    sourceMappings: ApkSourceMapping[],
    selectionState: ApkSelectionState,
    activeMappings: ApkActiveMapping[]
  ): ApkRuntimeDiagnostic[] => {
    const diagnostics: ApkRuntimeDiagnostic[] = [];

    this._pushUnsupportedSourceDiagnostics(diagnostics, sourceMappings);
    this._pushDuplicatePackageDiagnostics(
      diagnostics,
      this._groupMappingsByPackageName(sourceMappings)
    );
    this._pushDuplicateSourceVersionDiagnostics(
      diagnostics,
      this._groupMappingsBySourceVersion(sourceMappings)
    );
    this._pushSelectionNotActiveDiagnostics(diagnostics, sourceMappings, selectionState, activeMappings);
    this._pushActiveMappingAdapterDiagnostics(diagnostics, sourceMappings, activeMappings);

    return this._sortDiagnostics(diagnostics);
  };

  private _buildApkRuntimeHealthSummary = (
    sourceMappings: ApkSourceMapping[],
    sourceGroups: ApkSourceGroup[],
    activeMappings: ApkActiveMapping[],
    messages: ApkRuntimeMessage[],
    diagnostics: ApkRuntimeDiagnostic[]
  ): ApkRuntimeHealthSummary => {
    const warningCount =
      messages.filter((entry) => entry.type === 'warning').length +
      diagnostics.filter((entry) => entry.type === 'warning').length;
    const errorCount =
      messages.filter((entry) => entry.type === 'error').length +
      diagnostics.filter((entry) => entry.type === 'error').length;
    const blockingCodes = Array.from(
      new Set(messages.filter((entry) => entry.type === 'error').map((entry) => entry.code))
    ).sort();

    return {
      totalApkFiles: sourceMappings.length,
      totalSourceGroups: sourceGroups.length,
      totalSupportedMappings: sourceMappings.filter((entry) => entry.supported).length,
      totalUnsupportedMappings: sourceMappings.filter((entry) => !entry.supported).length,
      totalActiveMappings: activeMappings.length,
      totalAdapterReadyActiveMappings: this._getAdapterEligibleMappings(activeMappings).length,
      warningCount,
      errorCount,
      hasBlockingErrors: blockingCodes.length > 0,
      blockingCodes,
    };
  };

  private _addRuntimeActionHint = (
    hints: ApkRuntimeActionHint[],
    code: ApkRuntimeActionHintCode,
    type: 'info' | 'warning' | 'error',
    text: string
  ) => {
    if (hints.some((entry) => entry.code === code)) {
      return;
    }

    hints.push({
      code,
      type,
      text,
    });
  };

  private _buildApkRuntimeActionHints = (
    sourceMappings: ApkSourceMapping[],
    activeMappings: ApkActiveMapping[],
    runtimeConfig: ApkRuntimeConfig,
    messages: ApkRuntimeMessage[]
  ): ApkRuntimeActionHint[] => {
    const hints: ApkRuntimeActionHint[] = [];
    const messageCodes = new Set(messages.map((entry) => entry.code));

    if (messageCodes.has('APK_DIR_MISSING') || messageCodes.has('APK_DIR_INVALID')) {
      this._addRuntimeActionHint(
        hints,
        'open-apk-directory-settings',
        'error',
        'Set a valid APK extensions directory in runtime settings.'
      );
    }

    if (messageCodes.has('APK_NONE_FOUND')) {
      this._addRuntimeActionHint(
        hints,
        'add-apk-files',
        'info',
        'Add extension APK files to the configured APK directory and refresh runtime state.'
      );
    }

    if (messageCodes.has('APK_UNSUPPORTED_PRESENT')) {
      this._addRuntimeActionHint(
        hints,
        'review-unsupported-apks',
        'warning',
        'Review APK files with unsupported source keys and replace them with supported sources.'
      );
    }

    if (messageCodes.has('APK_SELECTION_UNRESOLVED')) {
      this._addRuntimeActionHint(
        hints,
        'review-source-selection',
        'warning',
        'Update source selection for unresolved mappings or clear stale selections.'
      );
    }

    if (messageCodes.has('APK_NO_ACTIVE_MAPPING')) {
      this._addRuntimeActionHint(
        hints,
        'select-supported-apk',
        'warning',
        'Select at least one supported APK per source to activate mappings.'
      );
    }

    if (messageCodes.has('APK_ONLY_MODE_EMPTY') || (runtimeConfig.apkOnlyMode === true && activeMappings.length === 0)) {
      this._addRuntimeActionHint(
        hints,
        'disable-apk-only-mode',
        'error',
        'Disable APK-only mode or activate at least one APK mapping.'
      );
    }

    if (messageCodes.has('APK_ADAPTER_REQUIRED_EMPTY') || runtimeConfig.adapterRequiredMode === true) {
      const adapterReadyCount = this._getAdapterEligibleMappings(activeMappings).length;
      if (adapterReadyCount === 0) {
        this._addRuntimeActionHint(
          hints,
          'select-adapter-supported-apk',
          'error',
          'Select an APK source that has an adapter profile for adapter-required mode.'
        );
        this._addRuntimeActionHint(
          hints,
          'disable-adapter-required-mode',
          'error',
          'Disable adapter-required mode until an adapter-supported APK source is active.'
        );
      }
    }

    return hints.sort((left, right) => left.code.localeCompare(right.code));
  };

  override getApkRuntimeActionHints = (): ApkRuntimeActionHint[] => {
    const runtimeConfig = this.getApkRuntimeConfig();
    const sourceMappings = this.getApkSourceMappings();
    const selectionState = this.getApkSelectionState();
    const activeMappings = this.getActiveApkMappings();
    const messages = this._getApkRuntimeMessages(
      this.getApkExtensionsDirectory(),
      sourceMappings,
      selectionState,
      activeMappings,
      runtimeConfig
    );

    return this._buildApkRuntimeActionHints(
      sourceMappings,
      activeMappings,
      runtimeConfig,
      messages
    );
  };

  override getApkRuntimeHealthSummary = (): ApkRuntimeHealthSummary => {
    const sourceMappings = this.getApkSourceMappings();
    const selectionState = this.getApkSelectionState();
    const activeMappings = this.getActiveApkMappings();
    const sourceGroups = this._buildApkSourceGroups(sourceMappings, selectionState, activeMappings);
    const messages = this._getApkRuntimeMessages(
      this.getApkExtensionsDirectory(),
      sourceMappings,
      selectionState,
      activeMappings,
      this.getApkRuntimeConfig()
    );
    const diagnostics = this._getApkRuntimeDiagnostics(
      sourceMappings,
      selectionState,
      activeMappings
    );

    return this._buildApkRuntimeHealthSummary(
      sourceMappings,
      sourceGroups,
      activeMappings,
      messages,
      diagnostics
    );
  };

  override getApkSourceReadinessSummaries = (): ApkSourceReadinessSummary[] => {
    const runtimeConfig = this.getApkRuntimeConfig();
    const sourceGroups = this.getApkSourceGroups();
    return this._buildApkSourceReadinessSummaries(sourceGroups, runtimeConfig);
  };

  override getApkPreferredSelectionCandidates = (): ApkPreferredSelectionCandidate[] => {
    const runtimeConfig = this.getApkRuntimeConfig();
    const sourceGroups = this.getApkSourceGroups();
    return this._buildApkPreferredSelectionCandidates(sourceGroups, runtimeConfig);
  };

  private _buildNoSourceOperationResult = (): ApkPreferredSelectionOperationResult => {
    return {
      sourceKey: '',
      status: 'skipped-no-source',
      previousPackageName: undefined,
      selectedPackageName: undefined,
    };
  };

  private _buildNoCandidateOperationResult = (
    sourceKey: string,
    previousPackageName: string | undefined
  ): ApkPreferredSelectionOperationResult => {
    return {
      sourceKey,
      status: 'skipped-no-candidate',
      previousPackageName,
      selectedPackageName: previousPackageName,
    };
  };

  private _buildInvalidCandidateOperationResult = (
    sourceKey: string,
    previousPackageName: string | undefined,
    suggestedPackageName: string
  ): ApkPreferredSelectionOperationResult => {
    return {
      sourceKey,
      status: 'skipped-invalid-candidate',
      previousPackageName,
      selectedPackageName: suggestedPackageName,
    };
  };

  private _buildAlreadySelectedOperationResult = (
    sourceKey: string,
    selectedPackageName: string
  ): ApkPreferredSelectionOperationResult => {
    return {
      sourceKey,
      status: 'skipped-already-selected',
      previousPackageName: selectedPackageName,
      selectedPackageName,
    };
  };

  private _buildAppliedOperationResult = (
    sourceKey: string,
    previousPackageName: string | undefined,
    selectedPackageName: string
  ): ApkPreferredSelectionOperationResult => {
    return {
      sourceKey,
      status: 'applied',
      previousPackageName,
      selectedPackageName,
    };
  };

  private _applyPreferredSelectionCandidate = (
    normalizedSourceKey: string,
    candidate: ApkPreferredSelectionCandidate,
    mappedBySource: { [sourceKey: string]: ApkSourceMapping[] },
    nextPersisted: ApkSelectionState,
    currentSelectionState: ApkSelectionState
  ): ApkPreferredSelectionOperationResult => {
    const previousPackageName = currentSelectionState[normalizedSourceKey]?.selectedPackageName;

    if (candidate.suggestedPackageName === undefined) {
      return this._buildNoCandidateOperationResult(normalizedSourceKey, previousPackageName);
    }

    const sourceEntries = mappedBySource[normalizedSourceKey] || [];
    const selectedEntry = this._getSelectedEntryByPackageName(sourceEntries, candidate.suggestedPackageName);
    if (selectedEntry === undefined) {
      return this._buildInvalidCandidateOperationResult(
        normalizedSourceKey,
        previousPackageName,
        candidate.suggestedPackageName
      );
    }

    if (previousPackageName === selectedEntry.apk.packageName) {
      return this._buildAlreadySelectedOperationResult(
        normalizedSourceKey,
        selectedEntry.apk.packageName
      );
    }

    nextPersisted[normalizedSourceKey] = {
      selectedPackageName: selectedEntry.apk.packageName,
      extensionId: selectedEntry.extensionId,
    };

    return this._buildAppliedOperationResult(
      normalizedSourceKey,
      previousPackageName,
      selectedEntry.apk.packageName
    );
  };

  override autoSelectPreferredApkWithResult = (
    sourceKey: string
  ): ApkPreferredSelectionOperationResult => {
    const normalizedSourceKey = this._toSourceKey(sourceKey.trim());
    if (normalizedSourceKey.length === 0) {
      return this._buildNoSourceOperationResult();
    }

    const candidatesBySource = this.getApkPreferredSelectionCandidates().reduce(
      (acc, candidate) => {
        acc[candidate.sourceKey] = candidate;
        return acc;
      },
      {} as { [sourceKey: string]: ApkPreferredSelectionCandidate }
    );
    const candidate = candidatesBySource[normalizedSourceKey];
    if (candidate === undefined) {
      const currentSelectionState = this.getApkSelectionState();
      return this._buildNoCandidateOperationResult(
        normalizedSourceKey,
        currentSelectionState[normalizedSourceKey]?.selectedPackageName
      );
    }

    const mappedBySource = this._getMappedBySource();
    const currentSelectionState = this.getApkSelectionState();
    const currentPersisted = this._getPersistedSelectionState();
    const nextPersisted = { ...currentPersisted } as ApkSelectionState;

    const result = this._applyPreferredSelectionCandidate(
      normalizedSourceKey,
      candidate,
      mappedBySource,
      nextPersisted,
      currentSelectionState
    );

    if (result.status === 'applied') {
      this._setPersistedSelectionState(nextPersisted);
    }

    return result;
  };

  override autoSelectPreferredApk = (sourceKey: string): ApkSelectionState => {
    this.autoSelectPreferredApkWithResult(sourceKey);
    return this.getApkSelectionState();
  };

  override autoSelectAllPreferredApksWithResult = (): ApkPreferredSelectionBulkOperationResult => {
    const mappedBySource = this._getMappedBySource();
    const currentSelectionState = this.getApkSelectionState();
    const currentPersisted = this._getPersistedSelectionState();
    const nextPersisted = { ...currentPersisted } as ApkSelectionState;
    const candidatesBySource = this.getApkPreferredSelectionCandidates().reduce(
      (acc, candidate) => {
        acc[candidate.sourceKey] = candidate;
        return acc;
      },
      {} as { [sourceKey: string]: ApkPreferredSelectionCandidate }
    );

    const sourceKeys = Object.keys(mappedBySource).sort();
    const results = sourceKeys.map((sourceKey) => {
      const candidate = candidatesBySource[sourceKey];
      if (candidate === undefined) {
        return this._buildNoCandidateOperationResult(
          sourceKey,
          currentSelectionState[sourceKey]?.selectedPackageName
        );
      }

      return this._applyPreferredSelectionCandidate(
        sourceKey,
        candidate,
        mappedBySource,
        nextPersisted,
        currentSelectionState
      );
    });

    if (results.some((entry) => entry.status === 'applied')) {
      this._setPersistedSelectionState(nextPersisted);
    }

    const selectionState = this.getApkSelectionState();
    const appliedCount = results.filter((entry) => entry.status === 'applied').length;

    return {
      selectionState,
      appliedCount,
      skippedCount: results.length - appliedCount,
      results,
    };
  };

  override autoSelectAllPreferredApks = (): ApkSelectionState => {
    return this.autoSelectAllPreferredApksWithResult().selectionState;
  };

  private _appendRepairFeedbackMessage = (
    messages: ApkRuntimeMessage[],
    operation: ApkPreferredSelectionBulkOperationResult
  ) => {
    const code = operation.appliedCount > 0 ? 'APK_REPAIR_APPLIED' : 'APK_REPAIR_NOOP';
    if (messages.some((entry) => entry.code === code)) {
      return;
    }

    messages.push({
      type: 'info',
      code,
      text:
        operation.appliedCount > 0
          ? `Repair applied ${operation.appliedCount} preferred selection update(s).`
          : 'Repair completed with no selection changes needed.',
    });
  };

  private _appendRepairFeedbackActionHint = (
    actionHints: ApkRuntimeActionHint[],
    operation: ApkPreferredSelectionBulkOperationResult
  ) => {
    const code: ApkRuntimeActionHintCode =
      operation.appliedCount > 0 ? 'repair-applied' : 'repair-noop';
    if (actionHints.some((entry) => entry.code === code)) {
      return;
    }

    actionHints.push({
      code,
      type: 'info',
      text:
        operation.appliedCount > 0
          ? `Repair completed: ${operation.appliedCount} source selection(s) updated.`
          : 'Repair completed: no source selections required updates.',
    });
  };

  private _buildRepairAnnotatedRuntimeState = (
    runtimeState: ApkRuntimeState,
    operation: ApkPreferredSelectionBulkOperationResult
  ): ApkRuntimeState => {
    const messages = [...runtimeState.messages];
    const actionHints = [...runtimeState.actionHints];

    this._appendRepairFeedbackMessage(messages, operation);
    this._appendRepairFeedbackActionHint(actionHints, operation);

    return {
      ...runtimeState,
      messages,
      actionHints,
    };
  };

  private _buildRuntimeStateVersion = (state: {
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
  }): string => {
    return createHash('sha1').update(JSON.stringify(state)).digest('hex');
  };

  override repairApkRuntimeState = (): ApkRuntimeRepairResult => {
    const operation = this.autoSelectAllPreferredApksWithResult();
    const lastRepair: ApkLastRepairMetadata = {
      timestamp: new Date().toISOString(),
      appliedCount: operation.appliedCount,
      skippedCount: operation.skippedCount,
    };
    this._writeRuntimeConfig({
      ...this._getPersistedRuntimeConfig(),
      lastRepair,
    });

    const runtimeState = this._buildRepairAnnotatedRuntimeState(
      this.refreshApkRuntimeState(),
      operation
    );

    return {
      lastRepair,
      operation,
      runtimeState,
    };
  };

  override getApkRuntimeDigest = (): ApkRuntimeDigest => {
    const runtimeState = this.getApkRuntimeState();
    return {
      runtimeStateVersion: runtimeState.runtimeStateVersion,
      healthSummary: runtimeState.healthSummary,
      lastRepair: this.getLastApkRepairMetadata(),
    };
  };

  override hasApkRuntimeDigestChanged = (runtimeStateVersion: string | undefined): boolean => {
    const previousVersion = runtimeStateVersion?.trim();
    if (previousVersion === undefined || previousVersion.length === 0) {
      return true;
    }

    return this.getApkRuntimeDigest().runtimeStateVersion !== previousVersion;
  };

  override getApkRuntimePollingDecision = (
    previousRuntimeStateVersion: string | undefined
  ): ApkRuntimePollingDecision => {
    const digest = this.getApkRuntimeDigest();
    const previousVersion = previousRuntimeStateVersion?.trim();

    return {
      changed: previousVersion === undefined || previousVersion.length === 0
        ? true
        : digest.runtimeStateVersion !== previousVersion,
      digest,
    };
  };

  override getApkRuntimeQuickStatus = (
    previousRuntimeStateVersion: string | undefined
  ): ApkRuntimeQuickStatus => {
    const decision = this.getApkRuntimePollingDecision(previousRuntimeStateVersion);
    const lastRepair = this.getLastApkRepairMetadata();
    const hasBlockingErrors = decision.digest.healthSummary.hasBlockingErrors;
    const suggestedNextAction = hasBlockingErrors
      ? 'run-repair'
      : decision.changed
        ? 'fetch-runtime-state'
        : 'none';
    const runtimePollIntervalHintMs = hasBlockingErrors
      ? 2000
      : decision.changed
        ? 3000
        : 10000;
    const shouldAutoRepair = suggestedNextAction === 'run-repair';

    return {
      changed: decision.changed,
      hasBlockingErrors,
      shouldAutoRepair,
      appliedCount: lastRepair?.appliedCount || 0,
      skippedCount: lastRepair?.skippedCount || 0,
      runtimePollIntervalHintMs,
      suggestedNextAction,
    };
  };

  override getApkRuntimeBootstrap = (
    previousRuntimeStateVersion: string | undefined
  ): ApkRuntimeBootstrapResult => {
    const quickStatus = this.getApkRuntimeQuickStatus(previousRuntimeStateVersion);
    const digest = this.getApkRuntimeDigest();

    return {
      quickStatus,
      digest,
      runtimeState: quickStatus.changed ? this.getApkRuntimeState() : undefined,
    };
  };

  override runApkRuntimeSuggestedAction = (
    previousRuntimeStateVersion: string | undefined
  ): ApkRuntimeSuggestedActionResult => {
    const bootstrap = this.getApkRuntimeBootstrap(previousRuntimeStateVersion);
    const action = bootstrap.quickStatus.suggestedNextAction;

    if (action === 'run-repair') {
      const repairResult = this.repairApkRuntimeState();
      return {
        action,
        performed: true,
        quickStatus: this.getApkRuntimeQuickStatus(undefined),
        digest: this.getApkRuntimeDigest(),
        runtimeState: repairResult.runtimeState,
        repairResult,
      };
    }

    if (action === 'fetch-runtime-state') {
      return {
        action,
        performed: true,
        quickStatus: bootstrap.quickStatus,
        digest: bootstrap.digest,
        runtimeState: bootstrap.runtimeState || this.getApkRuntimeState(),
        repairResult: undefined,
      };
    }

    return {
      action,
      performed: false,
      quickStatus: bootstrap.quickStatus,
      digest: bootstrap.digest,
      runtimeState: undefined,
      repairResult: undefined,
    };
  };

  override stabilizeApkRuntimeState = (maxSteps: number = 3): ApkRuntimeStabilizeResult => {
    const normalizedMaxSteps = Number.isFinite(maxSteps) && maxSteps > 0 ? Math.floor(maxSteps) : 1;
    const steps: ApkRuntimeStabilizeStep[] = [];
    let repairsRun = 0;
    let previousRuntimeStateVersion: string | undefined = undefined;

    for (let stepIndex = 0; stepIndex < normalizedMaxSteps; stepIndex += 1) {
      const actionResult = this.runApkRuntimeSuggestedAction(previousRuntimeStateVersion);
      steps.push({
        action: actionResult.action,
        performed: actionResult.performed,
        runtimeStateVersion: actionResult.digest.runtimeStateVersion,
        hasBlockingErrors: actionResult.quickStatus.hasBlockingErrors,
      });

      previousRuntimeStateVersion = actionResult.digest.runtimeStateVersion;
      if (actionResult.action === 'run-repair' && actionResult.performed) {
        repairsRun += 1;
      }

      if (!actionResult.performed) {
        break;
      }
    }

    const finalDigest = this.getApkRuntimeDigest();
    const finalQuickStatus = this.getApkRuntimeQuickStatus(finalDigest.runtimeStateVersion);

    return {
      steps,
      repairsRun,
      finalQuickStatus,
      finalDigest,
      finalRuntimeState: finalQuickStatus.changed ? this.getApkRuntimeState() : undefined,
    };
  };

  override getApkUiModel = (previousRuntimeStateVersion: string | undefined): ApkUiModel => {
    return {
      directoryStatus: this.getApkDirectoryStatus(),
      bootstrap: this.getApkRuntimeBootstrap(previousRuntimeStateVersion),
      migrationReport: this.getApkMigrationReport(),
    };
  };

  override prepareApkRuntimeForHoudokuStartup = (): ApkRuntimeStartupPreparationResult => {
    const directoryEnforceResult = this.enforceDefaultApkDirectory();
    const runtimeConfig = this.setApkOnlyMode(true);
    const cleanupResult = this.cleanupApkSelectionState();
    const autoSelectResult = this.autoSelectAllPreferredApksWithResult();
    const runtimeState = this.refreshApkRuntimeState();

    return {
      directoryStatus: directoryEnforceResult.directoryStatus,
      runtimeConfig,
      cleanupResult,
      autoSelectResult,
      runtimeState,
    };
  };

  override getApkHoudokuReadyStatus = (): ApkHoudokuReadyStatus => {
    const runtimeState = this.getApkRuntimeState();
    const directoryStatus = this.getApkDirectoryStatus();
    const quickStatus = this.getApkRuntimeQuickStatus(runtimeState.runtimeStateVersion);
    const unneededExtensions = this.getApkUnneededExtensions();

    const blockingCodes = runtimeState.healthSummary.blockingCodes;
    const warningCodes = [
      ...new Set(
        runtimeState.messages
          .filter((entry) => entry.type === 'warning')
          .map((entry) => entry.code)
      ),
    ].sort((left, right) => left.localeCompare(right));

    const level =
      blockingCodes.length > 0
        ? 'blocked'
        : warningCodes.length > 0
          ? 'warning'
          : 'ready';

    return {
      level,
      isReady: level === 'ready',
      runtimeStateVersion: runtimeState.runtimeStateVersion,
      directoryStatus,
      activeMappingCount: runtimeState.activeMappings.length,
      unsupportedApkCount: runtimeState.sourceMappings.filter((entry) => !entry.supported).length,
      unneededApkCount: unneededExtensions.length,
      blockingCodes,
      warningCodes,
      suggestedNextAction: quickStatus.suggestedNextAction,
    };
  };

  override runApkRuntimeMaintenanceCycle = (
    options?: ApkRuntimeMaintenanceCycleOptions
  ): ApkRuntimeMaintenanceCycleResult => {
    const applyUnneededCleanup = options?.applyUnneededCleanup === true;
    const unneededCleanupPolicy = options?.unneededCleanupPolicy || 'all-unneeded';
    const stabilizeMaxSteps =
      Number.isFinite(options?.stabilizeMaxSteps) && (options?.stabilizeMaxSteps || 0) > 0
        ? Math.floor(options?.stabilizeMaxSteps || 3)
        : 3;

    const startupPreparation = this.prepareApkRuntimeForHoudokuStartup();
    const unneededCleanup = this.cleanupUnneededApkExtensions({
      apply: applyUnneededCleanup,
      policy: unneededCleanupPolicy,
    });
    const stabilization = this.stabilizeApkRuntimeState(stabilizeMaxSteps);
    const readyStatus = this.getApkHoudokuReadyStatus();

    return {
      options: {
        applyUnneededCleanup,
        unneededCleanupPolicy,
        stabilizeMaxSteps,
      },
      startupPreparation,
      unneededCleanup,
      stabilization,
      readyStatus,
    };
  };

  private _toReadyLevelWeight = (value: ApkHoudokuReadyStatus['level']): number => {
    if (value === 'ready') {
      return 2;
    }

    if (value === 'warning') {
      return 1;
    }

    return 0;
  };

  override runApkRuntimeStrictStartupGate = (
    options?: ApkRuntimeStrictStartupGateOptions
  ): ApkRuntimeStrictStartupGateResult => {
    const requireReadyLevel = options?.requireReadyLevel || 'ready';
    const requireNoUnsupportedApks = options?.requireNoUnsupportedApks !== false;
    const requireNoUnneededApks = options?.requireNoUnneededApks === true;

    const maintenanceCycle = this.runApkRuntimeMaintenanceCycle(options?.maintenanceOptions);
    const readyStatus = maintenanceCycle.readyStatus;
    const reasons: string[] = [];

    if (this._toReadyLevelWeight(readyStatus.level) < this._toReadyLevelWeight(requireReadyLevel)) {
      reasons.push(
        `Readiness level '${readyStatus.level}' does not meet required level '${requireReadyLevel}'.`
      );
    }

    if (requireNoUnsupportedApks && readyStatus.unsupportedApkCount > 0) {
      reasons.push(
        `Detected ${readyStatus.unsupportedApkCount} unsupported APK file(s) while strict startup requires zero.`
      );
    }

    if (requireNoUnneededApks && readyStatus.unneededApkCount > 0) {
      reasons.push(
        `Detected ${readyStatus.unneededApkCount} unneeded APK file(s) while strict startup requires zero.`
      );
    }

    return {
      options: {
        requireReadyLevel,
        requireNoUnsupportedApks,
        requireNoUnneededApks,
      },
      maintenanceCycle,
      readyStatus,
      passed: reasons.length === 0,
      reasons,
    };
  };

  override getApkRecommendedStrictStartupGate = (
    profile: ApkRuntimeStrictStartupProfile = 'test'
  ): ApkRuntimeStrictStartupGateRecommendation => {
    if (profile === 'dev') {
      return {
        profile,
        options: {
          maintenanceOptions: {
            applyUnneededCleanup: false,
            unneededCleanupPolicy: 'unsupported-only',
            stabilizeMaxSteps: 2,
          },
          requireReadyLevel: 'warning',
          requireNoUnsupportedApks: false,
          requireNoUnneededApks: false,
        },
        notes: [
          'Development profile favors fast iteration and non-destructive maintenance.',
          'Unsupported and unneeded APKs are tolerated for local testing workflows.',
        ],
      };
    }

    if (profile === 'prod') {
      return {
        profile,
        options: {
          maintenanceOptions: {
            applyUnneededCleanup: false,
            unneededCleanupPolicy: 'all-unneeded',
            stabilizeMaxSteps: 3,
          },
          requireReadyLevel: 'ready',
          requireNoUnsupportedApks: true,
          requireNoUnneededApks: true,
        },
        notes: [
          'Production profile enforces clean APK inventory and full readiness.',
          'Enable apply cleanup explicitly only in controlled maintenance windows.',
        ],
      };
    }

    return {
      profile: 'test',
      options: {
        maintenanceOptions: {
          applyUnneededCleanup: false,
          unneededCleanupPolicy: 'unsupported-only',
          stabilizeMaxSteps: 2,
        },
        requireReadyLevel: 'warning',
        requireNoUnsupportedApks: true,
        requireNoUnneededApks: false,
      },
      notes: [
        'Test profile requires supported mappings while keeping cleanup non-destructive by default.',
        'Suitable for CI and pre-release verification with deterministic gate checks.',
      ],
    };
  };

  override runApkRecommendedStrictStartupGate = (
    profile: ApkRuntimeStrictStartupProfile = 'test'
  ): ApkRuntimeStrictStartupGateResult => {
    const recommendation = this.getApkRecommendedStrictStartupGate(profile);
    return this.runApkRuntimeStrictStartupGate(recommendation.options);
  };

  private _mergeStrictStartupGateOptions = (
    base: ApkRuntimeStrictStartupGateOptions,
    overrides?: ApkStartupRemediationOverrides
  ): ApkRuntimeStrictStartupGateOptions => {
    if (overrides === undefined) {
      return base;
    }

    const baseMaintenance = base.maintenanceOptions;
    const overrideMaintenance = overrides.maintenanceOptions;

    return {
      ...base,
      ...overrides,
      maintenanceOptions:
        baseMaintenance === undefined && overrideMaintenance === undefined
          ? undefined
          : {
              ...(baseMaintenance || {}),
              ...(overrideMaintenance || {}),
            },
    };
  };

  private _getStrictStartupRecommendationWithOverrides = (
    profile: ApkRuntimeStrictStartupProfile,
    overrides?: ApkStartupRemediationOverrides
  ): ApkRuntimeStrictStartupGateRecommendation => {
    const recommendation = this.getApkRecommendedStrictStartupGate(profile);
    if (overrides === undefined) {
      return recommendation;
    }

    return {
      ...recommendation,
      options: this._mergeStrictStartupGateOptions(recommendation.options, overrides),
      notes: [
        ...recommendation.notes,
        'Runtime remediation overrides were applied for this execution.',
      ],
    };
  };

  private _toRemediationStepFromHint = (hint: ApkRuntimeActionHint): ApkStartupRemediationStep => {
    const methodByHintCode: { [code: string]: ApkStartupRemediationStep['method'] } = {
      'open-apk-directory-settings': 'setApkExtensionsDirectory',
      'add-apk-files': 'refreshApkRuntimeState',
      'review-unsupported-apks': 'cleanupUnneededApkExtensions',
      'review-source-selection': 'autoSelectAllPreferredApksWithResult',
      'select-supported-apk': 'autoSelectAllPreferredApksWithResult',
      'disable-apk-only-mode': 'setApkOnlyMode',
      'disable-adapter-required-mode': 'setAdapterRequiredMode',
      'select-adapter-supported-apk': 'autoSelectAllPreferredApksWithResult',
      'repair-applied': 'runApkRuntimeMaintenanceCycle',
      'repair-noop': 'runApkRuntimeStrictStartupGate',
    };

    return {
      code: hint.code,
      type: hint.type,
      text: hint.text,
      method: methodByHintCode[hint.code] || 'runApkRuntimeMaintenanceCycle',
      autoRunnable: hint.type !== 'error',
    };
  };

  private _dedupeRemediationSteps = (
    steps: ApkStartupRemediationStep[]
  ): ApkStartupRemediationStep[] => {
    const seen = new Set<string>();
    const priority: { [type: string]: number } = {
      error: 0,
      warning: 1,
      info: 2,
    };

    return steps
      .sort((left, right) => {
        const typeCompare = (priority[left.type] || 9) - (priority[right.type] || 9);
        if (typeCompare !== 0) {
          return typeCompare;
        }

        return left.code.localeCompare(right.code);
      })
      .filter((step) => {
        if (seen.has(step.code)) {
          return false;
        }

        seen.add(step.code);
        return true;
      });
  };

  override getApkStartupRemediationPlan = (
    profile: ApkRuntimeStrictStartupProfile = 'test'
  ): ApkStartupRemediationPlan => {
    const recommendation = this.getApkRecommendedStrictStartupGate(profile);
    const strictGate = this.runApkRuntimeStrictStartupGate(recommendation.options);
    const hintSteps = strictGate.maintenanceCycle.startupPreparation.runtimeState.actionHints.map(
      this._toRemediationStepFromHint
    );

    const reasonSteps = strictGate.reasons.map((reason, index) => ({
      code: `strict-gate-reason-${index + 1}`,
      type: 'error' as const,
      text: reason,
      method: 'runApkRuntimeMaintenanceCycle' as const,
      autoRunnable: false,
    }));

    return {
      profile,
      recommendation,
      strictGate,
      steps: this._dedupeRemediationSteps([...reasonSteps, ...hintSteps]),
    };
  };

  private _runAutoRemediationMethod = (
    method: ApkStartupRemediationStep['method'],
    recommendation: ApkRuntimeStrictStartupGateRecommendation
  ): { performed: boolean; note: string } => {
    if (method === 'refreshApkRuntimeState') {
      this.refreshApkRuntimeState();
      return { performed: true, note: 'Runtime state refreshed.' };
    }

    if (method === 'cleanupUnneededApkExtensions') {
      const maintenanceOptions = recommendation.options.maintenanceOptions;
      this.cleanupUnneededApkExtensions({
        apply: maintenanceOptions?.applyUnneededCleanup === true,
        policy: maintenanceOptions?.unneededCleanupPolicy || 'unsupported-only',
      });
      return { performed: true, note: 'Unneeded APK cleanup method executed.' };
    }

    if (method === 'autoSelectAllPreferredApksWithResult') {
      this.autoSelectAllPreferredApksWithResult();
      return { performed: true, note: 'Preferred APK selections applied.' };
    }

    if (method === 'runApkRuntimeMaintenanceCycle') {
      this.runApkRuntimeMaintenanceCycle(recommendation.options.maintenanceOptions);
      return { performed: true, note: 'Maintenance cycle executed.' };
    }

    if (method === 'runApkRuntimeStrictStartupGate') {
      this.runApkRuntimeStrictStartupGate(recommendation.options);
      return { performed: true, note: 'Strict startup gate executed.' };
    }

    return {
      performed: false,
      note: `Method '${method}' requires manual input or explicit operator choice.`,
    };
  };

  override runApkStartupRemediation = (
    profile: ApkRuntimeStrictStartupProfile = 'test'
  ): ApkStartupRemediationRunResult => {
    return this.runApkStartupRemediationWithOverrides(profile, undefined);
  };

  override runApkStartupRemediationWithOverrides = (
    profile: ApkRuntimeStrictStartupProfile = 'test',
    overrides?: ApkStartupRemediationOverrides
  ): ApkStartupRemediationRunResult => {
    const recommendation = this._getStrictStartupRecommendationWithOverrides(profile, overrides);
    const strictGate = this.runApkRuntimeStrictStartupGate(recommendation.options);
    const hintSteps = strictGate.maintenanceCycle.startupPreparation.runtimeState.actionHints.map(
      this._toRemediationStepFromHint
    );

    const reasonSteps = strictGate.reasons.map((reason, index) => ({
      code: `strict-gate-reason-${index + 1}`,
      type: 'error' as const,
      text: reason,
      method: 'runApkRuntimeMaintenanceCycle' as const,
      autoRunnable: false,
    }));

    const plan: ApkStartupRemediationPlan = {
      profile,
      recommendation,
      strictGate,
      steps: this._dedupeRemediationSteps([...reasonSteps, ...hintSteps]),
    };

    const beforeGate = plan.strictGate;
    const executedMethods = new Set<ApkStartupRemediationStep['method']>();

    const stepResults: ApkStartupRemediationStepRunResult[] = plan.steps.map((step) => {
      if (!step.autoRunnable) {
        return {
          code: step.code,
          method: step.method,
          attempted: false,
          performed: false,
          note: 'Step requires manual remediation.',
        };
      }

      if (executedMethods.has(step.method)) {
        return {
          code: step.code,
          method: step.method,
          attempted: false,
          performed: false,
          note: 'Skipped duplicate method; already executed in this remediation run.',
        };
      }

      executedMethods.add(step.method);
      const execution = this._runAutoRemediationMethod(step.method, plan.recommendation);
      return {
        code: step.code,
        method: step.method,
        attempted: true,
        performed: execution.performed,
        note: execution.note,
      };
    });

    const afterGate = this.runApkRuntimeStrictStartupGate(recommendation.options);
    const improved =
      afterGate.passed ||
      afterGate.reasons.length < beforeGate.reasons.length ||
      this._toReadyLevelWeight(afterGate.readyStatus.level) >
        this._toReadyLevelWeight(beforeGate.readyStatus.level);

    return {
      profile,
      plan,
      usedOverrides: overrides,
      beforeGate,
      afterGate,
      improved,
      stepResults,
    };
  };

  override runApkStartupRemediationUntilStable = (
    options?: ApkStartupRemediationUntilStableOptions
  ): ApkStartupRemediationUntilStableResult => {
    const profile = options?.profile || 'test';
    const overrides = options?.overrides;
    const maxRuns =
      Number.isFinite(options?.maxRuns) && (options?.maxRuns || 0) > 0
        ? Math.floor(options?.maxRuns || 1)
        : 3;

    const runs: ApkStartupRemediationRunResult[] = [];
    let stopReason: ApkStartupRemediationUntilStableStopReason = 'max-runs';

    for (let runIndex = 0; runIndex < maxRuns; runIndex += 1) {
      const runResult = this.runApkStartupRemediationWithOverrides(profile, overrides);
      runs.push(runResult);

      if (runResult.afterGate.passed) {
        stopReason = 'passed';
        break;
      }

      if (!runResult.improved) {
        stopReason = 'no-improvement';
        break;
      }
    }

    const finalRun = runs[runs.length - 1];
    if (finalRun === undefined) {
      const fallbackRun = this.runApkStartupRemediationWithOverrides(profile, overrides);
      return {
        profile,
        maxRuns,
        runs: [fallbackRun],
        finalRun: fallbackRun,
        stopReason: fallbackRun.afterGate.passed ? 'passed' : 'max-runs',
        converged: fallbackRun.afterGate.passed,
      };
    }

    return {
      profile,
      maxRuns,
      runs,
      finalRun,
      stopReason,
      converged: finalRun.afterGate.passed,
    };
  };

  override getApkRuntimeState = (): ApkRuntimeState => {
    const runtimeConfig = this.getApkRuntimeConfig();
    const adapterSupportedSourceKeys = getSupportedApkAdapterSourceKeys();
    const apkExtensionsDirectory = this.getApkExtensionsDirectory();
    const apkExtensions = this.getApkExtensions();
    const sourceMappings = this.getApkSourceMappings();
    const selectionState = this.getApkSelectionState();
    const selectionRecommendations = this.getApkSelectionRecommendations();
    const activeMappings = this.getActiveApkMappings();
    const sourceGroups = this._buildApkSourceGroups(sourceMappings, selectionState, activeMappings);
    const sourceReadinessSummaries = this._buildApkSourceReadinessSummaries(
      sourceGroups,
      runtimeConfig
    );
    const preferredSelectionCandidates = this._buildApkPreferredSelectionCandidates(
      sourceGroups,
      runtimeConfig
    );
    const messages = this._getApkRuntimeMessages(
      apkExtensionsDirectory,
      sourceMappings,
      selectionState,
      activeMappings,
      runtimeConfig
    );
    const diagnostics = this._getApkRuntimeDiagnostics(
      sourceMappings,
      selectionState,
      activeMappings
    );
    const actionHints = this._buildApkRuntimeActionHints(
      sourceMappings,
      activeMappings,
      runtimeConfig,
      messages
    );
    const healthSummary = this._buildApkRuntimeHealthSummary(
      sourceMappings,
      sourceGroups,
      activeMappings,
      messages,
      diagnostics
    );

    const runtimeStateVersion = this._buildRuntimeStateVersion({
      runtimeConfig,
      adapterSupportedSourceKeys,
      healthSummary,
      actionHints,
      apkExtensionsDirectory,
      apkExtensions,
      sourceMappings,
      sourceGroups,
      sourceReadinessSummaries,
      preferredSelectionCandidates,
      selectionState,
      selectionRecommendations,
      activeMappings,
      messages,
      diagnostics,
    });

    return {
      runtimeStateVersion,
      runtimeConfig,
      adapterSupportedSourceKeys,
      healthSummary,
      actionHints,
      apkExtensionsDirectory,
      apkExtensions,
      sourceMappings,
      sourceGroups,
      sourceReadinessSummaries,
      preferredSelectionCandidates,
      selectionState,
      selectionRecommendations,
      activeMappings,
      messages,
      diagnostics,
    };
  };

  override getApkSourceGroups = (): ApkSourceGroup[] => {
    const sourceMappings = this.getApkSourceMappings();
    const selectionState = this.getApkSelectionState();
    const activeMappings = this.getActiveApkMappings();
    return this._buildApkSourceGroups(sourceMappings, selectionState, activeMappings);
  };

  override refreshApkRuntimeState = (): ApkRuntimeState => {
    this.refreshApkExtensions();
    return this.getApkRuntimeState();
  };

  private _getApkSelectionFilePath = () => {
    const configuredFilePath = process.env['TIYO_APK_SELECTION_FILE'];
    if (configuredFilePath !== undefined && configuredFilePath.length > 0) {
      return configuredFilePath;
    }

    return getDefaultApkSelectionFilePath();
  };

  override getApkExtensions = () => {
    if (this._apkExtensionsCache === undefined) {
      this._apkExtensionsCache = getApkExtensionInfoList(this.getApkExtensionsDirectory());
    }

    return this._apkExtensionsCache;
  };

  override refreshApkExtensions = () => {
    this._apkExtensionsCache = getApkExtensionInfoList(this.getApkExtensionsDirectory());
    this.cleanupApkSelectionState();
    return this._apkExtensionsCache;
  };

  private _areSelectionsEqual = (left: ApkSelectionState, right: ApkSelectionState): boolean => {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every((key, index) => {
      const rightKey = rightKeys[index];
      if (key !== rightKey) {
        return false;
      }

      const leftEntry = left[key];
      const rightEntry = right[key];
      return (
        leftEntry.selectedPackageName === rightEntry.selectedPackageName &&
        leftEntry.extensionId === rightEntry.extensionId
      );
    });
  };

  override cleanupApkSelectionState = (): ApkSelectionCleanupResult => {
    const persistedState = this._getPersistedSelectionState();
    const mappedBySource = this._getMappedBySource();

    const removed: { sourceKey: string; selectedPackageName: string }[] = [];
    const cleanedState = Object.entries(persistedState).reduce((acc, [sourceKey, selection]) => {
      const normalizedSourceKey = this._toSourceKey(sourceKey);
      const sourceEntries = mappedBySource[normalizedSourceKey] || [];
      const selectedEntry = this._getSelectedEntryByPackageName(
        sourceEntries,
        selection.selectedPackageName
      );

      if (selectedEntry === undefined) {
        removed.push({
          sourceKey: normalizedSourceKey,
          selectedPackageName: selection.selectedPackageName,
        });
        return acc;
      }

      acc[normalizedSourceKey] = {
        selectedPackageName: selectedEntry.apk.packageName,
        extensionId: selectedEntry.extensionId,
      };

      return acc;
    }, {} as ApkSelectionState);

    if (!this._areSelectionsEqual(persistedState, cleanedState)) {
      this._setPersistedSelectionState(cleanedState);
    }

    return {
      removed,
      selectionState: cleanedState,
    };
  };

  private _getPersistedSelectionState = (): ApkSelectionState => {
    if (this._apkSelectionStateCache === undefined) {
      this._apkSelectionStateCache = readApkSelectionState(this._getApkSelectionFilePath());
    }

    return this._apkSelectionStateCache;
  };

  private _setPersistedSelectionState = (state: ApkSelectionState) => {
    this._apkSelectionStateCache = state;
    writeApkSelectionState(state, this._getApkSelectionFilePath());
  };

  private _getSourceKeyToExtensionInfo = () => {
    return buildSourceKeyToExtensionInfo(this._getBuiltInMetadataList());
  };

  override getApkSourceMappings = (): ApkSourceMapping[] => {
    const sourceKeyMap = this._getSourceKeyToExtensionInfo();
    return this.getApkExtensions().map((apk) => {
      const mapped = sourceKeyMap[toCanonicalSourceKey(apk.sourceKey)];
      return {
        apk,
        extensionId: mapped?.id,
        extensionName: mapped?.name,
        supported: mapped !== undefined,
      };
    });
  };

  override getApkUnneededExtensions = (): ApkUnneededExtensionCandidate[] => {
    const sourceMappings = this.getApkSourceMappings();
    const selectionState = this.getApkSelectionState();
    const candidates: ApkUnneededExtensionCandidate[] = [];

    sourceMappings
      .filter((mapping) => !mapping.supported)
      .forEach((mapping) => {
        const sourceKey = this._toSourceKey(mapping.apk.sourceKey);
        const selectedPackageName = selectionState[sourceKey]?.selectedPackageName;

        candidates.push({
          filePath: mapping.apk.filePath,
          fileName: mapping.apk.fileName,
          packageName: mapping.apk.packageName,
          sourceKey,
          version: mapping.apk.version,
          reason: 'unsupported-source',
          selectedPackageName,
        });
      });

    const groupedSupportedMappings = sourceMappings
      .filter((mapping) => mapping.supported)
      .reduce((acc, mapping) => {
        const sourceKey = this._toSourceKey(mapping.apk.sourceKey);
        if (acc[sourceKey] === undefined) {
          acc[sourceKey] = [];
        }

        acc[sourceKey].push(mapping);
        return acc;
      }, {} as { [sourceKey: string]: ApkSourceMapping[] });

    Object.entries(groupedSupportedMappings).forEach(([sourceKey, mappings]) => {
        const selectedPackageName = selectionState[sourceKey]?.selectedPackageName;
        if (selectedPackageName === undefined) {
          return;
        }

        mappings
          .filter((mapping) => mapping.apk.packageName !== selectedPackageName)
          .forEach((mapping) => {
            candidates.push({
              filePath: mapping.apk.filePath,
              fileName: mapping.apk.fileName,
              packageName: mapping.apk.packageName,
              sourceKey,
              version: mapping.apk.version,
              reason: 'not-selected-duplicate',
              selectedPackageName,
            });
            });
          });

    return candidates.sort((left, right) => {
      const sourceCompare = left.sourceKey.localeCompare(right.sourceKey);
      if (sourceCompare !== 0) {
        return sourceCompare;
      }

      return left.fileName.localeCompare(right.fileName);
    });
  };

  override cleanupUnneededApkExtensions = (
    options: boolean | ApkUnneededExtensionCleanupOptions = false
  ): ApkUnneededExtensionCleanupResult => {
    const apply = typeof options === 'boolean' ? options : options?.apply === true;
    const policy: ApkUnneededExtensionCleanupPolicy =
      typeof options === 'boolean' ? 'all-unneeded' : options?.policy || 'all-unneeded';
    const apkDirectory = this.getApkExtensionsDirectory();
    const normalizedDirectory = fs.realpathSync(apkDirectory);
    const normalizedDirectoryPrefix = `${normalizedDirectory}${path.sep}`;
    const allCandidates = this.getApkUnneededExtensions();
    const candidates =
      policy === 'unsupported-only'
        ? allCandidates.filter((entry) => entry.reason === 'unsupported-source')
        : allCandidates;

    const results: ApkUnneededExtensionCleanupEntry[] = candidates.map((candidate) => {
      if (!apply) {
        return {
          candidate,
          status: 'dry-run',
          error: undefined,
        };
      }

      try {
        if (!fs.existsSync(candidate.filePath)) {
          return {
            candidate,
            status: 'skipped-missing-file',
            error: undefined,
          };
        }

        const resolvedPath = fs.realpathSync(candidate.filePath);
        if (resolvedPath !== normalizedDirectory && !resolvedPath.startsWith(normalizedDirectoryPrefix)) {
          return {
            candidate,
            status: 'skipped-outside-directory',
            error: undefined,
          };
        }

        fs.unlinkSync(resolvedPath);
        return {
          candidate,
          status: 'removed',
          error: undefined,
        };
      } catch (error) {
        const errorText = error instanceof Error ? error.message : String(error);
        return {
          candidate,
          status: 'failed',
          error: errorText,
        };
      }
    });

    if (apply) {
      this.refreshApkExtensions();
      this.cleanupApkSelectionState();
    }

    const removedCount = results.filter((entry) => entry.status === 'removed').length;
    const failedCount = results.filter((entry) => entry.status === 'failed').length;
    const skippedCount =
      results.length -
      removedCount -
      failedCount -
      results.filter((entry) => entry.status === 'dry-run').length;

    return {
      apply,
      policy,
      apkDirectory,
      totalCandidates: candidates.length,
      removedCount,
      skippedCount,
      failedCount,
      results,
      unneededAfter: apply ? this.getApkUnneededExtensions() : candidates,
    };
  };

  private _getMappedBySource = () => {
    return this.getApkSourceMappings()
      .filter((entry) => entry.supported)
      .reduce((acc, entry) => {
        const sourceKey = this._toSourceKey(entry.apk.sourceKey);
        if (acc[sourceKey] === undefined) {
          acc[sourceKey] = [];
        }
        acc[sourceKey].push(entry);
        return acc;
      }, {} as { [sourceKey: string]: ApkSourceMapping[] });
  };

  private _resolveSelectionState = (): {
    selectionState: ApkSelectionState;
    selectionSource: { [sourceKey: string]: 'default' | 'persisted' | 'env' };
    mappedBySource: { [sourceKey: string]: ApkSourceMapping[] };
  } => {
    const mappedBySource = this._getMappedBySource();
    const selectionState: ApkSelectionState = {};
    const selectionSource: { [sourceKey: string]: 'default' | 'persisted' | 'env' } = {};

    this._applyDefaultSelections(selectionState, mappedBySource, selectionSource);
    this._applyPersistedSelections(selectionState, mappedBySource, selectionSource);
    this._applyEnvSelections(
      selectionState,
      mappedBySource,
      process.env['TIYO_APK_SOURCE_SELECTION'],
      selectionSource
    );

    return {
      selectionState,
      selectionSource,
      mappedBySource,
    };
  };

  private _parseVersionParts = (value: string | undefined): number[] => {
    if (value === undefined) {
      return [0];
    }

    return value
      .split('.')
      .map((part) => Number.parseInt(part, 10))
      .map((part) => (Number.isNaN(part) ? 0 : part));
  };

  private _compareVersionDesc = (left: string | undefined, right: string | undefined): number => {
    const leftParts = this._parseVersionParts(left);
    const rightParts = this._parseVersionParts(right);
    const maxLen = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < maxLen; index += 1) {
      const leftPart = leftParts[index] || 0;
      const rightPart = rightParts[index] || 0;
      if (leftPart !== rightPart) {
        return rightPart - leftPart;
      }
    }

    return 0;
  };

  private _getSelectedEntryByPackageName = (
    sourceEntries: ApkSourceMapping[],
    packageName: string
  ): ApkSourceMapping | undefined => {
    return sourceEntries.find((entry) => entry.apk.packageName === packageName);
  };

  private _assignSelection = (
    selectionState: ApkSelectionState,
    sourceKey: string,
    selectedEntry: ApkSourceMapping,
    selectionSource?: { [sourceKey: string]: 'default' | 'persisted' | 'env' },
    source?: 'default' | 'persisted' | 'env'
  ) => {
    selectionState[sourceKey] = {
      selectedPackageName: selectedEntry.apk.packageName,
      extensionId: selectedEntry.extensionId,
    };

    if (selectionSource !== undefined && source !== undefined) {
      selectionSource[sourceKey] = source;
    }
  };

  private _applyDefaultSelections = (
    selectionState: ApkSelectionState,
    mappedBySource: { [sourceKey: string]: ApkSourceMapping[] },
    selectionSource?: { [sourceKey: string]: 'default' | 'persisted' | 'env' }
  ) => {
    Object.entries(mappedBySource).forEach(([sourceKey, entries]) => {
      const sortedEntries = [...entries].sort((left, right) => {
        const versionCompare = this._compareVersionDesc(left.apk.version, right.apk.version);
        if (versionCompare !== 0) {
          return versionCompare;
        }
        return left.apk.fileName.localeCompare(right.apk.fileName);
      });

      const newestEntry = sortedEntries[0];
      if (newestEntry !== undefined) {
        this._assignSelection(selectionState, sourceKey, newestEntry, selectionSource, 'default');
      }
    });
  };

  private _applyPersistedSelections = (
    selectionState: ApkSelectionState,
    mappedBySource: { [sourceKey: string]: ApkSourceMapping[] },
    selectionSource?: { [sourceKey: string]: 'default' | 'persisted' | 'env' }
  ) => {
    const persistedState = this._getPersistedSelectionState();
    Object.entries(persistedState).forEach(([sourceKey, persistedSelection]) => {
      const sourceEntries = mappedBySource[this._toSourceKey(sourceKey)] || [];
      const selectedEntry = this._getSelectedEntryByPackageName(
        sourceEntries,
        persistedSelection.selectedPackageName
      );
      if (selectedEntry !== undefined) {
        this._assignSelection(
          selectionState,
          this._toSourceKey(sourceKey),
          selectedEntry,
          selectionSource,
          'persisted'
        );
      }
    });
  };

  private _applyEnvSelections = (
    selectionState: ApkSelectionState,
    mappedBySource: { [sourceKey: string]: ApkSourceMapping[] },
    selectionRaw: string | undefined,
    selectionSource?: { [sourceKey: string]: 'default' | 'persisted' | 'env' }
  ) => {
    if (selectionRaw === undefined || selectionRaw.trim().length === 0) {
      return;
    }

    selectionRaw
      .split(';')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0)
      .forEach((segment) => {
        const [sourceKeyRaw, packageNameRaw] = segment.split('=');
        if (sourceKeyRaw === undefined || packageNameRaw === undefined) {
          return;
        }

        const sourceKey = this._toSourceKey(sourceKeyRaw.trim());
        const packageName = packageNameRaw.trim();
        const sourceEntries = mappedBySource[sourceKey] || [];
        const selectedEntry = this._getSelectedEntryByPackageName(sourceEntries, packageName);
        if (selectedEntry !== undefined) {
          this._assignSelection(selectionState, sourceKey, selectedEntry, selectionSource, 'env');
        }
      });
  };

  override getApkSelectionState = (): ApkSelectionState => {
    return this._resolveSelectionState().selectionState;
  };

  override getApkSelectionRecommendations = (): ApkSelectionRecommendation[] => {
    const { mappedBySource, selectionState, selectionSource } = this._resolveSelectionState();

    return Object.entries(mappedBySource)
      .map(([sourceKey, sourceEntries]) => {
        const selection = selectionState[sourceKey];
        if (selection === undefined) {
          return undefined;
        }

        const selectedEntry = sourceEntries.find(
          (entry) => entry.apk.packageName === selection.selectedPackageName
        );
        if (selectedEntry === undefined) {
          return undefined;
        }

        return {
          sourceKey,
          selectedPackageName: selectedEntry.apk.packageName,
          selectedVersion: selectedEntry.apk.version,
          reason: this._toSelectionReason(selectionSource[sourceKey] || 'default'),
        } as ApkSelectionRecommendation;
      })
      .filter((entry): entry is ApkSelectionRecommendation => entry !== undefined)
      .sort((left, right) => left.sourceKey.localeCompare(right.sourceKey));
  };

  override setApkSourceSelection = (
    sourceKey: string,
    selectedPackageName: string
  ): ApkSelectionState => {
    const normalizedSourceKey = this._toSourceKey(sourceKey.trim());
    const normalizedPackageName = selectedPackageName.trim();
    if (normalizedSourceKey.length === 0 || normalizedPackageName.length === 0) {
      return this.getApkSelectionState();
    }

    const sourceEntries = this._getMappedBySource()[normalizedSourceKey] || [];
    const selectedEntry = this._getSelectedEntryByPackageName(sourceEntries, normalizedPackageName);
    if (selectedEntry === undefined) {
      return this.getApkSelectionState();
    }

    const currentPersisted = this._getPersistedSelectionState();
    const nextPersisted = {
      ...currentPersisted,
      [normalizedSourceKey]: {
        selectedPackageName: selectedEntry.apk.packageName,
        extensionId: selectedEntry.extensionId,
      },
    } as ApkSelectionState;

    this._setPersistedSelectionState(nextPersisted);
    return this.getApkSelectionState();
  };

  override clearApkSourceSelection = (sourceKey: string): ApkSelectionState => {
    const normalizedSourceKey = this._toSourceKey(sourceKey.trim());
    if (normalizedSourceKey.length === 0) {
      return this.getApkSelectionState();
    }

    const currentPersisted = this._getPersistedSelectionState();
    if (!(normalizedSourceKey in currentPersisted)) {
      return this.getApkSelectionState();
    }

    const nextPersisted = { ...currentPersisted };
    delete nextPersisted[normalizedSourceKey];
    this._setPersistedSelectionState(nextPersisted);
    return this.getApkSelectionState();
  };

  override getActiveApkMappings = (): ApkActiveMapping[] => {
    const selectionState = this.getApkSelectionState();
    const mappings = this.getApkSourceMappings();

    return Object.entries(selectionState)
      .map(([sourceKey, selection]) => {
        if (selection.extensionId === undefined) {
          return undefined;
        }

        const selectedMapping = mappings.find(
          (entry) =>
            this._toSourceKey(entry.apk.sourceKey) === sourceKey &&
            entry.apk.packageName === selection.selectedPackageName &&
            entry.extensionId === selection.extensionId
        );
        if (selectedMapping === undefined || selectedMapping.extensionName === undefined) {
          return undefined;
        }

        return {
          sourceKey,
          selectedPackageName: selectedMapping.apk.packageName,
          extensionId: selectedMapping.extensionId,
          extensionName: selectedMapping.extensionName,
          filePath: selectedMapping.apk.filePath,
          version: selectedMapping.apk.version,
        } as ApkActiveMapping;
      })
      .filter((entry): entry is ApkActiveMapping => entry !== undefined)
      .sort((left, right) => left.sourceKey.localeCompare(right.sourceKey));
  };

  private _applyApkSelectionOverrides = <
    T extends { metadata: { id: string; name: string }; client: unknown }
  >(
    extensions: { [key: string]: T }
  ) => {
    const activeMappings = this.getActiveApkMappings();

    activeMappings.forEach((mapping) => {
      const extension = extensions[mapping.extensionId];
      if (extension === undefined) {
        return;
      }

      const profile = getApkAdapterProfile(mapping);
      const labeledName =
        profile?.metadataName ||
        (mapping.version ? `${extension.metadata.name} (APK ${mapping.version})` : `${extension.metadata.name} (APK)`);

      extensions[mapping.extensionId] = {
        ...extension,
        metadata: {
          ...extension.metadata,
          name: labeledName,
        },
      };
    });

    return extensions;
  };

  private _applyApkAdapterProfiles = <
    T extends {
      metadata: { id: string; name: string };
      client: { setSettings?: (settings: { [key: string]: unknown }) => void };
    }
  >(
    extensions: { [key: string]: T }
  ) => {
    const activeMappings = this.getActiveApkMappings();

    activeMappings.forEach((mapping) => {
      const extension = extensions[mapping.extensionId];
      if (extension === undefined) {
        return;
      }

      const profile = getApkAdapterProfile(mapping);
      if (profile === undefined) {
        return;
      }

      if (typeof extension.client.setSettings === 'function') {
        extension.client.setSettings(profile.settingsOverride);
      }
    });

    return extensions;
  };

  private _applyApkModeFiltering = <T extends { metadata: { id: string } }>(
    extensions: { [key: string]: T }
  ) => {
    const runtimeConfig = this.getApkRuntimeConfig();
    if (runtimeConfig.apkOnlyMode !== true && runtimeConfig.adapterRequiredMode !== true) {
      return extensions;
    }

    const activeMappings = this.getActiveApkMappings();
    const adapterEligibleMappings = this._getAdapterEligibleMappings(activeMappings);

    const allowedIds = new Set(
      (runtimeConfig.adapterRequiredMode === true ? adapterEligibleMappings : activeMappings).map(
        (mapping) => mapping.extensionId
      )
    );

    return Object.fromEntries(
      Object.entries(extensions).filter(([extensionId]) => allowedIds.has(extensionId))
    ) as { [key: string]: T };
  };

  private _createExtensionEntry = <T extends { METADATA: ExtensionMetadata } & {
    ExtensionClient: new (webviewFn: WebviewFunc) => ExtensionClientInterface;
  }>(
    extensionModule: T
  ) => {
    return {
      metadata: extensionModule.METADATA,
      client: new extensionModule.ExtensionClient(this._webviewFn),
    };
  };

  private _buildBaseExtensions = () => {
    return {
      [anatanomotokare.METADATA.id]: this._createExtensionEntry(anatanomotokare),
      [arcrelight.METADATA.id]: this._createExtensionEntry(arcrelight),
      [assortedscans.METADATA.id]: this._createExtensionEntry(assortedscans),
      [comick.METADATA.id]: this._createExtensionEntry(comick),
      [deathtollscans.METADATA.id]: this._createExtensionEntry(deathtollscans),
      [disasterscans.METADATA.id]: this._createExtensionEntry(disasterscans),
      [guya.METADATA.id]: this._createExtensionEntry(guya),
      [hniscantrad.METADATA.id]: this._createExtensionEntry(hniscantrad),
      [immortalupdates.METADATA.id]: this._createExtensionEntry(immortalupdates),
      [isekaiscan.METADATA.id]: this._createExtensionEntry(isekaiscan),
      [kireicake.METADATA.id]: this._createExtensionEntry(kireicake),
      [komga.METADATA.id]: this._createExtensionEntry(komga),
      [komikcast.METADATA.id]: this._createExtensionEntry(komikcast),
      [kouhaiwork.METADATA.id]: this._createExtensionEntry(kouhaiwork),
      [lecercleduscan.METADATA.id]: this._createExtensionEntry(lecercleduscan),
      [leviatanscans.METADATA.id]: this._createExtensionEntry(leviatanscans),
      [lilyreader.METADATA.id]: this._createExtensionEntry(lilyreader),
      [lupiteam.METADATA.id]: this._createExtensionEntry(lupiteam),
      [manga347.METADATA.id]: this._createExtensionEntry(manga347),
      [mangabat.METADATA.id]: this._createExtensionEntry(mangabat),
      [mangadex.METADATA.id]: this._createExtensionEntry(mangadex),
      [mangakakalot.METADATA.id]: this._createExtensionEntry(mangakakalot),
      [mangakatana.METADATA.id]: this._createExtensionEntry(mangakatana),
      [mangakik.METADATA.id]: this._createExtensionEntry(mangakik),
      [mangalife.METADATA.id]: this._createExtensionEntry(mangalife),
      [manganato.METADATA.id]: this._createExtensionEntry(manganato),
      [mangapill.METADATA.id]: this._createExtensionEntry(mangapill),
      [mangasee.METADATA.id]: this._createExtensionEntry(mangasee),
      [mangatellers.METADATA.id]: this._createExtensionEntry(mangatellers),
      [menudofansub.METADATA.id]: this._createExtensionEntry(menudofansub),
      [nana.METADATA.id]: this._createExtensionEntry(nana),
      [nhentai.METADATA.id]: this._createExtensionEntry(nhentai),
      [nifteam.METADATA.id]: this._createExtensionEntry(nifteam),
      [phoenixscans.METADATA.id]: this._createExtensionEntry(phoenixscans),
      [readcomiconline.METADATA.id]: this._createExtensionEntry(readcomiconline),
      [sensescans.METADATA.id]: this._createExtensionEntry(sensescans),
      [silentsky.METADATA.id]: this._createExtensionEntry(silentsky),
      [sleepingknightscans.METADATA.id]: this._createExtensionEntry(sleepingknightscans),
      [tcbscans.METADATA.id]: this._createExtensionEntry(tcbscans),
      [toonily.METADATA.id]: this._createExtensionEntry(toonily),
      [tortugaceviri.METADATA.id]: this._createExtensionEntry(tortugaceviri),
      [tritiniascans.METADATA.id]: this._createExtensionEntry(tritiniascans),
      [tuttoanimemanga.METADATA.id]: this._createExtensionEntry(tuttoanimemanga),
      [yuriism.METADATA.id]: this._createExtensionEntry(yuriism),
      [zandynofansub.METADATA.id]: this._createExtensionEntry(zandynofansub),
    };
  };

  override getExtensions = () => {
    const baseExtensions = this._buildBaseExtensions();
    return this._applyApkModeFiltering(
      this._applyApkAdapterProfiles(this._applyApkSelectionOverrides(baseExtensions))
    );
  };
}
