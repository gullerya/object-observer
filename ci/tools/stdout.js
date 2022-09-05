import os from 'node:os';

export function writeNewline() {
	process.stdout.write(os.EOL);
}

export function writeGreen(string) {
	process.stdout.write(`\x1B[32m${string}\x1B[0m`);
}

export function write(string) {
	process.stdout.write(string);
}
