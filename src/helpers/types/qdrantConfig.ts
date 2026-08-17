import { z } from 'zod';

const booleanFromString = z.preprocess((value: string | null | undefined) => {
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (normalized === 'true') return true;
		if (normalized === 'false') return false;
	}
	return value;
}, z.boolean());

const nullablePortSchema = z.preprocess((value: string | null | undefined) => {
	if (value === null || value === undefined) return null;

	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (trimmed === '') return null;
		return Number(trimmed);
	}

	return value;
}, z.number().int().max(65535).nullable());

export const QdrantSyncConfigSchema = z.object({
	schema: z.string(),
	snaps: z.string(),
	datasource: z.object({
		host: z.string(),
		port: nullablePortSchema,
		https: booleanFromString,
		apiKey: z.string().optional(),
	}),
	selectedCollections: z.array(z.string()).nullable(),
});

export type QdrantSyncConfig = z.infer<typeof QdrantSyncConfigSchema>;
