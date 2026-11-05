# Java Spring Boot Expert Scaffold (Backend Expert)

Estrutura profissional para microsserviços e aplicações corporativas robustas usando Spring Boot 3.x e Java 21.

## 📁 Estrutura de Pastas (Maven Standard)

```text
/src/main/java/com/example/api
  /config           # Configurações de Bean, Security, Swagger
  /controller       # Handlers HTTP (REST Endpoints)
  /dto              # Objetos de Transferência de Dados (Request/Response)
  /exception        # Manipulação global de erros
  /model            # Entidades JPA (Database Models)
  /repository       # Interfaces JpaRepository
  /service          # Lógica de negócio e interfaces
  ProjectApplication.java # Classe principal
/src/main/resources
  application.yml   # Configurações do ambiente
  /db/migration     # Migrations do Flyway/Liquibase
pom.xml             # Dependências Maven
Dockerfile
```

## 🛠️ Comandos de Inicialização

1. **Geração**: Use [Spring Initializr](https://start.spring.io/) ou `mn init` (Micronaut)
   - Dependências sugeridas: Spring Web, Spring Data JPA, H2/PostgreSQL, Lombok, Validation.
2. **Execução**: `./mvnw spring-boot:run`

## 📄 Boilerplate: application.yml

```yaml
spring:
  application:
    name: wos-expert-api
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/db}
    username: ${DATABASE_USER:user}
    password: ${DATABASE_PASS:pass}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
server:
  port: 8080
```

## 📄 Boilerplate: UserRestController.java (Modern Style)

```java
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserRestController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponseDTO> create(@RequestBody @Valid UserRequestDTO request) {
        return ResponseEntity.status(201).body(userService.save(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }
}
```
