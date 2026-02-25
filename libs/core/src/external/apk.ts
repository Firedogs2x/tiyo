import { ApkExtensionInfo, ApkRuntimeConfig, ApkSelectionState } from '@tiyo/common';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const APK_SUFFIX = '.apk';
const DEFAULT_FOLDER_NAME = 'Keiyoushi APK Extensions';
const SELECTION_FILE_NAME = 'keiyoushi-apk-selection.json';
const CONFIG_FILE_NAME = 'keiyoushi-apk-config.json';

const SOURCE_NAME_MAP: { [key: string]: string } = {
  mangadex: 'MangaDex',
};

const toTitleCase = (value: string): string => {
  return value
    .split(/[-_\s]+/)
    .filter((entry) => entry.length > 0)
    .map((entry) => entry.charAt(0).toUpperCase() + entry.slice(1))
    .join(' ');
};

export const getDefaultApkExtensionsDirectory = (): string => {
  const appData = process.env['APPDATA'];
  if (appData !== undefined && appData.length > 0) {
    return path.join(appData, 'Houdoku', DEFAULT_FOLDER_NAME);
  }

  return path.join(os.homedir(), '.houdoku', DEFAULT_FOLDER_NAME);
};

export const getDefaultApkSelectionFilePath = (): string => {
  return path.join(path.dirname(getDefaultApkExtensionsDirectory()), SELECTION_FILE_NAME);
};

export const getDefaultApkConfigFilePath = (): string => {
  return path.join(path.dirname(getDefaultApkExtensionsDirectory()), CONFIG_FILE_NAME);
};

export const readApkRuntimeConfig = (
  filePath: string = getDefaultApkConfigFilePath()
): ApkRuntimeConfig => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const rawContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const parsed = JSON.parse(rawContent) as ApkRuntimeConfig;
    if (parsed === null || typeof parsed !== 'object') {
      return {};
    }

    const directory = (parsed as { apkExtensionsDirectory?: unknown }).apkExtensionsDirectory;
    const apkOnlyMode = (parsed as { apkOnlyMode?: unknown }).apkOnlyMode;
    const adapterRequiredMode = (parsed as { adapterRequiredMode?: unknown }).adapterRequiredMode;

    const config: ApkRuntimeConfig = {};
    if (typeof directory === 'string' && directory.trim().length > 0) {
      config.apkExtensionsDirectory = directory.trim();
    }
    if (typeof apkOnlyMode === 'boolean') {
      config.apkOnlyMode = apkOnlyMode;
    }
    if (typeof adapterRequiredMode === 'boolean') {
      config.adapterRequiredMode = adapterRequiredMode;
    }

    return config;
  } catch {
    return {};
  }
};

export const writeApkRuntimeConfig = (
  config: ApkRuntimeConfig,
  filePath: string = getDefaultApkConfigFilePath()
): void => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), { encoding: 'utf-8' });
};

export const readApkSelectionState = (
  filePath: string = getDefaultApkSelectionFilePath()
): ApkSelectionState => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const rawContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const parsed = JSON.parse(rawContent) as ApkSelectionState;

    if (parsed === null || typeof parsed !== 'object') {
      return {};
    }

    return Object.entries(parsed).reduce((acc, [sourceKey, value]) => {
      if (value === null || typeof value !== 'object') {
        return acc;
      }

      const selectedPackageName = (value as { selectedPackageName?: unknown }).selectedPackageName;
      const extensionId = (value as { extensionId?: unknown }).extensionId;
      if (typeof selectedPackageName !== 'string' || selectedPackageName.length === 0) {
        return acc;
      }

      acc[sourceKey.toLowerCase()] = {
        selectedPackageName,
        extensionId: typeof extensionId === 'string' ? extensionId : undefined,
      };

      return acc;
    }, {} as ApkSelectionState);
  } catch {
    return {};
  }
};

export const writeApkSelectionState = (
  state: ApkSelectionState,
  filePath: string = getDefaultApkSelectionFilePath()
): void => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), { encoding: 'utf-8' });
};

const parseFileName = (fileName: string): Omit<ApkExtensionInfo, 'filePath' | 'fileName'> => {
  const withoutSuffix = fileName.slice(0, fileName.length - APK_SUFFIX.length);
  const tachiyomiMatch = /^tachiyomi-([^.]+)\.(.+?)-v([\d.]+)$/i.exec(withoutSuffix);

  if (tachiyomiMatch !== null) {
    const packageName = `tachiyomi-${tachiyomiMatch[1]}.${tachiyomiMatch[2]}`;
    const sourceKey = tachiyomiMatch[2].toLowerCase();
    return {
      packageName,
      sourceKey,
      sourceName: SOURCE_NAME_MAP[sourceKey] || toTitleCase(sourceKey),
      version: tachiyomiMatch[3],
    };
  }

  const packageName = withoutSuffix;
  const sourceKey = withoutSuffix.toLowerCase();
  return {
    packageName,
    sourceKey,
    sourceName: toTitleCase(withoutSuffix),
    version: undefined,
  };
};

export const getApkExtensionInfoList = (
  directory: string = getDefaultApkExtensionsDirectory()
): ApkExtensionInfo[] => {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const apkEntries = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(APK_SUFFIX))
    .map((entry) => {
      const parsed = parseFileName(entry.name);
      return {
        filePath: path.join(directory, entry.name),
        fileName: entry.name,
        packageName: parsed.packageName,
        sourceKey: parsed.sourceKey,
        sourceName: parsed.sourceName,
        version: parsed.version,
      } as ApkExtensionInfo;
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName));

  return apkEntries;
};