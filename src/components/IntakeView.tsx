import React, { useState, useEffect } from 'react';
import { AppState, Guest } from '../types';
import { COUNTRIES, GUEST_DIETARY_OPTIONS, GUEST_MOBILITY_OPTIONS, GUEST_MEDICAL_OPTIONS, GUEST_PREF_OPTIONS } from '../dbDefaults';
import { Users, User, ShieldAlert, Award, ChevronDown, Check, Trash2, Edit3, Plus, Crown, Info } from 'lucide-react';

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

  const closeModal = () => {
    setModalOpen(false);
    setModalGuest({});
  };

  // Filter countries locally
  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(c => c.substring(4).toLowerCase().includes(countrySearch.toLowerCase().trim())).slice(0, 8)
    : [];

  const filteredModalCountries = modalCountrySearch.trim()
    ? COUNTRIES.filter(c => c.substring(4).toLowerCase().includes(modalCountrySearch.toLowerCase().trim())).slice(0, 8)
    : [];

  // Recalculate duration
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

  const handleGroupConditionToggle = (type: 'dietary' | 'mobility' | 'medical' | 'prefs', val: string) => {
    const currentList = [...state.groupConditions[type]];
    let updated: string[];
    if (val === 'None') {
      updated = [];
    } else {
      const listWithoutNone = currentList.filter(x => x !== 'None');
      if (listWithoutNone.includes(val)) {
        updated = listWithoutNone.filter(x => x !== val);
      } else {
        updated = [...listWithoutNone, val];
      }
    }
    onUpdateGroupConditions({ [type]: updated });
  };

  // AGENT PANEL POPULATOR
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

  // OPEN GUEST MODAL FOR ADD/EDIT
  const handleOpenGuestModal = (g?: Guest) => {
    if (g) {
      setModalGuest({ ...g });
      setModalCountrySearch(g.country);
    } else {
      setModalGuest({
        first: '',
        last: '',
        age: 'Adult',
        country: '',
        diet: [],
        mob: [],
        med: [],
        pref: [],
        notes: ''
      });
      setModalCountrySearch('');
    }
    setModalOpen(true);
  };

  const handleSaveModalGuest = () => {
    const f = modalGuest.first?.trim();
    const l = modalGuest.last?.trim();
    if (!f || !l) {
      alert('First and Last names are required.');
      return;
    }

    if (modalGuest.id) {
      // Edit mode
      onUpdateGuest(modalGuest.id, {
        ...modalGuest,
        country: modalCountrySearch
      });
    } else {
      // Add mode
      const newG: Guest = {
        id: Date.now(),
        first: f,
        last: l,
        age: modalGuest.age || 'Adult',
        country: modalCountrySearch,
        diet: modalGuest.diet || [],
        mob: modalGuest.mob || [],
        med: modalGuest.med || [],
        pref: modalGuest.pref || [],
        notes: modalGuest.notes || '',
        isLead: state.guests.length === 0
      };
      onAddGuest(newG);
    }
    setModalOpen(false);
    setModalGuest({});
  };

  // QUICK ADD TEMPLATES
  const handleQuickAddTemplate = (type: 'couple' | 'family' | 'solo' | 'group8') => {
    const lastName = state.client.name.split(' ').pop() || 'Guest';
    const baseFields = { country: state.client.country, diet: [], mob: [], med: [], pref: [], notes: '' };

    if (type === 'couple') {
      onAddGuest({ ...baseFields, id: Date.now(), first: 'Guest 1', last: lastName, age: 'Adult', isLead: state.guests.length === 0 });
      setTimeout(() => {
        onAddGuest({ ...baseFields, id: Date.now() + 1, first: 'Guest 2', last: lastName, age: 'Adult', isLead: false });
      }, 50);
    } else if (type === 'family') {
      onAddGuest({ ...baseFields, id: Date.now(), first: 'Adult 1', last: lastName, age: 'Adult', isLead: state.guests.length === 0 });
      setTimeout(() => onAddGuest({ ...baseFields, id: Date.now() + 1, first: 'Adult 2', last: lastName, age: 'Adult', isLead: false }), 50);
      setTimeout(() => onAddGuest({ ...baseFields, id: Date.now() + 2, first: 'Child 1', last: lastName, age: 'Child', isLead: false }), 100);
      setTimeout(() => onAddGuest({ ...baseFields, id: Date.now() + 3, first: 'Child 2', last: lastName, age: 'Child', isLead: false }), 150);
    } else if (type === 'solo') {
      onAddGuest({ ...baseFields, id: Date.now(), first: 'Solo Guest', last: lastName, age: 'Adult', isLead: true });
    } else if (type === 'group8') {
      for (let i = 1; i <= 8; i++) {
        setTimeout(() => {
          onAddGuest({ ...baseFields, id: Date.now() + i, first: `Guest ${i}`, last: lastName, age: 'Adult', isLead: state.guests.length === 0 && i === 1 });
        }, i * 50);
      }
    }
  };

  const toggleModalTag = (field: 'diet' | 'mob' | 'med' | 'pref', val: string) => {
    const currentList = modalGuest[field] ? [...modalGuest[field]!] : [];
    let updated: string[];
    if (currentList.includes(val)) {
      updated = currentList.filter(x => x !== val);
    } else {
      updated = [...currentList, val];
    }
    setModalGuest({ ...modalGuest, [field]: updated });
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION: STATUS & SOURCE */}
      <div className="card">
        <div className="stitle"><i className="fa-solid fa-flag"></i> Booking Status & Source</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="lbl">Booking Priority</label>
            <div className="flex flex-wrap gap-2">
              {['hot', 'confirmed', 'exploratory', 'pending'].map(p => {
                const icon = p === 'hot' ? 'fa-fire text-red-500' : p === 'confirmed' ? 'fa-check-circle text-green-600' : p === 'exploratory' ? 'fa-compass text-blue-500' : 'fa-clock text-amber-500';
                return (
                  <div 
                    key={p} 
                    onClick={() => onUpdateState({ priority: p as any })} 
                    className={`chip ${state.priority === p ? 'active' : ''}`}
                  >
                    <i className={`fa-solid ${icon} text-[10px]`}></i>
                    <span className="capitalize">{p} Lead</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="lbl">Lead Source</label>
            <div className="flex flex-wrap gap-2">
              {['direct', 'agent', 'referral', 'website', 'social'].map(s => {
                const icon = s === 'direct' ? 'fa-user' : s === 'agent' ? 'fa-handshake' : s === 'referral' ? 'fa-user-group' : s === 'website' ? 'fa-globe' : 'fa-instagram';
                return (
                  <div 
                    key={s} 
                    onClick={() => {
                      onUpdateState({ source: s as any });
                      if (s !== 'agent') {
                        onUpdateState({ agent: { id: '', contact: '', email: '', comm: '' } });
                      }
                    }} 
                    className={`chip ${state.source === s ? 'active' : ''}`}
                  >
                    <i className={`fa-${s === 'social' ? 'brands' : 'solid'} ${icon} text-[10px]`}></i>
                    <span className="capitalize">{s}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AGENT SELECTION - FULL WIDTH */}
        {state.source === 'agent' && (
          <div className="agent-panel visible mt-4 border border-gray-200">
            <label className="lbl">Select Partner Travel Agent</label>
            <select 
              id="agent-select" 
              value={state.agent.id}
              onChange={handleAgentSelect} 
              className="field-input mb-3"
              style={{ width: '100%' }}
            >
              <option value="">Choose partner agent...</option>
              <option value="safari_dreams">Safari Dreams Travel — Emma Williams (emma@safaridreams.co.uk) — 12% Comm</option>
              <option value="wanderlust">Wanderlust Adventures — Hans Müller (hans@wanderlust.de) — 10% Comm</option>
              <option value="cape_connect">Cape Connect Tours — Mike Johnson (mike@capeconnect.com) — 15% Comm</option>
              <option value="bespoke_africa">Bespoke Africa Partners — Claire Thompson (claire@bespokeafrica.au) — 8% Comm</option>
            </select>

            {state.agent.id && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="lbl">Agent Contact</label>
                  <input type="text" value={state.agent.contact} className="field-input bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="lbl">Agent Email</label>
                  <input type="email" value={state.agent.email} className="field-input bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="lbl">Comm Rate</label>
                  <input type="text" value={state.agent.comm} className="field-input bg-gray-50" readOnly />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION: CLIENT DETAILS */}
      <div className="card">
        <div className="stitle"><i className="fa-solid fa-user"></i> Client Profile & Coordinator</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="lbl">Assigned Consultant</label>
            <select 
              value={state.consultant} 
              onChange={e => onUpdateState({ consultant: e.target.value })} 
              className="field-input font-medium"
            >
              <option>Sarah Jenkins</option>
              <option>Peter van der Merwe</option>
              <option>Maria Santos</option>
            </select>
          </div>
          <div>
            <label className="lbl">Client / Group Name</label>
            <input 
              type="text" 
              value={state.client.name} 
              onChange={e => onUpdateClient({ name: e.target.value })} 
              className="field-input font-medium text-gray-900" 
              placeholder="e.g. Harrison Group" 
            />
          </div>
          <div>
            <label className="lbl">Country of Origin</label>
            <div className="relative">
              <input 
                type="text" 
                value={countrySearch} 
                onChange={e => {
                  setCountrySearch(e.target.value);
                  setShowCountryDD(true);
                }} 
                onFocus={() => setShowCountryDD(true)}
                className="field-input font-medium" 
                placeholder="Type to search country..." 
                autoComplete="off"
              />
              {showCountryDD && filteredCountries.length > 0 && (
                <div className="cdd open">
                  {filteredCountries.map(c => (
                    <div 
                      key={c} 
                      onClick={() => {
                        setCountrySearch(c);
                        onUpdateClient({ country: c });
                        setShowCountryDD(false);
                      }} 
                      className="copt"
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="lbl">Email Address</label>
            <input 
              type="email" 
              value={state.client.email} 
              onChange={e => onUpdateClient({ email: e.target.value })} 
              className="field-input" 
              placeholder="Email address" 
            />
          </div>
          <div>
            <label className="lbl">Phone / WhatsApp</label>
            <input 
              type="text" 
              value={state.client.phone} 
              onChange={e => onUpdateClient({ phone: e.target.value })} 
              className="field-input" 
              placeholder="Phone number" 
            />
          </div>
          <div>
            <label className="lbl">Preferred Contact</label>
            <div className="flex gap-2">
              {['whatsapp', 'email', 'call'].map(method => (
                <button 
                  key={method}
                  onClick={() => onUpdateClient({ contactMethod: method as any })}
                  className={`chip flex-1 justify-center ${state.client.contactMethod === method ? 'active' : ''}`}
                >
                  <i className={`fa-${method === 'whatsapp' ? 'brands fa-whatsapp' : method === 'email' ? 'solid fa-envelope' : 'solid fa-phone'} text-[10px]`}></i>
                  <span className="capitalize text-[11px] ml-1">{method}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: TRIP CONFIGURATION */}
      <div className="card">
        <div className="stitle"><i className="fa-solid fa-calendar"></i> Trip Configuration</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { id: 'multi', label: 'Multi-Day Package', desc: 'Full itinerary with accommodation.', icon: 'fa-mountain-sun text-accent' },
            { id: 'day', label: 'Day Excursion', desc: 'Single-day tour. No overnight.', icon: 'fa-sun text-amber-500' },
            { id: 'transfer', label: 'Transfer Only', desc: 'Airport or point-to-point transfer.', icon: 'fa-car-side text-blue-500' }
          ].map(type => (
            <div 
              key={type.id}
              onClick={() => onUpdateClient({ tripType: type.id as any })}
              className={`trip-card ${state.client.tripType === type.id ? 'active' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="trip-dot mt-0.5"></div>
                <div>
                  <p className="text-xs font-bold text-gray-900 mb-0.5 flex items-center gap-1.5"><i className={`fa-solid ${type.icon}`}></i> {type.label}</p>
                  <p className="text-[11px] text-gray-500 leading-snug">{type.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="lbl">Start Date</label>
            <input 
              type="date" 
              value={state.client.startDate} 
              onChange={e => handleDateChange('startDate', e.target.value)} 
              className="field-input" 
            />
          </div>
          <div>
            <label className="lbl">End Date</label>
            <input 
              type="date" 
              value={state.client.endDate} 
              disabled={state.client.tripType === 'day'}
              onChange={e => handleDateChange('endDate', e.target.value)} 
              className="field-input" 
            />
          </div>
          <div>
            <label className="lbl">Duration</label>
            <div id="duration-box" className="field-input bg-gray-50 text-center font-bold text-accent">
              {state.client.startDate && state.client.endDate ? state.client.durationText : 'Select dates'}
            </div>
          </div>
          <div>
            <label className="lbl">Occasion</label>
            <div className="flex gap-1.5 flex-wrap">
              {['Honeymoon', 'Birthday', 'Anniversary'].map(occ => (
                <span 
                  key={occ}
                  onClick={() => handleOccasionToggle(occ)} 
                  className={`tag-chip ${state.client.occasion === occ ? 'active' : ''}`}
                >
                  {occ}
                </span>
              ))}
              <span 
                onClick={() => handleOccasionToggle('Other')} 
                className={`tag-chip ${state.client.occasion === 'Other' ? 'active' : ''}`}
              >
                Other
              </span>
            </div>
            {state.client.occasion === 'Other' && (
              <input 
                type="text" 
                value={state.client.otherOccasion}
                onChange={e => onUpdateClient({ otherOccasion: e.target.value })}
                className="field-input mt-2" 
                placeholder="Describe special occasion..." 
              />
            )}
          </div>
        </div>
      </div>

      {/* SECTION: PROFILE TAGS */}
      <div className="card">
        <div className="stitle"><i className="fa-solid fa-tags"></i> Profile Profiling Tags</div>
        <div className="flex flex-wrap gap-2">
          {['Family', 'Solo Traveler', 'Honeymooners', 'Historic Landscape', 'Adventure & Ocean', 'Adventure & Safari', 'Corporate Delegates', 'VIPs'].map(tag => (
            <span 
              key={tag}
              onClick={() => handleProfileTagToggle(tag)} 
              className={`tag-chip ${state.client.tags.includes(tag) ? 'active' : ''}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* SECTION: GROUP-WIDE CONDITIONS */}
      <div className="card">
        <div className="stitle"><i className="fa-solid fa-people-group"></i> Group-Wide Conditions (Inherited)</div>
        <div className="bg-[#f0fdf4] border border-[#a7f3d0] rounded-md p-4 mb-4 text-[11px] text-[#065f46] space-y-1">
          <p className="font-bold flex items-center gap-1.5"><Info size={13} /> Collective Travel Requirements</p>
          <p className="text-gray-600">Assign conditions below that apply generally to all travelers. Individual roster members can override these later inside their guest card.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="lbl">Group Dietary Requirements</label>
            <div className="flex flex-wrap gap-1.5">
              {['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Nut Allergy', 'No Pork', 'No Beef'].map(d => (
                <span 
                  key={d}
                  onClick={() => handleGroupConditionToggle('dietary', d)}
                  className={`tag-chip ${state.groupConditions.dietary.includes(d) || (d === 'None' && state.groupConditions.dietary.length === 0) ? 'active' : ''}`}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="lbl">Group Mobility & Assistance</label>
            <div className="flex flex-wrap gap-1.5">
              {['None', 'Wheelchair Required', 'Walking Difficulty', 'Cannot Climb Stairs', 'Requires Assistance'].map(m => (
                <span 
                  key={m}
                  onClick={() => handleGroupConditionToggle('mobility', m)}
                  className={`tag-chip ${state.groupConditions.mobility.includes(m) || (m === 'None' && state.groupConditions.mobility.length === 0) ? 'active' : ''}`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="lbl">Group Medical Conditions</label>
            <div className="flex flex-wrap gap-1.5">
              {['None', 'Heart Condition', 'Asthma', 'Diabetes', 'Epilepsy', 'Pregnant', 'Carries Medication'].map(m => (
                <span 
                  key={m}
                  onClick={() => handleGroupConditionToggle('medical', m)}
                  className={`tag-chip ${state.groupConditions.medical.includes(m) || (m === 'None' && state.groupConditions.medical.length === 0) ? 'active' : ''}`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="lbl">Group Seating / Travel Preferences</label>
            <div className="flex flex-wrap gap-1.5">
              {['Window Seats', 'Front of Vehicle', 'Extra Legroom', 'Quiet/No Music', 'Child Seats Needed'].map(p => (
                <span 
                  key={p}
                  onClick={() => handleGroupConditionToggle('prefs', p)}
                  className={`tag-chip ${state.groupConditions.prefs.includes(p) ? 'active' : ''}`}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="lbl">Group Special Instructions Notes</label>
            <textarea 
              value={state.groupConditions.notes}
              onChange={e => onUpdateGroupConditions({ notes: e.target.value })}
              className="field-input font-medium"
              placeholder="e.g. Grandma needs extra assistance boarding, kids prefer quiet entertainment, whole family is generally vegetarian except father..."
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>
        </div>
      </div>

      {/* SECTION: GUEST ROSTER */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="stitle mb-0">
            <i className="fa-solid fa-users"></i> Guest Roster
            <span id="g-count" className="badge bg-gray-100 text-gray-800 border border-gray-300 ml-2">{state.guests.length} Pax</span>
          </div>
          <button onClick={() => handleOpenGuestModal()} className="btn1">
            <Plus size={14} /> Add Guest
          </button>
        </div>

        <div className="flex items-center gap-1.5 mb-5 pb-4 border-b border-gray-200 flex-wrap">
          <span className="text-[11px] font-semibold text-gray-600 mr-1.5">Template Quick Add:</span>
          <button onClick={() => handleQuickAddTemplate('couple')} className="btn2 text-[11px] py-1 px-3">Couple (2 Adults)</button>
          <button onClick={() => handleQuickAddTemplate('family')} className="btn2 text-[11px] py-1 px-3">Family (2A + 2C)</button>
          <button onClick={() => handleQuickAddTemplate('solo')} className="btn2 text-[11px] py-1 px-3">Solo Traveler</button>
          <button onClick={() => handleQuickAddTemplate('group8')} className="btn2 text-[11px] py-1 px-3">Group of 8</button>
        </div>

        {/* Guest cards Roster List */}
        <div id="guest-list" className="space-y-3">
          {state.guests.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm italic">
              Guest roster is empty. Use templates or "Add Guest" above to build your group.
            </div>
          ) : (
            state.guests.map(g => {
              const initials = (g.first[0] + g.last[0]).toUpperCase();
              const isExpanded = expandedGuestId === g.id;

              return (
                <div key={g.id} className={`grow ${g.isLead ? 'lead' : ''}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-accent text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold text-gray-900">{g.first} {g.last}</span>
                          {g.isLead && (
                            <span className="badge bg-accentLight text-accent border border-accentBorder text-[9px]"><Crown size={8} /> Lead</span>
                          )}
                          <span className="badge bg-gray-100 text-gray-600 border border-gray-200 text-[9px]">{g.age}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{g.country || 'No nationality'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                      <button 
                        onClick={() => setExpandedGuestId(isExpanded ? null : g.id)} 
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accentLight transition"
                      >
                        <ChevronDown size={14} className={`transform transition ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <button 
                        onClick={() => handleOpenGuestModal(g)} 
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accentLight transition"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button 
                        onClick={() => onSetLeadGuest(g.id)} 
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accentLight transition"
                      >
                        <Crown size={12} />
                      </button>
                      <button 
                        onClick={() => onRemoveGuest(g.id)} 
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-rose hover:bg-roseLight transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded individual Overrides display */}
                  {isExpanded && (
                    <div id={`exp-${g.id}`} className="expand-content open">
                      <div className="mt-4 pt-4 border-t border-gray-200 text-[11px] space-y-2">
                        <div><strong className="text-gray-700">Dietary Overrides:</strong> <span className="text-gray-600">{g.diet.length ? g.diet.join(', ') : 'None (Inherits from group)'}</span></div>
                        <div><strong className="text-gray-700">Mobility Overrides:</strong> <span className="text-gray-600">{g.mob.length ? g.mob.join(', ') : 'None (Inherits from group)'}</span></div>
                        <div><strong className="text-gray-700">Medical Overrides:</strong> <span className="text-gray-600">{g.med.length ? g.med.join(', ') : 'None (Inherits from group)'}</span></div>
                        <div><strong className="text-gray-700">Preferences Overrides:</strong> <span className="text-gray-600">{g.pref.length ? g.pref.join(', ') : 'None (Inherits from group)'}</span></div>
                        {g.notes && (
                          <div><strong className="text-gray-700 font-bold">Notes:</strong> <span className="text-gray-600 italic">{g.notes}</span></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* GUEST ADD/EDIT MODAL OVERLAY */}
      {modalOpen && (
        <div className="modal-bg open">
          <div className="modal-inner">
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><User size={16} className="text-accent" /> {modalGuest.id ? 'Edit Guest Details' : 'Add Guest to Group'}</h3>
              <button onClick={closeModal} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="lbl">First Name</label>
                <input 
                  type="text" 
                  value={modalGuest.first || ''} 
                  onChange={e => setModalGuest({ ...modalGuest, first: e.target.value })}
                  className="field-input font-medium" 
                  placeholder="First name" 
                />
              </div>
              <div>
                <label className="lbl">Last Name</label>
                <input 
                  type="text" 
                  value={modalGuest.last || ''} 
                  onChange={e => setModalGuest({ ...modalGuest, last: e.target.value })}
                  className="field-input font-medium" 
                  placeholder="Last name" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="lbl">Age Category</label>
                <select 
                  value={modalGuest.age || 'Adult'} 
                  onChange={e => setModalGuest({ ...modalGuest, age: e.target.value as any })}
                  className="field-input"
                >
                  <option value="Adult">Adult (18-64)</option>
                  <option value="Elderly">Elderly (65+)</option>
                  <option value="Teen">Teen (13-17)</option>
                  <option value="Child">Child (3-12)</option>
                  <option value="Infant">Infant (0-2)</option>
                </select>
              </div>
              <div>
                <label className="lbl">Nationality</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={modalCountrySearch} 
                    onChange={e => {
                      setModalCountrySearch(e.target.value);
                      setShowModalCountryDD(true);
                    }} 
                    onFocus={() => setShowModalCountryDD(true)}
                    className="field-input" 
                    placeholder="Search country..." 
                    autoComplete="off"
                  />
                  {showModalCountryDD && filteredModalCountries.length > 0 && (
                    <div className="cdd open">
                      {filteredModalCountries.map(c => (
                        <div 
                          key={c} 
                          onClick={() => {
                            setModalCountrySearch(c);
                            setShowModalCountryDD(false);
                          }} 
                          className="copt"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-md p-3 mb-4 text-[10px] text-[#2563eb] flex gap-2">
              <i className="fa-solid fa-circle-info mt-0.5"></i>
              <span>Leave sections unselected below to inherit Group-Wide conditions. Select only to configure overrides for this guest.</span>
            </div>

            <div className="mb-4">
              <label className="lbl">Dietary Overrides</label>
              <div className="flex flex-wrap gap-1.5">
                {GUEST_DIETARY_OPTIONS.filter(o => o !== 'None').map(d => {
                  const active = modalGuest.diet?.includes(d) || false;
                  return (
                    <span 
                      key={d} 
                      onClick={() => toggleModalTag('diet', d)} 
                      className={`tag ${active ? 'active' : ''}`}
                    >
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="lbl">Mobility Overrides</label>
              <div className="flex flex-wrap gap-1.5">
                {GUEST_MOBILITY_OPTIONS.filter(o => o !== 'None').map(m => {
                  const active = modalGuest.mob?.includes(m) || false;
                  return (
                    <span 
                      key={m} 
                      onClick={() => toggleModalTag('mob', m)} 
                      className={`tag ${active ? 'active' : ''}`}
                    >
                      {m}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="lbl">Medical Overrides</label>
              <div className="flex flex-wrap gap-1.5">
                {GUEST_MEDICAL_OPTIONS.filter(o => o !== 'None').map(m => {
                  const active = modalGuest.med?.includes(m) || false;
                  return (
                    <span 
                      key={m} 
                      onClick={() => toggleModalTag('med', m)} 
                      className={`tag ${active ? 'active' : ''}`}
                    >
                      {m}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="lbl">Travel / Seating Preferences</label>
              <div className="flex flex-wrap gap-1.5">
                {GUEST_PREF_OPTIONS.map(p => {
                  const active = modalGuest.pref?.includes(p) || false;
                  return (
                    <span 
                      key={p} 
                      onClick={() => toggleModalTag('pref', p)} 
                      className={`tag ${active ? 'active' : ''}`}
                    >
                      {p}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <label className="lbl">Individual Notes</label>
              <textarea 
                value={modalGuest.notes || ''} 
                onChange={e => setModalGuest({ ...modalGuest, notes: e.target.value })}
                className="field-input font-medium" 
                placeholder="Specific instructions or preferences..."
                style={{ resize: 'vertical', minHeight: '60px' }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button onClick={closeModal} className="btn2">Cancel</button>
              <button onClick={handleSaveModalGuest} className="btn1">
                <Check size={14} /> Save Guest
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
