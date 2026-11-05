import Store from 'electron-store';
import crypto from 'crypto';

const store = new Store(
  process.versions.electron 
    ? undefined 
    : ({ projectName: 'wilkor-os' } as any)
);

export interface ProcessedTask {
  id: string;
  parentId?: string; // ID da tarefa pai em fluxos compostos
  type: string;
  description: string;
  timestamp: number;
  status: 'PENDING' | 'DELIVERED' | 'FAILED';
  error?: string;
  meta: any;
}

/**
 * Registra uma nova tarefa/operação no wOs para controle de concorrência e ciência de processamento.
 */
export function registerTask(type: string, description: string, meta: any = {}, parentId?: string): string {
  const taskId = crypto.randomUUID();
  const tasks = (store.get('wosTaskRegistry') as ProcessedTask[]) || [];

  const newTask: ProcessedTask = {
    id: taskId,
    parentId,
    type,
    description,
    timestamp: Date.now(),
    status: 'PENDING',
    meta
  };

  tasks.push(newTask);
  
  // Limita o histórico das últimas 100 tarefas para não sobrecarregar o store
  if (tasks.length > 100) {
    tasks.shift();
  }

  store.set('wosTaskRegistry', tasks);
  console.log(`[Task Registry] Tarefa registrada: ${description} (ID: ${taskId}${parentId ? `, Pai: ${parentId}` : ''})`);
  return taskId;
}

/**
 * Atualiza o status e os metadados de entrega de uma tarefa registrada.
 */
export function updateTaskStatus(
  taskId: string,
  status: 'PENDING' | 'DELIVERED' | 'FAILED',
  error?: string,
  extraMeta?: any
): void {
  const tasks = (store.get('wosTaskRegistry') as ProcessedTask[]) || [];
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex !== -1) {
    tasks[taskIndex].status = status;
    tasks[taskIndex].timestamp = Date.now();
    if (error) tasks[taskIndex].error = error;
    if (extraMeta) {
      tasks[taskIndex].meta = { ...tasks[taskIndex].meta, ...extraMeta };
    }
    store.set('wosTaskRegistry', tasks);
    console.log(`[Task Registry] Status da tarefa ${taskId} atualizado para: ${status}`);
  }
}

/**
 * Verifica se uma tarefa similar foi executada recentemente para evitar duplicidade.
 */
export function checkRecentTask(
  type: string,
  metaQuery: Record<string, any>,
  maxAgeMs: number = 300000 // 5 minutos por padrão
): ProcessedTask | null {
  const tasks = (store.get('wosTaskRegistry') as ProcessedTask[]) || [];
  const now = Date.now();

  // Busca do mais recente para o mais antigo
  for (let i = tasks.length - 1; i >= 0; i--) {
    const task = tasks[i];
    if (task.type !== type) continue;
    if (now - task.timestamp > maxAgeMs) continue;

    // Compara se todos os campos pesquisados batem com os metadados da tarefa
    let match = true;
    for (const key of Object.keys(metaQuery)) {
      if (task.meta[key] !== metaQuery[key]) {
        match = false;
        break;
      }
    }

    if (match) {
      return task;
    }
  }

  return null;
}

/**
 * Retorna todas as sub-tarefas vinculadas a um ID pai de um fluxo composto.
 */
export function getTaskTree(parentId: string): ProcessedTask[] {
  const tasks = (store.get('wosTaskRegistry') as ProcessedTask[]) || [];
  return tasks.filter(t => t.parentId === parentId);
}
