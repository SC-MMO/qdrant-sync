import { QdrantClient } from "@qdrant/js-client-rest";
import {
  type CanonicalCollection,
  CanonicalCollectionSchema,
  type CollectionInfo,
  type CreateCollectionParams,
  type PayloadSchema,
  type QdrantSyncConfig,
} from "./types";

function getPayloadSchema(
  collection: CanonicalCollection | undefined,
): PayloadSchema {
  return collection?.payload_schema ?? {};
}

function isSameFieldSchema(
  a: PayloadSchema[string] | undefined,
  b: PayloadSchema[string] | undefined,
): boolean {
  if (a === undefined || b === undefined) {
    return a === b;
  }

  return a.data_type === b.data_type;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as T;
}

function toCreateCollectionParams(
  collection: CanonicalCollection,
): CreateCollectionParams {
  const params = collection.config.params;

  const normalized = omitUndefined({
    ...params,
    vectors:
      params.vectors == null
        ? params.vectors
        : Array.isArray(params.vectors)
          ? params.vectors
          : typeof params.vectors === "object"
            ? omitUndefined(params.vectors)
            : params.vectors,
  });

  return normalized as CreateCollectionParams;
}

export class QdrantSyncClient extends QdrantClient {
  public readonly config: QdrantSyncConfig;

  public constructor(config: QdrantSyncConfig) {
    const params = config.datasource.apiKey
      ? {
          url: config.datasource.url,
          apiKey: config.datasource.apiKey,
        }
      : {
          url: config.datasource.url,
        };

    super(params);
    this.config = config;
  }

  public async readCollectionConfigurations(): Promise<
    Record<string, CanonicalCollection>
  > {
    const collections: CollectionInfo[] = (
      await this.getCollections()
    ).collections.filter((collection) => {
      if (this.config.selectedCollections === null) {
        return true;
      }

      return this.config.selectedCollections.includes(collection.name);
    });

    const enrichedCollections: {
      name: string;
      details: unknown;
    }[] = await Promise.all(
      collections.map(async (collection) => {
        return {
          name: collection.name,
          details: await this.getCollection(collection.name),
        };
      }),
    );

    const entries: [string, CanonicalCollection][] = enrichedCollections.map(
      (collection) => {
        const parsed = CanonicalCollectionSchema.safeParse(collection.details);

        if (!parsed.success) {
          throw new Error(
            `Invalid schema for collection "${collection.name}":\n${parsed.error.message}`,
          );
        }

        return [collection.name, parsed.data];
      },
    );

    return Object.fromEntries(entries);
  }

  public async updateCollectionConfiguration(
    collectionName: string,
    newCollection: CanonicalCollection,
    oldCollection: CanonicalCollection | undefined,
  ): Promise<void> {
    const newPayloadSchema = getPayloadSchema(newCollection);
    const oldPayloadSchema = getPayloadSchema(oldCollection);

    const newFieldNames = new Set(Object.keys(newPayloadSchema));
    const oldFieldNames = new Set(Object.keys(oldPayloadSchema));

    for (const oldFieldName of oldFieldNames) {
      if (!newFieldNames.has(oldFieldName)) {
        await this.deletePayloadIndex(collectionName, oldFieldName);
      }
    }

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

  public async createCollectionWithConfiguration(
    collectionName: string,
    collection: CanonicalCollection,
  ): Promise<void> {
    const params = toCreateCollectionParams(collection);

    await this.createCollection(collectionName, params);

    const payloadSchema = getPayloadSchema(collection);

    for (const [fieldName, fieldConfig] of Object.entries(payloadSchema)) {
      await this.createPayloadIndex(collectionName, {
        field_name: fieldName,
        field_schema: fieldConfig.data_type,
      });
    }
  }
}
