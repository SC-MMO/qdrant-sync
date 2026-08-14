# qdrant-sync

Small CLI for keeping Qdrant collection configuration in YAML files so it can be versioned, reviewed, and restored.

## Building

```bash
git clone https://github.com/SC-MMO/qdrant-sync.git
cd qdrant-sync
pnpm run build
pnpm run pack
```

## Installation

Add the package to your project:

```bash
pnpm add <pathToThePackage>
```

## Setup

Initialize qdrant-sync in your project:

```bash
pnpm qdrant-sync init
```

This creates:

```text
qdrant-sync.config.ts
qdrant-sync/schema.qdrant-sync.yaml
qdrant-sync/snaps/
.env.example
```

Copy `.env.example` to `.env` and configure your Qdrant connection:

```env
QDRANT_REST_URL="http://localhost:6333"
QDRANT_API_KEY="your-api-key"
```

In `qdrant-sync.config.ts`, use `selectedCollections: null` to sync all collections, or provide collection names to limit the sync:

```ts
selectedCollections: ['knowledge-management'];
```

## Usage

### Pull configuration from Qdrant

```bash
pnpm qdrant-sync pull
```

Reads the configured collections from Qdrant and writes them to the local schema.

### Create a local snapshot

```bash
pnpm qdrant-sync snap before-change
```

Stores the current local schema in `qdrant-sync/snaps/`.
> The name of the snap gets formatted as `${timestamp}_${name}_${uuid}.yaml`

### Push the local schema to Qdrant

```bash
pnpm qdrant-sync push
```

To push a specific snapshot or schema file instead:

```bash
pnpm qdrant-sync push qdrant-sync/snaps/<snapshot>.yaml
```

## Typical workflow

```bash
pnpm qdrant-sync pull
pnpm qdrant-sync snap before-change
# edit the YAML schema
pnpm qdrant-sync push
```

> `push` is unfinished and dangerous

## Changing the package

### Validate your code

```bash
pnpm run typecheck
pnpm run lint
```

### Change version details

```bash
# edit the package.json version argument
# edit the src/cli.ts version argument
```
