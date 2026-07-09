import { Tiktoken } from 'js-tiktoken/lite';
import o200kBase from 'js-tiktoken/ranks/o200k_base';
import { estimateTokenCount } from 'tokenx';
import {
	getTokenizer,
	registerTokenizerFamily,
	unpackPackedAsset,
} from '@cyberlangke/tokkit-core';

// These provider packages do not publish public subpath exports for the generated
// assets, so TokenBar imports the packaged assets directly and bundles them.
// @ts-expect-error Generated tokenizer asset has no TypeScript declaration.
import qwen35Asset from '../node_modules/@cyberlangke/tokkit-qwen/dist/generated/qwen3_5.js';
// @ts-expect-error Generated tokenizer asset has no TypeScript declaration.
import deepseek31Asset from '../node_modules/@cyberlangke/tokkit-deepseek/dist/generated/deepseek_v3_1.js';

const qwen35PackedAsset = qwen35Asset as unknown as string;
const deepseek31PackedAsset = deepseek31Asset as unknown as string;

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

function registerLocalFamilies() {
	if (registeredLocalFamilies) {
		return;
	}

	registerTokenizerFamily({
		family: QWEN_FAMILY,
		aliases: ['qwen', 'qwen3.5'],
		load: () => unpackPackedAsset(qwen35PackedAsset),
	});

	registerTokenizerFamily({
		family: DEEPSEEK_FAMILY,
		aliases: ['deepseek', 'deepseek-v3.1'],
		load: () => unpackPackedAsset(deepseek31PackedAsset),
	});

	registeredLocalFamilies = true;
}

function getGptEncoder(): Tiktoken {
	if (!gptEncoder) {
		gptEncoder = new Tiktoken(o200kBase);
	}

	return gptEncoder;
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
