import { 
  getTrelloBoards, 
  getTrelloLists, 
  getTrelloCards, 
  getTrelloCardDetails, 
  updateTrelloCard, 
  addTrelloCardComment,
  createTrelloCardChecklist,
  createTrelloChecklistItem,
  updateTrelloChecklistItem
} from '../utils/trelloHandler';

/**
 * Executa as ferramentas específicas do Trello de forma modular para a IA.
 */
export async function executeTrelloTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case 'getTrelloBoards': {
        const result = await getTrelloBoards();
        if (result.success && result.boards) {
          return JSON.stringify(result.boards, null, 2);
        }
        return `Erro ao buscar Boards: ${result.error}`;
      }

      case 'getTrelloLists': {
        if (!args.boardId) return 'Erro: getTrelloLists requer "boardId".';
        const result = await getTrelloLists(args.boardId);
        if (result.success && result.lists) {
          return JSON.stringify(result.lists, null, 2);
        }
        return `Erro ao buscar listas do Trello: ${result.error}`;
      }

      case 'getTrelloCards': {
        if (!args.listId) return 'Erro: getTrelloCards requer "listId".';
        const result = await getTrelloCards(args.listId);
        if (result.success && result.cards) {
          return JSON.stringify(result.cards, null, 2);
        }
        return `Erro ao buscar cards do Trello: ${result.error}`;
      }

      case 'getTrelloCardDetails': {
        if (!args.cardId) return 'Erro: getTrelloCardDetails requer "cardId".';
        const result = await getTrelloCardDetails(args.cardId);
        if (result.success && result.card) {
          return JSON.stringify(result.card, null, 2);
        }
        return `Erro ao buscar detalhes do card: ${result.error}`;
      }

      case 'updateTrelloCard': {
        if (!args.cardId) return 'Erro: updateTrelloCard requer "cardId".';
        const { cardId, ...updateOptions } = args;
        const result = await updateTrelloCard(cardId, updateOptions);
        if (result.success) {
          return `Card do Trello [${cardId}] atualizado com sucesso. 🚀`;
        }
        return `Erro ao atualizar card no Trello: ${result.error}`;
      }

      case 'addTrelloCardComment': {
        if (!args.cardId || !args.text) return 'Erro: addTrelloCardComment requer "cardId" e "text".';
        const result = await addTrelloCardComment(args.cardId, args.text);
        if (result.success) {
          return `Comentário postado com sucesso no card do Trello. 💬`;
        }
        return `Erro ao postar comentário no card: ${result.error}`;
      }

      case 'manageTrelloChecklist': {
        if (!args.cardId || !args.action) return 'Erro: manageTrelloChecklist requer "cardId" e "action".';
        
        switch (args.action) {
          case 'create': {
            if (!args.name) return 'Erro: action "create" requer "name" para a checklist.';
            const res = await createTrelloCardChecklist(args.cardId, args.name, {
              idBoard: args.idBoard,
              idChecklistSource: args.idChecklistSource,
              dsc: args.dsc
            });
            return res.success ? `Checklist "${args.name}" criada com sucesso.` : `Erro ao criar checklist: ${res.error}`;
          }
          case 'add_item': {
            if (!args.checklistId || !args.name) return 'Erro: action "add_item" requer "checklistId" e "name" da tarefa.';
            const res = await createTrelloChecklistItem(args.checklistId, args.name);
            return res.success ? `Tarefa "${args.name}" adicionada à checklist.` : `Erro ao adicionar tarefa: ${res.error}`;
          }
          case 'check_item': {
            if (!args.checkItemId || !args.state) return 'Erro: action "check_item" requer "checkItemId" e "state" (complete/incomplete).';
            const res = await updateTrelloChecklistItem(args.cardId, args.checkItemId, args.state);
            return res.success ? `Estado da tarefa atualizado para "${args.state}". 🎯` : `Erro ao atualizar tarefa: ${res.error}`;
          }
          default:
            return `Erro: action "${args.action}" não reconhecida em manageTrelloChecklist.`;
        }
      }

      default:
        return `Erro: Ferramenta do Trello "${name}" não reconhecida.`;
    }
  } catch (err: any) {
    return `Erro de exceção ao executar ferramenta do Trello: ${err.message}`;
  }
}
