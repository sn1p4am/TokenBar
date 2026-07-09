import {
	debounce,
	MarkdownView,
	Plugin,
	setTooltip,
} from 'obsidian';
import { TokenBarSettingTab, TokenBarSettings, normalizeSettings } from './settings';
import { prepareNoteText } from './text';
import { countAllTokenMethods, TokenCountResult } from './tokenizers';

export default class TokenBarPlugin extends Plugin {
	settings!: TokenBarSettings;
	private statusBarItemEl: HTMLElement | null = null;
	private updateRun = 0;
	private updateStatusBarDebounced = debounce(
		() => {
			void this.updateStatusBar();
		},
		200,
		true,
	);

	async onload() {
		await this.loadSettings();

		this.statusBarItemEl = this.addStatusBarItem();
		this.statusBarItemEl.addClass('tokenbar-status');
		this.statusBarItemEl.setAttribute('aria-label', 'TokenBar');
		this.hideStatusBar();

		this.addSettingTab(new TokenBarSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(
				this.app.workspace.on('editor-change', () =>
					this.updateStatusBarDebounced(),
				),
			);
			this.registerEvent(
				this.app.workspace.on('file-open', () =>
					this.updateStatusBarDebounced(),
				),
			);
			this.registerEvent(
				this.app.workspace.on('active-leaf-change', () =>
					this.updateStatusBarDebounced(),
				),
			);

			void this.updateStatusBar();
		});
	}

	onunload() {
		this.statusBarItemEl = null;
	}

	async loadSettings() {
		this.settings = normalizeSettings(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async updateStatusBar() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const statusBarItemEl = this.statusBarItemEl;

		if (!view || !statusBarItemEl) {
			this.hideStatusBar();
			return;
		}

		const run = ++this.updateRun;
		const prepared = prepareNoteText(view.getViewData());

		try {
			const results = await countAllTokenMethods(prepared.text);
			if (run !== this.updateRun) {
				return;
			}

			const primary =
				results.find((result) => result.id === this.settings.primaryMethod) ??
				results[0];

			if (!primary) {
				this.hideStatusBar();
				return;
			}

			statusBarItemEl.setText(`${formatCount(primary.count)} tokens`);
			statusBarItemEl.toggleClass('is-hidden', false);
			this.placeAfterWordCount();
			setTooltip(
				statusBarItemEl,
				this.createTooltip(results, prepared.excludedAttachmentCount),
				{ placement: 'top' },
			);
		} catch (error) {
			console.error('TokenBar failed to count tokens', error);
			if (run === this.updateRun) {
				this.hideStatusBar();
			}
		}
	}

	private createTooltip(
		results: TokenCountResult[],
		excludedAttachmentCount: number,
	): string {
		const lines = results.map((result) => {
			const suffix = result.estimated ? ' est.' : '';
			return `${result.label}: ${formatCount(result.count)}${suffix}`;
		});

		if (excludedAttachmentCount > 0) {
			lines.push('Text only; attachments excluded.');
		}

		return lines.join('\n');
	}

	private hideStatusBar() {
		if (!this.statusBarItemEl) {
			return;
		}

		this.statusBarItemEl.setText('');
		this.statusBarItemEl.toggleClass('is-hidden', true);
		setTooltip(this.statusBarItemEl, '', { placement: 'top' });
	}

	private placeAfterWordCount() {
		const statusBarItemEl = this.statusBarItemEl;
		const parentEl = statusBarItemEl?.parentElement;

		if (!statusBarItemEl || !parentEl) {
			return;
		}

		const items = Array.from(parentEl.children).filter(
			(child): child is HTMLElement => child instanceof HTMLElement,
		);
		let wordCountItem: HTMLElement | null = null;
		for (let index = items.length - 1; index >= 0; index -= 1) {
			const item = items[index];
			if (!item || item === statusBarItemEl) {
				continue;
			}

			if (
				/(\bwords?\b|\bcharacters?\b|\u4e2a\u8bcd|\u4e2a\u5b57\u7b26|\u5b57\u6570|\u5b57\u7b26)/i.test(
					item.textContent ?? '',
				)
			) {
				wordCountItem = item;
				break;
			}
		}

		if (!wordCountItem || wordCountItem.nextElementSibling === statusBarItemEl) {
			return;
		}

		wordCountItem.after(statusBarItemEl);
	}
}

function formatCount(count: number): string {
	return count.toLocaleString();
}
