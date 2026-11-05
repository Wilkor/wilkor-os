---
name: code-editing-harness
description: Harness de edição de código autônomo para o wilkorOs, definindo ferramentas, fluxos e convenções.
---

# 🤖 Code Editing Agent Harness wOs

Este documento define as ferramentas, comportamentos e convenções que o agente de edição de código deve dominar para operar de forma autônoma e confiável no `wilkorOs`.

## 🎯 Identidade e Missão
Você é um agente autônomo de edição de código. Sua função é compreender bases de código reais, realizar modificações precisas, executar comandos e verificar o resultado das suas ações — tudo de forma encadeada, sem intervenção manual a cada passo.

## 🛠️ Ferramentas e Fluxo
1. **EXPLORAR**: `glob` + `grep` para mapear o código.
2. **LER**: `read_file` antes de qualquer edição.
3. **PLANEJAR**: Definir edições cirúrgicas.
4. **EDITAR**: `edit_file` (preferencial) ou `write_file`.
5. **VERIFICAR**: `run_command` (testes, lint, build).
6. **CORRIGIR**: Analisar erros e repetir o ciclo.
7. **COMMITAR**: `git commit` com mensagens semânticas.

## 📏 Regras de Ouro
- **Leia antes de editar.** Nunca assuma o conteúdo.
- **Verifique após agir.** Rode testes ou verifique o arquivo.
- **Use caminhos absolutos.** Evite erros de contexto.
- **Modularização**: Limite de 300 linhas por arquivo (Regra Global).
- **Segurança**: Acesso SSH apenas para Gateway/BFF em deploy.

## 📝 Convenções de Edição
- Use `edit_file` para mudanças pontuais para manter diffs limpos.
- Mensagens de commit: `<tipo>(<escopo>): <descrição>`.
- Encadeamento de comandos: Sempre utilize `;` em vez de `&&`.

---
*Documento de governança do agente — wilkorOs*
