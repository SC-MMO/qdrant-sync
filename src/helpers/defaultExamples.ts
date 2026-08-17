export const DEFAULT_CONFIG = `import { QdrantSyncConfig, readKey, readKeyOrThrow } from "qdrant-sync";

const CONFIG: QdrantSyncConfig = {
  schema: "qdrant-sync/schema.qdrant-sync.yaml",
  snaps: "qdrant-sync/snaps",
  datasource: {
    host: readKeyOrThrow("QDRANT_REST_HOST"),
    port: readKey("QDRANT_REST_PORT"),
    https: readKey("QDRANT_REST_IS_HTTPS"),
    apiKey: readKey("QDRANT_REST_API_KEY"),
  },
  selectedCollections: null,
};

export default CONFIG;
`;

export const DEFAULT_SCHEMA = `knowledge-management:
  config:
    params:
      vectors:
        "":
          size: 1536
          distance: Cosine
          hnsw_config:
            m: 24
            ef_construct: 256
            payload_m: 24
          on_disk: false
          datatype: float32
      shard_number: 1
      replication_factor: 1
      write_consistency_factor: 1
      on_disk_payload: true
    hnsw_config:
      m: 16
      ef_construct: 100
      full_scan_threshold: 10000
      max_indexing_threads: 0
      on_disk: false
    optimizer_config:
      deleted_threshold: 0.2
      vacuum_min_vector_number: 1000
      default_segment_number: 0
      max_segment_size: null
      memmap_threshold: null
      indexing_threshold: 10000
      flush_interval_sec: 5
      max_optimization_threads: null
      prevent_unoptimized: null
    wal_config:
      wal_capacity_mb: 32
      wal_segments_ahead: 0
      wal_retain_closed: 1
    quantization_config: null
  payload_schema:
    metadata.lastChange:
      data_type: datetime
    metadata.number:
      data_type: keyword
    metadata.objectId:
      data_type: integer
`;

export const DEFAULT_ENV_EXAMPLE = `QDRANT_REST_URL="http://localhost:6333"
QDRANT_API_KEY="abcdefg"`;
