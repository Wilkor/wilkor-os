
// Custo estimado por 1K tokens (média input+output) por modelo
export const MODEL_COSTS: Record<string, number> = {
  'gpt-4o-mini': 0.000375,
  'gpt-4o': 0.00625,
  'claude-3-5-sonnet': 0.009,
  'claude-3-5-haiku': 0.0008,
  'claude-3-haiku': 0.0006,
  'gemini-1.5-flash': 0.000175,
  'gemini-1.5-pro': 0.00525,
  'gemini-2.0-flash': 0.000175,
};

// Tags que sinalizam conclusão de análise por parte do agente
export const CONCLUSION_SIGNALS = ['[CONCLUÍDO]', '[CONCLUIDO]', '[CONCLUSAO]', '[ANÁLISE CONCLUÍDA]', '[FIM]'];

export function formatFolderTree(tree: any[], maxFiles: number = 120, state = { count: 0 }, indent: string = ''): string {
  let result = '';
  for (const node of tree) {
    if (state.count >= maxFiles) {
      result += `${indent}... (outros arquivos e pastas omitidos para otimizar tamanho do prompt, use 'listFiles' se precisar explorar mais)\n`;
      break;
    }
    if (node.isDirectory) {
      result += `${indent}📁 ${node.name}/\n`;
      state.count++;
      if (node.children) {
        result += formatFolderTree(node.children, maxFiles, state, indent + '  ');
      }
    } else {
      result += `${indent}📄 ${node.name}\n`;
      state.count++;
    }
  }
  return result;
}
