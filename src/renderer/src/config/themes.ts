export interface Theme {
  id: string;
  name: string;
  type: 'dark' | 'light';
  colors: {
    bgApp: string;
    bgSidebar: string;
    bgPanel: string;
    bgEditor: string;
    bgOverlay: string; // Novo: para modais e popups
    primary: string;
    primaryMuted: string;
    textMain: string;
    textMuted: string;
    textInverse: string; // Novo: texto que sempre deve ser claro (em botões primários)
    borderColor: string;
    selection: string;
    accent: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'wilkor-elite',
    name: 'Wilkor Elite',
    type: 'dark',
    colors: {
      bgApp: '#050505',
      bgSidebar: '#000000',
      bgPanel: '#080808',
      bgEditor: '#020202',
      bgOverlay: 'rgba(0, 0, 0, 0.7)',
      primary: '#00ffa6',
      primaryMuted: 'rgba(0, 255, 166, 0.15)',
      textMain: '#f8fafc',
      textMuted: '#94a3b8',
      textInverse: '#000000',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      selection: 'rgba(0, 255, 166, 0.3)',
      accent: '#00ffa6'
    }
  },
  {
    id: 'one-dark',
    name: 'One Dark Pro',
    type: 'dark',
    colors: {
      bgApp: '#21252b',
      bgSidebar: '#181a1f',
      bgPanel: '#282c34',
      bgEditor: '#282c34',
      bgOverlay: 'rgba(0, 0, 0, 0.6)',
      primary: '#61afef',
      primaryMuted: 'rgba(97, 175, 239, 0.15)',
      textMain: '#abb2bf',
      textMuted: '#5c6370',
      textInverse: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      selection: 'rgba(97, 175, 239, 0.3)',
      accent: '#c678dd'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    type: 'dark',
    colors: {
      bgApp: '#1e1f29',
      bgSidebar: '#191a21',
      bgPanel: '#282a36',
      bgEditor: '#282a36',
      bgOverlay: 'rgba(0, 0, 0, 0.7)',
      primary: '#bd93f9',
      primaryMuted: 'rgba(189, 147, 249, 0.15)',
      textMain: '#f8f8f2',
      textMuted: '#6272a4',
      textInverse: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      selection: 'rgba(189, 147, 249, 0.3)',
      accent: '#ff79c6'
    }
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    type: 'dark',
    colors: {
      bgApp: '#010409',
      bgSidebar: '#010409',
      bgPanel: '#0d1117',
      bgEditor: '#0d1117',
      bgOverlay: 'rgba(0, 0, 0, 0.7)',
      primary: '#58a6ff',
      primaryMuted: 'rgba(88, 166, 255, 0.15)',
      textMain: '#c9d1d9',
      textMuted: '#8b949e',
      textInverse: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      selection: 'rgba(88, 166, 255, 0.3)',
      accent: '#1f6feb'
    }
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    type: 'light',
    colors: {
      bgApp: '#f6f8fa',
      bgSidebar: '#f6f8fa',
      bgPanel: '#ffffff',
      bgEditor: '#ffffff',
      bgOverlay: 'rgba(0, 0, 0, 0.4)',
      primary: '#0969da',
      primaryMuted: 'rgba(9, 105, 218, 0.15)',
      textMain: '#1f2328',
      textMuted: '#57606a',
      textInverse: '#ffffff',
      borderColor: 'rgba(31, 35, 40, 0.15)',
      selection: 'rgba(9, 105, 218, 0.3)',
      accent: '#0969da'
    }
  }
];

