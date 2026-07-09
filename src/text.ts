const OBSIDIAN_EMBED_PATTERN = /!\[\[[^\]]+?\]\]/g;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*?\]\([^)]+?\)/g;
const HTML_MEDIA_PATTERN =
	/<img\b[^>]*>|<(?:audio|video|iframe|embed|object)\b[^>]*(?:\/>|>.*?<\/(?:audio|video|iframe|embed|object)>)/gis;

export interface PreparedNoteText {
	text: string;
	excludedAttachmentCount: number;
}

export function prepareNoteText(rawText: string): PreparedNoteText {
	let excludedAttachmentCount = 0;
	let text = rawText;

	const strip = (pattern: RegExp) => {
		text = text.replace(pattern, () => {
			excludedAttachmentCount += 1;
			return '';
		});
	};

	strip(OBSIDIAN_EMBED_PATTERN);
	strip(MARKDOWN_IMAGE_PATTERN);
	strip(HTML_MEDIA_PATTERN);

	return {
		text,
		excludedAttachmentCount,
	};
}
