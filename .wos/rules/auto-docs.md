---
type: auto-rule
priority: 1
trigger: after-code-delivery
---

# REGRA: Documentar toda entrega de código

## Gatilho
SEMPRE que a IA entregar qualquer código (nova rota, correção, componente, query), ela DEVE criar ou atualizar um arquivo de documentação.

## Obrigação
- NENHUMA entrega de código sem documentação
- Documento DEVE ser criado ANTES de considerar a tarefa concluída

---

## 📁 Onde salvar
docs/features/
└── YYYY-MM-DD-[nome-curto].md

Exemplo: `docs/features/2026-01-15-perfil-usuario.md`

---

## 📝 Template da documentação (SIMPLES)

```markdown
# [Nome da Feature/Correção]

**Data:** YYYY-MM-DD
**Tipo:** [feature|bugfix|optimization|refactor]
**Autor:** IA + [seu nome]

## O que foi feito
[1-2 frases descrevendo o código entregue]

## Arquivos alterados
- `caminho/arquivo1.js`
- `caminho/arquivo2.js`

## Como testar
1. [passo 1]
2. [passo 2]

## Pontos de atenção
- [algo importante para saber depois]
```
