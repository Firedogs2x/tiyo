# core

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build core` to build the library.

## APK runtime integration

`TiyoClient` now exposes optional APIs for folder-based Keiyoushi APK discovery and source selection.

### Minimal Houdoku method flow

- `runApkHoudokuApkMethodSetup(targetDirectory?)`
  - One-call runtime setup for Houdoku APK mode.
  - Sets/normalizes APK directory, enables APK-only mode, and returns readiness checks.
  - Returns `{ setupResult, readyStatus, success, reasons }`.

- `runApkHoudokuApkSourceMethodSetup(sourceKey, targetDirectory?, requestedPackageName?)`
  - One-call source setup built on top of runtime setup.
  - Ensures runtime is prepared, applies preferred/requested package selection for one source,
    and verifies active mapping + extension visibility.
  - Returns `{ runtimeSetup, sourceSelection, sourceReadiness, activePackageName, visibleInExtensions, success, reasons }`.

- `runApkHoudokuApkBulkSourceMethodSetup(targetDirectory?)`
  - One-call setup for all discovered sources with APK options.
  - Verifies each source has a selected package, active mapping, and visible extension client.
  - Returns `{ setup, sourceResults, successfulSourceKeys, failedSourceKeys, success, reasons }`.

- `runApkHoudokuInstalledApkMethodSetup()`
  - One-call setup for the default Houdoku APK folder (`%APPDATA%/Houdoku/Keiyoushi APK Extensions`).
  - Uses bulk source setup + verification with no input args.

- For local verification against the Houdoku folder and MangaDex replacement, run:
  - `pnpm smoke:apk-runtime` (default installed method: `runApkHoudokuInstalledApkMethodSetup()`)
  - `pnpm smoke:houdoku` (single-source MangaDex path)
  - `pnpm smoke:houdoku:all` (explicit all-sources path)
  - `pnpm houdoku:update` (one-shot JSON payload; validates a good source APK, default `mangadex`)
  - `pnpm houdoku:ready` (same check, fails with non-zero exit if APK data is not usable by Houdoku)
  - `pnpm poll:houdoku` (method-based filesystem polling every 5 minutes with source verification)
  - Optional args for both scripts: `--source-key=<source>`, `--package-name=<package>`, `--apk-dir=<path>`

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

- `syncApkRuntimeWithFilesystem(previousRuntimeStateVersion?)`
  - One-call resync for APK add/delete changes.
  - Refreshes APK files from disk, cleans invalid selections, reapplies preferred selections,
    and returns `{ changed, runtimeStateVersion, activeSourceKeys, runtimeState }`.

- `getApkHoudokuPollingUpdate(previousRuntimeStateVersion?, profile?)`
  - One-call polling method for Houdoku integration.
  - Runs filesystem sync and returns updated launch model payload in one response so
    callers can pass refreshed readiness/blocker state directly to Houdoku.

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

- `runApkHoudokuApkMethodSetup(targetDirectory?)`
  - Method-first alternative focused on minimal setup + readiness checks.
  - Returns `{ setupResult, readyStatus, success, reasons }`.

- `runApkHoudokuApkSourceMethodSetup(sourceKey, targetDirectory?, requestedPackageName?)`
  - Method-first source setup for Houdoku testing (for example, `mangadex`).
  - Returns source-level selection/readiness plus final active package verification.

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

- `getApkStartupExecutionSummary(profile?)`
  - Returns a compact one-call startup verification summary for Houdoku launch checks.
  - Includes current `readyStatus`, recommended strict-gate pass/fail, reasons, and key counts.
  - Use this method for lightweight pre-launch status surfaces without full orchestration payloads.

- `runApkHoudokuTestReady(options?)`
  - Executes bounded remediation-until-stable and returns final Houdoku test readiness.
  - Combines remediation loop output with startup execution summary in one response.
  - Response shape:
    `{ profile, maxRemediationRuns, usedOverrides, remediation, summary, readyForHoudokuTest, reasons }`.

- `getApkHoudokuLaunchModel(profile?, previousRuntimeStateVersion?)`
  - Returns a consolidated non-destructive launch model for Houdoku integration UI.
  - Combines `getApkUiModel`, startup summary, strict recommendation, and remediation plan.
  - Response shape:
    `{ profile, uiModel, startupSummary, recommendedStrictGate, remediationPlan, canRunHoudokuTest, blockerReasons }`.

- `getApkHoudokuLaunchModelWithOverrides(options?)`
  - Returns the same launch model using optional strict-gate overrides.
  - Useful when operator-approved gate relaxations are needed for targeted Houdoku testing.
  - Includes `usedOverrides` in the response for traceability.

- `getApkHoudokuTestingPreset(profile?)`
  - Returns backend-defined override presets for Houdoku-focused testing flows.
  - Designed to keep testing non-destructive by default while still producing deterministic readiness checks.

- `getApkHoudokuTestingModel(profile?, previousRuntimeStateVersion?)`
  - Returns a composed testing payload in one call:
    `{ profile, preset, launchModel, testReady }`.
  - Combines recommended testing preset, override-aware launch model, and one-call test-ready execution.

- `getApkHoudokuTestingModelWithOptions(options?)`
  - Returns the same composed testing payload with explicit options.
  - Supports custom `overrides` and `maxRemediationRuns` while preserving method-based orchestration.

- `getApkHoudokuIntegrationPlan(profile?, previousRuntimeStateVersion?)`
  - Returns backend-generated Houdoku integration steps with method names and execution intent.
  - Includes `{ profile, testingModel, steps }` where steps can be used as a direct UI/IPC wiring checklist.

- `runApkHoudokuIntegrationStep(profile?, stepCode?, previousRuntimeStateVersion?)`
  - Executes a single integration step by code and returns refreshed launch model.
  - Returns `{ profile, requestedStepCode, stepResults, launchModel }`.

- `runApkHoudokuIntegrationPlan(profile?, previousRuntimeStateVersion?)`
  - Executes all generated integration steps in sequence and returns refreshed launch model.
  - Uses the same method mappings as `getApkHoudokuIntegrationPlan` for deterministic orchestration.

- `getApkNextHoudokuIntegrationStep(profile?, previousRuntimeStateVersion?)`
  - Returns backend-selected next step for Houdoku integration flow.
  - Uses current launch gate state to pick the highest-value next action and includes rationale.

- `runApkNextHoudokuIntegrationStep(profile?, previousRuntimeStateVersion?)`
  - Executes the backend-selected next integration step in one call.
  - Returns `{ profile, nextStep, execution }` for direct UI/IPC orchestration.

- `getApkHoudokuIntegrationControllerModel(profile?, previousRuntimeStateVersion?)`
  - Returns a compact controller payload for UI state orchestration.
  - Includes `{ profile, previousRuntimeStateVersion, plan, nextStep, canRunHoudokuTest, suggestedStepCode }`.

- `runApkHoudokuIntegrationControllerCycle(profile?, previousRuntimeStateVersion?)`
  - Executes one controller cycle: compute initial model, run next step, then return refreshed model.
  - Returns `{ profile, initialModel, nextStepRun, refreshedModel }`.

- `getApkHoudokuIntegrationCommandSuggestions(profile?, previousRuntimeStateVersion?)`
  - Returns IPC-ready command suggestions for every integration step.
  - Each suggestion includes `{ stepCode, method, argsJson, blocking, description, isNextStep }` plus `nextStep` context.

- `preflightApkHoudokuIntegrationCommandSuggestion(command?, profile?, previousRuntimeStateVersion?)`
  - Validates one command suggestion without executing it.
  - Returns normalized method/step, allowlist status, parsed-args validity, and parsed argument payload.

- `preflightApkHoudokuNextIntegrationCommandSuggestion(profile?, previousRuntimeStateVersion?)`
  - Preflights the backend-selected next command suggestion in one call.
  - Returns `{ profile, nextStep, command, preflight }`.

- `getApkHoudokuIntegrationCommandAuditBundle(profile?, previousRuntimeStateVersion?)`
  - Returns per-command audit entries for all integration suggestions.
  - Each entry includes `{ command, preflight, dispatchReady }` for direct UI rendering.

- `getApkHoudokuNextIntegrationCommandAuditBundle(profile?, previousRuntimeStateVersion?)`
  - Returns an audit view for the backend-selected next command.
  - Includes `{ nextStep, command, preflight, dispatchReady }`.

- `runApkHoudokuNextIntegrationCommandTransaction(profile?, previousRuntimeStateVersion?)`
  - Runs one transactional next-command cycle with before/after audit snapshots.
  - Executes only when `dispatchReady` is true and returns `{ beforeAudit, execution, afterAudit, executed, skippedReason }`.

- `runApkHoudokuNextIntegrationCommandTransactions(options?)`
  - Runs bounded next-command transactions until convergence, failure/not-ready stop, or `maxRuns` is reached.
  - Returns `{ runs, finalAudit, stopReason, converged }` with full per-run trace.

- `runApkHoudokuNextIntegrationCommandTransactionsWithCompletionPolicy(options?)`
  - Runs bounded transactions and evaluates deterministic completion criteria.
  - Supports policy controls for `requiredStepCodes`, final dispatch/test readiness, and minimum stable next-step runs.
  - Returns `{ completed, reasons, policy, loop, completedRequiredStepCodes, missingRequiredStepCodes }`.

- `getApkHoudokuIntegrationCompletionPolicyPreset(profile?)`
  - Returns a profile-based completion preset (`dev`, `test`, `prod`) with `policy`, `maxRuns`, and notes.
  - Designed to remove hardcoded policy values from UI/IPC layers.

- `runApkHoudokuIntegrationCompletionPolicyPreset(profile?, previousRuntimeStateVersion?)`
  - Executes completion-policy evaluation using the selected preset in one call.
  - Returns the same completion result payload as `runApkHoudokuNextIntegrationCommandTransactionsWithCompletionPolicy`.

- `getApkHoudokuIntegrationCompletionPolicyPresetRecommendation(previousRuntimeStateVersion?)`
  - Recommends `dev`/`test`/`prod` preset from current runtime and audit signals.
  - Returns rationale, selected preset, and ready-to-run completion-policy override options.

- `runApkHoudokuIntegrationCompletionPolicyPresetRecommendation(previousRuntimeStateVersion?)`
  - Resolves recommended preset and executes completion-policy evaluation in one call.
  - Returns `{ recommendation, result }`.

- `runApkHoudokuIntegrationAutopilotSession(previousRuntimeStateVersion?)`
  - Runs recommendation and preset execution in one call and returns a compact status model.
  - Returns `{ recommendation, run, status, summary, suggestedNextAction }` for direct status-panel rendering.

- `getApkHoudokuIntegrationAutopilotQuickStatus(previousRuntimeStateVersion?)`
  - Returns digest-aware lightweight autopilot status for polling without running full transaction loops.
  - Includes `{ changed, runtimeQuickStatus, status, recommendedProfile, suggestedNextAction, reason }`.

- `getApkHoudokuTestingEntryModel(previousRuntimeStateVersion?)`
  - Returns a one-call entry payload for Houdoku testing screens.
  - Includes runtime digest/quick status, autopilot quick status, test preset, completion recommendation, and primary action hints.

- `runApkHoudokuTestingPrimaryAction(previousRuntimeStateVersion?)`
  - Executes the testing entry model’s `suggestedPrimaryAction` in one backend call.
  - Returns `{ action, performed, reason, entryModel, testReady?, remediationPlan? }`.

- `runApkHoudokuTestingSession(previousRuntimeStateVersion?)`
  - Runs one testing session step in a single call.
  - Returns `{ beforeEntryModel, primaryActionRun, afterEntryModel, completed, reason }`.

- `runApkHoudokuTestingSessionLoop(options?)`
  - Runs bounded testing-session steps until stable completion or `maxRuns` is reached.
  - Returns `{ maxRuns, stableCompletionRuns, runs, finalSession, completed, completedRunCount, stopReason, reason }`.

- `getApkHoudokuTestingControllerModel(options?)`
  - Returns a polling-friendly controller model for test orchestration.
  - Includes entry state, suggested primary action, normalized loop options, and readiness status/reason.

- `runApkHoudokuTestingControllerCycle(options?)`
  - Runs one controller cycle: compute controller model, execute bounded session loop, then return refreshed model.
  - Returns `{ initialModel, loop, refreshedModel, completed, suggestedNextAction, reason }`.

- `runApkHoudokuTestingAutopilot(options?)`
  - Runs one high-level testing autopilot pass in a single backend call.
  - Returns `{ controllerModel, controllerCycle, launchModel, status, completed, suggestedNextAction, reason }`.

- `getApkHoudokuTestingCommandSuggestions(previousRuntimeStateVersion?)`
  - Returns IPC-ready command suggestions for testing orchestration methods.
  - Includes `{ suggestions, controllerModel }` where each suggestion provides
    `{ stepCode, method, argsJson, description, isNextStep }`.

- `preflightApkHoudokuTestingCommandSuggestion(command?, previousRuntimeStateVersion?)`
  - Validates one testing command suggestion without executing it.
  - Returns normalized method/step, allowlist status, parsed-args validity, and parsed argument payload.

- `runApkHoudokuTestingCommandSuggestion(command?, previousRuntimeStateVersion?)`
  - Executes one testing command suggestion through an allowlisted backend dispatcher.
  - Returns `{ allowlisted, parsedArgsValid, executed, error, autopilot }` with refreshed autopilot context.

- `runApkHoudokuNextTestingCommandSuggestion(previousRuntimeStateVersion?)`
  - Looks up the backend-selected next testing command suggestion and executes it in one call.
  - Returns `{ command, execution }` for direct UI/IPC orchestration.

- `preflightApkHoudokuNextTestingCommandSuggestion(previousRuntimeStateVersion?)`
  - Preflights the backend-selected next testing command suggestion in one call.
  - Returns `{ command, preflight }`.

- `getApkHoudokuTestingCommandAuditBundle(previousRuntimeStateVersion?)`
  - Returns per-command audit entries for all testing command suggestions.
  - Each entry includes `{ command, preflight, dispatchReady }`.

- `getApkHoudokuNextTestingCommandAuditBundle(previousRuntimeStateVersion?)`
  - Returns an audit view for the backend-selected next testing command.
  - Includes `{ command, preflight, dispatchReady }`.

- `runApkHoudokuNextTestingCommandTransaction(previousRuntimeStateVersion?)`
  - Runs one transactional next-testing-command cycle with before/after audit snapshots.
  - Executes only when `dispatchReady` is true and returns
    `{ beforeAudit, execution, afterAudit, executed, skippedReason }`.

- `runApkHoudokuNextTestingCommandTransactions(options?)`
  - Runs bounded next-testing-command transactions until convergence, failure/not-ready stop,
    or `maxRuns` is reached.
  - Returns `{ runs, finalAudit, stopReason, converged }`.

- `runApkHoudokuNextTestingCommandTransactionsWithCompletionPolicy(options?)`
  - Runs bounded next-testing-command transactions and evaluates deterministic completion criteria.
  - Supports policy controls for required testing step codes, final dispatch readiness,
    interactive-test readiness, and stable next-step runs.
  - Returns `{ completed, reasons, policy, loop, finalControllerModel, completedRequiredStepCodes, missingRequiredStepCodes }`.

- `getApkHoudokuTestingCompletionPolicyPreset(profile?)`
  - Returns a profile-based testing completion preset (`dev`, `test`, `prod`) with
    `policy`, `maxRuns`, and notes.

- `runApkHoudokuTestingCompletionPolicyPreset(profile?, previousRuntimeStateVersion?)`
  - Executes testing completion-policy evaluation using the selected preset in one call.

- `getApkHoudokuTestingCompletionPolicyPresetRecommendation(previousRuntimeStateVersion?)`
  - Recommends `dev`/`test`/`prod` testing preset from runtime, testing-dispatch, and strict-gate signals.
  - Returns rationale, selected preset, and ready-to-run override options.

- `runApkHoudokuTestingCompletionPolicyPresetRecommendation(previousRuntimeStateVersion?)`
  - Resolves recommended testing preset and executes completion-policy evaluation in one call.
  - Returns `{ recommendation, result }`.

- `runApkHoudokuTestingAutopilotSession(previousRuntimeStateVersion?)`
  - Runs testing preset recommendation and completion-policy evaluation in one call.
  - Returns `{ recommendation, run, status, summary, suggestedNextAction }`.

- `getApkHoudokuTestingAutopilotQuickStatus(previousRuntimeStateVersion?)`
  - Returns digest-aware lightweight testing autopilot status for polling surfaces.
  - Includes `{ changed, runtimeQuickStatus, status, recommendedProfile, suggestedNextAction, reason }`.

- `getApkHoudokuTestingExecutionSummary(previousRuntimeStateVersion?)`
  - Returns a compact one-call testing readiness summary for production UI polling.
  - Includes `{ status, canStartInteractiveTest, dispatchReady, suggestedNextAction, reason }`
    plus `autopilotQuickStatus` and `completionRecommendation` context.

- `runApkHoudokuTestingQuickStart(previousRuntimeStateVersion?)`
  - Runs a minimal one-pass startup action toward interactive testing readiness.
  - Returns `{ beforeSummary, actionRun?, afterSummary, ready, suggestedNextAction, reason }`.

- `runApkHoudokuTestingFunctionalRun(previousRuntimeStateVersion?)`
  - Runs one backend-owned functional testing pass: summary -> quick-start -> launch model.
  - Returns `{ summary, quickStart, launchModel, readyForInteractiveTest, suggestedNextAction, reason }`.

- `getApkHoudokuTestingDispatchModel(previousRuntimeStateVersion?)`
  - Returns a direct client-dispatch payload for runtime UI/IPC.
  - Includes `{ suggestedClientAction, dispatchMethod?, dispatchArgsJson?, canStartInteractiveTest, canDispatchCommand }`
    plus functional run context.

- `runApkHoudokuIntegrationCommandSuggestion(command?, profile?, previousRuntimeStateVersion?)`
  - Executes one command suggestion through an allowlisted backend dispatcher.
  - Validates allowlisting and `argsJson` shape before dispatch and returns execution metadata.

- `runApkHoudokuNextIntegrationCommandSuggestion(profile?, previousRuntimeStateVersion?)`
  - Looks up the backend-selected next command suggestion and executes it in one call.
  - Returns `{ profile, nextStep, command, execution }`.

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
