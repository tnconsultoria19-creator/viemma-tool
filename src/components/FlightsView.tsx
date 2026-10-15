import React, { useState, useEffect } from 'react';
import { AppState, Flight, Stop, AttachmentItem } from '../types';
import { fetchAirlinesCatalogue, addCustomAirlineToCatalogue } from '../lib/catalogueService';
import { AttachmentManager } from './AttachmentManager';
import { 
  Plane, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Users, 
  MapPin, 
  ArrowRight, 
  Briefcase, 
  Calendar, 
  Clock, 
  Tag, 
  Compass, 
  AlertCircle,
  ExternalLink,
  Link as LinkIcon,
  Search,
  Radio,
  RefreshCw,
  ShieldAlert,
  Info,
  AlertTriangle,
  X
} from 'lucide-react';

interface FlightsViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onAddFlight: (f: Flight) => void;
  onRemoveFlight: (id: number) => void;
  onUpdateFlight: (id: number, updates: Partial<Flight>) => void;
}

export const FlightsView: React.FC<FlightsViewProps> = ({
  state,
  onUpdateState,
  onAddFlight,
  onRemoveFlight,
  onUpdateFlight
}) => {
  const [editingFlightId, setEditingFlightId] = useState<number | null>(null);
  const [fForm, setFForm] = useState<Partial<Flight>>({});
  const [stopsList, setStopsList] = useState<Stop[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Dynamic Airline Catalogue
  const [airlineCatalog, setAirlineCatalog] = useState<string[]>([]);
  const [airlineSearch, setAirlineSearch] = useState('');
  const [showAirlineDropdown, setShowAirlineDropdown] = useState(false);
  const [newAirlineInput, setNewAirlineInput] = useState('');
  const [showAddAirlineModal, setShowAddAirlineModal] = useState(false);

  // Flight Reference Links
  const [newRefLinkTitle, setNewRefLinkTitle] = useState('');
  const [newRefLinkUrl, setNewRefLinkUrl] = useState('');

  // Stop sub-forms
  const [stopAirport, setStopAirport] = useState('');
  const [stopArr, setStopArr] = useState('');
  const [stopDep, setStopDep] = useState('');
  const [stopDur, setStopDur] = useState('');
  const [stopChangeNo, setStopChangeNo] = useState('');

  // FlightRadar24 Embed & Live Status
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [activeFlightRadarTab, setActiveFlightRadarTab] = useState<'embed' | 'overview'>('overview');

  useEffect(() => {
    fetchAirlinesCatalogue().then(list => {
      setAirlineCatalog(list);
    });
  }, []);

  const filteredAirlines = airlineSearch.trim()
    ? airlineCatalog.filter(a => a.toLowerCase().includes(airlineSearch.toLowerCase()))
    : airlineCatalog.slice(0, 30);

  const handleOpenAddForm = () => {
    setFForm({
      direction: 'Inbound',
      airline: 'Emirates',
      flightNo: '',
      pnr: '',
      confirmationRef: '',
      bookingUrl: '',
      referenceLinks: [],
      supplierContact: '',
      from: '',
      to: 'CPT',
      date: state.client.startDate || '',
      depTime: '',
      arrTime: '',
      duration: '',
      cabin: 'Economy',
      status: 'Quoted',
      paxIds: state.guests.map(g => g.id), // Default to all guests
      bagHand: 1,
      bagCheck: 1,
      bagOver: 0,
      cost: 0,
      markup: 0,
      qty: state.guests.length || 1,
      notes: ''
    });
    setAirlineSearch('Emirates');
    setStopsList([]);
    setValidationError(null);
    setEditingFlightId(-1); // special ID for new form
  };

  const handleEditFlight = (f: Flight) => {
    setFForm({ ...f });
    setAirlineSearch(f.airline || '');
    setStopsList(f.stops || []);
    setValidationError(null);
    setEditingFlightId(f.id);
  };

  // Missing Flight Information Confirmation State
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [pendingMissingFields, setPendingMissingFields] = useState<string[]>([]);

  const handleSaveFlight = (bypassConfirmation = false) => {
    setValidationError(null);
    const chosenAirline = (airlineSearch || fForm.airline || '').trim();

    // Check all optional & recommended flight details dynamically
    const missing: string[] = [];
    if (!chosenAirline) missing.push('Airline');
    if (!fForm.flightNo?.trim()) missing.push('Flight number');
    if (!fForm.from?.trim()) missing.push('Origin airport (From)');
    if (!fForm.to?.trim()) missing.push('Destination airport (To)');
    if (!fForm.date) missing.push('Departure date');
    if (!fForm.depTime) missing.push('Departure time');
    if (!fForm.arrTime) missing.push('Arrival time');
    if (!fForm.pnr?.trim()) missing.push('PNR / Booking reference');

    if (missing.length > 0 && !bypassConfirmation) {
      setPendingMissingFields(missing);
      setMissingModalOpen(true);
      return;
    }

    const finalAirline = chosenAirline || 'TBD Airline';
    // Save custom airline into catalogue if present
    if (chosenAirline && !airlineCatalog.includes(chosenAirline)) {
      const updated = addCustomAirlineToCatalogue(chosenAirline);
      setAirlineCatalog(updated);
    }

    const savedFlight: Flight = {
      id: fForm.id || Date.now(),
      direction: fForm.direction || 'Inbound',
      airline: finalAirline,
      flightNo: (fForm.flightNo || 'TBD').trim().toUpperCase(),
      pnr: (fForm.pnr || '').trim().toUpperCase(),
      confirmationRef: (fForm.confirmationRef || '').trim().toUpperCase(),
      bookingUrl: (fForm.bookingUrl || '').trim(),
      referenceLinks: fForm.referenceLinks || [],
      supplierContact: (fForm.supplierContact || '').trim(),
      from: (fForm.from || 'TBD').trim().toUpperCase(),
      to: (fForm.to || 'TBD').trim().toUpperCase(),
      date: fForm.date || '',
      depTime: fForm.depTime || '',
      arrTime: fForm.arrTime || '',
      duration: fForm.duration || '',
      cabin: fForm.cabin || 'Economy',
      status: fForm.status || 'Quoted',
      paxIds: fForm.paxIds || [],
      bagHand: Number(fForm.bagHand) || 0,
      bagCheck: Number(fForm.bagCheck) || 0,
      bagOver: Number(fForm.bagOver) || 0,
      cost: Number(fForm.cost) || 0,
      markup: Number(fForm.markup) || 0,
      qty: Number(fForm.qty) || 1,
      notes: fForm.notes || '',
      stops: stopsList,
      isIncomplete: missing.length > 0,
      missingFields: missing.length > 0 ? missing : undefined,
      attachments: fForm.attachments || []
    };

    if (editingFlightId === -1) {
      onAddFlight(savedFlight);
    } else {
      onUpdateFlight(savedFlight.id, savedFlight);
    }
    setEditingFlightId(null);
    setFForm({});
    setStopsList([]);
    setValidationError(null);
    setMissingModalOpen(false);
    setPendingMissingFields([]);
  };

  const handleAddStop = () => {
    if (!stopAirport.trim()) {
      setValidationError('Waypoint airport code is required.');
      return;
    }
    const newStop: Stop = {
      id: Date.now(),
      airport: stopAirport.trim().toUpperCase(),
      arrTime: stopArr,
      depTime: stopDep,
      duration: stopDur,
      changeFlightNo: stopChangeNo.trim().toUpperCase()
    };
    setStopsList([...stopsList, newStop]);
    setStopAirport('');
    setStopArr('');
    setStopDep('');
    setStopDur('');
    setStopChangeNo('');
  };

  const handleRemoveStop = (id: number) => {
    setStopsList(stopsList.filter(s => s.id !== id));
  };

  const togglePassengerSelection = (paxId: number) => {
    const list = fForm.paxIds || [];
    let updated: number[];
    if (list.includes(paxId)) {
      updated = list.filter(id => id !== paxId);
    } else {
      updated = [...list, paxId];
    }
    setFForm({ ...fForm, paxIds: updated });
  };

  const handleAddReferenceLink = () => {
    if (!newRefLinkUrl.trim()) return;
    const current = fForm.referenceLinks || [];
    const updated = [
      ...current,
      {
        title: newRefLinkTitle.trim() || 'Booking / Reference Document',
        url: newRefLinkUrl.trim().startsWith('http') ? newRefLinkUrl.trim() : `https://${newRefLinkUrl.trim()}`
      }
    ];
    setFForm({ ...fForm, referenceLinks: updated });
    setNewRefLinkTitle('');
    setNewRefLinkUrl('');
  };

  const handleRemoveReferenceLink = (index: number) => {
    const current = fForm.referenceLinks || [];
    const updated = current.filter((_, i) => i !== index);
    setFForm({ ...fForm, referenceLinks: updated });
  };

  const handleAddNewAirlineToCatalog = () => {
    if (!newAirlineInput.trim()) return;
    const updated = addCustomAirlineToCatalogue(newAirlineInput.trim());
    setAirlineCatalog(updated);
    setAirlineSearch(newAirlineInput.trim());
    setFForm({ ...fForm, airline: newAirlineInput.trim() });
    setNewAirlineInput('');
    setShowAddAirlineModal(false);
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-in fade-in duration-500 pb-16">
      
      {/* Title Header with Spacious Breathing Room */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-5 md:p-6 bg-white border border-slate-200 rounded-md">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#8A6A00] flex items-center gap-2">
            <Plane size={14} /> Flights
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#10233F] font-sans">Flights</h1>
          <p className="text-slate-600 max-w-2xl text-sm leading-relaxed">
            Record inbound, outbound and connecting flights, airline and booking details, times, and passenger links.
          </p>
        </div>
        {editingFlightId === null && (
          <button 
            type="button"
            onClick={handleOpenAddForm} 
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-bold shadow-md hover:translate-y-[-1px] transition-all duration-150 shrink-0 cursor-pointer"
          >
            <Plus size={14} /> Add flight
          </button>
        )}
      </div>

      {/* FLIGHT EDIT/ADD SIDE-OVER WORKSPACE OR CARD */}
      {editingFlightId !== null && (
        <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden ">
          
          {/* Header */}
          <div className="bg-[#1A3326] text-white p-5 md:p-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block mb-1">Flight details</span>
              <h2 className="text-xl md:text-2xl font-bold font-sans flex items-center gap-2">
                <Plane size={20} className="text-[#D4AF37]" />
                {editingFlightId === -1 ? 'Add flight' : 'Edit flight'}
              </h2>
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setEditingFlightId(null)} 
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveFlight} 
                className="px-5 py-2 rounded-xl bg-[#D4AF37] text-[#1A3326] hover:bg-[#b89528] text-xs font-extrabold shadow-sm hover:translate-y-[-1px] transition-all cursor-pointer"
              >
                Save flight
              </button>
            </div>
          </div>

          {/* Validation Notice */}
          {validationError && (
            <div className="mx-6 md:mx-8 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="p-6 md:p-8 space-y-8 bg-gray-50/50">
            
            {/* GROUP 1: Basic Flight Information & Airline Catalogue */}
            <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider flex items-center gap-2">
                  <Compass size={14} className="text-[#D4AF37]" /> Basic Flight & Airline Information
                </h3>
                <span className="text-[10px] text-gray-400 font-semibold">Shared Catalogue: {airlineCatalog.length} Carriers</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Sector Direction</label>
                  <select 
                    value={fForm.direction || 'Inbound'}
                    onChange={e => setFForm({ ...fForm, direction: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200"
                  >
                    <option value="Inbound">Inbound (Arrival)</option>
                    <option value="Outbound">Outbound (Departure)</option>
                    <option value="Internal">Internal (Regional)</option>
                  </select>
                </div>

                {/* SEARCHABLE AIRLINE CATALOGUE + FREE TEXT ENTRY */}
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Airline Carrier</label>
                    <button
                      type="button"
                      onClick={() => setShowAddAirlineModal(true)}
                      className="text-[10px] text-[#D4AF37] hover:underline font-bold"
                    >
                      + Custom Airline
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={airlineSearch} 
                      onChange={e => {
                        setAirlineSearch(e.target.value);
                        setFForm({ ...fForm, airline: e.target.value });
                        setShowAirlineDropdown(true);
                      }}
                      onFocus={() => setShowAirlineDropdown(true)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                      placeholder="Type or search airline..."
                    />
                    <span className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                      <Search size={14} />
                    </span>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showAirlineDropdown && filteredAirlines.length > 0 && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-sm max-h-56 overflow-y-auto z-50 py-1 text-xs">
                      <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <span>Select Carrier from Shared List</span>
                        <button type="button" onClick={() => setShowAirlineDropdown(false)} className="text-gray-400 hover:text-gray-600">Close</button>
                      </div>
                      {filteredAirlines.map(airline => (
                        <div
                          key={airline}
                          onClick={() => {
                            setAirlineSearch(airline);
                            setFForm({ ...fForm, airline });
                            setShowAirlineDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-emerald-50 cursor-pointer font-medium text-gray-700 hover:text-[#1A3326] transition flex items-center justify-between"
                        >
                          <span>{airline}</span>
                          {fForm.airline === airline && <Check size={12} className="text-emerald-600" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Flight Number</label>
                  <input 
                    type="text" 
                    value={fForm.flightNo || ''} 
                    onChange={e => setFForm({ ...fForm, flightNo: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 uppercase focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                    placeholder="e.g. EK772, SA042" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">PNR Reference Code</label>
                  <input 
                    type="text" 
                    value={fForm.pnr || ''} 
                    onChange={e => setFForm({ ...fForm, pnr: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-[#065f46] uppercase focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                    placeholder="e.g. ZQW67B" 
                  />
                </div>

              </div>
            </div>

            {/* GROUP 2: Travel Schedule / Airport Information */}
            <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Calendar size={14} className="text-[#D4AF37]" /> Travel Schedule & Airports
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Origin Airport</label>
                  <input 
                    type="text" 
                    value={fForm.from || ''} 
                    onChange={e => setFForm({ ...fForm, from: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 uppercase focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                    placeholder="e.g. DXB, LHR, GRU" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Destination Airport</label>
                  <input 
                    type="text" 
                    value={fForm.to || ''} 
                    onChange={e => setFForm({ ...fForm, to: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 uppercase focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                    placeholder="e.g. CPT, JNB, WDH" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Flight Date</label>
                  <input 
                    type="date" 
                    value={fForm.date || ''} 
                    onChange={e => setFForm({ ...fForm, date: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Departure Time (LT)</label>
                  <input 
                    type="time" 
                    value={fForm.depTime || ''} 
                    onChange={e => setFForm({ ...fForm, depTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Arrival Time (LT)</label>
                  <input 
                    type="time" 
                    value={fForm.arrTime || ''} 
                    onChange={e => setFForm({ ...fForm, arrTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                  />
                </div>

              </div>
            </div>

            {/* GROUP 3: BOOKING REFERENCE & ONLINE LINKS (Resolves Section 9 Save Flight Links) */}
            <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider flex items-center gap-2">
                  <LinkIcon size={14} className="text-[#D4AF37]" /> Flight Reference & Booking Links
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Links are saved permanently against this flight</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Ticket Confirmation Reference</label>
                  <input 
                    type="text" 
                    value={fForm.confirmationRef || ''} 
                    onChange={e => setFForm({ ...fForm, confirmationRef: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="e.g. ET-CONF-88294"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Airline Online Check-in / Booking URL</label>
                  <input 
                    type="url" 
                    value={fForm.bookingUrl || ''} 
                    onChange={e => setFForm({ ...fForm, bookingUrl: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="https://www.emirates.com/manage-booking"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Airline / Supplier Support Contact</label>
                  <input 
                    type="text" 
                    value={fForm.supplierContact || ''} 
                    onChange={e => setFForm({ ...fForm, supplierContact: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="+27 21 818 8000 / support@airline.com"
                  />
                </div>

              </div>

              {/* Additional Reference Links */}
              <div className="pt-2 border-t border-gray-50 space-y-3">
                <span className="text-[11px] font-bold text-gray-700 block uppercase tracking-wider">
                  Attached Reference Documents & E-Ticket Links
                </span>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newRefLinkTitle}
                    onChange={e => setNewRefLinkTitle(e.target.value)}
                    placeholder="Link Title (e.g. Client E-Ticket PDF, GDS Confirmation)"
                    className="sm:w-1/3 h-10 px-3 rounded-xl border border-gray-200 text-xs"
                  />
                  <input
                    type="url"
                    value={newRefLinkUrl}
                    onChange={e => setNewRefLinkUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or cloud link"
                    className="sm:w-1/2 h-10 px-3 rounded-xl border border-gray-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddReferenceLink}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus size={14} /> Add Link
                  </button>
                </div>

                {fForm.referenceLinks && fForm.referenceLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {fForm.referenceLinks.map((rl, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                        <ExternalLink size={12} className="text-emerald-700" />
                        <a href={rl.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-800 hover:underline">
                          {rl.title}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveReferenceLink(idx)}
                          className="text-gray-400 hover:text-rose-600 ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* GROUP 4: Layover Waypoint Stops */}
            <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <MapPin size={14} className="text-[#D4AF37]" /> Layover Routing Waypoints (Optional)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <input 
                  type="text" 
                  value={stopAirport} 
                  onChange={e => setStopAirport(e.target.value)} 
                  placeholder="Stop Airport (e.g. DOH)" 
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold uppercase"
                />
                <input 
                  type="time" 
                  value={stopArr} 
                  onChange={e => setStopArr(e.target.value)} 
                  placeholder="Arrival Time" 
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs"
                />
                <input 
                  type="time" 
                  value={stopDep} 
                  onChange={e => setStopDep(e.target.value)} 
                  placeholder="Departure Time" 
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs"
                />
                <input 
                  type="text" 
                  value={stopDur} 
                  onChange={e => setStopDur(e.target.value)} 
                  placeholder="Duration (e.g. 2h 45m)" 
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs"
                />
                <button 
                  type="button"
                  onClick={handleAddStop} 
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-gray-700 transition"
                >
                  <Plus size={14} /> Add Waypoint
                </button>
              </div>

              {stopsList.length > 0 && (
                <div className="space-y-2 border-t border-gray-50 pt-3">
                  {stopsList.map((stop, idx) => (
                    <div key={stop.id} className="flex justify-between items-center text-xs bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <span>
                        <strong className="text-gray-800">Stop #{idx + 1}: {stop.airport}</strong> — Arr: {stop.arrTime || '—'} | Dep: {stop.depTime || '—'} | Duration: {stop.duration || '—'} 
                        {stop.changeFlightNo && ` (Connects to ${stop.changeFlightNo})`}
                      </span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveStop(stop.id)} 
                        className="text-rose-600 hover:text-rose-700 font-bold transition text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GROUP 5: Class & Pricing */}
            <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Clock size={14} className="text-[#D4AF37]" /> Class Cabin & Pricing Metrics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Cabin Class</label>
                  <select 
                    value={fForm.cabin || 'Economy'}
                    onChange={e => setFForm({ ...fForm, cabin: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business</option>
                    <option value="First">First Class</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Booking Status</label>
                  <select 
                    value={fForm.status || 'Quoted'}
                    onChange={e => setFForm({ ...fForm, status: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                  >
                    <option value="Quoted">Quoted</option>
                    <option value="Booked">Booked (Unconfirmed)</option>
                    <option value="Ticketed">Ticketed (Confirmed)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Net Base Cost per Pax (R)</label>
                  <input 
                    type="number" 
                    value={fForm.cost || 0} 
                    onChange={e => setFForm({ ...fForm, cost: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Buffer Markup per Pax (R)</label>
                  <input 
                    type="number" 
                    value={fForm.markup || 0} 
                    onChange={e => setFForm({ ...fForm, markup: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Passenger Quantity</label>
                  <input 
                    type="number" 
                    value={fForm.qty || 1} 
                    onChange={e => setFForm({ ...fForm, qty: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

              </div>
            </div>

            {/* GROUP 6: Luggage Protocols */}
            <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Briefcase size={14} className="text-[#D4AF37]" /> Baggage Protocols
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Hand Luggage (per Pax)</label>
                  <input 
                    type="number" 
                    value={fForm.bagHand || 1} 
                    onChange={e => setFForm({ ...fForm, bagHand: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Checked Bags (per Pax)</label>
                  <input 
                    type="number" 
                    value={fForm.bagCheck || 1} 
                    onChange={e => setFForm({ ...fForm, bagCheck: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Oversized Items (Bikes, Golf Bags)</label>
                  <input 
                    type="number" 
                    value={fForm.bagOver || 0} 
                    onChange={e => setFForm({ ...fForm, bagOver: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
              </div>
            </div>

            {/* GROUP 7: Passenger assignment (Stable ID mapping) */}
            <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Users size={14} className="text-[#D4AF37]" /> Assign Passengers (Roster Link)
              </h3>

              <div className="flex flex-wrap gap-2.5">
                {state.guests.length === 0 ? (
                  <span className="text-xs text-gray-400 italic flex items-center gap-1.5">
                    <AlertCircle size={14} /> Please add passengers to your group roster in the Intake section first.
                  </span>
                ) : (
                  state.guests.map(g => {
                    const isSelected = fForm.paxIds?.includes(g.id);
                    return (
                      <span 
                        key={g.id} 
                        onClick={() => togglePassengerSelection(g.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border select-none transition duration-150 flex items-center gap-1.5 hover:translate-y-[-1px] ${
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

            {/* GROUP 8: Flight Coordination Notes */}
            <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Tag size={14} className="text-[#D4AF37]" /> Coordination & Internal Notes
              </h3>
              <textarea 
                value={fForm.notes || ''} 
                onChange={e => setFForm({ ...fForm, notes: e.target.value })}
                className="w-full p-4 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#D4AF37] transition"
                placeholder="e.g. Flight booked via Skywards miles, business class lounge passes issued, infant bassinet requested in bulkhead row..."
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            {/* GROUP 9: Supporting Documents & Flight Attachments */}
            <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm space-y-4">
              <AttachmentManager
                attachments={fForm.attachments || []}
                onAddAttachment={(item) => setFForm(prev => ({
                  ...prev,
                  attachments: [...(prev.attachments || []), item]
                }))}
                onRemoveAttachment={(id) => setFForm(prev => ({
                  ...prev,
                  attachments: (prev.attachments || []).filter(a => a.id !== id)
                }))}
                recordType="flight"
                recordId={fForm.id || Date.now()}
                bookingRef={state.ref}
                title="Flight E-Tickets, Boarding Passes & PNR Documents"
                description="Upload airline booking PDFs, ticket vouchers, or e-ticket receipts (PDF, JPEG, PNG, WebP up to 15MB)."
              />
            </div>

          </div>

          {/* Sticky footer for action buttons */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
              Saves sector passage, passenger roster links, and reference documents.
            </span>
            <div className="flex gap-3 ml-auto">
              <button 
                type="button"
                onClick={() => setEditingFlightId(null)} 
                className="px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveFlight} 
                className="px-6 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-extrabold shadow-md hover:translate-y-[-1px] transition duration-150 cursor-pointer"
              >
                Save Flight Sector
              </button>
            </div>
          </div>

        </div>
      )}

      {/* REGISTERED FLIGHTS LIST */}
      <div className="space-y-6">
        {state.flights.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-md shadow-sm max-w-lg mx-auto space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-50 text-[#065f46] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Plane size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 text-sm">No Flight Sectors Registered</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Connect long-haul and regional air corridors. Tap "Link New Flight Sector" to begin.
              </p>
            </div>
            <button 
              type="button"
              onClick={handleOpenAddForm} 
              className="px-4 py-2.5 bg-[#1A3326] text-white rounded-xl text-xs font-bold shadow hover:bg-[#12241b] transition cursor-pointer"
            >
              Configure First Sector
            </button>
          </div>
        ) : (
          state.flights.map(f => {
            const retailPerPax = f.cost + f.markup;
            const retailTotal = retailPerPax * f.qty;
            const assignedPax = state.guests.filter(g => f.paxIds.includes(g.id));

            return (
              <div 
                key={f.id} 
                className="bg-white rounded-md border border-gray-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden"
              >
                {/* Visual badge for sector direction on left side */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  f.direction === 'Inbound' ? 'bg-[#D4AF37]' : f.direction === 'Outbound' ? 'bg-[#1A3326]' : 'bg-blue-500'
                }`} />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-5 mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#065f46] flex items-center justify-center border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform duration-200">
                      <Plane size={18} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{f.direction} Sector Connection</span>
                        {f.isIncomplete && (
                          <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <AlertTriangle size={10} className="text-amber-600" /> Provisional (Missing details)
                          </span>
                        )}
                        {f.attachments && f.attachments.length > 0 && (
                          <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            📎 {f.attachments.length} {f.attachments.length === 1 ? 'doc' : 'docs'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm mt-0.5">
                        {f.airline} {f.flightNo} • <span className="font-mono text-xs text-[#065f46] font-bold tracking-wide">PNR: {f.pnr || 'NOT SET'}</span>
                        {f.confirmationRef && <span className="ml-2 font-mono text-xs text-gray-500 font-normal">Conf: {f.confirmationRef}</span>}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {f.bookingUrl && (
                      <a 
                        href={f.bookingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1 hover:bg-emerald-100 transition"
                      >
                        <ExternalLink size={12} /> Check-In
                      </a>
                    )}
                    <button 
                      type="button"
                      onClick={() => handleEditFlight(f)} 
                      className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:border-gray-300 flex items-center justify-center transition shadow-sm cursor-pointer"
                      title="Edit Flight Sector"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => onRemoveFlight(f.id)} 
                      className="w-9 h-9 rounded-xl border border-rose-100 bg-rose-50/20 text-rose-500 hover:text-white hover:bg-rose-500 flex items-center justify-center transition shadow-sm cursor-pointer"
                      title="Remove Flight Sector"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Core details grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 text-xs text-gray-600 mb-5">
                  <div>
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Route Passage</span>
                    <strong className="text-[#1A3326] font-bold flex items-center gap-1">
                      {f.from} <ArrowRight size={10} className="text-[#D4AF37]" /> {f.to}
                    </strong>
                  </div>
                  <div>
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Departure Schedule</span>
                    <strong className="text-gray-900 font-semibold">{f.date} • {f.depTime || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Arrival Estimate</span>
                    <strong className="text-gray-900 font-semibold">{f.arrTime || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Cabin Class / Status</span>
                    <strong className="text-gray-900 font-semibold">
                      {f.cabin} • <span className="text-[#D4AF37] font-bold">{f.status}</span>
                    </strong>
                  </div>
                  <div className="text-left md:text-right border-l md:border-l border-gray-100 pl-4 md:pl-6">
                    <span className="block font-bold text-[9px] text-[#D4AF37] uppercase tracking-widest mb-1">Grand Retail Total</span>
                    <strong className="text-base font-bold text-[#1A3326]">R {retailTotal.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Attached Links & Documents */}
                {f.referenceLinks && f.referenceLinks.length > 0 && (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Attached Documents:</span>
                    {f.referenceLinks.map((rl, i) => (
                      <a
                        key={i}
                        href={rl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-emerald-800 hover:bg-slate-100 transition"
                      >
                        <ExternalLink size={10} /> {rl.title}
                      </a>
                    ))}
                  </div>
                )}

                {/* Layover and stop timeline */}
                {f.stops && f.stops.length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 text-[11px] text-gray-500 space-y-2">
                    <span className="font-bold text-[#065f46] block flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#D4AF37]" /> Multi-Stop Corridor Milestones
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-xs">{f.from}</span>
                      {f.stops.map((stop) => (
                        <React.Fragment key={stop.id}>
                          <ArrowRight size={10} className="text-gray-400" />
                          <div className="bg-[#1A3326]/5 border border-[#1A3326]/10 px-2.5 py-1 rounded-lg text-gray-700 flex items-center gap-1.5">
                            <span className="font-bold text-[#1A3326]">{stop.airport}</span>
                            <span className="text-[9px] text-gray-400">({stop.duration || 'Transit'})</span>
                            {stop.changeFlightNo && (
                              <span className="bg-[#D4AF37]/20 text-[#1A3326] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                                Switch to {stop.changeFlightNo}
                              </span>
                            )}
                          </div>
                        </React.Fragment>
                      ))}
                      <ArrowRight size={10} className="text-gray-400" />
                      <span className="font-bold text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-xs">{f.to}</span>
                    </div>
                  </div>
                )}

                {/* Footnotes & assigned passengers */}
                <div className="border-t border-gray-50 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">Assigned Pax:</span>
                    {assignedPax.length === 0 ? (
                      <span className="text-red-500 italic">No passengers mapped!</span>
                    ) : (
                      assignedPax.map(ap => (
                        <span 
                          key={ap.id} 
                          className="bg-gray-50 text-gray-700 border border-gray-100 px-2.5 py-1 rounded-lg font-semibold text-[11px]"
                        >
                          {ap.first} {ap.last}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-3">
                    <span>Hand: {f.bagHand} bags</span>
                    <span className="text-gray-200">|</span>
                    <span>Checked: {f.bagCheck} bags</span>
                    {f.bagOver > 0 && (
                      <>
                        <span className="text-gray-200">|</span>
                        <span className="text-yellow-600">Oversize: {f.bagOver} items</span>
                      </>
                    )}
                  </div>
                </div>

                {f.notes && (
                  <div className="bg-yellow-50/50 border border-[#D4AF37]/10 p-3 rounded-xl text-[11px] text-gray-500 mt-4">
                    <strong>Expedition Flight Notes:</strong> {f.notes}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* SECTION 7: CAPE TOWN AIRPORT (CPT) — LIVE FLIGHTS (FlightRadar24 Integration) */}
      <section className="bg-white rounded-md border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              <Radio size={15} className="text-emerald-600 animate-pulse" />
              <span>Cape Town Airport — Live Flights</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#1A3326] font-sans">
              Cape Town International (CPT / FACT) Operations Feed
            </h2>
            <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
              Real-time flight movements, arrival corridors, runway traffic, and scheduled departures powered by FlightRadar24 live tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Official Link always available as required */}
            <a
              href="https://www.flightradar24.com/data/airports/cpt"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition flex items-center gap-2"
            >
              <span>Open Live CPT Flight Board</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Airport Status Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Airport Code</span>
            <strong className="text-sm font-extrabold text-[#1A3326]">IATA: CPT • ICAO: FACT</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Location</span>
            <strong className="text-sm font-semibold text-gray-800">Matroosfontein, Cape Town</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Active Corridors</span>
            <strong className="text-sm font-semibold text-gray-800">Runway 01/19 (3,200m)</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Data Feed</span>
            <strong className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Third-Party Live Radar
            </strong>
          </div>
        </div>

        {/* Live Radar Display with Graceful Fallback */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-slate-900 text-white relative">
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-bold">FlightRadar24 Embedded Corridor Monitor</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-300">Provider: FlightRadar24 AB</span>
              <a 
                href="https://www.flightradar24.com/data/airports/cpt" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
              >
                Direct Link <ExternalLink size={11} />
              </a>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-4">
            <div className="max-w-xl mx-auto text-center space-y-3">
              <div className="w-14 h-14 bg-amber-400/10 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                <Radio size={28} />
              </div>
              <h3 className="text-lg font-bold text-white">Live Cape Town International (CPT) Flight Radar</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                FlightRadar24 provides real-time ADS-B telemetry for inbound transatlantic, European, and regional African arrivals into Cape Town. Due to provider browser security headers, click below to open the dedicated live radar board in full resolution.
              </p>
              <div className="pt-2">
                <a
                  href="https://www.flightradar24.com/data/airports/cpt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#b89528] text-[#1A3326] text-xs font-extrabold shadow-md transition"
                >
                  <ExternalLink size={16} />
                  <span>Launch Official FlightRadar24 CPT Tracker</span>
                </a>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Third-party live flight tracking information provided under FlightRadar24 terms.</span>
              <span>Coordinates: 33.9648° S, 18.6017° E</span>
            </div>
          </div>
        </div>

      </section>

      {/* Add Custom Airline to Shared Catalogue Modal */}
      {showAddAirlineModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-sm animate-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Plane size={18} className="text-[#D4AF37]" /> Add Airline to Shared Catalogue
            </h3>
            <p className="text-xs text-gray-500">
              Enter the carrier name. It will be added to the shared airline directory for all current and future itineraries.
            </p>
            <input
              type="text"
              value={newAirlineInput}
              onChange={e => setNewAirlineInput(e.target.value)}
              placeholder="e.g. LATAM Brazil, Air Côte d'Ivoire"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAirlineModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewAirlineToCatalog}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Airline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Flight Information Confirmation Modal */}
      {missingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-md max-w-md w-full p-6 space-y-5 shadow-sm border border-amber-200 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">
                  Some flight information is missing
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  The following information has not been provided:
                </p>
              </div>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
              <ul className="space-y-1">
                {pendingMissingFields.map((field, i) => (
                  <li key={i} className="text-xs text-amber-950 flex items-center gap-2 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {field}
                  </li>
                ))}
              </ul>
              <p className="text-xs font-bold text-amber-900 pt-2 border-t border-amber-200/60">
                Would you like to save this flight without the missing information?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setMissingModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Go Back and Complete
              </button>
              <button
                type="button"
                onClick={() => handleSaveFlight(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-extrabold shadow-md transition cursor-pointer"
              >
                Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
