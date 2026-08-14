import { QdrantSyncClient } from '../helpers/qdrant';
import { deleteInnerRec, isFile, writeYaml } from '../helpers/fileHelper';
import { loadUserConfig } from '../helpers/loadConfig';
import path from 'node:path';

export async function runPull(): Promise<void> {
	console.log('Running pull');

	console.log('Fetching config...');
	const CONFIG = await loadUserConfig();

	console.log('Fetching data...');
	const client = new QdrantSyncClient(CONFIG);
	const data = await client.readCollectionConfigurations();

	console.log('Writing data...');

	if (isFile(CONFIG.schema)) {
		writeYaml(CONFIG.schema, data);
		console.log(`Wrote schema to ${CONFIG.schema}`);
	} else {
		deleteInnerRec(CONFIG.schema);

		for (const [key, value] of Object.entries(data)) {
			const fp = path.join(CONFIG.schema, `${key}.qdrant-orm.yaml`);
			const partialData = { [key]: value };
			writeYaml(fp, partialData);
			console.log(`Wrote schema to ${fp}`);
		}
	}
}
