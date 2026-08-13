import path from 'node:path';
import { existsSync } from 'node:fs';
import { createJiti } from 'jiti';
import { QdrantSyncConfigSchema, type QdrantSyncConfig } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export async function loadUserConfig(): Promise<QdrantSyncConfig> {
	const cwd = process.cwd();
	const configPath = path.resolve(cwd, 'qdrant-sync.config.ts');

	if (!existsSync(configPath)) {
		throw new Error(`Config file not found: ${configPath}`);
	}

	const jiti = createJiti(cwd);
	const mod: unknown = await jiti.import(configPath);

	if (!isRecord(mod) || !('default' in mod)) {
		throw new Error(`Default export not found in ${configPath}`);
	}

	const parsed = QdrantSyncConfigSchema.safeParse(mod['default']);

	if (!parsed.success) {
		throw new Error(`Invalid config in ${configPath}: ${parsed.error.message}`);
	}

	return parsed.data;
}
