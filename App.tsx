
import React, { useState, useCallback } from 'react';
import VoiceAssistant from './components/VoiceAssistant';
import Dashboard from './components/Dashboard';
import { CustomerData } from './types';

const App: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
    address: '',
    heatingType: '',
    unitAge: '',
    problemSummary: '',
    isHotInstall: false,
    activeAgent: 'Chloe'
  });
  const [emergencyActive, setEmergencyActive] = useState(false);

  const handleUpdateLead = useCallback((data: Partial<CustomerData>) => {
    setCustomerData(prev => ({ ...prev, ...data }));
  }, []);

  const handleSetEmergency = useCallback((active: boolean) => {
    setEmergencyActive(active);
    if (active) {
      setCustomerData(prev => ({ ...prev, activeAgent: 'Sam' }));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-[#F4F5F7]">
      {/* Sidebar UI - Enercare Style */}
      <div className="w-full lg:w-[400px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-6 flex flex-col gap-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E31937] rounded-full flex items-center justify-center shadow-md">
               <span className="text-white font-black text-xl italic">e</span>
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tighter text-[#1D1D1D] leading-none uppercase">Enercare</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Experts at home™</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-slate-400 font-bold uppercase">Heating Season</p>
             <p className="text-xs font-black text-[#E31937]">1-855-514-6485</p>
          </div>
        </div>

        <div className="flex-grow flex flex-col min-h-0">
          <VoiceAssistant 
            onUpdateLead={handleUpdateLead} 
            onSetEmergency={handleSetEmergency}
            isSessionActive={isSessionActive}
            onSessionChange={setIsSessionActive}
          />
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Powered by Gemini 2.5</span>
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
              {isSessionActive ? 'System Live' : 'System Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Dashboard */}
      <main className="flex-grow overflow-y-auto p-4 md:p-10">
        <div className="max-w-6xl mx-auto">
          <Dashboard 
            data={customerData} 
            isEmergency={emergencyActive} 
            isActive={isSessionActive} 
          />
        </div>
      </main>
    </div>
  );
};

export default App;
