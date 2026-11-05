# Remoção de Credenciais e Higienização de Secrets

**Data:** 2026-11-07
**Tipo:** bugfix
**Autor:** IA + Wilkor

## O que foi feito
Removidas todas as credenciais sensíveis (Discord Bot Token, MongoDB URI, Trello API Key e Token) que estavam hardcoded nos arquivos do projeto e impedindo o push para o GitHub público via GitHub Push Protection. Adicionadas regras de proteção no `.gitignore` e validação defensiva para variáveis de ambiente.

## Arquivos alterados
- `src/main/index.ts`
- `src/main/utils/database.ts`
- `trello-automation/list_lists.cjs`
- `.gitignore`
- `auto-docs.md`

## Como testar
1. Verificar que `git diff` não apresenta nenhuma credencial exposta.
2. Executar `git status` e verificar que o commit foi reescrito sem os segredos.
3. Realizar o `git push` para o repositório remoto.

## Pontos de atenção
- Como o Discord Bot Token e as chaves de API estiveram previamente no commit local, recomenda-se redefinir o token do bot no Discord Developer Portal e no Trello por garantia de segurança.
