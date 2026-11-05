export interface VoiceMatcherConfig {
  wakeWord: string;
}

export function isWordBoundary(char: string): boolean {
  if (!char) return true;
  return !/[a-zA-Z0-9áàâãéèêíïóòôõúüçñí]/i.test(char);
}

export function matchWakeWordAndExtractCommand(
  transcript: string,
  config: VoiceMatcherConfig
): string | null {
  const configuredWakeWord = config.wakeWord.toLowerCase();
  const wakeWordVariants = [
    configuredWakeWord,
    'hey wos', 'hey wós', 'hey woz', 'hey wóz',
    'ei wos', 'ei wós', 'ei woz', 'ei wóz',
    'ok wos', 'ok wós', 'ok woz', 'ok wóz',
    'olá wos', 'olá wós', 'olá woz', 'olá wóz',
    'o ws é', 'o ws', 'o wos', 'o wós', 'o woz',
    'ws é', 'ws', 'w s', 'wos', 'wós', 'woz', 'wóz',
    'uos', 'uós', 'uoz', 'uóz', 'u os', 'uós', 'uóz',
    'góis', 'pois', 'was', 'wost'
  ];

  let matchedVariant = '';
  let matchedIndex = -1;

  for (const variant of wakeWordVariants) {
    const idx = transcript.indexOf(variant);
    if (idx !== -1) {
      const charBefore = idx > 0 ? transcript[idx - 1] : '';
      const charAfter = idx + variant.length < transcript.length ? transcript[idx + variant.length] : '';
      
      if (isWordBoundary(charBefore) && isWordBoundary(charAfter)) {
        if (matchedIndex === -1 || idx < matchedIndex) {
          matchedIndex = idx;
          matchedVariant = variant;
        }
      }
    }
  }

  if (matchedIndex === -1) {
    return null;
  }

  const rawCommand = transcript.slice(matchedIndex + matchedVariant.length).trim();
  
  // Limpa prefixos de ligação comuns em português brasileiro após a wake word
  let cleanedCommand = rawCommand;
  const linkPrefixes = [/^(é|e|para|pra|de|que|a|o)\s+/i, /^[,.?!-\s]+/];
  let changed = true;
  while (changed) {
    changed = false;
    for (const rx of linkPrefixes) {
      if (rx.test(cleanedCommand)) {
        cleanedCommand = cleanedCommand.replace(rx, '').trim();
        changed = true;
      }
    }
  }

  // Remove caracteres indesejados nas pontas novamente
  cleanedCommand = cleanedCommand.replace(/^[,.?!-\s]+|[,.?!-\s]+$/g, '');
  
  console.log(`[VoiceMatcher] Wake word detectada ("${matchedVariant}")! Comando extraído: "${cleanedCommand}"`);
  return cleanedCommand;
}
