const BASE85_ALPHABET =
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~';

const BASE85_LOOKUP = new Map(
	Array.from(BASE85_ALPHABET, (character, index) => [character, index]),
);

export function decodeBase85(encoded: string, byteLength: number): Uint8Array {
	const output = new Uint8Array(Math.ceil(encoded.length / 5) * 4);
	let outputIndex = 0;

	for (let index = 0; index < encoded.length; index += 5) {
		let value = 0;
		for (let digit = 0; digit < 5; digit += 1) {
			const character = encoded[index + digit];
			const decoded = character ? BASE85_LOOKUP.get(character) : undefined;
			if (decoded === undefined) {
				throw new Error('Invalid base85 tokenizer asset.');
			}
			value = value * 85 + decoded;
		}

		output[outputIndex++] = Math.floor(value / 2 ** 24) & 0xff;
		output[outputIndex++] = Math.floor(value / 2 ** 16) & 0xff;
		output[outputIndex++] = Math.floor(value / 2 ** 8) & 0xff;
		output[outputIndex++] = value & 0xff;
	}

	return output.slice(0, byteLength);
}
