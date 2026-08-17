import { QdrantClient } from '@qdrant/js-client-rest';
import { toCreateCollectionParams, toPostCreateCollectionParams, toUpdateCollectionParams } from './collectionConfiguration';
import { getPayloadSchema, isSamePayloadFieldSchema } from './payloadConfiguration';
import { type CanonicalCollection, CanonicalCollectionSchema, type CollectionInfo, type PayloadSchema, type QdrantSyncConfig } from '../types';

export class QdrantSyncClient {
	public readonly config: QdrantSyncConfig;
	private readonly client: QdrantClient;

	public constructor(config: QdrantSyncConfig) {
		const params = Object.fromEntries(Object.entries(config.datasource).filter(([_key, value]) => value !== undefined));

		this.client = new QdrantClient(params);
		this.config = config;
	}

	public async readCollectionConfigurations(): Promise<Record<string, CanonicalCollection>> {
		const collections = await this.readSelectedCollections();
		const entries = await Promise.all(
			collections.map(async (collection): Promise<[string, CanonicalCollection]> => {
				const details = await this.client.getCollection(collection.name);
				const parsed = CanonicalCollectionSchema.safeParse(details);

				if (!parsed.success) {
					throw new Error(`Invalid schema for collection "${collection.name}":\n${parsed.error.message}`);
				}

				return [collection.name, parsed.data];
			}),
		);

		return Object.fromEntries(entries);
	}

	public async updateCollectionConfiguration(collectionName: string, newCollection: CanonicalCollection, oldCollection: CanonicalCollection): Promise<void> {
		const updateParams = toUpdateCollectionParams(collectionName, newCollection, oldCollection);
		if (updateParams !== null) {
			await this.client.updateCollection(collectionName, updateParams);
		}

		await this.syncPayloadIndexes(collectionName, getPayloadSchema(newCollection), getPayloadSchema(oldCollection));
	}

	public async createCollectionWithConfiguration(collectionName: string, collection: CanonicalCollection): Promise<void> {
		await this.client.createCollection(collectionName, toCreateCollectionParams(collection));

		const postCreateParams = toPostCreateCollectionParams(collection);
		if (postCreateParams !== null) {
			await this.client.updateCollection(collectionName, postCreateParams);
		}

		await this.createPayloadIndexes(collectionName, getPayloadSchema(collection));
	}

	public async recreateCollectionWithConfiguration(collectionName: string, collection: CanonicalCollection): Promise<void> {
		await this.client.deleteCollection(collectionName);
		await this.createCollectionWithConfiguration(collectionName, collection);
	}

	private async readSelectedCollections(): Promise<CollectionInfo[]> {
		return (await this.client.getCollections()).collections.filter((collection) => {
			if (this.config.selectedCollections === null) {
				return true;
			}

			return this.config.selectedCollections.includes(collection.name);
		});
	}

	private async syncPayloadIndexes(collectionName: string, newSchema: PayloadSchema, oldSchema: PayloadSchema): Promise<void> {
		const newFieldNames = new Set(Object.keys(newSchema));
		const oldFieldNames = new Set(Object.keys(oldSchema));

		for (const oldFieldName of oldFieldNames) {
			if (!newFieldNames.has(oldFieldName)) {
				await this.client.deletePayloadIndex(collectionName, oldFieldName);
			}
		}

		for (const [fieldName, fieldConfig] of Object.entries(newSchema)) {
			const oldFieldConfig = oldSchema[fieldName];

			if (oldFieldConfig === undefined) {
				await this.client.createPayloadIndex(collectionName, {
					field_name: fieldName,
					field_schema: fieldConfig.data_type,
				});
				continue;
			}

			if (!isSamePayloadFieldSchema(oldFieldConfig, fieldConfig)) {
				await this.client.deletePayloadIndex(collectionName, fieldName);
				await this.client.createPayloadIndex(collectionName, {
					field_name: fieldName,
					field_schema: fieldConfig.data_type,
				});
			}
		}
	}

	private async createPayloadIndexes(collectionName: string, schema: PayloadSchema): Promise<void> {
		for (const [fieldName, fieldConfig] of Object.entries(schema)) {
			await this.client.createPayloadIndex(collectionName, {
				field_name: fieldName,
				field_schema: fieldConfig.data_type,
			});
		}
	}
}
