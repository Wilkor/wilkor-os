# 📝 Auto-Docs - Histórico de Evolução do wOs

Este documento registra de forma incremental todas as features e melhorias implementadas no wOs.

## 🚀 Histórico de Funcionalidades e Melhorias

### 📦 1. Persistência MCP & Marketplace
- **MongoDB Atlas**: Lógica migrada do `electron-store` local para banco de dados dinâmico e centralizado.
- **Marketplace & Presets**: Adicionados presets de plugins que persistem na vitrine mesmo se inativos.
- **Busca e Tipagens**: Consertada a filtragem em tempo real na vitrine e corrigidas tipagens do `MCPManager`.

### 📄 2. Geração e Preview de Documentos
- **Ferramenta `generateDocument`**: Cria arquivos PDF, Excel, Word, Markdown e HTML no diretório local `artifacts/`.
- **Previsão Rica**: Componente `DocumentPreview.tsx` renderiza de forma premium tabelas, textos e dados de mídia no chat.
- **Preview de Links**: Customizado protocolo `wos-document://` para renderizar o preview na tela da conversa.

### ⚙️ 3. Portabilidade & Configurações Gerais
- **Fim de Hardcodes**: Credenciais de API (MongoDB, Discord, Trello) e caminhos de sistema removidos do código fonte.
- **Modal de Ajustes**: Expandido tamanho da tela de ajustes gerais para exibição confortável das chaves sensíveis.
- **Discord e Trello**: Modularizados e adaptados para ler configurações e membros de forma dinâmica no backend.

### 🎙️ 4. Interação por Voz & Hands-Free
- **Modo J.A.R.V.I.S (TTS)**: Síntese de fala utilizando a API da OpenAI com conversão ágil de buffer.
- **Escuta Hands-Free**: Reconhecimento local de wake words ("wOs") via Web Speech API de forma 100% gratuita.
- **Bypass de Ações (Auto-Run)**: Comandos de voz ignoram a aprovação de tela do terminal para fluidez.
- **Medidor VAD**: Retorno visual de amplitude em tempo real na caixa de entrada do chat.

### 🔌 5. CRUD de MCPs, Instalador de Skills & Integração Trello
- **Hot-Reload e Remoção**: Implementada atualização em tempo real de servidores e presets customizados do MongoDB.
- **Prefixação de Ferramentas**: Evita colisões de nomes idênticos concatenando o nome do servidor (`[mcp]__[tool]`).
- **Instalação de Skills**: Permite à IA criar instruções markdown e instalar dependências do npm/npx dinamicamente.
- **Consultas ao Trello no Chat & Esteira de Processamento**: Importada e mapeada a constante `TRELLO_TOOLS` em [tools.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/main/models/tools.ts) e integrada a sua execução em [toolExecutor.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/main/models/toolExecutor.ts) direcionando para `executeTrelloTool`. Adicionado o parâmetro `limit=1000` e `actions=createCard` no [trelloReadHandler.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/main/utils/trelloReadHandler.ts) e aprimorado o [promptBuilder.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/main/models/promptBuilder.ts) para orientar a IA a processar coleções de dados (como cards) em esteira contínua por lote (batch processing) usando chamadas paralelas simultâneas, processando sequencialmente todos os cartões sem paradas ou interrupções.

### 🔍 6. Pesquisa na Internet
- **Provedores de Busca**: Suporte integrado a Tavily, Brave, Google Search e fallback scraper no DuckDuckGo.
- **Configurações**: Chaves de busca expostas e editáveis na aba de configurações de serviços.

### 🔀 7. Multi-Agentes & Git Worktree
- **Isolamento de Branches**: Cria worktrees temporários sob `.wos-worktrees/` para cada tarefa de agente paralela.
- **Push e Limpeza**: Commita alterações usando convenções Git, faz push para o remoto e deleta o worktree no sucesso.
- **Orquestrador de Tarefas**: `agentWorkflowEngine.ts` gerencia o concorrência de execução de múltiplos subagentes.
- **Interface de Logs**: `WorkflowStatusView.tsx` renderiza console com logs do terminal e progresso ao vivo.
- **Studio em Abas**: Aba de debates do Agent Studio suporta múltiplas conversas com luz pulsante indicando processos ativos.

## 📄 8. Abertura de Mídia e PDFs no Centro do wOs

Esta funcionalidade adiciona a capacidade de abrir relatórios em PDF, imagens e outros documentos gerados diretamente no painel central do wOs (CenterPanel/EditorStage) ao clicar neles na barra lateral esquerda (Artefatos Gerados).

### Lógica e Comunicação
- **Identificação Binária**: O hook [useWorkspace.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/renderer/src/hooks/useWorkspace.ts) intercepta extensões de mídia e documentos (.pdf, .png, .jpg, .jpeg, .gif, .webp, .xlsx, .xls, .docx, .doc) em `handleOpenFile` e insere a aba diretamente com conteúdo vazio, contornando a leitura textual para não corromper o arquivo.
- **Propagação do Evento**: O painel lateral [ArtifactsPanel.tsx](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/renderer/src/components/ArtifactsPanel.tsx) expõe a propriedade `onOpenFile`. O clique no card do artefato evoca essa callback.
- **Ações Isoladas**: Adicionada a interrupção de propagação (`e.stopPropagation()`) em cliques de exclusão, anexo e abertura externa de artefatos para evitar comportamentos duplicados.
- **Repasse das Props**: O contêiner intermediário [ExplorerPanel.tsx](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/renderer/src/components/layout/ExplorerPanel.tsx) conecta e repassa a propriedade global `handleOpenFile` para o `ArtifactsPanel`.

### Renderização Premium Centralizada
- **Visualizador Integrado**: O componente [EditorStage.tsx](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/renderer/src/components/EditorStage.tsx) foi adaptado para avaliar a extensão da aba selecionada.
- **Preview de Dados**: Em vez de carregar o editor CodeMirror para binários, ele renderiza o componente [DocumentPreview.tsx](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/renderer/src/components/chat/DocumentPreview.tsx). O PDF, imagem, planilha Excel ou documento Word é aberto e formatado de forma rica e com rolagem diretamente no centro da tela do workspace ativo do wOs.

## 🎨 9. Identidade Visual Premium em Pixel Art (wOs Logo)

Esta funcionalidade introduz o logotipo pixelado oficial do wOs na tela central, respeitando fielmente a caixa de letras e a paleta de cores original.

### Detalhes Técnicos e Interface
- **Componente Dedicado**: Criado o componente [WosPixelLogo.tsx](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/renderer/src/components/WosPixelLogo.tsx), responsável por renderizar em pixel art tridimensional as letras **w** (minúsculo), **O** (maiúsculo) e **s** (minúsculo) alinhadas pela base.
- **Fidelidade de Cores**:
  - **w**: Ciano/Verde piscina neon e constante.
  - **O**: Degradê do azul piscina (topo) para azul escuro/royal (base).
  - **s**: Lilás/Roxo violeta neon.
- **Estética & Efeitos**: Cada pixel de 10x10px possui cantos levemente arredondados e reage individualmente no hover (escala de 1.35x, iluminação intensa de cor e glow com sombra).
- **Animações de Entrada**: Integrado com Framer Motion para gerar um efeito cascata em onda no surgimento das letras ao carregar a tela.


## 🗂️ 10. Correção do Histórico de Conversas

Esta correção resolve o problema onde o painel de histórico exibia apenas uma interação e os títulos dos chats apareciam como "Aja de forma proativa..." (prompt invisível do sistema).

### Causa Raiz Identificada
- **Poluição de Títulos**: O banco MongoDB gerava o título da conversa a partir da primeira mensagem salva, que era o prompt invisível de boas-vindas do sistema. Isso criava centenas de registros com títulos idênticos e inúteis.
- **Conversas Duplicadas**: Toda vez que o wOs era reiniciado, um novo `activeConversationId` aleatório era criado, impedindo a restauração automática do contexto anterior.

### Alterações Realizadas

#### Backend — [database.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/main/utils/database.ts)
- Criação de conversas: a função `saveMessage` agora ignora mensagens com `isInvisible: true` ao definir o título da conversa, prevenindo que o prompt de boas-vindas do sistema vire o nome do chat.
- Atualização dinâmica de título: se a conversa já existe com um título genérico (`"Nova Conversa"` ou `"Aja de forma proativa..."`), o título é **atualizado automaticamente** com a primeira mensagem visível do usuário.

#### Frontend — [useAIChat.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/renderer/src/hooks/useAIChat.ts)
- Adicionado um `useEffect` de inicialização que consulta o banco via `listConversations` para **restaurar a conversa mais recente** ao abrir o wOs, em vez de criar sempre um chat novo e vazio.
- Adicionado `isInitializing` (estado React) e `preventNextLoadRef` (ref) para evitar condição de corrida entre a restauração de sessão e o disparo do prompt de boas-vindas invisível.
- O prompt de boas-vindas só é disparado quando não há **nenhuma** conversa prévia no banco.

## 👥 11. Multi-Tenant por Usuário & Painel Administrativo

Esta funcionalidade adiciona isolamento de dados no MongoDB Atlas por ID do usuário logado e cria um controle de acesso flexível nas abas da sidebar e recursos, gerenciado pelo usuário master.

### Isolamento de Dados (Multi-Tenant)
- **Cabeçalhos HTTP**: O arquivo [api.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/renderer/src/api/api.ts) injeta `x-user-id` e `x-user-email` em todas as chamadas para que o BFF/Gateway consiga registrar métricas completas de uso por pessoa (tempo, tokens, etc.).
- **Backend Sync**: Ao logar, a sessão do usuário ativo é sincronizada com o backend Electron (main process).
- **Separação no MongoDB**: As consultas e inserções em `Conversas`, `Uso de IA`, `MCPs`, `Cron Jobs` e `Tarefas Pendentes` foram modificadas para anexar e filtrar obrigatoriamente pela propriedade `userId` do usuário ativo.
- **Estruturação Modular**: A lógica de banco de dados foi modularizada para manter os arquivos sob o limite de 300 linhas, separando `userPermissionDatabase.ts`, `cronJobDatabase.ts` e `aiUsageDatabase.ts`.

### Painel de Controle de Acesso (Admin)
- **Bloqueio de Acesso Pendente**: Caso o usuário logado ainda não tenha aprovação concedida, o wOs bloqueia as rotas e exibe uma tela elegante informando o status pendente.
- **Sidebar Dinâmica**: A Sidebar renderiza apenas as abas de funcionalidades (`explorer`, `git`, `mcp`, `artifacts`, `pipeline`, `dashboard`, `agent_studio`, `chat`) que foram explicitamente autorizadas para o usuário logado.
- **Painel Administrativo Premium**: O usuário master (`wilkor.almeida@gmail.com`) tem acesso a um atalho de escudo na sidebar que abre o componente [AdminPanel.tsx](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/renderer/src/components/AdminPanel.tsx). Nele, o master pode visualizar todos os usuários cadastrados e alterar interativamente seu status de aprovação e suas abas visíveis no wOs.

- **Correção de ValidationError no syncUserPermissions**: Ajustada a rotina de inicialização de autenticação (`initAuth` no `AuthContext.tsx`) para mesclar os dados persistidos do localStorage (id, email) com o retorno do endpoint de validação de token do BFF. Isso previne que propriedades do usuário fiquem `undefined` caso o BFF não as retorne, e no backend (`authHandler.ts`), inserimos uma validação defensiva para rejeitar requisições de sincronização de permissões com payloads incompletos, evitando falhas do Mongoose.

- **Remoção da Borda do Logo**: Removida a borda verde decorativa (`border-2 border-[#00A884]/50`) da tag img do logo na tela de login ([Login.tsx](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/renderer/src/components/Login.tsx)) para obter um visual mais limpo e sem o contorno verde.

- **Acesso Master e Telemetria de Consumo Segregado**: O ID `69fbc369036a60001cddd998` é tratado como o usuário master absoluto. Estendemos a telemetria de custos e consumo de IA no MongoDB Atlas (`ai_usage`) para gravar `userId` e `userEmail` em cada chamada. Se o usuário ativo for o master, o sistema desvia o filtro de tenant nas buscas de relatórios, permitindo que ele veja o histórico e o acumulado de todos os colaboradores do sistema. No frontend, adicionamos filtros dinâmicos por usuário (select dropdown), ranking visual "Custo por Usuário" e uma coluna de identificação de usuário no histórico (exibidos exclusivamente para o master). Também foi implementado o fallback automático de e-mail e ID para o master no `initAuth` e no processamento do main process, evitando falhas de sessão caso o e-mail não venha da API.

### 👥 12. Resolução Dinâmica no Discord e Estilização Premium de Tarefas
- **Resolução de Usuários/Canais**: Ajustada a ordem de execução do envio de mensagens do Discord (`sendDiscordMessage`) no backend (`discordHandler.ts`) para realizar a busca e sincronização dinâmica de membros do servidor na API do Discord *antes* de tentar validar e mapear o identificador de destino (`channelId`). Isso possibilita que apelidos como `"wilkor"` ou `"lucas"` sejam corretamente resolvidos para seus respectivos IDs numéricos, mesmo que ausentes do fallback estático local.
- **Visualização de Tarefas no Chat**: O componente de renderização markdown (`Markdown.tsx`) foi otimizado para detectar e estilizar de forma premium e elegante os itens de tarefas nos estados Pendente (`- [ ]`), Em Progresso (`- [/]`) e Concluído (`- [x]`). As tarefas são exibidas com fundos coloridos, bordas suaves, badges estilizados e ícones de animação ativa (incluindo spinners com micro-animação para tarefas em progresso), oferecendo uma experiência visual limpa e fluida no chat.
- **Padronização e Centralização de Artefatos**: Atualizadas as diretrizes no `promptBuilder.ts` para instruir rigorosamente os agentes da IA a salvar todos os relatórios, atas e documentos (incluindo em formato Markdown e texto) exclusivamente no diretório de artefatos local do wOs (`artifacts/`), em vez de caminhos de BitBucket externos ou da raiz de outros projetos. Isso garante a exibição e indexação unificada desses arquivos no painel visual de "Artefatos Gerados".

### 📈 13. Ajuste de Truncamento no Trello e Regras de User Story
- **Aumento do Limite de Resposta das Ferramentas**: Modificada a constante e o parâmetro padrão da função `truncateToolResult` no arquivo [managerUtils.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/main/models/managerUtils.ts) de 6.000 para 120.000 caracteres. Isso resolve o problema de truncamento precoce do JSON de retorno das listas do Trello e do histórico do Git, que impedia o agente de visualizar todos os cartões de uma coluna (como o retorno parcial de 2 em vez de 4 cards no board 'Tech').
- **Regras Rigorosas para User Stories**: Ajustado o comportamento e as orientações no arquivo [promptBuilder.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/main/models/promptBuilder.ts) detalhando as diretrizes de auditoria de User Stories (Persona, Ação, Valor e critérios de aceitação). Se os cards não estiverem no padrão, o agente é instruído a mencionar o criador obrigatoriamente no comentário com `@username` no Trello para notificação.

### 🧭 14. Modo Planejamento e Build do Planejado
- **Modo Planejamento**: Adicionado botão de toggle premium (bússola) no header do painel de chat (`ChatPanel.tsx`), com animação de rotação lenta quando ativado, persistido no `localStorage`.
- **System Prompt Inteligente**: Quando ativo, o hook `useAIChat.ts` injeta diretrizes estritas no prompt de sistema para forçar o agente a criar apenas o planejamento detalhado em formato Markdown dentro de `artifacts/planning_*.md` via tag `write_file`.
- **Banner Glassmorphism & Aprovação**: Criado um banner animado com gradiente e vidro em `ChatPanel.tsx` que detecta o plano pendente nos artefatos locais. O botão **"🔨 Build do Planejado"** executa a gravação do plano nos artefatos locais e inicia automaticamente a execução real das ações no chat usando uma flag de bypass.
### 📋 15. Criação de Checklists Customizadas no Trello
- **Novo Endpoint**: Migrada a criação de checklists no arquivo `trelloWriteHandler.ts` do endpoint de cartão para a rota nativa geral de checklists `POST https://api.trello.com/1/checklists`, permitindo passar opções extras flexíveis.
- **Opções Opcionais**: Adicionado suporte para os campos `idBoard`, `idChecklistSource` e `dsc` no método `createTrelloCardChecklist` e no handler de IPC correspondente.
- **Definição de Parâmetros**: Atualizada a ferramenta `manageTrelloChecklist` no arquivo `trelloTools.ts` e em `trelloToolExecutor.ts` para receber essas novas propriedades a partir dos argumentos sugeridos pela IA.

### 🛑 16. Tratamento de AbortError de IA Silencioso e Propagação de Cancelamento
- **Fluxos Stream e Síncrono**: Ajustados os blocos `catch` de tratamento de erros das ferramentas nos métodos `handleStreamingChat` e `handleSyncChat` no [manager.ts](file:///c:/Users/Wilkor/Documents/BitBucket/wilkorOs/src/main/models/manager.ts).
- **Detecção e Propagação de Aborto**: Adicionada a detecção defensiva de `AbortError` (comparando `e.name`, `signal.aborted` e termos no construtor/mensagem). Caso um cancelamento seja detectado, a exceção é relançada para ser capturada pelo fluxo superior `handleChat` (exibindo a mensagem limpa e silenciosa "Geração interrompida." no front), em vez de exibir logs de erro assustadores no console.


### 🔒 17. Remoção de Credenciais Sensíveis & Proteção Git
- **Remoção de Secrets Hardcoded**: Eliminadas credenciais padrão de MongoDB Atlas, Discord Bot Token, Trello API Key e Token de `src/main/index.ts`, `src/main/utils/database.ts` e `trello-automation/list_lists.cjs`.
- **Validação Defensiva de Conexão**: `connectDB()` atualizado para validar a presença da URI antes de tentar a conexão e permitir fallback via `process.env.MONGODB_URI`.
- **Proteção no `.gitignore`**: Adicionadas entradas `.env`, `.env.*` e `!.env.example` para prevenir commits acidentais de arquivos de ambiente.
- **Higienização do Commit Inicial**: Commit local reescrito para conformidade total com o GitHub Push Protection.

---
*Documento atualizado automaticamente pelo wOs Agent.*
