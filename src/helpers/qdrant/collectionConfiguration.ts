import { isDeepStrictEqual } from 'node:util';
import { type CanonicalCollection, type CreateCollectionParams, type UpdateCollectionParams } from '../types';

type UnknownRecord = Record<string, unknown>;

const MUTABLE_COLLECTION_PARAM_KEYS = [
	'replication_factor',
	'write_consistency_factor',
	'read_fan_out_factor',
	'read_fan_out_delay_ms',
	'payload',
	'on_disk_payload',
] as const;

const IMMUTABLE_COLLECTION_PARAM_KEYS = ['shard_number', 'sharding_method'] as const;
const MUTABLE_VECTOR_PARAM_KEYS = ['hnsw_config', 'quantization_config', 'on_disk'] as const;
const IMMUTABLE_VECTOR_PARAM_KEYS = ['size', 'distance', 'datatype', 'multivector_config'] as const;

const POST_CREATE_COLLECTION_PARAM_KEYS = ['read_fan_out_factor', 'read_fan_out_delay_ms', 'payload'] as const;

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
	return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;
}

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasEntries(value: UnknownRecord): boolean {
	return Object.keys(value).length > 0;
}

function normalizeVectors(vectors: unknown): Record<string, UnknownRecord> {
	if (!isRecord(vectors)) {
		return {};
	}

	if ('size' in vectors && 'distance' in vectors) {
		return { '': vectors };
	}

	return Object.fromEntries(Object.entries(vectors).filter(([, vector]) => isRecord(vector))) as Record<string, UnknownRecord>;
}

function collectChangedExplicitKeys(prefix: string, newValue: UnknownRecord, oldValue: UnknownRecord, keys: readonly string[]): string[] {
	const differences: string[] = [];

	for (const key of keys) {
		if (newValue[key] !== undefined && !isDeepStrictEqual(newValue[key], oldValue[key])) {
			differences.push(`${prefix}.${key}`);
		}
	}

	return differences;
}

export function getImmutableConfigurationDifferences(newCollection: CanonicalCollection, oldCollection: CanonicalCollection): string[] {
	const differences: string[] = [];
	const newConfig = newCollection.config as UnknownRecord;
	const oldConfig = oldCollection.config as UnknownRecord;

	if (newConfig['wal_config'] !== undefined && !isDeepStrictEqual(newConfig['wal_config'], oldConfig['wal_config'])) {
		differences.push('config.wal_config');
	}

	const newParams = newCollection.config.params as UnknownRecord;
	const oldParams = oldCollection.config.params as UnknownRecord;

	differences.push(...collectChangedExplicitKeys('config.params', newParams, oldParams, IMMUTABLE_COLLECTION_PARAM_KEYS));

	if (newParams['vectors'] === undefined) {
		return differences;
	}

	const newVectors = normalizeVectors(newParams['vectors']);
	const oldVectors = normalizeVectors(oldParams['vectors']);
	const newVectorNames = Object.keys(newVectors).sort();
	const oldVectorNames = Object.keys(oldVectors).sort();

	if (!isDeepStrictEqual(newVectorNames, oldVectorNames)) {
		differences.push('config.params.vectors.names');
		return differences;
	}

	for (const [vectorName, newVector] of Object.entries(newVectors)) {
		const oldVector = oldVectors[vectorName] ?? {};
		const scope = vectorName === '' ? 'config.params.vectors' : `config.params.vectors.${vectorName}`;
		differences.push(...collectChangedExplicitKeys(scope, newVector, oldVector, IMMUTABLE_VECTOR_PARAM_KEYS));
	}

	return differences;
}

function buildChangedFields(newValue: UnknownRecord, oldValue: UnknownRecord, keys: readonly string[]): UnknownRecord {
	const result: UnknownRecord = {};

	for (const key of keys) {
		if (newValue[key] !== undefined && !isDeepStrictEqual(newValue[key], oldValue[key])) {
			result[key] = newValue[key];
		}
	}

	return result;
}

function buildVectorUpdate(newVectorsValue: unknown, oldVectorsValue: unknown): UnknownRecord | undefined {
	if (newVectorsValue === undefined) {
		return undefined;
	}

	const newVectors = normalizeVectors(newVectorsValue);
	const oldVectors = normalizeVectors(oldVectorsValue);
	const vectorUpdate: UnknownRecord = {};

	for (const [vectorName, newVector] of Object.entries(newVectors)) {
		const oldVector = oldVectors[vectorName] ?? {};
		const changed = buildChangedFields(newVector, oldVector, MUTABLE_VECTOR_PARAM_KEYS);

		if (hasEntries(changed)) {
			vectorUpdate[vectorName] = changed;
		}
	}

	return hasEntries(vectorUpdate) ? vectorUpdate : undefined;
}

function buildMetadataUpdate(newMetadata: unknown, oldMetadata: unknown): UnknownRecord | undefined {
	if (newMetadata === undefined) {
		return undefined;
	}

	const oldRecord = isRecord(oldMetadata) ? oldMetadata : {};
	const newRecord = isRecord(newMetadata) ? newMetadata : {};
	const update: UnknownRecord = {};

	for (const [key, value] of Object.entries(newRecord)) {
		if (!isDeepStrictEqual(value, oldRecord[key])) {
			update[key] = value;
		}
	}

	for (const key of Object.keys(oldRecord)) {
		if (!(key in newRecord)) {
			update[key] = null;
		}
	}

	return hasEntries(update) ? update : undefined;
}

export function toUpdateCollectionParams(
	collectionName: string,
	newCollection: CanonicalCollection,
	oldCollection: CanonicalCollection,
): UpdateCollectionParams | null {
	const immutableDifferences = getImmutableConfigurationDifferences(newCollection, oldCollection);
	if (immutableDifferences.length > 0) {
		throw new Error(`Cannot update collection "${collectionName}" in place because immutable settings changed: ${immutableDifferences.join(', ')}`);
	}

	const newConfig = newCollection.config as UnknownRecord;
	const oldConfig = oldCollection.config as UnknownRecord;
	const newParams = newCollection.config.params as UnknownRecord;
	const oldParams = oldCollection.config.params as UnknownRecord;
	const update: UnknownRecord = {};

	const paramsUpdate = buildChangedFields(newParams, oldParams, MUTABLE_COLLECTION_PARAM_KEYS);
	if (hasEntries(paramsUpdate)) {
		update['params'] = paramsUpdate;
	}

	const vectorsUpdate = buildVectorUpdate(newParams['vectors'], oldParams['vectors']);
	if (vectorsUpdate !== undefined) {
		update['vectors'] = vectorsUpdate;
	}

	for (const ident of ['sparse_vectors', 'hnsw_config', 'optimizers_config', 'quantization_config', 'strict_mode_config']) {
		if (newParams[ident] !== undefined && !isDeepStrictEqual(newParams[ident], oldParams[ident])) {
			update[ident] = newParams[ident];
		}
	}

	const metadataUpdate = buildMetadataUpdate(newConfig['metadata'], oldConfig['metadata']);
	if (metadataUpdate !== undefined) {
		update['metadata'] = metadataUpdate;
	}

	return hasEntries(update) ? update : null;
}

export function toCreateCollectionParams(collection: CanonicalCollection): CreateCollectionParams {
	const config = collection.config;
	const params = config.params;

	const normalized = omitUndefined({
		vectors:
			params.vectors == null
				? params.vectors
				: Array.isArray(params.vectors)
					? params.vectors
					: typeof params.vectors === 'object'
						? omitUndefined(params.vectors)
						: params.vectors,
		shard_number: params.shard_number,
		sharding_method: params.sharding_method,
		replication_factor: params.replication_factor,
		write_consistency_factor: params.write_consistency_factor,
		on_disk_payload: params.on_disk_payload,
		sparse_vectors: params.sparse_vectors,
		hnsw_config: config.hnsw_config,
		wal_config: config.wal_config,
		optimizers_config: config.optimizer_config,
		quantization_config: config.quantization_config,
		strict_mode_config: config.strict_mode_config,
		metadata: config.metadata,
	});

	return normalized as CreateCollectionParams;
}

export function toPostCreateCollectionParams(collection: CanonicalCollection): UpdateCollectionParams | null {
	const params = collection.config.params as UnknownRecord;
	const paramsUpdate = buildChangedFields(params, {}, POST_CREATE_COLLECTION_PARAM_KEYS);

	if (!hasEntries(paramsUpdate)) {
		return null;
	}

	return { params: paramsUpdate };
}
