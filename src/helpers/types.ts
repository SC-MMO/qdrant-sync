import type { QdrantClient } from '@qdrant/js-client-rest';
import { z } from 'zod';

export const QdrantSyncConfigSchema = z.object({
	schema: z.string(),
	snaps: z.string(),
	datasource: z.object({
		url: z.string(),
		apiKey: z.string().optional(),
	}),
	selectedCollections: z.array(z.string()).nullable(),
});

export type QdrantSyncConfig = z.infer<typeof QdrantSyncConfigSchema>;

export type CreateCollectionParams = Parameters<QdrantClient['createCollection']>[1];

const DistanceSchema = z.enum(['Cosine', 'Euclid', 'Dot', 'Manhattan']);

const PayloadFieldSchema = z
	.object({
		data_type: z.enum(['keyword', 'integer', 'float', 'geo', 'text', 'bool', 'datetime', 'uuid']),
	})
	.strict();

const VectorParamsSchema = z
	.object({
		size: z.number(),
		distance: DistanceSchema,
		hnsw_config: z
			.object({
				m: z.number().nullable().optional(),
				ef_construct: z.number().nullable().optional(),
				full_scan_threshold: z.number().nullable().optional(),
				max_indexing_threads: z.number().nullable().optional(),
				on_disk: z.boolean().nullable().optional(),
				payload_m: z.number().nullable().optional(),
				inline_storage: z.boolean().nullable().optional(),
			})
			.nullable()
			.optional(),
		quantization_config: z.unknown().nullable().optional(),
		on_disk: z.boolean().nullable().optional(),
		datatype: z.string().nullable().optional(),
		multivector_config: z.unknown().nullable().optional(),
	})
	.strict();

const VectorsSchema = z.union([VectorParamsSchema, z.record(z.string(), VectorParamsSchema)]);

export const CreateCollectionParamsSchema = z
	.object({
		vectors: VectorsSchema.optional(),
		shard_number: z.number().nullable().optional(),
		sharding_method: z.enum(['Auto', 'Custom']).nullable().optional(),
		replication_factor: z.number().nullable().optional(),
		write_consistency_factor: z.number().nullable().optional(),
		on_disk_payload: z.boolean().nullable().optional(),
		hnsw_config: z.record(z.string(), z.unknown()).nullable().optional(),
		optimizers_config: z.record(z.string(), z.unknown()).nullable().optional(),
		wal_config: z.record(z.string(), z.unknown()).nullable().optional(),
		quantization_config: z.unknown().nullable().optional(),
		sparse_vectors: z.record(z.string(), z.unknown()).nullable().optional(),
		strict_mode_config: z.record(z.string(), z.unknown()).nullable().optional(),
		timeout: z.number().optional(),
	})
	.strict();

const CollectionConfigSchema = z
	.object({
		params: CreateCollectionParamsSchema,
	})
	.strict();

export const CanonicalCollectionSchema = z
	.object({
		config: CollectionConfigSchema,
		payload_schema: z.record(z.string(), PayloadFieldSchema).nullable().optional(),
	})
	.strict();

export type CanonicalCollection = z.infer<typeof CanonicalCollectionSchema>;
export interface CollectionInfo {
	name: string;
}
export type PayloadSchema = NonNullable<CanonicalCollection['payload_schema']>;
export type CanonicalCollections = Record<string, CanonicalCollection>;
