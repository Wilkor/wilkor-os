import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, MicOff, Square, Music, FileText, X, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { ContextIndicator } from '../ContextIndicator';
import { AgentActivityPanel } from '../AgentActivityPanel';
import { AutocompleteDropdown } from './AutocompleteDropdown';
import { ImagePreviewOverlay } from './ImagePreviewOverlay';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  attachments: any[];
  contextChars: number;
  maxContext: number;
  agentActivities: any[];
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleSendMessage: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveAttachment: (name: string) => void;
  handleToggleRecording: () => void;
  handleStopGeneration: () => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  handleAcceptAllActivities: () => void;
  handleRejectAllActivities: () => void;
  handleApplyAgentActivity: (id: string) => void;
  handleRejectAgentActivity: (id: string) => void;
  handleUndoAgentActivity: (id: string) => void;
  activeModelName?: string;
  isVoiceModeEnabled?: boolean;
  setIsVoiceModeEnabled?: (enabled: boolean) => void;
  isHandsFreeRecording?: boolean;
  isHandsFreeEnabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText, setInputText, isLoading, isRecording, attachments, contextChars, maxContext,
  agentActivities, textAreaRef, fileInputRef, handleSendMessage, handleFileSelect,
  handleRemoveAttachment, handleToggleRecording, handleStopGeneration, handlePaste,
  handleAcceptAllActivities, handleRejectAllActivities, handleApplyAgentActivity,
  handleRejectAgentActivity, handleUndoAgentActivity,
  isVoiceModeEnabled, setIsVoiceModeEnabled, isHandsFreeRecording, isHandsFreeEnabled
}) => {
  const [fullPreviewImage, setFullPreviewImage] = useState<string | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [suggestionsCount, setSuggestionsCount] = useState(0);

  const volumeIndicatorRef = useRef<HTMLDivElement>(null);
  const volumeTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleVolume = (e: Event) => {
      const customEvent = e as CustomEvent;
      const volume = customEvent.detail?.volume ?? 0;
      const threshold = customEvent.detail?.threshold ?? 0.04;
      if (volumeTextRef.current) volumeTextRef.current.innerText = `Vol: ${volume.toFixed(3)}`;
      if (volumeIndicatorRef.current) {
        const pct = Math.min(100, Math.max(0, (volume / (threshold * 2.5)) * 100));
        volumeIndicatorRef.current.style.width = `${pct}%`;
        volumeIndicatorRef.current.style.backgroundColor = volume > threshold ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.6)';
      }
    };
    window.addEventListener('wos-vad-volume', handleVolume);
    return () => window.removeEventListener('wos-vad-volume', handleVolume);
  }, []);

  const hasContent = inputText.trim() || attachments.length > 0;

  useEffect(() => {
    const match = inputText.match(/[\/@]([^\s]*)$/);
    setShowAutocomplete(!!match);
    setAutocompleteQuery(match ? match[0] : '');
    if (match) setSelectedIndex(0);
  }, [inputText]);

  const handleSelectAutocomplete = (value: string) => {
    setInputText(inputText.replace(/[\/@]([^\s]*)$/, value));
    setShowAutocomplete(false);
    setTimeout(() => textAreaRef.current?.focus(), 50);
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <ImagePreviewOverlay imageUrl={fullPreviewImage} onClose={() => setFullPreviewImage(null)} />

      <AnimatePresence>
        {agentActivities.some(a => a.status === 'pending') && (
          <AgentActivityPanel
            activities={agentActivities}
            onAcceptAll={handleAcceptAllActivities} onRejectAll={handleRejectAllActivities}
            onApplyAction={handleApplyAgentActivity} onRejectAction={handleRejectAgentActivity} onUndoAction={handleUndoAgentActivity}
          />
        )}
      </AnimatePresence>

      <div className="relative z-20 group/input">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 rounded-2xl blur opacity-0 group-focus-within/input:opacity-100 transition duration-1000"></div>
        
        <div className="relative bg-bg-panel/80 backdrop-blur-3xl rounded-3xl p-4 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-500 focus-within:bg-bg-panel border border-border focus-within:border-primary/20">
          
          {showAutocomplete && (
            <AutocompleteDropdown
              query={autocompleteQuery} onSelect={handleSelectAutocomplete}
              selectedIndex={selectedIndex} setSuggestionsCount={setSuggestionsCount}
            />
          )}

          {/* 1. Área de Arquivos (Top) */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border"
              >
                {attachments.map((att, i) => (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={att.name + i}
                    className={`flex items-center gap-2 ${att.type?.startsWith('image/') ? 'p-1' : 'px-3 py-2'} bg-border/10 border border-border rounded-2xl text-[10px] font-bold text-text-muted hover:bg-border/30 hover:text-text-main transition-all group/chip relative overflow-hidden`}
                  >
                    {att.type === 'internal' ? (
                      <FileText size={12} className="text-primary/60 ml-1" />
                    ) : att.type?.startsWith('image/') ? (
                      <div 
                        className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black/40 shrink-0 cursor-pointer active:scale-95 transition-transform"
                        onClick={() => setFullPreviewImage(att.content)}
                      >
                        <img src={att.content} alt={att.name} className="w-full h-full object-cover" />
                      </div>
                    ) : att.type?.startsWith('audio/') ? (
                      <Music size={12} className="text-purple-400/60 ml-1" />
                    ) : (
                      <FileText size={12} className="text-text-muted/40 ml-1" />
                    )}
                    {!att.type?.startsWith('image/') && <span className="truncate max-w-[140px] tracking-tight">{att.name}</span>}
                    <button 
                      onClick={() => handleRemoveAttachment(att.name)}
                      className={`ml-1 p-1.5 hover:bg-red-500/20 rounded-lg transition-colors ${att.type?.startsWith('image/') ? 'absolute top-1 right-1 bg-black/60 backdrop-blur-sm opacity-0 group-hover/chip:opacity-100 shadow-lg' : ''}`}
                    >
                      <X size={10} className="text-text-muted/40 group-hover/chip:text-red-400" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2. Área de Texto (Centro) */}
          <div className="flex-1 relative min-h-[44px]">
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
            <textarea
              ref={textAreaRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (textAreaRef.current) {
                  textAreaRef.current.style.height = 'auto';
                  textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 300)}px`;
                }
              }}
              onKeyDown={(e) => {
                if (showAutocomplete && suggestionsCount > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % suggestionsCount);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + suggestionsCount) % suggestionsCount);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowAutocomplete(false);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !showAutocomplete && (e.preventDefault(), handleSendMessage())}
              onPaste={handlePaste}
              placeholder="Pergunte qualquer coisa ao wOs agent"
              className="w-full bg-transparent text-[15px] text-text-main outline-none resize-none placeholder:text-text-muted/20 py-2 leading-relaxed font-medium tracking-tight no-scrollbar"
              rows={1}
            />
          </div>

          <div className="h-[1px] -mx-4 bg-border my-3.5" />

          {/* 3. Toolbar Inferior (Bottom) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-text-muted/40 hover:text-primary transition-all hover:bg-white/[0.04] rounded-2xl active:scale-90"
                title="Anexar arquivos"
              >
                <Plus size={20} />
              </button>
              
              <button
                onClick={handleToggleRecording}
                className={`p-2.5 transition-all rounded-2xl hover:bg-white/[0.04] active:scale-90 relative ${isRecording ? 'text-red-500' : 'text-text-muted/40 hover:text-primary'}`}
                title={isRecording ? "Parar gravação" : "Falar com wOs (J.A.R.V.I.S)"}
              >
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-2 bg-red-500 rounded-full"
                    />
                  )}
                </AnimatePresence>
                {isRecording ? <MicOff size={20} className="relative z-10" /> : <Mic size={20} className="relative z-10" />}
              </button>
              
              {setIsVoiceModeEnabled && (
                <button
                  onClick={() => setIsVoiceModeEnabled(!isVoiceModeEnabled)}
                  className={`p-2.5 transition-all rounded-2xl hover:bg-white/[0.04] active:scale-90 ${isVoiceModeEnabled ? 'text-primary' : 'text-text-muted/40 hover:text-primary'}`}
                  title={isVoiceModeEnabled ? "Respostas Faladas: Ligado" : "Respostas Faladas: Desligado"}
                >
                  {isVoiceModeEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              )}
              {isHandsFreeEnabled && (
                <>
                  <div className="w-[1px] h-5 bg-border mx-2" />
                  <div className="flex flex-col gap-1 min-w-[125px]">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/5 rounded-xl text-[9px] text-text-muted select-none">
                      {isHandsFreeRecording ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                          <span className="font-black uppercase tracking-wider text-red-500 text-[8px]">Capturando</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span className="font-bold uppercase tracking-wider text-emerald-500/70 text-[8px]">Ouvindo</span>
                        </>
                      )}
                      <span ref={volumeTextRef} className="ml-auto font-mono text-[7.5px] opacity-40 shrink-0">Vol: 0.000</span>
                    </div>
                    <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden relative">
                      <div 
                        ref={volumeIndicatorRef} 
                        className="absolute left-0 top-0 h-full w-0 bg-emerald-500 transition-all duration-75"
                        style={{ transitionProperty: 'width, background-color' }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center px-3.5 py-1.5 bg-border/10 border border-border rounded-2xl hover:bg-border/20 transition-all cursor-default text-[10px]">
                <ContextIndicator current={contextChars} max={maxContext} />
              </div>
              {isLoading ? (
                <button
                  onClick={handleStopGeneration}
                  className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10 group/stop"
                >
                  <Square size={16} fill="currentColor" className="group-hover:scale-90 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!hasContent}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 shadow-2xl ${hasContent ? 'bg-primary text-black scale-100 shadow-primary/20 hover:scale-110 active:scale-95' : 'bg-white/5 text-text-muted/10 scale-95 opacity-50'}`}
                >
                  <ArrowRight size={24} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
