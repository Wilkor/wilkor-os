export const flattenTree = (nodes: any[]): string[] => {
  const result: string[] = [];
  if (!nodes) return result;
  const ignoreDir = ['.agent/skills', 'node_modules', '.git', 'dist', 'build', '.next', '.agent/brain', 'vendor'];
  for (const node of nodes) {
    const path = node.path || node.name || '';
    const shouldIgnore = ignoreDir.some(dir => path.includes(dir));
    if (node.children && node.children.length > 0) {
      if (!shouldIgnore) result.push(...flattenTree(node.children));
      else result.push(`${path}/ (diretório ocultado)`);
    } else if (!shouldIgnore) result.push(path);
  }
  return result.slice(0, 500);
};

export const buildAgentContext = (
  projectContexts: any[] = [],
  tabs: any[],
  activeTabPath: string | null,
  fileTrees: Record<string, any[]>
): string => {
  const lines: string[] = [];
  if (projectContexts.length > 0) {
    lines.push('## 🎯 Especificações dos Projetos');
    projectContexts.forEach(ctx => {
      lines.push(`### Projeto: \`${ctx.root}\``);
      if (ctx.brain) {
        ctx.brain.forEach((f: any) => lines.push(`##### 📚 \`${f.name}\`\n\`\`\`markdown\n${f.content}\n\`\`\``));
      }
      ctx.files.forEach((f: any) => lines.push(`#### 📄 \`${f.name}\`\n\`\`\`markdown\n${f.content}\n\`\`\``));
    });
  }
  
  const activeTab = tabs.find(t => t.path === activeTabPath);
  if (activeTab) {
    lines.push(`\n## 📝 Arquivo Atual\n**Caminho:** \`${activeTab.path}\`\n\`\`\`${activeTab.name.split('.').pop()}\n${activeTab.content}\n\`\`\``);
  }
  
  const workspacePaths = Object.keys(fileTrees);
  if (workspacePaths.length > 0) {
    lines.push('\n## 🗂️ Estrutura de Diretórios');
    workspacePaths.forEach(root => {
      lines.push(`**Raiz:** \`${root}\``);
      lines.push(flattenTree(fileTrees[root]).map(f => `  - \`${f}\``).join('\n'));
    });
  }
  return lines.join('\n\n');
};
