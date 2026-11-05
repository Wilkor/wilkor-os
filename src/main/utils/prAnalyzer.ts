import { parseFilesFromDiff } from './pipelineHelpers';
import { getGitRemoteInfo, getBranchDiff, getChangedFiles } from './gitHandler';
import { getBitBucketPRDiffstat, getBitBucketDiff } from './bitbucketHandler';
import { modelManager } from '../models/manager';
import * as db from './agentDatabase';

export async function analyzePR({ repoPath, branchName, destinationBranch, diffUrl, diffstatUrl, prId, selectedAgentIds }: {
  repoPath: string;
  branchName: string;
  destinationBranch?: string;
  diffUrl?: string;
  diffstatUrl?: string;
  prId?: string | number;
  selectedAgentIds?: string[];
}) {
  const baseBranch = destinationBranch || 'developer';
  console.log(`🤖 Iniciando Deep Analyze para ${branchName} vs ${baseBranch} em ${repoPath} (PR #${prId})`);
  
  let diff = '';
  let files: any[] = [];

  const remoteInfo = await getGitRemoteInfo(repoPath);

  if (prId && remoteInfo) {
    console.log(`📡 Buscando dados via API para PR #${prId}...`);
    const [apiFiles, apiDiff] = await Promise.all([
      getBitBucketPRDiffstat(diffstatUrl, remoteInfo.workspace, remoteInfo.repo, Number(prId)),
      diffUrl ? getBitBucketDiff(diffUrl) : null
    ]);

    if (apiFiles.length > 0) {
      files = apiFiles;
      console.log(`✅ Recebidos ${files.length} arquivos via API.`);
    }
    if (apiDiff) diff = apiDiff;
  }

  if (files.length === 0 || !diff) {
    console.log('🔄 Usando Git local como fallback...');
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      await execAsync('git fetch origin', { cwd: repoPath, timeout: 5000 }).catch(() => null);
    } catch (fErr) {}

    const [localDiff, localFiles] = await Promise.all([
      getBranchDiff(repoPath, branchName, baseBranch),
      getChangedFiles(repoPath, branchName, baseBranch)
    ]);

    if (!diff) diff = localDiff;
    if (files.length === 0) files = localFiles;
  }

  if (diff && diff.includes('diff --git')) {
    const parsedFiles = parseFilesFromDiff(diff);
    if (parsedFiles.length > files.length) {
      console.log(`patch: Sincronizando lista de arquivos via parsing de diff (${parsedFiles.length} detectados)`);
      files = parsedFiles.map(pf => {
        const existing = files.find(f => f.path === pf.path);
        return existing || pf;
      });
    }
  }

  if (!diff) {
    console.warn(`⚠️ Nenhum diff encontrado para ${branchName}`);
    return { 
      success: true, 
      analysis: { score: 100, risk: 'None', color: 'Green', summary: 'Sem alterações detectadas em relação à developer.' },
      files: [],
      diff: ''
    };
  }

  console.log(`📄 Arquivos alterados (${files.length}):`, files);

  modelManager.refreshProviders();

  let registeredAgents = await db.getAgents();
  if (selectedAgentIds && selectedAgentIds.length > 0) {
    registeredAgents = registeredAgents.filter(a => selectedAgentIds.includes(a.id));
  }
  let agentsPrompt = '';
  if (registeredAgents && registeredAgents.length > 0) {
    agentsPrompt = `\n\n### 👥 Agentes Especialistas do Agent Studio a Incorporar na Análise:
Você deve simular e consolidar a revisão deste PR sob a perspectiva de cada um dos seguintes agentes cadastrados no Agent Studio (reaproveitando seus perfis, personas e especialidades):
${registeredAgents.map((a, idx) => `${idx + 1}. **${a.name}** (Papel: ${a.role}): ${a.systemPrompt}`).join('\n')}

No relatório final em MARKDOWN (no campo "full_report"), inclua obrigatoriamente as seguintes garantias visuais:
1. Logo no início do relatório, inclua a linha: "> 👥 **Revisores Participantes:** ${registeredAgents.map(a => `@${a.name} (${a.role})`).join(', ')}"
2. No corpo do relatório, mencione explicitamente as contribuições ou observações de cada um dos agentes selecionados (ex: "Sob a ótica de @NomeDoAgente...").`;
  } else {
    agentsPrompt = `\n\nNo relatório final em MARKDOWN (no campo "full_report"), inclua logo no início a linha: "> 👥 **Revisor Participante:** @wOs (Senior Tech Lead)".`;
  }
  
  const prompt = `Você é o wOs AI Reviewer, um Senior Tech Lead com mais de 10 anos de experiência revisando código de produção.
Seu trabalho é realizar uma revisão de código minuciosa e opinativa deste Pull Request — não uma passagem superficial, mas o tipo de revisão que você daria a um desenvolvedor júnior cujo código está indo para um sistema de produção crítico.

## Seu Mindset
- Você se importa profundamente com manutenibilidade, legibilidade e consequências a longo prazo.
- Você não apenas aponta bugs — você explica POR QUE algo é um problema e COMO corrigi-lo.
- Você revisa CADA arquivo no diff, um por um, com total atenção.
- Você é direto, mas construtivo — sem rodeios, mas sempre acionável.

## Processo de Revisão
1. Entenda o PR: O que este PR tenta fazer? A descrição/título condiz com as mudanças?
2. Análise Arquivo por Arquivo: Para CADA arquivo, avalie Qualidade, Bugs Potenciais, Performance, Segurança, Testabilidade e Arquitetura.

## Regras de Ouro
- Nunca pule um arquivo. Se não houver problemas, diga explicitamente com ✅.
- Não seja vago. Se sugerir refatoração, mostre o código "antes/depois".
- Priorize com honestidade: nem tudo é Crítico.
- Seu nome é EXCLUSIVAMENTE "wOs". NUNCA use "WilkorOs" ou "Wilkor Os" em nenhuma parte do relatório ou assinatura.

Responda EXCLUSIVAMENTE em formato JSON com a seguinte estrutura (TUDO EM PORTUGUÊS BRASIL):
{
  "score": number (0-100),
  "risk": "Low" | "Medium" | "High" | "Critical",
  "risk_justification": "justificativa técnica concisa em português",
  "color": "Green" | "Yellow" | "Red",
  "decision": "APPROVE" | "REQUEST CHANGES" | "NEEDS DISCUSSION",
  "summary": "2-3 frases em português com sua visão geral como tech lead",
  "suggestions": ["lista das 3 principais sugestões acionáveis em português"],
  "full_report": "O relatório completo em MARKDOWN (EM PORTUGUÊS BRASIL) seguindo EXATAMENTE a estrutura: #### 📋 PR Overview, #### 📁 File Reviews, #### 🚨 Blockers, #### ⚠️ Warnings, #### 💡 Suggestions, #### 🏁 Final Verdict"
}

PR Info: "${prId ? `#${prId}` : ''} - ${branchName}" (de ${branchName} para ${baseBranch})
Arquivos: ${files.map(f => f.path).join(', ')}${agentsPrompt}

Diff:
${diff.slice(0, 12000)}`;

  const response = await modelManager.handleChat('auto', [
    { role: 'system', content: 'Você é um revisor de código sênior focado em qualidade e estabilidade de produção. Responda SEMPRE em Português (Brasil).' },
    { role: 'user', content: prompt }
  ], undefined, 'PR Analysis');

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : response);
    analysis.reviewers = registeredAgents && registeredAgents.length > 0 
      ? registeredAgents.map(a => `${a.name} (${a.role})`) 
      : ['wOs (Senior Tech Lead)'];
    console.log(`✅ Análise concluída para ${branchName}:`, analysis.risk);
    return { success: true, analysis, files, diff };
  } catch (e) {
    console.error('Falha ao parsear análise da IA:', response);
    return { 
      success: true, 
      analysis: { 
        score: 70, 
        risk: 'Medium', 
        risk_justification: 'Formato irregular retornado pela IA.',
        color: 'Yellow', 
        summary: 'Análise concluída com formato irregular.',
        suggestions: ['Tente rodar a análise novamente para obter o formato completo.'],
        reviewers: registeredAgents && registeredAgents.length > 0 
          ? registeredAgents.map(a => `${a.name} (${a.role})`) 
          : ['wOs (Senior Tech Lead)'],
        full_report: `#### ⚠️ Erro de Formatação\nA IA gerou uma análise, mas o formato JSON estava irregular. \n\n**Texto Original:**\n${response}`
      },
      files,
      diff
    };
  }
}
