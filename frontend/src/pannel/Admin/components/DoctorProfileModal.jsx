import React from 'react';
import { 
  X, UserRound, ShieldCheck, Clock, Briefcase, 
  DollarSign, MapPin, Phone, CheckCircle2 
} from 'lucide-react';

const DoctorProfileModal = ({ doctor, onClose, onApprove }) => {
  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xl animate-in fade-in duration-300">
       <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative border border-white/50 dark:border-slate-800/80 animate-in slide-in-from-bottom-5 duration-300">
          {/* Profile Background */}
          <div className="h-40 bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-20"></div>
            <div className="absolute bottom-0 inset-x-0 h-10 bg-linear-to-t from-white/90 dark:from-slate-900/90 to-transparent"></div>
          </div>
          
          <button 
             onClick={onClose} 
             className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all z-10 shadow-sm"
          >
             <X className="w-5 h-5"/>
          </button>

          <div className="px-10 pb-10 relative">
             <div className="flex justify-between items-end -mt-20 mb-8">
                <div className="w-32 h-32 rounded-[32px] border-8 border-white dark:border-slate-900 bg-white dark:bg-slate-800 overflow-hidden shadow-2xl shadow-indigo-500/20 shrink-0 relative">
                   {doctor.doctorId?.profileImage ? (
                      <img src={doctor.doctorId.profileImage} alt="" className="w-full h-full object-cover" />
                   ) : (
                      <UserRound className="w-full h-full p-6 text-gray-300" />
                   )}
                </div>
                <div className="flex gap-2 mb-4">
                   {doctor.isVerified ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-linear-to-br from-emerald-400 to-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                        <ShieldCheck className="w-4 h-4" />
                        Official Provider
                      </div>
                   ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-linear-to-br from-amber-400 to-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/30">
                        <Clock className="w-4 h-4" />
                        Awaiting Evaluation
                      </div>
                   )}
                </div>
             </div>

             <div className="space-y-1 mb-8">
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{doctor.doctorId?.fullname || doctor.doctor}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs tracking-[0.2em]">{doctor.specialization}</p>
             </div>

             <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex flex-col gap-6">
                   <div className="flex items-center gap-4 bg-gray-50/80 dark:bg-slate-800/80 p-4 rounded-3xl border border-gray-100 dark:border-slate-700/50">
                      <div className="p-3 bg-white dark:bg-slate-700 rounded-[16px] shadow-sm"><Briefcase className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /></div>
                      <div>
                         <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Medical Experience</p>
                         <p className="text-base font-black text-gray-900 dark:text-white">{doctor.experience} Years Active</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 bg-gray-50/80 dark:bg-slate-800/80 p-4 rounded-3xl border border-gray-100 dark:border-slate-700/50">
                      <div className="p-3 bg-white dark:bg-slate-700 rounded-[16px] shadow-sm"><DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /></div>
                      <div>
                         <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Initial Consultation</p>
                         <p className="text-base font-black text-gray-900 dark:text-white">₹{doctor.consultationFee}</p>
                      </div>
                   </div>
                </div>
                
                <div className="flex flex-col gap-6">
                   <div className="flex items-center gap-4 bg-gray-50/80 dark:bg-slate-800/80 p-4 rounded-3xl border border-gray-100 dark:border-slate-700/50">
                      <div className="p-3 bg-white dark:bg-slate-700 rounded-[16px] shadow-sm"><MapPin className="w-5 h-5 text-rose-500 dark:text-rose-400" /></div>
                      <div>
                         <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Operating Facility</p>
                         <p className="text-sm font-black text-gray-900 dark:text-white truncate max-w-35">{doctor.clinicName || "Private Practice"}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 bg-gray-50/80 dark:bg-slate-800/80 p-4 rounded-3xl border border-gray-100 dark:border-slate-700/50">
                      <div className="p-3 bg-white dark:bg-slate-700 rounded-[16px] shadow-sm"><Phone className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /></div>
                      <div>
                         <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Contact Identity</p>
                         <p className="text-sm font-black text-gray-900 dark:text-white">{doctor.doctorId?.phone || "Restricted"}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="mt-8 flex gap-4">
                <button className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-[20px] text-[13px] font-black text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest">
                   <Clock className="w-4 h-4" />
                   Inspect Routine
                </button>
                {!doctor.isVerified && (
                   <button onClick={() => onApprove(doctor._id)} className="flex-2 py-4 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-[20px] text-[13px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Officially Endorse
                   </button>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default DoctorProfileModal;
