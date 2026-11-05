export const ACTION_REGEX =
  /<(?:wos|wilkor)_action\s+type="([^"]+)"\s+path="([^"]+)"(?:\s+range="([^"]+)")?>([\s\S]*?)<\/(?:wos|wilkor)_action>/g
export const COMMAND_REGEX = /<(?:wos|wilkor)_command>([\s\S]*?)<\/(?:wos|wilkor)_command>/g

// Regex alternativos para formatos comuns que a IA pode gerar
export const ACTION_REGEX_ALT =
  /<(?:wos|wilkor)_action\s+type=['"]([^'"]+)['"]\s+path=['"]([^'"]+)['"](?:\s+range=['"]([^'"]+)['"])?>([\s\S]*?)<\/(?:wos|wilkor)_action>/g
export const COMMAND_REGEX_ALT =
  /<(?:wos|wilkor)_command>\s*([\s\S]*?)\s*<\/(?:wos|wilkor)_command>/g

export interface ParsedAction {
  type: string // 'file_edit' | 'write_file' | 'patch_file' | 'command'
  path?: string
  range?: string
  content: string
  command?: string
  raw?: string // Para debugging
}

/**
 * Extrai código de blocos markdown com mais robustez
 */
function extractCodeFromMarkdown(content: string): string {
  // Tenta remover blocos de código markdown
  const codeBlockRegex = /```[\w-]*\n?([\s\S]*?)\n?```/g
  const match = codeBlockRegex.exec(content)
  if (match && match[1]) {
    return match[1].trim()
  }

  // Se não encontrar bloco, retorna o conteúdo original trimado
  return content.trim()
}

/**
 * Normaliza o tipo de ação para valores padrão
 */
function normalizeActionType(type: string): string {
  const typeMap: Record<string, string> = {
    file_edit: 'file_edit',
    edit: 'file_edit',
    modify: 'file_edit',
    write_file: 'write_file',
    create: 'write_file',
    patch_file: 'patch_file',
    patch: 'patch_file',
    command: 'command',
  }

  return typeMap[type.toLowerCase()] || type
}

/**
 * Tenta extrair ações usando múltiplos regex patterns
 */
function tryExtractActions(
  content: string,
  regexes: RegExp[],
  extractor: (match: RegExpExecArray) => ParsedAction | null,
): ParsedAction[] {
  const actions: ParsedAction[] = []

  for (const regex of regexes) {
    regex.lastIndex = 0
    let match

    while ((match = regex.exec(content)) !== null) {
      const action = extractor(match)
      if (action) {
        actions.push(action)
      }
    }
  }

  return actions
}

export const parseMessageActions = (content: string): ParsedAction[] => {
  const actions: ParsedAction[] = []

  // Extrai ações de arquivo usando múltiplos patterns
  const fileActions = tryExtractActions(content, [ACTION_REGEX, ACTION_REGEX_ALT], (match) => {
    let actionContent = match[4].trim()
    actionContent = extractCodeFromMarkdown(actionContent)

    return {
      type: normalizeActionType(match[1]),
      path: match[2],
      range: match[3],
      content: actionContent,
      raw: match[0],
    }
  })

  actions.push(...fileActions)

  // Extrai comandos usando múltiplos patterns
  const commandActions = tryExtractActions(content, [COMMAND_REGEX, COMMAND_REGEX_ALT], (match) => {
    const commandContent = match[1].trim()

    return {
      type: 'command',
      content: commandContent,
      command: commandContent,
      raw: match[0],
    }
  })

  actions.push(...commandActions)

  // Remove duplicatas baseadas no conteúdo raw
  const uniqueActions = actions.filter(
    (action, index, self) => index === self.findIndex((a) => a.raw === action.raw),
  )

  return uniqueActions
}
