import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getRoots } from '../utils/fs';

interface DetectedWorkflow {
  name: string;
  path: string;
  trigger: string;
  score: number;
}

/**
 * Detecta workflows relevantes baseadas no trigger e contexto da mensagem do usuário.
 */
export async function detectWorkflows(userMessage: string): Promise<DetectedWorkflow[]> {
  const roots = getRoots();
  const rootsToScan = [...roots];

  // Adiciona a raiz do wOs para detectar os workflows integrados/nativos
  const systemRoot = process.cwd();
  if (!rootsToScan.includes(systemRoot)) {
    rootsToScan.push(systemRoot);
  }

  if (rootsToScan.length === 0) return [];

  const detected: DetectedWorkflow[] = [];
  const normalizedUserMsg = userMessage.toLowerCase();

  for (const root of rootsToScan) {
    const workflowsPath = join(root, '.wos', 'workflows');
    if (!existsSync(workflowsPath)) continue;

    try {
      const items = await readdir(workflowsPath, { withFileTypes: true });
      const workflowFiles = items.filter(item => item.isFile() && item.name.endsWith('.md'));

      for (const file of workflowFiles) {
        const workflowName = file.name.replace('.md', '');
        const workflowPath = join(workflowsPath, file.name);

        try {
          const content = await readFile(workflowPath, 'utf-8');
          const trigger = extractTrigger(content);

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

          if (score > 0) {
            detected.push({
              name: workflowName,
              path: workflowPath,
              trigger,
              score
            });
          }
        } catch (error) {
          console.error(`[WorkflowDetector] Erro ao ler workflow ${workflowPath}:`, error);
        }
      }
    } catch (error) {
      console.error(`[WorkflowDetector] Erro ao ler workflows em ${workflowsPath}:`, error);
    }
  }

  // Ordena por pontuação decrescente e remove duplicados
  const uniqueDetected: DetectedWorkflow[] = [];
  const seenNames = new Set<string>();

  const sorted = detected.sort((a, b) => b.score - a.score);
  for (const workflow of sorted) {
    if (!seenNames.has(workflow.name)) {
      seenNames.add(workflow.name);
      uniqueDetected.push(workflow);
    }
  }

  return uniqueDetected;
}

/**
 * Extrai o trigger do frontmatter do workflow
 */
function extractTrigger(content: string): string | null {
  const triggerMatch = content.match(/trigger:\s*["']?([^"'\n]+)["']?/i);
  return triggerMatch ? triggerMatch[1].trim() : null;
}

/**
 * Detecta os workflows relevantes para a mensagem, carrega suas instruções e formata o contexto.
 */
export async function getWorkflowsContextForPrompt(userMessage: string): Promise<string> {
  const detected = await detectWorkflows(userMessage);
  if (detected.length === 0) return '';

  let context = '\n\n=== 🔄 WORKFLOWS AUTOMATICAMENTE DETECTADOS E ATIVADOS ===\n';
  context += 'Os seguintes workflows do wOs foram ativados baseados no contexto. Siga RIGOROSAMENTE os passos definidos:\n\n';

  for (const workflow of detected) {
    try {
      const content = await readFile(workflow.path, 'utf-8');
      context += `#### 📖 WORKFLOW: ${workflow.name}\n`;
      context += `Trigger: ${workflow.trigger}\n`;
      context += `<!-- START WORKFLOW INSTRUCTIONS: ${workflow.name} -->\n`;
      context += `${content}\n`;
      context += `<!-- END WORKFLOW INSTRUCTIONS: ${workflow.name} -->\n\n`;
    } catch (error) {
      console.error(`[WorkflowDetector] Erro ao carregar workflow ${workflow.name}:`, error);
    }
  }

  return context;
}
