# Correção de Carregamento de Módulos Nativos (node-pty)

**Data:** 2026-04-09
**Tipo:** bugfix
**Autor:** IA + Wilkor

## O que foi feito
Configurado o `electron-vite` para externalizar dependências nos processos `main` e `preload`. Isso resolve o erro "Failed to load native module: conpty.node" ao garantir que o bundler não tente processar o binário nativo do `node-pty`, permitindo que o Electron o carregue diretamente do `node_modules`.

## Arquivos alterados
- `electron.vite.config.ts`

## Como testar
1. Reinicie o comando de desenvolvimento: `npm run dev`.
2. Verifique o console do terminal (backend). O erro de "Failed to load native module" deve ter desaparecido e o terminal deve iniciar corretamente.

## Pontos de atenção
- Toda vez que adicionar um módulo que use código nativo (C++), ele deve ser externalizado para evitar erros de bundling.
