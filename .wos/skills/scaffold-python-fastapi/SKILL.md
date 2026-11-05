# FastAPI Expert Scaffold (Python Backend)

Estrutura profissional para APIs assíncronas de alta performance usando Python 3.11+.

## 📁 Estrutura de Pastas

```text
/app
  /api             # Endpoints (Routes)
    /v1            # Versionamento da API
  /core            # Configurações globais (Auth, Config, Security)
  /db              # Base de dados (Session, Models, Migrations)
  /schemas         # Pydantic Schemas (Request/Response)
  /services        # Lógica de negócio
  /tests           # Testes automatizados (Pytest)
  main.py          # Ponto de entrada (App initialization)
/alembic           # Configuração de migrations
Dockerfile
docker-compose.yml
requirements.txt
```

## 🛠️ Comandos de Inicialização

1. **Ambiente Virtual**: `python -m venv venv`
2. **Ativação**: `source venv/bin/activate` (Linux/Mac) ou `venv\Scripts\activate` (Windows)
3. **Dependências**: `pip install fastapi uvicorn sqlalchemy pydantic-settings alembic psycopg2-binary`
4. **Execução**: `uvicorn app.main:app --reload`

## 📄 Boilerplate: app/main.py

```python
from fastapi import FastAPI
from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "wOs Expert API is running"}
```

## 📄 Boilerplate: app/core/config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tia Bete API"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/db"

    class Config:
        case_sensitive = True

settings = Settings()
```

## 📄 Boilerplate: Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY ./app /app/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
