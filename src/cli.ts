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
    void runPull();
    break;
  case "snap":
    void runSnap(args);
    break;
  case "push":
    void runPush(args);
    break;
  case undefined:
    console.error(
      "Usage: qdrant-sync <init | pull | snap <name> | push <snap?>",
    );
    process.exit(1);
}
