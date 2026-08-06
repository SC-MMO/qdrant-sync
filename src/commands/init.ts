import path from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import {
  DEFAULT_CONFIG,
  DEFAULT_ENV_EXAMPLE,
  DEFAULT_SCHEMA,
} from "../helpers/defaultExamples";

export function runInit() {
  const cwd = process.cwd();

  const configPath = path.resolve(cwd, "qdrant-sync.config.ts");
  const contentPath = path.resolve(cwd, "qdrant-sync");
  const schemaPath = path.resolve(cwd, "qdrant-sync/schema.qdrant-sync.yaml");
  const snapsPath = path.resolve(cwd, "qdrant-sync/snaps");
  const envExamplePath = path.resolve(cwd, ".env.example");

  const existingFiles = [configPath, schemaPath, envExamplePath].filter(
    existsSync,
  );

  if (existingFiles.length > 0) {
    console.error(
      "Error: Initialization aborted because the following file(s) already exist:",
    );
    for (const file of existingFiles) {
      console.error(`- ${path.relative(cwd, file)}`);
    }
    process.exit(1);
  }

  console.log("Running init");

  console.log("Creating qdrant-sync.config.ts");
  writeFileSync(configPath, DEFAULT_CONFIG, "utf8");

  console.log("Creating qdrant-sync dir");
  mkdirSync(contentPath, { recursive: true });

  console.log("Creating qdrant-sync/schema.qdrant-sync.yaml");
  writeFileSync(schemaPath, DEFAULT_SCHEMA, "utf8");

  console.log("Creating qdrant-sync/snaps dir");
  mkdirSync(snapsPath, { recursive: true });

  console.log("Creating .env.example");
  writeFileSync(envExamplePath, DEFAULT_ENV_EXAMPLE, "utf8");

  console.log("Make sure to update your environmental variables (.env)");
}
