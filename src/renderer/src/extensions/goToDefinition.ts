/**
 * CodeMirror Extension: Go to Definition (Ctrl+Click)
 * 
 * Suporta dois modos de navegação:
 * 1. Ctrl+Click em caminhos de importação: import X from './path' → abre './path'
 * 2. Ctrl+Click em nomes de componentes/funções: <Home />, Home(), FileTree → 
 *    resolve de volta ao import de onde veio e abre o arquivo de origem.
 */
import { EditorView, ViewPlugin, Decoration, DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// ─── Tipos ──────────────────────────────────────────────────────────────────────

interface GoToDefinitionConfig {
  currentFilePath: string;
  onNavigate: (resolvedPath: string) => void;
}

interface ClickableRange {
  from: number;
  to: number;
  importPath: string; // Caminho de importação a ser resolvido
}

// ─── Import Map: mapeia nomes importados → caminhos ─────────────────────────────

interface ImportMap {
  [identifier: string]: string; // ex: { 'Home': './pages/Home', 'FileTree': './components/FileTree' }
}

/**
 * Parseia todas as declarações de import do documento e retorna
 * um mapa de identificadores → caminhos de importação.
 */
function buildImportMap(docText: string): ImportMap {
  const map: ImportMap = {};

  // Padrão 1: import DefaultExport from 'path'
  const defaultImportRe = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = defaultImportRe.exec(docText)) !== null) {
    map[m[1]] = m[2];
  }

  // Padrão 2: import { Named, Named2 as Alias } from 'path'
  const namedImportRe = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  while ((m = namedImportRe.exec(docText)) !== null) {
    const names = m[1];
    const path = m[2];
    // Divide por vírgulas e processa cada nome
    names.split(',').forEach((name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      // Suporta "Name as Alias"
      const aliasMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
      if (aliasMatch) {
        map[aliasMatch[2]] = path; // O alias é o que será usado no código
      } else if (/^\w+$/.test(trimmed)) {
        map[trimmed] = path;
      }
    });
  }

  // Padrão 3: import DefaultExport, { Named } from 'path'
  const mixedImportRe = /import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  while ((m = mixedImportRe.exec(docText)) !== null) {
    map[m[1]] = m[3]; // default
    const names = m[2];
    const path = m[3];
    names.split(',').forEach((name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const aliasMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
      if (aliasMatch) {
        map[aliasMatch[2]] = path;
      } else if (/^\w+$/.test(trimmed)) {
        map[trimmed] = path;
      }
    });
  }

  // Padrão 4: import * as Namespace from 'path'
  const namespaceImportRe = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((m = namespaceImportRe.exec(docText)) !== null) {
    map[m[1]] = m[2];
  }

  // Padrão 5: const X = require('path')
  const requireRe = /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = requireRe.exec(docText)) !== null) {
    const path = m[3];
    if (m[2]) {
      map[m[2]] = path; // const X = require(...)
    }
    if (m[1]) {
      m[1].split(',').forEach((name) => {
        const trimmed = name.trim();
        if (/^\w+$/.test(trimmed)) {
          map[trimmed] = path;
        }
      });
    }
  }

  return map;
}

// ─── Extração de caminhos de importação (string literal) ────────────────────────

function extractImportPaths(lineText: string, lineFrom: number): ClickableRange[] {
  const results: ClickableRange[] = [];

  const patterns = [
    /(?:from\s+)(['"])([^'"]+)\1/g,
    /import\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
    /require\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(lineText)) !== null) {
      const path = match[2];
      if (!path) continue;

      const quoteChar = match[1];
      const pathInLine = lineText.indexOf(quoteChar + path + quoteChar, match.index);
      if (pathInLine === -1) continue;

      const from = lineFrom + pathInLine + 1;
      const to = from + path.length;
      results.push({ from, to, importPath: path });
    }
  }

  return results;
}

// ─── Extração de referências a identificadores importados ───────────────────────

/**
 * Encontra todas as ocorrências de identificadores importados no viewport.
 * Filtra para não marcar os imports em si (evita duplicação).
 */
function extractIdentifierReferences(
  view: EditorView,
  importMap: ImportMap,
  importPathRanges: ClickableRange[]
): ClickableRange[] {
  const results: ClickableRange[] = [];
  const doc = view.state.doc;
  const identifiers = Object.keys(importMap);

  if (identifiers.length === 0) return results;

  // Cria um regex que detecta qualquer identificador importado como palavra inteira
  // Escapa caracteres especiais (embora nomes de vars não devam ter, por segurança)
  const escapedNames = identifiers.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const identRe = new RegExp(`\\b(${escapedNames.join('|')})\\b`, 'g');

  // Escaneia a viewport
  const { from: vpFrom, to: vpTo } = view.viewport;
  const startLine = doc.lineAt(vpFrom).number;
  const endLine = doc.lineAt(vpTo).number;

  for (let i = startLine; i <= endLine; i++) {
    const line = doc.line(i);
    const lineText = line.text;

    // Pula linhas que são declarações de import (já cobertas pelos importPaths)
    if (/^\s*import\s/.test(lineText)) continue;
    if (/\brequire\s*\(/.test(lineText) && /(?:const|let|var)\s/.test(lineText)) continue;

    identRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = identRe.exec(lineText)) !== null) {
      const name = m[1];
      const from = line.from + m.index;
      const to = from + name.length;

      // Verifica se não faz overlap com importPathRanges já existentes
      const overlaps = importPathRanges.some(r => from < r.to && to > r.from);
      if (overlaps) continue;

      // Verifica contexto: garante que é um uso real (não dentro de uma string/comentário simples)
      // Heurística: checamos se o char antes é aspas (significa que está dentro de string)
      const charBefore = m.index > 0 ? lineText[m.index - 1] : '';
      const charAfter = m.index + name.length < lineText.length ? lineText[m.index + name.length] : '';
      if (charBefore === '"' || charBefore === "'" || charBefore === '`') continue;
      if (charAfter === '"' || charAfter === "'" || charAfter === '`') continue;

      results.push({
        from,
        to,
        importPath: importMap[name],
      });
    }
  }

  return results;
}

// ─── Estilos ────────────────────────────────────────────────────────────────────

const linkDecoration = Decoration.mark({ class: 'cm-import-link' });
const linkHoverDecoration = Decoration.mark({ class: 'cm-import-link-hover' });

// ─── Extensão Principal ─────────────────────────────────────────────────────────

export function goToDefinition(config: GoToDefinitionConfig) {
  let ctrlHeld = false;
  let hoverRange: { from: number; to: number } | null = null;

  // Caches
  let cachedRanges: ClickableRange[] = [];
  let cachedImportMap: ImportMap = {};

  function computeRanges(view: EditorView) {
    const allRanges: ClickableRange[] = [];
    const doc = view.state.doc;
    const docText = doc.toString();

    // 1. Reconstrói o mapa de identificadores importados
    cachedImportMap = buildImportMap(docText);

    // 2. Extrai caminhos de importação (strings literais dentro de from/require/import())
    const importPathRanges: ClickableRange[] = [];
    const maxLine = Math.min(doc.lines, 200);

    for (let i = 1; i <= maxLine; i++) {
      const line = doc.line(i);
      const found = extractImportPaths(line.text, line.from);
      importPathRanges.push(...found);
    }

    // Viewport para dynamic imports
    const { from: vpFrom, to: vpTo } = view.viewport;
    const startLine = doc.lineAt(vpFrom).number;
    const endLine = doc.lineAt(vpTo).number;

    for (let i = Math.max(startLine, maxLine + 1); i <= endLine; i++) {
      const line = doc.line(i);
      const found = extractImportPaths(line.text, line.from);
      importPathRanges.push(...found);
    }

    allRanges.push(...importPathRanges);

    // 3. Extrai referências a nomes importados (componentes, funções, etc.)
    const identifierRanges = extractIdentifierReferences(view, cachedImportMap, importPathRanges);
    allRanges.push(...identifierRanges);

    // Ordena por posição (necessário para o RangeSetBuilder)
    allRanges.sort((a, b) => a.from - b.from);

    // Remove duplicatas/overlaps
    const deduped: ClickableRange[] = [];
    for (const range of allRanges) {
      const last = deduped[deduped.length - 1];
      if (last && range.from < last.to) continue; // skip overlap
      deduped.push(range);
    }

    cachedRanges = deduped;
    return deduped;
  }

  function buildDecorations(view: EditorView): DecorationSet {
    if (!ctrlHeld) return Decoration.none;

    const ranges = computeRanges(view);
    const builder = new RangeSetBuilder<Decoration>();

    for (const range of ranges) {
      const isHovered = hoverRange && range.from === hoverRange.from && range.to === hoverRange.to;
      builder.add(range.from, range.to, isHovered ? linkHoverDecoration : linkDecoration);
    }

    return builder.finish();
  }

  function getClickableAtPos(pos: number): ClickableRange | null {
    for (const range of cachedRanges) {
      if (pos >= range.from && pos <= range.to) {
        return range;
      }
    }
    return null;
  }

  const viewPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }

      forceUpdate(view: EditorView) {
        this.decorations = buildDecorations(view);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );

  const domHandlers = EditorView.domEventHandlers({
    keydown(event, view) {
      if ((event.key === 'Control' || event.key === 'Meta') && !ctrlHeld) {
        ctrlHeld = true;
        const inst = view.plugin(viewPlugin);
        if (inst) inst.forceUpdate(view);
      }
      return false;
    },

    keyup(event, view) {
      if (event.key === 'Control' || event.key === 'Meta') {
        ctrlHeld = false;
        hoverRange = null;
        view.dom.style.cursor = '';
        const inst = view.plugin(viewPlugin);
        if (inst) inst.forceUpdate(view);
      }
      return false;
    },

    mousemove(event, view) {
      if (!ctrlHeld) return false;

      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos === null) {
        if (hoverRange) {
          hoverRange = null;
          view.dom.style.cursor = '';
          const inst = view.plugin(viewPlugin);
          if (inst) inst.forceUpdate(view);
        }
        return false;
      }

      const clickable = getClickableAtPos(pos);
      if (clickable) {
        if (!hoverRange || hoverRange.from !== clickable.from) {
          hoverRange = { from: clickable.from, to: clickable.to };
          view.dom.style.cursor = 'pointer';
          const inst = view.plugin(viewPlugin);
          if (inst) inst.forceUpdate(view);
        }
      } else {
        if (hoverRange) {
          hoverRange = null;
          view.dom.style.cursor = '';
          const inst = view.plugin(viewPlugin);
          if (inst) inst.forceUpdate(view);
        }
      }

      return false;
    },

    mousedown(event, view) {
      if (!(event.ctrlKey || event.metaKey)) return false;

      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos === null) return false;

      const clickable = getClickableAtPos(pos);
      if (!clickable) return false;

      event.preventDefault();
      event.stopPropagation();

      // Resolve o caminho via IPC e navega
      if ((window as any).api?.fs?.resolveImport) {
        (window as any).api.fs.resolveImport(clickable.importPath, config.currentFilePath).then(
          (result: { success: boolean; resolvedPath?: string; error?: string }) => {
            if (result.success && result.resolvedPath) {
              config.onNavigate(result.resolvedPath);
            } else {
              console.warn(`[GoToDefinition] ${result.error}: ${clickable.importPath}`);
            }
          }
        );
      }

      return true;
    },

    blur(_event, view) {
      if (ctrlHeld) {
        ctrlHeld = false;
        hoverRange = null;
        view.dom.style.cursor = '';
        const inst = view.plugin(viewPlugin);
        if (inst) inst.forceUpdate(view);
      }
      return false;
    },
  });

  return [viewPlugin, domHandlers];
}
