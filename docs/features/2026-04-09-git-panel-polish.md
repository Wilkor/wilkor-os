# Atualização: Refinamentos no Source Control (wOs)

**Data:** 2026-04-09
**Tipo:** UI/UX Polish
**Autor:** Antigravity (IA)

Realzamos ajustes pontuais no painel de Git para melhorar a visibilidade e o contexto do desenvolvedor.

## 🛠️ O que foi corrigido

### 1. Visibilidade do Seletor de Branch
- **Problema:** O dropdown de branches abria para cima, ficando escondido pelo topo da tela ou pelo header da aplicação.
- **Solução:** Invertemos o sentido de abertura. Agora o seletor abre para **baixo** (`top-full`), garantindo que todas as branches (main, developer, etc) fiquem visíveis.

### 2. Identificação do Projeto (Contexto)
- **Problema:** Ao trabalhar com múltiplos projetos ou abrir uma pasta, não havia clareza sobre qual repositório o painel de Git estava gerenciando.
- **Solução:** Adicionamos um **Cabeçalho de Projeto** no topo do painel. Ele exibe o nome da pasta raiz e um ícone de "Layers" para identificar o contexto atual da Working Tree.

---

## ✅ Como verificar
1. Clique no seletor de branch (ex: `main`) e verifique se as opções aparecem logo abaixo do botão.
2. Veja o novo título no topo do painel lateral exibindo o nome do seu projeto atual.
