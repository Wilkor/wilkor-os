export const TRELLO_TOOLS = [
  {
    name: 'getTrelloBoards',
    description: 'Busca a lista de quadros (Boards) do Trello associados à conta do usuário configurada no wOs.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getTrelloLists',
    description: 'Busca as listas/colunas (ex: Backlog, Em Desenvolvimento, Concluído) de um Board específico do Trello. IMPORTANTE: Ao identificar listas pelo nome, use matching flexível por keywords (case-insensitive): Discovery=["discovery"], Backlog=["backlog"], Despriorizado=["despriorizado"], Prioritized=["prioritized"], To Do=["to do", "a fazer"], Doing=["doing", "fazendo", "in progress", "desenvolvimento"], Done=["done", "concluído", "finalizado", "entregue", "ready for prod", "concluido", "pronto"], Bugs=["bug", "erro", "bugs"].',
    parameters: {
      type: 'object',
      properties: {
        boardId: { type: 'string', description: 'ID do Board do Trello (ex: "60c7f...").' }
      },
      required: ['boardId']
    }
  },
  {
    name: 'getTrelloCards',
    description: 'Busca a lista completa de cards contidos em uma lista/coluna do Trello. O retorno inclui o criador de cada card no campo actions[0].memberCreator (que possui fullName e username).',
    parameters: {
      type: 'object',
      properties: {
        listId: { type: 'string', description: 'ID da lista/coluna do Trello.' }
      },
      required: ['listId']
    }
  },
  {
    name: 'getTrelloCardDetails',
    description: 'Busca informações completas de um card do Trello, incluindo descrição rica, etiquetas (labels), checklists, membros e o criador do card no campo actions[0].memberCreator (que possui fullName e username).',
    parameters: {
      type: 'object',
      properties: {
        cardId: { type: 'string', description: 'ID do card do Trello.' }
      },
      required: ['cardId']
    }
  },
  {
    name: 'updateTrelloCard',
    description: 'Atualiza propriedades de um card do Trello (como mover para outra coluna/lista, alterar título ou descrição).',
    parameters: {
      type: 'object',
      properties: {
        cardId: { type: 'string', description: 'ID do card do Trello.' },
        idList: { type: 'string', description: 'ID da nova lista/coluna para a qual mover o card (opcional).' },
        name: { type: 'string', description: 'Novo título do card (opcional).' },
        desc: { type: 'string', description: 'Nova descrição do card (opcional).' },
        closed: { type: 'boolean', description: 'Define se o card deve ser arquivado/fechado (opcional).' }
      },
      required: ['cardId']
    }
  },
  {
    name: 'addTrelloCardComment',
    description: 'Adiciona um novo comentário textual em um card do Trello (útil para registrar status de revisão ou links de artefatos).',
    parameters: {
      type: 'object',
      properties: {
        cardId: { type: 'string', description: 'ID do card do Trello.' },
        text: { type: 'string', description: 'Texto do comentário a ser postado.' }
      },
      required: ['cardId', 'text']
    }
  },
  {
    name: 'manageTrelloChecklist',
    description: 'Gerencia as checklists de um card do Trello: cria checklists, adiciona itens de tarefas ou altera o estado de conclusão (marca/desmarca check) de itens individuais.',
    parameters: {
      type: 'object',
      properties: {
        cardId: { type: 'string', description: 'ID do card do Trello.' },
        action: { 
          type: 'string', 
          enum: ['create', 'add_item', 'check_item'], 
          description: 'Ação a realizar: "create" (criar nova checklist), "add_item" (adicionar tarefa à checklist) ou "check_item" (marcar item como completo ou incompleto).' 
        },
        name: { type: 'string', description: 'Nome da checklist (para action="create") ou título da tarefa (para action="add_item"). Opcional.' },
        checklistId: { type: 'string', description: 'ID da checklist onde a tarefa será adicionada (para action="add_item"). Opcional.' },
        checkItemId: { type: 'string', description: 'ID do item de checklist a ser alterado (para action="check_item"). Opcional.' },
        state: { 
          type: 'string', 
          enum: ['complete', 'incomplete'], 
          description: 'Novo estado do item da tarefa: "complete" (com check) ou "incomplete" (sem check) (para action="check_item"). Opcional.' 
        },
        idBoard: { type: 'string', description: 'ID do Board do Trello (opcional para action="create").' },
        idChecklistSource: { type: 'string', description: 'ID de uma checklist existente para copiar (opcional para action="create").' },
        dsc: { type: 'string', description: 'Assinatura ou hash de dados adicionais de checklist (opcional para action="create").' }
      },
      required: ['cardId', 'action']
    }
  }
];
