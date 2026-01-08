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
    activeAgent: 'Mia'
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
      setCustomerData(prev => ({ ...prev, activeAgent: 'Mia' }));
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar - Enercare Branding */}
      <aside className="w-full lg:w-[420px] bg-white border-r border-[#E9EBEE] flex flex-col z-10 shadow-sm overflow-hidden h-full">
        <header className="p-6 pb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E31937] rounded-full flex items-center justify-center shadow-lg transform -rotate-12 flex-shrink-0">
               <span className="text-white font-black text-xl italic pr-0.5">e</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none">Enercare</h1>
              <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-[0.2em] mt-1">Experts at home™</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-[#9CA3AF] uppercase">Priority Line</span>
            <span className="text-xs font-black text-[#E31937]">1-855-514-6485</span>
          </div>
        </header>

        <section className="flex-grow flex flex-col px-6 py-2 overflow-hidden">
          <VoiceAssistant 
            onUpdateLead={handleUpdateLead} 
            onSetEmergency={handleSetEmergency}
            isSessionActive={isSessionActive}
            onSessionChange={setIsSessionActive}
          />
        </section>

        <footer className="p-6 border-t border-[#F3F4F6] flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">Powered by Gemini Live</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`}></span>
              <span className="text-[9px] font-black text-[#6B7280] uppercase tracking-tighter">
                {isSessionActive ? 'Active Session' : 'Standby'}
              </span>
            </div>
          </div>
        </footer>
      </aside>

      {/* Main Dashboard Area */}
      <main className="flex-grow p-6 lg:p-10 overflow-y-auto custom-scrollbar h-full">
        <div className="max-w-6xl mx-auto h-full">
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