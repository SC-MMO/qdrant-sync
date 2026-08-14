import * as Path from 'path';
import { CanonicalCollectionSchema, type CanonicalCollections } from './types';
import fs from 'fs';
import { readYaml } from './fileHelper.js';
import { z } from 'zod';

const CanonicalCollectionsSchema = z.record(z.string(), CanonicalCollectionSchema);

function readOneSchema(path: string): CanonicalCollections {
	return CanonicalCollectionsSchema.parse(readYaml(path));
}

function readMultipleSchemas(path: string): CanonicalCollections[] {
	const files = fs.readdirSync(path, { encoding: 'utf8', recursive: true });

	return files.filter((file) => file.endsWith('.yaml') || file.endsWith('.yml')).map((file) => readOneSchema(Path.join(path, file)));
}

export function readFromSchema(path: string, selectedCollections: string[] | null = null): CanonicalCollections {
	const isFile = fs.statSync(path).isFile();

	const collections = isFile ? readOneSchema(path) : readMultipleSchemas(path).reduce<CanonicalCollections>((acc, obj) => ({ ...acc, ...obj }), {});

	return selectedCollections === null ? collections : Object.fromEntries(Object.entries(collections).filter(([key]) => selectedCollections.includes(key)));
}
