
import React, { useRef, useState } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { Persona, TranscriptionEntry, CustomerData } from '../types';
import { SYSTEM_INSTRUCTION, WEBHOOK_URL } from '../constants';

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
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const submitLead = async (args: any) => {
    onUpdateLead({
      name: args.name,
      phone: args.phone,
      unitAge: args.age,
      problemSummary: args.summary,
      isHotInstall: args.temp === 'HOT INSTALL',
      activeAgent: args.agent
    });
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
    } catch (e) { console.error(e); }
    return { status: "success" };
  };

  const setEmergency = (args: { active: boolean }) => {
    onSetEmergency(args.active);
    setActivePersona(args.active ? Persona.SAM : Persona.CHLOE);
    return { status: "ok" };
  };

  const toggleSession = async () => {
    if (isSessionActive) {
      sessionRef.current?.close();
      onSessionChange(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: activePersona === Persona.CHLOE ? 'Kore' : 'Zephyr' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{
            functionDeclarations: [
              {
                name: 'submit_lead',
                description: 'Capture Enercare lead data.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    age: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    temp: { type: Type.STRING, enum: ['HOT INSTALL', 'REPAIR'] },
                    agent: { type: Type.STRING }
                  },
                  required: ['name', 'phone']
                }
              },
              {
                name: 'set_emergency_status',
                description: 'Flag emergency.',
                parameters: {
                  type: Type.OBJECT,
                  properties: { active: { type: Type.BOOLEAN } },
                  required: ['active']
                }
              }
            ]
          }],
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            onSessionChange(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                let res;
                if (fc.name === 'submit_lead') res = await submitLead(fc.args);
                if (fc.name === 'set_emergency_status') res = await setEmergency(fc.args as any);
                sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: res } }));
              }
            }
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              setTranscription(prev => prev[prev.length-1]?.role === 'model' ? [...prev.slice(0,-1), {...prev[prev.length-1], text: prev[prev.length-1].text + text}] : [...prev, {role: 'model', text, persona: activePersona}]);
            }
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              setTranscription(prev => prev[prev.length-1]?.role === 'user' ? [...prev.slice(0,-1), {...prev[prev.length-1], text: prev[prev.length-1].text + text}] : [...prev, {role: 'user', text}]);
            }
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => onSessionChange(false),
          onerror: () => onSessionChange(false)
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { onSessionChange(false); }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <button 
        onClick={toggleSession}
        className={`enercare-button w-full py-4 text-lg font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-3 ${isSessionActive ? '!bg-slate-800' : ''}`}
      >
        {isSessionActive ? (
          <><span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span> End Interaction</>
        ) : (
          <><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.505 5.505l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg> Answer Call</>
        )}
      </button>

      <div className="flex-grow bg-slate-50 border border-slate-200 rounded-[2rem] p-5 shadow-inner overflow-hidden flex flex-col">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Interaction Log</h3>
        <div className="flex-grow overflow-y-auto space-y-4 pr-1">
          {transcription.map((entry, i) => (
            <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-300 ${
                entry.role === 'user' 
                  ? 'bg-white border border-slate-200 text-slate-700 rounded-tr-none' 
                  : entry.persona === Persona.SAM 
                    ? 'bg-slate-800 text-white rounded-tl-none font-medium' 
                    : 'bg-[#E31937] text-white rounded-tl-none font-medium'
              }`}>
                {entry.text}
              </div>
            </div>
          ))}
          {transcription.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
               <svg className="w-12 h-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
               <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Signal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// PCM Helpers
function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}
function decode(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + ch] / 32768.0;
  }
  return buffer;
}
function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export default VoiceAssistant;
