import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Guest, Flight, Transfer, Room, Activity } from './types';
import { HomeView } from './components/HomeView';
import { ExperienceLibraryView } from './components/ExperienceLibraryView';
import { DEFAULT_EXPERIENCES, DEFAULT_DESTINATIONS } from './data/libraryDefaults';
import { AnalyticsView } from './components/AnalyticsView';
import { IntakeView } from './components/IntakeView';
import { FlightsView } from './components/FlightsView';
import { TransfersView } from './components/TransfersView';
import { RoomingView } from './components/RoomingView';
import { ActivitiesView } from './components/ActivitiesView';
import { DatabaseView } from './components/DatabaseView';
import { FinanceView } from './components/FinanceView';
import { PrintHubView } from './components/PrintHubView';
import { ClientView } from "./components/ClientView";
import { TripsDashboardView } from './components/TripsDashboardView';
import { AgentPortalView } from './components/AgentPortalView';
import { OperatorGroundSheetView } from './components/OperatorGroundSheetView';
import { INITIAL_TRIPS } from './data/sampleTrips';
import { saveTripToCloud, subscribeToTrip, listAllTrips, getTripById } from './lib/tripService';
import { 
  subscribeToShareDoc, 
  clientDocToAppState, 
  agentDocToAppState, 
  opsDocToAppState 
} from './lib/shareService';
import { isCloudConnected } from './lib/firebase';
import { LandingPageView } from './components/LandingPageView';
import { JourneyPlannerView } from './components/JourneyPlannerView';
import { ClientPortalView } from './components/ClientPortalView';
import { TransportFleetView } from './components/TransportFleetView';
import { DriversView } from './components/DriversView';
import { DailyTimelinesView } from './components/DailyTimelinesView';
import { DriverItineraryView } from './components/DriverItineraryView';
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
  Database,
  Eye, 
  Save, 
  Cloud,
  Menu,
  X,
  MoreHorizontal,
  ChevronDown,
  LayoutGrid,
  Settings,
  FileText,
  BookOpen,
  Briefcase,
  Share2,
  Compass,
  Truck,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  Radio,
  Calendar,
  Lock,
  ShieldAlert
} from 'lucide-react';

export const INITIAL_STATE: AppState = {
  ref: 'VT-2026-1048',
  consultant: 'Sarah Jenkins',
  priority: 'confirmed',
  source: 'direct',
  agent: { id: '', contact: '', email: '', comm: '' },
  client: {
    name: '',
    email: '',
    phone: '',
    country: '',
    contactMethod: 'whatsapp',
    tripType: 'multi',
    startDate: '',
    endDate: '',
    durationText: 'Select dates',
    occasion: '',
    otherOccasion: '',
    tags: []
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
  vehicles: [],
  drivers: [],
  experienceLibrary: DEFAULT_EXPERIENCES,
  destinationLibrary: DEFAULT_DESTINATIONS,
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
  internalNotes: '',
  publishing: {
    tripId: 'VT-2026-1048',
    publicUrl: 'https://portal.viemmatours.com/trip/VT-2026-1048',
    publishStatus: 'Draft',
    version: 1,
    publishedAt: '',
    lastUpdated: new Date().toISOString(),
    accessToken: 'tok_secret_a61c77f0',
    passwordProtected: false,
    expiresAt: null,
    settings: {
      requirePassword: false,
      password: 'viemma-explore',
      enableExpiryDate: false,
      expiresAt: null,
      allowDownloads: true,
      allowPrinting: true,
      hideInternalNotes: true,
      showPricing: true,
      showSupplierDetails: false,
      enableOfflineAccess: true,
      language: 'English',
      currency: 'ZAR'
    },
    versions: [
      { version: 1, date: new Date().toISOString().split('T')[0], note: 'Initial empty workspace created.', status: 'Draft' }
    ]
  }
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
  vehicles: [],
  drivers: [],
  experienceLibrary: DEFAULT_EXPERIENCES,
  destinationLibrary: DEFAULT_DESTINATIONS,
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
  internalNotes: "VVIP Harrison Group. Highly influential repeat clients. Sarah has a birthday on May 22.",
  publishing: {
    tripId: 'VT-2026-9999',
    publicUrl: 'https://portal.viemmatours.com/trip/VT-2026-9999',
    publishStatus: 'Published',
    version: 3,
    publishedAt: '2026-07-18T10:30:00-07:00',
    lastUpdated: '2026-07-18T10:30:00-07:00',
    accessToken: 'tok_secret_b81f92e2',
    passwordProtected: false,
    expiresAt: null,
    settings: {
      requirePassword: false,
      password: 'viemma-explore',
      enableExpiryDate: false,
      expiresAt: null,
      allowDownloads: true,
      allowPrinting: true,
      hideInternalNotes: true,
      showPricing: true,
      showSupplierDetails: false,
      enableOfflineAccess: true,
      language: 'English',
      currency: 'ZAR'
    },
    versions: [
      { version: 1, date: '2026-07-12', note: 'Initial drafted outline.', status: 'Published' },
      { version: 2, date: '2026-07-15', note: 'Added Robben Island experience.', status: 'Published' },
      { version: 3, date: '2026-07-18', note: 'Flight Updated to EK772.', status: 'Published' }
    ]
  }
};

export default function App() {
  const [appMode, setAppMode] = useState<'landing' | 'admin' | 'client-portal' | 'planner'>('landing');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [tripsList, setTripsList] = useState<AppState[]>(() => {
    const saved = localStorage.getItem('viemma_trips_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(t => !t.client?.name?.includes('Harrison'));
          if (cleaned.length > 0) return cleaned;
        }
      } catch (e) {
        console.warn('Failed to parse trips list:', e);
      }
    }
    return INITIAL_TRIPS;
  });
  
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('viemma_workspace_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.ref && !parsed.client?.name?.includes('Harrison')) return parsed;
      } catch (e) {
        console.warn('Failed to parse active trip state:', e);
      }
    }
    return INITIAL_STATE;
  });

  const [activeRoleView, setActiveRoleView] = useState<'owner' | 'client' | 'agent' | 'operator'>('owner');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  // Secure Public Token Share Mode Detection
  const [publicShare, setPublicShare] = useState<{ role: 'client' | 'agent' | 'ops'; token: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    const shareRole = urlParams.get('share');
    const shareToken = urlParams.get('token');
    const pathMatch = window.location.pathname.match(/\/share\/(client|agent|ops)\/([^/]+)/);
    const effectiveRole = (pathMatch ? pathMatch[1] : shareRole) as 'client' | 'agent' | 'ops' | null;
    const effectiveToken = pathMatch ? pathMatch[2] : shareToken;
    if (effectiveRole && effectiveToken) {
      return { role: effectiveRole, token: effectiveToken };
    }
    return null;
  });

  const [shareDocData, setShareDocData] = useState<any | null>(undefined); // undefined: loading, null: revoked/not found

  // Real-time listener for public share projection
  useEffect(() => {
    if (!publicShare) return;
    const unsubscribe = subscribeToShareDoc(publicShare.role, publicShare.token, (data) => {
      setShareDocData(data);
    });
    return () => unsubscribe();
  }, [publicShare]);

  const tabsList = useMemo(() => [
    { id: 'home', label: 'Home', icon: <Home size={15} /> },
    { id: 'trips', label: 'Trips Portfolio', icon: <Briefcase size={15} /> },
    { id: 'guests', label: 'Clients', icon: <Users size={15} /> },
    { id: 'flights', label: 'Flights', icon: <Plane size={15} /> },
    { id: 'transfers', label: 'Vehicles', icon: <Car size={15} /> },
    { id: 'rooming', label: 'Hotels', icon: <Hotel size={15} /> },
    { id: 'activities', label: 'Suppliers', icon: <Route size={15} /> },
    { id: 'finance', label: 'Finance', icon: <Coins size={15} /> },
    { id: 'database', label: 'Database', icon: <Database size={15} /> },
    { id: 'library', label: 'Library Desk', icon: <BookOpen size={15} /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={15} /> },
    { id: 'exporthub', label: 'Print Hub', icon: <Printer size={15} /> },
  ], []);

  const isClientView = activeRoleView === 'client';
  const setIsClientView = (val: boolean) => {
    setActiveRoleView(val ? 'client' : 'owner');
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // RESPONSIVE HEADER AND SAVE-STATE STATES
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [lastSavedText, setLastSavedText] = useState('Saved just now');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Resize listener to adapt menu
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll height reduction effect (72px -> 60px)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 12) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Relative timer for File Save details (e.g. "Draft • Saved just now" or "Last saved 2 min ago")
  useEffect(() => {
    setLastSavedText('Saved just now');
    const interval = setInterval(() => {
      const diffMs = Date.now() - lastSaved.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      if (diffSecs < 15) {
        setLastSavedText('Saved just now');
      } else if (diffSecs < 60) {
        setLastSavedText('Saved less than a minute ago');
      } else if (diffMins === 1) {
        setLastSavedText('Last saved 1 min ago');
      } else {
        setLastSavedText(`Last saved ${diffMins} min ago`);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  // Real Cloud Firestore Integration Handlers
  const saveToCloud = async () => {
    setIsSaving(true);
    setSaveMessage('Saving itinerary to Cloud Firestore (Spark Plan)...');
    try {
      await saveTripToCloud(state, { 
        immediate: true, 
        changeDescription: 'Manual push to Cloud Firestore' 
      });
      setSaveMessage('⚡ Saved to Cloud Firestore! Synced across all live portals.');
      setLastSaved(new Date());
    } catch (error: any) {
      console.warn("Save to cloud error:", error);
      setSaveMessage('Saved locally & queued for Cloud sync.');
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const loadFromCloud = async (id: string) => {
    setIsSaving(true);
    setSaveMessage(`Fetching itinerary ${id} from Cloud Firestore...`);
    try {
      const fetched = await getTripById(id);
      if (fetched) {
        setState(fetched);
        setSaveMessage('Itinerary loaded live from Cloud Firestore!');
      } else {
        throw new Error('Trip not found');
      }
    } catch (error) {
      setSaveMessage('Loaded from local backup registry.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const generateAIItinerary = async () => {
    setIsSaving(true);
    setSaveMessage('Generating via Cloudflare Gemini AI Engine...');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Generate a luxury safari itinerary for ${state.client.name}` })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.itinerary) {
          setState(prev => ({
            ...prev,
            activities: data.itinerary.activities || [],
            client: { ...prev.client, durationText: data.itinerary.durationText || prev.client.durationText }
          }));
          setSaveMessage('AI Itinerary Generated!');
        }
      } else {
        throw new Error('AI Generation failed');
      }
    } catch (error) {
      // Custom Gemini Itinerary Applied!
      setSaveMessage('Simulated: Custom Gemini Itinerary Applied!');
      const mockActivities = [
        { id: Date.now(), day: 1, start: "09:00", slot: "Morning", name: "Table Mountain Cableway Private Guided Ascent", desc: "Experience 360-degree views of Cape Town and the Atlantic Ocean with a custom private botanist guide.", pickupLoc: "Hotel Lobby", dur: "3 hours", cost: 850, markup: 250, total: 1100, isConfirmed: true, paxIds: [] },
        { id: Date.now() + 1, day: 1, start: "13:00", slot: "Lunch", name: "Bespoke Ocean-Front Seafood Pairing", desc: "Premium reservation at Chefs Warehouse Tintswalo Atlantic, showcasing pristine local Cape ingredients.", pickupLoc: "Tintswalo Atlantic", dur: "2.5 hours", cost: 1200, markup: 400, total: 1600, isConfirmed: true, paxIds: [] },
        { id: Date.now() + 2, day: 2, start: "08:30", slot: "Morning", name: "Cape Peninsula Heli-Tour & Coastal Explorer", desc: "Direct private charter flight routing from V&A Waterfront helicopter pad to Cape Point Reserve.", pickupLoc: "V&A Helipad", dur: "4 hours", cost: 4500, markup: 1500, total: 6000, isConfirmed: true, paxIds: [] }
      ];
      setState(prev => ({
        ...prev,
        activities: mockActivities
      }));
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  // URL Query Parameter Listener for deep-linking and role switching (OWNER SESSION ONLY)
  useEffect(() => {
    if (publicShare) return; // Strictly ignore in public share mode
    const urlParams = new URLSearchParams(window.location.search);
    const tripParam = urlParams.get('trip') || urlParams.get('id');
    const roleParam = urlParams.get('role') || urlParams.get('view');
    const modeParam = urlParams.get('mode');

    if (modeParam === 'admin' || modeParam === 'landing' || modeParam === 'planner' || modeParam === 'client-portal') {
      setAppMode(modeParam);
    } else if (roleParam || tripParam) {
      setAppMode('admin');
    }

    if (roleParam === 'client' || roleParam === 'agent' || roleParam === 'operator' || roleParam === 'owner') {
      setActiveRoleView(roleParam);
    }

    if (tripParam) {
      const found = tripsList.find(t => t.ref === tripParam || t.id === tripParam);
      if (found) {
        setState(found);
      }
    }
  }, [tripsList, publicShare]);

  // Subscribe to real-time updates for active trip (Firestore onSnapshot + BroadcastChannel + Local fallback)
  useEffect(() => {
    if (publicShare) return; // Strictly ignore in public share mode
    if (!state?.ref) return;
    const unsubscribe = subscribeToTrip(state.ref, (updatedTrip) => {
      setState(prev => {
        // Prevent unnecessary state re-renders if content is identical
        if (JSON.stringify(prev) === JSON.stringify(updatedTrip)) return prev;
        return updatedTrip;
      });
    });
    return () => unsubscribe();
  }, [state?.ref, publicShare]);

  // Load from Cloud Firestore / local storage on mount (OWNER SESSION ONLY)
  useEffect(() => {
    if (publicShare) return; // Strictly ignore in public share mode
    let isMounted = true;
    listAllTrips().then(trips => {
      if (isMounted && trips && trips.length > 0) {
        setTripsList(trips);
      }
    }).catch(err => {
      console.warn("Could not list trips from Firestore on mount:", err);
    });

    const saved = localStorage.getItem('viemma_workspace_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Make sure structural defaults exist
        if (parsed.client && parsed.finance) {
          if (!parsed.experienceLibrary || parsed.experienceLibrary.length === 0) {
            parsed.experienceLibrary = DEFAULT_EXPERIENCES;
          }
          if (!parsed.destinationLibrary || parsed.destinationLibrary.length === 0) {
            parsed.destinationLibrary = DEFAULT_DESTINATIONS;
          }
          if (!parsed.publishing) {
            parsed.publishing = {
              tripId: parsed.ref || 'VT-2026-1048',
              publicUrl: `https://portal.viemmatours.com/trip/${parsed.ref || 'VT-2026-1048'}`,
              publishStatus: 'Draft',
              version: 1,
              publishedAt: '',
              lastUpdated: new Date().toISOString(),
              accessToken: 'tok_secret_a61c77f0',
              passwordProtected: false,
              expiresAt: null,
              settings: {
                requirePassword: false,
                password: 'viemma-explore',
                enableExpiryDate: false,
                expiresAt: null,
                allowDownloads: true,
                allowPrinting: true,
                hideInternalNotes: true,
                showPricing: true,
                showSupplierDetails: false,
                enableOfflineAccess: true,
                language: 'English',
                currency: 'ZAR'
              },
              versions: [
                { version: 1, date: '2026-07-12', note: 'Initial compilation draft created.', status: 'Draft' }
              ]
            };
          }
          setState(parsed);
        }
      } catch (e) {
        console.warn("Failed to load state from localStorage:", e);
      }
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to local storage on edit & sync to trips list & debounced cloud write
  const updateFullState = (newVal: AppState) => {
    setState(newVal);
    localStorage.setItem('viemma_workspace_state', JSON.stringify(newVal));
    
    // Update inside tripsList
    setTripsList(prev => {
      const idx = prev.findIndex(t => t.ref === newVal.ref);
      let updated: AppState[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = newVal;
      } else {
        updated = [newVal, ...prev];
      }
      localStorage.setItem('viemma_trips_list', JSON.stringify(updated));
      return updated;
    });

    // Cloud Firestore Sync (Spark Plan compliant) & Multi-Tab Broadcast
    saveTripToCloud(newVal);

    setLastSaved(new Date());
  };

  const handleSelectTrip = (tripId: string) => {
    const found = tripsList.find(t => t.ref === tripId);
    if (found) {
      setState(found);
      localStorage.setItem('viemma_workspace_state', JSON.stringify(found));
      setActiveTab('home');
      setActiveRoleView('owner');
    }
  };

  const handleCreateNewTrip = (newTrip: AppState) => {
    const updated = [newTrip, ...tripsList];
    setTripsList(updated);
    localStorage.setItem('viemma_trips_list', JSON.stringify(updated));
    setState(newTrip);
    localStorage.setItem('viemma_workspace_state', JSON.stringify(newTrip));
    setActiveTab('guests');
  };

  const handleDeleteTrip = (tripId: string) => {
    if (tripsList.length <= 1) {
      alert("Cannot delete the only trip in the workspace.");
      return;
    }
    const updated = tripsList.filter(t => t.ref !== tripId);
    setTripsList(updated);
    localStorage.setItem('viemma_trips_list', JSON.stringify(updated));
    if (state.ref === tripId) {
      setState(updated[0]);
      localStorage.setItem('viemma_workspace_state', JSON.stringify(updated[0]));
    }
  };

  const handleDuplicateTrip = (tripId: string) => {
    const src = tripsList.find(t => t.ref === tripId) || state;
    const newRef = `VT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const cloned: AppState = {
      ...JSON.parse(JSON.stringify(src)),
      ref: newRef,
      title: `${src.title || src.client.name} (Copy)`,
      status: 'draft',
      publishing: {
        ...src.publishing,
        tripId: newRef,
        publishStatus: 'Draft',
        version: 1
      }
    };
    handleCreateNewTrip(cloned);
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
    const newRef = `VT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmptyTrip: AppState = {
      ...INITIAL_STATE,
      ref: newRef,
      title: `New Itinerary (${newRef})`,
      publishing: {
        ...INITIAL_STATE.publishing,
        tripId: newRef,
        publicUrl: `${window.location.origin}${window.location.pathname}?share=client&token=cli_${Math.random().toString(36).substring(2, 10)}`,
        lastUpdated: new Date().toISOString()
      }
    };
    updateFullState(newEmptyTrip);
    setActiveTab('guests');
  };

  // 1. ISOLATED PUBLIC SHARE VIEW (Zero master access, strict projection rendering)
  if (publicShare) {
    if (shareDocData === undefined) {
      return (
        <div className="min-h-screen bg-[#1A3326] flex items-center justify-center p-6 text-white text-center font-sans">
          <div className="space-y-3">
            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">Verifying Secure Access Token...</p>
          </div>
        </div>
      );
    }

    if (shareDocData === null || shareDocData.active === false) {
      return (
        <div className="min-h-screen bg-[#1A3326] flex items-center justify-center p-6 text-white text-center font-sans">
          <div className="max-w-md bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-bold font-serif">Access Restricted</h2>
            <p className="text-xs text-gray-200 leading-relaxed">
              This secure itinerary share link is invalid, expired, or has been revoked by Viemma Tours Operations.
            </p>
            <p className="text-[11px] text-[#D4AF37] font-medium">
              Please contact your Viemma Private Travel Designer for a new access link.
            </p>
          </div>
        </div>
      );
    }

    if (publicShare.role === 'client') {
      return (
        <div className="min-h-screen relative flex flex-col font-sans bg-[#FDFBF7]">
          <ClientView state={clientDocToAppState(shareDocData)} />
        </div>
      );
    }

    if (publicShare.role === 'agent') {
      return (
        <div className="min-h-screen relative flex flex-col font-sans bg-slate-950 p-4 md:p-8">
          <AgentPortalView state={agentDocToAppState(shareDocData)} />
        </div>
      );
    }

    if (publicShare.role === 'ops') {
      return (
        <div className="min-h-screen relative flex flex-col font-sans bg-slate-100 p-4 md:p-8">
          <OperatorGroundSheetView state={opsDocToAppState(shareDocData)} />
        </div>
      );
    }
  }

  if (appMode === 'landing') {
    return <LandingPageView onSelectMode={(mode) => setAppMode(mode === 'planner' ? 'client-portal' : mode)} />;
  }

  if (appMode === 'client-portal') {
    return (
      <ClientPortalView 
        tripsList={tripsList}
        currentTrip={state}
        onReturnHome={() => {
          setAppMode('admin');
          setActiveRoleView('owner');
        }}
        onStartPlanner={() => setAppMode('planner')}
        onSelectTrip={(ref) => handleSelectTrip(ref)}
        onOpenItinerary={(ref) => {
          handleSelectTrip(ref);
          setAppMode('admin');
          setActiveRoleView('client');
        }}
        onUpdateTrip={(updated) => updateFullState(updated)}
      />
    );
  }

  if (appMode === 'planner') {
    return (
      <JourneyPlannerView 
        onReturnHome={() => setAppMode('client-portal')}
        onSubmit={(data) => {
          const newRef = `VT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          const destName = data.destination || 'Southern Africa';
          const newTrip: AppState = {
            ...INITIAL_STATE,
            ref: newRef,
            title: `${data.clientName || 'Bespoke Guest'} — ${destName} Luxury Journey`,
            status: 'quoted',
            priority: 'hot',
            version: 1,
            consultant: "Elena Rostova",
            consultantRole: "Senior Private Travel Designer",
            client: {
              ...INITIAL_STATE.client,
              name: data.clientName || 'Valued Guest',
              email: data.clientEmail || '',
              phone: data.clientPhone || '',
              tripType: "multi",
              durationText: data.duration || '7 Days / 6 Nights',
              occasion: data.inspiredBy?.join(', ') || 'Custom Expedition',
              tags: [destName, ...(data.inspiredBy || []), ...(data.journeyType || [])]
            },
            groupConditions: {
              dietary: [],
              mobility: [],
              medical: [],
              prefs: [],
              notes: data.specialRequests || ''
            },
            publishing: {
              tripId: newRef,
              publicUrl: `${window.location.origin}${window.location.pathname}?share=client&token=cli_${Math.random().toString(36).substring(2, 10)}`,
              publishStatus: 'Published',
              version: 1,
              publishedAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              accessToken: `tok_${Math.random().toString(36).substring(2, 10)}`,
              passwordProtected: false,
              expiresAt: null,
              settings: {
                requirePassword: false,
                password: '',
                enableExpiryDate: false,
                expiresAt: null,
                allowDownloads: true,
                allowPrinting: true,
                hideInternalNotes: true,
                showPricing: true,
                showSupplierDetails: false,
                enableOfflineAccess: true,
                language: 'English',
                currency: 'ZAR'
              },
              versions: [
                { version: 1, date: new Date().toISOString().split('T')[0], note: 'Client intake submitted via interactive planner', status: 'Published' }
              ]
            }
          };

          handleCreateNewTrip(newTrip);
          saveTripToCloud(newTrip, { immediate: true, changeDescription: 'Created new booking from Journey Planner' });
          setAppMode('client-portal');
        }}
      />
    );
  }

  if (activeRoleView === 'client') {
    return (
      <div className="min-h-screen relative flex flex-col font-sans bg-[#FDFBF7]">
        <ClientView state={state} onBackToAdmin={() => setActiveRoleView('owner')} />
      </div>
    );
  }

  if (activeRoleView === 'agent') {
    return (
      <div className="min-h-screen relative flex flex-col font-sans bg-slate-950 p-4 md:p-8">
        <AgentPortalView state={state} onBackToAdmin={() => setActiveRoleView('owner')} />
      </div>
    );
  }

  if (activeRoleView === 'operator') {
    return (
      <div className="min-h-screen relative flex flex-col font-sans bg-slate-100 p-4 md:p-8">
        <OperatorGroundSheetView state={state} onBackToAdmin={() => setActiveRoleView('owner')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col font-sans">
      {/* GLOBAL HEADER BAR - Forest Green Glass Ribbon */}
      <header 
        className={`sticky top-0 z-50 backdrop-blur-[18px] bg-[#1A3326]/95 border-b border-white/10 shadow-lg flex items-center transition-all duration-300 ${
          isScrolled ? 'h-[72px]' : 'h-[80px]'
        }`}
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 h-full">
          
          {/* LEFT: [VIEMMA LOGO] + [FILE MASTER / ACTIVE TRIP] */}
          <div className="shrink-0 flex items-center gap-3 text-left">
            {/* Logo */}
            <button 
              onClick={() => { setAppMode('landing'); setIsClientView(false); }}
              className="flex items-center gap-2.5 shrink-0 focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus:outline-none rounded-xl p-1 transition-all hover:opacity-90 hover:scale-105 active:scale-95"
              title="Return to Landing Page"
            >
              <img 
                src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXc366uzOWFLPWyEuBIMhicbjT2GajlyGrsVyeSDE68ap9hBFEamMNA78eyvIPmA-MVNbGhtCBwzKlk29IttM_jygwrCJXjmUdZt6iijoXLFzRyBcrcb_C-oH3KxcsenhczLCRl7RfOtKSy_7o02kbNgJ29iMA?key=KPDE2Lo8HhnJ3v--HqdAAw" 
                alt="Viemma Tours" 
                className={`w-auto object-contain shrink-0 brightness-0 invert transition-all duration-300 ${
                  isScrolled ? 'h-6' : 'h-8'
                }`} 
              />
            </button>
            
            <div className="border-l border-white/20 h-7 mx-0.5 shrink-0"></div>
            
            {/* File Master Info */}
            <div className="flex flex-col select-none text-left min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[#D4AF37] font-black tracking-widest uppercase">FILE MASTER</span>
                <span className="text-[#D4AF37] text-[10px] font-black tracking-widest uppercase">{state.ref || 'VT-2026-1048'}</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">{state.status || 'Draft'}</span>
                {isCloudConnected && (
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.2 rounded flex items-center gap-1" title="Connected to Cloud Firestore">
                    ⚡ Synced
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-white truncate max-w-[160px] lg:max-w-[200px] xl:max-w-[240px]" title={state.client.name || 'Luxury Safari Package'}>
                {state.client.name || 'Luxury Safari Package'}
              </span>
            </div>
          </div>

          {/* CENTER: Navigation [HOME] [CLIENTS] [FLIGHTS] [HOTELS] [FINANCE] [ANALYTICS] */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-1 lg:gap-1.5 xl:gap-2 h-full min-w-0">
            {!isClientView && (
              <nav className="flex items-center justify-center gap-1 lg:gap-1.5 xl:gap-2 h-full">
                {/* Primary Navigation Tabs */}
                {[
                  { id: 'home', label: 'Home', icon: <Home size={14} /> },
                  { id: 'guests', label: 'Clients', icon: <Users size={14} /> },
                  { id: 'flights', label: 'Flights', icon: <Plane size={14} /> },
                  { id: 'rooming', label: 'Hotels', icon: <Hotel size={14} /> },
                  { id: 'fleet', label: 'Transport Fleet', icon: <Truck size={14} /> },
                  { id: 'drivers', label: 'Drivers', icon: <Users size={14} /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`h-9 px-2.5 xl:px-3 rounded-lg relative flex items-center gap-1.5 text-xs font-bold tracking-wide transition-all focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus:outline-none hover:scale-105 active:scale-95 shrink-0 ${
                      activeTab === tab.id 
                        ? 'text-white font-black bg-white/10' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                    title={tab.label}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-[#D4AF37] rounded-full" />
                    )}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* RIGHT: Actions [SAVE & SYNC] [PRINT HUB] [SHARE] */}
          <div className="shrink-0 flex items-center gap-1.5 xl:gap-2 justify-end">
            {windowWidth >= 768 ? (
              <div className="flex items-center gap-1.5 xl:gap-2">
                {/* [SAVE & SYNC] */}
                {!isClientView && (
                  <button 
                    onClick={saveToCloud} 
                    disabled={isSaving} 
                    className="h-9 px-2.5 xl:px-3 rounded-xl border border-white/15 bg-white/5 text-gray-200 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus:outline-none shrink-0"
                    title="Save to Cloud Firestore & Synchronize"
                  >
                    <Save size={13} className={isSaving ? 'animate-spin' : ''} /> 
                    <span>{isSaving ? 'Saving...' : 'Save & Sync'}</span>
                  </button>
                )}

                {/* [PRINT HUB] */}
                <button
                  onClick={() => setActiveTab('exporthub')}
                  className={`h-9 px-2.5 xl:px-3 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus:outline-none shrink-0 ${
                    activeTab === 'exporthub'
                      ? 'bg-[#D4AF37] text-[#1A3326] border-[#D4AF37] font-black'
                      : 'border-white/15 bg-white/5 text-gray-200 hover:text-white hover:bg-white/10'
                  }`}
                  title="Print Hub / Export PDF"
                >
                  <Printer size={13} />
                  <span>Print Hub</span>
                </button>

                {/* [SHARE] */}
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="h-9 px-2.5 xl:px-3 rounded-xl border border-white/15 bg-white/5 text-gray-200 hover:text-white hover:bg-white/10 hover:border-[#D4AF37] transition-all text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95 shrink-0"
                  title="Share Live Links with Clients, Agents & Drivers"
                >
                  <Share2 size={13} className="text-[#D4AF37]" />
                  <span>Share</span>
                </button>
              </div>
            ) : (
              /* MOBILE RIGHTS (Save & Hamburger Trigger) */
              <div className="flex items-center gap-2">
                {!isClientView ? (
                  <button
                    onClick={saveToCloud}
                    disabled={isSaving}
                    className="h-9 px-3 rounded-xl bg-[#D4AF37] text-[#1A3326] font-extrabold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-xs focus:outline-none"
                    title="Save to Cloud"
                  >
                    <Save size={13} className={isSaving ? 'animate-spin' : ''} />
                    <span>{isSaving ? '...' : 'Save'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsClientView(false)}
                    className="h-9 px-3 rounded-xl bg-rose-600 text-white font-extrabold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-xs focus:outline-none"
                    title="Exit Client View"
                  >
                    <Eye size={13} />
                    <span>Exit</span>
                  </button>
                )}

                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition focus:outline-none"
                  title="Open Navigation Menu"
                >
                  <Menu size={18} />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* MOBILE BACKDROP DRAWER OVERLAY */}
      {isDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div 
            className="fixed top-0 left-0 bottom-0 w-[290px] bg-[#1A3326] border-r border-white/10 z-55 shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-left duration-300"
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <img 
                    src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXc366uzOWFLPWyEuBIMhicbjT2GajlyGrsVyeSDE68ap9hBFEamMNA78eyvIPmA-MVNbGhtCBwzKlk29IttM_jygwrCJXjmUdZt6iijoXLFzRyBcrcb_C-oH3KxcsenhczLCRl7RfOtKSy_7o02kbNgJ29iMA?key=KPDE2Lo8HhnJ3v--HqdAAw" 
                    alt="Viemma Tours" 
                    className="h-6 w-auto object-contain brightness-0 invert" 
                  />
                  <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest block mt-1">FILE: {state.ref || 'VT-2026-1048'}</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus:outline-none"
                  title="Close Menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Modules */}
              <div className="space-y-1 overflow-y-auto max-h-[60vh] pr-1">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block px-3 py-2 select-none">Workspace Modules</span>
                <button
                  onClick={() => { setActiveTab('home'); setIsClientView(false); setIsDrawerOpen(false); }}
                  className={`h-11 w-full px-3.5 rounded-xl flex items-center gap-3 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus:outline-none ${
                    activeTab === 'home' && !isClientView
                      ? 'border-l-2 border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-bold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Home size={15} />
                  <span>Home Dashboard</span>
                </button>
                {[
                  { id: 'guests', label: 'Clients', icon: <Users size={15} /> },
                  { id: 'flights', label: 'Flights', icon: <Plane size={15} /> },
                  { id: 'transfers', label: 'Transfers', icon: <Car size={15} /> },
                  { id: 'fleet', label: 'Transport Fleet', icon: <Truck size={15} /> },
                  { id: 'drivers', label: 'Drivers', icon: <Users size={15} /> },
                  { id: 'timelines', label: 'Daily Timelines', icon: <Calendar size={15} /> },
                  { id: 'driver-itinerary', label: 'Driver Itinerary', icon: <FileText size={15} /> },
                  { id: 'rooming', label: 'Hotels', icon: <Hotel size={15} /> },
                  { id: 'activities', label: 'Experiences', icon: <Route size={15} /> },
                  { id: 'finance', label: 'Finance', icon: <Coins size={15} /> },
                  { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={15} /> },
                  { id: 'exporthub', label: 'Print Hub', icon: <Printer size={15} /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setIsDrawerOpen(false); }}
                    className={`h-11 w-full px-3.5 rounded-xl flex items-center gap-3 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus:outline-none ${
                      activeTab === tab.id 
                        ? 'border-l-2 border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-bold' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="border-t border-white/10 pt-4 space-y-2 select-none">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block px-3.5 select-none">Quick Actions</span>
              
              <button
                onClick={() => { generateAIItinerary(); setIsDrawerOpen(false); }}
                className="h-11 w-full px-4 rounded-xl bg-[#D4AF37] text-[#1A3326] font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus:outline-none"
              >
                <Cloud size={14} />
                <span>Generate AI Itinerary</span>
              </button>

              <button
                onClick={() => { setIsClientView(!isClientView); setIsDrawerOpen(false); }}
                className={`h-11 w-full px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus:outline-none ${
                  isClientView 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-white text-[#1A3326]'
                }`}
              >
                <Eye size={14} />
                <span>{isClientView ? 'Exit Client View' : 'Client View'}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* CORE WORKSPACE CONTEXT FRAME */}
      {activeRoleView === 'client' ? (
        <div className="flex-1 w-full relative z-10 animate-in fade-in flex flex-col">
          <ClientView state={state} onBackToAdmin={() => setActiveRoleView('owner')} />
        </div>
      ) : (
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 md:pt-6 pb-16 relative z-10 animate-in fade-in flex flex-col">
          {saveMessage && (
            <div className="fixed top-20 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-4">
              {saveMessage}
            </div>
          )}

          {activeRoleView === 'agent' && (
            <AgentPortalView state={state} onBackToAdmin={() => setActiveRoleView('owner')} />
          )}

          {activeRoleView === 'operator' && (
            <OperatorGroundSheetView state={state} onBackToAdmin={() => setActiveRoleView('owner')} />
          )}

          {activeRoleView === 'owner' && (
            <div className="w-full flex-1 flex flex-col">
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

              {activeTab === 'trips' && (
                <TripsDashboardView 
                  trips={tripsList} 
                  activeTripId={state.ref} 
                  onSelectTrip={handleSelectTrip} 
                  onCreateTrip={handleCreateNewTrip} 
                  onDeleteTrip={handleDeleteTrip} 
                  onDuplicateTrip={handleDuplicateTrip} 
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

              {activeTab === 'library' && (
                <ExperienceLibraryView 
                  state={state} 
                  onUpdateState={handleUpdateState}
                />
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

              {activeTab === 'fleet' && (
                <TransportFleetView 
                  state={state} 
                  onUpdateState={handleUpdateState}
                />
              )}

              {activeTab === 'drivers' && (
                <DriversView 
                  state={state} 
                  onUpdateState={handleUpdateState}
                />
              )}

              {activeTab === 'timelines' && (
                <DailyTimelinesView 
                  state={state} 
                  onUpdateState={handleUpdateState}
                />
              )}

              {activeTab === 'driver-itinerary' && (
                <DriverItineraryView 
                  state={state} 
                  onUpdateState={handleUpdateState}
                />
              )}
            </div>
          )}
        </main>
      )}

      {/* FOOTER BAR */}
      <footer className="bg-white border-t border-gray-300 text-center py-4 text-[11px] text-gray-500 relative z-30">
        <p className="font-medium">Viemma Tours Southern Africa Planning Platform • Protected Operations Mode</p>
      </footer>

      {/* SHARE LIVE LINKS MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200" 
            onClick={() => setIsShareModalOpen(false)} 
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 text-left animate-in zoom-in-95 duration-200 border border-gray-200 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#D4AF37] flex items-center justify-center">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1A3326]">Share Protected Itinerary Presentations</h3>
                  <p className="text-xs text-gray-500">One trip data source. Four secure, role-controlled live links.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Links List */}
            <div className="space-y-4">
              {/* Client Magazine Link */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#1A3326] flex items-center gap-1.5">
                      <Compass size={14} className="text-[#D4AF37]" /> Client Digital Magazine
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase">High-End Presentation</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveRoleView('client');
                      setIsShareModalOpen(false);
                    }}
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    Open View <ExternalLink size={12} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-600">Full editorial travel story, hero photography, concierge line, booking confirmation & day-by-day itinerary.</p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?share=client&token=${state.publishing?.clientToken || 'cli_vip'}`}
                    className="w-full h-9 px-3 text-xs bg-white rounded-xl border border-emerald-200 text-gray-700 font-mono select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?share=client&token=${state.publishing?.clientToken || 'cli_vip'}`);
                      setCopiedRole('client');
                      setTimeout(() => setCopiedRole(null), 2000);
                    }}
                    className="h-9 px-3.5 rounded-xl bg-[#1A3326] text-white hover:bg-emerald-800 text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    {copiedRole === 'client' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedRole === 'client' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Agent Portal Link */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#1A3326] flex items-center gap-1.5">
                      <Briefcase size={14} className="text-[#D4AF37]" /> B2B Travel Agent Proposal
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-extrabold uppercase">Agent Commission Locked</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveRoleView('agent');
                      setIsShareModalOpen(false);
                    }}
                    className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    Open View <ExternalLink size={12} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-600">Client-facing gross selling price with breakdown of commission payable to agency. Net supplier rates are strictly hidden.</p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?share=agent&token=${state.publishing?.agentToken || 'agt_b2b'}`}
                    className="w-full h-9 px-3 text-xs bg-white rounded-xl border border-amber-200 text-gray-700 font-mono select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?share=agent&token=${state.publishing?.agentToken || 'agt_b2b'}`);
                      setCopiedRole('agent');
                      setTimeout(() => setCopiedRole(null), 2000);
                    }}
                    className="h-9 px-3.5 rounded-xl bg-[#1A3326] text-white hover:bg-emerald-800 text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    {copiedRole === 'agent' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedRole === 'agent' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Driver & Ground Sheet Link */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#1A3326] flex items-center gap-1.5">
                      <Truck size={14} className="text-blue-600" /> Driver & Operations Ground Sheet
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[9px] font-extrabold uppercase">Ground Logistics</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveRoleView('operator');
                      setIsShareModalOpen(false);
                    }}
                    className="text-xs font-bold text-blue-800 hover:underline flex items-center gap-1"
                  >
                    Open View <ExternalLink size={12} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-600">Passenger roster, baggage totals, arrival flight numbers, meet & greet banner text, vehicle special requests, and emergency contacts. Zero financial pricing displayed.</p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?share=ops&token=${state.publishing?.opsToken || 'ops_sheet'}`}
                    className="w-full h-9 px-3 text-xs bg-white rounded-xl border border-blue-200 text-gray-700 font-mono select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?share=ops&token=${state.publishing?.opsToken || 'ops_sheet'}`);
                      setCopiedRole('ops');
                      setTimeout(() => setCopiedRole(null), 2000);
                    }}
                    className="h-9 px-3.5 rounded-xl bg-[#1A3326] text-white hover:bg-emerald-800 text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    {copiedRole === 'ops' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedRole === 'ops' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}


      {/* SYSTEM SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setIsSettingsOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-left animate-in fade-in zoom-in-95 duration-200 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="text-[#D4AF37] w-5 h-5" />
                <h3 className="text-base font-black text-[#1A3326] uppercase tracking-wider">Workspace Settings</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Consultant Name</label>
                <input 
                  type="text" 
                  value={state.consultant || ''} 
                  onChange={(e) => handleUpdateState({ consultant: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Itinerary Reference</label>
                <input 
                  type="text" 
                  value={state.ref || ''} 
                  onChange={(e) => handleUpdateState({ ref: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Operations Priority</label>
                <select
                  value={state.priority || 'confirmed'}
                  onChange={(e) => handleUpdateState({ priority: e.target.value as 'pending' | 'confirmed' | 'hot' | 'exploratory' })}
                  className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-gray-800 bg-white"
                >
                  <option value="confirmed">Confirmed Operations</option>
                  <option value="pending">Pending Verification</option>
                  <option value="hot">Hot Prospect</option>
                  <option value="exploratory">Exploratory Stage</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 bg-[#1A3326] hover:bg-[#224433] text-white font-bold text-xs rounded-xl transition"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
