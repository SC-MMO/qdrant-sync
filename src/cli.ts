#!/usr/bin/env node

import { runInit } from "./commands/init";
import { runPull } from "./commands/pull";
import { runPush } from "./commands/push";
import { runSnap } from "./commands/snap";

const [, , command, ...args] = process.argv;

switch (command) {
  case "init":
    runInit();
    break;
  case "pull":
    runPull();
    break;
  case "snap":
    runSnap(args);
    break;
  case "push":
    runPush(args);
    break;
  default:
    console.error(
      "Usage: qdrant-sync <init | pull | snap <name> | push <snap?>",
    );
    process.exit(1);
}
