import React from 'react';
import { ArrowRight, Plane, Building } from 'lucide-react';

interface Props {
  onSelectMode: (mode: 'admin' | 'planner') => void;
}

export const LandingPageView: React.FC<Props> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen font-sans selection:bg-[#D4AF37] selection:text-white flex flex-col items-center justify-center relative overflow-hidden p-6">
      
      {/* Background Graphic elements - Crisp & Vivid Botanical Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.pexels.com/photos/7843687/pexels-photo-7843687.jpeg?auto=compress&cs=tinysrgb&w=1920" 
          alt="Lush Green Plant Background" 
          className="w-full h-full object-cover" 
        />
        {/* Transparent subtle edge gradient only for text contrast without tinting or covering */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
      </div>

      <div className="w-full max-w-4xl mx-auto space-y-16 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex flex-col items-center">
            <span className="font-serif text-white text-4xl md:text-6xl font-bold tracking-tight">VIEMMA</span>
            <span className="text-xs md:text-sm uppercase tracking-[0.4em] text-[#D4AF37] font-bold mt-2">TOURS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-white drop-shadow-md">Choose Your Experience</h1>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Operations Workspace */}
          <button 
            onClick={() => onSelectMode('admin')}
            className="group bg-white/95 backdrop-blur-sm p-8 md:p-10 rounded-[32px] border border-white/20 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#1A3326] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#1A3326] mb-8 group-hover:scale-110 transition-transform">
              <Building size={24} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">Operations Workspace</h2>
            <p className="text-sm text-gray-600 font-medium leading-relaxed mb-8 min-h-[60px]">
              For Viemma consultants to build, manage, cost, publish, and operate luxury journeys.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1A3326] group-hover:text-[#D4AF37] transition-colors">
              Enter Operations Workspace <ArrowRight size={14} />
            </div>
          </button>

          {/* Journey Planner */}
          <button 
            onClick={() => onSelectMode('planner')}
            className="group bg-[#1A3326]/95 backdrop-blur-sm p-8 md:p-10 rounded-[32px] border border-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-8 group-hover:scale-110 transition-transform">
              <Plane size={24} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-3">Plan Your Journey</h2>
            <p className="text-sm text-gray-300 font-medium leading-relaxed mb-8 min-h-[60px]">
              For travellers and partner agencies to tell us about their dream trip and submit a detailed travel request.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37] group-hover:text-white transition-colors">
              Start Planning <ArrowRight size={14} />
            </div>
          </button>

        </div>
      </div>

    </div>
  );
};
