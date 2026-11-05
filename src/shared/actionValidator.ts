import { ParsedAction } from './actionPatterns'

export interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
}

/**
 * Valida uma ação antes da execução
 */
export function validateAction(
  action: ParsedAction,
  workspaceRoots: string[] = [],
): ValidationResult {
  // Validação de tipo de ação
  if (!action.type) {
    return { valid: false, error: 'Tipo de ação não especificado' }
  }

  const validTypes = ['file_edit', 'write_file', 'patch_file', 'command']
  if (!validTypes.includes(action.type)) {
    return { valid: false, error: `Tipo de ação inválido: ${action.type}` }
  }

  // Validações específicas por tipo
  if (action.type === 'command') {
    return validateCommand(action)
  }

  if (action.type === 'write_file' || action.type === 'file_edit' || action.type === 'patch_file') {
    return validateFileAction(action, workspaceRoots)
  }

  return { valid: true }
}

/**
 * Valida comandos por segurança
 */
function validateCommand(action: ParsedAction): ValidationResult {
  const command = action.command || action.content

  if (!command || command.trim().length === 0) {
    return { valid: false, error: 'Comando vazio' }
  }

  // Lista de comandos perigosos que requerem confirmação explícita
  const dangerousCommands = [
    'rm -rf /',
    'rm -rf /*',
    'mkfs',
    'format',
    'del /f /s /q',
    'shutdown',
    'reboot',
    '> /dev/sd',
    'dd if=',
  ]

  const commandLower = command.toLowerCase()
  for (const dangerous of dangerousCommands) {
    if (commandLower.includes(dangerous.toLowerCase())) {
      return {
        valid: false,
        error: `Comando potencialmente perigoso detectado: ${dangerous}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Valida ações de arquivo
 */
function validateFileAction(action: ParsedAction, workspaceRoots: string[]): ValidationResult {
  if (!action.path) {
    return { valid: false, error: 'Caminho do arquivo não especificado' }
  }

  const path = action.path

  // Verifica paths relativos perigosos
  if (path.includes('..')) {
    return {
      valid: false,
      error: 'Caminho com ".." não permitido por segurança',
    }
  }

  // Verifica paths absolutos fora do workspace
  if (path.startsWith('/') || /^[A-Za-z]:/.test(path)) {
    // Se for absoluto, verifica se está dentro de algum workspace root
    const isInWorkspace = workspaceRoots.some((root) => path.startsWith(root))
    if (!isInWorkspace && workspaceRoots.length > 0) {
      return {
        valid: false,
        error: `Caminho absoluto fora do workspace: ${path}`,
      }
    }
  }

  // Verifica extensões de arquivo que não devem ser editadas automaticamente
  const dangerousExtensions = ['.exe', '.dll', '.so', '.dylib', '.bin', '.app']
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext && dangerousExtensions.includes(`.${ext}`)) {
    return {
      valid: false,
      error: `Edição de arquivos binários não permitida: .${ext}`,
    }
  }

  // Verifica se o conteúdo não está vazio para write_file
  if (action.type === 'write_file' && (!action.content || action.content.trim().length === 0)) {
    return {
      valid: false,
      error: 'Conteúdo vazio para write_file',
    }
  }

  // Verifica tamanho do conteúdo (limite de segurança)
  if (action.content && action.content.length > 1_000_000) {
    return {
      valid: false,
      error: 'Conteúdo muito grande (>1MB)',
    }
  }

  return { valid: true }
}

/**
 * Valida múltiplas ações em lote
 */
export function validateActions(
  actions: ParsedAction[],
  workspaceRoots: string[] = [],
): {
  valid: boolean
  errors: Array<{ action: ParsedAction; error: string }>
  warnings: Array<{ action: ParsedAction; warning: string }>
} {
  const errors: Array<{ action: ParsedAction; error: string }> = []
  const warnings: Array<{ action: ParsedAction; warning: string }> = []

  for (const action of actions) {
    const result = validateAction(action, workspaceRoots)
    if (!result.valid) {
      errors.push({ action, error: result.error || 'Erro desconhecido' })
    }
    if (result.warning) {
      warnings.push({ action, warning: result.warning })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
