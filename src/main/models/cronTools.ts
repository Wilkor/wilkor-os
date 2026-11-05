export const CRON_TOOLS = [
  {
    name: 'listAgents',
    description: 'Lista todos os agentes disponíveis no wOs que podem ser associados a tarefas agendadas (cron jobs). Retorna o nome, emoji, papel e ID de cada agente.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'listCronJobs',
    description: 'Lista todas as tarefas agendadas (cron jobs) configuradas no wOs, incluindo nome, expressão cron, status (ativo/inativo), modelo de IA usado e última execução.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'createCronJob',
    description: 'Cria uma nova tarefa agendada (cron job) no wOs. A tarefa será executada automaticamente conforme a expressão cron fornecida.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome descritivo da tarefa agendada (ex: "Backup Diário", "Relatório Semanal")'
        },
        cronExpr: {
          type: 'string',
          description: 'Expressão cron no formato padrão (ex: "0 9 * * *" para todos os dias às 9h, "0 */6 * * *" para a cada 6 horas). Formato: minuto hora dia-mês mês dia-semana'
        },
        prompt: {
          type: 'string',
          description: 'O prompt/instrução que será enviado ao modelo de IA quando a tarefa for executada'
        },
        modelId: {
          type: 'string',
          description: 'ID do modelo de IA a ser usado (ex: "gpt-4", "claude-3-opus"). Se omitido, usa o modelo padrão'
        },
        enabled: {
          type: 'boolean',
          description: 'Define se a tarefa deve começar ativa (true) ou inativa (false). Padrão: true'
        },
        agentIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de IDs de agentes que devem ser executados automaticamente após a resposta principal (opcional)'
        }
      },
      required: ['name', 'cronExpr', 'prompt']
    }
  },
  {
    name: 'updateCronJob',
    description: 'Atualiza uma tarefa agendada (cron job) existente no wOs. Use o ID da tarefa para identificar qual deve ser atualizada.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID da tarefa agendada a ser atualizada'
        },
        name: {
          type: 'string',
          description: 'Novo nome descritivo da tarefa agendada (opcional)'
        },
        cronExpr: {
          type: 'string',
          description: 'Nova expressão cron no formato padrão (opcional). Formato: minuto hora dia-mês mês dia-semana'
        },
        prompt: {
          type: 'string',
          description: 'Novo prompt/instrução que será enviado ao modelo de IA (opcional)'
        },
        modelId: {
          type: 'string',
          description: 'Novo ID do modelo de IA a ser usado (opcional)'
        },
        enabled: {
          type: 'boolean',
          description: 'Novo status da tarefa (true para ativo, false para inativo) (opcional)'
        },
        agentIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Nova lista de IDs de agentes (opcional)'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'deleteCronJob',
    description: 'Remove uma tarefa agendada (cron job) do wOs permanentemente.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID da tarefa agendada a ser removida'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'toggleCronJob',
    description: 'Ativa ou desativa uma tarefa agendada (cron job) sem removê-la. Útil para pausar temporariamente execuções.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID da tarefa agendada'
        },
        enabled: {
          type: 'boolean',
          description: 'true para ativar, false para desativar'
        }
      },
      required: ['id', 'enabled']
    }
  },
  {
    name: 'runCronJob',
    description: 'Executa uma tarefa agendada (cron job) imediatamente, independente do horário agendado. Útil para testes ou execuções manuais.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID da tarefa agendada a ser executada'
        }
      },
      required: ['id']
    }
  }
];
