import { config } from "dotenv";
config();

export function readKey(key: string): string {
  const value = process.env[key];

  if (!value) {
    return "";
  }

  return value;
}

export function readKeyOrThrow(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Environment variable ${key} is missing or empty`);
  }

  return value;
}
