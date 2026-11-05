---
type: workflow
name: backend-agent
trigger: "backend|api|rota|endpoint|database|query"
---

# Workflow: Desenvolvimento Backend Sênior

Este fluxo deve ser seguido para qualquer implementação de lógica de servidor.

## Passo 1: Design da API
- Definir o recurso e a operação (REST).
- Determinar o path e o método HTTP.
- Definir o contrato de entrada (params, query, body) e saída.

## Passo 2: Otimização de Banco de Dados
- Identificar a coleção e os campos de busca.
- **Ação:** Verificar se existe índice para os filtros.
- **Regra:** Criar índice se `executionTimeMillis > 100`.

## Passo 3: Implementação Robusta
- Usar o template padrão de rota com `try/catch`.
- Aplicar validação de input logo no início.
- **Implementar Projeção:** Nunca buscar dados desnecessários.

```javascript
// Template Base
router.get('/path', (req, res) => {
  try {
    // Validar req.params/query
    // Executar query com { projection: { ... } }
    // Retornar res.json()
  } catch (err) {
    console.error('[ERRO][BACKEND]', err);
    res.status(500).json({ error: true, userMessage: 'Falha na operação' });
  }
});
```

## Passo 4: Auditoria de Segurança
- [ ] Rate limit configurado?
- [ ] Autenticação/Autorização validada?
- [ ] Input sanitizado?
- [ ] Payload de saída não contém dados sensíveis?

## Passo 5: Documentação
- Gerar registro em `docs/features/YYYY-MM-DD-[nome].md`.
