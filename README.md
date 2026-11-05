# 🤖 wOs — Workspace Operating System

> **Ambiente de Desenvolvimento Inteligente e Colaborativo (WDE)** de nível comercial, projetado para unificar múltiplos modelos de IA, agentes especialistas autônomos, automação de código e gestão de processos diretamente no seu workspace local.

---

## 🧭 Visão Geral

O **wOs** é uma plataforma de engenharia de software assistida por IA executada localmente (Electron + React + TS). Ele atua como o centro de comando do desenvolvedor, organizando o ciclo completo de desenvolvimento — desde a concepção de negócios até a geração física de código, automação de testes e deploys.

Diferente de sandboxes isoladas na nuvem, o **wOs** trabalha em simbiose com o desenvolvedor ("Human-in-the-loop"), oferecendo contexto local inteligente, privacidade absoluta e integrações com as ferramentas que sua equipe já utiliza.

---

## ⚡ Principais Funcionalidades

### 💬 Chat com Contexto Unificado (Context Awareness)
O wOs analisa dinamicamente o estado atual do seu ambiente a cada interação:
* **Leitura Ativa:** Injeta automaticamente o código do arquivo em foco e resumos das abas abertas.
* **Mapeamento de Workspace:** Varredura em tempo real da árvore de arquivos e diretórios de projetos ativos.
* **Âncoras de Negócio:** Reconhecimento de especificações estruturais de alto nível (`sdd.md`, `skill.md`, `README.md`).
* **Conectores LLM:** Suporte nativo a provedores em nuvem (OpenAI, Anthropic Claude, Gemini) e locais (Ollama, Llama.cpp).

### 🎙️ Modo J.A.R.V.I.S (Controle por Voz Hands-Free)
Experiência interativa sem cliques para acelerar o fluxo de trabalho:
* **Escuta Passiva (Wake Word):** Detecção automática de voz ("Hey wOs") via Web Speech API, totalmente gratuita e otimizada localmente.
* **Auto-Submit & Transcrição:** Gravação manual e conversão rápida de voz em texto (Whisper) com envio imediato.
* **Síntese de Fala (TTS):** Respostas em áudio de alta fidelidade integradas à conversa.
* **Controle Executivo:** Comando de voz nativo capaz de abrir utilitários locais e rodar tarefas do sistema sem barreiras.

### 🤖 Agent Studio (Agentes Especialistas)
Espaço de automação e colaboração multipartidária:
* **Debates em Tempo Real:** Coloque múltiplos agentes customizados para debater soluções técnicas sobre um mesmo tópico.
* **Menções Estilizadas:** Interface com autocomplete inteligente no chat para direcionar perguntas a agentes (`@Agente`) ou contatos (`@discord-user`).
* **Tarefas Físicas Autônomas:** Agentes planejam, propõem alterações em arquivos locais (`implementation_plan.md`) e escrevem código real no workspace após sua aprovação.

### 📋 Pipelines de Especificação Dinâmicos (Spec Pipeline)
Estruturação e organização de backlog orientada por IA:
* **Pipeline Guiado:** Fluxo automatizado onde quatro agentes sequenciais avaliam o PRD, criam especificações de requisitos, desenham a arquitetura técnica e planejam as tarefas de desenvolvimento.
* **Persistência de Negócio:** Gravação automática dos documentos de especificação no diretório `/docs` do repositório correspondente.
* **Criação de Cards no Trello:** Geração automática e atômica de tarefas associadas ao card de descobrimento diretamente no Kanban.

### 🗃️ Plugins & MCP (Model Context Protocol)
* **Marketplace Integrado:** Registro e inicialização visual de servidores MCP para expandir os recursos da IA com ferramentas externas (bancos de dados, buscas web, etc.).
* **Persistência Centralizada:** Servidores e presets salvos diretamente em nuvem/local de forma portável via MongoDB.

### 📑 Visualizador Rico de Documentos
* **Preview Inline:** Visualização gráfica de PDFs, planilhas Excel (.xlsx), arquivos Word (.docx), imagens e códigos Markdown integrados diretamente nas bolhas de chat com suporte a tabelas responsivas e ações rápidas.

---

## 🏗️ Arquitetura de Módulos

```text
src/
├── main/                       # Processo principal Electron (Node.js)
│   ├── handlers/               # IPCs de chat, trello, git, mcp e voz
│   ├── models/                 # Conectores de IA (OpenAI, Claude, Gemini, Ollama)
│   └── utils/                  # Banco de dados, crons, geradores de PDF/Excel
├── preload/                    # Bridge segura de comunicação IPC
└── renderer/                   # Interface em React 18 + TS + Tailwind
    └── src/
        ├── components/         # Modulados de chat, kanban, terminal e settings
        └── hooks/              # Gerenciadores de estado e hooks de áudio/voz
```

---

## 🚀 Instalação e Desenvolvimento

### Pré-requisitos
* Node.js 20+
* MongoDB (Atlas ou Local)

### Configuração Inicial
```bash
# Instalar dependências
npm install

# Iniciar ambiente de desenvolvimento
npm run dev
```

### Build para Distribuição
```bash
# Gerar executável para Windows
npm run build:win

# Gerar executável para macOS
npm run build:mac
```

---

## 🔒 Segurança e Governança de Código
O wOs preza pela integridade absoluta do repositório:
* **Validação por Etapas:** A IA só realiza modificações após o usuário validar o arquivo de plano de implementação.
* **Variáveis Dinâmicas:** Todas as credenciais de APIs (Tokens do Discord, MongoDB, chaves Trello) são mantidas em um store criptografado local do usuário, sem hardcodes no código-fonte.

---

## 📁 Arquivos Especiais na Raiz dos Projetos

O wOs prioriza estes arquivos para construção de contexto (em ordem de prioridade):

| Arquivo | Propósito |
|---------|-----------|
| `sdd.md` / `SDD.md` | Software Design Document |
| `skill.md` / `SKILL.md` | Instruções específicas de comportamento para a IA |
| `roles.md` / `ROLES.md` | Papéis e responsabilidades da equipe |
| `README.md` | Visão geral do projeto (lida pelos agentes do Spec Pipeline) |
| `package.json` | Dependências e scripts |

---

## 📄 Documentação Técnica

A documentação técnica detalhada de cada feature e fix implementado está em:

👉 [auto-docs.md](./auto-docs.md)

---

*wOs — Desenvolvido e mantido pelo time da Tia Bete. Documentação atualizada em 2026-05-29.*
