import { App, PluginSettingTab, Setting } from 'obsidian';
import type TokenBarPlugin from './main';
import { isTokenMethodId, TOKEN_METHODS, TokenMethodId } from './tokenizers';

export interface TokenBarSettings {
	primaryMethod: TokenMethodId;
}

export const DEFAULT_SETTINGS: TokenBarSettings = {
	primaryMethod: 'gpt',
};

export function normalizeSettings(data: unknown): TokenBarSettings {
	const settings = data as Partial<TokenBarSettings> | null;
	const primaryMethod =
		settings?.primaryMethod && isTokenMethodId(settings.primaryMethod)
			? settings.primaryMethod
			: DEFAULT_SETTINGS.primaryMethod;

	return {
		primaryMethod,
	};
}

export class TokenBarSettingTab extends PluginSettingTab {
	plugin: TokenBarPlugin;

	constructor(app: App, plugin: TokenBarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Primary tokenizer')
			.setDesc('Method shown in the status bar. Hover compares all local methods.')
			.addDropdown((dropdown) => {
				for (const method of TOKEN_METHODS) {
					const suffix = method.estimated ? ' (est.)' : '';
					dropdown.addOption(method.id, `${method.label}${suffix}`);
				}

				dropdown
					.setValue(this.plugin.settings.primaryMethod)
					.onChange(async (value) => {
						if (!isTokenMethodId(value)) {
							return;
						}

						this.plugin.settings.primaryMethod = value;
						await this.plugin.saveSettings();
						await this.plugin.updateStatusBar();
					});
			});
	}
}
