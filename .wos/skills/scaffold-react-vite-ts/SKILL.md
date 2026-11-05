# React 19 + Vite + TypeScript (wOs Premium Scaffold)

Este guia define a estrutura e os arquivos iniciais para um projeto React moderno, otimizado para performance e escalabilidade (Clean Architecture).

## 📁 Estrutura de Pastas Recomendada

```text
/src
  /assets          # Imagens, fontes, etc.
  /components      # Componentes UI reutilizáveis (Shared)
    /ui            # Componentes base (Botões, Inputs - padrão Shadcn)
  /contexts        # Contextos React (State Management)
  /hooks           # Hooks customizados (useAuth, useFetch, etc)
  /layouts         # Layouts de página (MainLayout, AuthLayout)
  /pages           # Componentes de página (Views)
  /services        # Integrações com APIs (Axios/Fetch instances)
  /styles          # CSS global e temas
  /types           # Definições de tipos TypeScript
  /utils           # Funções utilitárias (formatters, cleaners)
  App.tsx          # Router e Wrappers globais
  main.tsx         # Ponto de entrada
```

## 🛠️ Comandos de Inicialização

1. **Criação**: `npm create vite@latest ./ -- --template react-ts`
2. **Dependências Core**: `npm install lucide-react framer-motion clsx tailwind-merge`
3. **Tailwind (se não presente)**: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`

## 📄 Boilerplate: src/App.tsx (Expert Edition)

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Adicione rotas aqui */}
      </Routes>
    </BrowserRouter>
  );
};

const Home = () => (
  <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
    <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
      wOs Premium Project
    </h1>
  </div>
);

export default App;
```

## 📄 Boilerplate: tailwind.config.js (Premium Theme)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        accent: "#8b5cf6",
        background: "#020617",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
```
