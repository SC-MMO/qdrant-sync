import * as Path from 'path';
import { CanonicalCollectionSchema, type CanonicalCollection } from './types';
import fs from 'fs';
import { readYaml } from './fileHelper.js';

function readOneSchema(path: string): CanonicalCollection {
	return CanonicalCollectionSchema.parse(readYaml(path));
}

function readMultipleSchemas(path: string): CanonicalCollection[] {
	const files = fs.readdirSync(path, { encoding: 'utf8', recursive: true });
	return files.filter((file) => file.endsWith('.yaml') || file.endsWith('.yml')).map((file) => readOneSchema(Path.join(path, file)));
}

export function readFromSchema(path: string, selectedCollections: string[] | null = null): Record<string, CanonicalCollection> {
	const isFile = fs.statSync(path).isFile();

	const collections = isFile ? readOneSchema(path) : readMultipleSchemas(path).reduce((acc, obj) => ({ ...acc, ...obj }), {});

	const filteredCollections =
		selectedCollections === null ? collections : Object.fromEntries(Object.entries(collections).filter(([key]) => selectedCollections.includes(key)));

	const collectionMap = Object.fromEntries(
		Object.entries(filteredCollections).map(([key, value]) => {
			const parsed = CanonicalCollectionSchema.safeParse(value);
			if (!parsed.success) {
				throw new Error(`Invalid schema for collection "${key}":\n${parsed.error.message}`);
			}
			return [key, parsed.data];
		}),
	);

	return collectionMap;
}
