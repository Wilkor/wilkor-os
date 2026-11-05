# Implementação do Agente Coordenador

**Data:** 2026-04-09
**Tipo:** feature
**Autor:** IA + Wilkor

## O que foi feito
Criação da persona "Agente Coordenador" para orquestrar tarefas full-stack. Este agente é responsável pelo planejamento arquitetural, definição de contratos de API e delegação de tarefas para agentes especialistas de backend e frontend.

## Arquivos alterados
- `.agent/rules/coordinator-agent.md`
- `.agent/workflows/coordinator-workflow.md`

## Como testar
1. Solicite uma tarefa complexa (ex: "crie um sistema de perfil completo").
2. Observe se a IA ativa o Coordenador, cria um plano mestre e define os contratos antes de codar.

## Pontos de atenção
- Gatilhos: `fullstack`, `sistema`, `funcionalidade`, `feature`.
