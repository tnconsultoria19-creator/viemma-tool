import React, { useState } from 'react';
import { AppState, Activity, Guest } from '../types';
import { DB_DEFAULT } from '../dbDefaults';
import { Route, Plus, Trash2, Edit3, Check, Users, Clock, Compass, Info } from 'lucide-react';

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

  const handleOpenAddForm = () => {
    setAForm({
      day: 1,
      slot: 'Morning',
      name: 'Table Mountain Cableway',
      desc: 'Aerial cableway return trip.',
      pickup: '09:00',
      start: '09:30',
      dur: '3 hours',
      pickupLoc: 'Hotel Lobby',
      status: 'Planned',
      conf: '',
      supplier: 'Table Mountain Cableway',
      supPhone: '+27 21 424 8408',
      paxIds: state.guests.map(g => g.id),
      pAdult: 420,
      pChild: 210,
      nAdult: state.guests.filter(g => g.age !== 'Child' && g.age !== 'Infant').length,
      nChild: state.guests.filter(g => g.age === 'Child' || g.age === 'Infant').length,
      flat: 0,
      total: 0,
      inc: ["Entrance Fees"],
      backup: '',
      notes: '',
      isFree: false
    });
    setEditingActivityId(-1);
  };

  const handleEditActivity = (a: Activity) => {
    setAForm({ ...a });
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
        supplier: item.name
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
      isFree: aForm.isFree || false
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
    let updated: string[];
    if (list.includes(inc)) {
      updated = list.filter(x => x !== inc);
    } else {
      updated = [...list, inc];
    }
    setAForm({ ...aForm, inc: updated });
  };

  // Group activities by Day
  const groupedActivities: { [key: number]: Activity[] } = {};
  state.activities.forEach(act => {
    if (!groupedActivities[act.day]) {
      groupedActivities[act.day] = [];
    }
    groupedActivities[act.day].push(act);
  });

  // Sort days
  const sortedDays = Object.keys(groupedActivities).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-accent">Active Timelines</span>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Activities Schedule</h1>
        </div>
        {editingActivityId === null && (
          <button onClick={handleOpenAddForm} className="btn1">
            <Plus size={14} /> Schedule Experience
          </button>
        )}
      </div>

      {/* ACTIVITIES EDIT/ADD FORM PANEL */}
      {editingActivityId !== null && (
        <div className="card border-accent bg-[#fafafa]">
          <div className="stitle border-b border-gray-200 pb-3 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-serif font-bold text-gray-900">
              <Route size={16} className="text-accent" />
              {editingActivityId === -1 ? 'Schedule Tour Experience' : 'Update Tour Experience'}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setEditingActivityId(null)} className="btn2 py-1 px-3 text-[11px]">Cancel</button>
              <button onClick={handleSaveActivity} className="btn1 py-1 px-3 text-[11px]"><Check size={12} /> Save</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-xs">
            <div>
              <label className="lbl">Itinerary Timeline Day</label>
              <input type="number" value={aForm.day || 1} onChange={e => setAForm({ ...aForm, day: Number(e.target.value) })} className="field-input font-bold text-center" min="1" />
            </div>

            <div>
              <label className="lbl">Experience Time Slot</label>
              <select value={aForm.slot || 'Morning'} onChange={e => setAForm({ ...aForm, slot: e.target.value as any })} className="field-input font-medium">
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Full Day">Full Day Experience</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="lbl">Select Preset from Database</label>
              <select onChange={handleDbPrefill} className="field-input border-dashed">
                <option value="">Choose DB Experience (Auto-fills pricing)...</option>
                {DB_DEFAULT.activities.map(act => <option key={act.id} value={act.name}>{act.name}</option>)}
              </select>
            </div>
          </div>

          {/* FREE TIME CHECKBOX */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md mb-4 flex items-center justify-between text-xs">
            <div className="text-emerald-800 leading-tight">
              <p className="font-bold flex items-center gap-1.5"><Info size={13} /> At Leisure / Leisurely Block</p>
              <p>Checking this box flags this block as "Leisurely Free Time", hiding pricing blocks for simple proposal display.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={aForm.isFree || false} 
                onChange={e => handleRecalculateCost({ isFree: e.target.checked })}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
            <div>
              <label className="lbl">Experience Name</label>
              <input type="text" value={aForm.name || ''} onChange={e => setAForm({ ...aForm, name: e.target.value })} className="field-input font-bold text-gray-900" placeholder="e.g. Table Mountain Cableway" />
            </div>
            <div>
              <label className="lbl">Brief Description</label>
              <input type="text" value={aForm.desc || ''} onChange={e => setAForm({ ...aForm, desc: e.target.value })} className="field-input" placeholder="e.g. Guided exploration or free-time walk" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-xs">
            <div>
              <label className="lbl">Pick-up Location</label>
              <input type="text" value={aForm.pickupLoc || ''} onChange={e => setAForm({ ...aForm, pickupLoc: e.target.value })} className="field-input" placeholder="e.g. Hotel Lobby" />
            </div>
            <div>
              <label className="lbl">Pick-up Time</label>
              <input type="time" value={aForm.pickup || ''} onChange={e => setAForm({ ...aForm, pickup: e.target.value })} className="field-input" />
            </div>
            <div>
              <label className="lbl">Activity Start Time</label>
              <input type="time" value={aForm.start || ''} onChange={e => setAForm({ ...aForm, start: e.target.value })} className="field-input" />
            </div>
            <div>
              <label className="lbl">Est. Duration</label>
              <input type="text" value={aForm.dur || ''} onChange={e => setAForm({ ...aForm, dur: e.target.value })} className="field-input" placeholder="e.g. 3 hours" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-xs">
            <div>
              <label className="lbl">Booking Status</label>
              <select value={aForm.status || 'Planned'} onChange={e => setAForm({ ...aForm, status: e.target.value as any })} className="field-input">
                <option value="Planned">Planned</option>
                <option value="Requested">Requested (Unconfirmed)</option>
                <option value="Confirmed">Confirmed (Booked)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="lbl">Confirmation Code</label>
              <input type="text" value={aForm.conf || ''} onChange={e => setAForm({ ...aForm, conf: e.target.value })} className="field-input font-bold uppercase" placeholder="e.g. CONF-8342" />
            </div>

            <div>
              <label className="lbl">Supplier Name</label>
              <input type="text" value={aForm.supplier || ''} onChange={e => setAForm({ ...aForm, supplier: e.target.value })} className="field-input" placeholder="e.g. SAA Heli Tour" />
            </div>

            <div>
              <label className="lbl">Supplier Phone Contact</label>
              <input type="text" value={aForm.supPhone || ''} onChange={e => setAForm({ ...aForm, supPhone: e.target.value })} className="field-input" placeholder="e.g. +27 21 555 4321" />
            </div>
          </div>

          {/* COSTING SECTOR */}
          {!aForm.isFree && (
            <div className="border border-gray-200 bg-white p-4 rounded-md mb-4 text-xs">
              <p className="font-bold text-[#065f46] mb-3"><i className="fa-solid fa-calculator"></i> Experience Cost Pricing Calculations</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                <div>
                  <label className="lbl">Adult Rate (R)</label>
                  <input type="number" value={aForm.pAdult || 0} onChange={e => handleRecalculateCost({ pAdult: Number(e.target.value), flat: 0 })} className="field-input font-semibold" />
                </div>
                <div>
                  <label className="lbl">Adult Pax Count</label>
                  <input type="number" value={aForm.nAdult || 0} onChange={e => handleRecalculateCost({ nAdult: Number(e.target.value), flat: 0 })} className="field-input" />
                </div>
                <div>
                  <label className="lbl">Child Rate (R)</label>
                  <input type="number" value={aForm.pChild || 0} onChange={e => handleRecalculateCost({ pChild: Number(e.target.value), flat: 0 })} className="field-input font-semibold" />
                </div>
                <div>
                  <label className="lbl">Child Pax Count</label>
                  <input type="number" value={aForm.nChild || 0} onChange={e => handleRecalculateCost({ nChild: Number(e.target.value), flat: 0 })} className="field-input" />
                </div>
                <div>
                  <label className="lbl">OR Flat Cost (R)</label>
                  <input type="number" value={aForm.flat || 0} onChange={e => handleRecalculateCost({ flat: Number(e.target.value) })} className="field-input font-bold text-red-700" placeholder="Overrides per-pax" />
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded border border-gray-200 font-bold">
                <span className="text-gray-500">Calculated Retail Subtotal:</span>
                <span className="text-sm text-gray-900 font-serif">R {(aForm.total || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* INCLUSIONS LIST */}
          <div className="mb-4 text-xs">
            <label className="lbl">Included Packages & Extras</label>
            <div className="flex flex-wrap gap-1.5">
              {["Entrance Fees", "Transport/Pickup", "Drinks/Wine Tasting", "Professional Tour Guide", "Buffet Meals", "Bottled Water"].map(item => {
                const active = aForm.inc?.includes(item) || false;
                return (
                  <span key={item} onClick={() => toggleIncSelection(item)} className={`tag ${active ? 'active' : ''}`}>{item}</span>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
            <div>
              <label className="lbl">Weather Contingency / Backup Alternative</label>
              <input type="text" value={aForm.backup || ''} onChange={e => setAForm({ ...aForm, backup: e.target.value })} className="field-input border-dashed" placeholder="e.g. City Museum Tour if Table Mountain is windbound" />
            </div>
            <div>
              <label className="lbl flex items-center gap-1"><Users size={12} /> Assign Guests</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {state.guests.map(g => {
                  const isSelected = aForm.paxIds?.includes(g.id);
                  return (
                    <span key={g.id} onClick={() => togglePassengerSelection(g.id)} className={`tag cursor-pointer select-none ${isSelected ? 'active' : ''}`}>
                      {g.first} ({g.age})
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mb-4 text-xs">
            <label className="lbl">Bespoke Experience Coordination Notes</label>
            <textarea 
              value={aForm.notes || ''} 
              onChange={e => setAForm({ ...aForm, notes: e.target.value })}
              className="field-input font-medium"
              placeholder="e.g. Professional English guide requested, group prefers table reservation by the window, vegetarian menus requested..."
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
            <button onClick={() => setEditingActivityId(null)} className="btn2">Cancel</button>
            <button onClick={handleSaveActivity} className="btn1"><Check size={14} /> Schedule Experience</button>
          </div>
        </div>
      )}

      {/* TIMELINE VIEW DISPLAY */}
      <div className="space-y-6">
        {sortedDays.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg text-gray-400 text-sm italic">
            Your daily itinerary is empty. Click "Schedule Experience" to establish your day plans.
          </div>
        ) : (
          sortedDays.map(day => (
            <div key={day} className="border-l-2 border-accent pl-5 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase tracking-wider font-bold bg-[#ecfdf5] text-accent border border-accentBorder px-3 py-1 rounded-sm">Day {day}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Itinerary Timeline</span>
              </div>

              <div className="space-y-3">
                {groupedActivities[day].map(act => {
                  const assignedPax = state.guests.filter(g => act.paxIds.includes(g.id));

                  return (
                    <div key={act.id} className="card bg-white hover:shadow transition">
                      <div className="flex items-center justify-between border-b border-gray-150 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`chip py-1.5 px-3 text-[10px] font-bold ${act.slot === 'Morning' ? 'bg-amber-50 text-amber-700 border-amber-200' : act.slot === 'Afternoon' ? 'bg-blue-50 text-blue-700 border-blue-200' : act.slot === 'Evening' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {act.slot}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{act.name}</h4>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Supplier: {act.supplier || 'Private Guide'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleEditActivity(act)} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accentLight transition">
                            <Edit3 size={11} />
                          </button>
                          <button onClick={() => onRemoveActivity(act.id)} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-rose hover:bg-roseLight transition">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-600 mb-3.5 italic leading-relaxed">{act.desc}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-gray-600 mb-3.5">
                        <div>
                          <span className="text-[9px] block text-gray-400 font-semibold uppercase">Schedule Details</span>
                          <strong className="text-gray-900 font-bold flex items-center gap-1 mt-0.5"><Clock size={11} /> {act.pickup || 'TBD'} Pick-up ({act.pickupLoc || 'Hotel Lobby'})</strong>
                        </div>
                        <div>
                          <span className="text-[9px] block text-gray-400 font-semibold uppercase">Actual Experience</span>
                          <strong className="text-gray-900 font-medium block mt-0.5">Starts: {act.start || 'TBD'} | Dur: {act.dur || '—'}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] block text-gray-400 font-semibold uppercase">Excursion Status</span>
                          <strong className="text-accent font-bold mt-0.5 flex items-center gap-1"><Compass size={11} /> {act.status}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] block text-gray-400 font-semibold uppercase">Retail Cost</span>
                          <strong className="text-xs font-bold text-gray-900 font-serif block mt-0.5">
                            {act.isFree ? <span className="text-emerald-700">Leisure (Free Time)</span> : `R ${act.total.toLocaleString()}`}
                          </strong>
                        </div>
                      </div>

                      {/* INCLUSIONS OR BACKUPS */}
                      <div className="flex flex-wrap gap-1.5 items-center text-[10px] mb-3">
                        {act.inc && act.inc.length > 0 && (
                          <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Inclusions:</span>
                        )}
                        {act.inc?.map(item => (
                          <span key={item} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{item}</span>
                        ))}
                        {act.backup && (
                          <span className="ml-auto text-gray-400 font-semibold italic">Contingency: {act.backup}</span>
                        )}
                      </div>

                      {/* Assigned passenger list */}
                      <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between gap-2.5 text-[10px] text-gray-500">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Excursion Pax:</span>
                          {assignedPax.length === 0 ? (
                            <span className="text-rose font-bold">No passengers assigned!</span>
                          ) : (
                            assignedPax.map(ap => (
                              <span key={ap.id} className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded-sm font-semibold">{ap.first} {ap.last}</span>
                            ))
                          )}
                        </div>
                      </div>

                      {act.notes && (
                        <div className="bg-gray-50 border border-gray-200 border-dashed p-2.5 rounded-sm text-[10px] text-gray-500 italic mt-3">
                          <strong>Coordination Notes:</strong> {act.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
