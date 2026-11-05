import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { THEMES } from '../config/themes'

interface TerminalInstanceProps {
  id: string;
  isActive: boolean;
  themeId?: string;
}

export default function TerminalInstance({ id, isActive, themeId }: TerminalInstanceProps): React.JSX.Element {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const isActiveRef = useRef(isActive)

  // Sincroniza o ref com a prop sem disparar o useEffect principal
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const getTerminalTheme = (tid?: string) => {
    const theme = THEMES.find(t => t.id === tid) || THEMES[0];
    const isLight = theme.type === 'light';
    
    return {
      background: theme.colors.bgEditor, // Sincroniza fundo explicitamente
      foreground: theme.colors.textMain,
      cursor: theme.colors.primary,
      cursorAccent: theme.colors.bgApp,
      selectionBackground: theme.colors.selection,
      // Cores ANSI ajustadas para contraste no fundo claro
      black: isLight ? '#24292f' : '#1a1a1a',
      red: isLight ? '#cf222e' : '#ff5555',
      green: isLight ? '#1a7f37' : '#50fa7b',
      yellow: isLight ? '#9a6700' : '#f1fa8c',
      blue: isLight ? '#0969da' : '#61afef',
      magenta: isLight ? '#8250df' : '#bd93f9',
      cyan: isLight ? '#1b7c83' : '#00ffaa',
      white: isLight ? '#6e7781' : '#f8f8f2',
      brightBlack: isLight ? '#57606a' : '#4d4d4d',
      brightRed: isLight ? '#a40e26' : '#ff6e6e',
      brightGreen: isLight ? '#116329' : '#69ff94',
      brightYellow: isLight ? '#b08800' : '#ffffa5',
      brightBlue: isLight ? '#218bff' : '#d6acff',
      brightMagenta: isLight ? '#a475f9' : '#ff92df',
      brightCyan: isLight ? '#3192aa' : '#a4ffff',
      brightWhite: isLight ? '#24292f' : '#ffffff',
    };
  };

  useEffect(() => {
    if (!terminalRef.current) return

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      allowTransparency: false,
      disableStdin: false,
      theme: getTerminalTheme(themeId),
      fontSize: 13,
      lineHeight: 1.4,
      letterSpacing: 0,
      fontFamily: '"JetBrains Mono", "Cascadia Code", Menlo, Monaco, Consolas, "Courier New", monospace',
      scrollback: 5000,
      convertEol: false,
    })


    const fitAddon = new FitAddon()
    fitAddonRef.current = fitAddon
    term.loadAddon(fitAddon)
    
    // Só abre se o elemento estiver visível e tiver dimensões
    if (terminalRef.current && terminalRef.current.offsetWidth > 0) {
      term.open(terminalRef.current)
    }

    // Redimensionamento responsivo
    const handleResize = () => {
      if (!isActiveRef.current || !terminalRef.current || terminalRef.current.offsetWidth === 0 || terminalRef.current.offsetHeight === 0) return;
      
      try {
        const term = xtermRef.current;
        if (!term) return;

        if (!term.element && terminalRef.current.offsetWidth > 0) {
          term.open(terminalRef.current);
        }
        
        if (!term.element) return;

        // Pequeno delay para garantir que o DOM renderizou as dimensões (especialmente durante animações)
        setTimeout(() => {
          if (fitAddonRef.current && term.element && terminalRef.current && terminalRef.current.offsetWidth > 0 && terminalRef.current.offsetHeight > 0) {
            try {
              // Verifica se o terminal ainda existe e está anexado
              if (term.element.parentElement) {
                fitAddonRef.current.fit();
                if (window.api?.terminal) {
                  window.api.terminal.resize(id, term.cols, term.rows);
                }
              }
            } catch (e) {
              // Silencia erros de dimensões temporários durante animações de redimensionamento
            }
          }
        }, 100); // Aumentado para 100ms para ser mais seguro contra animações do Framer Motion
      } catch (err) {
        // Ignora silenciosamente erros de resize em estados transitórios
      }
    };


    // Ajuste inicial
    requestAnimationFrame(() => {
      handleResize();
    });

    // Receber dados do backend e exibir no xterm
    const channel = `terminal:data:${id}`;
    let listener: ((_event: any, data: string) => void) | null = null;

    if ((window as any).electron?.ipcRenderer) {
      listener = (_event: any, data: string) => {
        term.write(data);
      };
      (window as any).electron.ipcRenderer.on(channel, listener);
    }

    // Enviar input do usuário direto para o backend (SEM echo local)
    term.onData((data) => {
      if (window.api?.terminal) {
        window.api.terminal.input(id, data);
      }
    })

    xtermRef.current = term

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(handleResize);
    })
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current)
    }

    return () => {
      if (listener && (window as any).electron?.ipcRenderer) {
        (window as any).electron.ipcRenderer.removeListener(channel, listener);
      }
      resizeObserver.disconnect()
      term.dispose()
    }
  }, [id])

  // Atualizar tema dinamicamente sem recriar o terminal
  useEffect(() => {
    if (xtermRef.current) {
      try {
        xtermRef.current.options.theme = getTerminalTheme(themeId)
      } catch (e) {
        console.warn('[Terminal] Theme update error:', e);
      }
    }
  }, [themeId])

  // Focar e redimensionar ao ficar ativo
    useEffect(() => {
      let timer: any;
      if (isActive && xtermRef.current && terminalRef.current) {
        const term = xtermRef.current;
        const container = terminalRef.current;

        timer = setTimeout(() => {
          try { 
            if (!term.element && container.offsetWidth > 0) {
              term.open(container);
            }
            if (term.element) {
              fitAddonRef.current?.fit();
              term.focus();
              // Notifica o backend sobre o novo tamanho
              if (window.api?.terminal) {
                window.api.terminal.resize(id, term.cols, term.rows);
              }
            }
          } catch (_) {}
        }, 100);
      }
      return () => {
        if (timer) clearTimeout(timer);
      };
    }, [isActive, id]);

  return (
    <div
      className={`h-full w-full ${isActive ? 'flex' : 'hidden'} flex-col`}
      onClick={() => xtermRef.current?.focus()}
    >
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  )
}
