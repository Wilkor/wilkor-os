# Progresso do Projeto - WilkorOs

| Data | Tarefa | Status | Observações |
| 2026-05-31 | feat(search): pesquisa na internet nativa via Tavily, Brave, Google e fallback DDG | ✅ Concluído | Adicionado utilitário modular webSearch, registrada a ferramenta searchWeb e expostos os campos de chaves no painel de Ajustes > Serviços & APIs. |
| 2026-05-31 | feat(skills): instalador de habilidades via npm, npx e markdown | ✅ Concluído | Criada a ferramenta installSkill delegada de forma modular, permitindo a instalação automática de diretrizes SKILL.md e de servidores MCP via npm/npx no wOs. |
| 2026-05-31 | feat(mcp): CRUD completo de MCPs, visão inativa, resolução de colisões e ícones randômicos | ✅ Concluído | CRUD de servidores e presets no MongoDB, visão de MCPs desativados para a IA, prefixação de ferramentas contra colisões de múltiplos ativos e ícones randômicos. |
| 2026-05-29 | feat(pipeline): implementa categoria outros, correcoes de trello e duplicacao, e progresso de IA | ✅ Concluído | Adicionado suporte a pasta customizada e 'Outros', corrigido sync de Backlog e acumulador de perguntas, adicionado barra e mensagens rotativas de loading. |
| 2026-05-13 | feat(analytics): porcentagens e correção PR | ✅ Concluído | Adicionado % nos gráficos, fix no Approve e funcionalidade de comentários no Bitbucket. |
| 2026-05-12 | Correção de Erros de Tema no Dashboard | ✅ Concluído | Corrigido erro de referência ao 'theme' em subcomponentes. |
| 2026-05-12 | Estabilidade do Terminal (xterm.js) | ✅ Concluído | Corrigido crash de dimensões ao abrir terminal oculto. |
| 2026-05-12 | Modernização Visual do Dashboard | ✅ Concluído | Adicionado glassmorphism, gradientes e efeitos de hover. |
| 2026-05-12 | Exportação de Relatórios em PDF | ✅ Concluído | Implementado export com análise de performance por IA. |
| 2026-05-12 | Aba de Pull Request Review | ✅ Concluído | Criada estrutura para análise automática de PRs. |
| 2026-05-12 | Integração Avançada BitBucket | ✅ Concluído | Avatares reais, suporte a branches de destino e fallback de diff via API. |
| 2026-05-12 | Fix ReferenceError: useEffect em PRCard | ✅ Concluído | Corrigido import ausente de useEffect no componente PRCard. |
| 2026-05-12 | Redesign Premium do PR Command Center | ✅ Concluído | Refatoração completa da UI de PRs para estética 'Ultra-Premium' e Command Center. |
| 2026-05-12 | Fix Loading Background | ✅ Concluído | Removida faixa preta no loading; estado agora é theme-aware. |
| 2026-05-12 | Refino Intelligence Module | ✅ Concluído | Refatoração completa do visual de diff e análise profunda para Command Center. |
| 2026-05-12 | Gráfico Trello Multi-Linha | ✅ Concluído | Adicionada comparação entre cards assinados vs concluídos no ranking do Trello. |
| 2026-05-13 | fix(kanban): cache e sincronização | ✅ Concluído | Adicionado cache buster na API Trello, fetch origin automático no Git stats e limpeza de estado visual. |
| 2026-05-14 | feat(ai): indicador de contexto circular | ✅ Concluído | Implementado visualizador circular de consumo de tokens/contexto no chat input. |
| 2026-05-14 | feat(chore): implementa code editing agent harness | ✅ Concluído | Criada especificação de ferramentas, fluxos e governança do agente via Skill. |
| 2026-05-14 | fix(ai): identificação de anexos multimodais | ✅ Concluído | Corrigido erro de roteamento e identificação de arquivos de áudio/vídeo/PDF. |
| 2026-05-20 | fix(workspace): estabilização e modularização do Explorer | ✅ Concluído | Cleanup de IPC no useIPCListeners, resolução do pai no useWorkspace, modularização de FileTree com FileItem. |
| 2026-05-20 | feat(ai): prompt de completude e resiliência de tarefas | ✅ Concluído | Injetada a regra de execução resiliente de fluxos de tarefas compostas no promptBuilder.ts. |
| 2026-05-20 | feat(ui): diff interativo em acordeão de alterações | ✅ Concluído | Criação de AgentActivityItem, refatoração de AgentActivityPanel e otimização de visual inline no DiffViewer. |
| 2026-05-22 | feat(workspace): remoção de projetos do workspace | ✅ Concluído | Remoção segura de projetos do workspace via menu de contexto do FileTree e modal dedicado de gerenciamento sem exclusão física. |
| 2026-05-22 | feat(chore): atualiza wOs para seguir padrões antigravity | ✅ Concluído | Alinha SKILL.md do wOs com o fluxo de planning, arquivos modulares de 300 linhas e feedback loops da IDE. |
| 2026-05-23 | feat(skills): detecção inteligente de skills nativas | ✅ Concluído | Escaneia a pasta de skills nativas do wOs e adiciona busca flexível e resiliente com correspondência parcial. |
| 2026-05-23 | feat(mcp): restauração do mcp manager e suporte a whatsapp | ✅ Concluído | Restaura os métodos CRUD ausentes de mcpManager e remove restrições de inicialização do Rube MCP. |
| 2026-05-23 | feat(ai): geração de imagens com createImage | ✅ Concluído | Adicionado comando e ferramenta createImage com fallback para Pollinations AI e salvamento no workspace. |
| 2026-05-23 | fix(discord): envio resiliente de relatórios PDF | ✅ Concluído | Implementado auto-correção de caminhos de arquivos locais na mensagem, repasse de filePath no IPC/Preload e modularização do discordHandler. |
| 2026-05-23 | feat(ui): melhorias no painel de artefatos (exclusão, datas, miniaturas) e fix no clique de autocomplete | ✅ Concluído | Adicionado lazy-loading de thumbnails de imagens, exibição de datas dos arquivos, exclusão com confirmação em duas etapas e correção de clique no autocomplete dropdown. |
| 2026-05-28 | feat(wos): adiciona execucao agy, seletor de agentes e mencoes no chat | ✅ Concluído | Execução direta agy, watcher profundo, seletor de revisores ativos no PR, menções globais e autocomplete no chat com agentes do Agent Studio. |
| 2026-05-28 | chore(bitbucket): adiciona template de pull request | ✅ Concluído | Adicionada pasta .bitbucket com pull_request_template.md para padronização de Pull Requests. |
| 2026-05-29 | feat(pipeline): integra Idea Pipeline ao Spec-Driven e divide etapas Negócio vs Tech | ✅ Concluído | Conecta a saída do Discovery à esteira Spec, salva pendências técnicas no MongoDB Atlas e permite ao time Tech assumir na aba Backlog. |
| 2026-05-29 | feat(analytics): tela de consumo de IA e telemetria de custos | ✅ Concluído | Criada a visualização de tokens e custos em USD/BRL por modelo/tarefa com histórico de execuções, integrada ao Whisper e DALL-E. |
| 2026-05-29 | fix(renderer): resolve vazamento de memória de listeners IPC | ✅ Concluído | Refatorado useIPCListeners com useRef para evitar recriação e acúmulo de listeners do ipcRenderer. |
| 2026-05-29 | feat(analytics): rotulagem de custos de IA em todo o ecossistema | ✅ Concluído | Adicionada identificação de tarefas (taskName) nas chamadas de IA do Spec Wizard, Pipeline Wizard, PR Analyzer e Git Diff Analysis para exibição detalhada de custos no painel de consumo. |
| 2026-05-29 | feat(analytics): relatórios executivos em PDF específicos para consumo de IA | ✅ Concluído | Implementado gerador de relatórios executivos em PDF dedicado para a aba de consumo de IA, exibindo métricas, análise e recomendações de governança de IA. |
| 2026-05-30 | feat(mcp): corrige tipos de retorno e aprimora persistência | ✅ Concluído | Corrigido erro de Missing return type no MCPManager, migrada a persistência para o MongoDB Atlas, presets dinâmicos de MCPs e corrigida a pesquisa no Plugins Marketplace. |
| 2026-05-31 | feat(voice): logs, medidor de volume, bypass de voz, toggle nas configurações e refino de layout | ✅ Concluído | Unificado loop VAD, adicionada barra de volume via refs, autodetecção de MimeType no recorder, auto-run de comandos, toggle switch nas Configurações Gerais e layout desapertado com indicador de contexto à direita. |
| 2026-05-31 | fix(voice): corrige integracao do canal ipc chat:speak no preload e trata buffer do tts de forma modular | ✅ Concluído | Expõe método no preload, cria reprodutor ttsPlayer modular para decodificar Buffers vindos do Electron e substitui lógica inline no useAIChat. |
| 2026-05-31 | feat(voice): migra escuta passiva hands-free para webkitSpeechRecognition gratuito | ✅ Concluído | Altera motor em background para SpeechRecognition nativo do Chromium para zerar consumo de tokens OpenAI, mantendo medidor VAD visual. |
| 2026-06-01 | fix(auth): resolve ValidationError e adiciona validacao defensiva | ✅ Concluído | Mescla email persistido do localStorage no initAuth e valida payloads vazios no handler auth:setUser do main process. |
| 2026-06-01 | style(ui): remove a borda verde do logo na tela de login | ✅ Concluído | Remove a propriedade border e cor verde ao redor da imagem na tela de login. |
| 2026-06-01 | feat(auth): controle master soberano e telemetria de consumo segregada por usuario | ✅ Concluído | Configura o ID 69fbc369036a60001cddd998 como master com acesso total, exibe o painel de consumo agregando custos de todos os usuários com dropdown de filtragem, e restringe acesso de novos usuários até liberação. |
| 2026-06-02 | feat(wos): adiciona modo planejamento e botao de build do planejado | ✅ Concluído | Adicionado toggle de planejamento (bússola) com micro-animação, injeção de prompt para planejamento em artifacts/*.md, e banner glassmorphism com botão de build para executar o planejamento aprovado via chat com bypass. |
| 2026-06-02 | feat(trello): suporte a checklists customizadas com idBoard, idChecklistSource e dsc | ✅ Concluído | Atualizado método createTrelloCardChecklist para o endpoint nativo POST /1/checklists no trelloWriteHandler, repassados os novos parâmetros via IPC e adicionados na definição e executor de ferramentas da IA. |
| 2026-06-02 | fix(manager): trata AbortError de forma silenciosa e propaga interrupção | ✅ Concluído | Modificado o ModelManager para interceptar e relançar exceções de AbortError de forma silenciosa nos fluxos em stream e síncrono, evitando logs poluídos e garantindo o tratamento correto do abortamento da IA pelo usuário. |

