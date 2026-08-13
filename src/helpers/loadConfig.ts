import path from "node:path";
import { existsSync } from "node:fs";
import jiti from "jiti";
import { type QdrantSyncConfig } from "./types";

export function loadUserConfig(): QdrantSyncConfig {
  const cwd = process.cwd();
  const configPath = path.resolve(cwd, "qdrant-sync.config.ts");

  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const load = jiti(cwd);
  const mod = load(configPath);

  if (!("default" in mod)) {
    throw new Error(`Default export not found in ${configPath}`);
  }

  return mod.default;
}
