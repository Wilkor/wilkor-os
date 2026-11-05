# wOs — Workspace Operating System

Este é o harness de engenharia autônomo do projeto. O agente opera sob as seguintes diretrizes:

### 🛠️ Ciclo de Trabalho
**Plan → Execute → Validate**

1. **Análise**: Exploração de diretórios e leitura integral de arquivos.
2. **Planejamento**: Definição clara de mudanças antes da escrita.
3. **Execução**: Edição cirúrgica ou criação de novos módulos.
4. **Validação**: Verificação pós-edição e execução de testes/lint.

### 🧠 Inteligência de Modelos
- **GPT-4o**: Raciocínio complexo, arquitetura e bugs profundos.
- **GPT-4o-mini**: Autocomplete, correções simples e sumarização.
- **Text-Embedding-3-Small**: Busca semântica no codebase.

### 🛡️ Segurança e Restrições
O agente **não** realiza autonomamente:
- Deploys/APIs de produção.
- Git Push/Commit.
- Deleções definitivas.
- Alterações em bancos de dados sem consulta prévia.

### 📜 Padrões de Código
- Respeito total ao estilo existente (indentação, nomenclatura, aspas).
- Modularização automática (limite de 300 linhas por arquivo).
- Documentação contínua via `auto-docs.md`.

---
*Status: Ativo e Operacional.*
