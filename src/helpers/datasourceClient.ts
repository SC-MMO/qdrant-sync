import { QdrantClient } from "@qdrant/js-client-rest";
import {
  CanonicalCollection,
  CanonicalCollectionSchema,
  CollectionInfo,
  PayloadSchema,
  QdrantSyncConfig,
} from "./types";

function getPayloadSchema(
  collection: CanonicalCollection | undefined,
): PayloadSchema {
  return (collection?.payload_schema ?? {}) as PayloadSchema;
}

function isSameFieldSchema(
  a: PayloadSchema[string] | undefined,
  b: PayloadSchema[string] | undefined,
): boolean {
  if (!a || !b) return a === b;
  return a.data_type === b.data_type;
}

export class QdrantSyncClient extends QdrantClient {
  config: QdrantSyncConfig;

  constructor(config: QdrantSyncConfig) {
    super({ url: config.datasource.url, apiKey: config.datasource.apiKey });
    this.config = config;
  }

  async readCollectionConfiguration(): Promise<
    Record<string, CanonicalCollection>
  > {
    const collections: CollectionInfo[] = (await this.getCollections())
      .collections;

    const enrichedCollections: any = await Promise.all(
      collections.map(async (collection) => {
        return {
          name: collection.name,
          details: await this.getCollection(collection.name),
        };
      }),
    );

    const collectionMap: any = Object.fromEntries(
      enrichedCollections.map((collection: any) => {
        const parsed = CanonicalCollectionSchema.safeParse(collection.details);

        if (!parsed.success) {
          throw new Error(
            `Invalid schema for collection "${collection.name}":\n${parsed.error.message}`,
          );
        }

        return [collection.name, parsed.data];
      }),
    );

    return collectionMap;
  }

  async updateCollectionConfiguration(
    collectionName: string,
    newCollection: CanonicalCollection,
    oldCollection: CanonicalCollection | undefined,
  ): Promise<void> {
    const newPayloadSchema = getPayloadSchema(newCollection);
    const oldPayloadSchema = getPayloadSchema(oldCollection);

    const newFieldNames = new Set(Object.keys(newPayloadSchema));
    const oldFieldNames = new Set(Object.keys(oldPayloadSchema));

    // Remove indexes that no longer exist
    for (const oldFieldName of oldFieldNames) {
      if (!newFieldNames.has(oldFieldName)) {
        await this.deletePayloadIndex(collectionName, oldFieldName);
      }
    }

    // Create or recreate changed indexes
    for (const [fieldName, fieldConfig] of Object.entries(newPayloadSchema)) {
      const oldFieldConfig = oldPayloadSchema[fieldName];

      const existsBefore = oldFieldConfig !== undefined;
      const changed = !isSameFieldSchema(oldFieldConfig, fieldConfig);

      if (!existsBefore) {
        await this.createPayloadIndex(collectionName, {
          field_name: fieldName,
          field_schema: fieldConfig.data_type,
        });
        continue;
      }

      if (changed) {
        await this.deletePayloadIndex(collectionName, fieldName);
        await this.createPayloadIndex(collectionName, {
          field_name: fieldName,
          field_schema: fieldConfig.data_type,
        });
      }
    }
  }

  async createCollectionWithConfiguration(
    collectionName: string,
    collection: CanonicalCollection,
  ): Promise<void> {
    await this.createCollection(collectionName, collection.config.params);

    const payloadSchema = getPayloadSchema(collection);

    for (const [fieldName, fieldConfig] of Object.entries(payloadSchema)) {
      await this.createPayloadIndex(collectionName, {
        field_name: fieldName,
        field_schema: fieldConfig.data_type,
      });
    }
  }
}
