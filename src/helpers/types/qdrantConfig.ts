import { z } from 'zod';

const booleanFromString = z.preprocess((value) => {
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();

		if (normalized === 'true') return true;
		if (normalized === 'false') return false;
		if (normalized === 'https') return true;
		if (normalized === 'http') return false;
	}

	return value;
}, z.boolean());

export const QdrantSyncConfigSchema = z.object({
	schema: z.string(),
	snaps: z.string(),
	datasource: z.object({
		host: z.string(),
		port: z.coerce.number().max(65535).nullable(),
		https: booleanFromString,
		apiKey: z.string().optional(),
	}),
	selectedCollections: z.array(z.string()).nullable(),
});

export type QdrantSyncConfig = z.input<typeof QdrantSyncConfigSchema>;
