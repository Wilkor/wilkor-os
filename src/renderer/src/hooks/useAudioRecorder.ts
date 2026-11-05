import { useState, useRef } from 'react';

interface UseAudioRecorderProps {
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  addToast: (msg: string, type: any) => void;
  handleSendMessage?: (overridePrompt?: string) => void;
}

export const useAudioRecorder = ({ setInputText, addToast, handleSendMessage }: UseAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const latestProps = useRef({ setInputText, addToast, handleSendMessage });
  latestProps.current = { setInputText, addToast, handleSendMessage };

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          if (window.api?.chat?.transcribe) {
            const resp = await window.api.chat.transcribe(arrayBuffer);
            if (resp.success && resp.text.trim()) {
              const transcribed = resp.text.trim();
              
              // Define o texto na UI imediatamente
              latestProps.current.setInputText(prev => {
                const newText = prev ? prev + " " + transcribed : transcribed;
                // Executa o envio garantindo que enviaremos o texto combinado
                setTimeout(() => {
                  if (latestProps.current.handleSendMessage) {
                     latestProps.current.handleSendMessage(newText);
                  }
                }, 50);
                return newText;
              });
            }
          }
          stream.getTracks().forEach(t => t.stop());
          setIsRecording(false);
        };
        recorder.start();
        setIsRecording(true);
      } catch (err) { 
        latestProps.current.addToast('Erro ao acessar microfone', 'error'); 
      }
    }
  };

  return {
    isRecording,
    handleToggleRecording
  };
};
