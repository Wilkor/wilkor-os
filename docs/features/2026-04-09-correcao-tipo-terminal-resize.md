# Correção de Tipagem (TS) no Terminal Resize

**Data:** 2026-04-09
**Tipo:** bugfix
**Autor:** IA + Wilkor

## O que foi feito
Adicionada a definição da função `resize` na interface `ApiExpose`. Isso resolve o erro de compilação do TypeScript no frontend ao tentar chamar `window.api.terminal.resize`.

## Arquivos alterados
- `src/shared/types.ts`

## Como testar
1. Verifique se o erro de "Property 'resize' does not exist on type..." desapareceu no VS Code ou durante o `npm run typecheck`.

## Pontos de atenção
- Sempre que adicionar um novo canal IPC no `preload`, a interface `ApiExpose` no `shared/types.ts` deve ser atualizada para manter a tipagem do frontend sincronizada.
