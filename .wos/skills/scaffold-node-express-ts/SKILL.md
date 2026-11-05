# Node.js + Express + TypeScript (Backend Expert Scaffold)

Estrutura profissional para APIs REST escaláveis usando TypeScript e padrões de arquitetura limpa.

## 📁 Estrutura de Pastas (Clean Architecture)

```text
/src
  /config          # Variáveis de ambiente e configs globais
  /controllers     # Camada de entrada (HTTP handlers)
  /middlewares     # Middlewares (Auth, Error Handling, Validation)
  /models          # Definições de dados (Interfaces/Schemas)
  /repositories    # Camada de acesso a dados (DB Queries)
  /routes          # Definição das rotas
  /services        # Lógica de negócio (Use Cases)
  /utils           # Helpers e funções utilitárias
  app.ts           # Configuração do servidor Express
  server.ts        # Ponto de entrada (Listen)
```

## 🛠️ Comandos de Inicialização

1. **Setup Inicial**: `npm init -y`
2. **Dependências**: `npm install express dotenv cors zod prisma @prisma/client`
3. **Dev Deps**: `npm install -D typescript @types/node @types/express @types/cors ts-node-dev rimraf`
4. **Init TS**: `npx tsc --init`
5. **Init Prisma**: `npx prisma init`

## 📄 Boilerplate: src/app.ts

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import { errorMiddleware } from './middlewares/error.middleware';
import routes from './routes';

const app: Application = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorMiddleware);

export default app;
```

## 📄 Boilerplate: src/middlewares/validation.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: any) {
    return res.status(400).json({ error: error.errors });
  }
};
```

## 📄 Boilerplate: package.json (Scripts)

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "rimraf dist && tsc",
  "start": "node dist/server.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev"
}
```
