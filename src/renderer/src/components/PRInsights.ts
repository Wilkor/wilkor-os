// Utilitários para análise de qualidade de PRs baseado no payload do Bitbucket
// Foco em governança técnica e padrões de elite (Conventional Commits + Branching Strategy)

export interface PRQualityScore {
  score: number;
  label: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
  issues: string[];
  positives: string[];
}

function scoreTitle(title: string) {
  const issues: string[] = [];
  const positives: string[] = [];
  let points = 0;
  
  // Regex rigoroso para Conventional Commits
  const conventionalRe = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?!?: .{5,}/i;
  
  if (conventionalRe.test(title)) { 
    points += 45; 
    positives.push('Padrão semântico detectado (Conventional Commits)'); 
  } else { 
    issues.push('Título não segue o padrão semântico (feat/fix/chore)'); 
  }

  if (title.length >= 10 && title.length <= 72) { 
    points += 10; 
    positives.push('Comprimento de título otimizado para leitura'); 
  } else if (title.length > 72) {
    issues.push('Título excessivamente longo (>72 caracteres)');
  }

  if (title.endsWith('.')) { 
    points -= 5;
    issues.push('Título termina com ponto final (fora do padrão Git)'); 
  }

  return { points, issues, positives };
}

function scoreBranch(branch: string) {
  const issues: string[] = [];
  const positives: string[] = [];
  let points = 0;
  
  const branchRe = /^(feat|fix|hotfix|chore|refactor|docs|test)\/.+/i;
  
  if (branchRe.test(branch)) { 
    points += 25; 
    positives.push('Branch utiliza prefixo de categoria (Git Flow)'); 
  } else { 
    issues.push('Branch sem categoria definida (ex: feat/nome)'); 
  }

  if (['developer', 'main', 'master'].includes(branch.toLowerCase())) {
    issues.push('PR originado de branch protegida (Risco de Segurança)');
    points -= 30;
  }

  return { points, issues, positives };
}

function getDaysOpen(createdOn: string): number {
  return Math.floor((Date.now() - new Date(createdOn).getTime()) / (1000 * 60 * 60 * 24));
}

function scoreAge(daysOpen: number) {
  const issues: string[] = [];
  const positives: string[] = [];
  let points = 0;

  if (daysOpen === 0) { 
    points += 20; 
    positives.push('PR ágil: aberto há menos de 24h'); 
  } else if (daysOpen <= 3) { 
    points += 10; 
    positives.push('Tempo de resposta dentro do SLA'); 
  } else if (daysOpen > 7) { 
    points -= 15; 
    issues.push(`PR estagnado: aberto há ${daysOpen} dias`); 
  }

  return { points, issues, positives };
}

export function computePRQuality(pr: any): PRQualityScore {
  const allIssues: string[] = [];
  const allPositives: string[] = [];
  let total = 0;

  const t = scoreTitle(pr.title || '');
  total += t.points; allIssues.push(...t.issues); allPositives.push(...t.positives);

  const b = scoreBranch(pr.sourceBranch || pr.name || '');
  total += b.points; allIssues.push(...b.issues); allPositives.push(...b.positives);

  const days = getDaysOpen(pr.date || new Date().toISOString());
  const a = scoreAge(days);
  total += a.points; allIssues.push(...a.issues); allPositives.push(...a.positives);

  // Engagement & Blocks
  if ((pr.comment_count || 0) > 0) { 
    total += 5; 
    allPositives.push('Engajamento de revisores detectado'); 
  }
  
  if ((pr.task_count || 0) > 0) { 
    allIssues.push(`${pr.task_count} tarefas de revisão pendentes`); 
    total -= 10;
  }

  if (pr.draft) { 
    allIssues.push('PR em modo Rascunho (WIP)'); 
    total -= 10; 
  }

  const score = Math.max(0, Math.min(100, total));
  let label: string;
  let color: PRQualityScore['color'];

  if (score >= 85) { label = 'Optimal'; color = 'green'; }
  else if (score >= 65) { label = 'Stable'; color = 'blue'; }
  else if (score >= 40) { label = 'Warning'; color = 'yellow'; }
  else { label = 'Critical'; color = 'red'; }

  return { score, label, color, issues: allIssues, positives: allPositives };
}

export function getDaysOpenLabel(createdOn: string): string {
  const days = getDaysOpen(createdOn);
  if (days === 0) return 'Recent';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function getDestinationLabel(branch?: string): string {
  if (!branch) return '?';
  const b = branch.toLowerCase();
  if (b === 'main' || b === 'master') return 'Production';
  if (b === 'developer' || b === 'dev') return 'Development';
  return branch;
}

export const QUALITY_COLORS = {
  green:  { bg: 'rgba(52,211,153,0.03)', border: 'rgba(52,211,153,0.15)', text: '#34d399' },
  blue:   { bg: 'rgba(96,165,250,0.03)',  border: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
  yellow: { bg: 'rgba(251,191,36,0.03)', border: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  red:    { bg: 'rgba(248,113,113,0.03)',  border: 'rgba(248,113,113,0.15)', text: '#f87171' },
};
