# Rust + Axum Expert Scaffold (Backend Expert)

Estrutura profissional para APIs de alta performance e segurança de memória usando Rust 1.75+.

## 📁 Estrutura de Pastas

```text
/src
  /api             # Handlers (Controllers) e Routas
  /config          # Configurações do App (Env, Settings)
  /db              # Camada de Dados (SQLx connections, Models)
  /domain          # Entidades de Domínio e Erros
  /middleware      # Middlewares (Auth, Logging)
  /services        # Lógica de Negócio
  main.rs          # Entrada principal do servidor
Cargo.toml
.env
Dockerfile
```

## 🛠️ Comandos de Inicialização

1. **Init**: `cargo init`
2. **Dependências**: Adicione ao `Cargo.toml`:
   - `axum`, `tokio`, `serde`, `sqlx`, `dotenvy`, `jsonwebtoken`
3. **Execução**: `cargo run`

## 📄 Boilerplate: src/main.rs

```rust
use axum::{routing::get, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    // Inicializa Logging/Tracing
    tracing_subscriber::fmt::init();

    // Define App Router
    let app = Router::new()
        .route("/", get(|| async { "wOs Rust Expert API is LIVE" }))
        .route("/health", get(health_handler));

    // Serve o App
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Servidor rodando em {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn health_handler() -> &'static str {
    "{\"status\": \"healthy\"}"
}
```

## 📄 Boilerplate: src/domain/error.rs

```rust
use axum::{http::StatusCode, response::{IntoResponse, Response}, Json};
use serde_json::json;

pub enum AppError {
    Unauthorized,
    NotFound,
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, msg) = match self {
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            AppError::NotFound => (StatusCode::NOT_FOUND, "Not Found"),
            AppError::Internal(e) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error"),
        };

        let body = Json(json!({ "error": msg }));
        (status, body).into_response()
    }
}
```
