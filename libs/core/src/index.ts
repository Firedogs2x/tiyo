import {
  ApkActiveMapping,
  ApkExtensionInfo,
  ApkMigrationEntry,
  ApkMigrationReport,
  ApkRuntimeConfig,
  ApkRuntimeDiagnostic,
  ApkRuntimeMessage,
  ApkRuntimeState,
  ApkSelectionState,
  ApkSourceMapping,
  TiyoClientAbstract,
  WebviewFunc,
} from '@tiyo/common';
import fs from 'node:fs';
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
  getApkExtensionInfoList,
  getDefaultApkConfigFilePath,
  getDefaultApkExtensionsDirectory,
  getDefaultApkSelectionFilePath,
  readApkRuntimeConfig,
  readApkSelectionState,
  writeApkRuntimeConfig,
  writeApkSelectionState,
} from './external/apk';
import { getApkAdapterProfile, hasApkAdapterProfile } from './external/apk-adapters';
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

  override getApkExtensionsDirectory = () => {
    const configuredDirectory = process.env['TIYO_APK_EXTENSIONS_DIR'];
    if (configuredDirectory !== undefined && configuredDirectory.length > 0) {
      return configuredDirectory;
    }

    const persistedDirectory = this.getApkRuntimeConfig().apkExtensionsDirectory;
    if (persistedDirectory !== undefined && persistedDirectory.length > 0) {
      return persistedDirectory;
    }

    return getDefaultApkExtensionsDirectory();
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
      nextConfig.adapterRequiredMode === undefined
    ) {
      this._setPersistedRuntimeConfig({});
      return;
    }

    this._setPersistedRuntimeConfig(nextConfig);
  };

  override getApkRuntimeConfig = () => {
    return this._getPersistedRuntimeConfig();
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
    const sourceMappings = this.getApkSourceMappings();
    const activeMappings = this.getActiveApkMappings();

    const entries: ApkMigrationEntry[] = this._getBuiltInMetadataList()
      .map((metadata) => {
        const sourceKey = toCanonicalSourceKey(metadata.name);

        const supportedMappings = sourceMappings.filter(
          (entry) => entry.extensionId === metadata.id && entry.supported
        );
        const hasSupportedMapping = supportedMappings.length > 0;

        const hasAnyApkForSourceKey = sourceMappings.some(
          (entry) => toCanonicalSourceKey(entry.apk.sourceKey) === sourceKey
        );

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

  private _getApkRuntimeMessages = (
    apkExtensionsDirectory: string,
    sourceMappings: ApkSourceMapping[],
    selectionState: ApkSelectionState,
    activeMappings: ApkActiveMapping[],
    runtimeConfig: ApkRuntimeConfig
  ): ApkRuntimeMessage[] => {
    const messages: ApkRuntimeMessage[] = [];

    if (!fs.existsSync(apkExtensionsDirectory)) {
      messages.push({
        type: 'warning',
        code: 'APK_DIR_MISSING',
        text: `APK directory does not exist: ${apkExtensionsDirectory}`,
      });
      return messages;
    }

    const stat = fs.statSync(apkExtensionsDirectory);
    if (!stat.isDirectory()) {
      messages.push({
        type: 'error',
        code: 'APK_DIR_INVALID',
        text: `Configured APK path is not a directory: ${apkExtensionsDirectory}`,
      });
      return messages;
    }

    if (sourceMappings.length === 0) {
      messages.push({
        type: 'info',
        code: 'APK_NONE_FOUND',
        text: 'No APK files found in the configured directory.',
      });
      return messages;
    }

    const unsupportedCount = sourceMappings.filter((entry) => !entry.supported).length;
    if (unsupportedCount > 0) {
      messages.push({
        type: 'warning',
        code: 'APK_UNSUPPORTED_PRESENT',
        text: `${unsupportedCount} APK file(s) are detected but not mapped to a supported source yet.`,
      });
    }

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

    return messages;
  };

  private _getApkRuntimeDiagnostics = (
    sourceMappings: ApkSourceMapping[],
    selectionState: ApkSelectionState,
    activeMappings: ApkActiveMapping[]
  ): ApkRuntimeDiagnostic[] => {
    const diagnostics: ApkRuntimeDiagnostic[] = [];

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

    const mappingsByPackageName = sourceMappings.reduce((acc, entry) => {
      if (acc[entry.apk.packageName] === undefined) {
        acc[entry.apk.packageName] = [];
      }
      acc[entry.apk.packageName].push(entry);
      return acc;
    }, {} as { [packageName: string]: ApkSourceMapping[] });

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

    const mappingsBySourceVersion = sourceMappings.reduce((acc, entry) => {
      const versionKey = entry.apk.version || 'unknown';
      const key = `${entry.apk.sourceKey}::${versionKey}`;
      if (acc[key] === undefined) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    }, {} as { [key: string]: ApkSourceMapping[] });

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

    return diagnostics.sort((left, right) => {
      const sourceCompare = left.sourceKey.localeCompare(right.sourceKey);
      if (sourceCompare !== 0) {
        return sourceCompare;
      }
      return left.fileName.localeCompare(right.fileName);
    });
  };

  override getApkRuntimeState = (): ApkRuntimeState => {
    const runtimeConfig = this.getApkRuntimeConfig();
    const apkExtensionsDirectory = this.getApkExtensionsDirectory();
    const apkExtensions = this.getApkExtensions();
    const sourceMappings = this.getApkSourceMappings();
    const selectionState = this.getApkSelectionState();
    const activeMappings = this.getActiveApkMappings();
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

    return {
      runtimeConfig,
      apkExtensionsDirectory,
      apkExtensions,
      sourceMappings,
      selectionState,
      activeMappings,
      messages,
      diagnostics,
    };
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
    return this._apkExtensionsCache;
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

  private _getMappedBySource = () => {
    return this.getApkSourceMappings()
      .filter((entry) => entry.supported)
      .reduce((acc, entry) => {
        if (acc[entry.apk.sourceKey] === undefined) {
          acc[entry.apk.sourceKey] = [];
        }
        acc[entry.apk.sourceKey].push(entry);
        return acc;
      }, {} as { [sourceKey: string]: ApkSourceMapping[] });
  };

  override getApkSelectionState = (): ApkSelectionState => {
    const selectionRaw = process.env['TIYO_APK_SOURCE_SELECTION'];
    const mappedBySource = this._getMappedBySource();

    const selectionState: ApkSelectionState = {};
    const parseVersion = (value: string | undefined): number[] => {
      if (value === undefined) {
        return [0];
      }

      return value
        .split('.')
        .map((part) => Number.parseInt(part, 10))
        .map((part) => (Number.isNaN(part) ? 0 : part));
    };

    const compareVersionDesc = (left: string | undefined, right: string | undefined): number => {
      const leftParts = parseVersion(left);
      const rightParts = parseVersion(right);
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

    Object.entries(mappedBySource).forEach(([sourceKey, entries]) => {
      const sortedEntries = [...entries].sort((left, right) => {
        const versionCompare = compareVersionDesc(left.apk.version, right.apk.version);
        if (versionCompare !== 0) {
          return versionCompare;
        }
        return left.apk.fileName.localeCompare(right.apk.fileName);
      });

      const newestEntry = sortedEntries[0];
      if (newestEntry !== undefined) {
        selectionState[sourceKey] = {
          selectedPackageName: newestEntry.apk.packageName,
          extensionId: newestEntry.extensionId,
        };
      }
    });

    const persistedState = this._getPersistedSelectionState();
    Object.entries(persistedState).forEach(([sourceKey, persistedSelection]) => {
      const sourceEntries = mappedBySource[sourceKey] || [];
      const selectedEntry = sourceEntries.find(
        (entry) => entry.apk.packageName === persistedSelection.selectedPackageName
      );
      if (selectedEntry === undefined) {
        return;
      }
      selectionState[sourceKey] = {
        selectedPackageName: selectedEntry.apk.packageName,
        extensionId: selectedEntry.extensionId,
      };
    });

    if (selectionRaw !== undefined && selectionRaw.trim().length > 0) {
      selectionRaw
        .split(';')
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0)
        .forEach((segment) => {
          const [sourceKeyRaw, packageNameRaw] = segment.split('=');
          if (sourceKeyRaw === undefined || packageNameRaw === undefined) {
            return;
          }
          const sourceKey = sourceKeyRaw.trim().toLowerCase();
          const packageName = packageNameRaw.trim();
          const sourceEntries = mappedBySource[sourceKey] || [];
          const selectedEntry = sourceEntries.find(
            (entry) => entry.apk.packageName === packageName
          );
          if (selectedEntry === undefined) {
            return;
          }
          selectionState[sourceKey] = {
            selectedPackageName: selectedEntry.apk.packageName,
            extensionId: selectedEntry.extensionId,
          };
        });
    }

    return selectionState;
  };

  override setApkSourceSelection = (
    sourceKey: string,
    selectedPackageName: string
  ): ApkSelectionState => {
    const normalizedSourceKey = sourceKey.trim().toLowerCase();
    const normalizedPackageName = selectedPackageName.trim();
    if (normalizedSourceKey.length === 0 || normalizedPackageName.length === 0) {
      return this.getApkSelectionState();
    }

    const sourceEntries = this._getMappedBySource()[normalizedSourceKey] || [];
    const selectedEntry = sourceEntries.find(
      (entry) => entry.apk.packageName === normalizedPackageName
    );
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
    const normalizedSourceKey = sourceKey.trim().toLowerCase();
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
            entry.apk.sourceKey === sourceKey &&
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

  // prettier-ignore
  override getExtensions = () => this._applyApkModeFiltering(this._applyApkAdapterProfiles(this._applyApkSelectionOverrides({
    [anatanomotokare.METADATA.id]: { metadata: anatanomotokare.METADATA, client: new anatanomotokare.ExtensionClient(this._webviewFn)},
    [arcrelight.METADATA.id]: { metadata: arcrelight.METADATA, client: new arcrelight.ExtensionClient(this._webviewFn)},
    [assortedscans.METADATA.id]: { metadata: assortedscans.METADATA, client: new assortedscans.ExtensionClient(this._webviewFn)},
    [comick.METADATA.id]: { metadata: comick.METADATA, client: new comick.ExtensionClient(this._webviewFn)},
    [deathtollscans.METADATA.id]: { metadata: deathtollscans.METADATA, client: new deathtollscans.ExtensionClient(this._webviewFn)},
    [disasterscans.METADATA.id]: { metadata: disasterscans.METADATA, client: new disasterscans.ExtensionClient(this._webviewFn)},
    [guya.METADATA.id]: { metadata: guya.METADATA, client: new guya.ExtensionClient(this._webviewFn)},
    [hniscantrad.METADATA.id]: { metadata: hniscantrad.METADATA, client: new hniscantrad.ExtensionClient(this._webviewFn)},
    [immortalupdates.METADATA.id]: { metadata: immortalupdates.METADATA, client: new immortalupdates.ExtensionClient(this._webviewFn)},
    [isekaiscan.METADATA.id]: { metadata: isekaiscan.METADATA, client: new isekaiscan.ExtensionClient(this._webviewFn)},
    [kireicake.METADATA.id]: { metadata: kireicake.METADATA, client: new kireicake.ExtensionClient(this._webviewFn)},
    [komga.METADATA.id]: { metadata: komga.METADATA, client: new komga.ExtensionClient(this._webviewFn)},
    [komikcast.METADATA.id]: { metadata: komikcast.METADATA, client: new komikcast.ExtensionClient(this._webviewFn)},
    [kouhaiwork.METADATA.id]: { metadata: kouhaiwork.METADATA, client: new kouhaiwork.ExtensionClient(this._webviewFn)},
    [lecercleduscan.METADATA.id]: { metadata: lecercleduscan.METADATA, client: new lecercleduscan.ExtensionClient(this._webviewFn)},
    [leviatanscans.METADATA.id]: { metadata: leviatanscans.METADATA, client: new leviatanscans.ExtensionClient(this._webviewFn)},
    [lilyreader.METADATA.id]: { metadata: lilyreader.METADATA, client: new lilyreader.ExtensionClient(this._webviewFn)},
    [lupiteam.METADATA.id]: { metadata: lupiteam.METADATA, client: new lupiteam.ExtensionClient(this._webviewFn)},
    [manga347.METADATA.id]: { metadata: manga347.METADATA, client: new manga347.ExtensionClient(this._webviewFn)},
    [mangabat.METADATA.id]: { metadata: mangabat.METADATA, client: new mangabat.ExtensionClient(this._webviewFn)},
    [mangadex.METADATA.id]: { metadata: mangadex.METADATA, client: new mangadex.ExtensionClient(this._webviewFn)},
    [mangakakalot.METADATA.id]: { metadata: mangakakalot.METADATA, client: new mangakakalot.ExtensionClient(this._webviewFn)},
    [mangakatana.METADATA.id]: { metadata: mangakatana.METADATA, client: new mangakatana.ExtensionClient(this._webviewFn)},
    [mangakik.METADATA.id]: { metadata: mangakik.METADATA, client: new mangakik.ExtensionClient(this._webviewFn)},
    [mangalife.METADATA.id]: { metadata: mangalife.METADATA, client: new mangalife.ExtensionClient(this._webviewFn)},
    [manganato.METADATA.id]: { metadata: manganato.METADATA, client: new manganato.ExtensionClient(this._webviewFn)},
    [mangapill.METADATA.id]: { metadata: mangapill.METADATA, client: new mangapill.ExtensionClient(this._webviewFn)},
    [mangasee.METADATA.id]: { metadata: mangasee.METADATA, client: new mangasee.ExtensionClient(this._webviewFn)},
    [mangatellers.METADATA.id]: { metadata: mangatellers.METADATA, client: new mangatellers.ExtensionClient(this._webviewFn)},
    [menudofansub.METADATA.id]: { metadata: menudofansub.METADATA, client: new menudofansub.ExtensionClient(this._webviewFn)},
    [nana.METADATA.id]: { metadata: nana.METADATA, client: new nana.ExtensionClient(this._webviewFn)},
    [nhentai.METADATA.id]: { metadata: nhentai.METADATA, client: new nhentai.ExtensionClient(this._webviewFn)},
    [nifteam.METADATA.id]: { metadata: nifteam.METADATA, client: new nifteam.ExtensionClient(this._webviewFn)},
    [phoenixscans.METADATA.id]: { metadata: phoenixscans.METADATA, client: new phoenixscans.ExtensionClient(this._webviewFn)},
    [readcomiconline.METADATA.id]: { metadata: readcomiconline.METADATA, client: new readcomiconline.ExtensionClient(this._webviewFn)},
    [sensescans.METADATA.id]: { metadata: sensescans.METADATA, client: new sensescans.ExtensionClient(this._webviewFn)},
    [silentsky.METADATA.id]: { metadata: silentsky.METADATA, client: new silentsky.ExtensionClient(this._webviewFn)},
    [sleepingknightscans.METADATA.id]: { metadata: sleepingknightscans.METADATA, client: new sleepingknightscans.ExtensionClient(this._webviewFn)},
    [tcbscans.METADATA.id]: { metadata: tcbscans.METADATA, client: new tcbscans.ExtensionClient(this._webviewFn)},
    [toonily.METADATA.id]: { metadata: toonily.METADATA, client: new toonily.ExtensionClient(this._webviewFn)},
    [tortugaceviri.METADATA.id]: { metadata: tortugaceviri.METADATA, client: new tortugaceviri.ExtensionClient(this._webviewFn)},
    [tritiniascans.METADATA.id]: { metadata: tritiniascans.METADATA, client: new tritiniascans.ExtensionClient(this._webviewFn)},
    [tuttoanimemanga.METADATA.id]: { metadata: tuttoanimemanga.METADATA, client: new tuttoanimemanga.ExtensionClient(this._webviewFn)},
    [yuriism.METADATA.id]: { metadata: yuriism.METADATA, client: new yuriism.ExtensionClient(this._webviewFn)},
    [zandynofansub.METADATA.id]: { metadata: zandynofansub.METADATA, client: new zandynofansub.ExtensionClient(this._webviewFn)},
  })));
}
