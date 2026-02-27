# Tiyo

This is a developer library, and isn't meant for regular users. For a manga reader that
uses Tiyo, see Houdoku: <https://github.com/xgi/houdoku>.

Tiyo is a library for retrieving and processing manga websites ("content sources"). It provides
clients for a multitude of sources, with a standardized interface for searching and retrieving
content. It's easily extendable, and new sources can be added from scratch or with helper methods
for generic websites (like Wordpress templates).

## Development

Prerequisites:

- [Node](https://nodejs.org) >= 18
- [pnpm](https://pnpm.io)

```bash
# Install package dependencies
pnpm install

# Lint @tiyo/common and @tiyo/core
pnpm run lint

# Build @tiyo/core, which will also build @tiyo/common
pnpm exec nx run core:build

# Build release tarball (.tgz)
pnpm exec nx run core:publish --args="--ver=x.x.x"

# Run APK runtime smoke test (fixture APKs)
pnpm run smoke:apk-runtime

# Run APK runtime smoke test against a real folder
pnpm run smoke:apk-runtime -- --apk-dir="D:/Path/To/Keiyoushi APK Extensions"
```

## Install from GitHub Release

Tiyo release artifacts are published as `.tgz` files on each GitHub release.

```bash
# Install @tiyo/common from a release asset
npm i https://github.com/Firedogs2x/tiyo/releases/download/Vx.y.z/tiyo-common-x.y.z.tgz

# Install @tiyo/core from a release asset
npm i https://github.com/Firedogs2x/tiyo/releases/download/Vx.y.z/tiyo-core-x.y.z.tgz
```

Replace `x.y.z` with the version in the release tag (for example `V0.0.1` -> `0.0.1`).

### Automation

- Lint workflow: `.github/workflows/lint.yml`
	- On `push`/`pull_request` to `main`: runs `common:lint`, `core:lint`, and `core:build`.
	- Runs on `ubuntu`, `windows`, and `macos` to continuously verify cross-platform compatibility.
	- Manual run supports selecting a source `branch`.
- Release workflow: `.github/workflows/release.yml`
	- Manual only (`workflow_dispatch`) with version `bump` (`patch`/`minor`/`major`).
	- Calculates next version from the latest `V*`/`v*` git tag and builds a release tarball via:
		`pnpm exec nx run core:publish --args="--ver=x.x.x"`.
	- Publish target depends on `core:build`, so required build happens through Nx target dependencies.
	- Creates and pushes a new `Vx.y.z` tag and creates a GitHub release with `dist/libs/core/*.tgz` attached.
	- Does not require npm publishing credentials.

This is an Nx monorepo. You can run build/test tasks using the CLI commands
(such as the ones above), but I recommend using the VSCode extension:
https://nx.dev/core-features/integrate-with-editors.


### API

Definitions for extension client interfaces and functions, e.g.
[ExtensionClientInterface](https://github.com/xgi/tiyo/blob/main/libs/common/src/lib/interfaces.ts) are in `libs/common` (`@tiyo/common`).

Extensions are implemented in `libs/core` (`@tiyo/core`). When making a new
extension, you should use existing extensions as a reference. The core package
also contains generic client helpers for some common website structures (e.g.
the Madara WordPress theme or FoOlSlide).

### Dependencies

When adding a new package dependency (like jsdom), it should be added both to
this repo's base `package.json` as a devDependency and as a regular dependency
in `libs/core/package.json`. This ensures that the dependency is included
when installed from npm.


## License

[MIT License](https://github.com/xgi/tiyo/blob/main/LICENSE.txt)
