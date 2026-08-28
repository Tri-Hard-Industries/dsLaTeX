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

function renderLatex(source: string): string {
	const node = mj.convert(source, { display: true });
	const html = adaptor.outerHTML(node);

	const start = html.indexOf('<svg');
	const end = html.lastIndexOf('</svg>') + 6;

	return html
		.slice(start, end)
		.replaceAll('currentColor', '#dddddd')
		.replaceAll(
			'<path ',
			'<path stroke="#dddddd" stroke-width="18" stroke-linejoin="round" '
		);
}

function svgUri(svg: string): string {
	return (
		'data:image/svg+xml,' +
		encodeURIComponent(svg)
			.replace(/\(/g, '%28')
			.replace(/\)/g, '%29')
	);
}

function extractDocstring(
	document: vscode.TextDocument,
	position: vscode.Position
): string | undefined {
	let line = position.line;

	while (line >= 0) {
		if (/^\s*(?:async\s+)?def\s+/.test(document.lineAt(line).text)) {
			break;
		}

		line--;
	}

	if (line < 0) {
		return undefined;
	}

	const offset = document.offsetAt(new vscode.Position(line, 0));
	const source = document.getText().slice(offset);

	const match = source.match(
		/^\s*(?:async\s+)?def\b[\s\S]*?:\s*(?:\r?\n\s*)?(?:[rRuUbBfF]{0,2})?("""|''')([\s\S]*?)\1/
	);

	return match?.[2];
}

async function getDocstring(
	document: vscode.TextDocument,
	position: vscode.Position
): Promise<string | undefined> {
	const definitions = await vscode.commands.executeCommand<
		(vscode.Location | vscode.LocationLink)[]
	>(
		'vscode.executeDefinitionProvider',
		document.uri,
		position
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

		const target = await vscode.workspace.openTextDocument(uri);

		const result = extractDocstring(target, pos);

		if (result) {
			return result;
		}
	}

	return extractDocstring(document, position);
}

function renderDisplayMath(text: string): vscode.MarkdownString | undefined {
	const regex = /\$\$([\s\S]+?)\$\$/g;
	const md = new vscode.MarkdownString();

	let match: RegExpExecArray | null;
	let found = false;

	while ((match = regex.exec(text)) !== null) {
		found = true;

		const svg = renderLatex(match[1].trim());
		const uri = svgUri(svg);

		md.appendMarkdown(`![latex](${uri})\n\n`);
	}

	return found ? md : undefined;
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerHoverProvider('python', {
			async provideHover(document, position) {
				const docstring = await getDocstring(document, position);

				if (!docstring) {
					return;
				}

				const rendered = renderDisplayMath(docstring);

				if (!rendered) {
					return;
				}

				return new vscode.Hover(rendered);
			}
		})
	);
}

export function deactivate() {}