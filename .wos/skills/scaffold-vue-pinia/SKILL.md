# Vue 3 + Vite + Pinia (Frontend Expert)

Estrutura profissional para aplicações Vue modernas usando Composition API e Pinia.

## 📁 Estrutura de Pastas

```text
/src
  /assets          # Imagens, globais CSS
  /components      # Componentes UI reutilizáveis
  /composables     # Lógica reutilizável (Composition API)
  /layouts         # Templates de layout (Default, Blank)
  /router          # Configuração do Vue Router
  /services        # Integrações com API (Axios instances)
  /stores          # State Management (Pinia)
  /views           # Componentes de página
  App.vue          # Componente raiz
  main.ts          # Entrada principal
```

## 🛠️ Comandos de Inicialização

1. **Criação**: `npm create vue@latest ./` - Selecione: TypeScript, Router, Pinia, ESLint, Prettier.
2. **Dependências Extras**: `npm install lucide-vue-next tailwindcss postcss autoprefixer`

## 📄 Boilerplate: src/stores/counter.ts (Setup Store)

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
```

## 📄 Boilerplate: src/App.vue (Modern Composition API)

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <header class="bg-indigo-600 text-white p-6 shadow-xl">
    <h1 class="text-2xl font-black uppercase tracking-tighter">wOs Vue Expert</h1>
  </header>

  <main class="p-10 flex flex-col items-center">
    <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
      <h2 class="text-gray-400 text-xs font-bold uppercase mb-2">Pinia State</h2>
      <p class="text-4xl font-black text-indigo-600">{{ counter.count }}</p>
      <button 
        @click="counter.increment"
        class="mt-6 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition"
      >
        Incrementar
      </button>
    </div>

    <RouterView />
  </main>
</template>
```
