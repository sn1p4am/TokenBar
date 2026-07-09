# TokenBar

TokenBar is an Obsidian desktop plugin that shows the active note's local token count in the status bar.

## Features

- Status bar display: `1,234 tokens`
- Primary tokenizer setting, defaulting to GPT
- Hover comparison for GPT, Qwen, DeepSeek, Claude (est.), and Gemini (est.)
- Text-only note counting; embedded images and attachments are excluded

## Usage

1. Enable TokenBar from Obsidian's Community plugins settings.
2. Open a Markdown note.
3. Read the token count in the status bar.
4. Hover over the TokenBar status item to compare all supported token counting methods.
5. Open TokenBar's settings to choose the primary tokenizer shown in the status bar.

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
- The bundled `main.js` is larger than 5 MB because TokenBar includes local tokenizer assets. Users on the Obsidian Sync Standard plan may need to install TokenBar separately in each synced vault.

## Third-party notices

TokenBar uses these tokenizer libraries and assets:

- `js-tiktoken` (MIT)
- `tokenx` (MIT)
- `@cyberlangke/tokkit-core` (MIT)
- `@cyberlangke/tokkit-deepseek` (MIT), with tokenizer assets derived from official Hugging Face repositories under the `deepseek-ai` organization
- `@cyberlangke/tokkit-qwen` (Apache-2.0), with tokenizer assets derived from official Hugging Face repositories under the `Qwen` organization

## Development

```bash
pnpm install
pnpm run build
```

For manual installation, copy `main.js`, `manifest.json`, and `styles.css` into:

```text
YourVault/.obsidian/plugins/tokenbar/
```
