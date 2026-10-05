import { AppState, Guest, Room, Flight, Transfer, Activity } from '../types';

export interface ReadinessWarning {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  category: 'guests' | 'rooms' | 'transfers' | 'flights' | 'activities' | 'finance';
  actionTab?: string;
  affectedItemIds?: number[];
}

export interface ReadinessReport {
  score: number; // 0 to 100
  status: 'Ready' | 'Needs Attention' | 'Critical Gaps';
  warnings: ReadinessWarning[];
  summary: {
    totalTravellers: number;
    assignedToRooms: number;
    confirmedServices: number;
    totalServices: number;
    paymentStatus: string;
  };
}

export function calculateTripReadiness(state: AppState): ReadinessReport {
  const warnings: ReadinessWarning[] = [];
  const guests = state.guests || [];
  const totalGuests = guests.length;

  let scoreDeductions = 0;

  // 1. Guest Checks
  if (totalGuests === 0) {
    warnings.push({
      id: 'no_guests',
      severity: 'critical',
      title: 'No Travellers in Roster',
      message: 'Add at least one client or lead traveller to the itinerary manifest.',
      category: 'guests',
      actionTab: 'guests'
    });
    scoreDeductions += 30;
  }

  // Check for lead guest
  const leadGuest = guests.find(g => g.isLead);
  if (totalGuests > 0 && !leadGuest) {
    warnings.push({
      id: 'no_lead_guest',
      severity: 'warning',
      title: 'No Lead Traveller Designated',
      message: 'Designate a primary group contact for flight tickets and ground meet-and-greet.',
      category: 'guests',
      actionTab: 'guests'
    });
    scoreDeductions += 5;
  }

  // Check emergency contacts
  const missingEmergency = guests.filter(g => !g.emergencyContactPhone && !state.client.phone);
  if (missingEmergency.length > 0) {
    warnings.push({
      id: 'missing_emergency_contact',
      severity: 'info',
      title: 'Missing Emergency Contact',
      message: `${missingEmergency.length} traveller(s) do not have an emergency contact phone on file.`,
      category: 'guests',
      actionTab: 'guests',
      affectedItemIds: missingEmergency.map(g => g.id)
    });
    scoreDeductions += 3;
  }

  // 2. Room Allocations
  const allAssignedRoomGuestIds = new Set<number>();
  (state.rooms || []).forEach(r => {
    (r.guestIds || []).forEach(id => allAssignedRoomGuestIds.add(id));
  });

  const unhousedGuests = guests.filter(g => !allAssignedRoomGuestIds.has(g.id));
  if (totalGuests > 0 && unhousedGuests.length > 0) {
    warnings.push({
      id: 'unassigned_rooms',
      severity: 'critical',
      title: 'Unassigned Room Allocations',
      message: `${unhousedGuests.length} traveller(s) (${unhousedGuests.map(g => g.first).join(', ')}) are not allocated to any hotel suite or room.`,
      category: 'rooms',
      actionTab: 'rooming',
      affectedItemIds: unhousedGuests.map(g => g.id)
    });
    scoreDeductions += 20;
  }

  // 3. Service Lifecycle Statuses
  const flights = state.flights || [];
  const rooms = state.rooms || [];
  const transfers = state.transfers || [];
  const activities = state.activities || [];

  const totalServices = flights.length + rooms.length + transfers.length + activities.length;
  let confirmedServices = 0;

  flights.forEach(f => {
    const isConf = f.serviceStatus === 'confirmed' || f.status === 'Confirmed' || f.status === 'Ticketed';
    if (isConf) confirmedServices++;
    else {
      warnings.push({
        id: `flight_unconfirmed_${f.id}`,
        severity: 'warning',
        title: `Flight ${f.flightNo || 'Unassigned'} Unconfirmed`,
        message: `Flight ${f.flightNo} (${f.from} → ${f.to}) is in ${f.serviceStatus || f.status} status. Ticket issuance required.`,
        category: 'flights',
        actionTab: 'flights',
        affectedItemIds: [f.id]
      });
      scoreDeductions += 8;
    }
  });

  rooms.forEach(r => {
    const isConf = r.serviceStatus === 'confirmed' || r.status === 'Confirmed';
    if (isConf) confirmedServices++;
    else {
      warnings.push({
        id: `room_unconfirmed_${r.id}`,
        severity: 'warning',
        title: `Accommodation at ${r.hotel} Not Confirmed`,
        message: `Suite ${r.roomType} at ${r.hotel} has confirmation status: ${r.serviceStatus || r.status || 'Requested'}.`,
        category: 'rooms',
        actionTab: 'rooming',
        affectedItemIds: [r.id]
      });
      scoreDeductions += 8;
    }
  });

  transfers.forEach(t => {
    const isConf = t.serviceStatus === 'confirmed' || t.status === 'Confirmed';
    if (isConf) confirmedServices++;
    else {
      warnings.push({
        id: `transfer_unconfirmed_${t.id}`,
        severity: 'info',
        title: `Transfer (${t.type}) Pending Driver Assignment`,
        message: `Ground vehicle for ${t.from} → ${t.to} on ${t.date} needs operator confirmation.`,
        category: 'transfers',
        actionTab: 'transfers',
        affectedItemIds: [t.id]
      });
      scoreDeductions += 4;
    }
  });

  activities.forEach(a => {
    const isConf = a.serviceStatus === 'confirmed' || a.status === 'Confirmed';
    if (isConf) confirmedServices++;
    else {
      warnings.push({
        id: `activity_unconfirmed_${a.id}`,
        severity: 'info',
        title: `Experience "${a.name}" Not Confirmed`,
        message: `Activity on Day ${a.day} (${a.slot}) is currently ${a.serviceStatus || a.status}.`,
        category: 'activities',
        actionTab: 'activities',
        affectedItemIds: [a.id]
      });
      scoreDeductions += 4;
    }
  });

  // 4. Missing Airport Transfers
  const hasArrivalTransfer = transfers.some(t => t.type === 'Airport Arrival');
  const hasInboundFlight = flights.some(f => f.direction === 'Inbound');
  if (hasInboundFlight && !hasArrivalTransfer) {
    warnings.push({
      id: 'missing_arrival_transfer',
      severity: 'warning',
      title: 'Missing Airport Arrival Transfer',
      message: 'Inbound flight detected, but no airport greeting / arrival transfer has been scheduled.',
      category: 'transfers',
      actionTab: 'transfers'
    });
    scoreDeductions += 10;
  }

  // 5. Payment & Finance Checks
  const paymentStatus = state.finance?.paymentStatus || 'unpaid';
  if (paymentStatus === 'overdue') {
    warnings.push({
      id: 'payment_overdue',
      severity: 'critical',
      title: 'Client Payment Overdue',
      message: 'Trip payment status is flagged as Overdue. Re-check outstanding invoices before departure.',
      category: 'finance',
      actionTab: 'finance'
    });
    scoreDeductions += 15;
  } else if (paymentStatus === 'unpaid' && state.status === 'confirmed') {
    warnings.push({
      id: 'unpaid_deposit',
      severity: 'warning',
      title: 'Deposit Unpaid for Confirmed Booking',
      message: 'Trip is marked confirmed, but payment status is currently Unpaid.',
      category: 'finance',
      actionTab: 'finance'
    });
    scoreDeductions += 10;
  }

  // 6. Accessibility & Mobility Special Needs
  const mobilityNeeds = guests.filter(g => 
    (g.accessibilityMobility && g.accessibilityMobility.length > 0) || 
    (g.mob && g.mob.length > 0)
  );
  if (mobilityNeeds.length > 0) {
    const hasSpecialVehicleReq = transfers.some(t => t.special?.some(s => s.toLowerCase().includes('step') || s.toLowerCase().includes('wheelchair')));
    if (!hasSpecialVehicleReq) {
      warnings.push({
        id: 'mobility_vehicle_check',
        severity: 'info',
        title: 'Mobility / Step Assistance Flagged',
        message: `${mobilityNeeds.length} guest(s) (${mobilityNeeds.map(g => g.first).join(', ')}) require step or mobility assistance. Ensure transfer drivers have boarding steps.`,
        category: 'transfers',
        actionTab: 'transfers'
      });
    }
  }

  const finalScore = Math.max(0, Math.min(100, 100 - scoreDeductions));
  const readinessStatus = finalScore >= 85 ? 'Ready' : finalScore >= 60 ? 'Needs Attention' : 'Critical Gaps';

  return {
    score: finalScore,
    status: readinessStatus,
    warnings,
    summary: {
      totalTravellers: totalGuests,
      assignedToRooms: allAssignedRoomGuestIds.size,
      confirmedServices,
      totalServices,
      paymentStatus: paymentStatus.replace('_', ' ').toUpperCase()
    }
  };
}
