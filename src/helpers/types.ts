export type QdrantSyncConfig = {
  schema: string;
  snaps: string;
  datasource: {
    url: string;
    apiKey?: string;
  };
};

import { z } from "zod";

const VectorConfigSchema = z.object({
  size: z.number(),
  distance: z.string(),
  hnsw_config: z
    .object({
      m: z.number().nullish(),
      ef_construct: z.number().nullish(),
      payload_m: z.number().nullish(),
    })
    .nullish(),
  on_disk: z.boolean().nullish(),
  datatype: z.string().nullish(),
});

const CollectionConfigSchema = z.object({
  params: z
    .object({
      vectors: z
        .union([VectorConfigSchema, z.record(z.string(), VectorConfigSchema)])
        .nullish(),
      shard_number: z.number().nullish(),
      replication_factor: z.number().nullish(),
      write_consistency_factor: z.number().nullish(),
      on_disk_payload: z.boolean().nullish(),
    })
    .nullish(),

  hnsw_config: z
    .object({
      m: z.number().nullish(),
      ef_construct: z.number().nullish(),
      full_scan_threshold: z.number().nullish(),
      max_indexing_threads: z.number().nullish(),
      on_disk: z.boolean().nullish(),
    })
    .nullish(),

  optimizer_config: z
    .object({
      deleted_threshold: z.number().nullish(),
      vacuum_min_vector_number: z.number().nullish(),
      default_segment_number: z.number().nullish(),
      max_segment_size: z.number().nullish(),
      memmap_threshold: z.number().nullish(),
      indexing_threshold: z.number().nullish(),
      flush_interval_sec: z.number().nullish(),
      max_optimization_threads: z.number().nullish(),
      prevent_unoptimized: z.boolean().nullish(),
    })
    .nullish(),

  wal_config: z
    .object({
      wal_capacity_mb: z.number().nullish(),
      wal_segments_ahead: z.number().nullish(),
      wal_retain_closed: z.number().nullish(),
    })
    .nullish(),

  quantization_config: z.unknown().nullish(),
});

const PayloadFieldSchema = z.object({
  data_type: z.literal([
    "keyword",
    "integer",
    "float",
    "geo",
    "text",
    "bool",
    "datetime",
    "uuid",
  ]),
});

export const CanonicalCollectionSchema = z.object({
  config: CollectionConfigSchema,

  payload_schema: z.record(z.string(), PayloadFieldSchema).nullish(),
});

export type CanonicalCollection = z.infer<typeof CanonicalCollectionSchema>;

export type CollectionInfo = {
  name: string;
};

export type PayloadSchema = NonNullable<CanonicalCollection["payload_schema"]>;

export type CanonicalCollections = Record<string, CanonicalCollection>;
