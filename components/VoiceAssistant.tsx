import React, { useRef, useState, useCallback, useEffect } from 'react';
import Vapi from '@vapi-ai/web';
import { Persona, TranscriptionEntry, CustomerData } from '../types';
import { WEBHOOK_URL } from '../constants';

// Vapi Credentials
const VAPI_PUBLIC_KEY = '0b4a6b67-3152-40bb-b29e-8272cfd98b3a';

/**
 * Separate Assistant IDs for optimized performance.
 * MIA handles general inquiries and initial screening.
 * MIKE is a specialized emergency dispatcher with different knowledge base and safety priority logic.
 */
const VAPI_MIA_ID = '67ceff6e-56e4-469f-8b04-851ef00dc479';
const VAPI_MIKE_ID = 'f25e8696-6d65-4f5b-9d6c-6f81498b5321'; // specialized emergency brain

const AVATARS = {
  [Persona.MIA]: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=128&h=128',
  [Persona.MIKE]: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=128&h=128'
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
      // Reset persona state for the next call
      setActivePersona(Persona.MIA);
      onSetEmergency(false);
    });

    vapi.on('message', (message: any) => {
      if (message.type === 'transcript') {
        const role = message.role === 'assistant' ? 'model' : 'user';
        const text = message.transcript;
        
        setTranscription(prev => {
          if (prev.length > 0 && prev[prev.length - 1].role === role && message.transcriptType === 'partial') {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], text };
            return updated;
          }
          if (message.transcriptType === 'final') {
            const last = prev[prev.length - 1];
            if (last && last.role === role) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], text };
              return updated;
            }
            return [...prev, { role, text, persona: activePersona }];
          }
          if (prev.length === 0 || prev[prev.length - 1].role !== role) {
            return [...prev, { role, text, persona: activePersona }];
          }
          return prev;
        });
      }

      if (message.type === 'tool-calls') {
        for (const toolCall of message.toolCalls) {
          const { name, args } = toolCall.function;
          
          if (name === 'set_emergency_status') {
            const isEmergency = !!args.active;
            const newPersona = isEmergency ? Persona.MIKE : Persona.MIA;
            const targetAssistantId = isEmergency ? VAPI_MIKE_ID : VAPI_MIA_ID;

            // 1. Synchronize UI state
            onSetEmergency(isEmergency);
            setActivePersona(newPersona);
            
            /** 
             * 2. Intelligent Agent Handoff
             * We use setAssistantOverrides to switch the active brain for the current session.
             * This ensures Mike's specialized emergency instructions and tone take over immediately
             * when Mia detects a critical situation.
             */
            vapi.setAssistantOverrides({
              assistantId: targetAssistantId
            });
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

    return () => { vapi.stop(); };
  }, [onSessionChange, onSetEmergency, onUpdateLead, activePersona]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const startSession = async () => {
    if (isConnecting || isSessionActive) return;
    setIsConnecting(true);
    // All calls originate with Mia as the standard receptionist
    vapiRef.current?.start(VAPI_MIA_ID);
  };

  const stopSession = () => { vapiRef.current?.stop(); };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto space-y-8 mb-6 custom-scrollbar pr-3 scroll-smooth pt-4"
      >
        {transcription.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 space-y-8 animate-in fade-in zoom-in duration-1000">
            <div className="relative">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-200 shadow-xl">
                 <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                 </svg>
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 border-4 border-white rounded-full shadow-lg animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-800">Secure Line Enabled</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting voice trigger</p>
            </div>
          </div>
        ) : (
          transcription.map((entry, i) => {
            const isUser = entry.role === 'user';
            const persona = entry.persona || activePersona;
            const isMike = persona === Persona.MIKE;
            const isLatestMessage = i === transcription.length - 1;
            const isAgentSpeaking = !isUser && isLatestMessage && isSessionActive;
            
            const textLower = entry.text.toLowerCase();
            const isSafetyProtocol = isMike && (
              textLower.includes('911') || 
              textLower.includes('leave the house') || 
              textLower.includes('hang up')
            );
            
            return (
              <div key={i} className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className="flex-shrink-0 mt-1">
                  {isUser ? (
                    <div className="w-10 h-10 rounded-2xl bg-[#111827] border-2 border-[#111827] flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="relative group">
                      <img 
                        src={AVATARS[persona]} 
                        alt={persona}
                        className={`w-12 h-12 rounded-2xl border-2 object-cover shadow-xl transition-all duration-300 ${
                          isSafetyProtocol 
                            ? 'border-red-500 animate-pulse scale-110' 
                            : isAgentSpeaking
                              ? isMike ? 'border-slate-800 animate-speaking-mike' : 'border-[#E31937] animate-speaking-mia'
                              : isMike ? 'border-slate-800' : 'border-[#E31937]'
                        }`}
                      />
                      {isSessionActive && !isUser && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                  )}
                </div>

                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  <div className={`flex items-center gap-2 mb-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${
                      isUser ? 'text-slate-500' : 
                      isSafetyProtocol ? 'text-red-600' :
                      isMike ? 'text-slate-900' : 'text-[#E31937]'
                    }`}>
                      {isUser ? 'Caller' : isMike ? (isSafetyProtocol ? 'Critical Protocol' : 'Agent: Mike') : 'Agent: Mia'}
                    </span>
                    {!isUser && isAgentSpeaking && (
                       <div className="flex gap-0.5 ml-1">
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                       </div>
                    )}
                  </div>
                  
                  <div 
                    className={`relative px-5 py-4 rounded-[1.75rem] text-[14px] font-bold leading-relaxed shadow-2xl transition-all duration-500 border-2 ${
                      isUser 
                        ? 'bg-white border-slate-200 text-[#111827] rounded-tr-none' 
                        : isSafetyProtocol
                          ? 'bg-red-700 text-white border-yellow-400 rounded-tl-none uppercase tracking-tight shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                          : isMike 
                            ? 'bg-[#111827] text-white border-[#111827] rounded-tl-none' 
                            : 'bg-[#E31937] text-white border-[#E31937] rounded-tl-none'
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

      <div className="flex-shrink-0 pt-4 pb-2">
        <button
          onClick={isSessionActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`w-full py-6 rounded-[2.25rem] font-black text-[12px] lg:text-[13px] uppercase tracking-[0.4em] transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center gap-4 active:scale-[0.96] border-2 group ${
            isSessionActive 
              ? 'bg-white border-[#E31937] text-[#E31937] hover:bg-slate-50' 
              : 'bg-[#E31937] border-[#E31937] text-white hover:bg-[#C1132C]'
          } ${isConnecting ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isConnecting ? (
            <>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </>
          ) : (
            <>
              {isSessionActive ? (
                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
              {isSessionActive ? 'End Secure Line' : 'Start AI Session'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistant;