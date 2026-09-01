"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const mathjax_js_1 = require("mathjax-full/js/mathjax.js");
const tex_js_1 = require("mathjax-full/js/input/tex.js");
const svg_js_1 = require("mathjax-full/js/output/svg.js");
const liteAdaptor_js_1 = require("mathjax-full/js/adaptors/liteAdaptor.js");
const html_js_1 = require("mathjax-full/js/handlers/html.js");
const AllPackages_js_1 = require("mathjax-full/js/input/tex/AllPackages.js");
const adaptor = (0, liteAdaptor_js_1.liteAdaptor)();
(0, html_js_1.RegisterHTMLHandler)(adaptor);
const tex = new tex_js_1.TeX({ packages: AllPackages_js_1.AllPackages });
const output = new svg_js_1.SVG({ fontCache: 'none' });
const mj = mathjax_js_1.mathjax.document('', {
    InputJax: tex,
    OutputJax: output
});
const renderCache = new Map();
const maxCacheSize = 256;
const strokeWidth = 18;
function getLatexColor() {
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
function cleanDocstring(text) {
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
        const indent = lines[i].match(/^[ \t]*/)?.[0].length ?? 0;
        margin = Math.min(margin, indent);
    }
    if (margin !== Infinity) {
        for (let i = 1; i < lines.length; i++) {
            lines[i] = lines[i].slice(Math.min(margin, lines[i].length));
        }
    }
    while (lines.length && !lines[0].trim()) {
        lines.shift();
    }
    while (lines.length &&
        !lines[lines.length - 1].trim()) {
        lines.pop();
    }
    return lines.join('\n');
}
function renderLatex(source, display) {
    const color = getLatexColor();
    const cacheKey = `${display}:${color}:${strokeWidth}:${source}`;
    const cached = renderCache.get(cacheKey);
    if (cached) {
        return cached;
    }
    const node = mj.convert(source, { display });
    const html = adaptor.outerHTML(node);
    const start = html.indexOf('<svg');
    const end = html.lastIndexOf('</svg>') + 6;
    const svg = html
        .slice(start, end)
        .replaceAll('currentColor', color)
        .replaceAll('<path ', `<path stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" `);
    if (renderCache.size >= maxCacheSize) {
        const oldest = renderCache.keys().next().value;
        if (oldest !== undefined) {
            renderCache.delete(oldest);
        }
    }
    renderCache.set(cacheKey, svg);
    return svg;
}
function svgUri(svg) {
    return ('data:image/svg+xml,' +
        encodeURIComponent(svg)
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29'));
}
function isEscaped(text, index) {
    let count = 0;
    for (let i = index - 1; i >= 0 && text[i] === '\\'; i--) {
        count++;
    }
    return count % 2 === 1;
}
function splitDisplayBlocks(text) {
    const blocks = [];
    let start = 0;
    let i = 0;
    while (i < text.length) {
        if (text.startsWith('$$', i) &&
            !isEscaped(text, i)) {
            let end = i + 2;
            while (end < text.length) {
                if (text.startsWith('$$', end) &&
                    !isEscaped(text, end)) {
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
function tokenizeInlineMath(text) {
    const tokens = [];
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
        if (text[i] === '$' &&
            !isEscaped(text, i) &&
            !text.startsWith('$$', i)) {
            let end = i + 1;
            while (end < text.length &&
                text[end] !== '\n') {
                if (text[end] === '$' &&
                    !isEscaped(text, end)) {
                    break;
                }
                end++;
            }
            if (end < text.length &&
                text[end] === '$') {
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
function hasInlineMath(text) {
    return tokenizeInlineMath(text).some(token => token.type === 'math');
}
function escapeTexText(text) {
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
function inlineBlockToTex(text) {
    const tokens = tokenizeInlineMath(text.replace(/\n/g, ' '));
    return tokens
        .map(token => {
        if (token.type === 'math') {
            return token.value;
        }
        return `\\text{${escapeTexText(token.value)}}`;
    })
        .join(' ');
}
function renderDocstring(text) {
    const cleaned = cleanDocstring(text);
    const blocks = splitDisplayBlocks(cleaned);
    const md = new vscode.MarkdownString();
    let hasMath = false;
    for (const block of blocks) {
        if (block.type === 'display') {
            hasMath = true;
            const svg = renderLatex(block.value, true);
            const uri = svgUri(svg);
            md.appendMarkdown(`\n\n![latex](${uri})\n\n`);
            continue;
        }
        const paragraphs = block.value
            .split(/\n\s*\n/)
            .map(value => value.trim())
            .filter(Boolean);
        for (const paragraph of paragraphs) {
            if (hasInlineMath(paragraph)) {
                hasMath = true;
                const texParagraph = inlineBlockToTex(paragraph);
                const svg = renderLatex(texParagraph, false);
                const uri = svgUri(svg);
                md.appendMarkdown(`![latex](${uri})\n\n`);
            }
            else {
                md.appendMarkdown(`${paragraph}\n\n`);
            }
        }
    }
    return hasMath ? md : undefined;
}
function extractDocstring(document, position) {
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
    let depth = 0;
    let quote;
    let escaped = false;
    let colon = -1;
    for (let i = 0; i < source.length; i++) {
        const char = source[i];
        if (quote) {
            if (escaped) {
                escaped = false;
            }
            else if (char === '\\') {
                escaped = true;
            }
            else if (char === quote) {
                quote = undefined;
            }
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }
        if (char === '(' ||
            char === '[' ||
            char === '{') {
            depth++;
            continue;
        }
        if (char === ')' ||
            char === ']' ||
            char === '}') {
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
    const match = body.match(/^\s*r"""([\s\S]*?)"""/);
    return match?.[1];
}
async function getDocstring(document, position) {
    const definitions = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, position);
    if (definitions?.length) {
        const definition = definitions[0];
        const uri = definition instanceof vscode.Location
            ? definition.uri
            : definition.targetUri;
        const pos = definition instanceof vscode.Location
            ? definition.range.start
            : (definition.targetSelectionRange ??
                definition.targetRange).start;
        const target = await vscode.workspace.openTextDocument(uri);
        return extractDocstring(target, pos);
    }
    if (/^\s*(?:async\s+)?def\s+/.test(document.lineAt(position.line).text)) {
        return extractDocstring(document, position);
    }
    return undefined;
}
function activate(context) {
    context.subscriptions.push(vscode.languages.registerHoverProvider('python', {
        async provideHover(document, position) {
            const docstring = await getDocstring(document, position);
            if (!docstring) {
                return;
            }
            const rendered = renderDocstring(docstring);
            if (!rendered) {
                return;
            }
            return new vscode.Hover(rendered);
        }
    }));
    context.subscriptions.push(vscode.window.onDidChangeActiveColorTheme(() => {
        renderCache.clear();
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map