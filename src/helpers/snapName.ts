import { randomUUID } from "crypto";

export function snapName(name: string): string {
  const now = new Date();

  const timestamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const uuid = randomUUID().replace(/-/g, "");

  return `${timestamp}_${name}_${uuid}.yaml`;
}
