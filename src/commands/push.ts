import { confirm } from '../helpers/confirm';
import { loadUserConfig } from '../helpers/loadConfig';
import { getImmutableConfigurationDifferences, QdrantSyncClient } from '../helpers/qdrant';
import { readFromSchema } from '../helpers/readFromSchema';

export async function runPush(file: string | null = null, recreate: boolean = false): Promise<void> {
	console.log('Running push');

	console.log('Fetching config...');
	const CONFIG = await loadUserConfig();

	const origin = file ?? CONFIG.schema;
	console.log(`Determined origin to be ${origin}`);

	console.log('Reading data...');
	const data = readFromSchema(origin, CONFIG.selectedCollections);

	console.log('Pushing data...');
	const client = new QdrantSyncClient(CONFIG);
	const existingCollections = await client.readCollectionConfigurations();

	for (const [collectionName, newCollection] of Object.entries(data)) {
		const oldCollection = existingCollections[collectionName];

		if (oldCollection === undefined) {
			await client.createCollectionWithConfiguration(collectionName, newCollection);
			continue;
		}

		const immutableDifferences = getImmutableConfigurationDifferences(newCollection, oldCollection);

		if (immutableDifferences.length === 0) {
			await client.updateCollectionConfiguration(collectionName, newCollection, oldCollection);
			continue;
		}

		const doRecreate =
			recreate ||
			(await confirm(
				`Collection "${collectionName}" has immutable configuration differences (${immutableDifferences.join(', ')}). ` +
					'Do you want to delete and recreate it? This deletes all points in the collection.',
			));

		if (doRecreate) {
			await client.recreateCollectionWithConfiguration(collectionName, newCollection);
		} else {
			console.log(`Skipped collection "${collectionName}".`);
		}
	}
}
