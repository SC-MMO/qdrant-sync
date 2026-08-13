import YAML from 'yaml';
import fs from 'fs';
import path from 'node:path';

export function readYaml(path: string): unknown {
	const file = fs.readFileSync(path, 'utf-8');
	return YAML.parse(file) as unknown;
}

export function writeYaml(path: string, content: object): void {
	const data = YAML.stringify(content);
	fs.writeFileSync(path, data);
}

export function isFile(path: string): boolean {
	return fs.statSync(path).isFile();
}

export function deleteInnerRec(dirPath: string): void {
	if (!fs.existsSync(dirPath)) return;
	if (!fs.statSync(dirPath).isDirectory()) return;

	for (const entry of fs.readdirSync(dirPath)) {
		const fullPath = path.join(dirPath, entry);
		fs.rmSync(fullPath, { recursive: true, force: true });
	}
}
