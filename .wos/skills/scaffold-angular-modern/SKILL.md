# Angular 19 Modern Scaffold (Frontend Expert)

Padrão profissional para aplicações corporativas usando Standalone Components e Signals.

## 📁 Estrutura de Pastas

```text
/src
  /app
    /core           # Singleton services, guards, interceptors
    /shared         # Shared components, directives, pipes
    /features       # Modules ou pastas por funcionalidade (Ducks pattern)
    /models         # Interfaces e classes de dados
    app.config.ts   # Configuração standalone
    app.routes.ts   # Definição de rotas
  /assets           # Arquivos estáticos
  /environments     # Variáveis de ambiente
  styles.css        # CSS Global + Tailwind imports
```

## 🛠️ Comandos de Inicialização

1. **Instalação CLI**: `npm install -g @angular/cli`
2. **Criação**: `ng new project-name --standalone --routing --style css`
3. **Tailwind**: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init`

## 📄 Boilerplate: src/app/app.config.ts

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
  ]
};
```

## 📄 Boilerplate: src/app/app.component.ts (Standalone + Signals)

```typescript
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 class="text-4xl font-bold text-red-600">Angular 19 + Standalone</h1>
      <p class="mt-4 text-gray-600">Contador com Signals: {{ count() }}</p>
      <button (click)="increment()" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Incrementar
      </button>
    </div>
  `,
})
export class AppComponent {
  count = signal(0);

  increment() {
    this.count.update(v => v + 1);
  }
}
```
