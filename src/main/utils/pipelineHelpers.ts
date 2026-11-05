/**
 * Realiza o parsing manual de caminhos de arquivos e estatísticas a partir do diff bruto
 */
export function parseFilesFromDiff(diff: string): any[] {
  const files: any[] = [];
  const sections = (diff || '').split(/^diff --git /m);
  
  sections.forEach(section => {
    if (!section.trim()) return;
    const lines = section.split('\n');
    const header = lines[0];
    
    // Tenta capturar o caminho do arquivo b/path/to/file
    const match = header.match(/b\/(.+)$/);
    if (match) {
      let path = match[1].trim();
      // Remove possíveis aspas de caminhos com espaços
      path = path.replace(/^"|"$/g, '');
      
      let additions = 0;
      let deletions = 0;
      
      // Conta linhas que começam com + ou - (ignorando o cabeçalho do chunk)
      lines.forEach(line => {
        if (line.startsWith('+') && !line.startsWith('+++')) additions++;
        if (line.startsWith('-') && !line.startsWith('---')) deletions++;
      });
      
      files.push({ path, additions, deletions });
    }
  });
  return files;
}
