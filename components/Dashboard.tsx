import React from 'react';
import { CustomerData } from '../types';
import { HRS_PROGRAM_DETAILS, BOOKING_URL } from '../constants';

interface DashboardProps {
  data: CustomerData;
  isEmergency: boolean;
  isActive: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ data, isEmergency, isActive }) => {
  const normalizedHeating = data.heatingType?.toLowerCase() || '';
  
  // Calculate completion percentage
  const fields = [data.name, data.phone, data.address, data.heatingType, data.unitAge, data.problemSummary];
  const filledFields = fields.filter(f => !!f).length;
  const completionPercent = Math.round((filledFields / fields.length) * 100);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Premium Header */}
      <div className={`relative overflow-hidden p-8 lg:p-10 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 border transition-all duration-700 ${
        isEmergency 
          ? 'bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] border-slate-800 shadow-[0_30px_70px_rgba(0,0,0,0.4)]' 
          : 'bg-white border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)]'
      }`}>
        <div className={`absolute top-0 right-0 w-96 h-96 blur-[120px] opacity-10 rounded-full pointer-events-none ${isEmergency ? 'bg-[#E31937]' : 'bg-[#E31937]'}`}></div>

        <div className="flex items-center gap-8 relative z-10">
          <div className="relative group">
            <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-[1.75rem] flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isEmergency ? 'bg-[#E31937] text-white rotate-3 scale-110' : 'bg-[#E31937] text-white -rotate-3'
            }`}>
              {isEmergency ? (
                <svg className="w-10 h-10 lg:w-12 lg:h-12 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <span className="text-3xl lg:text-4xl font-black italic select-none">e</span>
              )}
            </div>
            {isActive && (
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
            )}
          </div>
          
          <div className="space-y-1">
            <h2 className={`text-3xl lg:text-4xl font-black tracking-tight uppercase leading-none ${isEmergency ? 'text-white' : 'text-[#1D1D1D]'}`}>
               {isEmergency ? 'Emergency Response' : 'Reception Desk'}
            </h2>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                isEmergency ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                Agent: {isEmergency ? 'Mike' : 'Mia'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isEmergency ? 'text-white/60' : 'text-slate-400'}`}>
                {isActive ? 'Live Interaction' : 'Standby Mode'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-2 relative z-10">
           <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isEmergency ? 'text-white/40' : 'text-slate-400'}`}>Lead Completion</span>
              <span className={`text-xs font-black ${isEmergency ? 'text-white' : 'text-[#E31937]'}`}>{completionPercent}%</span>
           </div>
           <div className={`w-48 h-2 rounded-full overflow-hidden ${isEmergency ? 'bg-white/10' : 'bg-slate-100'}`}>
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${isEmergency ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-[#E31937] shadow-[0_0_10px_rgba(227,25,55,0.3)]'}`}
                style={{ width: `${completionPercent}%` }}
              ></div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white border border-slate-100 p-8 lg:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden group">
            <div className="flex items-center justify-between mb-12">
               <div className="space-y-1">
                 <h3 className="text-xl font-black text-[#1D1D1D] uppercase tracking-tighter flex items-center gap-4">
                   Capture Stream
                   <span className="w-2 h-2 bg-slate-200 rounded-full"></span>
                 </h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Real-time caller data extraction</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {/* Identity & Contact Group */}
              <DetailItem 
                label="Caller Identity" 
                value={data.name} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
              />
              <DetailItem 
                label="Verified Contact" 
                value={data.phone} 
                isHighlighted={!!data.phone} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />}
              />
              
              {/* Location - Expanded for readability */}
              <DetailItem 
                label="Service Locality" 
                value={data.address} 
                isFullWidth
                icon={<React.Fragment><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></React.Fragment>}
              />

              {/* System Architecture & Age Group */}
              <DetailItem 
                label="System Architecture" 
                value={data.heatingType} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.673.337a4 4 0 01-1.909.48H4.707a.5.5 0 01-.39-.812l.002-.003 1.183-1.481a12.078 12.078 0 012.512-2.352l1.638-1.124a8.04 8.04 0 014.256-1.39h2.122a2 2 0 011.916 1.419l1.411 4.444a2 2 0 01-.351 1.768z" />}
              />
              <DetailItem 
                label="Unit Longevity" 
                value={data.unitAge ? `${data.unitAge} Years` : ''} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              />

              {/* Problem Synthesis - Full Width */}
              <DetailItem 
                label="Issue Synthesis" 
                value={data.problemSummary} 
                isFullWidth 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
              />
            </div>
          </section>

          <section className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] p-10 lg:p-12 rounded-[3rem] shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E31937] opacity-[0.03] blur-[100px] rounded-full pointer-events-none duration-1000"></div>
             
             <div className="relative z-10 text-center md:text-left space-y-3">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                   <div className="w-8 h-8 bg-[#E31937] rounded-lg flex items-center justify-center rotate-6">
                      <span className="text-white font-black italic text-sm">e</span>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E31937]">Enercare Priority</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-black mb-2 uppercase leading-[0.9] tracking-tighter">The Advantage <br/><span className="text-slate-500">Upgrade</span></h3>
                <p className="text-slate-400 text-sm font-medium max-w-sm leading-relaxed">Schedule your home comfort assessment and unlock exclusive multi-measure rebates up to <span className="text-white font-bold">$7,700</span>.</p>
             </div>
             
             <a 
              href={BOOKING_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="group/btn relative px-10 py-6 font-black rounded-2xl bg-[#E31937] hover:bg-[#C1132C] transition-all duration-300 hover:scale-[1.03] shadow-[0_15px_30px_rgba(227,25,55,0.3)] flex items-center gap-3 overflow-hidden"
             >
               <span className="relative z-10 uppercase tracking-widest text-sm">Book Assessment</span>
               <svg className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
               </svg>
             </a>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Incentives</h3>
               <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                 <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
            </div>
            
            <div className="space-y-4">
              <ProgramTier label="Heat Pump" rebate={HRS_PROGRAM_DETAILS.electricRebate} isActive={normalizedHeating.includes('electric')} />
              <ProgramTier label="Natural Gas" rebate={HRS_PROGRAM_DETAILS.gasRebate} isActive={normalizedHeating.includes('gas')} />
              <ProgramTier label="Off-Grid" rebate={HRS_PROGRAM_DETAILS.oilPropaneRebate} isActive={normalizedHeating.includes('oil')} />
              <div className="mt-10 pt-8 border-t border-slate-100 space-y-5">
                 <div className="flex justify-between items-center group/item">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Audit Credit</span>
                    <span className="px-3 py-1 bg-green-50 text-[10px] font-black text-green-600 rounded-lg">{HRS_PROGRAM_DETAILS.assessmentReimbursement}</span>
                 </div>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1A1A] border border-slate-800 p-8 rounded-[3rem] shadow-xl">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">System Pulse</h3>
             </div>
             <div className="space-y-5">
                <LogEntry time="LIVE" text="Awaiting voice stream..." active />
                {data.name && <LogEntry time="PUSH" text={`Verified: ${data.name}`} color="text-[#E31937]" />}
                {isEmergency && <LogEntry time="WARN" text="Mike: Dispatch Protocol" urgent />}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon, isHighlighted = false, isFullWidth = false }: { label: string, value: string, icon: React.ReactNode, isHighlighted?: boolean, isFullWidth?: boolean }) => (
  <div className={`group/detail ${isFullWidth ? 'md:col-span-2' : ''} space-y-3`}>
    <div className="flex items-center gap-3">
       <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
         value ? 'bg-slate-800 text-white rotate-6' : 'bg-slate-50 text-slate-300'
       }`}>
         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           {icon}
         </svg>
       </div>
       <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{label}</p>
    </div>
    
    <div className="relative">
      <div className={`text-base lg:text-lg font-bold py-2 border-b-2 transition-all duration-500 flex items-center ${
        value 
          ? isHighlighted 
            ? 'border-[#E31937] text-[#E31937] translate-x-1' 
            : 'border-slate-800 text-[#1D1D1D]' 
          : 'border-slate-100 text-slate-200 font-medium italic'
      }`}>
        {value || 'Waiting for input...'}
      </div>
    </div>
  </div>
);

const ProgramTier = ({ label, rebate, isActive }: { label: string, rebate: string, isActive: boolean }) => (
  <div className={`p-6 rounded-[1.75rem] border transition-all duration-700 relative overflow-hidden group/tier ${
    isActive 
      ? 'bg-[#E31937] border-[#E31937] text-white shadow-[0_15px_30px_rgba(227,25,55,0.3)] -translate-y-1' 
      : 'bg-white border-slate-100'
  }`}>
    <div className="flex flex-col gap-1 relative z-10">
      <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{label}</span>
      <span className={`text-2xl font-black tracking-tighter ${isActive ? 'text-white' : 'text-[#1D1D1D]'}`}>{rebate}</span>
    </div>
  </div>
);

const LogEntry = ({ time, text, active = false, urgent = false, color }: { time: string, text: string, active?: boolean, urgent?: boolean, color?: string }) => (
  <div className="flex gap-4 text-[10px] font-mono items-center">
    <span className={`font-black tracking-tighter px-1.5 py-0.5 rounded border ${
      urgent ? 'text-[#E31937] border-[#E31937]/30 bg-[#E31937]/10' : 'text-slate-500 border-slate-800 bg-white/5'
    }`}>{time}</span>
    <span className={`font-bold ${active ? 'text-blue-400' : urgent ? 'text-[#E31937] animate-pulse' : color || 'text-slate-400'}`}>
      {text}
    </span>
  </div>
);

export default Dashboard;