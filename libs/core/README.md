# core

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build core` to build the library.

## APK runtime integration

`TiyoClient` now exposes optional APIs for folder-based Keiyoushi APK discovery and source selection.

### One-call runtime snapshot

- `getApkRuntimeState()`
  - Returns runtime config, effective APK directory, discovered APK files, source mappings,
    current selection state, active mappings, runtime validation messages, and per-APK diagnostics.

- `refreshApkRuntimeState()`
  - Forces folder rescan, then returns the updated runtime snapshot.

- `getApkMigrationReport()`
  - Returns per-source migration status for built-in extensions with summary counts.
  - Status values: `adapter-ready`, `mapped`, `unmapped`.

### Runtime messages

`getApkRuntimeState()` and `refreshApkRuntimeState()` include a `messages` array for UI feedback.

They also include a `diagnostics` array for row-level APK feedback.

Current message codes:

- `APK_DIR_MISSING`
- `APK_DIR_INVALID`
- `APK_NONE_FOUND`
- `APK_UNSUPPORTED_PRESENT`
- `APK_SELECTION_UNRESOLVED`
- `APK_NO_ACTIVE_MAPPING`
- `APK_ONLY_MODE_EMPTY`
- `APK_ADAPTER_REQUIRED_EMPTY`

Current diagnostic codes:

- `APK_SOURCE_UNSUPPORTED`
- `APK_DUPLICATE_PACKAGE`
- `APK_DUPLICATE_SOURCE_VERSION`
- `APK_SELECTED_NOT_ACTIVE`
- `APK_ADAPTER_PROFILE_ACTIVE`
- `APK_ENDPOINT_OVERRIDE_ACTIVE`
- `APK_ACTIVE_MAPPING_NO_ADAPTER`

### Folder and selection management

- `getApkExtensionsDirectory()`
- `setApkExtensionsDirectory(directory)`
- `clearApkExtensionsDirectory()`
- `setApkOnlyMode(enabled)`
- `setAdapterRequiredMode(enabled)`
- `refreshApkExtensions()`
- `setApkSourceSelection(sourceKey, selectedPackageName)`
- `clearApkSourceSelection(sourceKey)`

When `apkOnlyMode` is enabled, `getExtensions()` returns only sources with active APK mappings.

When `adapterRequiredMode` is enabled, `getExtensions()` returns only sources whose active APK
mapping has a defined adapter profile.

### Resolution order

Effective APK folder path:
1. `TIYO_APK_EXTENSIONS_DIR` env override
2. persisted runtime config
3. default `%APPDATA%/Houdoku/Keiyoushi APK Extensions`

Effective source selection:
1. newest supported APK per source (auto default)
2. persisted selection file override
3. `TIYO_APK_SOURCE_SELECTION` env override

### Suggested Houdoku UI call flow

1. App settings open: call `getApkRuntimeState()`.
2. User changes folder: call `setApkExtensionsDirectory(...)`, then `refreshApkRuntimeState()`.
3. User clicks refresh: call `refreshApkRuntimeState()`.
4. User toggles APK-only mode: call `setApkOnlyMode(...)`, then `getApkRuntimeState()`.
5. User toggles adapter-required mode: call `setAdapterRequiredMode(...)`, then `getApkRuntimeState()`.
6. User selects APK in dropdown: call `setApkSourceSelection(sourceKey, selectedPackageName)`.
7. User clears selection: call `clearApkSourceSelection(sourceKey)`.
