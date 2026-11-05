import React from 'react';
import { Loader2 } from 'lucide-react';
import { useDiscordPRAlert } from '../hooks/useDiscordPRAlert';

interface PRDiscordButtonProps {
  pr: any;
  quality: any;
  setFeedback: (fb: { isOpen: boolean; type: 'success' | 'error'; title: string; message: string }) => void;
}

export const PRDiscordButton: React.FC<PRDiscordButtonProps> = ({
  pr,
  quality,
  setFeedback
}) => {
  const { sendAlert, sendingAlert, hasBeenNotified } = useDiscordPRAlert();

  const handleSendDiscordAlert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await sendAlert(pr, quality);
    setFeedback({
      isOpen: true,
      type: res.success ? 'success' : 'error',
      title: res.title,
      message: res.message
    });
  };

  const notified = hasBeenNotified(pr);

  return (
    <button
      onClick={handleSendDiscordAlert}
      disabled={sendingAlert || notified}
      title={notified ? `Alerta já enviado no Discord para @${pr.author}` : `Notificar @${pr.author} no Discord`}
      className="flex items-center justify-center p-2 rounded-lg border hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:hover:scale-100"
      style={{
        backgroundColor: notified ? 'rgba(16, 185, 129, 0.05)' : 'rgba(88, 101, 242, 0.08)',
        borderColor: notified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(88, 101, 242, 0.15)',
        color: notified ? '#10b981' : '#5865F2',
        cursor: notified ? 'not-allowed' : 'pointer'
      }}
    >
      {sendingAlert ? (
        <Loader2 size={12} className="animate-spin" />
      ) : notified ? (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5A51.31,51.31,0,0,0,30,78a75.76,75.76,0,0,0,67.15,0,51.31,51.31,0,0,0,1.9,2.5,68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129,54.65,122.94,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
        </svg>
      )}
    </button>
  );
};
