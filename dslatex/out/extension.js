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
function renderLatex(source) {
    const node = mj.convert(source, { display: true });
    const html = adaptor.outerHTML(node);
    const start = html.indexOf('<svg');
    const end = html.lastIndexOf('</svg>') + 6;
    return html
        .slice(start, end)
        .replaceAll('currentColor', '#dddddd')
        .replaceAll('<path ', '<path stroke="#dddddd" stroke-width="18" stroke-linejoin="round" ');
}
function svgUri(svg) {
    return ('data:image/svg+xml,' +
        encodeURIComponent(svg)
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29'));
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
    const match = source.match(/^\s*(?:async\s+)?def\b[\s\S]*?:\s*(?:\r?\n\s*)?(?:[rRuUbBfF]{0,2})?("""|''')([\s\S]*?)\1/);
    return match?.[2];
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
        const result = extractDocstring(target, pos);
        if (result) {
            return result;
        }
    }
    return extractDocstring(document, position);
}
function renderDisplayMath(text) {
    const regex = /\$\$([\s\S]+?)\$\$/g;
    const md = new vscode.MarkdownString();
    let match;
    let found = false;
    while ((match = regex.exec(text)) !== null) {
        found = true;
        const svg = renderLatex(match[1].trim());
        const uri = svgUri(svg);
        md.appendMarkdown(`![latex](${uri})\n\n`);
    }
    return found ? md : undefined;
}
function activate(context) {
    context.subscriptions.push(vscode.languages.registerHoverProvider('python', {
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
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map