import React, { useRef, useState, useCallback, useEffect } from 'react';
import Vapi from '@vapi-ai/web';
import { Persona, TranscriptionEntry, CustomerData } from '../types';
import { WEBHOOK_URL } from '../constants';

// Vapi Credentials
const VAPI_PUBLIC_KEY = '0b4a6b67-3152-40bb-b29e-8272cfd98b3a';
const VAPI_ASSISTANT_ID = '67ceff6e-56e4-469f-8b04-851ef00dc479';

const AVATARS = {
  [Persona.MIA]: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100',
  [Persona.MIKE]: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100'
};

interface VoiceAssistantProps {
  onUpdateLead: (data: Partial<CustomerData>) => void;
  onSetEmergency: (active: boolean) => void;
  isSessionActive: boolean;
  onSessionChange: (active: boolean) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  onUpdateLead, 
  onSetEmergency, 
  isSessionActive, 
  onSessionChange 
}) => {
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const [activePersona, setActivePersona] = useState<Persona>(Persona.MIA);
  const [isConnecting, setIsConnecting] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Vapi instance
  useEffect(() => {
    vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);

    const vapi = vapiRef.current;

    vapi.on('call-start', () => {
      onSessionChange(true);
      setIsConnecting(false);
    });

    vapi.on('call-end', () => {
      onSessionChange(false);
      setIsConnecting(false);
    });

    vapi.on('message', (message: any) => {
      // Handle Transcripts
      if (message.type === 'transcript') {
        const role = message.role === 'assistant' ? 'model' : 'user';
        const text = message.transcript;
        
        setTranscription(prev => {
          // If the last message is from the same role, update it (Vapi sends partials)
          if (prev.length > 0 && prev[prev.length - 1].role === role && message.transcriptType === 'partial') {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], text };
            return updated;
          }
          // If it's a new final transcript or the first message
          if (message.transcriptType === 'final') {
            const last = prev[prev.length - 1];
            if (last && last.role === role) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], text };
              return updated;
            }
            return [...prev, { role, text, persona: activePersona }];
          }
          // Placeholder for initial partial
          if (prev.length === 0 || prev[prev.length - 1].role !== role) {
            return [...prev, { role, text, persona: activePersona }];
          }
          return prev;
        });
      }

      // Handle Tool Calls (Function Calls) - Match these names in your Vapi Dashboard
      if (message.type === 'tool-calls') {
        for (const toolCall of message.toolCalls) {
          const { name, args } = toolCall.function;

          if (name === 'set_emergency_status') {
            const isEmergency = !!args.active;
            onSetEmergency(isEmergency);
            setActivePersona(isEmergency ? Persona.MIKE : Persona.MIA);
          }

          if (name === 'submit_lead') {
            onUpdateLead({
              name: args.name,
              phone: args.phone,
              heatingType: args.heatingType,
              unitAge: args.age,
              problemSummary: args.summary,
              isHotInstall: args.temp === 'HOT INSTALL'
            });
            
            // Forward to Webhook
            fetch(WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(args)
            }).catch(e => console.error('Webhook failed', e));
          }
        }
      }
    });

    vapi.on('error', (e: any) => {
      console.error('Vapi Error:', e);
      onSessionChange(false);
      setIsConnecting(false);
    });

    return () => {
      vapi.stop();
    };
  }, [onSessionChange, onSetEmergency, onUpdateLead, activePersona]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const startSession = async () => {
    if (isConnecting || isSessionActive) return;
    setIsConnecting(true);
    vapiRef.current?.start(VAPI_ASSISTANT_ID);
  };

  const stopSession = () => {
    vapiRef.current?.stop();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto space-y-6 mb-4 custom-scrollbar pr-2 scroll-smooth"
      >
        {transcription.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-inner">
                 <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                 </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Priority Line Open</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Caller Input</p>
            </div>
          </div>
        ) : (
          transcription.map((entry, i) => {
            const isUser = entry.role === 'user';
            const persona = entry.persona || activePersona;
            const isMike = persona === Persona.MIKE;
            const textLower = entry.text.toLowerCase();
            const isSafetyProtocol = isMike && (
              textLower.includes('911') || 
              textLower.includes('leave the house') || 
              textLower.includes('hang up')
            );
            
            return (
              <div key={i} className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500`}>
                <div className="flex-shrink-0 mt-1">
                  {isUser ? (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={AVATARS[persona]} 
                        alt={persona}
                        className={`w-10 h-10 rounded-full border-2 object-cover shadow-md ${
                          isSafetyProtocol ? 'border-red-500 animate-pulse' : isMike ? 'border-slate-800' : 'border-[#E31937]'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      isUser ? 'text-[#6B7280]' : 
                      isSafetyProtocol ? 'text-red-600 font-extrabold' :
                      isMike ? 'text-slate-900' : 'text-[#E31937]'
                    }`}>
                      {isUser ? 'Caller' : isMike ? (isSafetyProtocol ? 'MIKE - SAFETY ALERT' : 'Mike') : 'Mia'}
                    </span>
                  </div>
                  
                  <div 
                    className={`relative px-4 py-3 rounded-[1.25rem] text-[12.5px] font-medium leading-[1.6] shadow-md transition-all duration-500 ${
                      isUser 
                        ? 'bg-white border border-[#E9EBEE] text-[#1A1A1A] rounded-tr-none' 
                        : isSafetyProtocol
                          ? 'bg-red-700 text-white border-4 border-amber-400 rounded-tl-none uppercase'
                          : isMike 
                            ? 'bg-slate-900 text-white rounded-tl-none' 
                            : 'bg-[#E31937] text-white rounded-tl-none'
                    }`}
                  >
                    {entry.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex-shrink-0 pt-2 pb-1">
        <button
          onClick={isSessionActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`w-full py-5 rounded-[1.75rem] font-black text-[10px] lg:text-[11px] uppercase tracking-[0.3em] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 active:scale-[0.97] border-2 ${
            isSessionActive 
              ? 'bg-white border-[#E31937] text-[#E31937] hover:bg-slate-50' 
              : 'bg-[#E31937] border-[#E31937] text-white hover:bg-[#C1132C]'
          } ${isConnecting ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isConnecting ? 'Establishing Link...' : isSessionActive ? 'Disconnect Line' : 'Connect to Receptionist'}
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistant;