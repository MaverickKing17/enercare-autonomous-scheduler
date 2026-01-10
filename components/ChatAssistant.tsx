import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Persona, ChatMessage, CustomerData } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const AVATARS = {
  [Persona.MIA]: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=128&h=128',
  [Persona.MIKE]: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=128&h=128'
};

interface ChatAssistantProps {
  onUpdateLead: (data: Partial<CustomerData>) => void;
  onSetEmergency: (active: boolean) => void;
  isEmergencyActive: boolean;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ onUpdateLead, onSetEmergency, isEmergencyActive }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // Initialize Chat Session
  useEffect(() => {
    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\n\nCRITICAL: You are acting as a LIVE CHAT agent. Keep responses concise and use appropriate formatting like bullet points or bold text. If an emergency is detected, switch to Mike's tone immediately.",
        tools: [{
          functionDeclarations: [
            {
              name: 'set_emergency_status',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  active: { type: Type.BOOLEAN, description: 'True if a critical situation is identified.' }
                },
                required: ['active']
              }
            },
            {
              name: 'submit_lead',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  heatingType: { type: Type.STRING },
                  age: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  temp: { type: Type.STRING, enum: ['HOT INSTALL', 'REGULAR'] }
                }
              }
            }
          ]
        }]
      }
    });

    // Initial Greeting
    const greeting = "Thanks for choosing Enercare Live Chat! I'm Mia. How can I help you today? Are you looking for a free quote on our new $7,500 heat pump systems?";
    setMessages([{
      role: 'model',
      text: greeting,
      persona: Persona.MIA,
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    setMessages(prev => [...prev, {
      role: 'user',
      text: userMessage,
      persona: isEmergencyActive ? Persona.MIKE : Persona.MIA,
      timestamp: new Date()
    }]);

    setIsTyping(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      
      // Process Tool Calls (Lead Submission & Emergency Status)
      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'set_emergency_status') {
            onSetEmergency(fc.args.active);
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
          }
        }
      }

      setMessages(prev => [...prev, {
        role: 'model',
        text: response.text || "I'm processing that for you now...",
        persona: isEmergencyActive ? Persona.MIKE : Persona.MIA,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto space-y-6 mb-4 custom-scrollbar pr-2 pt-2"
      >
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const isMike = msg.persona === Persona.MIKE;
          const textLower = msg.text.toLowerCase();
          const isSafety = isMike && (textLower.includes('911') || textLower.includes('hang up'));

          return (
            <div key={i} className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              {!isUser && (
                <img 
                  src={AVATARS[msg.persona]} 
                  alt={msg.persona}
                  className={`w-10 h-10 rounded-xl border-2 object-cover shadow-lg ${
                    isSafety ? 'border-red-500 animate-pulse' : isMike ? 'border-slate-800' : 'border-[#E31937]'
                  }`}
                />
              )}
              
              <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                {!isUser && (
                   <span className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isSafety ? 'text-red-600' : isMike ? 'text-slate-900' : 'text-[#E31937]'}`}>
                     {isSafety ? 'Critical Alert' : msg.persona}
                   </span>
                )}
                
                <div className={`px-4 py-3 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm border ${
                  isUser 
                    ? 'bg-[#111827] text-white border-[#111827] rounded-tr-none' 
                    : isSafety
                      ? 'bg-red-700 text-white border-yellow-400 rounded-tl-none uppercase tracking-tight'
                      : isMike 
                        ? 'bg-slate-100 text-slate-900 border-slate-200 rounded-tl-none' 
                        : 'bg-[#E31937] text-white border-[#E31937] rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-slate-100"></div>
            <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="relative mt-2">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-6 py-5 text-[13px] font-bold focus:outline-none focus:border-[#E31937] transition-all pr-16 shadow-inner"
        />
        <button 
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className={`absolute right-2 top-2 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            inputValue.trim() && !isTyping ? 'bg-[#E31937] text-white shadow-lg' : 'bg-slate-200 text-slate-400'
          }`}
        >
          <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatAssistant;