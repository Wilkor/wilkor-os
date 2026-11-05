# Implementação do Agente Híbrido (Backend + Frontend)

**Data:** 2026-04-09
**Tipo:** feature
**Autor:** IA + Wilkor

## O que foi feito
Configuração de agentes especialistas duplos no wOs. Detecta automaticamente se a tarefa é de interface ou de servidor e assume a identidade correspondente (Node.js/Mongo ou React/UX).

## Arquivos alterados
- `.agent/rules/backend-agent.md`
- `.agent/rules/frontend-agent.md`
- `.agent/workflows/backend-agent.md`
- `.agent/workflows/frontend-agent.md`

## Como testar
1. Se pedir uma alteração na IDE (UI), o Agente de Frontend será ativado.
2. Se pedir uma alteração no sistema de arquivos ou API do Electron, o Agente de Backend será ativado.

## Pontos de atenção
- Prioridade definida para evitar conflitos de persona.
