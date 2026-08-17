import type { QdrantClient } from '@qdrant/js-client-rest';

export type CreateCollectionParams = Parameters<QdrantClient['createCollection']>[1];
export type UpdateCollectionParams = Parameters<QdrantClient['updateCollection']>[1];
