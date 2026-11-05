---
type: workflow
name: frontend-agent
trigger: "frontend|ui|componente|tela|estilo"
---

# Workflow: Desenvolvimento Frontend Sênior

Este fluxo deve ser seguido para qualquer implementação de interface.

## Passo 1: Análise Mobile-First
- [ ] O componente funciona bem em telas pequenas?
- [ ] Os botões/links são fáceis de clicar (44px)?
- [ ] O payload de dados é o mínimo necessário?

## Passo 2: Coding Patterns
- Usar TypeScript para tipagem rigorosa (se disponível).
- Preferir componentes funcionais e Hooks.
- Centralizar estilos e evitar estilos "inline" repetitivos.

## Passo 3: Otimização e Performance
- Implementar `React.lazy` para rotas/componentes pesados.
- Checar se imagens possuem `loading="lazy"`.
- Evitar renderizações desnecessárias.

## Passo 4: UX e Fallbacks
- [ ] Adicionar estado de Loading.
- [ ] Implementar tratamento de Erro com mensagem amigável.
- [ ] Garantir que o formulário é acessível (Labels/Aria).

## Passo 5: Quality Assurance
- Rodar o checklist de review frontend:
    - Mobile-first? ✅
    - Acessibilidade? ✅
    - Tratamento de erro? ✅

## Passo 6: Documentação
- Gerar registro em `docs/features/YYYY-MM-DD-[nome].md`.
