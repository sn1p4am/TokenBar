import { brotliDecompressSync } from 'node:zlib';
import { Tiktoken } from 'js-tiktoken/lite';
import { estimateTokenCount } from 'tokenx';
import {
	getTokenizer,
	type NormalizedTokenizerAsset,
	registerTokenizerFamily,
	unpackPackedAsset,
} from '@cyberlangke/tokkit-core';
import { decodeBase85 } from './base85';
import {
	deepseek31Packed,
	deepseek31PackedLength,
} from './generated/deepseek31-packed';
import { o200kBasePacked, o200kBasePackedLength } from './generated/o200k-base-packed';
import { qwen35Packed, qwen35PackedLength } from './generated/qwen35-packed';

export type TokenMethodId = 'gpt' | 'qwen' | 'deepseek' | 'claude' | 'gemini';

export interface TokenMethod {
	id: TokenMethodId;
	label: string;
	estimated: boolean;
}

export interface TokenCountResult extends TokenMethod {
	count: number;
}

export const TOKEN_METHODS: TokenMethod[] = [
	{ id: 'gpt', label: 'GPT', estimated: false },
	{ id: 'qwen', label: 'Qwen', estimated: false },
	{ id: 'deepseek', label: 'DeepSeek', estimated: false },
	{ id: 'claude', label: 'Claude', estimated: true },
	{ id: 'gemini', label: 'Gemini', estimated: true },
];

const QWEN_FAMILY = 'tokenbar-qwen3.5';
const DEEPSEEK_FAMILY = 'tokenbar-deepseek-v3.1';
const BASE64_ALPHABET =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const brotliDecompress = brotliDecompressSync as unknown as (
	input: Uint8Array,
) => Uint8Array;

let registeredLocalFamilies = false;
let gptEncoder: Tiktoken | null = null;
let o200kBase: TiktokenRankData | null = null;

interface TiktokenRankData {
	pat_str: string;
	special_tokens: Record<string, number>;
	bpe_ranks: string;
}

function registerLocalFamilies() {
	if (registeredLocalFamilies) {
		return;
	}

	registerTokenizerFamily({
		family: QWEN_FAMILY,
		aliases: ['qwen', 'qwen3.5'],
		load: () => unpackBase85PackedAsset(qwen35Packed, qwen35PackedLength),
	});

	registerTokenizerFamily({
		family: DEEPSEEK_FAMILY,
		aliases: ['deepseek', 'deepseek-v3.1'],
		load: () => unpackBase85PackedAsset(deepseek31Packed, deepseek31PackedLength),
	});

	registeredLocalFamilies = true;
}

function getGptEncoder(): Tiktoken {
	if (!gptEncoder) {
		gptEncoder = new Tiktoken(getO200kBase());
	}

	return gptEncoder;
}

function getO200kBase(): TiktokenRankData {
	if (!o200kBase) {
		const packed = decodeBase85(o200kBasePacked, o200kBasePackedLength);
		const json = new TextDecoder().decode(brotliDecompress(packed));
		o200kBase = parseTiktokenRankData(json);
	}

	return o200kBase;
}

function parseTiktokenRankData(json: string): TiktokenRankData {
	const parsed: unknown = JSON.parse(json);
	if (!isTiktokenRankData(parsed)) {
		throw new Error('Invalid GPT tokenizer asset.');
	}

	return parsed;
}

function isTiktokenRankData(value: unknown): value is TiktokenRankData {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.pat_str === 'string' &&
		typeof value.bpe_ranks === 'string' &&
		isNumberRecord(value.special_tokens)
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isNumberRecord(value: unknown): value is Record<string, number> {
	return (
		isRecord(value) &&
		Object.values(value).every((entry) => typeof entry === 'number')
	);
}

function unpackBase85PackedAsset(
	packed: string,
	byteLength: number,
): NormalizedTokenizerAsset {
	return unpackPackedAsset(bytesToBase64(decodeBase85(packed, byteLength)));
}

function bytesToBase64(bytes: Uint8Array): string {
	let output = '';

	for (let index = 0; index < bytes.length; index += 3) {
		const first = bytes[index] ?? 0;
		const second = bytes[index + 1] ?? 0;
		const third = bytes[index + 2] ?? 0;
		const value = (first << 16) | (second << 8) | third;

		output += BASE64_ALPHABET[(value >> 18) & 0x3f];
		output += BASE64_ALPHABET[(value >> 12) & 0x3f];
		output += index + 1 < bytes.length ? BASE64_ALPHABET[(value >> 6) & 0x3f] : '=';
		output += index + 2 < bytes.length ? BASE64_ALPHABET[value & 0x3f] : '=';
	}

	return output;
}

export async function countAllTokenMethods(
	text: string,
): Promise<TokenCountResult[]> {
	registerLocalFamilies();

	const baseEstimate = estimateTokenCount(text);
	const [qwenTokenizer, deepseekTokenizer] = await Promise.all([
		getTokenizer(QWEN_FAMILY),
		getTokenizer(DEEPSEEK_FAMILY),
	]);

	const counts: Record<TokenMethodId, number> = {
		gpt: getGptEncoder().encode(text).length,
		qwen: qwenTokenizer.encode(text, { addSpecialTokens: false }).length,
		deepseek: deepseekTokenizer.encode(text, { addSpecialTokens: false }).length,
		claude: Math.ceil(baseEstimate * 1.1),
		gemini: baseEstimate,
	};

	return TOKEN_METHODS.map((method) => ({
		...method,
		count: counts[method.id],
	}));
}

export function isTokenMethodId(value: string): value is TokenMethodId {
	return TOKEN_METHODS.some((method) => method.id === value);
}
