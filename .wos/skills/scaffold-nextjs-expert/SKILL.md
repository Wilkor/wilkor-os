# Next.js 15 Expert Scaffold (wOs Edition)

Este é o padrão ouro para aplicações full-stack de alta performance usando o App Router.

## 📁 Estrutura de Pastas (App Router)

```text
/src
  /app             # Rotas, Layouts e Server Components
    /api           # API Routes (Route Handlers)
    /(auth)        # Grupo de rotas de autenticação (sem prefixo na URL)
    /(dashboard)   # Grupo de rotas do painel principal
    /layout.tsx    # Root Layout (Providers, Fontes)
    /page.tsx      # Home Page
  /components      # Componentes (Client & Server)
    /ui            # Shadcn/UI primitives
    /shared        # Componentes reutilizáveis do negócio
  /lib             # Clientes (Prisma, Supabase, Redis) e Utilidades
  /hooks           # React Hooks (Client-side)
  /services        # Server Actions (Busca de dados, mutações)
  /store           # State Management (Zustand)
  /types           # Shared TypeScript definitions
```

## 🛠️ Comandos de Inicialização

1. **Criação**: `npx create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. **Componentes UI**: `npx shadcn-ui@latest init` - Siga os prompts (Slate/Zinc).
3. **State Management**: `npm install zustand`

## 📄 Boilerplate: src/app/layout.tsx

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "wOs Expert App",
  description: "Built with Next.js and Artificial Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## 📄 Boilerplate: next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // serverActions: true, // Já habilitado por padrão na v15
  },
  images: {
    domains: ["images.unsplash.com"],
  },
};

export default nextConfig;
```
