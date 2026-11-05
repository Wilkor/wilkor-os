import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getRoots } from '../utils/fs';

interface DetectedRule {
  name: string;
  path: string;
  trigger: string;
  priority: number;
  score: number;
}

/**
 * Detecta rules relevantes baseadas no trigger e contexto da mensagem do usuário.
 */
export async function detectRules(userMessage: string): Promise<DetectedRule[]> {
  const roots = getRoots();
  const rootsToScan = [...roots];

  // Adiciona a raiz do wOs para detectar as rules integradas/nativas
  const systemRoot = process.cwd();
  if (!rootsToScan.includes(systemRoot)) {
    rootsToScan.push(systemRoot);
  }

  if (rootsToScan.length === 0) return [];

  const detected: DetectedRule[] = [];
  const normalizedUserMsg = userMessage.toLowerCase();

  for (const root of rootsToScan) {
    const rulesPath = join(root, '.wos', 'rules');
    if (!existsSync(rulesPath)) continue;

    try {
      const items = await readdir(rulesPath, { withFileTypes: true });
      const ruleFiles = items.filter(item => item.isFile() && item.name.endsWith('.md'));

      for (const file of ruleFiles) {
        const ruleName = file.name.replace('.md', '');
        const rulePath = join(rulesPath, file.name);

        try {
          const content = await readFile(rulePath, 'utf-8');
          const trigger = extractTrigger(content);
          const priority = extractPriority(content);

          if (!trigger) continue;

          // Verifica se o trigger corresponde à mensagem
          let score = 0;

          // Trigger pode ser uma regex ou uma string simples
          if (trigger.startsWith('/') && trigger.endsWith('/')) {
            // É uma regex
            try {
              const regexPattern = trigger.slice(1, -1);
              const regex = new RegExp(regexPattern, 'i');
              if (regex.test(normalizedUserMsg)) {
                score = 20; // Match de regex tem pontuação alta
              }
            } catch (e) {
              // Regex inválida, ignora
            }
          } else {
            // É uma string simples - verifica se está contida na mensagem
            const normalizedTrigger = trigger.toLowerCase();
            if (normalizedUserMsg.includes(normalizedTrigger)) {
              score = 15;
            }
          }

          // Adiciona pontuação baseada na prioridade
          if (score > 0) {
            score += priority;
          }

          if (score > 0) {
            detected.push({
              name: ruleName,
              path: rulePath,
              trigger,
              priority,
              score
            });
          }
        } catch (error) {
          console.error(`[RuleDetector] Erro ao ler rule ${rulePath}:`, error);
        }
      }
    } catch (error) {
      console.error(`[RuleDetector] Erro ao ler rules em ${rulesPath}:`, error);
    }
  }

  // Ordena por pontuação decrescente e remove duplicados
  const uniqueDetected: DetectedRule[] = [];
  const seenNames = new Set<string>();

  const sorted = detected.sort((a, b) => b.score - a.score);
  for (const rule of sorted) {
    if (!seenNames.has(rule.name)) {
      seenNames.add(rule.name);
      uniqueDetected.push(rule);
    }
  }

  return uniqueDetected;
}

/**
 * Extrai o trigger do frontmatter da rule
 */
function extractTrigger(content: string): string | null {
  const triggerMatch = content.match(/trigger:\s*["']?([^"'\n]+)["']?/i);
  return triggerMatch ? triggerMatch[1].trim() : null;
}

/**
 * Extrai a prioridade do frontmatter da rule
 */
function extractPriority(content: string): number {
  const priorityMatch = content.match(/priority:\s*(\d+)/i);
  return priorityMatch ? parseInt(priorityMatch[1], 10) : 5; // Prioridade padrão: 5
}

/**
 * Detecta as rules relevantes para a mensagem, carrega suas instruções e formata o contexto.
 */
export async function getRulesContextForPrompt(userMessage: string): Promise<string> {
  const detected = await detectRules(userMessage);
  if (detected.length === 0) return '';

  let context = '\n\n=== 📋 RULES AUTOMATICAMENTE DETECTADAS E ATIVADAS ===\n';
  context += 'As seguintes rules do wOs foram ativadas baseadas no contexto. Siga RIGOROSAMENTE estas regras:\n\n';

  for (const rule of detected) {
    try {
      const content = await readFile(rule.path, 'utf-8');
      context += `#### 📖 RULE: ${rule.name}\n`;
      context += `Trigger: ${rule.trigger}\n`;
      context += `Prioridade: ${rule.priority}\n`;
      context += `<!-- START RULE INSTRUCTIONS: ${rule.name} -->\n`;
      context += `${content}\n`;
      context += `<!-- END RULE INSTRUCTIONS: ${rule.name} -->\n\n`;
    } catch (error) {
      console.error(`[RuleDetector] Erro ao carregar rule ${rule.name}:`, error);
    }
  }

  return context;
}
