
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Dynamic Header - Enercare Branding */}
      <div className={`p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 border transition-all duration-700 ${
        isEmergency 
          ? 'bg-[#E31937] border-[#E31937] shadow-[0_20px_60px_rgba(227,25,55,0.3)]' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isEmergency ? 'bg-white text-[#E31937] scale-110' : 'bg-[#E31937] text-white shadow-lg'}`}>
            {isEmergency ? (
              <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <span className="text-3xl font-black italic select-none">e</span>
            )}
          </div>
          <div>
            <h2 className={`text-3xl font-black tracking-tighter uppercase ${isEmergency ? 'text-white' : 'text-[#1D1D1D]'}`}>
               {isEmergency ? 'Emergency Service' : 'Lead Dashboard'}
            </h2>
            <p className={`font-bold tracking-widest flex items-center gap-2 uppercase text-xs ${isEmergency ? 'text-white/80' : 'text-[#E31937]'}`}>
               <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-ping' : 'bg-slate-300'}`}></span>
               Agent: {isEmergency ? 'Sam (Urgent Dispatch)' : (data.activeAgent || 'Chloe')}
            </p>
          </div>
        </div>
        
        {isEmergency && (
          <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/20 text-center">
             <p className="text-[10px] uppercase font-black text-white mb-1">Guaranteed Response</p>
             <p className="text-3xl font-black text-white">4 HOURS</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Data Column */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-xl font-black text-[#1D1D1D] uppercase tracking-tight flex items-center gap-3">
                 Profile Verification
               </h3>
               {data.isHotInstall && (
                 <div className="px-5 py-2 bg-[#E31937] text-white text-[10px] font-black rounded-full uppercase tracking-tighter shadow-md animate-bounce">
                   Emergency Heat Replacement
                 </div>
               )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <DetailItem label="Full Name" value={data.name} />
              <DetailItem label="Direct Phone" value={data.phone} isHighlighted={!!data.phone} />
              <DetailItem label="Service Address" value={data.address} />
              <DetailItem label="Energy Profile" value={data.heatingType} />
              <DetailItem label="Unit Lifespan" value={data.unitAge ? `${data.unitAge} years old` : ''} />
              <DetailItem label="Consultation Notes" value={data.problemSummary} isFullWidth />
            </div>
          </section>

          {/* Banner Styled as Enercare Promo */}
          <section className="bg-[#1D1D1D] p-10 rounded-[2.5rem] shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#E31937] opacity-20 blur-[100px] -translate-y-32 translate-x-32"></div>
             <div className="relative z-10 text-center md:text-left">
                <h3 className="text-3xl font-black mb-2 uppercase leading-none tracking-tighter">HRS Program Savings</h3>
                <p className="text-slate-400 text-sm font-medium">Verify eligibility and secure up to $7,500 in government rebates.</p>
             </div>
             <a 
              href={BOOKING_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="enercare-button px-10 py-5 font-black hover:scale-105 shadow-2xl relative z-10 whitespace-nowrap text-base"
             >
               BOOK ASSESSMENT NOW
             </a>
          </section>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          <section className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Rebate Qualifier Tiers</h3>
            <div className="space-y-4">
              <ProgramTier 
                label="Electric Conversion" 
                rebate={HRS_PROGRAM_DETAILS.electricRebate} 
                isActive={normalizedHeating.includes('electric')}
              />
              <ProgramTier 
                label="Natural Gas Upgrade" 
                rebate={HRS_PROGRAM_DETAILS.gasRebate} 
                isActive={normalizedHeating.includes('gas')}
              />
              <ProgramTier 
                label="Oil/Propane Switch" 
                rebate={HRS_PROGRAM_DETAILS.oilPropaneRebate} 
                isActive={normalizedHeating.includes('oil') || normalizedHeating.includes('propane')}
              />
              <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                 <div className="flex justify-between items-center px-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Attic Rebate</span>
                    <span className="text-sm font-black text-[#1D1D1D]">{HRS_PROGRAM_DETAILS.atticRebate}</span>
                 </div>
                 <div className="flex justify-between items-center px-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Energy Audit</span>
                    <span className="text-sm font-black text-green-600">{HRS_PROGRAM_DETAILS.assessmentReimbursement} Credit</span>
                 </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-100/50 border border-slate-200 p-8 rounded-[2.5rem]">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Internal Audit Log</h3>
             <div className="space-y-4">
                <LogEntry time="LIVE" text="Analyzing Heating Profile..." active />
                {data.name && <LogEntry time="LEAD" text={`Qualified: ${data.name.split(' ')[0]}`} color="text-[#E31937]" />}
                {isEmergency && <LogEntry time="URGENT" text="Priority Dispatch Engaged" urgent />}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, isHighlighted = false, isFullWidth = false }: { label: string, value: string, isHighlighted?: boolean, isFullWidth?: boolean }) => (
  <div className={`${isFullWidth ? 'md:col-span-2' : ''}`}>
    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-3">{label}</p>
    <div className={`text-base font-bold px-0 py-1 transition-all flex items-center border-b-2 ${
      value 
        ? isHighlighted 
          ? 'border-[#E31937] text-[#E31937]' 
          : 'border-slate-800 text-[#1D1D1D]' 
        : 'border-slate-100 text-slate-300 font-medium italic'
    }`}>
      {value || `Waiting for input...`}
    </div>
  </div>
);

const ProgramTier = ({ label, rebate, isActive }: { label: string, rebate: string, isActive: boolean }) => (
  <div className={`p-5 rounded-3xl border transition-all duration-500 ${isActive ? 'bg-[#E31937] border-[#E31937] text-white shadow-lg -translate-y-1' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
    <div className="flex justify-between items-center">
      <span className={`text-[11px] font-black uppercase tracking-tight ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-2xl font-black ${isActive ? 'text-white' : 'text-[#1D1D1D]'}`}>{rebate}</span>
    </div>
  </div>
);

const LogEntry = ({ time, text, active = false, urgent = false, color }: { time: string, text: string, active?: boolean, urgent?: boolean, color?: string }) => (
  <div className="flex gap-4 text-[11px] items-start">
    <span className={`font-black tracking-tighter w-12 flex-shrink-0 ${urgent ? 'text-[#E31937]' : 'text-slate-400'}`}>{time}</span>
    <span className={`font-bold ${active ? 'text-blue-600' : urgent ? 'text-[#E31937] animate-pulse' : color || 'text-slate-500'}`}>{text}</span>
  </div>
);

export default Dashboard;
