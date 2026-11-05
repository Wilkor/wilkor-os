---
type: workflow
name: entregar-com-docs
trigger: "entregar|finalizar|implementar|codigo pronto"
---

# Workflow: Entregar código com documentação

## Passos obrigatórios:

1. **Entregar o código** (solução principal)

2. **Criar arquivo de documentação** em `docs/features/YYYY-MM-DD-[nome].md`
   - Preencher template (4 seções: o que, arquivos, como testar, atenção)

3. **Confirmar entrega** com o caminho do arquivo criado.

---

## ⚡ Versão ultra-simples

# REGRA: Toda entrega de código gera um arquivo em docs/features/

**Template mínimo:**
- **Data - nome**
- **Arquivos:** [lista]
- **Testar:** [comando ou passo]

Obrigatório: Mostrar o caminho do arquivo criado.
