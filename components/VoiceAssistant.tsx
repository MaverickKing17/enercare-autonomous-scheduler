
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { Persona, TranscriptionEntry, CustomerData } from '../types';
import { SYSTEM_INSTRUCTION, WEBHOOK_URL } from '../constants';

// Manual implementation of base64 decoding as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual implementation of base64 encoding as per guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Audio data decoder for raw PCM as per guidelines
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

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
  const [activePersona, setActivePersona] = useState<Persona>(Persona.ANGELA);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Current transcription chunks
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  // Tools configuration
  const setEmergencyStatusTool = {
    name: 'set_emergency_status',
    parameters: {
      type: Type.OBJECT,
      description: 'Mark the call as an emergency and switch to Mike immediately.',
      properties: {
        active: { type: Type.BOOLEAN, description: 'True if it is an emergency (leaks, smells, floods).' }
      },
      required: ['active']
    }
  };

  const submitLeadTool = {
    name: 'submit_lead',
    parameters: {
      type: Type.OBJECT,
      description: 'Record customer details and problem summary for Enercare dispatch.',
      properties: {
        name: { type: Type.STRING, description: 'Customer full name' },
        phone: { type: Type.STRING, description: 'Customer phone number' },
        heatingType: { type: Type.STRING, description: 'Current heating source' },
        age: { type: Type.STRING, description: 'Age of the unit' },
        summary: { type: Type.STRING, description: 'Summary of the issue' },
        temp: { type: Type.STRING, description: 'Tag: HOT INSTALL or REPAIR' }
      },
      required: ['name', 'phone']
    }
  };

  const cleanupSession = useCallback(() => {
    if (sourcesRef.current) {
      sourcesRef.current.forEach(s => {
        try { s.stop(); } catch (e) {}
      });
      sourcesRef.current.clear();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    nextStartTimeRef.current = 0;
    onSessionChange(false);
    setIsConnecting(false);
    sessionPromiseRef.current = null;
    setTranscription([]);
  }, [onSessionChange]);

  const handleToolCall = useCallback(async (fc: any) => {
    if (fc.name === 'set_emergency_status') {
      const isEmergency = !!fc.args.active;
      onSetEmergency(isEmergency);
      setActivePersona(isEmergency ? Persona.MIKE : Persona.ANGELA);
      return { status: 'success', activeAgent: isEmergency ? 'Mike' : 'Angela' };
    }
    if (fc.name === 'submit_lead') {
      onUpdateLead({
        name: fc.args.name,
        phone: fc.args.phone,
        heatingType: fc.args.heatingType,
        unitAge: fc.args.age,
        problemSummary: fc.args.summary,
        isHotInstall: fc.args.temp === 'HOT INSTALL'
      });
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fc.args)
        });
      } catch (e) {
        console.error('Webhook failed', e);
      }
      return { status: 'success', message: 'Lead logged for Enercare dispatch' };
    }
    return { status: 'error', message: 'Unknown tool' };
  }, [onSetEmergency, onUpdateLead]);

  const startSession = async () => {
    if (isConnecting || isSessionActive) return;
    setIsConnecting(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      outputAudioContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = audioContext.createMediaStreamSource(stream);
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);
            onSessionChange(true);
            setIsConnecting(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                const result = await handleToolCall(fc);
                sessionPromiseRef.current?.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: fc.id,
                      name: fc.name,
                      response: result
                    }]
                  });
                });
              }
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentOutputTranscriptionRef.current += text;
              setTranscription(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'model') {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...last, text: currentOutputTranscriptionRef.current };
                  return updated;
                }
                return [...prev, { role: 'model', text: currentOutputTranscriptionRef.current, persona: activePersona }];
              });
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscriptionRef.current += text;
              setTranscription(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user') {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...last, text: currentInputTranscriptionRef.current };
                  return updated;
                }
                return [...prev, { role: 'user', text: currentInputTranscriptionRef.current }];
              });
            }

            if (message.serverContent?.turnComplete) {
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            cleanupSession();
          },
          onclose: () => {
            cleanupSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [setEmergencyStatusTool, submitLeadTool] }],
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: activePersona === Persona.MIKE ? 'Fenrir' : 'Kore' 
              } 
            }
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error('Failed to start session:', err);
      cleanupSession();
    }
  };

  const stopSession = () => {
    sessionPromiseRef.current?.then(session => session.close());
    cleanupSession();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Conversation Log */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto space-y-6 mb-6 custom-scrollbar pr-3 scroll-smooth"
      >
        {transcription.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-inner">
                 <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                 </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Priority Line Open</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Caller Input</p>
            </div>
          </div>
        ) : (
          transcription.map((entry, i) => {
            const isUser = entry.role === 'user';
            const isMike = entry.persona === Persona.MIKE || (!isUser && activePersona === Persona.MIKE);
            
            return (
              <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isUser ? 'text-[#6B7280]' : isMike ? 'text-slate-900' : 'text-[#E31937]'}`}>
                    {isUser ? 'Caller' : isMike ? 'Mike (Emergency)' : 'Angela (Enercare)'}
                  </span>
                  {!isUser && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSessionActive ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`}></span>
                  )}
                </div>
                <div 
                  className={`relative max-w-[88%] px-5 py-4 rounded-[1.5rem] text-[13px] font-medium leading-[1.6] shadow-md transition-all ${
                    isUser 
                      ? 'bg-white border border-[#E9EBEE] text-[#1A1A1A] rounded-tr-none' 
                      : isMike 
                        ? 'bg-slate-900 text-white rounded-tl-none shadow-xl' 
                        : 'bg-[#E31937] text-white rounded-tl-none'
                  }`}
                >
                  {entry.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Control Button */}
      <div className="pt-2">
        <button
          onClick={isSessionActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`w-full py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 active:scale-[0.97] ${
            isSessionActive 
              ? 'bg-white border-2 border-[#E31937] text-[#E31937] hover:bg-slate-50' 
              : 'bg-[#E31937] text-white hover:bg-[#C1132C] hover:shadow-[0_12px_30px_rgba(227,25,55,0.3)]'
          } ${isConnecting ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isConnecting ? (
            <span className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-[#E31937] rounded-full animate-spin"></div>
              Linking Dispatch...
            </span>
          ) : isSessionActive ? (
            <>
              <div className="w-2 h-2 bg-[#E31937] rounded-full animate-ping"></div>
              Disconnect Line
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Open Priority Line
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistant;
