import React, { useState } from 'react';
import { AppState, Guest, GroupManagement, TripStatus } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { COUNTRIES } from '../dbDefaults';
import { 
  Users, 
  User, 
  Calendar, 
  Globe, 
  Plus, 
  Crown, 
  Check, 
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
  Sparkles,
  Plane,
  Hotel,
  Route,
  Car,
  Coins,
  Printer,
  ChevronRight,
  ShieldAlert,
  ArrowRight
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
  onNavigateTab?: (tab: string) => void;
}

export const IntakeView: React.FC<IntakeViewProps> = ({
  state,
  onUpdateState,
  onUpdateClient,
  onUpdateGroupConditions,
  onAddGuest,
  onRemoveGuest,
  onSetLeadGuest,
  onUpdateGuest,
  onNavigateTab
}) => {
  const [countrySearch, setCountrySearch] = useState(state.client.country || '');
  const [showCountryDD, setShowCountryDD] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGuest, setModalGuest] = useState<Partial<Guest>>({});
  const [modalCountrySearch, setModalCountrySearch] = useState('');
  const [showModalCountryDD, setShowModalCountryDD] = useState(false);
  const [showGroupAccordion, setShowGroupAccordion] = useState(true);

  // Progressive Disclosure inside the Traveller Profile modal
  const [modalTab, setModalTab] = useState<'basic' | 'accessibility' | 'dietary' | 'preferences'>('basic');

  // Group Management Fallback
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

  // Date Calculation & Validation
  const hasDates = Boolean(state.client.startDate && state.client.endDate);
  const isDateInverted = hasDates && new Date(state.client.endDate) <= new Date(state.client.startDate);

  const calcDuration = (start: string, end: string) => {
    if (!start || !end) return 'Select travel dates';
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (d2 <= d1) return 'Departure must be after arrival';
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

  const handleAgentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const agents = {
      safari_dreams: { id: 'safari_dreams', agencyName: 'Safari Dreams UK', contact: 'Emma Williams', email: 'emma@safaridreams.co.uk', comm: '12%' },
      wanderlust: { id: 'wanderlust', agencyName: 'Wanderlust Reisen DE', contact: 'Hans Müller', email: 'hans@wanderlust.de', comm: '10%' },
      cape_connect: { id: 'cape_connect', agencyName: 'Cape Connect Tours', contact: 'Mike Johnson', email: 'mike@capeconnect.com', comm: '15%' },
      bespoke_africa: { id: 'bespoke_africa', agencyName: 'Bespoke Africa Partners', contact: 'Claire Thompson', email: 'claire@bespokeafrica.au', comm: '8%' }
    };

    const selectedAgent = agents[val as keyof typeof agents];
    onUpdateState({
      agent: {
        id: val,
        agencyName: selectedAgent?.agencyName || '',
        contact: selectedAgent?.contact || '',
        email: selectedAgent?.email || '',
        comm: selectedAgent?.comm || ''
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
    if (!modalGuest.first?.trim() || !modalGuest.last?.trim()) {
      alert('First and Last name are required.');
      return;
    }

    const saved: Guest = {
      id: modalGuest.id || Date.now(),
      first: modalGuest.first.trim(),
      last: modalGuest.last.trim(),
      preferredName: modalGuest.preferredName?.trim() || '',
      nationality: modalCountrySearch || state.client.country || '🇺🇸 United States',
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
      country: modalCountrySearch || state.client.country || '🇺🇸 United States'
    };

    if (modalGuest.id) {
      onUpdateGuest(saved.id, saved);
    } else {
      onAddGuest(saved);
    }

    // If marked lead and client group name is empty, auto-populate client name
    if (saved.isLead && !state.client.name.trim()) {
      onUpdateClient({ name: `${saved.first} ${saved.last} Group` });
    }

    closeModal();
  };

  // Quick Presets: 1-click templates for fast consultant data entry
  const handleQuickAddTemplate = (type: 'couple' | 'family' | 'solo' | 'group8') => {
    onUpdateState({ guests: [] });

    const presets: Record<string, Guest[]> = {
      couple: [
        { 
          id: 1, first: 'Arthur', last: 'Pendelton', preferredName: 'Arthur', age: 'Adult', nationality: '🇬🇧 United Kingdom', country: '🇬🇧 United Kingdom', isLead: true, notes: 'Lead traveller', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['King Bed', 'Quiet Room'], preferencesTransport: ['Front Seat'], preferencesInterests: ['Wine', 'Wellness']
        },
        { 
          id: 2, first: 'Guinevere', last: 'Pendelton', preferredName: 'Gwen', age: 'Adult', nationality: '🇬🇧 United Kingdom', country: '🇬🇧 United Kingdom', isLead: false, notes: 'Anniversary celebration', languagesSpoken: ['English', 'French'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: ['Vegetarian'], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['King Bed', 'Garden View'], preferencesTransport: ['Window Seat'], preferencesInterests: ['Wildlife', 'Photography']
        }
      ],
      family: [
        { 
          id: 1, first: 'Michael', last: 'Vance', preferredName: 'Mike', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: true, notes: 'Lead contact', languagesSpoken: ['English'],
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
          id: 1, first: 'Helena', last: 'Rostova', preferredName: 'Helena', age: 'Adult', nationality: '🇨🇦 Canada', country: '🇨🇦 Canada', isLead: true, notes: 'Private photographic safari', languagesSpoken: ['English', 'Russian'],
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

  // Error & Readiness Calculations
  const hasLeadGuest = state.guests.some(g => g.isLead);
  const isAgentSource = state.source === 'agent';
  const hasAgentSelected = isAgentSource ? Boolean(state.agent?.id) : true;

  // Calculate readiness score
  let score = 0;
  if (state.client.name.trim()) score += 15;
  if (state.client.startDate && state.client.endDate && !isDateInverted) score += 20;
  if (state.client.country) score += 10;
  if (state.client.email || state.client.phone) score += 15;
  if (state.guests.length > 0) score += 20;
  if (hasLeadGuest) score += 10;
  if (hasAgentSelected) score += 10;
  const readinessScore = Math.min(score, 100);

  // Operational metrics
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

  // Booking Progress Workflow Steps
  const workflowSteps = [
    { id: 'client', label: '1. Client & Booking', tab: 'guests', isCurrent: true, isComplete: Boolean(state.client.name && state.client.country && state.client.startDate) },
    { id: 'travellers', label: '2. Travellers', tab: 'guests', isCurrent: true, isComplete: state.guests.length > 0 && hasLeadGuest },
    { id: 'flights', label: '3. Flights', tab: 'flights', isCurrent: false, isComplete: state.flights.length > 0 },
    { id: 'rooming', label: '4. Accommodation', tab: 'rooming', isCurrent: false, isComplete: state.rooms.length > 0 },
    { id: 'experiences', label: '5. Experiences', tab: 'activities', isCurrent: false, isComplete: state.activities.length > 0 },
    { id: 'operations', label: '6. Operations', tab: 'transfers', isCurrent: false, isComplete: state.transfers.length > 0 || state.vehicles.length > 0 },
    { id: 'commercials', label: '7. Commercials', tab: 'finance', isCurrent: false, isComplete: Boolean(state.finance?.margin) },
    { id: 'review', label: '8. Review & Export', tab: 'exporthub', isCurrent: false, isComplete: false }
  ];

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto animate-in fade-in duration-300 pb-12">
      
      {/* 1. CLEAN HEADER (Zero negative margin, no visual bleed or overlap) */}
      <header className="bg-white rounded-2xl border border-gray-200/90 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-[#D4AF37]">
            <Users size={13} className="text-[#D4AF37]" />
            <span>OPERATIONS DESK</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500 font-medium">VIEMMA TOURS SOUTHERN AFRICA</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#10233F] font-sans">
            Traveller Intake & Booking Details
          </h1>
          <p className="text-gray-600 text-xs md:text-sm leading-relaxed max-w-2xl">
            Configure lead client contact, itinerary dates, group setup, and traveller profiles for operations and supplier dispatch.
          </p>
        </div>

        {/* Readiness Score Indicator */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col items-start md:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Booking Readiness:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              readinessScore >= 80 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : readinessScore >= 50 
                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              {readinessScore}% • {readinessScore >= 80 ? 'Ready for Itinerary' : 'Information Pending'}
            </span>
          </div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${readinessScore >= 80 ? 'bg-emerald-600' : 'bg-[#D4AF37]'}`} 
              style={{ width: `${readinessScore}%` }} 
            />
          </div>
        </div>
      </header>

      {/* 2. BOOKING PROGRESS MODEL (Interactive Step Indicator) */}
      <nav aria-label="Booking Workflow Progress" className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-xs overflow-x-auto">
        <ol className="flex items-center gap-1.5 min-w-[780px]">
          {workflowSteps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <li className="flex-1">
                <button
                  type="button"
                  onClick={() => onNavigateTab?.(step.tab)}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center ${
                    step.isCurrent
                      ? 'bg-[#1A3326] text-white shadow-xs'
                      : step.isComplete
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
                  }`}
                >
                  {step.isComplete ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-black">✓</span>
                  ) : (
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${
                      step.isCurrent ? 'bg-[#D4AF37] text-[#1A3326]' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </span>
                  )}
                  <span className="truncate">{step.label.split('. ')[1]}</span>
                </button>
              </li>
              {idx < workflowSteps.length - 1 && (
                <ChevronRight size={14} className="text-gray-300 shrink-0 mx-0.5" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>

      {/* 3. ERROR PREVENTION BANNERS */}
      {isDateInverted && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs font-medium animate-in fade-in">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>
            <strong>Date Conflict:</strong> Safari departure date cannot be earlier than arrival date. Please adjust the calendar range below.
          </span>
        </div>
      )}

      {state.guests.length > 0 && !hasLeadGuest && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-800 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Lead Contact Required:</strong> No traveller is designated as the lead contact for vouchers and emergency notifications.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSetLeadGuest(state.guests[0].id)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shrink-0"
          >
            Set First Traveller as Lead
          </button>
        </div>
      )}

      {isAgentSource && !state.agent?.id && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-amber-800 text-xs font-medium animate-in fade-in">
          <AlertCircle size={15} className="text-amber-600 shrink-0" />
          <span>
            <strong>Partner Agent Missing:</strong> Booking source is set to "Agent", please select the partner travel agency in the panel on the right.
          </span>
        </div>
      )}

      {/* 4. QUICK ACTIONS STRIP FOR GROUP (CLICK MORE, TYPE LESS) */}
      <div className="bg-[#1A3326] text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-[#12241b]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#1A3326] flex items-center justify-center font-bold text-sm shrink-0">
            <Users size={16} />
          </div>
          <div className="text-xs">
            <span className="font-bold text-white block">Quick Actions for Group</span>
            <span className="text-emerald-200 text-[11px] block">
              Default Country: <strong className="text-white">{state.client.country || 'Not Set'}</strong> • Emergency Contact: <strong className="text-white">{state.client.phone || state.client.email || 'Not Set'}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
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
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/10"
          >
            Apply Group Country to All
          </button>
          
          <button
            type="button"
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
            className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c59f2e] text-[#1A3326] text-xs font-bold transition shadow-xs"
          >
            Copy Lead Contact to All
          </button>

          <button
            type="button"
            onClick={() => handleOpenGuestModal({ age: 'Adult', isLead: state.guests.length === 0, inheritCountry: true, inheritNationality: true, inheritEmergencyContact: true })}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} /> Add Traveller
          </button>
        </div>
      </div>

      {/* 5. MAIN WORKFLOW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN (2 Cols): Client & Booking, Dates, Group Setup */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Client & Booking Details */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 font-sans flex items-center gap-2">
                <User size={16} className="text-[#D4AF37]" /> Client & Booking Details
              </h2>
              <span className="text-[11px] text-gray-400 font-medium">Core Booking Record</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label htmlFor="lead-group-name" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                  Lead Group / Dossier Name <InfoTooltip text="The identifier for this booking or party, e.g. Harrison Expedition Group or Smith Family Safari." />
                </label>
                <input 
                  id="lead-group-name"
                  type="text" 
                  value={state.client.name} 
                  onChange={e => onUpdateClient({ name: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                  placeholder="e.g. Harrison Expedition Group"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="lead-traveler-email" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                  Lead Traveller Email <InfoTooltip text="Primary email address for guest itineraries, confirmations, and operational updates." />
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Mail size={13} />
                  </span>
                  <input 
                    id="lead-traveler-email"
                    type="email" 
                    value={state.client.email} 
                    onChange={e => onUpdateClient({ email: e.target.value })}
                    className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                    placeholder="client@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="lead-contact-phone" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                  Contact Phone Number <InfoTooltip text="Emergency contact number for airport meet-and-greet and chauffeur dispatch." />
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Phone size={13} />
                  </span>
                  <input 
                    id="lead-contact-phone"
                    type="text" 
                    value={state.client.phone} 
                    onChange={e => onUpdateClient({ phone: e.target.value })}
                    className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                    placeholder="+1 415 555 9284"
                  />
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label htmlFor="origin-country-input" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                  Country of Residence <InfoTooltip text="The home country for the client party, used to set default nationalities and flight timings." />
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Globe size={13} />
                  </span>
                  <input 
                    id="origin-country-input"
                    type="text" 
                    value={countrySearch} 
                    onChange={e => {
                      setCountrySearch(e.target.value);
                      setShowCountryDD(true);
                    }}
                    onFocus={() => setShowCountryDD(true)}
                    className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                    placeholder="Search country..."
                    autoComplete="off"
                  />
                  {showCountryDD && filteredCountries.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1.5 z-50 overflow-hidden">
                      {filteredCountries.map(c => (
                        <div 
                          key={c} 
                          onClick={() => {
                            setCountrySearch(c);
                            onUpdateClient({ country: c });
                            setShowCountryDD(false);
                          }}
                          className="px-4 py-2 text-xs hover:bg-gray-50 cursor-pointer font-medium text-gray-700"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* Card: Travel Dates & Duration */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 font-sans flex items-center gap-2">
                <Calendar size={16} className="text-[#D4AF37]" /> Travel Dates & Duration
              </h2>
              <span className="text-[11px] text-gray-400 font-medium">Safari Timeline</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              <div className="space-y-1.5">
                <label htmlFor="safari-arrival-date" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                  Safari Arrival Date <InfoTooltip text="The first day of the travel programme in Southern Africa." />
                </label>
                <input 
                  id="safari-arrival-date"
                  type="date" 
                  value={state.client.startDate} 
                  onChange={e => handleDateChange('startDate', e.target.value)}
                  className={`w-full h-10 px-3.5 rounded-xl border text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition ${
                    isDateInverted ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="safari-departure-date" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                  Safari Departure Date <InfoTooltip text="The final scheduled departure day of the travel programme." />
                </label>
                <input 
                  id="safari-departure-date"
                  type="date" 
                  value={state.client.endDate} 
                  onChange={e => handleDateChange('endDate', e.target.value)}
                  className={`w-full h-10 px-3.5 rounded-xl border text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition ${
                    isDateInverted ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                  }`}
                />
              </div>

              <div className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-bold text-gray-400 uppercase text-[10px]">Calculated Duration:</span>
                <strong className={`font-bold ${isDateInverted ? 'text-rose-600' : 'text-[#1A3326]'}`}>
                  {state.client.durationText || 'Select dates'}
                </strong>
              </div>
            </div>
          </section>

          {/* Card: Group & Rooming Setup (Progressive Disclosure) */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-7 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-[#D4AF37]" />
                <h2 className="text-sm font-bold text-gray-900 font-sans">Group & Rooming Setup</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md">
                  {groupMgmt.groupType}
                </span>
                <button
                  type="button"
                  onClick={() => setShowGroupAccordion(!showGroupAccordion)}
                  className="text-xs font-bold text-[#1A3326] hover:text-[#D4AF37] transition"
                >
                  {showGroupAccordion ? 'Collapse' : 'Configure'}
                </button>
              </div>
            </div>

            {showGroupAccordion && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="group-dynamics-type" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                        Group Type <InfoTooltip text="Defines the travelling party structure to guide hotel room allocations and guide logistics." />
                      </label>
                      <select 
                        id="group-dynamics-type"
                        value={groupMgmt.groupType}
                        onChange={e => handleUpdateGroupMgmt({ groupType: e.target.value as any })}
                        className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
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
                      <label htmlFor="rooming-sharing-strategy" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                        Rooming & Sharing Strategy <InfoTooltip text="Instructions for room configurations: king bed, twins, single supplements, or interleading family suites." />
                      </label>
                      <textarea 
                        id="rooming-sharing-strategy"
                        value={groupMgmt.sharingPreferences}
                        onChange={e => handleUpdateGroupMgmt({ sharingPreferences: e.target.value })}
                        rows={3}
                        className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                        placeholder="e.g. Couple in master suite; two teenagers sharing twin beds in adjoining suite..."
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                      Guest Rooming Allocations <InfoTooltip text="Tag specific travellers who require single occupancy or represent tour escorts/staff." />
                    </span>
                    
                    {state.guests.length === 0 ? (
                      <div className="text-center py-7 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                        No travellers added to roster yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                        {state.guests.map(g => {
                          const isPrivate = groupMgmt.requiresPrivateRoomIds.includes(g.id);
                          const isStaff = groupMgmt.staffIds.includes(g.id);
                          return (
                            <div key={g.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-gray-100 text-xs">
                              <span className="font-bold text-gray-800 truncate max-w-[130px]">{g.first} {g.last}</span>
                              <div className="flex gap-1.5">
                                <button 
                                  type="button"
                                  onClick={() => toggleGroupPrivateRoom(g.id)}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${
                                    isPrivate ? 'bg-[#D4AF37]/20 text-[#1A3326] border-[#D4AF37]' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
                                  }`}
                                >
                                  Private Room
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => toggleGroupStaff(g.id)}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${
                                    isStaff ? 'bg-[#1A3326] text-white border-[#1A3326]' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
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
            )}
          </section>

        </div>

        {/* RIGHT COLUMN (1 Col): Source, Priority/Status, Travellers Roster, Operational Alerts */}
        <div className="space-y-6">
          
          {/* Card: Booking Source, Priority & Status (Separated Concepts) */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 font-sans flex items-center gap-2">
                <Briefcase size={16} className="text-[#D4AF37]" /> Booking Source & Status
              </h2>
              <span className="text-[11px] text-gray-400 font-medium">Commercial Channel</span>
            </div>

            <div className="space-y-5">
              
              {/* Concept 1: Priority */}
              <div>
                <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block mb-1.5">
                  Priority <InfoTooltip text="Commercial attention level for follow-up and turnaround." />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'hot', label: 'High' },
                    { key: 'pending', label: 'Medium' },
                    { key: 'exploratory', label: 'Low' }
                  ].map(p => (
                    <button 
                      key={p.key} 
                      type="button"
                      onClick={() => onUpdateState({ priority: p.key as any })}
                      className={`py-2 px-1 rounded-xl border text-center text-xs font-bold transition-all ${
                        state.priority === p.key 
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#1A3326] shadow-xs' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concept 2: Booking Status */}
              <div>
                <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block mb-1.5">
                  Booking Status <InfoTooltip text="Operational lifecycle status of this travel programme." />
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'draft', label: 'Enquiry' },
                    { key: 'quoted', label: 'Proposal' },
                    { key: 'confirmed', label: 'Confirmed' },
                    { key: 'in_travel', label: 'In Travel' },
                    { key: 'completed', label: 'Completed' }
                  ].map(st => (
                    <button 
                      key={st.key} 
                      type="button"
                      onClick={() => onUpdateState({ status: st.key as TripStatus })}
                      className={`py-1.5 px-1 rounded-lg border text-center text-[11px] font-bold transition-all ${
                        (state.status || 'draft') === st.key 
                          ? 'border-[#1A3326] bg-[#1A3326] text-white shadow-xs' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concept 3: Acquisition Source */}
              <div>
                <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block mb-1.5">
                  Acquisition Source <InfoTooltip text="How this booking enquiry originated." />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['direct', 'agent', 'referral', 'website'].map(s => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={() => {
                        onUpdateState({ source: s as any });
                        if (s !== 'agent') {
                          onUpdateState({ agent: { id: '', contact: '', email: '', comm: '' } });
                        }
                      }} 
                      className={`py-2 rounded-xl border text-center text-xs font-bold capitalize transition-all ${
                        state.source === s 
                          ? 'border-[#D4AF37] bg-amber-50 text-[#1A3326] font-extrabold' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partner Agent Dropdown (if source === 'agent') */}
              {state.source === 'agent' && (
                <div className="space-y-1.5 pt-3 border-t border-gray-100 animate-in fade-in duration-200">
                  <label htmlFor="partner-agent-select" className="text-[11px] text-gray-700 font-bold uppercase block">
                    Partner Agent <InfoTooltip text="Select the wholesale or retail B2B partner agency responsible for this client." />
                  </label>
                  <select 
                    id="partner-agent-select"
                    value={state.agent.id}
                    onChange={handleAgentSelect} 
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                  >
                    <option value="">Select travel agency partner...</option>
                    <option value="safari_dreams">Safari Dreams (UK) — 12% Commission</option>
                    <option value="wanderlust">Wanderlust (DE) — 10% Commission</option>
                    <option value="cape_connect">Cape Connect — 15% Commission</option>
                    <option value="bespoke_africa">Bespoke Africa Partners — 8% Commission</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Card: Travellers Roster & Presets */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900 text-sm font-sans">Travellers Roster</h2>
                <p className="text-[11px] text-gray-400">{state.guests.length} Registered Guest{state.guests.length !== 1 ? 's' : ''}</p>
              </div>
              <button 
                type="button"
                onClick={() => handleOpenGuestModal()} 
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                title="Add Traveller Profile"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Quick Presets (Click More, Type Less) */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                Quick Traveller Presets <InfoTooltip text="Populate typical party structures in one click." />
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => handleQuickAddTemplate('couple')} className="py-1.5 px-2 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:border-[#D4AF37] hover:bg-gray-50 transition">Couple (2A)</button>
                <button type="button" onClick={() => handleQuickAddTemplate('family')} className="py-1.5 px-2 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:border-[#D4AF37] hover:bg-gray-50 transition">Family (2A+2C)</button>
                <button type="button" onClick={() => handleQuickAddTemplate('solo')} className="py-1.5 px-2 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:border-[#D4AF37] hover:bg-gray-50 transition">Solo Traveller</button>
                <button type="button" onClick={() => handleQuickAddTemplate('group8')} className="py-1.5 px-2 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:border-[#D4AF37] hover:bg-gray-50 transition">Group (8A)</button>
              </div>
            </div>

            {/* Guest List */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              {state.guests.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                  <span className="text-xs text-gray-400 italic block">No travellers added yet. Use a preset above or click Add.</span>
                </div>
              ) : (
                state.guests.map(g => (
                  <div key={g.id} className="p-3 rounded-xl border border-gray-200 bg-slate-50/60 space-y-2 hover:bg-white transition duration-150">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {g.isLead ? (
                          <span title="Lead Contact" className="text-[#D4AF37] shrink-0"><Crown size={14} /></span>
                        ) : (
                          <span className="text-gray-400 shrink-0"><User size={13} /></span>
                        )}
                        <span className="text-xs font-bold text-[#1A3326] truncate">
                          {g.first} {g.last} {g.preferredName ? `(${g.preferredName})` : ''}
                        </span>
                      </div>
                      <span className="text-[9px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">{g.age}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {g.accessibilityMobility && g.accessibilityMobility.length > 0 && (
                        <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Mobility</span>
                      )}
                      {(g.dietaryLifestyle?.length || 0) + (g.dietaryMedical?.length || 0) > 0 && (
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Special Diet</span>
                      )}
                      {groupMgmt.staffIds.includes(g.id) && (
                        <span className="text-[8px] bg-[#1A3326]/10 text-[#1A3326] font-bold px-1.5 py-0.5 rounded">Staff</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-gray-200/60 text-[10px]">
                      <span className="text-gray-400 truncate max-w-[120px]">{g.nationality || g.country || 'Global'}</span>
                      <div className="flex items-center gap-2">
                        {!g.isLead && (
                          <button 
                            type="button"
                            onClick={() => onSetLeadGuest(g.id)} 
                            className="text-gray-500 hover:text-[#1A3326] font-medium"
                          >
                            Make Lead
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => handleOpenGuestModal(g)} 
                          className="text-[#1A3326] hover:text-[#D4AF37] font-bold"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button 
                          type="button"
                          onClick={() => onRemoveGuest(g.id)} 
                          className="text-rose-500 hover:text-rose-700 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Card: Operations Readiness & Alerts */}
          <section className="bg-[#1A3326] text-white rounded-2xl p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Sparkles size={13} /> Operations Readiness & Alerts
            </h3>
            <p className="text-[11px] text-emerald-100/80 leading-relaxed">
              Automated operational checks based on registered group requirements.
            </p>

            <div className="space-y-2 pt-1 text-[11px]">
              {/* Mobility Alert */}
              {activeAccessibilityIssues.length > 0 ? (
                <div className="flex gap-2 bg-amber-500/15 border border-amber-500/30 p-2.5 rounded-xl text-amber-200">
                  <Accessibility size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#D4AF37]">Accessibility Requirement</strong>
                    <span className="text-[10px]">
                      {activeAccessibilityIssues.length} guest(s) need mobility support. Allocate low-step transfer vehicles and ground-floor rooms.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 bg-white/5 p-2 rounded-lg text-emerald-100/70">
                  <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>Standard luxury vehicles and lodges appropriate.</span>
                </div>
              )}

              {/* Diet Alert */}
              {activeDietaryIssues.length > 0 && (
                <div className="flex gap-2 bg-white/5 p-2 rounded-lg text-emerald-100/80">
                  <Egg size={12} className="text-[#D4AF37] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white block font-semibold">Special Diets Logged</strong>
                    <span className="text-[10px] text-emerald-100/60">
                      Dietary requests recorded for {activeDietaryIssues.length} guest(s). Transferred to lodge vouchers automatically.
                    </span>
                  </div>
                </div>
              )}

              {/* Children Alert */}
              {countChildren > 0 && (
                <div className="flex gap-2 bg-white/5 p-2 rounded-lg text-emerald-100/80">
                  <Coffee size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                  <span>{countChildren} child traveller(s). Reserve booster seats for game drives and transfers.</span>
                </div>
              )}
            </div>
          </section>

        </div>

      </div>

      {/* 6. TRAVELLER PROFILE MODAL (Progressive Disclosure) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 border border-gray-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-slate-50/70 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] block mb-0.5">Traveller Dossier</span>
                <h3 className="font-bold text-[#10233F] text-base font-sans flex items-center gap-2">
                  <User size={16} />
                  {modalGuest.id ? `Edit Profile: ${modalGuest.first} ${modalGuest.last}` : 'Add Traveller Profile'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs (Progressive Disclosure) */}
            <nav className="flex border-b border-gray-200 px-6 bg-white overflow-x-auto text-xs font-bold text-gray-500 shrink-0">
              <button 
                type="button"
                onClick={() => setModalTab('basic')}
                className={`py-3 px-4 border-b-2 -mb-px transition-all ${modalTab === 'basic' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-900'}`}
              >
                1. Basic Info
              </button>
              <button 
                type="button"
                onClick={() => setModalTab('accessibility')}
                className={`py-3 px-4 border-b-2 -mb-px transition-all ${modalTab === 'accessibility' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-900'}`}
              >
                2. Accessibility & Mobility
              </button>
              <button 
                type="button"
                onClick={() => setModalTab('dietary')}
                className={`py-3 px-4 border-b-2 -mb-px transition-all ${modalTab === 'dietary' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-900'}`}
              >
                3. Dietary Requirements
              </button>
              <button 
                type="button"
                onClick={() => setModalTab('preferences')}
                className={`py-3 px-4 border-b-2 -mb-px transition-all ${modalTab === 'preferences' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-900'}`}
              >
                4. Comfort & Preferences
              </button>
            </nav>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-grow">
              
              {/* TAB 1: BASIC INFO */}
              {modalTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="guest-first-name" className="text-[11px] text-gray-700 font-bold uppercase block tracking-wider mb-1.5">
                        First Name <InfoTooltip text="Given name as shown on passport." />
                      </label>
                      <input 
                        id="guest-first-name"
                        type="text" 
                        value={modalGuest.first || ''} 
                        onChange={e => setModalGuest({ ...modalGuest, first: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition" 
                        placeholder="John" 
                      />
                    </div>
                    <div>
                      <label htmlFor="guest-last-name" className="text-[11px] text-gray-700 font-bold uppercase block tracking-wider mb-1.5">
                        Last Name <InfoTooltip text="Surname as shown on passport." />
                      </label>
                      <input 
                        id="guest-last-name"
                        type="text" 
                        value={modalGuest.last || ''} 
                        onChange={e => setModalGuest({ ...modalGuest, last: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition" 
                        placeholder="Smith" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="guest-call-name" className="text-[11px] text-gray-700 font-bold uppercase block tracking-wider mb-1.5">
                        Preferred Name <InfoTooltip text="Informal name or nickname for guides and lodge hospitality." />
                      </label>
                      <input 
                        id="guest-call-name"
                        type="text" 
                        value={modalGuest.preferredName || ''} 
                        onChange={e => setModalGuest({ ...modalGuest, preferredName: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition" 
                        placeholder="e.g. Jack" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="guest-nationality-input" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider">
                          Nationality / Country <InfoTooltip text="Passport country for park permits and visa validation." />
                        </label>
                        {state.client.country && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalCountrySearch(state.client.country);
                              setModalGuest({ ...modalGuest, country: state.client.country, nationality: state.client.country, inheritCountry: true });
                            }}
                            className="text-[10px] text-emerald-700 font-bold hover:underline"
                          >
                            Same as Group
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input 
                          id="guest-nationality-input"
                          type="text" 
                          value={modalCountrySearch} 
                          onChange={e => {
                            setModalCountrySearch(e.target.value);
                            setShowModalCountryDD(true);
                            setModalGuest({ ...modalGuest, inheritCountry: false });
                          }} 
                          onFocus={() => setShowModalCountryDD(true)}
                          className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition" 
                          placeholder="Search country..." 
                          autoComplete="off"
                        />
                        {showModalCountryDD && filteredModalCountries.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 z-50 overflow-hidden">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="guest-age-cat" className="text-[11px] text-gray-700 font-bold uppercase block tracking-wider mb-1.5">
                        Age Category <InfoTooltip text="Used for park fees, flight seat bookings, and rooming allocations." />
                      </label>
                      <select 
                        id="guest-age-cat"
                        value={modalGuest.age || 'Adult'} 
                        onChange={e => setModalGuest({ ...modalGuest, age: e.target.value as any })}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                      >
                        <option value="Adult">Adult (18+)</option>
                        <option value="Teen">Teenager (12 - 17)</option>
                        <option value="Child">Child (2 - 11)</option>
                        <option value="Infant">Infant (Under 2)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="guest-language" className="text-[11px] text-gray-700 font-bold uppercase block tracking-wider mb-1.5">
                        Primary Spoken Language <InfoTooltip text="Ensures assignment of fluent language guides where required." />
                      </label>
                      <select 
                        id="guest-language"
                        value={modalGuest.languagesSpoken?.[0] || 'English'} 
                        onChange={e => setModalGuest({ ...modalGuest, languagesSpoken: [e.target.value] })}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                      >
                        <option value="English">English</option>
                        <option value="German">German</option>
                        <option value="French">French</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Italian">Italian</option>
                        <option value="Mandarin">Mandarin</option>
                      </select>
                    </div>
                  </div>

                  {/* Lead Traveller Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                      <input 
                        type="checkbox" 
                        checked={modalGuest.isLead || false} 
                        onChange={e => setModalGuest({ ...modalGuest, isLead: e.target.checked })}
                        className="w-4 h-4 rounded text-[#1A3326] focus:ring-[#D4AF37]"
                      />
                      <span>Designate as Lead Contact for group itinerary & emergency communication</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: ACCESSIBILITY & MOBILITY */}
              {modalTab === 'accessibility' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-[#10233F] flex items-center gap-1.5 uppercase tracking-wider">
                      <Accessibility size={14} className="text-[#D4AF37]" /> Physical Mobility Status <InfoTooltip text="Log any mobility requirements for vehicle step-height, wheelchair access, or walking pace." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Fully Ambulant', 'Mild Mobility Limitation', 'Cane / Crutches', 
                        'Manual Wheelchair', 'Electric Wheelchair', 'Cannot Climb Stairs', 'Transfer Assistance Needed'
                      ].map(item => {
                        const isSelected = modalGuest.accessibilityMobility?.includes(item) || false;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleModalListTag('accessibilityMobility', item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                              isSelected 
                                ? 'bg-[#1A3326] text-white border-[#1A3326]' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {isSelected && <Check size={11} className="inline mr-1" />}
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                    <div className="space-y-2">
                      <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                        Visual Support <InfoTooltip text="Assistance for low vision or guide dog support." />
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Blind', 'Low vision', 'Large print preferred', 'Guide dog travelling'].map(item => {
                          const isSelected = modalGuest.accessibilityVision?.includes(item) || false;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleModalListTag('accessibilityVision', item)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                                isSelected ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                        Hearing Support <InfoTooltip text="Requirements for hearing aids or visual safety briefings." />
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Deaf', 'Hard of hearing', 'Hearing aid', 'Sign language assistance'].map(item => {
                          const isSelected = modalGuest.accessibilityHearing?.includes(item) || false;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleModalListTag('accessibilityHearing', item)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                                isSelected ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-gray-100">
                    <label htmlFor="guest-medical-notes" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                      Medical & Operational Notes <InfoTooltip text="Critical medical notes like oxygen needs or pacemaker notices for flight security." />
                    </label>
                    <input 
                      id="guest-medical-notes"
                      type="text"
                      value={modalGuest.medicalOperationalNotes || ''}
                      onChange={e => setModalGuest({ ...modalGuest, medicalOperationalNotes: e.target.value })}
                      placeholder="e.g. Requires CPAP electrical plug near bedside; carries EpiPen."
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: DIETARY REQUIREMENTS */}
              {modalTab === 'dietary' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                      Religious / Cultural Diets <InfoTooltip text="Religious meal standards sent to lodge kitchens." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Halal', 'Kosher', 'Jain', 'Hindu'].map(item => {
                        const isSelected = modalGuest.dietaryReligious?.includes(item) || false;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleModalListTag('dietaryReligious', item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                              isSelected ? 'bg-[#1A3326] text-white border-[#1A3326]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                      Lifestyle Diets <InfoTooltip text="Preferences like vegetarian or plant-based." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Vegetarian', 'Vegan', 'Pescatarian'].map(item => {
                        const isSelected = modalGuest.dietaryLifestyle?.includes(item) || false;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleModalListTag('dietaryLifestyle', item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                              isSelected ? 'bg-[#1A3326] text-white border-[#1A3326]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <label className="text-[11px] text-rose-700 font-bold uppercase tracking-wider block">
                      Medical / Allergen Alerts <InfoTooltip text="High-priority kitchen warnings for severe food allergies." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Gluten Free', 'Dairy Free', 'Nut Allergy', 'Shellfish Allergy', 'Egg Allergy', 'Soy Allergy', 'Sesame Allergy'].map(item => {
                        const isSelected = modalGuest.dietaryMedical?.includes(item) || false;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleModalListTag('dietaryMedical', item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                              isSelected ? 'bg-rose-700 text-white border-rose-700' : 'bg-rose-50/50 text-rose-800 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {isSelected && <Check size={11} className="inline mr-1" />}
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                      Kitchen Preferences <InfoTooltip text="General food preparation instructions." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Mild Food Only', 'No Pork', 'No Beef', 'Child Meals', 'Soft Foods'].map(item => {
                        const isSelected = modalGuest.dietaryPreferences?.includes(item) || false;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleModalListTag('dietaryPreferences', item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                              isSelected ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: COMFORT & PREFERENCES */}
              {modalTab === 'preferences' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                      Accommodation Preferences <InfoTooltip text="Bedding and suite placement requests." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['King Bed', 'Twin Beds', 'Separate Beds', 'Quiet Room', 'High Floor', 'Low Floor', 'Ground Floor', 'Garden View', 'Sea View'].map(item => {
                        const isSelected = modalGuest.preferencesAccommodation?.includes(item) || false;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleModalListTag('preferencesAccommodation', item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                              isSelected ? 'bg-[#1A3326] text-white border-[#1A3326]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                      Transport Preferences <InfoTooltip text="Seating requests for road transfers and flights." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Front Seat', 'Window Seat', 'Air Conditioning', 'Extra Leg Room', 'Child Seat Required'].map(item => {
                        const isSelected = modalGuest.preferencesTransport?.includes(item) || false;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleModalListTag('preferencesTransport', item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                              isSelected ? 'bg-[#1A3326] text-white border-[#1A3326]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-gray-100">
                    <label htmlFor="guest-bespoke-notes" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                      Guest Notes & Special Requests <InfoTooltip text="Any additional instructions or preferences for this traveller." />
                    </label>
                    <textarea 
                      id="guest-bespoke-notes"
                      value={modalGuest.notes || ''} 
                      onChange={e => setModalGuest({ ...modalGuest, notes: e.target.value })}
                      rows={3}
                      placeholder="e.g. Celebrating milestone anniversary; prefers afternoon game drives."
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-gray-400">
                All saved profile preferences sync directly to hotel and activity vouchers.
              </span>
              <div className="flex gap-2.5">
                <button 
                  type="button"
                  onClick={closeModal} 
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold hover:bg-gray-100 bg-white transition"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSaveModalGuest} 
                  className="px-5 py-2 bg-[#1A3326] text-white rounded-xl text-xs font-bold hover:bg-[#12241b] transition shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};