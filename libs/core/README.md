# core

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build core` to build the library.

## APK runtime integration

`TiyoClient` now exposes optional APIs for folder-based Keiyoushi APK discovery and source selection.

### One-call runtime snapshot

- `getApkRuntimeState()`
  - Returns runtime config, effective APK directory, discovered APK files, source mappings,
    grouped source options, current selection state, active mappings, runtime validation messages,
    per-APK diagnostics, `adapterSupportedSourceKeys`, `healthSummary`, `actionHints`, and
    `sourceReadinessSummaries`, plus `preferredSelectionCandidates`.
  - Includes `runtimeStateVersion` (stable content hash) for lightweight UI change detection.

- `getApkSourceGroups()`
  - Returns source-grouped dropdown-ready options with selection/active flags.
  - Group `sourceKey` values are canonicalized for stable matching (case and alias safe).

- `getApkUnneededExtensions()`
  - Returns APK files that are safe candidates for cleanup before Houdoku testing.
  - Reason values: `unsupported-source`, `not-selected-duplicate`.
  - Helps keep folder contents minimal without deleting built-in extension code.

- `cleanupUnneededApkExtensions(apply?)`
  - Executes unneeded APK cleanup in `dry-run` mode by default (`apply = false`).
  - When `apply = true`, deletes only candidate files that resolve inside the configured APK directory.
  - Cleanup policy can be set via options:
    - `all-unneeded` (default)
    - `unsupported-only`
  - Returns summary counts and per-file operation results, plus `unneededAfter` for post-cleanup UI refresh.

- `getApkSourceReadinessSummaries()`
  - Returns source-level readiness statuses for dropdown badges.
  - Status values: `ready`, `no-selection`, `selected-not-active`, `unsupported-only`,
    `adapter-required-missing-adapter`.

- `getApkPreferredSelectionCandidates()`
  - Returns deterministic fallback selection candidates per source.
  - Reason values: `selected-still-valid`, `newest-supported`,
    `adapter-required-supported`, `none-eligible`.

- `autoSelectPreferredApk(sourceKey)`
  - Applies preferred candidate selection for a source when available.
  - Returns updated effective selection state.

- `autoSelectPreferredApkWithResult(sourceKey)`
  - Applies preferred candidate selection and returns per-source operation result.
  - Result status values: `applied`, `skipped-no-source`, `skipped-no-candidate`,
    `skipped-invalid-candidate`, `skipped-already-selected`.

- `autoSelectAllPreferredApks()`
  - Applies preferred candidate selections for all eligible sources.
  - Returns updated effective selection state.

- `autoSelectAllPreferredApksWithResult()`
  - Applies preferred candidate selections in bulk and returns detailed per-source results.
  - Includes `appliedCount`, `skippedCount`, and final `selectionState`.

- `repairApkRuntimeState()`
  - Runs bulk preferred selection repair and returns a refreshed runtime snapshot.
  - Response includes `lastRepair` metadata (`timestamp`, `appliedCount`, `skippedCount`),
    plus `operation` (bulk result details) and `runtimeState`.
  - `lastRepair` is persisted in runtime config and remains available across app restarts.

- `getLastApkRepairMetadata()`
  - Returns persisted `lastRepair` metadata directly from runtime config.
  - Useful for lightweight UI status displays without requesting full runtime state.

- `getApkSelectionRecommendations()`
  - Returns selected package recommendation per source with reason metadata.
  - Reason values: `newest-supported`, `persisted-selection`, `env-override`.

- `cleanupApkSelectionState()`
  - Removes persisted selections that point to APKs no longer present (or no longer supported).
  - Returns `{ removed, selectionState }` so UI/logging can show what changed.
  - Also runs automatically when `refreshApkExtensions()` is called.

- `getApkRuntimeHealthSummary()`
  - Returns compact counts and blocking flags for UI status badges.
  - Includes `warningCount`, `errorCount`, `hasBlockingErrors`, and `blockingCodes`.

- `getApkRuntimeDigest()`
  - Returns a compact status payload for lightweight polling.
  - Includes `runtimeStateVersion`, `healthSummary`, and persisted `lastRepair`.

- `hasApkRuntimeDigestChanged(runtimeStateVersion)`
  - Returns `true` if the provided version differs from current digest version.
  - Useful for polling loops to decide whether full runtime state should be fetched.

- `getApkRuntimePollingDecision(previousRuntimeStateVersion)`
  - Returns `{ changed, digest }` in one call for polling loops.
  - Helps UI avoid a second digest request before deciding to fetch full runtime state.

- `getApkRuntimeQuickStatus(previousRuntimeStateVersion)`
  - Returns minimal polling status:
    `{ changed, hasBlockingErrors, shouldAutoRepair, appliedCount, skippedCount, runtimePollIntervalHintMs, suggestedNextAction }`.
  - Designed for lightweight top-bar/status indicator refresh loops.

- `getApkRuntimeBootstrap(previousRuntimeStateVersion)`
  - Returns `{ quickStatus, digest, runtimeState }` in one call.
  - `runtimeState` is only populated when `quickStatus.changed === true`.

- `runApkRuntimeSuggestedAction(previousRuntimeStateVersion)`
  - Executes the backend-suggested next action from quick status.
  - Returns `{ action, performed, quickStatus, digest, runtimeState, repairResult }`.

- `stabilizeApkRuntimeState(maxSteps?)`
  - Repeatedly executes suggested actions until no action is performed or max steps is reached.
  - Returns `{ steps, repairsRun, finalQuickStatus, finalDigest, finalRuntimeState }`.

- `getApkUiModel(previousRuntimeStateVersion)`
  - Returns a unified UI payload:
    `{ directoryStatus, bootstrap, migrationReport }`.
  - Intended to reduce Houdoku settings-screen orchestration to a single API call.

- `prepareApkRuntimeForHoudokuStartup()`
  - Runs a one-call startup preparation flow for Houdoku integration.
  - Enforces default APK directory, enables APK-only mode, cleans stale selections,
    applies preferred source selections, then returns refreshed runtime state.
  - Returns `{ directoryStatus, runtimeConfig, cleanupResult, autoSelectResult, runtimeState }`.

- `getApkHoudokuReadyStatus()`
  - Returns a compact startup-readiness status for Houdoku UI badges/checks.
  - Includes readiness `level` (`ready` | `warning` | `blocked`), counts, message codes,
    and backend-suggested next action.
  - Designed to avoid fetching full runtime payload for simple status polling.

- `runApkRuntimeMaintenanceCycle(options?)`
  - Runs one consolidated maintenance cycle for Houdoku integration.
  - Sequence: startup preparation -> unneeded APK cleanup (dry-run by default) -> stabilization -> ready status.
  - Options:
    - `applyUnneededCleanup?: boolean` (default `false`)
    - `unneededCleanupPolicy?: 'all-unneeded' | 'unsupported-only'` (default `'all-unneeded'`)
    - `stabilizeMaxSteps?: number` (default `3`)
  - Returns `{ options, startupPreparation, unneededCleanup, stabilization, readyStatus }`.

- `runApkRuntimeStrictStartupGate(options?)`
  - Runs maintenance-cycle and then evaluates strict startup requirements in one call.
  - Default requirements are strict and production-friendly:
    - `requireReadyLevel: 'ready'`
    - `requireNoUnsupportedApks: true`
    - `requireNoUnneededApks: false`
  - Returns `{ options, maintenanceCycle, readyStatus, passed, reasons }` for direct startup gating.

- `getApkRecommendedStrictStartupGate(profile?)`
  - Returns backend-owned strict gate recommendations for `dev`, `test`, or `prod`.
  - Includes recommended options and explanatory notes so Houdoku does not hardcode policy.
  - Default profile is `test`.

- `runApkRecommendedStrictStartupGate(profile?)`
  - Runs strict startup gate using backend recommended options for the selected profile.
  - Useful for one-call startup validation in environment-specific launch flows.

- `getApkStartupRemediationPlan(profile?)`
  - Builds an ordered remediation plan from strict-gate output and runtime action hints.
  - Returns `{ profile, recommendation, strictGate, steps }`.
  - Each step includes severity, text, mapped backend method, and whether it is auto-runnable.

- `runApkStartupRemediation(profile?)`
  - Executes auto-runnable remediation methods for the selected profile.
  - Returns before/after strict gate results and per-step execution outcomes.
  - Response shape: `{ profile, plan, beforeGate, afterGate, improved, stepResults }`.

- `runApkStartupRemediationWithOverrides(profile?, overrides?)`
  - Runs startup remediation with temporary strict-gate and maintenance overrides.
  - Preserves profile defaults while allowing operator-approved runtime adjustments (for example, cleanup policy or gate strictness).
  - Response includes `usedOverrides` for auditability in UI and logs.

- `runApkStartupRemediationUntilStable(options?)`
  - Repeatedly runs startup remediation with overrides until one of:
    - strict gate passes,
    - no improvement is detected,
    - max runs reached.
  - Returns convergence details:
    `{ profile, maxRuns, runs, finalRun, stopReason, converged }`.

- `getApkRuntimeActionHints()`
  - Returns action-oriented remediation hints for current runtime issues.
  - Hint codes cover directory setup, source selection, strict-mode recovery, and repair feedback.

- `refreshApkRuntimeState()`
  - Forces folder rescan, then returns the updated runtime snapshot.

- `getApkMigrationReport()`
  - Returns per-source migration status for built-in extensions with summary counts.
  - Status values: `adapter-ready`, `mapped`, `unmapped`.
  - Each entry also includes `availableApkCount`, `selectedPackageName`, and `selectedVersion`
    so migration UI can render progress without additional joins.

### Runtime messages

`getApkRuntimeState()` and `refreshApkRuntimeState()` include a `messages` array for UI feedback.

They also include a `diagnostics` array for row-level APK feedback.

They include `selectionRecommendations` for selection provenance display.

Current message codes:

- `APK_DIR_MISSING`
- `APK_DIR_INVALID`
- `APK_NONE_FOUND`
- `APK_UNSUPPORTED_PRESENT`
- `APK_SELECTION_UNRESOLVED`
- `APK_NO_ACTIVE_MAPPING`
- `APK_ONLY_MODE_EMPTY`
- `APK_ADAPTER_REQUIRED_EMPTY`
- `APK_REPAIR_APPLIED` (repair response)
- `APK_REPAIR_NOOP` (repair response)

Current diagnostic codes:

- `APK_SOURCE_UNSUPPORTED`
- `APK_DUPLICATE_PACKAGE`
- `APK_DUPLICATE_SOURCE_VERSION`
- `APK_SELECTED_NOT_ACTIVE`
- `APK_ADAPTER_PROFILE_ACTIVE`
- `APK_ENDPOINT_OVERRIDE_ACTIVE`
- `APK_ACTIVE_MAPPING_NO_ADAPTER`

Current built-in adapter profiles:

- `mangadex` (endpoint override profile)
- `mangakakalot`, `mangasee`, `mangapill`, `manganato`, `mangakatana`, `mangabat`
  (metadata labeling profile)

### Folder and selection management

- `getDefaultApkExtensionsDirectoryPath()`
- `useDefaultApkExtensionsDirectory()`
- `enforceDefaultApkDirectory()`
- `getApkDirectoryStatus()`
- `getApkExtensionsDirectory()`
- `setApkExtensionsDirectory(directory)`
- `clearApkExtensionsDirectory()`
- `setApkOnlyMode(enabled)`
- `setAdapterRequiredMode(enabled)`
- `refreshApkExtensions()`
- `setApkSourceSelection(sourceKey, selectedPackageName)`
- `clearApkSourceSelection(sourceKey)`

`sourceKey` arguments are canonicalized internally, so callers can pass user-facing variants
(for example alias/case differences) and still resolve correctly.

When `apkOnlyMode` is enabled, `getExtensions()` returns only sources with active APK mappings.

When `adapterRequiredMode` is enabled, `getExtensions()` returns only sources whose active APK
mapping has a defined adapter profile.

### Resolution order

Effective APK folder path:
1. `TIYO_APK_EXTENSIONS_DIR` env override
2. persisted runtime config
3. default `%APPDATA%/Houdoku/Keiyoushi APK Extensions`

The resolved APK folder is automatically created if it does not already exist.

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
