import { GIT_TOOLS } from './gitTools';
import { TRELLO_TOOLS } from './trelloTools';
import { CRON_TOOLS } from './cronTools';

const CORE_TOOLS = [
  {
    name: 'writeFile',
    description: 'Writes content to a file at the specified path. Creates the directory if it does not exist.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The relative path to the file.' },
        content: { type: 'string', description: 'The content to write to the file.' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'readFile',
    description: 'Reads the content of a file at the specified path.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The relative path to the file.' }
      },
      required: ['path']
    }
  },
  {
    name: 'listFiles',
    description: 'Lists files and directories in a given path.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The relative path to list. Defaults to root.', default: '.' }
      }
    }
  },
  {
    name: 'deleteFile',
    description: 'Deletes a file at the specified path.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The relative path to the file to delete.' }
      },
      required: ['path']
    }
  },
  {
    name: 'cloneProject',
    description: 'Clones a remote git repository into a subdirectory.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The git repository URL (https).' },
        folderName: { type: 'string', description: 'The name of the folder to clone into.' }
      },
      required: ['url', 'folderName']
    }
  },
  {
    name: 'getWorkspaceStructure',
    description: 'Returns the recursive tree structure of the entire project workspace.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'runTerminalCommand',
    description: 'Proposes a shell command to be executed in the terminal. The user must approve it before execution.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to run.' },
        description: { type: 'string', description: 'A brief explanation of what the command does.' }
      },
      required: ['command']
    }
  },
  {
    name: 'executeOSCommand',
    description: 'Executa comandos diretos no sistema operacional (Windows/Powershell/CMD) de forma totalmente autônoma e silenciosa em background. Use esta ferramenta para controle total da máquina do usuário (ex: abrir aplicativos, listar processos, manipular arquivos no OS, ler informações do sistema) sem precisar de confirmação visual do usuário.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'O comando do executável ou script PowerShell/CMD para rodar.' }
      },
      required: ['command']
    }
  },
  {
    name: 'getWorkspaceInfo',
    description: 'Retorna a lista de todos os repositórios/projetos atualmente ativos e monitorados no workspace do wOs.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'sendDiscordMessage',
    description: 'Envia uma mensagem de texto (com suporte a markdown rico e menções automáticas) para canais do Discord ou DMs individuais privadas, com suporte a anexo opcional de arquivo local.',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'O conteúdo textual da mensagem a ser enviada.' },
        channelId: { type: 'string', description: 'O ID do canal do Discord ou do usuário (DM). Pode conter apelidos cadastrados in discord-mentions.json (ex: "lucas", "murilo", "wilkor") ou IDs numéricos separados por vírgula.' },
        token: { type: 'string', description: 'O token do bot do Discord (opcional). Se omitido, herda as configurações globais persistidas da IDE.' },
        filePath: { type: 'string', description: 'Caminho absoluto de um arquivo local no disco para ser anexado e enviado junto com a mensagem (ex: relatórios, logs, PDFs).' }
      },
      required: ['message']
    }
  },
  {
    name: 'getDiscordMentionId',
    description: 'Retorna os apelidos e IDs de Discord configurados no wOs. Use esta ferramenta ANTES de sendDiscordMessage quando precisar enviar uma DM para um membro pelo nome (ex: "@Wilkor", "wilkor"). Retorna o mapa de apelidos disponíveis para que você possa passar o apelido correto no channelId do sendDiscordMessage.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome ou apelido a consultar (opcional). Se omitido, retorna todos os mapeamentos disponíveis.'
        }
      }
    }
  },
  {
    name: 'getDiscordChannelInfo',
    description: 'Retorna informações sobre o canal do Discord e lista os membros do servidor (guild) associado, incluindo apelidos e IDs. Útil para responder perguntas como "quantas pessoas têm no canal/servidor" ou verificar quem está online.',
    parameters: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'O ID do canal do Discord para consulta (opcional). Se omitido, usa o canal padrão configurado.' },
        token: { type: 'string', description: 'O token do bot do Discord (opcional). Se omitido, usa o token configurado no store.' }
      }
    }
  },
  {
    name: 'createImage',
    description: 'Gera uma imagem a partir de uma descrição textual (prompt) e salva no workspace do projeto.',
    parameters: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'A descrição textual detalhada da imagem que se deseja criar.' },
        style: { type: 'string', description: 'O estilo artístico da imagem (ex: "realista", "anime", "pixel art", "vetorial"). Opcional.' },
        output: { type: 'string', description: 'O nome do arquivo de saída no workspace (ex: "logo.png"). Opcional.' }
      },
      required: ['description']
    }
  },
  {
    name: 'generateCustomReportPDF',
    description: 'Gera um relatório PDF premium customizado baseado nos inputs e seções enviados pelo agente. O arquivo é salvo no diretório de artefatos local e o caminho absoluto do arquivo é retornado para que possa ser enviado por anexo via sendDiscordMessage.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'O título principal do relatório (ex: "RELATÓRIO TÉCNICO DE AUDITORIA").' },
        subtitle: { type: 'string', description: 'Um subtítulo curto descritivo.' },
        author: { type: 'string', description: 'Nome do agente/responsável autor do relatório (ex: "Tech Lead AI").' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'O título desta seção (ex: "Pontos Críticos", "Análise de Commits").' },
              content: { type: 'string', description: 'O conteúdo textual completo da seção.' }
            },
            required: ['title', 'content']
          },
          description: 'Lista de seções de conteúdo do relatório.'
        }
      },
      required: ['title', 'sections']
    }
  },
  {
    name: 'generateDocument',
    description: 'Gera um documento no formato especificado (PDF, Excel, Word, texto, markdown, html), salvando-o na pasta de artefatos. Retorna o caminho absoluto e nome do arquivo gerado.',
    parameters: {
      type: 'object',
      properties: {
        type: { 
          type: 'string', 
          enum: ['pdf', 'xlsx', 'docx', 'txt', 'md', 'html'], 
          description: 'O formato do documento a ser gerado.' 
        },
        title: { type: 'string', description: 'O título principal do documento.' },
        subtitle: { type: 'string', description: 'Um subtítulo ou resumo curto do documento. Opcional.' },
        author: { type: 'string', description: 'Autor do documento. Opcional.' },
        fileName: { type: 'string', description: 'Nome sugerido do arquivo com extensão apropriada (ex: relatorio.xlsx). Opcional.' },
        content: { 
          type: 'string', 
          description: 'Conteúdo do documento em formato de texto. Para planilhas XLSX, você pode passar uma string formatada em CSV (separando colunas com vírgula ou ponto-e-vírgula e linhas com quebra de linha) ou um JSON stringificado (ex: um array de arrays ou objeto de sheets). Para PDF ou DOCX, você pode passar uma string de texto corrido ou um JSON stringificado contendo um array de seções [{"title": "Nome da Seção", "content": "Texto da Seção"}].' 
        }
      },
      required: ['type', 'title', 'content']
    }
  },
  {
    name: 'installSkill',
    description: 'Instala uma nova habilidade/skill para a IA no wOs. Pode criar uma skill documental escrevendo as instruções em um arquivo SKILL.md, ou registrar e ativar um servidor de ferramentas MCP baseado em npx ou npm (instalando o pacote necessário localmente e gerando a documentação SKILL.md explicativa).',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome da skill (usando hífens e minúsculas, ex: automated-trello-sync).'
        },
        type: {
          type: 'string',
          enum: ['markdown', 'npx', 'npm'],
          description: 'Tipo da skill a ser instalada: "markdown" (instruções puras), "npx" (MCP via npx) ou "npm" (MCP ou utilitário via npm).'
        },
        content: {
          type: 'string',
          description: 'Conteúdo completo do arquivo SKILL.md em markdown. Obrigatório se type for markdown.'
        },
        command: {
          type: 'string',
          description: 'O comando/pacote do servidor MCP (ex: npx ou o nome do pacote npm a ser instalado). Obrigatório se type for npx ou npm.'
        },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de argumentos passados ao comando MCP (ex: ["-y", "@modelcontextprotocol/server-postgres"]).'
        },
        description: {
          type: 'string',
          description: 'Uma breve descrição de qual habilidade esta skill concede ao agente.'
        },
        env: {
          type: 'object',
          description: 'Objeto opcional contendo variáveis de ambiente que o servidor MCP necessita para rodar (ex: { "API_KEY": "..." }).'
        }
      },
      required: ['name', 'type']
    }
  },
  {
    name: 'searchWeb',
    description: 'Pesquisa informações em tempo real na internet (notícias, artigos, documentações atuais, etc.) quando a resposta exigir dados atualizados do mundo exterior.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'O termo de pesquisa a ser buscado na internet.' },
        limit: { type: 'number', description: 'Número máximo de resultados a retornar (opcional, padrão 5, máximo 10).' }
      },
      required: ['query']
    }
  }
];

export const TOOLS = [
  ...CORE_TOOLS,
  ...GIT_TOOLS,
  ...TRELLO_TOOLS,
  ...CRON_TOOLS
];
