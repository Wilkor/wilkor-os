import { TrelloCard } from '../DashboardUtils';
import { saveDocsToWorkspace } from './AgentOrchestrator';

export async function syncTasksToTrello(
  boardId: string,
  listId: string,
  discoveryCard: TrelloCard,
  tasksData: any,
  onProgress?: (progress: number, message: string) => void,
  taskType?: 'feat' | 'fix' | 'outros'
): Promise<{ success: boolean; createdCardsCount: number; error?: string }> {
  try {
    const api = (window as any).api.pipeline;
    const fases = tasksData.fases || [];

    // 1. Encontrar o ID do campo customizado estimativa_horas
    let customFieldId = '';
    try {
      const cfRes = await api.getTrelloBoardCustomFields(boardId);
      if (cfRes.success && cfRes.customFields) {
        const field = cfRes.customFields.find(
          (f: any) =>
            f.name.toLowerCase().includes('estimativa') ||
            f.name.toLowerCase().includes('horas') ||
            f.name.toLowerCase().includes('estimativa_horas')
        );
        if (field) customFieldId = field.id;
      }
    } catch (cfErr) {
      console.warn('Erro ao ler Custom Fields do Trello:', cfErr);
    }

    // 2. Criar os cards e mapear Título -> ID
    const cardMap: Record<string, string> = {};
    const taskList: { task: any; faseNome: string; cardId?: string }[] = [];

    for (const fase of fases) {
      for (const task of fase.tarefas) {
        taskList.push({ task, faseNome: fase.nome });
      }
    }

    const totalSteps = taskList.length * 2;
    let currentStep = 0;

    const prefix = taskType === 'fix' ? '[FIX] ' : taskType === 'outros' ? '[OUTROS] ' : '[FEAT] ';

    // Criar todos os cards
    for (let i = 0; i < taskList.length; i++) {
      const item = taskList[i];
      const task = item.task;
      const cardName = `${prefix}${item.faseNome} — ${task.titulo}`;
      const cardDesc = `${task.descricao}\n\n✅ Pronto quando: ${task.criterio_de_conclusao}`;

      if (onProgress) {
        onProgress(Math.round((currentStep / totalSteps) * 100), `Criando card: ${task.titulo}...`);
      }

      const createRes = await api.createTrelloCard({
        name: cardName,
        desc: cardDesc,
        idList: listId,
        pos: 'bottom'
      });

      if (createRes.success && createRes.data) {
        const newCardId = createRes.data.id;
        item.cardId = newCardId;
        cardMap[task.titulo] = newCardId;
      } else {
        throw new Error(`Erro ao criar card ${task.titulo}: ${createRes.error}`);
      }
      currentStep++;
    }

    // Adicionar anexo, checklists e custom fields
    for (let i = 0; i < taskList.length; i++) {
      const item = taskList[i];
      const task = item.task;
      const cardId = item.cardId;
      if (!cardId) continue;

      if (onProgress) {
        onProgress(Math.round((currentStep / totalSteps) * 100), `Configurando card: ${task.titulo}...`);
      }

      // Linkar ao card de Discovery pai
      try {
        await api.addTrelloCardAttachment(cardId, discoveryCard.shortUrl || discoveryCard.url);
      } catch (attErr) {
        console.warn(`Erro ao adicionar anexo ao card ${task.titulo}:`, attErr);
      }

      // Atualizar estimativa_horas se encontrou o custom field
      if (customFieldId && task.estimativa_horas) {
        try {
          await api.updateTrelloCardCustomFieldItem(cardId, customFieldId, {
            number: String(task.estimativa_horas)
          });
        } catch (cfErr) {
          console.warn(`Erro ao definir custom field para ${task.titulo}:`, cfErr);
        }
      }

      // Adicionar checklist de dependências se houver
      const deps = task.dependencias || [];
      if (deps.length > 0) {
        try {
          const checklistRes = await api.createTrelloCardChecklist(cardId, 'Dependências');
          if (checklistRes.success && checklistRes.data) {
            const checklistId = checklistRes.data.id;
            for (const depName of deps) {
              const depCardId = cardMap[depName];
              const nameToShow = depCardId ? `${depName} (Criado)` : depName;
              await api.createTrelloChecklistItem(checklistId, nameToShow);
            }
          }
        } catch (chkErr) {
          console.warn(`Erro ao criar checklist de dependências para ${task.titulo}:`, chkErr);
        }
      }
      currentStep++;
    }

    if (onProgress) {
      onProgress(100, 'Sincronização com o Trello concluída!');
    }

    return { success: true, createdCardsCount: taskList.length };
  } catch (err: any) {
    return { success: false, createdCardsCount: 0, error: err.message };
  }
}

export async function executeFullPipelineSync(
  card: TrelloCard,
  requirements: string,
  design: string,
  tasksJson: string,
  taskType: 'feat' | 'fix' | 'outros',
  targetRepoPath: string,
  customFolderName: string,
  onProgress: (progress: number, msg: string) => void
): Promise<{ success: boolean; createdCardsCount?: number; error?: string }> {
  try {
    // 1. Gravar localmente no workspace
    onProgress(5, 'Salvando arquivos localmente no workspace...');
    const wsRes = await saveDocsToWorkspace(targetRepoPath, requirements, design, tasksJson, customFolderName);
    if (!wsRes.success) {
      console.warn('Erro ao salvar no workspace:', wsRes.error);
    }

    // 2. Gravar localmente nos artefatos do wOs
    onProgress(15, 'Salvando documentos nos artefatos do wOs...');
    try {
      const sanitizedCardName = card.name.replace(/[^a-z0-9_-]/gi, '_');
      await (window as any).api.workspace.saveArtifact(`${sanitizedCardName}_requirements.md`, requirements);
      await (window as any).api.workspace.saveArtifact(`${sanitizedCardName}_design.md`, design);
      
      let formattedTasks = '';
      try {
        const parsed = JSON.parse(tasksJson);
        formattedTasks = JSON.stringify(parsed, null, 2);
      } catch (_) {
        formattedTasks = tasksJson;
      }
      await (window as any).api.workspace.saveArtifact(`${sanitizedCardName}_tasks.json`, formattedTasks);
    } catch (artErr: any) {
      console.warn('Erro ao salvar nos artefatos do wOs:', artErr);
    }

    // 3. Buscar informações do card do Trello
    onProgress(25, 'Buscando informações do board do Trello...');
    const cardDetails = await (window as any).api.pipeline.getTrelloCardDetails(card.id);
    if (!cardDetails.success || !cardDetails.card) {
      throw new Error('Não foi possível ler as informações de lista/board do Trello.');
    }
    
    const listId = cardDetails.card.idList;
    const boardId = cardDetails.card.idBoard || card.url.split('/b/')[1]?.split('/')[0] || '';
    
    console.log('[TrelloSync] cardDetails boardId:', cardDetails.card.idBoard);
    console.log('[TrelloSync] fallback boardId:', boardId);

    // 4. Buscar ID da lista Backlog do Board
    onProgress(30, 'Buscando lista Backlog no board...');
    let targetListId = listId;
    try {
      const listsRes = await (window as any).api.pipeline.getTrelloLists(boardId);
      const listsArray = listsRes && Array.isArray(listsRes.lists) ? listsRes.lists : (Array.isArray(listsRes) ? listsRes : null);
      
      console.log('[TrelloSync] Encontrou listas:', listsArray?.length);
      
      if (listsArray) {
        const backlogList = listsArray.find(
          (l: any) => l.name && l.name.toLowerCase().replace(/\s/g, '').includes('backlog')
        );
        if (backlogList) {
          targetListId = backlogList.id;
          console.log('[TrelloSync] Lista Backlog encontrada! ID:', targetListId);
        } else {
          console.warn('[TrelloSync] Lista Backlog NÃO encontrada no board.');
        }
      }
    } catch (err) {
      console.warn('Erro ao listar colunas do board:', err);
    }

    // 5. Parse das tarefas
    let parsedTasks: any = {};
    try {
      parsedTasks = JSON.parse(tasksJson);
    } catch (_) {
      const cleanJson = tasksJson.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedTasks = JSON.parse(cleanJson);
    }

    // 6. Sincronizar cards no Trello
    const syncRes = await syncTasksToTrello(
      boardId,
      targetListId,
      card,
      parsedTasks,
      (progress, msg) => {
        onProgress(30 + Math.round(progress * 0.7), msg);
      },
      taskType
    );

    return syncRes;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
