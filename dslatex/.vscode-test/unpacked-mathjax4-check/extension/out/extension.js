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
require("@mathjax/src/js/util/asyncLoad/node.js");
const mathjax_js_1 = require("@mathjax/src/js/mathjax.js");
const tex_js_1 = require("@mathjax/src/js/input/tex.js");
const svg_js_1 = require("@mathjax/src/js/output/svg.js");
const liteAdaptor_js_1 = require("@mathjax/src/js/adaptors/liteAdaptor.js");
const html_js_1 = require("@mathjax/src/js/handlers/html.js");
const svg_js_2 = require("@mathjax/mathjax-bbm-font-extension/js/svg.js");
const svg_js_3 = require("@mathjax/mathjax-bboldx-font-extension/js/svg.js");
const svg_js_4 = require("@mathjax/mathjax-dsfont-font-extension/js/svg.js");
const svg_js_5 = require("@mathjax/mathjax-mhchem-font-extension/js/svg.js");
require("@mathjax/src/js/input/tex/action/ActionConfiguration.js");
require("@mathjax/src/js/input/tex/ams/AmsConfiguration.js");
require("@mathjax/src/js/input/tex/amscd/AmsCdConfiguration.js");
require("@mathjax/src/js/input/tex/bbm/BbmConfiguration.js");
require("@mathjax/src/js/input/tex/bboldx/BboldxConfiguration.js");
require("@mathjax/src/js/input/tex/bbox/BboxConfiguration.js");
require("@mathjax/src/js/input/tex/begingroup/BegingroupConfiguration.js");
require("@mathjax/src/js/input/tex/boldsymbol/BoldsymbolConfiguration.js");
require("@mathjax/src/js/input/tex/braket/BraketConfiguration.js");
require("@mathjax/src/js/input/tex/bussproofs/BussproofsConfiguration.js");
require("@mathjax/src/js/input/tex/cancel/CancelConfiguration.js");
require("@mathjax/src/js/input/tex/cases/CasesConfiguration.js");
require("@mathjax/src/js/input/tex/centernot/CenternotConfiguration.js");
require("@mathjax/src/js/input/tex/color/ColorConfiguration.js");
require("@mathjax/src/js/input/tex/colortbl/ColortblConfiguration.js");
require("@mathjax/src/js/input/tex/colorv2/ColorV2Configuration.js");
require("@mathjax/src/js/input/tex/configmacros/ConfigMacrosConfiguration.js");
require("@mathjax/src/js/input/tex/dsfont/DsfontConfiguration.js");
require("@mathjax/src/js/input/tex/empheq/EmpheqConfiguration.js");
require("@mathjax/src/js/input/tex/enclose/EncloseConfiguration.js");
require("@mathjax/src/js/input/tex/extpfeil/ExtpfeilConfiguration.js");
require("@mathjax/src/js/input/tex/fontsizev3/FontSizeV3Configuration.js");
require("@mathjax/src/js/input/tex/gensymb/GensymbConfiguration.js");
require("@mathjax/src/js/input/tex/mathtools/MathtoolsConfiguration.js");
require("@mathjax/src/js/input/tex/mhchem/MhchemConfiguration.js");
require("@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js");
require("@mathjax/src/js/input/tex/physics/PhysicsConfiguration.js");
require("@mathjax/src/js/input/tex/tagformat/TagFormatConfiguration.js");
require("@mathjax/src/js/input/tex/textcomp/TextcompConfiguration.js");
require("@mathjax/src/js/input/tex/textmacros/TextMacrosConfiguration.js");
require("@mathjax/src/js/input/tex/unicode/UnicodeConfiguration.js");
require("@mathjax/src/js/input/tex/units/UnitsConfiguration.js");
require("@mathjax/src/js/input/tex/upgreek/UpgreekConfiguration.js");
require("@mathjax/src/js/input/tex/verb/VerbConfiguration.js");
const adaptor = (0, liteAdaptor_js_1.liteAdaptor)();
(0, html_js_1.RegisterHTMLHandler)(adaptor);
const texPackages = [
    'base',
    'action',
    'ams',
    'amscd',
    'bbm',
    'bboldx',
    'bbox',
    'begingroup',
    'boldsymbol',
    'braket',
    'bussproofs',
    'cancel',
    'cases',
    'centernot',
    'color',
    'colortbl',
    'colorv2',
    'configmacros',
    'dsfont',
    'empheq',
    'enclose',
    'extpfeil',
    'fontsizev3',
    'gensymb',
    'mathtools',
    'mhchem',
    'newcommand',
    'physics',
    'tagformat',
    'textcomp',
    'textmacros',
    'unicode',
    'units',
    'upgreek',
    'verb'
];
const renderCache = new Map();
const maxCacheSize = 256;
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
function unwrapDsLatexComment(text) {
    const match = text.match(/^\s*<!--dslatex\s*([\s\S]*?)\s*-->\s*$/);
    return match ? match[1] : text;
}
function getStrokeWidth() {
    return vscode.workspace
        .getConfiguration('dslatex')
        .get('strokeWidth', 18);
}
function isEnabled() {
    return vscode.workspace
        .getConfiguration('dslatex')
        .get('enabled', true);
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
    const strokeWidth = getStrokeWidth();
    const cacheKey = `${display}:${color}:${strokeWidth}:${source}`;
    const cached = renderCache.get(cacheKey);
    if (cached !== undefined) {
        return cached;
    }
    if (renderCache.size >= maxCacheSize) {
        const oldest = renderCache.keys().next().value;
        if (oldest !== undefined) {
            renderCache.delete(oldest);
        }
    }
    const rendered = renderLatexUncached(source, display, color, strokeWidth);
    renderCache.set(cacheKey, rendered);
    return rendered;
}
async function renderLatexUncached(source, display, color, strokeWidth) {
    try {
        const tex = new tex_js_1.TeX({ packages: texPackages });
        const output = new svg_js_1.SVG({
            fontCache: 'local',
            linebreaks: { inline: false }
        });
        output.addExtension(svg_js_2.MathJaxBbmFontExtension);
        output.addExtension(svg_js_3.MathJaxBboldxFontExtension);
        output.addExtension(svg_js_4.MathJaxDsfontFontExtension);
        output.addExtension(svg_js_5.MathJaxMhchemFontExtension);
        const mj = mathjax_js_1.mathjax.document('', {
            InputJax: tex,
            OutputJax: output
        });
        const node = await mj.convertPromise(source, {
            display
        });
        const html = adaptor.outerHTML(node);
        if (html.includes('data-mjx-error=')) {
            return undefined;
        }
        const start = html.indexOf('<svg');
        const end = html.lastIndexOf('</svg>') + 6;
        if (start < 0 || end < 6) {
            return undefined;
        }
        const svg = html
            .slice(start, end)
            .replaceAll('currentColor', color)
            .replaceAll('<path ', `<path stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" `);
        return svg;
    }
    catch {
        return undefined;
    }
}
function svgUri(svg) {
    return ('data:image/svg+xml,' +
        encodeURIComponent(svg)
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29'));
}
function markdownImage(svg) {
    const md = new vscode.MarkdownString();
    appendMarkdownImage(md, svg);
    return md;
}
function appendMarkdownImage(md, svg) {
    md.appendMarkdown(`![latex](${svgUri(svg)})`);
}
function markdownText(text) {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(text);
    return md;
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
async function renderDocstring(text, token) {
    const cleaned = cleanDocstring(text);
    const blocks = splitDisplayBlocks(cleaned);
    const contents = [];
    let hasMath = false;
    for (const block of blocks) {
        if (token?.isCancellationRequested) {
            return undefined;
        }
        if (block.type === 'display') {
            hasMath = true;
            const svg = await renderLatex(block.value, true);
            if (svg) {
                contents.push(markdownImage(svg));
            }
            else {
                const md = new vscode.MarkdownString();
                md.appendCodeblock(block.value, 'latex');
                contents.push(md);
            }
            continue;
        }
        const paragraphs = block.value
            .split(/\n\s*\n/)
            .map(value => value.trim())
            .filter(Boolean);
        for (const paragraph of paragraphs) {
            if (token?.isCancellationRequested) {
                return undefined;
            }
            const tokens = tokenizeInlineMath(paragraph);
            const containsMath = tokens.some(token => token.type === 'math');
            if (!containsMath) {
                contents.push(markdownText(paragraph));
                continue;
            }
            hasMath = true;
            const md = new vscode.MarkdownString();
            for (const token of tokens) {
                if (token.type === 'text') {
                    md.appendMarkdown(token.value);
                    continue;
                }
                const svg = await renderLatex(token.value, false);
                if (svg) {
                    appendMarkdownImage(md, svg);
                }
                else {
                    md.appendText(`$${token.value}$`);
                }
            }
            contents.push(md);
        }
    }
    return hasMath ? contents : undefined;
}
function extractDocstring(document, position) {
    const line = position.line;
    if (!isSupportedDefinitionLine(document.lineAt(line).text)) {
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
function isSupportedDefinitionLine(text) {
    return /^\s*(?:(?:async\s+)?def|class)\s+/.test(text);
}
function getSymbolPosition(document, position) {
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
        return new vscode.Position(position.line, Math.max(i + 1, 0));
    }
    if (char === ')') {
        let depth = 1;
        let i = position.character - 1;
        while (i >= 0) {
            if (line[i] === ')') {
                depth++;
            }
            else if (line[i] === '(') {
                depth--;
                if (depth === 0) {
                    return getSymbolPosition(document, new vscode.Position(position.line, i));
                }
            }
            i--;
        }
    }
    return position;
}
async function getDocstring(document, position) {
    const symbolPosition = getSymbolPosition(document, position);
    const definitions = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, symbolPosition);
    if (definitions?.length) {
        for (const definition of definitions) {
            const uri = definition instanceof vscode.Location
                ? definition.uri
                : definition.targetUri;
            const pos = definition instanceof vscode.Location
                ? definition.range.start
                : (definition.targetSelectionRange ??
                    definition.targetRange).start;
            const target = await vscode.workspace.openTextDocument(uri);
            const docstring = extractDocstring(target, pos);
            if (docstring !== undefined) {
                return docstring;
            }
        }
    }
    if (isSupportedDefinitionLine(document.lineAt(position.line).text)) {
        return extractDocstring(document, position);
    }
    return undefined;
}
function activate(context) {
    context.subscriptions.push(vscode.languages.registerHoverProvider('python', {
        async provideHover(document, position, token) {
            if (!isEnabled()) {
                return;
            }
            const docstring = await getDocstring(document, position);
            if (!docstring) {
                return;
            }
            const rendered = await renderDocstring(unwrapDsLatexComment(docstring), token);
            if (!rendered) {
                return;
            }
            return new vscode.Hover(rendered);
        }
    }));
    context.subscriptions.push(vscode.window.onDidChangeActiveColorTheme(() => {
        renderCache.clear();
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('dslatex.enabled') ||
            event.affectsConfiguration('dslatex.strokeWidth')) {
            renderCache.clear();
        }
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map