import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getRoots } from '../utils/fs';

interface DetectedSkill {
  name: string;
  path: string;
  score: number;
}

/**
 * Filtra e pontua as skills do workspace com base na mensagem do usuário.
 */
export async function detectSkills(userMessage: string): Promise<DetectedSkill[]> {
  const roots = getRoots();
  const rootsToScan = [...roots];

  // Adiciona a raiz do wOs para detectar as skills integradas/nativas
  const systemRoot = process.cwd();
  if (!rootsToScan.includes(systemRoot)) {
    rootsToScan.push(systemRoot);
  }

  if (rootsToScan.length === 0) return [];

  const detected: DetectedSkill[] = [];
  const normalizedUserMsg = userMessage.toLowerCase();

  // Lista de tokens comuns que podem gerar falsos positivos se buscados isoladamente
  const commonTokens = [
    'setup', 'automation', 'skill', 'pattern', 'patterns', 'practices', 'best', 
    'expert', 'pro', 'builder', 'integration', 'test', 'testing', 'optimization', 
    'optimizer', 'manager', 'audit', 'auditor', 'architect', 'development', 
    'developer', 'scaffold', 'engine', 'tool', 'analyzer', 'api'
  ];

  for (const root of rootsToScan) {
    const skillsPath = join(root, '.wos', 'skills');
    if (!existsSync(skillsPath)) continue;

    try {
      const items = await readdir(skillsPath, { withFileTypes: true });
      const skillDirs = items.filter(item => item.isDirectory());

      for (const dir of skillDirs) {
        const skillName = dir.name;
        const skillPath = join(skillsPath, skillName);
        const skillTokens = skillName.toLowerCase().split('-');
        let score = 0;

        // 1. Match forte: substring exata do nome com hífens ou com espaços
        const spacedName = skillTokens.join(' ');
        if (normalizedUserMsg.includes(spacedName) || normalizedUserMsg.includes(skillName.toLowerCase())) {
          score += 15;
        }

        // 2. Match de tokens individuais fortes (palavras exatas por limite de borda \b)
        for (const token of skillTokens) {
          if (token.length <= 2 || commonTokens.includes(token)) continue;
          
          // Escapa caracteres especiais de regex se houver no token
          const escapedToken = token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedToken}\\b`, 'i');
          
          if (regex.test(normalizedUserMsg)) {
            score += 8;
          }
        }

        // 3. Match parcial/flexível (tolerância a variações como "whats" para "whatsapp", "tiktoks" para "tiktok")
        const userWords = normalizedUserMsg.split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
        for (const word of userWords) {
          if (word.length < 4) continue;
          for (const token of skillTokens) {
            if (token.length <= 2 || commonTokens.includes(token)) continue;
            
            if (token.includes(word) || word.includes(token)) {
              score += 5;
            }
          }
        }

        if (score > 0) {
          detected.push({
            name: skillName,
            path: skillPath,
            score
          });
        }
      }
    } catch (error) {
      console.error(`[SkillDetector] Erro ao ler skills em ${skillsPath}:`, error);
    }
  }

  // Ordena por pontuação decrescente e remove duplicados (caso a mesma skill apareça em múltiplos roots)
  const uniqueDetected: DetectedSkill[] = [];
  const seenNames = new Set<string>();

  const sorted = detected.sort((a, b) => b.score - a.score);
  for (const skill of sorted) {
    if (!seenNames.has(skill.name)) {
      seenNames.add(skill.name);
      uniqueDetected.push(skill);
    }
  }

  return uniqueDetected;
}

/**
 * Lê o conteúdo do arquivo de instrução da skill (SKILL.md, skill.md, README.md, etc.)
 */
async function loadSkillContent(skillPath: string): Promise<string | null> {
  const possibleFiles = ['SKILL.md', 'skill.md', 'README.md', 'readme.md'];
  for (const file of possibleFiles) {
    const fullPath = join(skillPath, file);
    if (existsSync(fullPath)) {
      try {
        const content = await readFile(fullPath, 'utf-8');
        return content;
      } catch (err) {
        console.error(`[SkillDetector] Erro ao ler ${fullPath}:`, err);
      }
    }
  }
  return null;
}

/**
 * Detecta as skills relevantes para a mensagem, carrega suas instruções e formata o contexto.
 */
export async function getSkillsContextForPrompt(userMessage: string): Promise<string> {
  const detected = await detectSkills(userMessage);
  if (detected.length === 0) return '';

  // Limita a no máximo 3 skills para otimização de tokens e foco do LLM
  const topSkills = detected.slice(0, 3);
  let context = '\n\n=== 🛠️ SKILLS AUTOMATICAMENTE DETECTADAS E ATIVADAS ===\n';
  context += 'O usuário mencionou termos relacionados a estas skills do wOs. Siga RIGOROSAMENTE as regras e orientações delas abaixo:\n\n';

  let loadedCount = 0;
  for (const skill of topSkills) {
    const content = await loadSkillContent(skill.path);
    if (content) {
      context += `#### 📖 SKILL: ${skill.name}\n`;
      context += `Caminho local: ${skill.path}\n`;
      context += `<!-- START SKILL INSTRUCTIONS: ${skill.name} -->\n`;
      context += `${content}\n`;
      context += `<!-- END SKILL INSTRUCTIONS: ${skill.name} -->\n\n`;
      loadedCount++;
    }
  }

  return loadedCount > 0 ? context : '';
}
