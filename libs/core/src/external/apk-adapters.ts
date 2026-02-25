import { ApkActiveMapping } from '@tiyo/common';

export type ApkAdapterProfile = {
  metadataName: string;
  settingsOverride: { [key: string]: unknown };
};

const parseVersion = (value: string | undefined): number[] => {
  if (value === undefined) {
    return [0];
  }

  return value
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isNaN(part) ? 0 : part));
};

const isVersionAtLeast = (version: string | undefined, baseline: string): boolean => {
  const left = parseVersion(version);
  const right = parseVersion(baseline);
  const maxLen = Math.max(left.length, right.length);

  for (let index = 0; index < maxLen; index += 1) {
    const leftPart = left[index] || 0;
    const rightPart = right[index] || 0;
    if (leftPart !== rightPart) {
      return leftPart > rightPart;
    }
  }

  return true;
};

export const getApkAdapterProfile = (
  mapping: ApkActiveMapping
): ApkAdapterProfile | undefined => {
  if (mapping.sourceKey !== 'mangadex') {
    return undefined;
  }

  const metadataName = mapping.version
    ? `MangaDex (Keiyoushi ${mapping.version})`
    : 'MangaDex (Keiyoushi APK)';

  const settingsOverride: { [key: string]: unknown } = {};

  settingsOverride['API base URL'] = 'https://api.mangadex.org';
  settingsOverride['Uploads base URL'] = 'https://uploads.mangadex.org';

  if (isVersionAtLeast(mapping.version, '1.4.206')) {
    settingsOverride['Use data saver'] = false;
  }

  return {
    metadataName,
    settingsOverride,
  };
};
