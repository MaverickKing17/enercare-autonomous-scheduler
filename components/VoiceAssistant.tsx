
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
  const [activePersona, setActivePersona] = useState<Persona>(Persona.CHLOE);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  // Tools configuration
  const setEmergencyStatusTool = {
    name: 'set_emergency_status',
    parameters: {
      type: Type.OBJECT,
      description: 'Mark the current call as an emergency and switch to Sam.',
      properties: {
        active: { type: Type.BOOLEAN, description: 'True if it is an emergency.' }
      },
      required: ['active']
    }
  };

  const submitLeadTool = {
    name: 'submit_lead',
    parameters: {
      type: Type.OBJECT,
      description: 'Submit customer lead data to the backend.',
      properties: {
        name: { type: Type.STRING, description: 'Customer full name' },
        phone: { type: Type.STRING, description: 'Customer phone number' },
        heatingType: { type: Type.STRING, description: 'Current heating source' },
        age: { type: Type.STRING, description: 'Age of the current unit' },
        summary: { type: Type.STRING, description: 'Brief summary of the issue' },
        temp: { type: Type.STRING, description: 'Status tag, e.g., "HOT INSTALL"' }
      }
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
  }, [onSessionChange]);

  const handleToolCall = useCallback(async (fc: any) => {
    if (fc.name === 'set_emergency_status') {
      onSetEmergency(fc.args.active);
      setActivePersona(fc.args.active ? Persona.SAM : Persona.CHLOE);
      return { status: 'success', message: `Emergency status set to ${fc.args.active}` };
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
      return { status: 'success', message: 'Lead submitted successfully' };
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
            // Audio output
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

            // Interruption
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Tool calls
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

            // Transcription
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => [...prev, { role: 'model', text: message.serverContent!.outputTranscription!.text, persona: activePersona }]);
            }
            if (message.serverContent?.inputTranscription) {
              setTranscription(prev => [...prev, { role: 'user', text: message.serverContent!.inputTranscription!.text }]);
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
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
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
      <div className="flex-grow overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2">
        {transcription.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
               <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
               </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ready for priority dispatch</p>
          </div>
        ) : (
          transcription.map((entry, i) => (
            <div key={i} className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'}`}>
              <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mb-1">
                {entry.role === 'user' ? 'Caller' : entry.persona || 'Agent'}
              </span>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                entry.role === 'user' 
                  ? 'bg-white border border-slate-100 text-[#1D1D1D]' 
                  : 'bg-[#E31937] text-white'
              }`}>
                {entry.text}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={isSessionActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`w-full py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 ${
          isSessionActive 
            ? 'bg-white border-2 border-[#E31937] text-[#E31937] hover:bg-[#E31937]/5' 
            : 'bg-[#E31937] text-white hover:scale-[1.02] active:scale-[0.98]'
        } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Connecting...
          </span>
        ) : isSessionActive ? (
          <>
            <div className="w-2 h-2 bg-[#E31937] rounded-full animate-pulse"></div>
            End Connection
          </>
        ) : (
          'Establish Priority Line'
        )}
      </button>
    </div>
  );
};

export default VoiceAssistant;
