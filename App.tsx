
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
    activeAgent: 'Angela'
  });
  const [emergencyActive, setEmergencyActive] = useState(false);

  const handleUpdateLead = useCallback((data: Partial<CustomerData>) => {
    setCustomerData(prev => ({ ...prev, ...data }));
  }, []);

  const handleSetEmergency = useCallback((active: boolean) => {
    setEmergencyActive(active);
    if (active) {
      setCustomerData(prev => ({ ...prev, activeAgent: 'Mike' }));
    } else {
      setCustomerData(prev => ({ ...prev, activeAgent: 'Angela' }));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8F9FA]">
      {/* Sidebar - Enercare Branding */}
      <aside className="w-full lg:w-[420px] bg-white border-r border-[#E9EBEE] flex flex-col z-10 shadow-sm overflow-hidden">
        <header className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E31937] rounded-full flex items-center justify-center shadow-lg transform -rotate-12">
               <span className="text-white font-black text-2xl italic pr-0.5">e</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none">Enercare</h1>
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.25em] mt-1">Experts at home™</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-[#9CA3AF] uppercase">Priority Line</span>
            <span className="text-xs font-black text-[#E31937]">1-855-514-6485</span>
          </div>
        </header>

        <section className="flex-grow flex flex-col px-8 py-4">
          <VoiceAssistant 
            onUpdateLead={handleUpdateLead} 
            onSetEmergency={handleSetEmergency}
            isSessionActive={isSessionActive}
            onSessionChange={setIsSessionActive}
          />
        </section>

        <footer className="p-8 pt-4 border-t border-[#F3F4F6]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Powered by Gemini Live</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`}></span>
              <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-tighter">
                {isSessionActive ? 'Active Session' : 'Standby'}
              </span>
            </div>
          </div>
        </footer>
      </aside>

      {/* Main Dashboard Area */}
      <main className="flex-grow p-6 lg:p-12 overflow-y-auto custom-scrollbar">
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
