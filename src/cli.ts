#!/usr/bin/env node

import { runInit } from './commands/init';
import { runPull } from './commands/pull';
import { runPush } from './commands/push';
import { runSnap } from './commands/snap';
import { Command } from 'commander';

const program = new Command();

program
	.name('qdrant-sync')
	.description('Small CLI for keeping Qdrant collection configuration in YAML files so it can be versioned, reviewed, and restored.')
	.version('1.0.0');

program
	.command('init')
	.description('Setup qdrant-sync environment (directories/files)')
	.action(() => {
		runInit();
	});
program
	.command('pull')
	.description('Pull your Qdrant configuration into a schema')
	.action(() => {
		void runPull();
	});
program
	.command('snap')
	.description('Create a snap of your schema')
	.argument('<name>', 'Name of the snap')
	.action((args: { name: string }) => {
		void runSnap(args.name);
	});
program
	.command('push')
	.description('Push a schema or snap to Qdrant')
	.argument('[source]', 'Source of the schema to be pushed')
	.action((args: { source?: string }) => {
		void (args.source ? runPush(args.source) : runPush());
	});

program.parse();
