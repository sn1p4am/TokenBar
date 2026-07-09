import { Buffer } from 'node:buffer';
import { brotliDecompressSync } from 'node:zlib';
import { Tiktoken } from 'js-tiktoken/lite';
import { estimateTokenCount } from 'tokenx';
import {
	getTokenizer,
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
		o200kBase = JSON.parse(
			brotliDecompressSync(packed).toString('utf8'),
		) as TiktokenRankData;
	}

	return o200kBase;
}

function unpackBase85PackedAsset(packed: string, byteLength: number) {
	return unpackPackedAsset(Buffer.from(decodeBase85(packed, byteLength)).toString('base64'));
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
