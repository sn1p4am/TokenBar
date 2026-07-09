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

## Privacy

TokenBar runs fully locally. It does not send note content to remote services, does not include telemetry, and does not require an account or payment.

## Limitations

- Claude and Gemini counts are estimates because their provider-side tokenizers are not bundled.
- Embedded images and attachments are excluded; TokenBar counts note text only.
- TokenBar is desktop-only.

## Third-party notices

TokenBar uses these tokenizer libraries and assets:

- `js-tiktoken` (MIT)
- `tokenx` (MIT)
- `@cyberlangke/tokkit-core` (MIT)
- `@cyberlangke/tokkit-deepseek` (MIT)
- `@cyberlangke/tokkit-qwen` (Apache-2.0)

## Development

```bash
pnpm install
pnpm run build
```

For manual installation, copy `main.js`, `manifest.json`, and `styles.css` into:

```text
YourVault/.obsidian/plugins/tokenbar/
```
