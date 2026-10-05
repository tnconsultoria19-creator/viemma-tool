import React, { useState } from 'react';
import { 
  ArrowRight, 
  LogOut, 
  CheckCircle, 
  Clock, 
  FileText, 
  Calendar, 
  MapPin, 
  DollarSign, 
  MessageSquare, 
  Sparkles, 
  ExternalLink,
  Download,
  Send,
  User,
  ShieldCheck,
  Plane
} from 'lucide-react';
import { AppState } from '../types';
import { saveTripToCloud } from '../lib/tripService';

interface Props {
  tripsList: AppState[];
  currentTrip: AppState;
  onReturnHome: () => void;
  onStartPlanner: () => void;
  onSelectTrip: (tripRef: string) => void;
  onOpenItinerary: (tripRef: string) => void;
  onUpdateTrip?: (updatedTrip: AppState) => void;
}

export const ClientPortalView: React.FC<Props> = ({ 
  tripsList,
  currentTrip,
  onReturnHome, 
  onStartPlanner,
  onSelectTrip,
  onOpenItinerary,
  onUpdateTrip
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'dashboard'>('dashboard');
  const [guestEmail, setGuestEmail] = useState<string>(currentTrip?.client?.email || '');
  const [guestName, setGuestName] = useState<string>(currentTrip?.client?.name || 'Valued Guest');
  const [activeFeedbackTripId, setActiveFeedbackTripId] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string>('');

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMode('dashboard');
    triggerNotice(`Welcome back, ${guestName}!`);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setMode('dashboard');
    triggerNotice(`Welcome to Viemma Concierge, ${guestName}!`);
  };

  const handleAcceptProposal = async (trip: AppState) => {
    const updated: AppState = {
      ...trip,
      status: 'confirmed',
      priority: 'confirmed',
      version: (trip.version || 1) + 1,
      changeLog: [
        {
          id: `log_${Date.now()}`,
          version: (trip.version || 1) + 1,
          timestamp: new Date().toISOString(),
          author: `Client (${trip.client.name})`,
          category: 'Finance',
          action: 'Proposal Approved',
          description: 'Client officially accepted and confirmed the luxury journey proposal via the Client Portal.'
        },
        ...(trip.changeLog || [])
      ]
    };

    if (onUpdateTrip) onUpdateTrip(updated);
    await saveTripToCloud(updated, { 
      immediate: true, 
      changeDescription: 'Client accepted proposal via portal',
      author: trip.client.name 
    });
    triggerNotice(`🎉 Proposal ${trip.ref} confirmed and synchronized to operations!`);
  };

  const handleSendFeedback = async (trip: AppState) => {
    if (!feedbackNote.trim()) return;

    const updated: AppState = {
      ...trip,
      version: (trip.version || 1) + 1,
      internalNotes: `${trip.internalNotes || ''}\n[Client Feedback ${new Date().toLocaleDateString()}]: ${feedbackNote.trim()}`,
      changeLog: [
        {
          id: `log_${Date.now()}`,
          version: (trip.version || 1) + 1,
          timestamp: new Date().toISOString(),
          author: `Client (${trip.client.name})`,
          category: 'Activity',
          action: 'Client Adjustment Note',
          description: feedbackNote.trim()
        },
        ...(trip.changeLog || [])
      ]
    };

    if (onUpdateTrip) onUpdateTrip(updated);
    await saveTripToCloud(updated, { 
      immediate: true, 
      changeDescription: `Client requested adjustment: "${feedbackNote.trim()}"`,
      author: trip.client.name 
    });
    
    setFeedbackNote('');
    setActiveFeedbackTripId(null);
    triggerNotice(`Message sent directly to your Viemma private travel designer!`);
  };

  // Filter or prioritize trips list
  const displayTrips = tripsList && tripsList.length > 0 ? tripsList : [currentTrip];

  if (mode === 'dashboard') {
    return (
      <div className="min-h-screen font-sans selection:bg-[#D4AF37] selection:text-white flex flex-col items-center pb-24">
        {/* Floating Notification */}
        {actionNotice && (
          <div className="fixed top-6 right-6 z-[100] bg-[#1A3326] text-[#D4AF37] border border-[#D4AF37]/40 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
            <Sparkles size={16} className="text-[#D4AF37] shrink-0" />
            <span className="text-xs font-bold font-sans">{actionNotice}</span>
          </div>
        )}

        {/* Top Navbar */}
        <nav className="w-full p-6 flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex flex-col items-start cursor-pointer group" onClick={onReturnHome}>
            <span className="font-serif text-white text-xl font-bold tracking-tight">VIEMMA</span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold mt-0.5">VIP CLIENT CONCIERGE</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onReturnHome}
              className="text-xs font-bold text-gray-200 hover:text-white transition px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
            >
              Owner Cockpit
            </button>
            <button 
              onClick={() => setMode('login')}
              className="text-xs font-bold text-gray-200 hover:text-white transition flex items-center gap-1.5"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </nav>

        <div className="w-full max-w-6xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/15">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-3">
                <ShieldCheck size={13} /> Private Guest Account • {guestEmail}
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
                Welcome, {guestName}
              </h1>
              <p className="text-sm text-gray-200 font-medium">
                Manage your bespoke African journey proposals, approve quotations, and explore interactive itineraries.
              </p>
            </div>
            
            <button 
              onClick={onStartPlanner}
              className="bg-[#D4AF37] text-[#1A3326] px-6 py-3.5 rounded-2xl text-sm font-bold shadow-lg hover:bg-[#b8952b] transition flex items-center justify-center gap-2 shrink-0"
            >
              <Sparkles size={16} /> Plan New Expedition <ArrowRight size={16} />
            </button>
          </div>

          {/* Trips Collection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
                <Plane size={14} /> My Active Journeys & Proposals ({displayTrips.length})
              </h2>
              <span className="text-[11px] text-gray-300 font-mono">Real-time Cloud Sync ⚡</span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {displayTrips.map((trip) => {
                const isSelected = trip.ref === currentTrip?.ref;
                const status = trip.status || 'quoted';
                
                // Calculate quick total retail
                const f = trip.finance;
                const flightCosts = trip.flights?.reduce((s, x) => s + (x.cost * x.qty), 0) || 0;
                const transferCosts = trip.transfers?.reduce((s, x) => s + x.cost + x.tolls + x.parking, 0) || 0;
                const roomCosts = trip.rooms?.reduce((s, x) => s + (x.rate * x.nights) + x.supp, 0) || 0;
                const actCosts = trip.activities?.reduce((s, x) => s + (x.isFree ? 0 : x.total), 0) || 0;
                const totalCost = flightCosts + transferCosts + roomCosts + actCosts;
                const markup = f.marginType === '%' ? totalCost * (f.margin / 100) : f.margin;
                const totalZAR = Math.max(0, totalCost + markup + f.buffer - f.discount);

                return (
                  <div 
                    key={trip.ref}
                    className={`bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-[28px] border shadow-xl transition-all duration-300 ${
                      isSelected ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30' : 'border-white/20 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                            {trip.ref}
                          </span>
                          
                          {status === 'confirmed' && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                              <CheckCircle size={12} className="text-emerald-600" /> Confirmed Booking
                            </span>
                          )}
                          {(status === 'quoted' || status === 'draft') && (
                            <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                              <FileText size={12} className="text-blue-600" /> Proposal Ready for Review
                            </span>
                          )}
                          {status === 'in_travel' && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                              <Clock size={12} className="text-amber-600 animate-pulse" /> Currently In Travel
                            </span>
                          )}

                          <span className="text-xs text-gray-400 font-medium">
                            Designer: <strong>{trip.consultant || 'Elena Rostova'}</strong>
                          </span>
                        </div>

                        <h3 className="text-2xl font-serif font-bold text-gray-900">
                          {trip.title || `${trip.client.name}'s Bespoke Journey`}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-[#D4AF37]" />
                            {trip.client.startDate} → {trip.client.endDate} ({trip.client.durationText || 'Custom Duration'})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-[#D4AF37]" />
                            {trip.rooms?.[0]?.city || 'Southern Africa'} & Bush Expeditions
                          </span>
                          <span>•</span>
                          <span>Guests: <strong>{trip.guests?.length || trip.client.adults + trip.client.children} Travellers</strong></span>
                        </div>
                      </div>

                      {/* Pricing block */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100 min-w-[220px] text-right">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                          Quoted Total ({trip.finance.currency})
                        </span>
                        <span className="text-2xl font-mono font-bold text-[#1A3326] block">
                          R {Math.round(totalZAR).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                          All-inclusive bespoke itinerary
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Interactive Itinerary View */}
                        <button 
                          onClick={() => {
                            onSelectTrip(trip.ref);
                            onOpenItinerary(trip.ref);
                          }}
                          className="px-5 py-3 rounded-xl bg-[#1A3326] hover:bg-[#12241b] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                        >
                          <ExternalLink size={14} className="text-[#D4AF37]" /> View Interactive Itinerary
                        </button>

                        {/* Accept / Approve button */}
                        {status !== 'confirmed' && (
                          <button 
                            onClick={() => handleAcceptProposal(trip)}
                            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                          >
                            <CheckCircle size={14} /> Accept & Confirm Proposal
                          </button>
                        )}

                        {/* Leave note */}
                        <button 
                          onClick={() => setActiveFeedbackTripId(activeFeedbackTripId === trip.ref ? null : trip.ref)}
                          className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <MessageSquare size={14} /> {activeFeedbackTripId === trip.ref ? 'Cancel Note' : 'Request Adjustment'}
                        </button>
                      </div>

                      <span className="text-xs text-gray-400 font-medium">
                        Last Cloud Sync: {new Date().toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Feedback / Adjustment Note Drawer */}
                    {activeFeedbackTripId === trip.ref && (
                      <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 animate-in fade-in duration-300">
                        <label className="text-xs font-bold text-gray-800 flex items-center gap-2">
                          <MessageSquare size={14} className="text-[#D4AF37]" /> Leave a note or custom adjustment request for your travel designer:
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text"
                            placeholder="e.g., Can we swap the Day 3 morning safari for a helicopter flip over Table Mountain?"
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#D4AF37]"
                          />
                          <button 
                            onClick={() => handleSendFeedback(trip)}
                            className="px-5 py-3 bg-[#D4AF37] hover:bg-[#b8952b] text-[#1A3326] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
                          >
                            <Send size={13} /> Send Note
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Mode
  if (mode === 'register') {
    return (
      <div className="min-h-screen font-sans selection:bg-[#D4AF37] flex flex-col items-center justify-center p-6 relative">
        <button onClick={onReturnHome} className="absolute top-8 left-8 text-xs font-bold text-gray-200 hover:text-white transition flex items-center gap-2 uppercase tracking-wider">
          <ArrowRight size={14} className="rotate-180" /> Home
        </button>
        
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md p-8 md:p-10 rounded-[32px] shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <span className="font-serif text-[#1A3326] text-3xl font-bold tracking-tight">VIEMMA</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold mt-1 block">VIP Client Concierge</span>
            <h2 className="text-xl font-serif text-gray-900 mt-6">Create your guest account</h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input 
                  type="text" 
                  placeholder="First Name" 
                  required 
                  value={guestName.split(' ')[0] || ''}
                  onChange={(e) => setGuestName(`${e.target.value} ${guestName.split(' ')[1] || ''}`)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#D4AF37]" 
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Last Name" 
                  required 
                  value={guestName.split(' ')[1] || ''}
                  onChange={(e) => setGuestName(`${guestName.split(' ')[0] || ''} ${e.target.value}`)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#D4AF37]" 
                />
              </div>
            </div>
            <div>
              <input 
                type="email" 
                placeholder="Email Address" 
                required 
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#D4AF37]" 
              />
            </div>
            <div>
              <input type="password" placeholder="Password" defaultValue="vipguest2026" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#D4AF37]" />
            </div>

            <button type="submit" className="w-full bg-[#1A3326] text-white py-4 rounded-xl font-bold text-sm shadow-md hover:bg-[#12241b] transition mt-6">
              Access My Journeys
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6 font-medium">
            Already have a booking? <button onClick={() => setMode('login')} type="button" className="text-[#D4AF37] font-bold hover:underline">Sign In</button>
          </p>
        </div>
      </div>
    );
  }

  // Login Mode
  return (
    <div className="min-h-screen font-sans selection:bg-[#D4AF37] flex flex-col items-center justify-center p-6 relative">
      <button onClick={onReturnHome} className="absolute top-8 left-8 text-xs font-bold text-gray-200 hover:text-white transition flex items-center gap-2 uppercase tracking-wider">
        <ArrowRight size={14} className="rotate-180" /> Home
      </button>
      
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md p-8 md:p-10 rounded-[32px] shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <span className="font-serif text-[#1A3326] text-3xl font-bold tracking-tight">VIEMMA</span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold mt-1 block">VIP Client Concierge</span>
          <h2 className="text-xl font-serif text-gray-900 mt-6">Sign in to your account</h2>
          <p className="text-xs text-gray-500 mt-1">Access your confirmed proposals and itineraries</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Email or Booking Reference</label>
            <input 
              type="text" 
              placeholder="e.g. lead@harrisonfamily.com or VT-2026-9999" 
              required 
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#D4AF37]" 
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Password / Access PIN</label>
            <input 
              type="password" 
              placeholder="Password" 
              defaultValue="vipguest2026" 
              required 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#D4AF37]" 
            />
          </div>

          <button type="submit" className="w-full bg-[#1A3326] text-white py-4 rounded-xl font-bold text-sm shadow-md hover:bg-[#12241b] transition mt-2">
            Sign In & View Proposals
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium">
          <button onClick={() => setMode('register')} type="button" className="text-[#D4AF37] font-bold hover:underline">
            Create Account
          </button>
          <button 
            onClick={() => {
              setGuestEmail('guest@viemmatours.com');
              setGuestName('Valued Guest');
              setMode('dashboard');
            }} 
            type="button" 
            className="text-gray-500 hover:text-gray-800"
          >
            Quick Guest Demo
          </button>
        </div>
      </div>
    </div>
  );
};
