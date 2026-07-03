# Install Get Stuff Done

This guide covers the public install path and the cousin-install CI scenario: a fresh environment that has never touched this repository installs `@chude/get-stuff-done` and verifies runtime provenance without launching Claude.

## Public Install

Use the public npm package by default:

```bash
npx @chude/get-stuff-done@latest --claude --global
```

Then verify the installed launcher without starting an interactive session:

```bash
gsd --version --json
```

The JSON output must include:

```json
{
  "packageName": "@chude/get-stuff-done",
  "version": "3.0.2",
  "upstreamPackage": "@opengsd/gsd-core",
  "upstreamVersion": "1.5.0",
  "overlayManifestSha256": "<sha256>"
}
```

## Package Managers

Use whichever package manager owns the target environment:

```bash
npm install --global @chude/get-stuff-done@latest
pnpm add --global @chude/get-stuff-done@latest
bun add --global @chude/get-stuff-done@latest
```

For one-off execution, prefer the package-runner form:

```bash
npx @chude/get-stuff-done@latest --claude --global
pnpm dlx @chude/get-stuff-done@latest --claude --global
bunx @chude/get-stuff-done@latest --claude --global
```

## PATH Notes

Global package-manager bins must be on `PATH` before `gsd` is available.

Linux and macOS:

```bash
npm bin --global
pnpm setup
bun pm bin --global
```

Windows PowerShell:

```powershell
npm bin --global
pnpm setup
bun pm bin --global
```

Restart the shell after changing `PATH`.

## Optional Read-Only Token

The public package does not require a token. Private registry scenarios may use a read-only npm token through `NODE_AUTH_TOKEN`.

```bash
NODE_AUTH_TOKEN=<read-only-token> npm install --global @chude/get-stuff-done@latest
```

CI must write that token only to a temporary project `.npmrc`; do not write it to the user's global npm config.

## CI Isolation

The cousin-install workflow isolates installer side effects under the runner temp directory:

- `HOME`
- `USERPROFILE`
- `CLAUDE_CONFIG_DIR`
- `GSD_CI_SMOKE_DIR`

The smoke helper creates a temporary project, installs either the packed PR tarball or `@chude/get-stuff-done@latest`, resolves the local `node_modules/.bin/gsd` executable, and runs:

```bash
gsd --version --json
```

This proves the package installs and exposes provenance without mutating a developer machine or launching Claude.

## Troubleshooting

If `gsd --version --json` cannot find `overlayManifestSha256`, rebuild the package artifact before packing:

```bash
bun run dist
```

If install files land in the wrong Claude directory, set `CLAUDE_CONFIG_DIR` explicitly:

```bash
CLAUDE_CONFIG_DIR=/tmp/gsd-smoke/claude npx @chude/get-stuff-done@latest --claude --global
```

If package-manager auth fails, check that `NODE_AUTH_TOKEN` is read-only, unexpired, and scoped to the registry used by npm, pnpm, or bun.
