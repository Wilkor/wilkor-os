import { matchWakeWordAndExtractCommand } from './utils/voiceMatcher';

export interface AudioActivationConfig {
  enabled: boolean;
  wakeWord: string;
  clapThreshold: number;
  clapMaxGapMs: number;
  cooldownMs: number;
}

let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let speechRecognition: any = null;

let isRunning = false;
let lastActivationTime = 0;
let lastClapTime = 0;

export async function initAudioActivation(
  config: AudioActivationConfig,
  onActivate: (command?: string) => void,
  onError?: (errText: string) => void
) {
  if (isRunning) {
    stopAudioActivation();
  }

  if (!config.enabled) {
    return;
  }

  isRunning = true;

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('[AudioActivation] Microfone capturado com sucesso!');
    
    mediaStream.getAudioTracks().forEach(track => {
      console.log(`[AudioActivation] Track detectada: label="${track.label}", ativa=${track.enabled}, estado=${track.readyState}`);
    });
    
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const resumeAudio = () => {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('[AudioActivation] AudioContext ativado com sucesso via gesto.');
        }).catch(err => console.error('[AudioActivation] Erro ao ativar AudioContext:', err));
      }
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);

    const source = audioContext.createMediaStreamSource(mediaStream);
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const speechThreshold = 0.04; // volume mínimo para detectar fala (0.00 a 1.00)
    let lastLogTime = 0;

    const handleVoiceVAD = (amplitude: number) => {
      const isVoiceActive = amplitude > speechThreshold;
      window.dispatchEvent(new CustomEvent('wos-vad-volume', { 
        detail: { 
          volume: amplitude, 
          threshold: speechThreshold,
          recording: isVoiceActive
        } 
      }));

      const now = Date.now();
      if (now - lastLogTime > 4000) {
        console.log(`[AudioActivation] VAD Monitor: volume=${amplitude.toFixed(4)}, limiar=${speechThreshold}`);
        lastLogTime = now;
      }
    };

    // Inicialização da Web Speech API nativa e gratuita do Chromium
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognition = new SpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'pt-BR';

      speechRecognition.onstart = () => {
        console.log('[AudioActivation] SpeechRecognition nativo iniciado (escutando...)');
      };

      speechRecognition.onresult = (event: any) => {
        const lastResultIndex = event.resultIndex;
        const transcript = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
        console.log(`[AudioActivation] Transcrição nativa: "${transcript}"`);
        
        const cleanedCommand = matchWakeWordAndExtractCommand(transcript, config);
        if (cleanedCommand) {
          console.log(`[AudioActivation] Wake word encontrada! Executando comando: "${cleanedCommand}"`);
          onActivate(cleanedCommand);
        } else {
          console.log(`[AudioActivation] Nenhuma wake word em: "${transcript}"`);
        }
      };

      speechRecognition.onerror = (event: any) => {
        console.error('[AudioActivation] Erro no SpeechRecognition nativo:', event.error);
      };

      speechRecognition.onend = () => {
        console.log('[AudioActivation] SpeechRecognition nativo finalizado.');
        // Se o recurso ainda estiver ativo, reinicia automaticamente para manter a escuta contínua
        if (isRunning && speechRecognition) {
          try {
            speechRecognition.start();
          } catch (e) {
            // Pode já estar em execução
          }
        }
      };

      try {
        speechRecognition.start();
      } catch (e) {
        console.error('[AudioActivation] Falha ao iniciar SpeechRecognition:', e);
      }
    } else {
      console.warn('[AudioActivation] Web Speech API não suportada neste ambiente.');
      if (onError) {
        onError('Reconhecimento de voz nativo não suportado.');
      }
    }

    const mainLoop = () => {
      if (!isRunning) return;

      analyser.getByteTimeDomainData(dataArray);

      let maxAmplitude = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = Math.abs((dataArray[i] - 128) / 128);
        if (val > maxAmplitude) {
          maxAmplitude = val;
        }
      }

      if (maxAmplitude > config.clapThreshold) {
        const now = Date.now();
        if (now - lastActivationTime > config.cooldownMs) {
          if (lastClapTime > 0 && now - lastClapTime <= config.clapMaxGapMs) {
            console.log('[AudioActivation] Duas palmas detectadas! Amplitude:', maxAmplitude);
            lastActivationTime = now;
            lastClapTime = 0;
            onActivate();
          } else if (now - lastClapTime > config.clapMaxGapMs) {
            console.log('[AudioActivation] Primeira palma detectada. Amplitude:', maxAmplitude);
            lastClapTime = now;
          }
        }
      }

      handleVoiceVAD(maxAmplitude);

      requestAnimationFrame(mainLoop);
    };

    mainLoop();

  } catch (err: any) {
    console.error('[AudioActivation] Falha ao iniciar áudio:', err);
    isRunning = false;
    if (onError) {
      onError(`Falha ao capturar microfone: ${err.message || err}`);
    }
  }
}

export function stopAudioActivation() {
  isRunning = false;
  
  if (audioContext) {
    try {
      audioContext.close();
    } catch (e) {}
    audioContext = null;
  }
  
  if (speechRecognition) {
    try {
      speechRecognition.stop();
    } catch (e) {}
    speechRecognition = null;
  }

  window.dispatchEvent(new CustomEvent('wos-vad-recording', { detail: { recording: false } }));
  
  if (mediaStream) {
    try {
      mediaStream.getTracks().forEach(track => track.stop());
    } catch (e) {}
    mediaStream = null;
  }
}
