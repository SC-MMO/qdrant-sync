import { client } from "./client.ts";
import {
  CanonicalCollection,
  CanonicalCollectionSchema,
} from "./canonicalSchema.ts";

type CollectionInfo = {
  name: string;
};

export async function readFromDatasource(): Promise<
  Record<string, CanonicalCollection>
> {
  const collections: CollectionInfo[] = (await client.getCollections())
    .collections;

  const enrichedCollections: any = await Promise.all(
    collections.map(async (collection) => {
      return {
        name: collection.name,
        details: await client.getCollection(collection.name),
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
