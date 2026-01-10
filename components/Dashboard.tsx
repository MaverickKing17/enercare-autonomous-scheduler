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
    <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-700 pb-10">
      {/* Premium Header - Higher Contrast & Bolder Type */}
      <div className={`relative overflow-hidden p-8 lg:p-12 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-8 border transition-all duration-700 ${
        isEmergency 
          ? 'bg-gradient-to-br from-[#0F0F0F] to-[#252525] border-slate-800 shadow-[0_40px_80px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)]'
      }`}>
        <div className={`absolute top-0 right-0 w-96 h-96 blur-[120px] opacity-[0.15] rounded-full pointer-events-none ${isEmergency ? 'bg-[#E31937]' : 'bg-[#E31937]'}`}></div>

        <div className="flex items-center gap-10 relative z-10">
          <div className="relative group">
            <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isEmergency ? 'bg-[#E31937] text-white rotate-3 scale-110' : 'bg-[#E31937] text-white -rotate-3'
            }`}>
              {isEmergency ? (
                <svg className="w-12 h-12 lg:w-14 lg:h-14 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <span className="text-4xl lg:text-5xl font-black italic select-none">e</span>
              )}
            </div>
            {isActive && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full shadow-lg animate-pulse"></div>
            )}
          </div>
          
          <div className="space-y-2">
            <h2 className={`text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none ${isEmergency ? 'text-white' : 'text-[#111827]'}`}>
               {isEmergency ? 'Emergency Ops' : 'Reception Desk'}
            </h2>
            <div className="flex items-center gap-4">
              <span className={`text-[11px] font-black uppercase tracking-[0.25em] px-4 py-1.5 rounded-full border shadow-sm ${
                isEmergency ? 'bg-white/10 border-white/20 text-white' : 'bg-[#111827] border-[#111827] text-white'
              }`}>
                Agent: {isEmergency ? 'Mike' : 'Mia'}
              </span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                <span className={`text-[11px] font-extrabold uppercase tracking-widest ${isEmergency ? 'text-white/70' : 'text-slate-500'}`}>
                  {isActive ? 'Live Stream Active' : 'System Standby'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-3 relative z-10">
           <div className="flex items-center gap-3 mb-1">
              <span className={`text-[11px] font-black uppercase tracking-widest ${isEmergency ? 'text-white/50' : 'text-slate-500'}`}>Lead Integrity</span>
              <span className={`text-xl font-black ${isEmergency ? 'text-white' : 'text-[#E31937]'}`}>{completionPercent}%</span>
           </div>
           <div className={`w-64 h-3 rounded-full overflow-hidden ${isEmergency ? 'bg-white/10' : 'bg-slate-100'}`}>
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${isEmergency ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-[#E31937] shadow-[0_0_15px_rgba(227,25,55,0.3)]'}`}
                style={{ width: `${completionPercent}%` }}
              ></div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white border border-slate-200 p-10 lg:p-14 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.03)] relative overflow-hidden group">
            <div className="flex items-center justify-between mb-16">
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-[#111827] uppercase tracking-tighter flex items-center gap-5">
                   Capture Stream
                   <span className="w-3 h-3 bg-[#E31937] rounded-full animate-pulse"></span>
                 </h3>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Advanced extraction architecture</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
              <DetailItem 
                label="Caller Identity" 
                value={data.name} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
              />
              <DetailItem 
                label="Verified Contact" 
                value={data.phone} 
                isHighlighted={!!data.phone} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />}
              />
              
              <DetailItem 
                label="Service Locality" 
                value={data.address} 
                isFullWidth
                icon={<React.Fragment><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></React.Fragment>}
              />

              <DetailItem 
                label="System Architecture" 
                value={data.heatingType} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.673.337a4 4 0 01-1.909.48H4.707a.5.5 0 01-.39-.812l.002-.003 1.183-1.481a12.078 12.078 0 012.512-2.352l1.638-1.124a8.04 8.04 0 014.256-1.39h2.122a2 2 0 011.916 1.419l1.411 4.444a2 2 0 01-.351 1.768z" />}
              />
              <DetailItem 
                label="Unit Longevity" 
                value={data.unitAge ? `${data.unitAge} Years` : ''} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              />

              <DetailItem 
                label="Issue Synthesis" 
                value={data.problemSummary} 
                isFullWidth 
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
              />
            </div>
          </section>

          {/* Call to Action - More Bold & Professional */}
          <section className="bg-gradient-to-r from-[#111827] to-[#1F2937] p-12 lg:p-14 rounded-[3.5rem] shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E31937] opacity-[0.06] blur-[120px] rounded-full pointer-events-none duration-1000 group-hover:scale-110 transition-transform"></div>
             
             <div className="relative z-10 text-center md:text-left space-y-4">
                <div className="flex items-center gap-4 justify-center md:justify-start">
                   <div className="w-10 h-10 bg-[#E31937] rounded-xl flex items-center justify-center rotate-6 shadow-[0_10px_20px_rgba(227,25,55,0.4)]">
                      <span className="text-white font-black italic text-lg">e</span>
                   </div>
                   <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[#E31937]">Enercare Priority</span>
                </div>
                <h3 className="text-4xl lg:text-5xl font-black mb-3 uppercase leading-[0.9] tracking-tighter">Advantage<br/><span className="text-slate-500">Upgrade</span></h3>
                <p className="text-slate-400 text-base font-semibold max-w-sm leading-relaxed">Schedule a premium assessment and unlock multi-measure rebates up to <span className="text-white font-black text-lg underline decoration-[#E31937] underline-offset-4">{HRS_PROGRAM_DETAILS.multiMeasure}</span>.</p>
             </div>
             
             <a 
              href={BOOKING_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="group/btn relative px-12 py-7 font-black rounded-2xl bg-[#E31937] hover:bg-[#C1132C] transition-all duration-300 hover:scale-[1.05] shadow-[0_20px_40px_rgba(227,25,55,0.4)] flex items-center gap-4 overflow-hidden border-2 border-[#E31937]"
             >
               <span className="relative z-10 uppercase tracking-widest text-base">Book Priority</span>
               <svg className="w-6 h-6 relative z-10 group-hover/btn:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M17 8l4 4m0 0l-4 4m4-4H3" />
               </svg>
             </a>
          </section>
        </div>

        {/* Side Panel - Metrics & Pulse */}
        <div className="space-y-10">
          <section className="bg-white border border-slate-200 p-10 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-12">
               <h3 className="text-[12px] font-black text-[#111827] uppercase tracking-[0.4em]">Incentive Stack</h3>
               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                 <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
            </div>
            
            <div className="space-y-5">
              <ProgramTier label="Heat Pump Tier" rebate={HRS_PROGRAM_DETAILS.electricRebate} isActive={normalizedHeating.includes('electric')} />
              <ProgramTier label="Natural Gas Tier" rebate={HRS_PROGRAM_DETAILS.gasRebate} isActive={normalizedHeating.includes('gas')} />
              <ProgramTier label="Off-Grid Tier" rebate={HRS_PROGRAM_DETAILS.oilPropaneRebate} isActive={normalizedHeating.includes('oil')} />
              <div className="mt-12 pt-10 border-t-2 border-slate-50 space-y-6">
                 <div className="flex justify-between items-center group/item p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Audit Credit</span>
                    <span className="px-4 py-1.5 bg-green-500 text-[11px] font-black text-white rounded-lg shadow-sm">{HRS_PROGRAM_DETAILS.assessmentReimbursement}</span>
                 </div>
              </div>
            </div>
          </section>

          <section className="bg-[#0F0F0F] border border-slate-800 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E31937] to-transparent opacity-50"></div>
             <div className="flex items-center gap-4 mb-10">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">System Pulse</h3>
             </div>
             <div className="space-y-6">
                <LogEntry time="LIVE" text="Awaiting voice stream..." active />
                {data.name && <LogEntry time="PUSH" text={`Verified: ${data.name}`} color="text-[#E31937]" />}
                {isEmergency && <LogEntry time="CRIT" text="Mike: Dispatch protocol initiated" urgent />}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon, isHighlighted = false, isFullWidth = false }: { label: string, value: string, icon: React.ReactNode, isHighlighted?: boolean, isFullWidth?: boolean }) => (
  <div className={`group/detail ${isFullWidth ? 'md:col-span-2' : ''} space-y-4`}>
    <div className="flex items-center gap-4">
       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 border shadow-sm ${
         value ? 'bg-[#111827] text-white border-[#111827] rotate-6 scale-110' : 'bg-slate-50 text-slate-300 border-slate-100'
       }`}>
         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           {icon}
         </svg>
       </div>
       <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.3em]">{label}</p>
    </div>
    
    <div className="relative pl-2">
      <div className={`text-lg lg:text-2xl font-black py-3 border-b-4 transition-all duration-500 flex items-center min-h-[50px] ${
        value 
          ? isHighlighted 
            ? 'border-[#E31937] text-[#E31937] translate-x-1' 
            : 'border-[#111827] text-[#111827]' 
          : 'border-slate-100 text-slate-300 font-extrabold italic opacity-50'
      }`}>
        {value || 'Awaiting entry...'}
      </div>
      {value && !isHighlighted && (
        <div className="absolute -bottom-1 left-0 w-0 h-1 bg-[#111827] group-hover/detail:w-full transition-all duration-700"></div>
      )}
    </div>
  </div>
);

const ProgramTier = ({ label, rebate, isActive }: { label: string, rebate: string, isActive: boolean }) => (
  <div className={`p-7 rounded-[2.25rem] border-2 transition-all duration-700 relative overflow-hidden group/tier ${
    isActive 
      ? 'bg-[#E31937] border-[#E31937] text-white shadow-[0_20px_40px_rgba(227,25,55,0.4)] -translate-y-1' 
      : 'bg-white border-slate-100 hover:border-slate-200'
  }`}>
    <div className="flex flex-col gap-2 relative z-10">
      <span className={`text-[12px] font-black uppercase tracking-widest ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{label}</span>
      <span className={`text-3xl font-black tracking-tighter ${isActive ? 'text-white' : 'text-[#111827]'}`}>{rebate}</span>
    </div>
    {isActive && (
      <div className="absolute top-0 right-0 p-4">
        <svg className="w-6 h-6 text-white/50" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
    )}
  </div>
);

const LogEntry = ({ time, text, active = false, urgent = false, color }: { time: string, text: string, active?: boolean, urgent?: boolean, color?: string }) => (
  <div className="flex gap-5 text-[11px] font-mono items-center py-1">
    <span className={`font-black tracking-tighter px-2 py-1 rounded border-2 ${
      urgent ? 'text-[#E31937] border-[#E31937]/50 bg-[#E31937]/10' : 'text-slate-500 border-slate-800 bg-white/5'
    }`}>{time}</span>
    <span className={`font-bold tracking-tight ${active ? 'text-blue-400' : urgent ? 'text-[#E31937] animate-pulse' : color || 'text-slate-300'}`}>
      {text}
    </span>
  </div>
);

export default Dashboard;