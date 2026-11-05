
/**
 * Aplica um patch no formato SEARCH/REPLACE ao conteúdo original.
 * Suporta múltiplos blocos no mesmo arquivo.
 */
export function applySearchReplace(originalContent: string, patch: string): string {
  // Normalizar delimitadores de SEARCH (ex: <<<< SEARCH ou <<<<<<< SEARCH) no início de linhas
  let normalizedPatch = patch;
  normalizedPatch = normalizedPatch.replace(/^<<<+\s*SEARCH/gim, '<<<< SEARCH');
  // Normalizar delimitadores de REPLACE (ex: ==== REPLACE ou =======) no início de linhas
  normalizedPatch = normalizedPatch.replace(/^===+\s*(?:REPLACE)?\s*$/gim, '==== REPLACE');
  // Normalizar delimitadores de END (ex: >>>> END ou >>>>>>> REPLACE ou >>>>>>>) no início de linhas
  normalizedPatch = normalizedPatch.replace(/^>>>+\s*(?:END|REPLACE)?\s*$/gim, '>>>> END');

  const searchBlocks = normalizedPatch.split('<<<< SEARCH');
  if (searchBlocks.length <= 1) {
    // Se não tiver o formato de patch, retorna o patch como conteúdo completo (fallback para write_file)
    return patch;
  }

  let result = originalContent;

  // O primeiro elemento é o que vem antes do primeiro <<<< SEARCH (geralmente vazio ou cabeçalho)
  for (let i = 1; i < searchBlocks.length; i++) {
    const block = searchBlocks[i];
    const parts = block.split('==== REPLACE');
    if (parts.length !== 2) continue;

    const rest = parts[1].split('>>>> END');
    if (rest.length < 1) continue;

    // Tenta encontrar o trecho exato
    // Remove espaços extras no início/fim para facilitar o match, mas preserva a indentação interna
    const exactSearch = parts[0].replace(/^\n/, '').replace(/\n$/, '');
    const exactReplace = rest[0].replace(/^\n/, '').replace(/\n$/, '');

    if (result.includes(exactSearch)) {
      result = result.replace(exactSearch, exactReplace);
    } else {
      // Tentativa 2: Match ignorando whitespace inicial/final de cada linha do search (mais robusto)
      const searchLines = exactSearch.split('\n').map(l => l.trim());
      const contentLines = result.split('\n');
      
      let foundIndex = -1;
      for (let j = 0; j <= contentLines.length - searchLines.length; j++) {
        let match = true;
        for (let k = 0; k < searchLines.length; k++) {
          if (contentLines[j + k].trim() !== searchLines[k]) {
            match = false;
            break;
          }
        }
        if (match) {
          foundIndex = j;
          break;
        }
      }

      if (foundIndex !== -1) {
        // Preserva a indentação da primeira linha encontrada
        const originalIndent = contentLines[foundIndex].match(/^\s*/)?.[0] || '';
        const indentedReplace = exactReplace.split('\n').map((l, index) => {
          if (index === 0) return l; // A primeira linha já pode ter vindo indentada
          if (l.startsWith(originalIndent)) return l;
          return originalIndent + l;
        }).join('\n');
        
        const newLines = [...contentLines];
        newLines.splice(foundIndex, searchLines.length, indentedReplace);
        result = newLines.join('\n');
      } else {
        console.warn('Bloco SEARCH não encontrado no arquivo:', exactSearch);
      }
    }
  }

  return result;
}
