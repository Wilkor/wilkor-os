---
type: workflow
name: coordinator-workflow
trigger: "coordenar|planejar|funcionalidade nova"
---

# Workflow: Orquestração de Funcionalidades

Este fluxo é usado para coordenar tarefas complexas que envolvem múltiplos agentes ou repositórios.

## Passo 1: Análise e Requisitos
- Analisar o pedido do usuário.
- Identificar repositórios afetados.
- Definir o fluxo de dados (quem envia, quem recebe).

## Passo 2: Definição do Contrato (API Spec)
- **Obrigatório:** Escrever o contrato da API: endpoints, métodos, headers e estrutura JSON.
- Validar se o contrato atende às necessidades de UI (Persona Frontend).

## Passo 3: Criação de Backlog
- Gerar lista de tarefas para o Backend (`backend-agent`).
- Gerar lista de tarefas para o Frontend (`frontend-agent`).
- Gerar lista de tarefas de infra/configuração se necessário.

## Passo 4: Execução Coordenada
- Invoque o Agente Especialista de Backend para as rotas e queries.
- Invoque o Agente Especialista de Frontend para os componentes e telas.

## Passo 5: Integração e Testes End-to-End
- Verificar se o Front consome o Back corretamente.
- Rodar validação final de UX.

## Passo 6: Conclusão e Documentação
- Consolidar as entregas e gerar a documentação em `docs/features/`.
