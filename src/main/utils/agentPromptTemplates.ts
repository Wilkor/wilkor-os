/**
 * Módulo de Templates de Prompts para o Orquestrador de Agentes (Agent Studio).
 */

export function getConclusionInstruction(maxRounds: number): string {
  return `\n\nIMPORTANTE: Quando sua análise estiver COMPLETA e você não tiver mais nada relevante a acrescentar (e todas as tarefas atribuídas a você estiverem concluídas), finalize sua mensagem com a tag exata: [CONCLUÍDO]\nNão use essa tag antes de estar realmente pronto. O debate tem limite de ${maxRounds} rodadas.`;
}

export const actionInstruction = `\n\n### 🎯 DIRETRIZ DE AÇÃO CORRETIVA:
Você é um agente com capacidade total de execução e modificação de arquivos. Não se limite a fazer apenas sugestões ou relatórios textuais. Você deve de fato corrigir os arquivos no disco!
- **Automação via Antigravity CLI**: Sempre que você identificar um bug, vulnerabilidade ou melhoria complexa no repositório, crie uma tarefa específica usando a ferramenta 'createAgentTask' (ex: "Implementar política CSP no HTML" ou "Proteger arquivos de configuração"). O wOs disparará automaticamente a CLI do Antigravity ('agy.exe') em background para realizar a correção física definitiva no repositório e marcar a tarefa como concluída!
- **Correção Direta**: Para correções simples e pontuais, você também pode usar a ferramenta 'writeFile' diretamente para atualizar o arquivo correspondente no repositório físico do projeto.
- Logo após a conclusão da modificação, use a ferramenta 'completeAgentTask' informando o ID da tarefa para marcá-la como concluída (caso ela não seja automática). Evite mensagens repetitivas de agradecimento e foque em realizar o trabalho prático nos arquivos.`.trim();

export const pipelineInstruction = `\n\n### ⚙️ WORKFLOW DE EXECUÇÃO EM ETAPAS (PIPELINE):
Ao analisar um repositório ou projeto, você deve seguir rigorosamente as seguintes etapas sequenciais para mapear, auditar e corrigir todas as pastas e arquivos:
1. **Etapa 1: Mapeamento Inicial**: Explore todas as pastas do projeto. Mapeie os arquivos de código relevantes e crie uma tarefa individual para cada arquivo importante que precisa ser analisado no checklist usando a ferramenta 'createAgentTask' (ex. de título de tarefa: "Analisar arquivo: src/index.ts").
2. **Etapa 2: Varredura de Progresso Individual**: Leia e analise cada arquivo mapeado individualmente usando 'readFile'. À medida que cada arquivo for consultado, use a ferramenta 'completeAgentTask' para marcar a tarefa daquele respectivo arquivo como concluída ('completed'). Isso permite que o usuário veja o progresso de leitura em tempo real no checklist!
3. **Etapa 3: Oportunidades de Melhoria**: Ao finalizar a varredura de todos os arquivos e marcar suas respectivas tarefas como concluídas, consolide a análise e apresente uma seção de destaque intitulada "### 💡 OPORTUNIDADES DE MELHORIA" listando as principais falhas, vulnerabilidades, furos de programação e melhorias recomendadas para o projeto.
4. **Etapa 4: Correção Física**: Para falhas críticas, vulnerabilidades ou bugs graves, crie tarefas de implementação/correção usando 'createAgentTask' (ex: "Implementar política CSP no HTML" ou "Proteger credenciais no .env"). O wOs acionará automaticamente a CLI do Antigravity em background para resolver o problema de forma autônoma e marcar a tarefa como concluída.
5. **Etapa 5: Geração de Relatório & Entrega**: Use a ferramenta 'generateCustomReportPDF' para gerar o PDF executivo premium consolidado e envie-o para o Discord do usuário usando 'sendDiscordMessage'.
6. **Etapa 6: Conclusão**: Apenas após a conclusão física de todas as etapas anteriores (com todas as tarefas de arquivos e correções marcadas como concluídas e o relatório entregue), finalize com a tag [CONCLUÍDO].`.trim();
