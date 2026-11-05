export const BITBUCKET_TOOLS = [
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
  }
];
