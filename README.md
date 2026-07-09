# TokenBar

TokenBar is an Obsidian desktop plugin that shows the active note's local token count in the status bar.

## Features

- Status bar display: `1,234 tokens`
- Primary tokenizer setting, defaulting to GPT
- Hover comparison for GPT, Qwen, DeepSeek, Claude (est.), and Gemini (est.)
- Text-only note counting; embedded images and attachments are excluded

## Tokenizers

- GPT: `js-tiktoken` with `o200k_base`
- Qwen: bundled Qwen3.5 tokenizer asset
- DeepSeek: bundled DeepSeek V3.1 tokenizer asset
- Claude and Gemini: lightweight local estimates

All counting is local. Claude and Gemini values are estimates and may differ from provider-side token counts.

## Development

```bash
pnpm install
pnpm run build
```

For manual installation, copy `main.js`, `manifest.json`, and `styles.css` into:

```text
YourVault/.obsidian/plugins/tokenbar/
```
