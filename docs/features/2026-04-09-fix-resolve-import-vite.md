# Correção de Importação no Vite Config

**Data:** 2026-04-09
**Tipo:** bugfix
**Autor:** IA + Wilkor

## O que foi feito
Restaurada a importação de `resolve` do módulo `path` no arquivo `electron.vite.config.ts`. A importação havia sido removida acidentalmente durante a configuração de externalização de dependências.

## Arquivos alterados
- `electron.vite.config.ts`

## Como testar
1. Verifique se o comando `npm run dev` agora inicia o bundling sem erros de sintaxe ou "resolve is not defined".
