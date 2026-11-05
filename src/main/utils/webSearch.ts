import axios from 'axios';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchOptions {
  tavilyKey?: string;
  braveKey?: string;
  googleKey?: string;
  googleCx?: string;
  limit?: number;
}

/**
 * Realiza busca na internet utilizando os provedores configurados (Tavily, Brave, Google)
 * ou realiza um fallback seguro para DuckDuckGo Lite se nenhuma credencial estiver disponível.
 */
export async function searchInternet(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const limit = options.limit || 5;

  // 1. Tavily (Prioridade Máxima)
  if (options.tavilyKey && options.tavilyKey.trim()) {
    try {
      const response = await axios.post(
        'https://api.tavily.com/search',
        {
          api_key: options.tavilyKey.trim(),
          query: query,
          search_depth: 'basic',
          max_results: limit
        },
        { timeout: 8000 }
      );
      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results.map((r: any) => ({
          title: r.title || 'Sem título',
          url: r.url || '',
          snippet: r.content || ''
        }));
      }
    } catch (err: any) {
      console.warn('[WebSearch] Falha ao buscar no Tavily:', err.message);
    }
  }

  // 2. Brave Search
  if (options.braveKey && options.braveKey.trim()) {
    try {
      const response = await axios.get(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': options.braveKey.trim()
          },
          timeout: 8000
        }
      );
      if (response.data && response.data.web?.results) {
        return response.data.web.results.map((r: any) => ({
          title: r.title || 'Sem título',
          url: r.url || '',
          snippet: r.description || ''
        }));
      }
    } catch (err: any) {
      console.warn('[WebSearch] Falha ao buscar no Brave:', err.message);
    }
  }

  // 3. Google Custom Search
  if (options.googleKey && options.googleKey.trim() && options.googleCx && options.googleCx.trim()) {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/customsearch/v1?key=${options.googleKey.trim()}&cx=${options.googleCx.trim()}&q=${encodeURIComponent(
          query
        )}&num=${limit}`,
        { timeout: 8000 }
      );
      if (response.data && Array.isArray(response.data.items)) {
        return response.data.items.map((r: any) => ({
          title: r.title || 'Sem título',
          url: r.link || '',
          snippet: r.snippet || ''
        }));
      }
    } catch (err: any) {
      console.warn('[WebSearch] Falha ao buscar no Google Custom Search:', err.message);
    }
  }

  // 4. Fallback: DuckDuckGo Lite (POST request)
  try {
    const params = new URLSearchParams();
    params.append('q', query);

    const response = await axios.post('https://lite.duckduckgo.com/lite/', params.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      },
      timeout: 8000
    });

    const html = response.data;

    // Se o DDG bloqueou com desafio de Captcha
    if (html.includes('Unfortunately, bots use DuckDuckGo too') || html.includes('captcha')) {
      throw new Error('Bloqueio de bot detectado no DuckDuckGo Lite.');
    }

    const results: SearchResult[] = [];
    // O HTML do DDG Lite possui tabelas onde cada resultado tem classe ou tags específicas.
    // Vamos procurar por links com href que não sejam locais
    // Regex para pegar os blocos ou links de resultados no DDG Lite:
    const linkRegExp = /<a class="result-link" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRegExp = /<td class="result-snippet">([\s\S]*?)<\/td>/g;

    let linkMatch;
    while ((linkMatch = linkRegExp.exec(html)) !== null && results.length < limit) {
      const url = linkMatch[1];
      const title = linkMatch[2].replace(/<[^>]*>/g, '').trim();

      // Encontrar o snippet correspondente (próxima ocorrência de result-snippet)
      const snippetMatch = snippetRegExp.exec(html);
      const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';

      let cleanUrl = url;
      if (url.includes('uddg=')) {
        const parts = url.split('uddg=');
        if (parts[1]) {
          cleanUrl = decodeURIComponent(parts[1].split('&')[0]);
        }
      }

      // Validar se é uma URL externa
      if (cleanUrl.startsWith('http')) {
        results.push({
          title: title || 'Sem título',
          url: cleanUrl,
          snippet: snippet || 'Sem descrição'
        });
      }
    }

    if (results.length > 0) {
      return results;
    }
  } catch (err: any) {
    console.warn('[WebSearch] Fallback do DuckDuckGo Lite falhou:', err.message);
  }

  // 5. Fallback 2: API de respostas instantâneas do DuckDuckGo (Gratuita e sem bloqueio de robôs)
  try {
    const response = await axios.get(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { timeout: 6000 }
    );
    if (response.data) {
      const results: SearchResult[] = [];
      if (response.data.AbstractText) {
        results.push({
          title: response.data.Heading || query,
          url: response.data.AbstractURL || '',
          snippet: response.data.AbstractText
        });
      }
      if (Array.isArray(response.data.RelatedTopics)) {
        for (const topic of response.data.RelatedTopics) {
          if (topic.Text && topic.FirstURL && results.length < limit) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Tópico relacionado',
              url: topic.FirstURL,
              snippet: topic.Text
            });
          }
        }
      }
      if (results.length > 0) {
        return results;
      }
    }
  } catch (err: any) {
    console.warn('[WebSearch] Respostas rápidas do DuckDuckGo falharam:', err.message);
  }

  // Se tudo falhar, retorna um array com a informação de que a busca falhou e sugerindo configurar chaves
  return [
    {
      title: 'Aviso do Sistema wOs',
      url: 'wos://settings',
      snippet: 'Não foi possível completar a pesquisa na internet usando canais gratuitos/automáticos devido a captchas/limitações de requisições. Para habilitar pesquisas robustas e confiáveis, configure uma chave de API gratuita do Tavily ou Brave Search no painel "Ajustes > Serviços & APIs" do wOs, amigão!'
    }
  ];
}
