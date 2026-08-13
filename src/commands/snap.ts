import { loadUserConfig } from "../helpers/loadConfig";
import { readFromSchema } from "../helpers/readFromSchema";
import { snapName } from "../helpers/snapName";
import { writeYaml } from "../helpers/fileHelper";
import path from "node:path";

export function runSnap(args: string[]) {
  if (args.length < 1 || args[0] == undefined) {
    console.error("Expected snap name\nUsage: qdrant-sync snap <name>");
    process.exit(1);
  }

  console.log("Running snap");

  console.log("Fetching config...");
  const CONFIG = loadUserConfig();

  const origin = CONFIG.schema;
  console.log(`Determined origin to be ${origin}`);

  console.log("Reading config...");
  const data = readFromSchema(origin, CONFIG.selectedCollections);

  console.log("Writing snap...");
  const snapPath = path.resolve(CONFIG.snaps, snapName(args[0]));
  writeYaml(snapPath, data);
}
