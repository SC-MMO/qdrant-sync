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
export type UpdateCollectionParams = Parameters<QdrantClient['updateCollection']>[1];

const DistanceSchema = z.enum(['Cosine', 'Euclid', 'Dot', 'Manhattan']);

const ShardingMethodSchema = z.enum(['Auto', 'Custom', 'auto', 'custom']);

const UnknownConfigObjectSchema = z.record(z.string(), z.unknown());

const HnswConfigSchema = z
	.object({
		m: z.number().nullable().optional(),
		ef_construct: z.number().nullable().optional(),
		full_scan_threshold: z.number().nullable().optional(),
		max_indexing_threads: z.number().nullable().optional(),
		on_disk: z.boolean().nullable().optional(),
		payload_m: z.number().nullable().optional(),
		inline_storage: z.boolean().nullable().optional(),
	})
	.loose();

const VectorParamsSchema = z
	.object({
		size: z.number(),
		distance: DistanceSchema,
		hnsw_config: HnswConfigSchema.nullable().optional(),
		quantization_config: z.unknown().nullable().optional(),
		on_disk: z.boolean().nullable().optional(),
		datatype: z.string().nullable().optional(),
		multivector_config: z.unknown().nullable().optional(),
	})
	.loose();

const VectorsSchema = z.union([VectorParamsSchema, z.record(z.string(), VectorParamsSchema)]);

const SparseVectorParamsSchema = z
	.object({
		index: UnknownConfigObjectSchema.nullable().optional(),
		modifier: z.string().nullable().optional(),
	})
	.loose();

const SparseVectorsSchema = z.record(z.string(), SparseVectorParamsSchema);

export const CollectionParamsSchema = z
	.object({
		vectors: VectorsSchema.optional(),
		shard_number: z.number().nullable().optional(),
		sharding_method: ShardingMethodSchema.nullable().optional(),
		replication_factor: z.number().nullable().optional(),
		write_consistency_factor: z.number().nullable().optional(),
		read_fan_out_factor: z.number().nullable().optional(),
		read_fan_out_delay_ms: z.number().nullable().optional(),
		payload: UnknownConfigObjectSchema.nullable().optional(),
		sparse_vectors: SparseVectorsSchema.nullable().optional(),
		on_disk_payload: z.boolean().nullable().optional(),
	})
	.loose();

export const CreateCollectionParamsSchema = z
	.object({
		vectors: VectorsSchema.optional(),
		shard_number: z.number().nullable().optional(),
		sharding_method: ShardingMethodSchema.nullable().optional(),
		replication_factor: z.number().nullable().optional(),
		write_consistency_factor: z.number().nullable().optional(),
		payload: UnknownConfigObjectSchema.nullable().optional(),
		hnsw_config: UnknownConfigObjectSchema.nullable().optional(),
		wal_config: UnknownConfigObjectSchema.nullable().optional(),
		optimizers_config: UnknownConfigObjectSchema.nullable().optional(),
		quantization_config: z.unknown().nullable().optional(),
		sparse_vectors: SparseVectorsSchema.nullable().optional(),
		strict_mode_config: UnknownConfigObjectSchema.nullable().optional(),
		metadata: z.record(z.string(), z.unknown()).nullable().optional(),
		on_disk_payload: z.boolean().nullable().optional(),
		timeout: z.number().optional(),
	})
	.loose();

export const CollectionConfigSchema = z
	.object({
		params: CollectionParamsSchema,
		hnsw_config: UnknownConfigObjectSchema.nullable().optional(),
		optimizer_config: UnknownConfigObjectSchema.nullable().optional(),
		wal_config: UnknownConfigObjectSchema.nullable().optional(),
		quantization_config: z.unknown().nullable().optional(),
		strict_mode_config: UnknownConfigObjectSchema.nullable().optional(),
		metadata: z.record(z.string(), z.unknown()).nullable().optional(),
	})
	.loose();

const PayloadDataTypeSchema = z.enum(['keyword', 'integer', 'float', 'geo', 'text', 'bool', 'datetime', 'uuid']);

export const PayloadFieldSchema = z
	.object({
		data_type: PayloadDataTypeSchema,
		params: z.unknown().nullable().optional(),
		points: z.number().nullable().optional(),
	})
	.loose();

export const CanonicalCollectionSchema = z.object({
	config: CollectionConfigSchema,
	payload_schema: z.record(z.string(), PayloadFieldSchema).nullable().optional(),
});

export const CanonicalCollectionsSchema = z.record(z.string(), CanonicalCollectionSchema);

export type CollectionParams = z.infer<typeof CollectionParamsSchema>;
export type CollectionConfig = z.infer<typeof CollectionConfigSchema>;
export type PayloadField = z.infer<typeof PayloadFieldSchema>;
export type CanonicalCollection = z.infer<typeof CanonicalCollectionSchema>;
export type CanonicalCollections = z.infer<typeof CanonicalCollectionsSchema>;

export interface CollectionInfo {
	name: string;
}

export type PayloadSchema = NonNullable<CanonicalCollection['payload_schema']>;
