#!/usr/bin/env node
import { Command } from 'commander';
import { runInit } from './commands/init';
import { runPull } from './commands/pull';
import { runPush } from './commands/push';
import { runSnap } from './commands/snap';
import { confirm } from './helpers/confirm';

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
	.action((name: string) => {
		void runSnap(name);
	});

program
	.command('push')
	.description('Push a schema or snap to Qdrant')
	.argument('[source]', 'Source of the schema to be pushed')
	.option('-f, --force', 'Push without asking for initial user validation')
	.option('-r, --recreate', 'Recreate collections with immutable differences without asking for additional validation')
	.action(async (source: string | undefined, options: { force?: boolean; recreate?: boolean }) => {
		const approved = options.force === true ? true : await confirm('This will overwrite your database configuration, do you want that?');

		if (approved) {
			await runPush(source ?? null, options.recreate === true);
		}
	});

program.parse();
