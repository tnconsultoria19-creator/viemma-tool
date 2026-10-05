import React, { useState } from 'react';
import { AppState, Guest, GroupManagement } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { COUNTRIES } from '../dbDefaults';
import { 
  Users, 
  User, 
  ShieldAlert, 
  Award, 
  ChevronDown, 
  Check, 
  Trash2, 
  Edit3, 
  Plus, 
  Crown, 
  Info,
  Calendar,
  Globe,
  Tag,
  Briefcase,
  Sliders,
  X,
  Phone,
  Mail,
  Heart,
  Compass,
  AlertCircle,
  Accessibility,
  Egg,
  Coffee,
  Sparkles
} from 'lucide-react';

interface IntakeViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onUpdateClient: (updates: Partial<AppState['client']>) => void;
  onUpdateGroupConditions: (updates: Partial<AppState['groupConditions']>) => void;
  onAddGuest: (g: Guest) => void;
  onRemoveGuest: (id: number) => void;
  onSetLeadGuest: (id: number) => void;
  onUpdateGuest: (id: number, updates: Partial<Guest>) => void;
}

export const IntakeView: React.FC<IntakeViewProps> = ({
  state,
  onUpdateState,
  onUpdateClient,
  onUpdateGroupConditions,
  onAddGuest,
  onRemoveGuest,
  onSetLeadGuest,
  onUpdateGuest
}) => {
  const [countrySearch, setCountrySearch] = useState(state.client.country || '');
  const [showCountryDD, setShowCountryDD] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGuest, setModalGuest] = useState<Partial<Guest>>({});
  const [modalCountrySearch, setModalCountrySearch] = useState('');
  const [showModalCountryDD, setShowModalCountryDD] = useState(false);
  const [expandedGuestId, setExpandedGuestId] = useState<number | null>(null);

  // Active sub-tab inside the guest edit modal to keep the form clean and organized (Progressive Disclosure)
  const [modalTab, setModalTab] = useState<'basic' | 'accessibility' | 'dietary' | 'preferences'>('basic');

  // Intelligent Group Management State Fallback
  const groupMgmt: GroupManagement = state.groupManagement || {
    groupType: 'Families',
    sharingPreferences: 'Standard family arrangement. Couple in master lodge; children in twin rooms.',
    requiresPrivateRoomIds: [],
    staffIds: [],
    notes: 'Require close proximity between master lodge and children suites.'
  };

  const handleUpdateGroupMgmt = (updates: Partial<GroupManagement>) => {
    onUpdateState({
      groupManagement: {
        ...groupMgmt,
        ...updates
      }
    });
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalGuest({});
    setModalTab('basic');
  };

  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(c => c.substring(4).toLowerCase().includes(countrySearch.toLowerCase().trim())).slice(0, 8)
    : [];

  const filteredModalCountries = modalCountrySearch.trim()
    ? COUNTRIES.filter(c => c.substring(4).toLowerCase().includes(modalCountrySearch.toLowerCase().trim())).slice(0, 8)
    : [];

  const calcDuration = (start: string, end: string) => {
    if (!start || !end) return 'Select dates';
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (d2 <= d1) return 'Invalid range';
    const days = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
    return `${days} Days / ${days - 1} Night${days - 1 !== 1 ? 's' : ''}`;
  };

  const handleDateChange = (field: 'startDate' | 'endDate', val: string) => {
    const start = field === 'startDate' ? val : state.client.startDate;
    const end = field === 'endDate' ? val : state.client.endDate;
    const dur = calcDuration(start, end);
    onUpdateClient({
      [field]: val,
      durationText: dur
    });
  };

  const handleOccasionToggle = (occ: string) => {
    onUpdateClient({
      occasion: state.client.occasion === occ ? '' : occ
    });
  };

  const handleProfileTagToggle = (tag: string) => {
    const currentTags = [...state.client.tags];
    if (currentTags.includes(tag)) {
      onUpdateClient({ tags: currentTags.filter(t => t !== tag) });
    } else {
      onUpdateClient({ tags: [...currentTags, tag] });
    }
  };

  const handleAgentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const agents = {
      safari_dreams: { id: 'safari_dreams', contact: 'Emma Williams', email: 'emma@safaridreams.co.uk', comm: '12%' },
      wanderlust: { id: 'wanderlust', contact: 'Hans Müller', email: 'hans@wanderlust.de', comm: '10%' },
      cape_connect: { id: 'cape_connect', contact: 'Mike Johnson', email: 'mike@capeconnect.com', comm: '15%' },
      bespoke_africa: { id: 'bespoke_africa', contact: 'Claire Thompson', email: 'claire@bespokeafrica.au', comm: '8%' }
    };

    onUpdateState({
      agent: {
        id: val,
        contact: agents[val as keyof typeof agents]?.contact || '',
        email: agents[val as keyof typeof agents]?.email || '',
        comm: agents[val as keyof typeof agents]?.comm || ''
      }
    });
  };

  const handleOpenGuestModal = (g?: Partial<Guest>) => {
    if (g && (g.id || g.first)) {
      setModalGuest({ ...g } as Partial<Guest>);
      setModalCountrySearch(g.nationality || g.country || '');
    } else {
      setModalGuest({
        first: '',
        last: '',
        preferredName: '',
        nationality: state.client.country || '',
        age: g?.age || 'Adult',
        languagesSpoken: ['English'],
        isLead: g?.isLead !== undefined ? g.isLead : state.guests.length === 0,
        notes: '',
        inheritCountry: g?.inheritCountry !== undefined ? g.inheritCountry : true,
        inheritNationality: g?.inheritNationality !== undefined ? g.inheritNationality : true,
        inheritEmergencyContact: g?.inheritEmergencyContact !== undefined ? g.inheritEmergencyContact : true,
        accessibilityMobility: [],
        accessibilityVision: [],
        accessibilityHearing: [],
        medicalOperationalNotes: '',
        dietaryReligious: [],
        dietaryLifestyle: [],
        dietaryMedical: [],
        dietaryPreferences: [],
        preferencesAccommodation: [],
        preferencesTransport: [],
        preferencesInterests: []
      });
      setModalCountrySearch(state.client.country || '');
    }

    setModalTab('basic');
    setModalOpen(true);
  };

  const toggleModalListTag = (field: keyof Guest, val: string) => {
    const list = Array.isArray(modalGuest[field]) ? [...(modalGuest[field] as string[])] : [];
    let updated: string[];
    if (list.includes(val)) {
      updated = list.filter(x => x !== val);
    } else {
      updated = [...list, val];
    }
    setModalGuest({ ...modalGuest, [field]: updated });
  };

  const handleSaveModalGuest = () => {
    if (!modalGuest.first || !modalGuest.last) {
      alert('First and Last name are required.');
      return;
    }

    const saved: Guest = {
      id: modalGuest.id || Date.now(),
      first: modalGuest.first,
      last: modalGuest.last,
      preferredName: modalGuest.preferredName || '',
      nationality: modalCountrySearch || '🇺🇸 United States',
      age: modalGuest.age || 'Adult',
      languagesSpoken: modalGuest.languagesSpoken || ['English'],
      isLead: modalGuest.isLead || false,
      notes: modalGuest.notes || '',
      accessibilityMobility: modalGuest.accessibilityMobility || [],
      accessibilityVision: modalGuest.accessibilityVision || [],
      accessibilityHearing: modalGuest.accessibilityHearing || [],
      medicalOperationalNotes: modalGuest.medicalOperationalNotes || '',
      dietaryReligious: modalGuest.dietaryReligious || [],
      dietaryLifestyle: modalGuest.dietaryLifestyle || [],
      dietaryMedical: modalGuest.dietaryMedical || [],
      dietaryPreferences: modalGuest.dietaryPreferences || [],
      preferencesAccommodation: modalGuest.preferencesAccommodation || [],
      preferencesTransport: modalGuest.preferencesTransport || [],
      preferencesInterests: modalGuest.preferencesInterests || [],
      // Keep legacy lists synchronized for system compatibility
      diet: [
        ...(modalGuest.dietaryReligious || []),
        ...(modalGuest.dietaryLifestyle || []),
        ...(modalGuest.dietaryMedical || [])
      ],
      mob: modalGuest.accessibilityMobility || [],
      med: modalGuest.medicalOperationalNotes ? [modalGuest.medicalOperationalNotes] : [],
      pref: [
        ...(modalGuest.preferencesAccommodation || []),
        ...(modalGuest.preferencesTransport || [])
      ],
      country: modalCountrySearch || '🇺🇸 United States'
    };

    if (modalGuest.id) {
      onUpdateGuest(saved.id, saved);
    } else {
      onAddGuest(saved);
    }

    if (saved.isLead && !state.client.name) {
      onUpdateClient({ name: `${saved.first} ${saved.last} Group` });
    }

    closeModal();
  };

  const handleQuickAddTemplate = (type: 'couple' | 'family' | 'solo' | 'group8') => {
    onUpdateState({ guests: [] });

    const presets: Record<string, Guest[]> = {
      couple: [
        { 
          id: 1, first: 'Arthur', last: 'Pendelton', preferredName: 'Arthur', age: 'Adult', nationality: '🇬🇧 United Kingdom', country: '🇬🇧 United Kingdom', isLead: true, notes: 'Lead traveler', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['King Bed', 'Quiet Room'], preferencesTransport: ['Front Seat'], preferencesInterests: ['Wine', 'Wellness']
        },
        { 
          id: 2, first: 'Guinevere', last: 'Pendelton', preferredName: 'Gwen', age: 'Adult', nationality: '🇬🇧 United Kingdom', country: '🇬🇧 United Kingdom', isLead: false, notes: 'Celebrates anniversary', languagesSpoken: ['English', 'French'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: ['Vegetarian'], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['King Bed', 'Garden View'], preferencesTransport: ['Window Seat'], preferencesInterests: ['Wildlife', 'Photography']
        }
      ],
      family: [
        { 
          id: 1, first: 'Michael', last: 'Vance', preferredName: 'Mike', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: true, notes: 'Father', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['King Bed'], preferencesTransport: ['Air Conditioning'], preferencesInterests: ['Wildlife', 'Photography']
        },
        { 
          id: 2, first: 'Sarah', last: 'Vance', preferredName: 'Sarah', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: 'Mother', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: ['Gluten Free'], dietaryPreferences: [],
          preferencesAccommodation: ['King Bed'], preferencesTransport: ['Extra Leg Room'], preferencesInterests: ['Wellness', 'Relaxation']
        },
        { 
          id: 3, first: 'Chloe', last: 'Vance', preferredName: 'Chloe', age: 'Teen', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: 'Daughter', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['Twin Beds', 'Interleading Rooms'], preferencesTransport: ['Wi-Fi'], preferencesInterests: ['Adventure', 'Culture']
        },
        { 
          id: 4, first: 'Toby', last: 'Vance', preferredName: 'Toby', age: 'Child', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: 'Son', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: ['Child Meals', 'Soft Foods'],
          preferencesAccommodation: ['Twin Beds', 'Interleading Rooms'], preferencesTransport: ['Child Seat Required'], preferencesInterests: ['Wildlife']
        }
      ],
      solo: [
        { 
          id: 1, first: 'Helena', last: 'Rostova', preferredName: 'Helena', age: 'Adult', nationality: '🇨🇦 Canada', country: '🇨🇦 Canada', isLead: true, notes: 'Private custom photographic tour', languagesSpoken: ['English', 'Russian'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['Quiet Room', 'High Floor'], preferencesTransport: ['Window Seat'], preferencesInterests: ['Photography', 'Bird Watching', 'Adventure']
        }
      ],
      group8: [
        { id: 1, first: 'John', last: 'Smith', preferredName: 'John', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: true, notes: '', languagesSpoken: ['English'] },
        { id: 2, first: 'Jane', last: 'Smith', preferredName: 'Jane', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 3, first: 'Robert', last: 'Jones', preferredName: 'Bob', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 4, first: 'Alice', last: 'Jones', preferredName: 'Alice', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 5, first: 'David', last: 'Miller', preferredName: 'Dave', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 6, first: 'Emily', last: 'Miller', preferredName: 'Em', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 7, first: 'James', last: 'Davis', preferredName: 'Jim', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 8, first: 'Mary', last: 'Davis', preferredName: 'Mary', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] }
      ]
    };

    if (presets[type]) {
      presets[type].forEach(g => onAddGuest(g));
      if (presets[type][0]) {
        onUpdateClient({ 
          name: `${presets[type][0].first} ${presets[type][0].last} Group`, 
          country: presets[type][0].nationality || presets[type][0].country 
        });
      }
    }
  };

  const toggleGroupPrivateRoom = (gId: number) => {
    const list = [...groupMgmt.requiresPrivateRoomIds];
    const updated = list.includes(gId) ? list.filter(id => id !== gId) : [...list, gId];
    handleUpdateGroupMgmt({ requiresPrivateRoomIds: updated });
  };

  const toggleGroupStaff = (gId: number) => {
    const list = [...groupMgmt.staffIds];
    const updated = list.includes(gId) ? list.filter(id => id !== gId) : [...list, gId];
    handleUpdateGroupMgmt({ staffIds: updated });
  };

  // Operational advisor metrics
  const activeAccessibilityIssues = state.guests.filter(g => 
    (g.accessibilityMobility && g.accessibilityMobility.length > 0) ||
    (g.accessibilityVision && g.accessibilityVision.length > 0) ||
    (g.accessibilityHearing && g.accessibilityHearing.length > 0)
  );

  const activeDietaryIssues = state.guests.filter(g => 
    (g.dietaryReligious && g.dietaryReligious.length > 0) ||
    (g.dietaryLifestyle && g.dietaryLifestyle.length > 0) ||
    (g.dietaryMedical && g.dietaryMedical.length > 0) ||
    (g.dietaryPreferences && g.dietaryPreferences.length > 0)
  );

  const countChildren = state.guests.filter(g => g.age === 'Child' || g.age === 'Infant').length;
  const countStaff = state.guests.filter(g => groupMgmt.staffIds.includes(g.id)).length;

  return (
    <div className="space-y-12 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 p-5 md:p-6 -m-5 md:-m-6 rounded-[24px] bg-gradient-to-r from-white/92 via-white/72 to-white/10 backdrop-blur-[2px] border-b border-white/60 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
            <Users size={14} /> DMC OPERATIONS COMMAND
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#10233f] font-sans drop-shadow-[0_1px_0_rgba(255,255,255,0.65)]">Traveller Intake & Operations Desk</h1>
          <p className="text-gray-700/90 max-w-2xl text-sm leading-relaxed drop-shadow-[0_1px_0_rgba(255,255,255,0.75)]">
            Configure confirmed lead client dossiers, scheduled safari calendar ranges, intelligent group dynamics, and professional Operational Traveller Profiles.
          </p>
        </div>
      </div>

      {/* Quick Action Strip for Guest Roster & Inheritance */}
      <div className="bg-emerald-900/90 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#1A3326] flex items-center justify-center font-black text-sm">
            <Users size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Group Inheritance & Bulk Actions</span>
            <span className="text-[11px] text-emerald-200 block">
              Default Country: <strong>{state.client.country || 'Not Set'}</strong> • Emergency Contact: <strong>{state.client.phone || state.client.email || 'Not Set'}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const groupCountry = state.client.country || '🇺🇸 United States';
              const updated = state.guests.map(g => ({
                ...g,
                country: groupCountry,
                nationality: groupCountry,
                inheritCountry: true,
                inheritNationality: true
              }));
              onUpdateState({ guests: updated });
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/10"
          >
            Apply Group Country to All
          </button>
          
          <button
            onClick={() => {
              const lead = state.guests.find(g => g.isLead) || state.guests[0];
              if (lead) {
                const updated = state.guests.map(g => ({
                  ...g,
                  emergencyContactName: `${lead.first} ${lead.last}`,
                  emergencyContactPhone: state.client.phone || '',
                  inheritEmergencyContact: true
                }));
                onUpdateState({ guests: updated });
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#c59f2e] text-[#1A3326] text-xs font-bold transition"
          >
            Copy Lead Contact to All
          </button>

          <button
            onClick={() => handleOpenGuestModal({ age: 'Adult', isLead: state.guests.length === 0, inheritCountry: true, inheritNationality: true, inheritEmergencyContact: true })}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <Plus size={14} /> Add Traveller
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        
        {/* LEFT COLUMN: Lead Client Information & Schedule */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card: Basic Lead Demographics */}
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-gray-900 font-sans border-b border-gray-100 pb-3 flex items-center gap-2">
              <User size={16} className="text-[#D4AF37]" /> Core Agency / Client Dossier
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Lead Group/Dossier Name <InfoTooltip text={"The name used to identify this client group or booking dossier."} /></label>
                <input 
                  type="text" 
                  value={state.client.name} 
                  onChange={e => onUpdateClient({ name: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                  placeholder="e.g. Harrison Expedition Group"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Lead Traveler Email <InfoTooltip text={"The primary email address for the lead traveller or main client contact."} /></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail size={12} />
                  </span>
                  <input 
                    type="email" 
                    value={state.client.email} 
                    onChange={e => onUpdateClient({ email: e.target.value })}
                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="client@harrisonexpedition.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Contact Phone Number <InfoTooltip text={"The main telephone number for contacting the lead traveller or client."} /></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Phone size={12} />
                  </span>
                  <input 
                    type="text" 
                    value={state.client.phone} 
                    onChange={e => onUpdateClient({ phone: e.target.value })}
                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="+1 415 555 9284"
                  />
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Origin Country <InfoTooltip text={"The country where the traveller or client is based."} /></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Globe size={12} />
                  </span>
                  <input 
                    type="text" 
                    value={countrySearch} 
                    onChange={e => {
                      setCountrySearch(e.target.value);
                      setShowCountryDD(true);
                    }}
                    onFocus={() => setShowCountryDD(true)}
                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="Search country..."
                    autoComplete="off"
                  />
                  {showCountryDD && filteredCountries.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-2 z-50 overflow-hidden">
                      {filteredCountries.map(c => (
                        <div 
                          key={c} 
                          onClick={() => {
                            setCountrySearch(c);
                            onUpdateClient({ country: c });
                            setShowCountryDD(false);
                          }}
                          className="px-4 py-2.5 text-xs hover:bg-gray-50 cursor-pointer font-medium text-gray-700"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Card: Calendar Schedule */}
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-gray-900 font-sans border-b border-gray-100 pb-3 flex items-center gap-2">
              <Calendar size={16} className="text-[#D4AF37]" /> Expedition Operations Calendar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Safari Arrival Date <InfoTooltip text={"The date the travel programme or safari begins."} /></label>
                <input 
                  type="date" 
                  value={state.client.startDate} 
                  onChange={e => handleDateChange('startDate', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Safari Departure Date <InfoTooltip text={"The date the travel programme ends."} /></label>
                <input 
                  type="date" 
                  value={state.client.endDate} 
                  onChange={e => handleDateChange('endDate', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                />
              </div>

              <div className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-gray-400 uppercase">Total Field Duration:</span>
                <strong className="text-[#1A3326] font-bold">{state.client.durationText}</strong>
              </div>
            </div>
          </div>

          {/* Intelligent Group Management Panel */}
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 font-sans flex items-center gap-2">
                <Sliders size={16} className="text-[#D4AF37]" /> Intelligent Group Management
              </h3>
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-[#1A3326] text-white px-2.5 py-1 rounded-full">
                {groupMgmt.groupType} Group
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Group Dynamics Typology <InfoTooltip text={"The type of travelling group, used to guide rooming, service and operational planning."} /></label>
                  <select 
                    value={groupMgmt.groupType}
                    onChange={e => handleUpdateGroupMgmt({ groupType: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs bg-white text-gray-800 font-semibold focus:border-[#D4AF37] transition"
                  >
                    <option value="Couples">Couples</option>
                    <option value="Families">Families</option>
                    <option value="Friends">Friends Sharing</option>
                    <option value="Corporate">Corporate Group</option>
                    <option value="Incentive">Incentive Group</option>
                    <option value="Weddings">Weddings & Honeymoons</option>
                    <option value="VIP">VIP / Diplomatic Delegation</option>
                    <option value="School">School / Educational Group</option>
                    <option value="Photography">Photography Expeditions</option>
                    <option value="Other">Other Bespoke Setup</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Rooming & Sharing Strategy <InfoTooltip text={"Record how guests should share rooms, including couples, children, singles or special rooming needs."} /></label>
                  <textarea 
                    value={groupMgmt.sharingPreferences}
                    onChange={e => handleUpdateGroupMgmt({ sharingPreferences: e.target.value })}
                    rows={3}
                    className="w-full p-3.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="Specify couples, single supplement needs, children sharing config..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Dynamics Mapping Matrix</span>
                
                {state.guests.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-gray-100">
                    <span className="text-xs text-gray-400 italic">No travelers listed in roster yet.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {state.guests.map(g => {
                      const isPrivate = groupMgmt.requiresPrivateRoomIds.includes(g.id);
                      const isStaff = groupMgmt.staffIds.includes(g.id);
                      return (
                        <div key={g.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-gray-100 text-xs">
                          <span className="font-bold text-gray-800 truncate max-w-[120px]">{g.first} {g.last}</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleGroupPrivateRoom(g.id)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                                isPrivate ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              Private Room
                            </button>
                            <button 
                              onClick={() => toggleGroupStaff(g.id)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                                isStaff ? 'bg-[#1A3326]/10 text-[#1A3326] border-[#1A3326]/20' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              Staff / Escort
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Partner Agent & Guest Roster templates */}
        <div className="space-y-8">
          
          {/* Card: Partner Agent & Priority */}
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-gray-900 font-sans border-b border-gray-100 pb-3 flex items-center gap-2">
              <Briefcase size={16} className="text-[#D4AF37]" /> Sourcing Source & Agent Lock
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Proposal Priority <InfoTooltip text={"Shows how urgently this enquiry or confirmed booking should be handled."} /></label>
                <div className="grid grid-cols-3 gap-2">
                  {['high', 'medium', 'confirmed'].map(p => (
                    <button 
                      key={p} 
                      onClick={() => onUpdateState({ priority: p as any })}
                      className={`py-2 rounded-xl border text-center text-xs font-bold capitalize transition-all ${
                        state.priority === p 
                          ? 'border-[#D4AF37] bg-yellow-50 text-[#1A3326]' 
                          : 'border-gray-100 hover:border-gray-200 text-gray-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Acquisition Source <InfoTooltip text={"Shows how this client or booking reached Viemma Tours."} /></label>
                <div className="grid grid-cols-2 gap-2">
                  {['direct', 'agent', 'referral', 'website'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => {
                        onUpdateState({ source: s as any });
                        if (s !== 'agent') {
                          onUpdateState({ agent: { id: '', contact: '', email: '', comm: '' } });
                        }
                      }} 
                      className={`py-2 rounded-xl border text-center text-xs font-bold capitalize transition-all ${
                        state.source === s 
                          ? 'border-[#D4AF37] bg-yellow-50 text-[#1A3326]' 
                          : 'border-gray-100 hover:border-gray-200 text-gray-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {state.source === 'agent' && (
                <div className="space-y-2 pt-3 border-t border-gray-50 animate-in fade-in duration-300">
                  <label className="text-[11px] text-gray-400 font-bold uppercase block">Partner Agent <InfoTooltip text={"Select the travel partner responsible for the booking when the acquisition source is Agent."} /></label>
                  <select 
                    value={state.agent.id}
                    onChange={handleAgentSelect} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37]"
                  >
                    <option value="">Select travel partner...</option>
                    <option value="safari_dreams">Safari Dreams (UK) — 12% Comm</option>
                    <option value="wanderlust">Wanderlust (DE) — 10% Comm</option>
                    <option value="cape_connect">Cape Connect — 15% Comm</option>
                    <option value="bespoke_africa">Bespoke Africa Partners — 8% Comm</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Card: Operational Traveller Profiles List */}
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <div>
                <h4 className="font-bold text-gray-900 text-sm font-sans">Operational Traveller Profiles</h4>
                <p className="text-[11px] text-gray-400">{state.guests.length} Confirmed Travelers</p>
              </div>
              <button 
                onClick={() => handleOpenGuestModal()} 
                className="w-9 h-9 rounded-xl bg-yellow-50 text-[#D4AF37] border border-[#D4AF37]/20 flex items-center justify-center hover:bg-yellow-100 transition-colors"
                title="Add Traveller Profile"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sourcing Templates</span>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleQuickAddTemplate('couple')} className="py-2 rounded-xl border border-gray-100 text-[10px] font-bold text-gray-600 hover:border-[#D4AF37] transition-all">Couple (2A)</button>
                <button onClick={() => handleQuickAddTemplate('family')} className="py-2 rounded-xl border border-gray-100 text-[10px] font-bold text-gray-600 hover:border-[#D4AF37] transition-all">Family (2A+2C)</button>
                <button onClick={() => handleQuickAddTemplate('solo')} className="py-2 rounded-xl border border-gray-100 text-[10px] font-bold text-gray-600 hover:border-[#D4AF37] transition-all">Solo Traveler</button>
                <button onClick={() => handleQuickAddTemplate('group8')} className="py-2 rounded-xl border border-gray-100 text-[10px] font-bold text-gray-600 hover:border-[#D4AF37] transition-all">Large Group (8A)</button>
              </div>
            </div>

            {/* Guest List Roster */}
            <div className="space-y-3 pt-4 border-t border-gray-50">
              {state.guests.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-xs text-gray-400 italic block">No Operational Traveller Profiles configured yet. Click add or pick a preset template.</span>
                </div>
              ) : (
                state.guests.map(g => (
                  <div key={g.id} className="p-3.5 rounded-2xl border border-gray-100 bg-slate-50/50 space-y-2.5 hover:shadow-xs transition duration-200 group">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {g.isLead ? <Crown size={12} className="text-[#D4AF37]" /> : <User size={12} className="text-gray-400" />}
                        <span className="text-xs font-bold text-[#1A3326] truncate">
                          {g.first} {g.last} {g.preferredName ? `(${g.preferredName})` : ''}
                        </span>
                      </div>
                      <span className="text-[9px] bg-white border border-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{g.age}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {g.accessibilityMobility && g.accessibilityMobility.length > 0 && (
                        <span className="text-[8px] bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Mobility Assistance</span>
                      )}
                      {(g.dietaryLifestyle?.length || 0) + (g.dietaryMedical?.length || 0) > 0 && (
                        <span className="text-[8px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Special Diet</span>
                      )}
                      {groupMgmt.staffIds.includes(g.id) && (
                        <span className="text-[8px] bg-[#1A3326]/10 text-[#1A3326] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Staff</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-[10px]">
                      <span className="text-gray-400">{g.nationality || g.country || 'Global Citizens'}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenGuestModal(g)} className="text-[#1A3326] hover:text-[#D4AF37] font-bold">Edit Profile</button>
                        <span className="text-gray-200">|</span>
                        <button onClick={() => onRemoveGuest(g.id)} className="text-rose-500 hover:text-rose-700 font-bold">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Smart Operational & Dispatch Advisor */}
          <div className="bg-[#1A3326] text-white rounded-[24px] p-6 shadow-lg space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37] flex items-center gap-1.5">
              <Sparkles size={13} /> AI Operational Dispatch Advisor
            </h4>
            <p className="text-[11px] text-emerald-100/80 leading-relaxed">
              Real-time analysis of active group profiles to recommend fleet, meal basis, and lodging specifications.
            </p>

            <div className="space-y-3 pt-2 text-[11px]">
              {/* Alert: Lead Traveler Check */}
              {state.guests.length > 0 && !state.guests.some(g => g.isLead) && (
                <div className="flex gap-2 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-rose-200">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>No lead traveller contact locked. Check 'Lead Contact' checkbox.</span>
                </div>
              )}

              {/* Mobility Analysis */}
              {activeAccessibilityIssues.length > 0 ? (
                <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-amber-200">
                  <Accessibility size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#D4AF37]">Accessibility Requirements Alert</strong>
                    <span className="text-[10px]">
                      {activeAccessibilityIssues.length} guests with mobility/vision requests. Recommending accessible fleet transfer vehicles, roll-in lodge facilities, and ground floor bookings.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 bg-white/5 p-2 rounded-xl text-emerald-100/60">
                  <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>No mobility or physical assistance restrictions registered. Standard luxury vehicles appropriate.</span>
                </div>
              )}

              {/* Diet Analysis */}
              {activeDietaryIssues.length > 0 && (
                <div className="flex gap-2 bg-white/5 p-2 rounded-xl text-emerald-100/80">
                  <Egg size={12} className="text-[#D4AF37] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white block font-semibold">Catering Operations Notice</strong>
                    <span className="text-[10px] text-emerald-100/60">
                      Dietary requirements logged: {activeDietaryIssues.map(g => g.first).join(', ')}. Dispatch automatic allergen alerts to lodge kitchens.
                    </span>
                  </div>
                </div>
              )}

              {/* Family/Children */}
              {countChildren > 0 && (
                <div className="flex gap-2 bg-white/5 p-2 rounded-xl text-emerald-100/80">
                  <Coffee size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                  <span>{countChildren} child/infant travellers logged. Require booster transport seating and child-friendly lodge dining checks.</span>
                </div>
              )}

              {/* Staff Accommodations */}
              {countStaff > 0 && (
                <div className="flex gap-2 bg-white/5 p-2 rounded-xl text-emerald-100/80">
                  <Users size={12} className="text-[#D4AF37] mt-0.5 shrink-0" />
                  <span>{countStaff} staff member(s) listed on itinerary. Recommend adding separate Guide/Driver lodging block.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* COMPREHENSIVE GUEST ADD/EDIT MODAL OVERLAY (Operational Traveller Profile) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase tracking-widest font-black text-[#D4AF37] block mb-0.5">DMC Operations Profile Editor</span>
                <h3 className="font-bold text-[#1A3326] text-base font-sans flex items-center gap-2">
                  <User size={18} />
                  {modalGuest.id ? `Operational Profile: ${modalGuest.first} ${modalGuest.last}` : 'Create Operational Traveller Profile'}
                </h3>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs (Progressive Disclosure) */}
            <div className="flex border-b border-gray-100 px-6 bg-white overflow-x-auto text-xs font-bold text-gray-500 shrink-0">
              <button 
                onClick={() => setModalTab('basic')}
                className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${modalTab === 'basic' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
              >
                1. Basic Info
              </button>
              <button 
                onClick={() => setModalTab('accessibility')}
                className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${modalTab === 'accessibility' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
              >
                2. Accessibility & Mobility
              </button>
              <button 
                onClick={() => setModalTab('dietary')}
                className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${modalTab === 'dietary' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
              >
                3. Dietary Categories
              </button>
              <button 
                onClick={() => setModalTab('preferences')}
                className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${modalTab === 'preferences' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
              >
                4. Comfort & Preferences
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-grow">
              
              {/* TAB 1: BASIC INFORMATION */}
              {modalTab === 'basic' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">First Name <InfoTooltip text={"The traveller's first or given name as it should appear in the booking."} /></label>
                      <input 
                        type="text" 
                        value={modalGuest.first || ''} 
                        onChange={e => setModalGuest({ ...modalGuest, first: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#D4AF37] transition" 
                        placeholder="John" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">Last Name <InfoTooltip text={"The traveller's family or surname as it should appear in the booking."} /></label>
                      <input 
                        type="text" 
                        value={modalGuest.last || ''} 
                        onChange={e => setModalGuest({ ...modalGuest, last: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#D4AF37] transition" 
                        placeholder="Smith" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">Preferred / Call Name <InfoTooltip text={"The name the traveller prefers staff and guides to use."} /></label>
                      <input 
                        type="text" 
                        value={modalGuest.preferredName || ''} 
                        onChange={e => setModalGuest({ ...modalGuest, preferredName: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#D4AF37] transition" 
                        placeholder="e.g. Jack" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nationality / Passport <InfoTooltip text="The traveller's nationality or passport-country information." /></label>
                        {state.client.country && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalCountrySearch(state.client.country);
                              setModalGuest({ ...modalGuest, country: state.client.country, nationality: state.client.country, inheritCountry: true });
                            }}
                            className="text-[10px] text-emerald-700 font-bold hover:underline"
                          >
                            Same as Group ({state.client.country.slice(0, 10)}...)
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={modalCountrySearch} 
                          onChange={e => {
                            setModalCountrySearch(e.target.value);
                            setShowModalCountryDD(true);
                            setModalGuest({ ...modalGuest, inheritCountry: false });
                          }} 
                          onFocus={() => setShowModalCountryDD(true)}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs bg-white focus:border-[#D4AF37] transition" 
                          placeholder="Search country..." 
                          autoComplete="off"
                        />
                        {showModalCountryDD && filteredModalCountries.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-2 z-50 overflow-hidden">
                            {filteredModalCountries.map(c => (
                              <div 
                                key={c} 
                                onClick={() => {
                                  setModalCountrySearch(c);
                                  setModalGuest({ ...modalGuest, country: c, nationality: c, inheritCountry: false });
                                  setShowModalCountryDD(false);
                                }} 
                                className="px-4 py-2 text-xs hover:bg-gray-50 cursor-pointer text-gray-700 font-medium"
                              >
                                {c}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact Information */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone size={12} className="text-emerald-700" /> Emergency Contact
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const lead = state.guests.find(g => g.isLead) || state.guests[0];
                          if (lead) {
                            setModalGuest({
                              ...modalGuest,
                              emergencyContactName: `${lead.first} ${lead.last}`,
                              emergencyContactPhone: state.client.phone || '',
                              emergencyContactRelation: 'Lead Group Contact',
                              inheritEmergencyContact: true
                            });
                          }
                        }}
                        className="text-[10px] text-emerald-800 font-bold hover:underline"
                      >
                        Copy Lead Contact
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Contact Name <InfoTooltip text={"The name of the person's emergency contact."} /></label>
                        <input
                          type="text"
                          value={modalGuest.emergencyContactName || ''}
                          onChange={e => setModalGuest({ ...modalGuest, emergencyContactName: e.target.value, inheritEmergencyContact: false })}
                          placeholder="e.g. John Doe"
                          className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Phone Number <InfoTooltip text={"The emergency contact's best telephone number."} /></label>
                        <input
                          type="text"
                          value={modalGuest.emergencyContactPhone || ''}
                          onChange={e => setModalGuest({ ...modalGuest, emergencyContactPhone: e.target.value, inheritEmergencyContact: false })}
                          placeholder="+1 555 0199"
                          className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Relationship <InfoTooltip text={"The emergency contact's relationship to the traveller."} /></label>
                        <input
                          type="text"
                          value={modalGuest.emergencyContactRelation || ''}
                          onChange={e => setModalGuest({ ...modalGuest, emergencyContactRelation: e.target.value, inheritEmergencyContact: false })}
                          placeholder="e.g. Spouse / Brother"
                          className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>


                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">Age Category <InfoTooltip text={"Used to classify the traveller for rooming, pricing, transport and operational planning."} /></label>
                      <select 
                        value={modalGuest.age || 'Adult'} 
                        onChange={e => setModalGuest({ ...modalGuest, age: e.target.value as any })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs bg-white focus:border-[#D4AF37] transition"
                      >
                        <option value="Adult">Adult (18-64)</option>
                        <option value="Elderly">Elderly (65+)</option>
                        <option value="Teen">Teen (13-17)</option>
                        <option value="Child">Child (3-12)</option>
                        <option value="Infant">Infant (Under 3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">Primary Spoken Language <InfoTooltip text={"The traveller's main spoken language so the team can plan communication appropriately."} /></label>
                      <select 
                        value={modalGuest.languagesSpoken?.[0] || 'English'} 
                        onChange={e => setModalGuest({ ...modalGuest, languagesSpoken: [e.target.value] })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs bg-white focus:border-[#D4AF37] transition"
                      >
                        <option value="English">English</option>
                        <option value="Portuguese">Portuguese (Angolan/BR)</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Mandarin">Mandarin</option>
                        <option value="Italian">Italian</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="isLead" 
                      checked={modalGuest.isLead || false} 
                      onChange={e => setModalGuest({ ...modalGuest, isLead: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" 
                    />
                    <label htmlFor="isLead" className="text-xs font-bold text-[#1A3326] cursor-pointer">This traveler is the Lead Booking Contact for the group</label>
                  </div>
                </div>
              )}

              {/* TAB 2: ACCESSIBILITY & MOBILITY */}
              {modalTab === 'accessibility' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="space-y-3">
                    <label className="text-xs font-extrabold text-[#1A3326] flex items-center gap-1.5 uppercase tracking-wider">
                      <Accessibility size={14} className="text-[#D4AF37]" /> Physical Mobility Status <InfoTooltip text="Record any mobility limitation or accessibility requirement that affects transport, walking, stairs or rooming." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'No restrictions', 'Walks short distances only', 'Cannot walk long distances', 
                        'Uses walking stick', 'Uses walker', 'Manual wheelchair', 'Electric wheelchair', 
                        'Requires accessible vehicle', 'Cannot climb stairs', 'Requires elevator access', 
                        'Ground floor room preferred', 'Roll-in shower required', 'Grab rails required', 
                        'Accessible bathroom required'
                      ].map(item => {
                        const isSelected = modalGuest.accessibilityMobility?.includes(item) || false;
                        return (
                          <span 
                            key={item}
                            onClick={() => toggleModalListTag('accessibilityMobility', item)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer select-none transition ${
                              isSelected ? 'bg-amber-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                            }`}
                          >
                            {item}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    <div className="space-y-3">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Visual Support <InfoTooltip text={"Record any visual assistance or accessibility requirement."} /></label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Blind', 'Low vision', 'Large print preferred', 'Guide dog travelling'].map(item => {
                          const isSelected = modalGuest.accessibilityVision?.includes(item) || false;
                          return (
                            <span 
                              key={item}
                              onClick={() => toggleModalListTag('accessibilityVision', item)}
                              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer select-none transition ${
                                isSelected ? 'bg-amber-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-400'
                              }`}
                            >
                              {item}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Hearing Support <InfoTooltip text={"Record any hearing assistance or communication requirement."} /></label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Deaf', 'Hard of hearing', 'Hearing aid', 'Sign language assistance'].map(item => {
                          const isSelected = modalGuest.accessibilityHearing?.includes(item) || false;
                          return (
                            <span 
                              key={item}
                              onClick={() => toggleModalListTag('accessibilityHearing', item)}
                              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer select-none transition ${
                                isSelected ? 'bg-amber-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-400'
                              }`}
                            >
                              {item}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-gray-100">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Critical Medical Operational Notes <InfoTooltip text={"Record important operational medical information that staff may need to plan the trip safely."} /></label>
                    <input 
                      type="text"
                      value={modalGuest.medicalOperationalNotes || ''}
                      onChange={e => setModalGuest({ ...modalGuest, medicalOperationalNotes: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#D4AF37] transition"
                      placeholder="e.g. Oxygen support, Medication refrigeration, Pregnancy third trimester, High altitude constraints..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: DIETARY REQUIREMENTS */}
              {modalTab === 'dietary' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  
                  {/* Category: Religious */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Religious / Spiritual Observance <InfoTooltip text={"Record religious or spiritual dietary requirements or observances."} /></label>
                    <div className="flex flex-wrap gap-2">
                      {['Halal', 'Kosher', 'Jain'].map(item => {
                        const isSelected = modalGuest.dietaryReligious?.includes(item) || false;
                        return (
                          <span 
                            key={item}
                            onClick={() => toggleModalListTag('dietaryReligious', item)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition ${
                              isSelected ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-500'
                            }`}
                          >
                            {item}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Lifestyle */}
                  <div className="space-y-2.5 pt-4 border-t border-gray-100">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Lifestyle Diet <InfoTooltip text={"Record lifestyle-based dietary requirements such as vegetarian or vegan."} /></label>
                    <div className="flex flex-wrap gap-2">
                      {['Vegetarian', 'Vegan', 'Pescatarian'].map(item => {
                        const isSelected = modalGuest.dietaryLifestyle?.includes(item) || false;
                        return (
                          <span 
                            key={item}
                            onClick={() => toggleModalListTag('dietaryLifestyle', item)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition ${
                              isSelected ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-500'
                            }`}
                          >
                            {item}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Medical Allergens */}
                  <div className="space-y-2.5 pt-4 border-t border-gray-100">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block text-rose-600">Medical / Allergen Constraints <InfoTooltip text={"Record food allergies, medical diets or other safety-critical dietary restrictions."} /></label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Gluten Free', 'Dairy Free', 'Nut Allergy', 'Shellfish Allergy', 
                        'Egg Allergy', 'Soy Allergy', 'Diabetic Meals', 'Low Sodium'
                      ].map(item => {
                        const isSelected = modalGuest.dietaryMedical?.includes(item) || false;
                        return (
                          <span 
                            key={item}
                            onClick={() => toggleModalListTag('dietaryMedical', item)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition ${
                              isSelected ? 'bg-rose-50 border-rose-400 text-rose-950' : 'bg-white border-gray-100 text-gray-500'
                            }`}
                          >
                            {item}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Preferences */}
                  <div className="space-y-2.5 pt-4 border-t border-gray-100">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Kitchen Preferences <InfoTooltip text={"Record practical meal preferences for kitchens, lodges and restaurants."} /></label>
                    <div className="flex flex-wrap gap-2">
                      {['Mild Food Only', 'No Pork', 'No Beef', 'Child Meals', 'Soft Foods'].map(item => {
                        const isSelected = modalGuest.dietaryPreferences?.includes(item) || false;
                        return (
                          <span 
                            key={item}
                            onClick={() => toggleModalListTag('dietaryPreferences', item)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition ${
                              isSelected ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-500'
                            }`}
                          >
                            {item}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: COMFORT & EXPERIENCE PREFERENCES */}
              {modalTab === 'preferences' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  
                  {/* Accommodation Comfort */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Lodge / Suite Comfort <InfoTooltip text={"Record accommodation preferences such as room type, views, beds or accessibility."} /></label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'King Bed', 'Twin Beds', 'Separate Beds', 'Quiet Room', 'High Floor', 'Low Floor', 
                        'Near Elevator', 'Away from Elevator', 'Ocean View', 'Mountain View', 'Garden View', 
                        'Interleading Rooms', 'Accessible Room'
                      ].map(item => {
                        const isSelected = modalGuest.preferencesAccommodation?.includes(item) || false;
                        return (
                          <span 
                            key={item}
                            onClick={() => toggleModalListTag('preferencesAccommodation', item)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition ${
                              isSelected ? 'bg-yellow-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-500'
                            }`}
                          >
                            {item}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Transport Comfort */}
                  <div className="space-y-2.5 pt-4 border-t border-gray-100">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Vehicular Dispatch Comfort <InfoTooltip text={"Record transport preferences such as seating, air conditioning or child-seat needs."} /></label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Front Seat', 'Window Seat', 'Air Conditioning', 'Wi-Fi', 'Extra Leg Room', 
                        'Child Seat Required'
                      ].map(item => {
                        const isSelected = modalGuest.preferencesTransport?.includes(item) || false;
                        return (
                          <span 
                            key={item}
                            onClick={() => toggleModalListTag('preferencesTransport', item)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition ${
                              isSelected ? 'bg-yellow-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-500'
                            }`}
                          >
                            {item}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Experience Interests */}
                  <div className="space-y-2.5 pt-4 border-t border-gray-100">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Curation Focus & Interests <InfoTooltip text={"Record the traveller's interests to help tailor experiences."} /></label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Wildlife', 'Photography', 'Bird Watching', 'Wine', 'Food Experiences', 
                        'Culture', 'Shopping', 'Luxury', 'Wellness', 'Adventure', 'Relaxation'
                      ].map(item => {
                        const isSelected = modalGuest.preferencesInterests?.includes(item) || false;
                        return (
                          <span 
                            key={item}
                            onClick={() => toggleModalListTag('preferencesInterests', item)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition ${
                              isSelected ? 'bg-yellow-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-500'
                            }`}
                          >
                            {item}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* General Custom Notes */}
                  <div className="space-y-1.5 pt-4 border-t border-gray-100">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Bespoke Guest Notes & Operational Guidelines <InfoTooltip text={"Add any useful guest-specific notes or service instructions for the operations team."} /></label>
                    <textarea 
                      value={modalGuest.notes || ''} 
                      onChange={e => setModalGuest({ ...modalGuest, notes: e.target.value })}
                      className="w-full p-4 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#D4AF37] transition" 
                      placeholder="e.g. celebrating a 40th anniversary, loves hot cocoa, very enthusiastic about spotting big cats..."
                      style={{ resize: 'vertical', minHeight: '80px' }}
                    />
                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-slate-50/50 shrink-0 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-bold">
                {modalTab === 'basic' && 'Next: Accessibility & Mobility'}
                {modalTab === 'accessibility' && 'Next: Dietary Categories'}
                {modalTab === 'dietary' && 'Next: Comfort & Preferences'}
                {modalTab === 'preferences' && 'Ready to save profile'}
              </span>
              <div className="flex gap-3">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 bg-white transition">Cancel</button>
                <button onClick={handleSaveModalGuest} className="px-5 py-2.5 bg-[#1A3326] text-white rounded-xl text-xs font-bold hover:bg-[#12241b] transition shadow-md">Save Traveller Dossier</button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};