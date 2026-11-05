# Go + Gin Expert Scaffold (Golang Backend)

Estrutura profissional seguindo padrões de Clean Architecture para APIs escaláveis.

## 📁 Estrutura de Pastas

```text
/cmd
  /api             # Ponto de entrada (main.go)
/internal
  /api
    /handler       # HTTP Handlers (Controllers)
    /middleware    # Middlewares (Auth, Logger)
  /domain          # Entidades e Interfaces de Domínio
  /repository      # Implementação de acesso a dados (SQL, NoSQL)
  /service         # Lógica de negócio (Use Cases)
/pkg
  /database        # Conectores de banco de dados
  /util            # Helpers genéricos
go.mod
go.sum
.env
```

## 🛠️ Comandos de Inicialização

1. **Init**: `go mod init github.com/username/projectname`
2. **Dependências**: `go get -u github.com/gin-gonic/gin gorm.io/gorm github.com/joho/godotenv`
3. **Execução**: `go run cmd/api/main.go`

## 📄 Boilerplate: cmd/api/main.go

```go
package main

import (
	"log"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "up",
			"server": "wOs Go Expert",
		})
	})

	log.Fatal(r.Run(":8080"))
}
```

## 📄 Boilerplate: internal/api/middleware/auth.go

```go
package middleware

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}
		c.Next()
	}
}
```
