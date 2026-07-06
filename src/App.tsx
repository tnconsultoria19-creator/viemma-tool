import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Guest, Flight, Transfer, Room, Activity } from './types';
import { HomeView } from './components/HomeView';
import { AnalyticsView } from './components/AnalyticsView';
import { IntakeView } from './components/IntakeView';
import { FlightsView } from './components/FlightsView';
import { TransfersView } from './components/TransfersView';
import { RoomingView } from './components/RoomingView';
import { ActivitiesView } from './components/ActivitiesView';
import { DatabaseView } from './components/DatabaseView';
import { FinanceView } from './components/FinanceView';
import { PrintHubView } from './components/PrintHubView';
import { 
  Home, 
  TrendingUp, 
  Users, 
  Plane, 
  Car, 
  Hotel, 
  Route, 
  Coins, 
  Printer, 
  Database 
} from 'lucide-react';

const INITIAL_STATE: AppState = {
  ref: 'VT-2026-1048',
  consultant: 'Sarah Jenkins',
  priority: 'confirmed',
  source: 'direct',
  agent: { id: '', contact: '', email: '', comm: '' },
  client: {
    name: 'Harrison Expedition Group',
    email: 'info@harrisonexcursions.com',
    phone: '+1 415 555 9284',
    country: '🇺🇸 United States',
    contactMethod: 'whatsapp',
    tripType: 'multi',
    startDate: '',
    endDate: '',
    durationText: 'Select dates',
    occasion: '',
    otherOccasion: '',
    tags: ['Family']
  },
  groupConditions: {
    dietary: [],
    mobility: [],
    medical: [],
    prefs: [],
    notes: ''
  },
  guests: [],
  flights: [],
  transfers: [],
  rooms: [],
  activities: [],
  finance: {
    currency: 'ZAR',
    rates: { USD: 0.053, EUR: 0.049, BRL: 0.27, AOA: 0.045 },
    paymentMethod: 'none',
    margin: 20,
    marginType: '%',
    comm: 0,
    commType: '%',
    discount: 0,
    buffer: 0,
    bufferNotes: ''
  },
  internalNotes: ''
};

// Modernized template data matching all requirements
const SAMPLE_TEMPLATE: AppState = {
  ref: "VT-2026-9999",
  consultant: "Sarah Jenkins",
  priority: "confirmed",
  source: "agent",
  agent: { id: "safari_dreams", contact: "Emma Williams", email: "emma@safaridreams.co.uk", comm: "12%" },
  client: {
    name: "The Harrison Group",
    email: "lead@harrisonfamily.com",
    phone: "+1 415 888 2234",
    country: "🇺🇸 United States",
    contactMethod: "whatsapp",
    tripType: "multi",
    startDate: "2026-05-20",
    endDate: "2026-05-25",
    durationText: "6 Days / 5 Nights",
    occasion: "Anniversary",
    otherOccasion: "",
    tags: ["Family", "Adventure & Safari"]
  },
  groupConditions: {
    dietary: ["Vegetarian"],
    mobility: [],
    medical: [],
    prefs: ["Front of Vehicle"],
    notes: "The family prefers quiet drives and no early morning activities where possible."
  },
  guests: [
    { id: 1, first: "James", last: "Harrison", age: "Adult", country: "🇺🇸 United States", diet: [], mob: [], med: [], pref: ["Aisle Seat"], notes: "", isLead: true },
    { id: 2, first: "Sarah", last: "Harrison", age: "Adult", country: "🇺🇸 United States", diet: ["Vegetarian"], mob: [], med: [], pref: ["Window Seat"], notes: "Celebrates her 40th birthday during the trip.", isLead: false },
    { id: 3, first: "Emily", last: "Harrison", age: "Child", country: "🇺🇸 United States", diet: ["Nut Allergy"], mob: [], med: [], pref: ["Child Seat Needed"], notes: "Requires booster seat in transfers.", isLead: false },
    { id: 4, first: "Grandma", last: "Harrison", age: "Elderly", country: "🇺🇸 United States", diet: [], mob: ["Walking Difficulty"], med: ["Heart Condition"], pref: ["Front of Vehicle"], notes: "Requires wheelchair assistance at airports.", isLead: false }
  ],
  flights: [
    {
      id: 1,
      direction: "Inbound",
      airline: "Emirates",
      flightNo: "EK772",
      pnr: "XHGT7K",
      from: "JFK",
      to: "CPT",
      date: "2026-05-20",
      depTime: "08:30",
      arrTime: "14:30",
      duration: "14h",
      cabin: "Business",
      status: "Ticketed",
      paxIds: [1, 2, 3, 4],
      bagHand: 1,
      bagCheck: 2,
      bagOver: 0,
      cost: 45000,
      markup: 5000,
      qty: 4,
      notes: "VIP lounge access included.",
      stops: [
        { id: 1, airport: "DXB", arrTime: "18:00", depTime: "21:30", duration: "3h 30m", changeFlightNo: "EK773" }
      ]
    }
  ],
  transfers: [
    {
      id: 1,
      type: "Airport Arrival",
      date: "2026-05-20",
      time: "14:30",
      status: "Confirmed",
      from: "Cape Town International Airport",
      to: "The Silo Hotel (Cape Town)",
      meet: "International Arrivals Hall, Door 4",
      sign: "HARRISON GROUP",
      flight: "EK773",
      dist: "22 km",
      dur: "35 min",
      vehicle: "Toyota Quantum — 13 Seater",
      driver: "Sipho Khumalo",
      driverPhone: "+27 60 555 1234",
      paxCount: 4,
      paxIds: [1, 2, 3, 4],
      bagHand: 4,
      bagCheck: 8,
      bagOver: 0,
      seats: ["Booster Seat (4-8yr)"],
      special: ["Water & Snacks", "Air Conditioning"],
      cost: 1800,
      tolls: 50,
      parking: 100,
      notes: "Grandma needs assistance boarding.",
      waypoints: []
    }
  ],
  rooms: [
    {
      id: 1,
      hotel: "The Silo Hotel (Cape Town)",
      conf: "SLO-93842",
      pay: "Deposit Paid",
      roomType: "Deluxe",
      bed: "King",
      meal: "B&B",
      cin: "2026-05-20",
      cout: "2026-05-25",
      nights: 5,
      guestIds: [1, 2],
      rate: 8500,
      supp: 500,
      reqs: ["Sea View", "Honeymoon Setup"],
      notes: "Surprise sparkling wine in room."
    },
    {
      id: 2,
      hotel: "The Silo Hotel (Cape Town)",
      conf: "SLO-93843",
      pay: "Deposit Paid",
      roomType: "Superior",
      bed: "Twin",
      meal: "B&B",
      cin: "2026-05-20",
      cout: "2026-05-25",
      nights: 5,
      guestIds: [3, 4],
      rate: 6200,
      supp: 0,
      reqs: ["Connecting Rooms", "Ground Floor"],
      notes: "Interconnecting with Room 1."
    }
  ],
  activities: [
    {
      id: 1,
      day: 1,
      slot: "Afternoon",
      name: "Table Mountain Aerial Cableway",
      desc: "Return trip on the aerial cableway offering 360-degree views of Cape Town.",
      pickup: "15:30",
      start: "16:00",
      dur: "3 hours",
      pickupLoc: "Hotel Lobby",
      status: "Confirmed",
      conf: "TMT-9248",
      supplier: "Table Mountain Cableway",
      supPhone: "+27 21 424 8408",
      paxIds: [1, 2, 3, 4],
      pAdult: 420,
      pChild: 210,
      nAdult: 3,
      nChild: 1,
      flat: 0,
      total: 1470,
      inc: ["Entrance Fees", "Transport/Pickup"],
      backup: "City Walking Tour",
      notes: "Dress warmly, weather-dependent.",
      isFree: false
    }
  ],
  finance: {
    currency: "ZAR",
    rates: { USD: 0.053, EUR: 0.049, BRL: 0.27, AOA: 0.045 },
    paymentMethod: "none",
    margin: 25,
    marginType: "%",
    comm: 10,
    commType: "%",
    discount: 1500,
    buffer: 1000,
    bufferNotes: "Winter season fluctuation buffer"
  },
  internalNotes: "VVIP Harrison Group. Highly influential repeat clients. Sarah has a birthday on May 22."
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('viemma_workspace_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Make sure structural defaults exist
        if (parsed.client && parsed.finance) {
          setState(parsed);
        }
      } catch (e) {
        console.warn("Failed to load state from localStorage:", e);
      }
    }
  }, []);

  // Save to local storage on edit
  const updateFullState = (newVal: AppState) => {
    setState(newVal);
    localStorage.setItem('viemma_workspace_state', JSON.stringify(newVal));
  };

  const handleUpdateState = (updates: Partial<AppState>) => {
    const updated = { ...state, ...updates };
    updateFullState(updated);
  };

  const handleUpdateClient = (updates: Partial<AppState['client']>) => {
    const updated = {
      ...state,
      client: { ...state.client, ...updates }
    };
    updateFullState(updated);
  };

  const handleUpdateGroupConditions = (updates: Partial<AppState['groupConditions']>) => {
    const updated = {
      ...state,
      groupConditions: { ...state.groupConditions, ...updates }
    };
    updateFullState(updated);
  };

  const handleUpdateFinance = (updates: Partial<AppState['finance']>) => {
    const updated = {
      ...state,
      finance: { ...state.finance, ...updates }
    };
    updateFullState(updated);
  };

  // ROSTER GUEST ACTIONS
  const handleAddGuest = (g: Guest) => {
    const list = [...state.guests, g];
    handleUpdateState({ guests: list });
  };

  const handleRemoveGuest = (id: number) => {
    const list = state.guests.filter(g => g.id !== id);
    handleUpdateState({ guests: list });
  };

  const handleSetLeadGuest = (id: number) => {
    const list = state.guests.map(g => ({
      ...g,
      isLead: g.id === id
    }));
    handleUpdateState({ guests: list });
  };

  const handleUpdateGuest = (id: number, updates: Partial<Guest>) => {
    const list = state.guests.map(g => g.id === id ? { ...g, ...updates } : g);
    handleUpdateState({ guests: list });
  };

  // FLIGHT ACTIONS
  const handleAddFlight = (f: Flight) => {
    handleUpdateState({ flights: [...state.flights, f] });
  };

  const handleRemoveFlight = (id: number) => {
    handleUpdateState({ flights: state.flights.filter(f => f.id !== id) });
  };

  const handleUpdateFlight = (id: number, updates: Partial<Flight>) => {
    handleUpdateState({
      flights: state.flights.map(f => f.id === id ? { ...f, ...updates } : f)
    });
  };

  // TRANSFER ACTIONS
  const handleAddTransfer = (t: Transfer) => {
    handleUpdateState({ transfers: [...state.transfers, t] });
  };

  const handleRemoveTransfer = (id: number) => {
    handleUpdateState({ transfers: state.transfers.filter(t => t.id !== id) });
  };

  const handleUpdateTransfer = (id: number, updates: Partial<Transfer>) => {
    handleUpdateState({
      transfers: state.transfers.map(t => t.id === id ? { ...t, ...updates } : t)
    });
  };

  // ROOM ACTIONS
  const handleAddRoom = (r: Room) => {
    handleUpdateState({ rooms: [...state.rooms, r] });
  };

  const handleRemoveRoom = (id: number) => {
    handleUpdateState({ rooms: state.rooms.filter(r => r.id !== id) });
  };

  const handleUpdateRoom = (id: number, updates: Partial<Room>) => {
    handleUpdateState({
      rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
    });
  };

  // ACTIVITY ACTIONS
  const handleAddActivity = (act: Activity) => {
    handleUpdateState({ activities: [...state.activities, act] });
  };

  const handleRemoveActivity = (id: number) => {
    handleUpdateState({ activities: state.activities.filter(a => a.id !== id) });
  };

  const handleUpdateActivity = (id: number, updates: Partial<Activity>) => {
    handleUpdateState({
      activities: state.activities.map(a => a.id === id ? { ...a, ...updates } : a)
    });
  };

  // DYNAMIC FINANCIAL TOTALS (ZAR)
  const totalCost = useMemo(() => {
    const flightCosts = state.flights.reduce((sum, f) => sum + (f.cost * f.qty), 0);
    const transferCosts = state.transfers.reduce((sum, t) => sum + t.cost + t.tolls + t.parking, 0);
    const roomCosts = state.rooms.reduce((sum, r) => sum + (r.rate * r.nights) + r.supp, 0);
    const activityCosts = state.activities.reduce((sum, a) => sum + (a.isFree ? 0 : a.total), 0);
    return flightCosts + transferCosts + roomCosts + activityCosts;
  }, [state.flights, state.transfers, state.rooms, state.activities]);

  const netProfit = useMemo(() => {
    const f = state.finance;
    const markupTotal = f.marginType === '%' ? totalCost * (f.margin / 100) : f.margin;
    const ccRate = f.paymentMethod === 'visa' || f.paymentMethod === 'master' ? 0.025 : f.paymentMethod === 'amex' ? 0.038 : 0;
    const ccTotal = totalCost * ccRate;
    const commTotal = f.commType === '%' ? (totalCost + markupTotal) * (f.comm / 100) : f.comm;
    return Math.max(0, markupTotal + f.buffer + ccTotal - f.discount - commTotal);
  }, [state.finance, totalCost]);

  const handleLoadTemplate = () => {
    updateFullState(SAMPLE_TEMPLATE);
    setActiveTab('guests');
  };

  const handleNewBooking = () => {
    if (confirm("Are you sure you want to reset all workspace state to a fresh template? This will erase autosaved files.")) {
      updateFullState(INITIAL_STATE);
      setActiveTab('guests');
    }
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col font-sans"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), url('https://images.pexels.com/photos/20406699/pexels-photo-20406699.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* GLOBAL HEADER BAR */}
      <header className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-40 h-[64px] flex items-center px-4 md:px-6">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <img 
              src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXc366uzOWFLPWyEuBIMhicbjT2GajlyGrsVyeSDE68ap9hBFEamMNA78eyvIPmA-MVNbGhtCBwzKlk29IttM_jygwrCJXjmUdZt6iijoXLFzRyBcrcb_C-oH3KxcsenhczLCRl7RfOtKSy_7o02kbNgJ29iMA?key=KPDE2Lo8HhnJ3v--HqdAAw" 
              alt="Viemma Tours" 
              className="h-8 md:h-9 w-auto object-contain shrink-0" 
            />
            <div className="hidden sm:block border-l border-gray-300 h-6 mx-1"></div>
            <div className="hidden sm:block">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block leading-none">File Master</span>
              <span className="text-xs font-bold text-gray-900 leading-none mt-1 block">{state.ref || 'VT-NEW'}</span>
            </div>
          </div>

          {/* TOP TAB NAVIGATION BAR */}
          <nav className="flex gap-1.5 overflow-x-auto hide-scrollbar flex-1 justify-end">
            {[
              { id: 'home', label: 'Home', icon: <Home size={13} /> },
              { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={13} /> },
              { id: 'guests', label: 'Intake & Guests', icon: <Users size={13} /> },
              { id: 'flights', label: 'Flights', icon: <Plane size={13} /> },
              { id: 'transfers', label: 'Transfers', icon: <Car size={13} /> },
              { id: 'rooming', label: 'Rooming', icon: <Hotel size={13} /> },
              { id: 'activities', label: 'Activities', icon: <Route size={13} /> },
              { id: 'database', label: 'Presets', icon: <Database size={13} /> },
              { id: 'finance', label: 'Finance', icon: <Coins size={13} /> },
              { id: 'exporthub', label: 'Print Hub', icon: <Printer size={13} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`top-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon}
                <span className="hidden md:inline font-bold">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* CORE WORKSPACE CONTEXT FRAME */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 pb-20 relative z-10 animate-in fade-in">
        
        {activeTab === 'home' && (
          <HomeView 
            state={state} 
            onSwitchTab={setActiveTab} 
            onLoadTemplate={handleLoadTemplate}
            onNewBooking={handleNewBooking}
            totalCost={totalCost}
            netProfit={netProfit}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView 
            state={state} 
            totalCost={totalCost}
            netProfit={netProfit}
          />
        )}

        {activeTab === 'guests' && (
          <IntakeView 
            state={state} 
            onUpdateState={handleUpdateState}
            onUpdateClient={handleUpdateClient}
            onUpdateGroupConditions={handleUpdateGroupConditions}
            onAddGuest={handleAddGuest}
            onRemoveGuest={handleRemoveGuest}
            onSetLeadGuest={handleSetLeadGuest}
            onUpdateGuest={handleUpdateGuest}
          />
        )}

        {activeTab === 'flights' && (
          <FlightsView 
            state={state} 
            onUpdateState={handleUpdateState}
            onAddFlight={handleAddFlight}
            onRemoveFlight={handleRemoveFlight}
            onUpdateFlight={handleUpdateFlight}
          />
        )}

        {activeTab === 'transfers' && (
          <TransfersView 
            state={state} 
            onUpdateState={handleUpdateState}
            onAddTransfer={handleAddTransfer}
            onRemoveTransfer={handleRemoveTransfer}
            onUpdateTransfer={handleUpdateTransfer}
          />
        )}

        {activeTab === 'rooming' && (
          <RoomingView 
            state={state} 
            onUpdateState={handleUpdateState}
            onAddRoom={handleAddRoom}
            onRemoveRoom={handleRemoveRoom}
            onUpdateRoom={handleUpdateRoom}
          />
        )}

        {activeTab === 'activities' && (
          <ActivitiesView 
            state={state} 
            onUpdateState={handleUpdateState}
            onAddActivity={handleAddActivity}
            onRemoveActivity={handleRemoveActivity}
            onUpdateActivity={handleUpdateActivity}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseView />
        )}

        {activeTab === 'finance' && (
          <FinanceView 
            state={state} 
            onUpdateState={handleUpdateState}
            onUpdateFinance={handleUpdateFinance}
            totalCost={totalCost}
            netProfit={netProfit}
          />
        )}

        {activeTab === 'exporthub' && (
          <PrintHubView 
            state={state} 
            totalCost={totalCost}
            netProfit={netProfit}
          />
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="bg-white border-t border-gray-300 text-center py-4 text-[11px] text-gray-500 relative z-30">
        <p className="font-medium">Viemma Tours Southern Africa Planning Platform • Protected Operations Mode</p>
      </footer>
    </div>
  );
}
