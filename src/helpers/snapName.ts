import { randomUUID } from 'crypto';

export function snapName(name: string): string {
	const now = new Date();
	const uuid = randomUUID().replace(/-/g, '');

	return `${now.toISOString()}_${name}_${uuid}.yaml`;
}
