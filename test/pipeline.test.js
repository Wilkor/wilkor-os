/**
 * pipeline.test.js
 * Testes unitários para o pipeline Spec-Driven.
 * Usa apenas o Node.js test runner nativo (sem dependências externas).
 * A função parseAgentResponse é replicada aqui pois o código fonte é TSX (browser).
 */
import test from 'node:test';
import assert from 'node:assert';

// ---------------------------------------------------------------------------
// Réplica da função parseAgentResponse de AgentOrchestrator.ts
// (necessária pois o fonte usa TSX com dependências de browser/Electron)
// ---------------------------------------------------------------------------
function parseAgentResponse(rawText) {
  const normalized = rawText.trim();
  const statusMatch = normalized.match(/^STATUS:\s*(APROVADO|INCOMPLETO)/i);

  if (!statusMatch) {
    return {
      status: 'APROVADO',
      content: rawText
    };
  }

  const status = statusMatch[1].toUpperCase();

  if (status === 'INCOMPLETO') {
    const questionsBlock = normalized.split(/PERGUNTAS:/i)[1] || '';
    const questions = questionsBlock
      .split('\n')
      .map(q => q.replace(/^\s*\d+\.\s*/, '').replace(/^\s*-\s*/, '').trim())
      .filter(q => q.length > 0);

    return {
      status,
      content: rawText,
      questions: questions.length > 0
        ? questions
        : ['Por favor, detalhe mais os requisitos para podermos continuar.']
    };
  }

  // APROVADO
  const afterStatus = normalized.replace(/^STATUS:\s*APROVADO/i, '').trim();
  const resMatch = afterStatus.match(/^RESUMO:\s*([\s\S]+)/i);
  const summary = resMatch ? resMatch[1].trim() : afterStatus.substring(0, 200);

  return {
    status,
    content: afterStatus,
    summary
  };
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------
test('Pipeline Spec-Driven - parseAgentResponse', async (t) => {
  await t.test('deve identificar o status APROVADO e extrair o conteúdo e resumo', () => {
    const rawInput = `STATUS: APROVADO
RESUMO: O PRD foi validado com sucesso.
## Épicos
- Épico 1: Gestão de Usuários`;

    const parsed = parseAgentResponse(rawInput);

    assert.strictEqual(parsed.status, 'APROVADO');
    assert.ok(parsed.summary.includes('O PRD foi validado'));
    assert.ok(parsed.content.includes('## Épicos'));
  });

  await t.test('deve identificar o status INCOMPLETO e extrair as perguntas corretamente', () => {
    const rawInput = `STATUS: INCOMPLETO
PERGUNTAS:
1. Qual é o perfil dos usuários-alvo?
2. Quais são as métricas de sucesso do projeto?`;

    const parsed = parseAgentResponse(rawInput);

    assert.strictEqual(parsed.status, 'INCOMPLETO');
    assert.ok(Array.isArray(parsed.questions));
    assert.strictEqual(parsed.questions.length, 2);
    assert.strictEqual(parsed.questions[0], 'Qual é o perfil dos usuários-alvo?');
    assert.strictEqual(parsed.questions[1], 'Quais são as métricas de sucesso do projeto?');
  });

  await t.test('deve retornar APROVADO como fallback se não houver tag de status', () => {
    const rawInput = `## Título
Isso é um documento markdown comum.`;

    const parsed = parseAgentResponse(rawInput);

    assert.strictEqual(parsed.status, 'APROVADO');
    assert.strictEqual(parsed.content, rawInput);
  });

  await t.test('deve retornar pergunta de fallback quando INCOMPLETO sem perguntas listadas', () => {
    const rawInput = `STATUS: INCOMPLETO
PERGUNTAS:`;

    const parsed = parseAgentResponse(rawInput);

    assert.strictEqual(parsed.status, 'INCOMPLETO');
    assert.ok(Array.isArray(parsed.questions));
    assert.strictEqual(parsed.questions.length, 1);
    assert.ok(parsed.questions[0].includes('detalhe mais'));
  });

  await t.test('deve funcionar com STATUS em letras minúsculas (case-insensitive)', () => {
    const rawInput = `status: aprovado
resumo: Funciona com minúsculas também.`;

    const parsed = parseAgentResponse(rawInput);
    assert.strictEqual(parsed.status, 'APROVADO');
  });
});
