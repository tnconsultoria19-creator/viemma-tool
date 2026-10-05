import { AppState, Flight, Transfer, Room, Activity } from '../types';

export interface TimelineEvent {
  id: string;
  day: number;
  date: string; // Formatted YYYY-MM-DD
  displayDate: string; // Formatted e.g. "Mon, 20 May 2026"
  time: string; // e.g. "08:30"
  category: 'flight' | 'transfer' | 'activity' | 'accommodation';
  title: string;
  description: string;
  location?: string;
  from?: string;
  to?: string;
  paxCount?: number;
  paxNames?: string[];
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleId?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  guideId?: string;
  guideName?: string;
  guidePhone?: string;
  flightNo?: string;
  airline?: string;
  terminal?: string;
  status?: string;
  importantNotes?: string;
  isConfirmed?: boolean;
}

/**
 * Calculates a calendar date from a start date and day number (1-based)
 */
export function calculateDateForDay(startDateStr: string, day: number): { isoDate: string; displayDate: string } {
  if (!startDateStr) {
    return {
      isoDate: '',
      displayDate: `Day ${day}`
    };
  }

  try {
    const baseDate = new Date(startDateStr);
    if (isNaN(baseDate.getTime())) {
      return { isoDate: '', displayDate: `Day ${day}` };
    }

    // day 1 = baseDate, day 2 = baseDate + 1 day
    const eventTime = new Date(baseDate.getTime() + (Math.max(1, day) - 1) * 86400000);
    const isoDate = eventTime.toISOString().split('T')[0];
    const displayDate = eventTime.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return { isoDate, displayDate };
  } catch {
    return { isoDate: '', displayDate: `Day ${day}` };
  }
}

/**
 * Normalizes all trip services into a single, unified chronological timeline
 */
export function buildNormalizedTimeline(state: Partial<AppState>): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const startDate = state.client?.startDate || '';

  // 1. Flights
  (state.flights || []).forEach((f) => {
    // Determine which day this flight is on
    let day = 1;
    if (startDate && f.date) {
      const diffMs = new Date(f.date).getTime() - new Date(startDate).getTime();
      const calculatedDay = Math.floor(diffMs / 86400000) + 1;
      if (!isNaN(calculatedDay) && calculatedDay > 0) day = calculatedDay;
    }

    const { isoDate, displayDate } = f.date
      ? {
          isoDate: f.date,
          displayDate: new Date(f.date).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        }
      : calculateDateForDay(startDate, day);

    events.push({
      id: `flt_${f.id}`,
      day,
      date: isoDate,
      displayDate,
      time: f.depTime || '00:00',
      category: 'flight',
      title: `${f.airline} Flight ${f.flightNo}`,
      description: `${f.from} → ${f.to} (${f.cabin || 'Standard'}) • Arrives ${f.arrTime || 'TBD'}`,
      from: f.from,
      to: f.to,
      flightNo: f.flightNo,
      airline: f.airline,
      paxCount: f.paxIds?.length || f.qty || 1,
      status: f.status || 'Confirmed',
      importantNotes: f.notes || '',
      isConfirmed: f.status === 'Confirmed' || f.status === 'Booked' || f.status === 'Ticketed'
    });
  });

  // 2. Transfers
  (state.transfers || []).forEach((t) => {
    let day = 1;
    if (startDate && t.date) {
      const diffMs = new Date(t.date).getTime() - new Date(startDate).getTime();
      const calculatedDay = Math.floor(diffMs / 86400000) + 1;
      if (!isNaN(calculatedDay) && calculatedDay > 0) day = calculatedDay;
    }

    const { isoDate, displayDate } = t.date
      ? {
          isoDate: t.date,
          displayDate: new Date(t.date).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        }
      : calculateDateForDay(startDate, day);

    events.push({
      id: `tr_${t.id}`,
      day,
      date: isoDate,
      displayDate,
      time: t.time || '08:00',
      category: 'transfer',
      title: `${t.type}: ${t.from} to ${t.to}`,
      description: `Vehicle: ${t.vehicle || 'Luxury Fleet'} • Driver: ${t.driver || 'Assigned Chauffeur'}`,
      location: t.from,
      from: t.from,
      to: t.to,
      driverId: (t as any).driverId || undefined,
      driverName: t.driver,
      driverPhone: t.driverPhone,
      vehicleId: (t as any).vehicleId || undefined,
      vehicleModel: t.vehicle,
      vehiclePlate: (t as any).vehiclePlate || undefined,
      flightNo: t.flight,
      paxCount: t.paxCount || t.paxIds?.length || 1,
      status: t.status || 'Confirmed',
      importantNotes: t.meet ? `Meet instructions: ${t.meet}. Sign: "${t.sign || ''}"` : t.notes || '',
      isConfirmed: t.status !== 'Cancelled'
    });
  });

  // 3. Activities / Experiences
  (state.activities || []).forEach((a) => {
    const day = a.day || 1;
    const { isoDate, displayDate } = calculateDateForDay(startDate, day);

    events.push({
      id: `act_${a.id}`,
      day,
      date: isoDate,
      displayDate,
      time: a.start || (a.slot === 'Morning' ? '09:00' : a.slot === 'Afternoon' ? '14:00' : '18:00'),
      category: 'activity',
      title: a.name,
      description: a.desc || '',
      location: a.pickupLoc || a.pickup || '',
      guideId: (a as any).guideId || undefined,
      guideName: (a as any).guideName || undefined,
      guidePhone: (a as any).guidePhone || undefined,
      paxCount: a.paxIds?.length || (a.nAdult + a.nChild) || 1,
      status: a.status || 'Planned',
      importantNotes: a.notes || '',
      isConfirmed: a.status === 'Confirmed'
    });
  });

  // 4. Accommodations (Check-in & Check-out)
  (state.rooms || []).forEach((r) => {
    if (r.cin) {
      let day = 1;
      if (startDate && r.cin) {
        const diffMs = new Date(r.cin).getTime() - new Date(startDate).getTime();
        const calculatedDay = Math.floor(diffMs / 86400000) + 1;
        if (!isNaN(calculatedDay) && calculatedDay > 0) day = calculatedDay;
      }
      events.push({
        id: `room_cin_${r.id}`,
        day,
        date: r.cin,
        displayDate: new Date(r.cin).toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        time: (r as any).checkInTime || '14:00',
        category: 'accommodation',
        title: `Check-in: ${r.hotel}`,
        description: `${r.roomType} (${r.nights} nights) • Meal Basis: ${r.meal || 'Bed & Breakfast'}`,
        location: r.hotel,
        status: 'Confirmed',
        importantNotes: r.notes || '',
        isConfirmed: true
      });
    }
  });

  // Sort chronological by day, then time
  return events.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.time.localeCompare(b.time);
  });
}
