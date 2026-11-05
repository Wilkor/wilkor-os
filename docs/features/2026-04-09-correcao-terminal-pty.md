# Correção e Upgrade do Terminal (node-pty)

**Data:** 2026-04-09
**Tipo:** bugfix
**Autor:** IA + Wilkor

## O que foi feito
O terminal foi migrado de `child_process.spawn` para `node-pty`, permitindo interatividade real. Além disso, foi implementado o sistema de redimensionamento dinâmico para evitar quebra de linhas.

## Arquivos alterados
- `src/main/terminal.ts`
- `src/preload/index.ts`
- `src/renderer/src/components/TerminalInstance.tsx`

## Como testar
1. Iniciar o wOs: `npm run dev`.
2. No terminal:
    - Testar interatividade: Digite `npm init` e verifique se consegue responder às perguntas.
    - Testar histórico: Use as setas ↑ e ↓ para navegar nos comandos anteriores.
    - Testar redimensionamento: Aumente e diminua a altura do painel do terminal e verifique se o prompt se ajusta corretamente.

## Pontos de atenção
- **node-pty:** Requer que as dependências nativas estejam compiladas corretamente para o Electron. No windows, isso pode exigir o `windows-build-tools`.
- **PowerShell:** O terminal agora abre o PowerShell real sem flags restritivas, permitindo scripts e customizações do usuário.
