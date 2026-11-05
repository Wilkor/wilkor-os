// AgentOrchestrator.ts

export interface SpecAgent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  emoji: string;
  color: string;
}

export const STEPS = [
  { label: 'Review PRD', desc: 'Validando PRD' },
  { label: 'Requisitos', desc: 'Gerando requirements.md' },
  { label: 'Arquitetura', desc: 'Gerando design.md' },
  { label: 'Sprint Planner', desc: 'Mapeando tasks.json' },
  { label: 'Trello Sync', desc: 'Sincronizando backlog' }
];

export interface AgentResponse {
  status: 'APROVADO' | 'INCOMPLETO';
  content: string;
  questions?: string[];
  summary?: string;
}

// Fallback base prompts in case they are not in the database
export const FALLBACK_AGENTS: SpecAgent[] = [
  {
    id: 'agent_prd_reviewer',
    name: 'PRD Reviewer',
    role: 'Product Requirements Reviewer',
    emoji: '🔍',
    color: '#6366f1',
    systemPrompt: `Você é um revisor de Product Requirements Documents (PRD).

Analise o PRD fornecido e verifique se os seguintes elementos estão presentes e suficientemente detalhados:
- Problema: qual dor ou oportunidade está sendo endereçada?
- Usuários-alvo: quem vai usar isso? Qual o perfil?
- Escopo: o que está DENTRO e o que está FORA do escopo?
- Métricas de sucesso: como saberemos que funcionou?
- Restrições: técnicas, de prazo, de orçamento ou de compliance?

Se algum desses elementos estiver ausente ou vago demais, NÃO avance.
Retorne exatamente neste formato:

STATUS: INCOMPLETO
PERGUNTAS:
1. [pergunta objetiva sobre o que falta]
2. [...]

Se tudo estiver presente e claro, retorne:

STATUS: APROVADO
RESUMO: [3-4 linhas consolidando o PRD validado]`
  },
  {
    id: 'agent_requirements_writer',
    name: 'Requirements Writer',
    role: 'Agile Requirements Analyst',
    emoji: '📝',
    color: '#10b981',
    systemPrompt: `Você é um analista de produto especialista em escrita de requisitos ágeis.

Com base no PRD fornecido, gere um documento de requirements com a seguinte estrutura:

## Épicos
Liste os grandes blocos funcionais do produto.

## User Stories
Para cada épico, escreva as user stories no formato:
"Como [perfil], quero [ação] para que [benefício]."

## Critérios de Aceite
Para cada user story, liste os critérios de aceite em formato testável (dado/quando/então ou checklist objetivo).

## Fora do Escopo
Liste explicitamente o que NÃO será construído nesta versão.

Se o PRD não tiver informação suficiente para escrever alguma seção, NÃO invente.
Retorne:

STATUS: INCOMPLETO
PERGUNTAS:
1. [o que precisa ser esclarecido]

Caso consiga gerar o documento completo, retorne:

STATUS: APROVADO
[documento completo em markdown]`
  },
  {
    id: 'agent_design_architect',
    name: 'Design Architect',
    role: 'Senior Software Architect',
    emoji: '📐',
    color: '#f59e0b',
    systemPrompt: `Você é um arquiteto de software sênior.

Com base no PRD e nos requirements fornecidos, produza um documento de design técnico com:

## Visão Geral da Arquitetura
Descrição da solução em camadas (frontend, backend, banco, integrações externas).

## Diagrama em texto
Representação ASCII ou descritiva do fluxo de dados principal.

## Decisões Técnicas (ADRs)
Para cada decisão relevante (linguagem, framework, banco, autenticação, etc.):
- Contexto: por que essa decisão era necessária?
- Decisão: o que foi escolhido?
- Alternativas consideradas
- Trade-offs e consequências

## APIs e Contratos
Liste os endpoints principais ou contratos de integração relevantes.

## Riscos Técnicos
O que pode dar errado? Como mitigar?

Se houver decisões que dependem de informações que você não tem, NÃO assuma.
Retorne:

STATUS: INCOMPLETO
PERGUNTAS:
1. [decisão que precisa de input do usuário]

Caso consiga gerar o documento completo:

STATUS: APROVADO
[documento completo em markdown]`
  },
  {
    id: 'agent_task_planner',
    name: 'Task Planner',
    role: 'Technical Lead & Sprint Planner',
    emoji: '🗓️',
    color: '#a855f7',
    systemPrompt: `Você é um tech lead especialista em planejamento de sprints.

Com base em todos os documentos fornecidos (PRD, requirements, design), gere um plano de execução em fases com tarefas atômicas.

Regras para as tarefas:
- Cada tarefa deve ser completável em no máximo 1 dia de trabalho
- Cada tarefa deve ter critério de conclusão claro ("está feito quando...")
- Tarefas devem seguir a ordem: Database → API → Frontend → Polish & Deploy
- Dependências entre tarefas devem ser explicitadas

Retorne em formato JSON, assim:

{
  "fases": [
    {
      "nome": "Fase 01 — Database layer",
      "tarefas": [
        {
          "titulo": "Criar migration para tabela X",
          "descricao": "Detalhamento do que deve ser feito",
          "criterio_de_conclusao": "Migration roda sem erro e tabela existe com os campos Y e Z",
          "dependencias": [],
          "estimativa_horas": 2
        }
      ]
    }
  ]
}

Seu output DEVE ser estritamente o JSON válido e nada mais. Não inclua blocos markdown do tipo \`\`\`json.`
  }
];

export function parseAgentResponse(rawText: string): AgentResponse {
  const normalized = rawText.trim();
  const statusMatch = normalized.match(/^STATUS:\s*(APROVADO|INCOMPLETO)/i);
  
  if (!statusMatch) {
    // If no status is found, check if it contains markdown or JSON (useful for Planner/Writer fallbacks)
    return {
      status: 'APROVADO',
      content: rawText
    };
  }

  const status = statusMatch[1].toUpperCase() as 'APROVADO' | 'INCOMPLETO';
  
  if (status === 'INCOMPLETO') {
    const questionsBlock = normalized.split(/PERGUNTAS:/i)[1] || '';
    const questions = questionsBlock
      .split('\n')
      .map(q => q.replace(/^\s*\d+\.\s*/, '').replace(/^\s*-\s*/, '').trim())
      .filter(q => q.length > 0);

    return {
      status,
      content: rawText,
      questions: questions.length > 0 ? questions : ['Por favor, detalhe mais os requisitos para podermos continuar.']
    };
  }

  // Approved
  const afterStatus = normalized.replace(/^STATUS:\s*APROVADO/i, '').trim();
  const resMatch = afterStatus.match(/^RESUMO:\s*([\s\S]+)/i);
  const summary = resMatch ? resMatch[1].trim() : afterStatus.substring(0, 200);

  return {
    status,
    content: afterStatus,
    summary
  };
}

export async function saveDocsToWorkspace(
  targetRepoPath: string,
  requirements: string,
  design: string,
  tasksJson: string,
  customFolderName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!targetRepoPath) {
      return { success: false, error: 'Nenhum repositório selecionado.' };
    }
    const baseDocsDir = `${targetRepoPath}/docs`;
    const docsDir = customFolderName ? `${baseDocsDir}/${customFolderName}` : baseDocsDir;

    // Tenta criar pasta docs base
    try {
      await (window as any).api.fs.mkdir(baseDocsDir);
    } catch (_) {}

    // Tenta criar subpasta se houver
    if (customFolderName) {
      try {
        await (window as any).api.fs.mkdir(docsDir);
      } catch (_) {}
    }

    await (window as any).api.fs.writeFile(`${docsDir}/requirements.md`, requirements);
    await (window as any).api.fs.writeFile(`${docsDir}/design.md`, design);
    
    let formattedTasks = '';
    try {
      const parsed = JSON.parse(tasksJson);
      formattedTasks = JSON.stringify(parsed, null, 2);
    } catch (_) {
      formattedTasks = tasksJson;
    }
    await (window as any).api.fs.writeFile(`${docsDir}/tasks.json`, formattedTasks);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function loadReadmeFromWorkspace(repoPath: string): Promise<string> {
  try {
    if (!repoPath) return '';
    const api = (window as any).api.fs;
    if (!api) return '';
    
    // Tenta primeiro README.md
    try {
      const res = await api.readFile(`${repoPath}/README.md`);
      if (res && res.success && res.content) return res.content;
    } catch (_) {}

    // Tenta depois readme.md
    try {
      const res = await api.readFile(`${repoPath}/readme.md`);
      if (res && res.success && res.content) return res.content;
    } catch (_) {}

    return '';
  } catch (err) {
    console.warn('Erro ao ler README do workspace:', err);
    return '';
  }
}
