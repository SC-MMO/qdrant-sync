import { type CanonicalCollection, type PayloadSchema } from '../types';

export function getPayloadSchema(collection: CanonicalCollection | undefined): PayloadSchema {
	return collection?.payload_schema ?? {};
}

export function isSamePayloadFieldSchema(
	a: PayloadSchema[string] | undefined,
	b: PayloadSchema[string] | undefined,
): boolean {
	if (a === undefined || b === undefined) {
		return a === b;
	}

	return a.data_type === b.data_type;
}
