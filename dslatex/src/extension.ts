import * as vscode from 'vscode';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);



const tex = new TeX({ packages: AllPackages });
const output = new SVG({ fontCache: 'none' });

const mj = mathjax.document('', {
	InputJax: tex,
	OutputJax: output
});

const renderCache = new Map<string, string>();
const maxCacheSize = 256;

type InlineToken =
	| { type: 'text'; value: string }
	| { type: 'math'; value: string };

type Block =
	| { type: 'text'; value: string }
	| { type: 'display'; value: string };

function getLatexColor(): string {
	switch (vscode.window.activeColorTheme.kind) {
		case vscode.ColorThemeKind.Light:
			return '#222222';

		case vscode.ColorThemeKind.HighContrastLight:
			return '#000000';

		case vscode.ColorThemeKind.HighContrast:
			return '#ffffff';

		default:
			return '#dddddd';
	}
}

function unwrapDsLatexComment(text: string): string {
	const match = text.match(
		/^\s*<!--dslatex\s*([\s\S]*?)\s*-->\s*$/
	);

	return match ? match[1] : text;
}

function getStrokeWidth(): number {
	return vscode.workspace
		.getConfiguration('dslatex')
		.get<number>('strokeWidth', 18);
}

function isEnabled(): boolean {
	return vscode.workspace
		.getConfiguration('dslatex')
		.get<boolean>('enabled', true);
}

function cleanDocstring(text: string): string {
	const lines = text
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.split('\n');

	if (lines.length === 0) {
		return '';
	}

	lines[0] = lines[0].trim();

	let margin = Infinity;

	for (let i = 1; i < lines.length; i++) {
		if (!lines[i].trim()) {
			continue;
		}

		const indent =
			lines[i].match(/^[ \t]*/)?.[0].length ?? 0;

		margin = Math.min(margin, indent);
	}

	if (margin !== Infinity) {
		for (let i = 1; i < lines.length; i++) {
			lines[i] = lines[i].slice(
				Math.min(margin, lines[i].length)
			);
		}
	}

	while (lines.length && !lines[0].trim()) {
		lines.shift();
	}

	while (
		lines.length &&
		!lines[lines.length - 1].trim()
	) {
		lines.pop();
	}

	return lines.join('\n');
}

function renderLatex(
	source: string,
	display: boolean
): string {
	const color = getLatexColor();
	const strokeWidth = getStrokeWidth();

	const cacheKey =
		`${display}:${color}:${strokeWidth}:${source}`;

	const cached = renderCache.get(cacheKey);

	if (cached !== undefined) {
		return cached;
	}

	const node = mj.convert(source, { display });
	const html = adaptor.outerHTML(node);

	const start = html.indexOf('<svg');
	const end = html.lastIndexOf('</svg>') + 6;

	const svg = html
		.slice(start, end)
		.replaceAll('currentColor', color)
		.replaceAll(
			'<path ',
			`<path stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" `
		);

	if (renderCache.size >= maxCacheSize) {
		const oldest = renderCache.keys().next().value;

		if (oldest !== undefined) {
			renderCache.delete(oldest);
		}
	}

	renderCache.set(cacheKey, svg);

	return svg;
}

function svgUri(svg: string): string {
	return (
		'data:image/svg+xml,' +
		encodeURIComponent(svg)
			.replace(/\(/g, '%28')
			.replace(/\)/g, '%29')
	);
}

function isEscaped(
	text: string,
	index: number
): boolean {
	let count = 0;

	for (
		let i = index - 1;
		i >= 0 && text[i] === '\\';
		i--
	) {
		count++;
	}

	return count % 2 === 1;
}

function splitDisplayBlocks(text: string): Block[] {
	const blocks: Block[] = [];

	let start = 0;
	let i = 0;

	while (i < text.length) {
		if (
			text.startsWith('$$', i) &&
			!isEscaped(text, i)
		) {
			let end = i + 2;

			while (end < text.length) {
				if (
					text.startsWith('$$', end) &&
					!isEscaped(text, end)
				) {
					break;
				}

				end++;
			}

			if (end < text.length) {
				if (i > start) {
					blocks.push({
						type: 'text',
						value: text.slice(start, i)
					});
				}

				blocks.push({
					type: 'display',
					value: text
						.slice(i + 2, end)
						.trim()
				});

				i = end + 2;
				start = i;

				continue;
			}
		}

		i++;
	}

	if (start < text.length) {
		blocks.push({
			type: 'text',
			value: text.slice(start)
		});
	}

	return blocks;
}

function tokenizeInlineMath(
	text: string
): InlineToken[] {
	const tokens: InlineToken[] = [];

	let plain = '';
	let i = 0;

	const flush = () => {
		if (!plain) {
			return;
		}

		tokens.push({
			type: 'text',
			value: plain
		});

		plain = '';
	};

	while (i < text.length) {
		if (
			text[i] === '$' &&
			!isEscaped(text, i) &&
			!text.startsWith('$$', i)
		) {
			let end = i + 1;

			while (
				end < text.length &&
				text[end] !== '\n'
			) {
				if (
					text[end] === '$' &&
					!isEscaped(text, end)
				) {
					break;
				}

				end++;
			}

			if (
				end < text.length &&
				text[end] === '$'
			) {
				flush();

				tokens.push({
					type: 'math',
					value: text
						.slice(i + 1, end)
						.trim()
				});

				i = end + 1;

				continue;
			}
		}

		plain += text[i];
		i++;
	}

	flush();

	return tokens;
}

function hasInlineMath(text: string): boolean {
	return tokenizeInlineMath(text).some(
		token => token.type === 'math'
	);
}

function escapeTexText(text: string): string {
	return text
		.replaceAll('\\', '\\textbackslash{}')
		.replaceAll('{', '\\{')
		.replaceAll('}', '\\}')
		.replaceAll('%', '\\%')
		.replaceAll('#', '\\#')
		.replaceAll('&', '\\&')
		.replaceAll('_', '\\_')
		.replaceAll('^', '\\^{}')
		.replaceAll('~', '\\~{}')
		.replaceAll('$', '\\$')
		.replace(/\s+/g, ' ');
}

function inlineBlockToTex(
	text: string
): string {
	const tokens = tokenizeInlineMath(
		text.replace(/\n/g, ' ')
	);

	return tokens
		.map(token => {
			if (token.type === 'math') {
				return token.value;
			}

			return `\\text{${escapeTexText(token.value)}}`;
		})
		.join(' ');
}

function renderDocstring(
	text: string
): vscode.MarkdownString | undefined {
	const cleaned = cleanDocstring(text);
	const blocks = splitDisplayBlocks(cleaned);

	const md = new vscode.MarkdownString();

	let hasMath = false;

	for (const block of blocks) {
		if (block.type === 'display') {
			hasMath = true;

			const svg = renderLatex(
				block.value,
				true
			);

			const uri = svgUri(svg);

			md.appendMarkdown(
				`\n\n![latex](${uri})\n\n`
			);

			continue;
		}

		const paragraphs = block.value
			.split(/\n\s*\n/)
			.map(value => value.trim())
			.filter(Boolean);

		for (const paragraph of paragraphs) {
			if (hasInlineMath(paragraph)) {
				hasMath = true;

				const texParagraph =
					inlineBlockToTex(paragraph);

				const svg = renderLatex(
					texParagraph,
					false
				);

				const uri = svgUri(svg);

				md.appendMarkdown(
					`![latex](${uri})\n\n`
				);
			} else {
				md.appendMarkdown(
					`${paragraph}\n\n`
				);
			}
		}
	}

	return hasMath ? md : undefined;
}

function extractDocstring(
	document: vscode.TextDocument,
	position: vscode.Position
): string | undefined {
	let line = position.line;

	while (line >= 0) {
		if (
			/^\s*(?:async\s+)?def\s+/.test(
				document.lineAt(line).text
			)
		) {
			break;
		}

		line--;
	}

	if (line < 0) {
		return undefined;
	}

	const offset = document.offsetAt(
		new vscode.Position(line, 0)
	);

	const source = document.getText().slice(offset);

	let depth = 0;
	let quote: string | undefined;
	let escaped = false;
	let colon = -1;

	for (let i = 0; i < source.length; i++) {
		const char = source[i];

		if (quote) {
			if (escaped) {
				escaped = false;
			} else if (char === '\\') {
				escaped = true;
			} else if (char === quote) {
				quote = undefined;
			}

			continue;
		}

		if (char === '"' || char === "'") {
			quote = char;
			continue;
		}

		if (
			char === '(' ||
			char === '[' ||
			char === '{'
		) {
			depth++;
			continue;
		}

		if (
			char === ')' ||
			char === ']' ||
			char === '}'
		) {
			depth--;
			continue;
		}

		if (char === ':' && depth === 0) {
			colon = i;
			break;
		}
	}

	if (colon < 0) {
		return undefined;
	}

	const body = source.slice(colon + 1);

	const match = body.match(
		/^\s*r"""([\s\S]*?)"""/
	);

	return match?.[1];
}

function getSymbolPosition(
	document: vscode.TextDocument,
	position: vscode.Position
): vscode.Position {
	const line = document.lineAt(position.line).text;
	const char = line[position.character];

	if (char === '(') {
		let i = position.character - 1;

		while (i >= 0 && /\s/.test(line[i])) {
			i--;
		}

		while (i >= 0 && /[A-Za-z0-9_]/.test(line[i])) {
			i--;
		}

		return new vscode.Position(
			position.line,
			Math.max(i + 1, 0)
		);
	}

	if (char === ')') {
		let depth = 1;
		let i = position.character - 1;

		while (i >= 0) {
			if (line[i] === ')') {
				depth++;
			} else if (line[i] === '(') {
				depth--;

				if (depth === 0) {
					return getSymbolPosition(
						document,
						new vscode.Position(position.line, i)
					);
				}
			}

			i--;
		}
	}

	return position;
}

async function getDocstring(
	document: vscode.TextDocument,
	position: vscode.Position
): Promise<string | undefined> {
	const symbolPosition =
		getSymbolPosition(document, position);

	const definitions =
		await vscode.commands.executeCommand<
			(vscode.Location | vscode.LocationLink)[]
		>(
			'vscode.executeDefinitionProvider',
			document.uri,
			symbolPosition
		);

	if (definitions?.length) {
		const definition = definitions[0];

		const uri =
			definition instanceof vscode.Location
				? definition.uri
				: definition.targetUri;

		const pos =
			definition instanceof vscode.Location
				? definition.range.start
				: (
					definition.targetSelectionRange ??
					definition.targetRange
				).start;

		const target =
			await vscode.workspace.openTextDocument(
				uri
			);

		return extractDocstring(
			target,
			pos
		);
	}

	if (
		/^\s*(?:async\s+)?def\s+/.test(
			document.lineAt(position.line).text
		)
	) {
		return extractDocstring(
			document,
			position
		);
	}

	return undefined;
}

export function activate(
	context: vscode.ExtensionContext
) {
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(
			'python',
			{
				async provideHover(
					document,
					position
				) {
					if (!isEnabled()) {
						return;
					}

					const docstring =
						await getDocstring(
							document,
							position
						);

					if (!docstring) {
						return;
					}

					const rendered =
						renderDocstring(
							unwrapDsLatexComment(docstring)
						);

					if (!rendered) {
						return;
					}

					return new vscode.Hover(
						rendered
					);
				}
			}
		)
	);

	context.subscriptions.push(
		vscode.window.onDidChangeActiveColorTheme(
			() => {
				renderCache.clear();
			}
		)
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(
			event => {
				if (
					event.affectsConfiguration(
						'dslatex.enabled'
					) ||
					event.affectsConfiguration(
						'dslatex.strokeWidth'
					)
				) {
					renderCache.clear();
				}
			}
		)
	);
}

export function deactivate() {}