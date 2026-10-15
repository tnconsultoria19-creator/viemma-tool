import React, { useState } from 'react';
import { AppState, Transfer, Flight, Activity, Room } from '../types';
import { Calendar, Clock, MapPin, User, Truck, Plane, Hotel, Route, Filter, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface DailyTimelinesViewProps {
  state: AppState;
  onUpdateState: (updated: Partial<AppState>) => void;
}

export const DailyTimelinesView: React.FC<DailyTimelinesViewProps> = ({ state, onUpdateState }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'ALL' | 'TRANSFERS' | 'FLIGHTS' | 'ACTIVITIES' | 'HOTELS'>('ALL');
  const [selectedDriver, setSelectedDriver] = useState<string>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const namedGroups = state.namedGroups || [];

  const groupIdsForRoster = (travellerIds?: number[], explicitGroupIds?: string[]) => {
    if (explicitGroupIds?.length) return Array.from(new Set(explicitGroupIds));
    const ids = travellerIds || [];
    return namedGroups.filter(group => (group.memberIds || []).some(id => ids.includes(id))).map(group => group.id);
  };
  const groupNamesForIds = (groupIds: string[]) =>
    namedGroups.filter(group => groupIds.includes(group.id)).map(group => group.name);

  // Collect all dated items for the selected date or list all
  const transfers = state.transfers || [];
  const flights = state.flights || [];
  const activities = state.activities || [];
  const rooms = state.rooms || [];

  // Unified items list
  const timelineItems = [
    ...transfers.map(t => ({
      id: `trf_${t.id}`,
      type: 'TRANSFER' as const,
      time: t.time || '09:00',
      date: t.date || selectedDate,
      title: `${t.type}: ${t.from} → ${t.to}`,
      subtitle: `Meet: ${t.meet} (${t.sign})`,
      driver: t.driver,
      vehicle: t.vehicle,
      status: t.status,
      paxCount: t.paxCount,
      groupIds: groupIdsForRoster(t.paxIds),
      groupNames: groupNamesForIds(groupIdsForRoster(t.paxIds)),
      originalObj: t
    })),
    ...flights.map(f => ({
      id: `flt_${f.id}`,
      type: 'FLIGHT' as const,
      time: f.depTime || '10:00',
      date: f.date || selectedDate,
      title: `Flight ${f.airline} ${f.flightNo} (${f.from} → ${f.to})`,
      subtitle: `PNR: ${f.pnr} | Cabin: ${f.cabin}`,
      driver: 'N/A',
      vehicle: 'N/A',
      status: f.status,
      paxCount: f.paxIds?.length ?? 1,
      groupIds: groupIdsForRoster(f.paxIds),
      groupNames: groupNamesForIds(groupIdsForRoster(f.paxIds)),
      originalObj: f
    })),
    ...activities.map(a => {
      let actDate = a.date;
      if (!actDate && state.client?.startDate) {
        const d = new Date(state.client.startDate);
        d.setDate(d.getDate() + ((a.day || 1) - 1));
        actDate = d.toISOString().split('T')[0];
      }
      return {
        id: `act_${a.id}`,
        type: 'ACTIVITY' as const,
        time: a.start || a.pickup || '09:30',
        date: actDate || selectedDate,
        title: a.name,
        subtitle: `Venue: ${a.venue || a.pickupLoc || 'TBD'} | Pickup: ${a.pickup || 'TBD'}${a.endTime ? ` | Ends: ${a.endTime}` : ''} | Guide: ${a.responsiblePerson || a.guideName || 'Not assigned'} | Driver: ${a.driverName || 'Not assigned'} | Vehicle: ${a.vehicleName || 'Not assigned'}`,
        driver: a.driverName || a.guideName || a.responsiblePerson || '',
        vehicle: a.vehicleName || '',
        status: a.status,
        paxCount: a.paxIds?.length ?? state.guests.length,
        groupIds: groupIdsForRoster(a.paxIds, a.groupIds),
        groupNames: groupNamesForIds(groupIdsForRoster(a.paxIds, a.groupIds)),
        originalObj: a
      };
    }),
    ...rooms.map(r => ({
      id: `room_${r.id}`,
      type: 'HOTEL' as const,
      time: '14:00 (Check-in)',
      date: r.cin || selectedDate,
      title: `Hotel Stay: ${r.hotel}`,
      subtitle: `Room: ${r.roomType} | Basis: ${r.meal}`,
      driver: 'N/A',
      vehicle: 'N/A',
      status: r.status || 'Confirmed',
      paxCount: r.guestIds?.length ?? 2,
      groupIds: groupIdsForRoster(r.guestIds),
      groupNames: groupNamesForIds(groupIdsForRoster(r.guestIds)),
      originalObj: r
    }))
  ];

  // Filter items
  const filteredItems = timelineItems.filter(item => {
    if (selectedDate && item.date && item.date !== selectedDate) return false;
    if (filterType === 'TRANSFERS' && item.type !== 'TRANSFER') return false;
    if (filterType === 'FLIGHTS' && item.type !== 'FLIGHT') return false;
    if (filterType === 'ACTIVITIES' && item.type !== 'ACTIVITY') return false;
    if (filterType === 'HOTELS' && item.type !== 'HOTEL') return false;
    if (selectedDriver !== 'ALL' && item.driver !== selectedDriver) return false;
    if (selectedGroupId === 'UNASSIGNED' && item.groupIds.length > 0) return false;
    if (selectedGroupId !== 'ALL' && selectedGroupId !== 'UNASSIGNED' && !item.groupIds.includes(selectedGroupId)) return false;
    return true;
  }).sort((a, b) => a.time.localeCompare(b.time));

  const handleUpdateTransferStatus = (transferId: number, newStatus: Transfer['status']) => {
    const updatedTransfers = transfers.map(t => t.id === transferId ? { ...t, status: newStatus } : t);
    onUpdateState({ transfers: updatedTransfers });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Ticketed':
      case 'Completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">{status}</span>;
      case 'Pending':
      case 'Requested':
      case 'Held':
      case 'Planned':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">{status}</span>;
      case 'Postponed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">{status}</span>;
      case 'Cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 line-through">{status}</span>;
      case 'Assigned':
      case 'EN ROUTE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100">{status}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TRANSFER': return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'FLIGHT': return <Plane className="w-4 h-4 text-blue-600" />;
      case 'ACTIVITY': return <Route className="w-4 h-4 text-amber-600" />;
      case 'HOTEL': return <Hotel className="w-4 h-4 text-purple-600" />;
      default: return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* Header bar */}
      <div className="bg-white rounded-md p-5 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <Calendar size={20} />
            </div>
            <h1 className="text-xl font-bold font-sans text-[#1A3326]">Daily timeline</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">Review the day’s transfers, flights, drivers and activity times.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <Calendar size={14} className="text-gray-400 ml-1" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-md p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Transfers', 'Flights', 'Activities', 'Hotels'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterType === tab ? 'bg-[#1A3326] text-white shadow-xs' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Group:</span>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              className="p-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold focus:outline-none"
              aria-label="Filter daily timeline by traveller group"
            >
              <option value="ALL">All Groups</option>
              {namedGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
              <option value="UNASSIGNED">Unassigned</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-bold uppercase tracking-wider">Driver filter:</span>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="p-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold focus:outline-none"
          >
            <option value="ALL">All Drivers & Guides</option>
            {state.drivers?.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-md p-12 border border-gray-100 shadow-xs text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
            <Calendar size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Operations Scheduled</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">There are no transfers, flights, or activities scheduled for this date matching your filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 shrink-0 mt-0.5">
                  {getTypeIcon(item.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono text-[#1A3326] bg-emerald-50 px-2 py-0.5 rounded-md">{item.time}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">[{item.type}]</span>
                    {getStatusBadge(item.status)}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {item.groupNames.length > 0 ? item.groupNames.map(name => (
                      <span key={name} className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">{name}</span>
                    )) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-semibold">No group assigned</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-gray-600 font-medium">
                    {item.driver !== 'N/A' && (
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <User size={13} className="text-emerald-700" /> Driver/Guide: <strong className="text-gray-900">{item.driver}</strong>
                      </span>
                    )}
                    {item.vehicle !== 'N/A' && (
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <Truck size={13} className="text-emerald-700" /> Vehicle: <strong className="text-gray-900">{item.vehicle}</strong>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                      👥 Pax: <strong className="text-gray-900">{item.paxCount} guests</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Actions for Transfers */}
              {item.type === 'TRANSFER' && (
                <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                  {(['Confirmed', 'Assigned', 'EN ROUTE', 'Completed', 'Cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateTransferStatus((item.originalObj as Transfer).id, st as any)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        item.status === st ? 'bg-[#1A3326] text-white' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
