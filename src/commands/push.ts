import { QdrantSyncClient } from "../helpers/datasourceClient";
import { loadUserConfig } from "../helpers/loadConfig";
import { readFromSchema } from "../helpers/readFromSchema";
import { type CanonicalCollections } from "../helpers/types";

export async function runPush(args: string[]) {
  console.log("Running push");
  console.log("Args:", args);

  console.log("Fetching config...");
  const CONFIG = loadUserConfig();

  const origin = args[0] ?? CONFIG.schema;
  console.log(`Determined origin to be ${origin}`);

  console.log("Reading data...");
  const data = readFromSchema(origin, CONFIG.selectedCollections);

  console.log("Pushing data...");
  const client = new QdrantSyncClient(CONFIG);

  const response = await client.getCollections();
  const existingCollectionNames = new Set(
    response.collections.map((collection) => collection.name),
  );

  const oldData: CanonicalCollections =
    await client.readCollectionConfigurations();

  for (const [collectionName, newCollection] of Object.entries(data)) {
    if (existingCollectionNames.has(collectionName)) {
      await client.updateCollectionConfiguration(
        collectionName,
        newCollection,
        oldData[collectionName],
      );
    } else {
      await client.createCollectionWithConfiguration(
        collectionName,
        newCollection,
      );
    }
  }
}
