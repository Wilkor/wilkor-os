export const GIT_TOOLS = [
  {
    name: 'getBitbucketPRs',
    description: 'Busca a lista de Pull Requests (PRs) no Bitbucket dos projetos ativos no workspace. Permite filtrar por estado (OPEN, MERGED, DECLINED, ALL).',
    parameters: {
      type: 'object',
      properties: {
        state: { 
          type: 'string', 
          description: 'Estado dos PRs a buscar: OPEN, MERGED, DECLINED, ALL. Default: ALL.', 
          default: 'ALL' 
        },
        limit: { 
          type: 'number', 
          description: 'Número de PRs a retornar. Default: 15.', 
          default: 15 
        }
      }
    }
  },
  {
    name: 'getBitbucketCommits',
    description: 'Busca a lista de commits recentes diretamente da API do Bitbucket de todos os projetos configurados.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Número máximo de commits por repositório (default 10).', default: 10 }
      }
    }
  },
  {
    name: 'getBitbucketCommitDetails',
    description: 'Busca os detalhes de um commit específico (ou do último commit HEAD se não informado) da API do Bitbucket, incluindo diffstat dos arquivos alterados.',
    parameters: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Caminho absoluto do repositório no disco (opcional). Se não informado, busca nos repositórios ativos.' },
        commitHash: { type: 'string', description: 'Hash do commit (opcional). Se não informado, busca o último commit HEAD.' }
      }
    }
  },
  {
    name: 'addBitbucketPRComment',
    description: 'Adiciona um comentário a um Pull Request (PR) específico no Bitbucket.',
    parameters: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Caminho absoluto do repositório no disco (opcional). Se não informado, busca nos repositórios ativos.' },
        prId: { type: 'string', description: 'O ID do Pull Request (ex: "42").' },
        text: { type: 'string', description: 'O texto do comentário a ser postado.' }
      },
      required: ['prId', 'text']
    }
  },
  {
    name: 'addBitbucketCommitComment',
    description: 'Adiciona um comentário a um Commit específico no Bitbucket.',
    parameters: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Caminho absoluto do repositório no disco (opcional). Se não informado, busca nos repositórios ativos.' },
        commitHash: { type: 'string', description: 'O hash (completo ou curto de 7 chars) do commit.' },
        text: { type: 'string', description: 'O texto do comentário a ser postado.' }
      },
      required: ['commitHash', 'text']
    }
  },
  {
    name: 'generateGitReportPDF',
    description: 'Gera um relatório de atividades executivo em PDF premium das atividades Git de colaboradores a partir do histórico do repositório.',
    parameters: {
      type: 'object',
      properties: {
        since: { 
          type: 'string', 
          description: 'Filtro temporal para buscar as atividades Git (ex: "7 days ago", "30 days ago", "90 days ago", "all"). Default: "7 days ago".',
          default: '7 days ago'
        },
        repoPaths: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Caminhos absolutos dos repositórios locais para auditar. Se omitido, busca nos diretórios ativos do workspace.' 
        }
      }
    }
  },
  {
    name: 'getBitbucketPipelines',
    description: 'Consulta o status e histórico recente dos Pipelines de build/esteiras do Bitbucket para verificar se houve erros ou falhas.',
    parameters: {
      type: 'object',
      properties: {
        repoPaths: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Caminhos absolutos dos repositórios locais para auditar. Se omitido, busca nos diretórios ativos do workspace.' 
        },
        limit: {
          type: 'number',
          description: 'Quantidade máxima de pipelines recentes a retornar por repositório. Default: 5.',
          default: 5
        }
      }
    }
  },
  {
    name: 'getCommitsByPeriod',
    description: 'Lista e conta commits de TODOS os projetos ativos no workspace por período. Use esta ferramenta para responder "quantos commits tivemos hoje", "commits desta semana", "commits deste mês", "quem mais commitou hoje" etc. Retorna total geral + breakdown por projeto.',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Período a consultar: "today" (hoje), "week" (esta semana), "month" (este mês), "all" (todo histórico). Também aceita expressões livres como "3 days ago". Default: "today".',
          enum: ['today', 'week', 'month', 'all'],
          default: 'today'
        },
        author: {
          type: 'string',
          description: 'Filtro opcional por nome de autor (parcial, case-insensitive). Ex: "lucas", "wilkor".'
        }
      }
    }
  },
  {
    name: 'getLocalCommitDetails',
    description: 'Busca os detalhes completos de um commit específico nos repositórios locais: autor, data, mensagem completa, lista de arquivos alterados com número de linhas adicionadas e removidas. Use após identificar um hash de commit pelo getCommitsByPeriod.',
    parameters: {
      type: 'object',
      properties: {
        commitHash: {
          type: 'string',
          description: 'Hash do commit a detalhar (7+ caracteres). Obrigatório.'
        },
        repoPath: {
          type: 'string',
          description: 'Caminho absoluto do repositório (opcional). Se omitido, busca em todos os projetos ativos.'
        }
      },
      required: ['commitHash']
    }
  },
  {
    name: 'auditCommitCode',
    description: 'Realiza auditoria profunda do código alterado em um commit específico. Retorna o diff completo de cada arquivo modificado (linhas adicionadas/removidas) para análise de qualidade, segurança, padrões e boas práticas. Use quando o usuário pedir para "analisar o código do commit", "auditar o commit", "revisar o que foi alterado".',
    parameters: {
      type: 'object',
      properties: {
        commitHash: {
          type: 'string',
          description: 'Hash do commit a auditar (7+ caracteres). Obrigatório.'
        },
        repoPath: {
          type: 'string',
          description: 'Caminho absoluto do repositório (opcional). Se omitido, busca em todos os projetos ativos.'
        },
        filePath: {
          type: 'string',
          description: 'Caminho de um arquivo específico para filtrar o diff (opcional). Se omitido, retorna o diff de todos os arquivos alterados.'
        }
      },
      required: ['commitHash']
    }
  }
];
