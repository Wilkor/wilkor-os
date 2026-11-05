# Correção de Build (Unused Variable)

**Data:** 2026-04-09
**Tipo:** bugfix
**Autor:** IA + Wilkor

## O que foi feito
Resolvido o erro de compilação `error TS6133: 'signal' is declared but its value is never read`. A variável foi renomeada para `_signal` para silenciar o alerta do TypeScript, permitindo que o comando `npm run build` avance.

## Arquivos alterados
- `src/main/terminal.ts`

## Como testar
1. Execute novamente `npm run build`. O erro na linha 67 do terminal não deve mais aparecer.
