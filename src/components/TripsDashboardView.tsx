import React, { useState, useMemo } from 'react';
import { AppState, TripStatus, TripSummaryItem } from '../types';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Eye, 
  ChevronRight, 
  Sparkles, 
  Compass, 
  Layers, 
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  FileText
} from 'lucide-react';

interface TripsDashboardViewProps {
  currentTrip: AppState;
  tripsList: AppState[];
  onSelectTrip: (tripId: string) => void;
  onCreateNewTrip: () => void;
  onDuplicateTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onOpenRoleView: (role: 'owner' | 'client' | 'agent' | 'operator') => void;
}

export const TripsDashboardView: React.FC<TripsDashboardViewProps> = ({
  currentTrip,
  tripsList,
  onSelectTrip,
  onCreateNewTrip,
  onDuplicateTrip,
  onDeleteTrip,
  onOpenRoleView
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Compute readiness score for a trip
  const calculateTripReadiness = (t: AppState): number => {
    let totalItems = 0;
    let confirmedItems = 0;

    // Flights
    t.flights.forEach(f => {
      totalItems++;
      if (f.status === 'Confirmed' || f.status === 'Ticketed' || f.serviceStatus === 'confirmed') confirmedItems++;
    });

    // Hotels
    t.rooms.forEach(r => {
      totalItems++;
      if (r.pay === 'Deposit Paid' || r.pay === 'Fully Paid' || r.status === 'Confirmed' || r.serviceStatus === 'confirmed') confirmedItems++;
    });

    // Transfers
    t.transfers.forEach(tr => {
      totalItems++;
      if (tr.status === 'Confirmed' || tr.status === 'Completed' || tr.serviceStatus === 'confirmed') confirmedItems++;
    });

    // Activities
    t.activities.forEach(a => {
      totalItems++;
      if (a.status === 'Confirmed' || a.serviceStatus === 'confirmed') confirmedItems++;
    });

    // Room allocations
    const totalGuests = t.guests.length || 1;
    const assignedGuestIds = new Set<number>();
    t.rooms.forEach(r => {
      r.guestIds?.forEach(id => assignedGuestIds.add(id));
      r.allocatedRooms?.forEach(ar => ar.guestIds?.forEach(id => assignedGuestIds.add(id)));
    });
    totalItems += 2;
    if (assignedGuestIds.size >= totalGuests) confirmedItems += 2;
    else if (assignedGuestIds.size > 0) confirmedItems += 1;

    if (totalItems === 0) return 100;
    return Math.round((confirmedItems / totalItems) * 100);
  };

  // Compute financial value for a trip
  const calculateTripValue = (t: AppState): number => {
    const flightCosts = t.flights.reduce((sum, f) => sum + (f.cost * f.qty), 0);
    const transferCosts = t.transfers.reduce((sum, tr) => sum + tr.cost + tr.tolls + tr.parking, 0);
    const roomCosts = t.rooms.reduce((sum, r) => sum + (r.rate * r.nights) + r.supp, 0);
    const activityCosts = t.activities.reduce((sum, a) => sum + (a.isFree ? 0 : a.total), 0);
    const totalCost = flightCosts + transferCosts + roomCosts + activityCosts;

    const f = t.finance;
    const ccRate = f.paymentMethod === 'visa' || f.paymentMethod === 'master' ? 0.025 : f.paymentMethod === 'amex' ? 0.038 : 0;
    const ccTotal = totalCost * ccRate;
    const markupTotal = f.marginType === '%' ? totalCost * (f.margin / 100) : f.margin;
    return Math.max(0, totalCost + markupTotal + f.buffer + ccTotal - f.discount);
  };

  const filteredTrips = useMemo(() => {
    return tripsList.filter(trip => {
      const title = trip.title || trip.client?.name || 'Untitled Trip';
      const ref = trip.ref || '';
      const client = trip.client?.name || '';
      const country = trip.client?.country || '';
      const consultant = trip.consultant || '';
      const matchesSearch = 
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultant.toLowerCase().includes(searchTerm.toLowerCase());

      const tripStatus = trip.status || trip.priority || 'confirmed';
      const matchesStatus = statusFilter === 'all' || tripStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [tripsList, searchTerm, statusFilter]);

  // Aggregate Metrics
  const totalDossiers = tripsList.length;
  const confirmedTripsCount = tripsList.filter(t => (t.status === 'confirmed' || t.priority === 'confirmed')).length;
  const inTravelCount = tripsList.filter(t => t.status === 'in_travel').length;
  const totalRevenueZAR = tripsList.reduce((sum, t) => sum + calculateTripValue(t), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-br from-[#1A3326] to-[#0D1E16] text-white rounded-[28px] p-8 md:p-10 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D4AF37] text-xs font-bold tracking-widest uppercase border border-white/10">
              <Sparkles size={12} /> Operations Command Center
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight">
              Master Trip Dossiers
            </h1>
            <p className="text-gray-300 text-sm max-w-xl">
              Centralized single source of truth for all bespoke itineraries, role-specific sharing links, and real-time operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onCreateNewTrip}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#D4AF37] hover:bg-[#c59f2e] text-[#1A3326] font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <Plus size={16} /> New Trip Dossier
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Total Bookings</span>
            <span className="text-2xl md:text-3xl font-black text-white mt-1 block">{totalDossiers}</span>
            <span className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">Active in workspace</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Confirmed Tours</span>
            <span className="text-2xl md:text-3xl font-black text-emerald-400 mt-1 block">{confirmedTripsCount}</span>
            <span className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">Ready for execution</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">In Travel Today</span>
            <span className="text-2xl md:text-3xl font-black text-[#D4AF37] mt-1 block">{inTravelCount}</span>
            <span className="text-[11px] text-[#D4AF37]/80 mt-1 flex items-center gap-1">Live ground operations</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Pipeline Value</span>
            <span className="text-2xl md:text-3xl font-black text-white mt-1 block">
              R {Math.round(totalRevenueZAR).toLocaleString()}
            </span>
            <span className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">Combined retail volume</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client, reference, country, or advisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3326] focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Trips' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'quoted', label: 'Quoted' },
            { id: 'draft', label: 'Draft' },
            { id: 'in_travel', label: 'In Travel' },
            { id: 'completed', label: 'Completed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#1A3326] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Table / Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Trip Portfolio ({filteredTrips.length})</h2>
              <p className="text-xs text-gray-500">Select any trip to load it into the Operations Cockpit or launch public links.</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredTrips.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Compass size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-base">No trips found matching your filter</p>
              <p className="text-xs text-gray-400 mt-1">Try searching for a different keyword or create a new trip.</p>
            </div>
          ) : (
            filteredTrips.map(trip => {
              const tripId = trip.publishing?.tripId || trip.ref || 'VT-2026-0000';
              const isSelected = (currentTrip.publishing?.tripId === tripId) || (currentTrip.ref === trip.ref);
              const readiness = calculateTripReadiness(trip);
              const totalVal = calculateTripValue(trip);
              const status = trip.status || trip.priority || 'confirmed';

              const getStatusBadge = (s: string) => {
                switch(s.toLowerCase()) {
                  case 'confirmed':
                    return <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">Confirmed</span>;
                  case 'quoted':
                    return <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider">Quoted</span>;
                  case 'in_travel':
                    return <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wider animate-pulse">In Travel</span>;
                  case 'draft':
                    return <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-bold uppercase tracking-wider">Draft</span>;
                  default:
                    return <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-[11px] font-bold uppercase tracking-wider">{s}</span>;
                }
              };

              return (
                <div 
                  key={tripId}
                  className={`p-5 md:p-6 transition-all hover:bg-gray-50/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
                    isSelected ? 'bg-emerald-50/40 border-l-4 border-l-[#1A3326]' : ''
                  }`}
                >
                  {/* Left Info */}
                  <div className="space-y-2 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-500">{trip.ref}</span>
                      {getStatusBadge(status)}
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-md bg-[#1A3326] text-white text-[10px] font-bold">
                          Active In Workspace
                        </span>
                      )}
                    </div>
                    <h3 
                      onClick={() => onSelectTrip(tripId)}
                      className="text-lg font-bold text-gray-900 hover:text-[#1A3326] cursor-pointer transition-colors"
                    >
                      {trip.title || trip.client?.name || 'Untitled Journey'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users size={13} className="text-gray-400" /> {trip.guests?.length || 0} Guests
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar size={13} className="text-gray-400" /> {trip.client?.startDate || 'TBD'} to {trip.client?.endDate || 'TBD'}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                        <UserCheck size={13} /> {trip.consultant || 'Elena Rostova'}
                      </span>
                    </div>
                  </div>

                  {/* Readiness Progress */}
                  <div className="w-full lg:w-48 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-600">Trip Readiness</span>
                      <span className={`font-black ${readiness >= 90 ? 'text-emerald-600' : readiness >= 60 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {readiness}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          readiness >= 90 ? 'bg-emerald-600' : readiness >= 60 ? 'bg-amber-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${readiness}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 block">
                      {trip.flights.length} flights • {trip.rooms.length} stays • {trip.transfers.length} transfers
                    </span>
                  </div>

                  {/* Pricing / Revenue */}
                  <div className="space-y-0.5 text-left lg:text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Retail Value</span>
                    <span className="text-base font-black text-gray-900 block">
                      R {Math.round(totalVal).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold block">
                      Margin: {trip.finance?.margin || 20}% ({trip.finance?.marginType || '%'})
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                    <button
                      onClick={() => onSelectTrip(tripId)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isSelected 
                          ? 'bg-[#1A3326] text-white shadow-sm'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      <Briefcase size={14} /> {isSelected ? 'In Workspace' : 'Open Trip'}
                    </button>

                    {/* Quick Portal Share Buttons */}
                    <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                      <a
                        href={`${window.location.origin}${window.location.pathname}?trip=${trip.ref}&role=client`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Live Client Portal"
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 text-[11px] font-bold transition-colors shadow-xs flex items-center gap-1"
                      >
                        <Eye size={12} className="text-[#D4AF37]" /> Client
                      </a>
                      <a
                        href={`${window.location.origin}${window.location.pathname}?trip=${trip.ref}&role=agent`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Live B2B Agent Portal"
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-gray-700 hover:text-amber-900 text-[11px] font-bold transition-colors shadow-xs flex items-center gap-1"
                      >
                        <ShieldCheck size={12} className="text-amber-600" /> Agent
                      </a>
                      <a
                        href={`${window.location.origin}${window.location.pathname}?trip=${trip.ref}&role=operator`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Live Ground Ops Sheet"
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-gray-700 hover:text-slate-900 text-[11px] font-bold transition-colors shadow-xs flex items-center gap-1"
                      >
                        <ExternalLink size={12} className="text-slate-600" /> Ops
                      </a>
                    </div>

                    <button
                      onClick={() => onDuplicateTrip(tripId)}
                      title="Duplicate as Template"
                      className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
                    >
                      <Copy size={15} />
                    </button>

                    {tripsList.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${trip.title || trip.ref}"?`)) {
                            onDeleteTrip(tripId);
                          }
                        }}
                        title="Delete Trip"
                        className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors shadow-sm"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
