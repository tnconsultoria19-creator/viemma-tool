import React, { useState } from 'react';
import { AppState, Activity, Guide } from '../types';
import { DB_DEFAULT } from '../dbDefaults';
import { 
  Route, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Users, 
  Clock, 
  Compass, 
  Info,
  Calendar,
  Tag,
  AlertCircle,
  Phone,
  CloudSun,
  ShieldCheck,
  Camera,
  Layers,
  HelpCircle,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ActivitiesViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onAddActivity: (act: Activity) => void;
  onRemoveActivity: (id: number) => void;
  onUpdateActivity: (id: number, updates: Partial<Activity>) => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  state,
  onUpdateState,
  onAddActivity,
  onRemoveActivity,
  onUpdateActivity
}) => {
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [aForm, setAForm] = useState<Partial<Activity>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'operational' | 'pricing' | 'pax'>('basic');
  const [expandedActivityIds, setExpandedActivityIds] = useState<number[]>([]);
  const guides = state.guides?.length ? state.guides : DB_DEFAULT.guides as Guide[];

  const toggleActivityExpand = (id: number) => {
    setExpandedActivityIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleOpenAddForm = () => {
    setAForm({
      day: 1,
      slot: 'Morning',
      name: 'Table Mountain Cableway Scenic Excursion',
      desc: 'Bespoke aerial cableway return trip to Table Mountain summit.',
      pickup: '09:00',
      start: '09:30',
      dur: '3 hours',
      pickupLoc: 'The Silo Hotel Lobby',
      status: 'Planned',
      conf: '',
      supplier: 'Table Mountain Aerial Cableway Co.',
      supPhone: '+27 21 424 8408',
      paxIds: state.guests.map(g => g.id),
      pAdult: 420,
      pChild: 210,
      nAdult: state.guests.filter(g => g.age !== 'Child' && g.age !== 'Infant').length,
      nChild: state.guests.filter(g => g.age === 'Child' || g.age === 'Infant').length,
      flat: 0,
      total: 0,
      inc: ["Entrance Tickets", "Chartered Vehicle Transfers", "Bottled Water"],
      backup: 'In case of strong winds, replace Table Mountain Cableway with Kirstenbosch National Botanical Gardens Guided Hike.',
      notes: 'Honeymoon couple traveling. Spotting Cape Rock Hyrax (Dassies) is a high interest.',
      isFree: false,

      // Expanded Operational Knowledge Object Fields
      heroImage: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=600',
      gallery: [],
      difficulty: 'Easy',
      suitableAges: 'All Ages',
      accessibility: ['Stroller Accessible', 'Wheelchair accessible summit walkways'],
      weatherDependency: 'High (Wind & Cloud Cover dependent)',
      dropoffLoc: 'Return to Hotel',
      excluded: ['Lunch', 'Gratuities', 'Personal Curios'],
      packingAdvice: 'Windbreaker jacket, sunglasses, comfortable walking shoes, sun protection.',
      dressCode: 'Casual Outdoor Luxury',
      safetyNotes: 'Always stay on demarcated stone pathways at the summit. Hydrate.',
      photographyOpportunities: 'Unparalleled 360-degree Cape Town skyline views, Twelve Apostles mountain chain, and Robben Island.',
      seasonalAvailability: 'Year-round (Best during clear summer months)',
      faqs: [
        { question: 'Is there food at the summit?', answer: 'Yes, a café and souvenir shop are fully operational at the top station.' }
      ],
      guideNotes: 'Ensure the driver-guide registers ticket codes before arriving to bypass the main visitor ticketing queue.'
    });
    setActiveTab('basic');
    setEditingActivityId(-1);
  };

  const handleEditActivity = (a: Activity) => {
    setAForm({ 
      ...a,
      difficulty: a.difficulty || 'Easy',
      suitableAges: a.suitableAges || 'All Ages',
      accessibility: a.accessibility || [],
      weatherDependency: a.weatherDependency || 'Low',
      dropoffLoc: a.dropoffLoc || 'Return to Hotel',
      excluded: a.excluded || [],
      packingAdvice: a.packingAdvice || '',
      dressCode: a.dressCode || '',
      safetyNotes: a.safetyNotes || '',
      photographyOpportunities: a.photographyOpportunities || '',
      seasonalAvailability: a.seasonalAvailability || 'Year-round',
      faqs: a.faqs || [],
      guideNotes: a.guideNotes || a.notes || '',
      guideId: a.guideId || '',
      guideName: a.guideName || '',
      guidePhone: a.guidePhone || '',
      guideSourceAgentId: a.guideSourceAgentId || '',
      guideSourceAgentName: a.guideSourceAgentName || ''
    });
    setActiveTab('basic');
    setEditingActivityId(a.id);
  };

  const handleDbPrefill = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const item = DB_DEFAULT.activities.find(a => a.name === val);
    if (item) {
      const adCount = state.guests.filter(g => g.age !== 'Child' && g.age !== 'Infant').length;
      const chCount = state.guests.filter(g => g.age === 'Child' || g.age === 'Infant').length;
      const calcTotal = (item.adPrice * adCount) + (item.chPrice * chCount);

      setAForm({
        ...aForm,
        name: item.name,
        desc: item.desc,
        pAdult: item.adPrice,
        pChild: item.chPrice,
        nAdult: adCount,
        nChild: chCount,
        total: calcTotal,
        supplier: item.name,
        difficulty: 'Easy',
        weatherDependency: item.name.includes("Mountain") ? 'High' : 'Medium',
        inc: ["Entrance Fees", "Viemma Bottled Water"],
        excluded: ["Lunch", "Guide tips"]
      });
    }
  };

  const handleRecalculateCost = (updatedForm: Partial<Activity>) => {
    const form = { ...aForm, ...updatedForm };
    let total = 0;
    if (form.isFree) {
      total = 0;
    } else if (Number(form.flat) > 0) {
      total = Number(form.flat);
    } else {
      total = ((Number(form.pAdult) || 0) * (Number(form.nAdult) || 0)) +
              ((Number(form.pChild) || 0) * (Number(form.nChild) || 0));
    }
    setAForm({ ...form, total });
  };

  const handleSaveActivity = () => {
    if (!aForm.name) {
      alert('Activity name is required.');
      return;
    }

    const savedActivity: Activity = {
      id: aForm.id || Date.now(),
      day: Number(aForm.day) || 1,
      slot: aForm.slot || 'Morning',
      name: aForm.name,
      desc: aForm.desc || '',
      pickup: aForm.pickup || '',
      start: aForm.start || '',
      dur: aForm.dur || '',
      pickupLoc: aForm.pickupLoc || '',
      status: aForm.status || 'Planned',
      conf: aForm.conf || '',
      supplier: aForm.supplier || '',
      supPhone: aForm.supPhone || '',
      paxIds: aForm.paxIds || [],
      pAdult: Number(aForm.pAdult) || 0,
      pChild: Number(aForm.pChild) || 0,
      nAdult: Number(aForm.nAdult) || 0,
      nChild: Number(aForm.nChild) || 0,
      flat: Number(aForm.flat) || 0,
      total: Number(aForm.total) || 0,
      inc: aForm.inc || [],
      backup: aForm.backup || '',
      notes: aForm.notes || '',
      isFree: aForm.isFree || false,

      // Operational Knowledge fields
      heroImage: aForm.heroImage || '',
      gallery: aForm.gallery || [],
      difficulty: aForm.difficulty || 'Easy',
      suitableAges: aForm.suitableAges || 'All Ages',
      accessibility: aForm.accessibility || [],
      weatherDependency: aForm.weatherDependency || 'Low',
      dropoffLoc: aForm.dropoffLoc || '',
      excluded: aForm.excluded || [],
      packingAdvice: aForm.packingAdvice || '',
      dressCode: aForm.dressCode || '',
      safetyNotes: aForm.safetyNotes || '',
      photographyOpportunities: aForm.photographyOpportunities || '',
      seasonalAvailability: aForm.seasonalAvailability || '',
      faqs: aForm.faqs || [],
      guideNotes: aForm.guideNotes || '',
      guideId: aForm.guideId || '',
      guideName: aForm.guideName || '',
      guidePhone: aForm.guidePhone || '',
      guideSourceAgentId: aForm.guideSourceAgentId || '',
      guideSourceAgentName: aForm.guideSourceAgentName || ''
    };

    if (editingActivityId === -1) {
      onAddActivity(savedActivity);
    } else {
      onUpdateActivity(savedActivity.id, savedActivity);
    }
    setEditingActivityId(null);
    setAForm({});
  };

  const togglePassengerSelection = (paxId: number) => {
    const list = aForm.paxIds ? [...aForm.paxIds] : [];
    let updated: number[];
    if (list.includes(paxId)) {
      updated = list.filter(id => id !== paxId);
    } else {
      updated = [...list, paxId];
    }
    handleRecalculateCost({ paxIds: updated });
  };

  const toggleIncSelection = (inc: string) => {
    const list = aForm.inc ? [...aForm.inc] : [];
    const updated = list.includes(inc) ? list.filter(x => x !== inc) : [...list, inc];
    setAForm({ ...aForm, inc: updated });
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
            <Compass size={14} /> EXCURSION & KNOWLEDGE CORRIDOR
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Experiences & Daily Operational Timeline</h1>
          <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">
            Configure guided game drives, luxury winery crawls, scenic cableway excursions, and deep wilderness trips as operational knowledge objects with safety rules and guide protocols.
          </p>
        </div>
        {editingActivityId === null && (
          <button 
            onClick={handleOpenAddForm} 
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-bold shadow-md hover:translate-y-[-1px] transition duration-150 shrink-0"
          >
            <Plus size={14} /> Link Luxury Excursion
          </button>
        )}
      </div>

      {/* DETAILED WORKSPACE FORM */}
      {editingActivityId !== null && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A3326] to-[#224433] text-white p-6 md:p-8 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block mb-1">Interactive Catalog Dispatch</span>
              <h2 className="text-xl md:text-2xl font-bold font-sans flex items-center gap-2">
                <Compass size={20} className="text-[#D4AF37]" />
                {editingActivityId === -1 ? 'Configure Excursion Object' : 'Update Excursion Object'}
              </h2>
            </div>
            <div className="flex gap-3 text-xs">
              <button 
                onClick={() => setEditingActivityId(null)} 
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveActivity} 
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#1A3326] hover:bg-[#b89528] font-bold shadow-sm hover:translate-y-[-1px] transition-all"
              >
                Save Outing Rules
              </button>
            </div>
          </div>

          {/* Modal Tabs inside Excursion form */}
          <div className="flex border-b border-gray-100 px-8 bg-white overflow-x-auto text-xs font-bold text-gray-500 shrink-0">
            <button 
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${activeTab === 'basic' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
            >
              1. Basic Excursion
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('operational')}
              className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${activeTab === 'operational' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
            >
              2. Operational Knowledge
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${activeTab === 'pricing' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
            >
              3. Supplier & Pricing
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('pax')}
              className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${activeTab === 'pax' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
            >
              4. Traveler Alignment
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-gray-50/50">
            
            {/* TAB 1: BASIC OUTING DETAILS */}
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-gradient-to-r from-yellow-500/5 to-yellow-500/10 rounded-[20px] p-6 border border-[#D4AF37]/20 shadow-xs space-y-3">
                  <label className="text-[11px] text-[#1A3326] font-bold uppercase tracking-wider block">Autofill from Master Experience Presets (Optional)</label>
                  <select 
                    onChange={handleDbPrefill}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-[#D4AF37] focus:ring-1 transition"
                  >
                    <option value="">Select an experience preset...</option>
                    {DB_DEFAULT.activities.map(a => (
                      <option key={a.id} value={a.name}>{a.name} — standard Net Adult: R{a.adPrice}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Calendar size={14} className="text-[#D4AF37]" /> Core Outing Timeline
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Itinerary Day Number</label>
                      <input 
                        type="number" 
                        value={aForm.day || 1}
                        onChange={e => setAForm({ ...aForm, day: Number(e.target.value) })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Time Slot Block</label>
                      <select 
                        value={aForm.slot || 'Morning'}
                        onChange={e => setAForm({ ...aForm, slot: e.target.value as any })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                      >
                        <option value="Morning">Morning Excursion</option>
                        <option value="Afternoon">Afternoon Excursion</option>
                        <option value="Evening">Evening Safari Sunset</option>
                        <option value="Full Day">Full Day Epic Expedition</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Operation Dispatch Status</label>
                      <select 
                        value={aForm.status || 'Planned'}
                        onChange={e => setAForm({ ...aForm, status: e.target.value as any })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                      >
                        <option value="Planned">Planned / Hold</option>
                        <option value="Requested">Requested (Awaiting supplier response)</option>
                        <option value="Confirmed">Confirmed & Voucher Dispatched</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Excursion Activity Label</label>
                      <input 
                        type="text" 
                        value={aForm.name || ''} 
                        onChange={e => setAForm({ ...aForm, name: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                        placeholder="e.g. Table Mountain Scenic Cableway Tour" 
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Brief Description</label>
                      <input 
                        type="text" 
                        value={aForm.desc || ''} 
                        onChange={e => setAForm({ ...aForm, desc: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                        placeholder="e.g. Return tickets to the crest of Table Mountain, Cape Town guide included." 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Clock size={14} className="text-[#D4AF37]" /> Logistics Timing & Launch Locations
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Vehicle Pickup Time (LT)</label>
                      <input 
                        type="text" 
                        value={aForm.pickup || ''} 
                        onChange={e => setAForm({ ...aForm, pickup: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                        placeholder="09:00" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Excursion Launch Time</label>
                      <input 
                        type="text" 
                        value={aForm.start || ''} 
                        onChange={e => setAForm({ ...aForm, start: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                        placeholder="09:30" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Expected Field Duration</label>
                      <input 
                        type="text" 
                        value={aForm.dur || ''} 
                        onChange={e => setAForm({ ...aForm, dur: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition" 
                        placeholder="e.g. 3 hours"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Detailed Pickup Point</label>
                      <input 
                        type="text" 
                        value={aForm.pickupLoc || ''} 
                        onChange={e => setAForm({ ...aForm, pickupLoc: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition" 
                        placeholder="e.g. Hotel Main Lobby"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OPERATIONAL KNOWLEDGE OBJECT */}
            {activeTab === 'operational' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Compass size={14} className="text-[#D4AF37]" /> Curated Excursion Knowledge Specs
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Physical Difficulty Level</label>
                      <select 
                        value={aForm.difficulty || 'Easy'}
                        onChange={e => setAForm({ ...aForm, difficulty: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37]"
                      >
                        <option value="Easy">Easy (Gently walking)</option>
                        <option value="Moderate">Moderate (Stairs / uneven ground)</option>
                        <option value="Strenuous">Strenuous (Long hikes / high altitude)</option>
                        <option value="N/A">N/A (Scenic drive / vehicle only)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Suitable Age Groups</label>
                      <input 
                        type="text" 
                        value={aForm.suitableAges || 'All Ages'}
                        onChange={e => setAForm({ ...aForm, suitableAges: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:border-[#D4AF37]"
                        placeholder="e.g. All Ages, 12+ recommended"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Weather Dependency Alert</label>
                      <select 
                        value={aForm.weatherDependency || 'Low'}
                        onChange={e => setAForm({ ...aForm, weatherDependency: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37]"
                      >
                        <option value="Low">Low (Operates rain or shine)</option>
                        <option value="Medium">Medium (Strong winds or rain can hinder)</option>
                        <option value="High (Wind & Cloud Cover dependent)">High (Full weather dependent, require backup)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Expected Drop-off Location</label>
                      <input 
                        type="text" 
                        value={aForm.dropoffLoc || ''}
                        onChange={e => setAForm({ ...aForm, dropoffLoc: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800"
                        placeholder="e.g. Return to lodging lobby, drop-off at Waterfront Restaurant"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Seasonal Excursion Availability</label>
                      <input 
                        type="text" 
                        value={aForm.seasonalAvailability || 'Year-round'}
                        onChange={e => setAForm({ ...aForm, seasonalAvailability: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800"
                        placeholder="e.g. Year-round, September to March (Whales)"
                      />
                    </div>
                  </div>
                </div>

                {/* Excursion Logistics Specifics */}
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#D4AF37]" /> Packing Advice, Safety & Dress Codes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Luxury Packing Advice</label>
                      <textarea 
                        value={aForm.packingAdvice || ''}
                        onChange={e => setAForm({ ...aForm, packingAdvice: e.target.value })}
                        rows={2}
                        className="w-full p-3 rounded-lg border border-gray-200 text-xs focus:border-[#D4AF37]"
                        placeholder="Windbreaker, sunblock, comfortable closed walking shoes..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Dress Code Etiquette</label>
                      <textarea 
                        value={aForm.dressCode || ''}
                        onChange={e => setAForm({ ...aForm, dressCode: e.target.value })}
                        rows={2}
                        className="w-full p-3 rounded-lg border border-gray-200 text-xs focus:border-[#D4AF37]"
                        placeholder="Casual outdoor safari, smart casual, active hiking dress..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Photography Advice & Opportunities</label>
                      <textarea 
                        value={aForm.photographyOpportunities || ''}
                        onChange={e => setAForm({ ...aForm, photographyOpportunities: e.target.value })}
                        rows={2}
                        className="w-full p-3 rounded-lg border border-gray-200 text-xs focus:border-[#D4AF37]"
                        placeholder="Perfect for sunset zoom lenses, wildlife close-ups..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Wilderness Safety Instructions</label>
                      <textarea 
                        value={aForm.safetyNotes || ''}
                        onChange={e => setAForm({ ...aForm, safetyNotes: e.target.value })}
                        rows={2}
                        className="w-full p-3 rounded-lg border border-gray-200 text-xs focus:border-[#D4AF37]"
                        placeholder="Demarcated path rules, baboon safety guidelines, keep hydrated..."
                      />
                    </div>
                  </div>
                </div>

                {/* Guide Assignment */}
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-5">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Users size={14} className="text-[#D4AF37]" /> Guide Assignment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Assigned Guide</label>
                      <select
                        value={aForm.guideId || ''}
                        onChange={e => {
                          const guide = guides.find(g => g.id === e.target.value);
                          setAForm({
                            ...aForm,
                            guideId: guide?.id || '',
                            guideName: guide?.name || '',
                            guidePhone: guide?.phone || '',
                            guideSourceAgentId: guide?.sourceAgentId || '',
                            guideSourceAgentName: guide?.sourceAgentName || ''
                          });
                        }}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-[#D4AF37] transition"
                      >
                        <option value="">Select guide...</option>
                        {guides.map(guide => (
                          <option key={guide.id} value={guide.id}>
                            {guide.name} — {guide.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Guide Contact</label>
                        <div className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-slate-50 flex items-center text-xs font-semibold text-gray-700">
                          {aForm.guidePhone || 'Select a guide'}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Source Agent / Agency</label>
                        <div className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-slate-50 flex items-center text-xs font-semibold text-gray-700">
                          {aForm.guideSourceAgentName || 'Not assigned'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Specific Guide Notes */}
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <FileText size={14} className="text-[#D4AF37]" /> Role-Specific Guide Coordination Notes (Internal)
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    These notes remain strictly internal and are visible exclusively to driver-guides and tour escorts for pristine on-site concierge execution.
                  </p>
                  <textarea 
                    value={aForm.guideNotes || ''} 
                    onChange={e => setAForm({ ...aForm, guideNotes: e.target.value })}
                    className="w-full p-4 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#D4AF37] text-[#1A3326]"
                    placeholder="e.g. Ensure the guide coordinates bypass queue tickets, client has knee issue so suggest elevator boarding..."
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: SUPPLIER & PRICING */}
            {activeTab === 'pricing' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Users size={14} className="text-[#D4AF37]" /> Supplier Contact Dossier
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Contracted Supplier Name</label>
                      <input 
                        type="text" 
                        value={aForm.supplier || ''} 
                        onChange={e => setAForm({ ...aForm, supplier: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                        placeholder="e.g. Table Mountain Co." 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Emergency Supplier Phone Hotline</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <Phone size={12} />
                        </span>
                        <input 
                          type="text" 
                          value={aForm.supPhone || ''} 
                          onChange={e => setAForm({ ...aForm, supPhone: e.target.value })}
                          className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                          placeholder="+27 21 424 8408" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider flex items-center gap-2">
                      <Tag size={14} className="text-[#D4AF37]" /> Financial Rates & Ticket Surcharges
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={aForm.isFree || false} 
                        onChange={e => handleRecalculateCost({ isFree: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-[#D4AF37]" 
                      />
                      <span>Complimentary / Free Spot</span>
                    </label>
                  </div>

                  {!aForm.isFree && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Net Adult Rate (R)</label>
                        <input 
                          type="number" 
                          value={aForm.pAdult || 0} 
                          onChange={e => handleRecalculateCost({ pAdult: Number(e.target.value) })}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37]" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Linked Adults Count</label>
                        <input 
                          type="number" 
                          value={aForm.nAdult || 0} 
                          onChange={e => handleRecalculateCost({ nAdult: Number(e.target.value) })}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37]" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Net Child Rate (R)</label>
                        <input 
                          type="number" 
                          value={aForm.pChild || 0} 
                          onChange={e => handleRecalculateCost({ pChild: Number(e.target.value) })}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37]" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Linked Children Count</label>
                        <input 
                          type="number" 
                          value={aForm.nChild || 0} 
                          onChange={e => handleRecalculateCost({ nChild: Number(e.target.value) })}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37]" 
                        />
                      </div>

                      <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-[11px] text-gray-500 font-bold uppercase block">Flat Bulk Group Rate Override (R)</label>
                        <input 
                          type="number" 
                          value={aForm.flat || 0} 
                          onChange={e => handleRecalculateCost({ flat: Number(e.target.value) })}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37]" 
                          placeholder="e.g. flat R 5000 for whole vehicle"
                        />
                      </div>

                      <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-[11px] text-gray-500 font-bold uppercase block text-[#1A3326]">Total Valuation Net Sum</label>
                        <div className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-emerald-50 text-[#1A3326] font-bold flex items-center text-xs">
                          R {(aForm.total || 0).toLocaleString()} Net Cost
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exclusions and Inclusions */}
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Layers size={14} className="text-[#D4AF37]" /> Contract Inclusions & Exclusions
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">DMC Included Items</label>
                      <div className="flex flex-wrap gap-2">
                        {["Entrance Tickets", "Chartered Vehicle Transfers", "Bottled Water", "English Driver-Guide", "French Private Escort", "Gourmet Lunch Box", "Wine Tasting Fees"].map(inc => {
                          const isSelected = aForm.inc?.includes(inc) || false;
                          return (
                            <span 
                              key={inc}
                              onClick={() => toggleIncSelection(inc)}
                              className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer select-none transition ${
                                isSelected ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-500'
                              }`}
                            >
                              {inc}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Items Excluded (Custom lists)</label>
                      <input 
                        type="text" 
                        value={aForm.excluded?.join(', ') || ''}
                        onChange={e => setAForm({ ...aForm, excluded: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#D4AF37]"
                        placeholder="e.g. Lunch, Gratuities, Alcoholic drinks (comma separated)"
                      />
                    </div>
                  </div>
                </div>

                {/* Backup / Plan B contingency */}
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block text-amber-700">Contingency Plan B / Weather Backup Rules</label>
                  <textarea 
                    value={aForm.backup || ''} 
                    onChange={e => setAForm({ ...aForm, backup: e.target.value })}
                    rows={2}
                    className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-amber-500"
                    placeholder="If extreme wind conditions occur Table Mountain closes; automatically redirect passengers to Kirstenbosch Gardens Guided Walks."
                  />
                </div>
              </div>
            )}

            {/* TAB 4: PASSENGER ALIGNMENT */}
            {activeTab === 'pax' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Users size={14} className="text-[#D4AF37]" /> Map Registered Travelers to Excursion
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Allocate travelers from the group roster to this guided excursion for operations manifestation sheets.
                  </p>

                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {state.guests.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">No travelers listed in main roster.</span>
                    ) : (
                      state.guests.map(g => {
                        const isSelected = aForm.paxIds?.includes(g.id) || false;
                        return (
                          <span 
                            key={g.id} 
                            onClick={() => togglePassengerSelection(g.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border select-none transition duration-150 flex items-center gap-1.5 hover:translate-y-[-1px] ${
                              isSelected 
                                ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' 
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {isSelected && <Check size={12} className="text-[#D4AF37]" />}
                            {g.first} {g.last} ({g.age})
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Sticky footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3.5">
            <button 
              onClick={() => setEditingActivityId(null)} 
              className="px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-sm transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveActivity} 
              className="px-6 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-extrabold shadow-md hover:translate-y-[-1px] transition duration-150"
            >
              Save Outing Rules
            </button>
          </div>

        </div>
      )}

      {/* REGISTERED EXCURSIONS TIMELINE LIST */}
      <div className="space-y-6">
        {state.activities.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-[24px] shadow-sm max-w-lg mx-auto w-full space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-50 text-[#065f46] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Compass size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 text-sm">No Scheduled Excursions</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Add guided safaris, winery tours, and cultural outings to build a daily operational timeline.
              </p>
            </div>
            <button 
              onClick={handleOpenAddForm} 
              className="px-4 py-2.5 bg-[#1A3326] text-white rounded-xl text-xs font-bold shadow hover:bg-[#12241b] transition"
            >
              Configure First Excursion
            </button>
          </div>
        ) : (
          [...state.activities].sort((a, b) => a.day - b.day).map(a => {
            const isExpanded = expandedActivityIds.includes(a.id);
            const assignedPax = state.guests.filter(g => a.paxIds?.includes(g.id));

            return (
              <div 
                key={a.id} 
                className="bg-white rounded-[24px] border border-gray-100 shadow-xs hover:shadow-sm transition-all duration-300 relative overflow-hidden"
              >
                {/* Visual indicator line based on slot */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  a.slot === 'Morning' ? 'bg-amber-400' :
                  a.slot === 'Afternoon' ? 'bg-orange-400' : 'bg-slate-800'
                }`} />

                <div className="p-6 md:p-8 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-[#1A3326] flex items-center justify-center border border-gray-200 shrink-0">
                        <span className="text-xs font-black">Day {a.day}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-widest font-black text-[#D4AF37]">
                            {a.slot} Excursion
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            a.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                            a.status === 'Requested' ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {a.status}
                          </span>
                          {a.weatherDependency && a.weatherDependency.includes("High") && (
                            <span className="text-[9px] bg-sky-50 text-sky-800 border border-sky-100 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              <CloudSun size={10} /> Weather Sensitive
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-gray-950 text-base mt-1 font-sans">{a.name}</h3>
                        <p className="text-gray-500 text-xs mt-0.5 font-medium">{a.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end lg:self-start text-xs">
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block">Valuation Total</span>
                        <strong className="block text-sm font-black text-[#1A3326]">R {a.total.toLocaleString()}</strong>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => toggleActivityExpand(a.id)}
                          className="w-8 h-8 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition shadow-xs"
                          title="Expand Operational specs"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button 
                          onClick={() => handleEditActivity(a)} 
                          className="w-8 h-8 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition shadow-xs"
                          title="Edit Excursion"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={() => onRemoveActivity(a.id)} 
                          className="w-8 h-8 rounded-xl border border-rose-100 bg-rose-50/20 text-rose-500 hover:text-white hover:bg-rose-500 flex items-center justify-center transition shadow-xs"
                          title="Remove Excursion"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick-look Logistics Strip */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-3 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="text-[9px] uppercase text-gray-400 font-bold block">Vehicle Pickup</span>
                      <strong className="text-gray-900 font-bold">{a.pickup || 'TBD'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-gray-400 font-bold block">Launch Time</span>
                      <strong className="text-gray-900 font-bold">{a.start || 'TBD'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-gray-400 font-bold block">Pickup Point</span>
                      <strong className="text-gray-900 font-bold truncate block">{a.pickupLoc || 'TBD'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-gray-400 font-bold block">Field Duration</span>
                      <strong className="text-gray-900 font-bold block">{a.dur || 'TBD'}</strong>
                    </div>
                  </div>

                  {/* Expanded Operational Specifications */}
                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t border-gray-100 text-xs animate-in fade-in duration-200">
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50/50 p-3.5 rounded-xl border border-gray-100 space-y-1">
                          <span className="text-[9px] uppercase text-gray-400 font-bold block">Difficulty & Age Level</span>
                          <strong className="text-[#1A3326] block">Level: {a.difficulty || 'Easy'}</strong>
                          <span className="text-gray-500 block">Suitability: {a.suitableAges || 'All Ages'}</span>
                        </div>

                        <div className="bg-slate-50/50 p-3.5 rounded-xl border border-gray-100 space-y-1">
                          <span className="text-[9px] uppercase text-gray-400 font-bold block">Contracted Supplier</span>
                          <strong className="text-[#1A3326] block">{a.supplier || 'DMC contracted'}</strong>
                          <span className="text-gray-500 block">Phone: {a.supPhone || 'No hotline registered'}</span>
                        </div>

                        <div className="bg-slate-50/50 p-3.5 rounded-xl border border-gray-100 space-y-1">
                          <span className="text-[9px] uppercase text-gray-400 font-bold block">Destination Drop-Off</span>
                          <strong className="text-[#1A3326] block truncate">{a.dropoffLoc || 'Return to lodging lobby'}</strong>
                          <span className="text-gray-500 block">Seasonal availability: {a.seasonalAvailability || 'Year-round'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 bg-yellow-50/20 p-3.5 rounded-xl border border-yellow-500/10">
                          <span className="text-[9px] uppercase font-bold text-amber-700 block">Included Packing advice</span>
                          <p className="text-gray-600 leading-relaxed font-semibold">{a.packingAdvice || 'Standard luxury active apparel advised.'}</p>
                        </div>

                        <div className="space-y-1 bg-yellow-50/20 p-3.5 rounded-xl border border-yellow-500/10">
                          <span className="text-[9px] uppercase font-bold text-amber-700 block">Photography opportunities</span>
                          <p className="text-gray-600 leading-relaxed font-semibold">{a.photographyOpportunities || 'Wildlife and scenic captures.'}</p>
                        </div>
                      </div>

                      {/* Inclusions and Exclusions lists */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <span className="text-[9px] uppercase font-black text-emerald-800 block">Contracted Inclusions:</span>
                          <div className="flex flex-wrap gap-1">
                            {a.inc && a.inc.length > 0 ? (
                              a.inc.map(i => <span key={i} className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">{i}</span>)
                            ) : (
                              <span className="text-gray-400 italic">No direct inclusions configured</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] uppercase font-black text-rose-800 block">Exclusions list:</span>
                          <div className="flex flex-wrap gap-1">
                            {a.excluded && a.excluded.length > 0 ? (
                              a.excluded.map(i => <span key={i} className="bg-rose-50 border border-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">{i}</span>)
                            ) : (
                              <span className="text-gray-400 italic">No specific exclusions logged</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contingency Backup Plan */}
                      {a.backup && (
                        <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-1">
                          <span className="text-[9px] uppercase font-bold text-amber-800 block">Weather Contingency Plan B:</span>
                          <p className="text-gray-600 font-semibold leading-relaxed">{a.backup}</p>
                        </div>
                      )}

                      {/* Role Specific Guide Notes */}
                      {a.guideNotes && (
                        <div className="bg-yellow-50/50 border border-[#D4AF37]/15 p-4 rounded-xl text-[11px] text-gray-600 italic space-y-1">
                          <strong className="text-xs text-[#1A3326] font-bold block not-italic flex items-center gap-1.5">
                            <FileText size={13} /> Guide operational protocols (Internal only):
                          </strong>
                          <p className="leading-relaxed">{a.guideNotes}</p>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Passenger manifestation list footer */}
                  <div className="border-t border-gray-50 pt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wider">Assigned Manifest:</span>
                    {assignedPax.length === 0 ? (
                      <span className="text-rose-500 italic font-bold">Awaiting passenger manifest assignment!</span>
                    ) : (
                      assignedPax.map(gp => (
                        <span 
                          key={gp.id} 
                          className="bg-slate-50 border border-gray-100 text-gray-700 px-2.5 py-0.5 rounded-lg font-bold text-[10px]"
                        >
                          {gp.first} {gp.last}
                        </span>
                      ))
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
