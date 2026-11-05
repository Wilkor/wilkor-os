/**
 * Utilitário leve para validação e avaliação de expressões Cron de 5 campos.
 * Sintaxe suportada: <minuto> <hora> <dia_do_mes> <mes> <dia_da_semana>
 */

function matchCronField(value: number, pattern: string): boolean {
  if (pattern === '*') return true;

  // Listas (ex: 0,30,45)
  if (pattern.includes(',')) {
    return pattern.split(',').some(p => matchCronField(value, p));
  }

  // Intervalos com passos (ex: */5 ou 1-10/2)
  if (pattern.includes('/')) {
    const [rangePart, stepPart] = pattern.split('/');
    const stepVal = parseInt(stepPart, 10);
    if (isNaN(stepVal)) return false;

    if (rangePart === '*') {
      return value % stepVal === 0;
    }

    if (rangePart.includes('-')) {
      const [start, end] = rangePart.split('-').map(Number);
      if (value >= start && value <= end) {
        return (value - start) % stepVal === 0;
      }
      return false;
    }

    const startVal = parseInt(rangePart, 10);
    return !isNaN(startVal) && value >= startVal && (value - startVal) % stepVal === 0;
  }

  // Intervalos simples (ex: 1-5)
  if (pattern.includes('-')) {
    const [start, end] = pattern.split('-').map(Number);
    return value >= start && value <= end;
  }

  // Valores exatos
  return parseInt(pattern, 10) === value;
}

/**
 * Verifica se a data fornecida coincide com a expressão Cron especificada.
 */
export function matchesCron(cron: string, date: Date = new Date()): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [min, hour, dom, mon, dow] = parts;

  // JS getDay(): 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  // Cron getDay(): 0 ou 7 = Domingo, 1 = Segunda, ..., 6 = Sábado. Vamos normalizar para 0-6.
  const currentDow = date.getDay();
  let normalizedDowPattern = dow;
  if (dow === '7') {
    normalizedDowPattern = '0';
  }

  return (
    matchCronField(date.getMinutes(), min) &&
    matchCronField(date.getHours(), hour) &&
    matchCronField(date.getDate(), dom) &&
    matchCronField(date.getMonth() + 1, mon) && // JS meses são 0-11
    matchCronField(currentDow, normalizedDowPattern)
  );
}
