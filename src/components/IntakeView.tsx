import React, { useState, useEffect } from 'react';
import { AppState, Guest, GroupManagement, TripStatus, AttachmentItem } from '../types';
import { AttachmentManager } from './AttachmentManager';
import { InfoTooltip } from './InfoTooltip';
import { COUNTRIES, DB_DEFAULT } from '../dbDefaults';
import { 
  Users, 
  User, 
  Calendar, 
  Plus, 
  Crown, 
  Briefcase, 
  Sliders, 
  X, 
  Phone, 
  Mail, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown,
  Edit2, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Trash2,
  Plane,
  Hotel,
  Car,
  Check,
  Compass,
  ShieldAlert,
  FileText,
  CheckCircle,
  Clock,
  ShieldCheck
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
  onOpenAIImport?: () => void;
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
  onNavigateTab,
  onOpenAIImport
}) => {
  // Modal State for Fast Traveller Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGuest, setModalGuest] = useState<Partial<Guest>>({});
  const [showAdvancedGuestDetails, setShowAdvancedGuestDetails] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'audit' | 'dietary' | 'accessibility' | 'preferences' | 'documents'> ('details');
  const [modalCountrySearch, setModalCountrySearch] = useState('');
  const [showModalCountryDD, setShowModalCountryDD] = useState(false);

  // Group Hierarchy & Roster View Mode
  const [viewMode, setViewMode] = useState<'both' | 'hierarchy' | 'cards'>('both');

  // Change Lead Person Dialog
  const [showChangeLeadModal, setShowChangeLeadModal] = useState(false);

  // Safe Removal Confirmation Modal
  const [guestToRemove, setGuestToRemove] = useState<Guest | null>(null);

  // Quick Add State (Quantity controls for Adults, Elderly, Children, Infants)
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [qaAdults, setQaAdults] = useState<number>(0);
  const [qaElderly, setQaElderly] = useState<number>(0);
  const [qaChildren, setQaChildren] = useState<number>(0);
  const [qaInfants, setQaInfants] = useState<number>(0);
  const [qaError, setQaError] = useState<string>('');

  // Group Name inline edit state
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState(state.client.name || '');

  // Secondary Quick Presets dropdown toggle
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

  // Optional Group Setup Collapsible Accordion (default false - never mandatory!)
  const [showOptionalGroupSetup, setShowOptionalGroupSetup] = useState(false);

  // Duration manual edit mode
  const [isEditingDuration, setIsEditingDuration] = useState(Boolean(state.client.isCustomDuration));
  const [customDays, setCustomDays] = useState<number>(state.client.customDays || 1);
  const [customNights, setCustomNights] = useState<number>(state.client.customNights || 1);

  // Group management fallback
  const groupMgmt: GroupManagement = state.groupManagement || {
    groupType: 'Families',
    sharingPreferences: '',
    requiresPrivateRoomIds: [],
    staffIds: [],
    notes: ''
  };

  const handleUpdateGroupMgmt = (updates: Partial<GroupManagement>) => {
    onUpdateState({
      groupManagement: {
        ...groupMgmt,
        ...updates
      }
    });
  };

  // Sync group name input if state changes from outside
  useEffect(() => {
    setGroupNameInput(state.client.name || '');
  }, [state.client.name]);

  // Derived Traveller Demographics (Single Source of Truth)
  const totalTravellers = state.guests.length;
  const leadGuest = state.guests.find(g => g.isLead) || state.guests[0];
  const adultsCount = state.guests.filter(g => g.age === 'Adult' || g.age === 'Elderly' || !g.age).length;
  const teensCount = state.guests.filter(g => g.age === 'Teen').length;
  const childrenCount = state.guests.filter(g => g.age === 'Child').length;
  const infantsCount = state.guests.filter(g => g.age === 'Infant').length;

  // Auto-suggested Group Name
  const defaultSuggestedName = leadGuest 
    ? `${leadGuest.first} ${leadGuest.last} Party` 
    : 'Bespoke Safari Party';

  // Date Calculation & Duration Logic
  const hasDates = Boolean(state.client.startDate && state.client.endDate);
  const isDateInverted = hasDates && new Date(state.client.endDate) <= new Date(state.client.startDate);

  const calculateAutoDuration = (start: string, end: string) => {
    if (!start || !end) return { days: 0, nights: 0, text: 'Select travel dates' };
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (d2 <= d1) return { days: 0, nights: 0, text: 'Departure must be after arrival' };
    const nights = Math.round((d2.getTime() - d1.getTime()) / 86400000);
    const days = nights + 1;
    return { days, nights, text: `${days} Days / ${nights} Night${nights !== 1 ? 's' : ''}` };
  };

  const handleDateChange = (field: 'startDate' | 'endDate', val: string) => {
    const start = field === 'startDate' ? val : state.client.startDate;
    const end = field === 'endDate' ? val : state.client.endDate;
    
    // If not in custom duration mode, calculate automatically
    if (!state.client.isCustomDuration) {
      const auto = calculateAutoDuration(start, end);
      onUpdateClient({
        [field]: val,
        durationText: auto.text
      });
    } else {
      onUpdateClient({ [field]: val });
    }
  };

  const handleApplyCustomDuration = () => {
    const days = Math.max(1, customDays);
    const nights = Math.max(0, customNights);
    onUpdateClient({
      isCustomDuration: true,
      customDays: days,
      customNights: nights,
      durationText: `${days} Days / ${nights} Night${nights !== 1 ? 's' : ''} (Custom)`
    });
    setIsEditingDuration(false);
  };

  const handleRevertToAutoDuration = () => {
    const auto = calculateAutoDuration(state.client.startDate, state.client.endDate);
    onUpdateClient({
      isCustomDuration: false,
      customDays: undefined,
      customNights: undefined,
      durationText: auto.text
    });
    setIsEditingDuration(false);
  };

  // Agent Selection Helper
  const handleAgentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const selectedAgent = DB_DEFAULT.agents.find(a => a.id === val);

    onUpdateState({
      agent: {
        id: val,
        agencyName: selectedAgent?.name || '',
        contact: selectedAgent?.contact || '',
        email: selectedAgent?.email || '',
        comm: selectedAgent?.comm || ''
      }
    });
  };

  // Custom Requirements Form Input States
  const [customFoodText, setCustomFoodText] = useState('');
  const [customFoodCategory, setCustomFoodCategory] = useState<'allergy' | 'preference'>('allergy');
  const [customAccessText, setCustomAccessText] = useState('');
  const [customAccomText, setCustomAccomText] = useState('');

  // Fast Traveller Modal Handlers
  const handleOpenAddGuest = () => {
    setModalGuest({
      first: '',
      last: '',
      preferredName: '',
      nationality: state.client.country || '',
      country: state.client.country || '',
      age: 'Adult',
      relationshipToLead: state.guests.length === 0 ? 'Primary Contact' : 'Family Member',
      dob: '',
      passportNo: '',
      passportExpiry: '',
      individualEmail: '',
      individualPhone: '',
      languagesSpoken: ['English'],
      isLead: state.guests.length === 0, // Defaults to lead if first traveller!
      notes: '',
      customFoodRequirements: [],
      customAccessibilityRequirements: [],
      customAccommodationRequirements: [],
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
    setShowAdvancedGuestDetails(false);
    setModalTab('details');
    setModalOpen(true);
  };

  // Add Traveller directly from Lead (Section 3.2 Requirement)
  const handleOpenAddGuestFromLead = () => {
    const lead = state.guests.find(g => g.isLead) || state.guests[0];
    setModalGuest({
      first: '',
      last: lead ? lead.last : '',
      preferredName: '',
      nationality: lead?.nationality || state.client.country || '',
      country: lead?.country || state.client.country || '',
      age: 'Adult',
      relationshipToLead: 'Spouse or partner',
      dob: '',
      passportNo: '',
      passportExpiry: '',
      individualEmail: '',
      individualPhone: '',
      emergencyContactName: lead ? `${lead.first} ${lead.last}` : '',
      emergencyContactPhone: state.client.phone || lead?.emergencyContactPhone || '',
      emergencyContactRelation: 'Lead Contact',
      languagesSpoken: lead?.languagesSpoken || ['English'],
      isLead: false,
      notes: '',
      customFoodRequirements: [],
      customAccessibilityRequirements: [],
      customAccommodationRequirements: [],
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
    setModalCountrySearch(lead?.nationality || state.client.country || '');
    setShowAdvancedGuestDetails(true);
    setModalTab('details');
    setModalOpen(true);
  };

  const handleOpenEditGuest = (g: Guest, tab: 'details' | 'audit' = 'details') => {
    setModalGuest({ ...g });
    setModalCountrySearch(g.nationality || g.country || '');
    setShowAdvancedGuestDetails(tab !== 'details' || Boolean(g.isProvisional));
    setModalTab(tab);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalGuest({});
    setShowAdvancedGuestDetails(false);
    setCustomFoodText('');
    setCustomAccessText('');
    setCustomAccomText('');
  };

  const toggleModalTag = (field: keyof Guest, val: string) => {
    const list = Array.isArray(modalGuest[field]) ? [...(modalGuest[field] as string[])] : [];
    const updated = list.includes(val) ? list.filter(x => x !== val) : [...list, val];
    setModalGuest({ ...modalGuest, [field]: updated });
  };

  const handleAddCustomFoodReq = () => {
    if (!customFoodText.trim()) return;
    const current = modalGuest.customFoodRequirements || [];
    const newItem = {
      id: `food_${Date.now()}`,
      name: customFoodText.trim(),
      type: customFoodCategory
    };
    setModalGuest({
      ...modalGuest,
      customFoodRequirements: [...current, newItem]
    });
    setCustomFoodText('');
  };

  const handleRemoveCustomFoodReq = (id: string) => {
    const current = modalGuest.customFoodRequirements || [];
    setModalGuest({
      ...modalGuest,
      customFoodRequirements: current.filter(x => x.id !== id)
    });
  };

  const handleAddCustomAccessReq = () => {
    if (!customAccessText.trim()) return;
    const current = modalGuest.customAccessibilityRequirements || [];
    const newItem = {
      id: `access_${Date.now()}`,
      name: customAccessText.trim(),
      type: 'mobility' as const
    };
    setModalGuest({
      ...modalGuest,
      customAccessibilityRequirements: [...current, newItem]
    });
    setCustomAccessText('');
  };

  const handleRemoveCustomAccessReq = (id: string) => {
    const current = modalGuest.customAccessibilityRequirements || [];
    setModalGuest({
      ...modalGuest,
      customAccessibilityRequirements: current.filter(x => x.id !== id)
    });
  };

  const handleAddCustomAccomReq = () => {
    if (!customAccomText.trim()) return;
    const current = modalGuest.customAccommodationRequirements || [];
    const newItem = {
      id: `accom_${Date.now()}`,
      name: customAccomText.trim()
    };
    setModalGuest({
      ...modalGuest,
      customAccommodationRequirements: [...current, newItem]
    });
    setCustomAccomText('');
  };

  const handleRemoveCustomAccomReq = (id: string) => {
    const current = modalGuest.customAccommodationRequirements || [];
    setModalGuest({
      ...modalGuest,
      customAccommodationRequirements: current.filter(x => x.id !== id)
    });
  };

  const handleSaveModalGuest = (keepOpen = false) => {
    const firstName = modalGuest.first?.trim() || modalGuest.age || 'Adult';
    const lastName = modalGuest.last?.trim() || 'Traveller';

    // Lead contact check
    const isMarkedLead = modalGuest.isLead || state.guests.length === 0;

    // Check if provisional status should be lifted when a real name is entered
    const isNamed = firstName !== 'Adult' && firstName !== 'Senior' && firstName !== 'Child' && firstName !== 'Infant' && !firstName.match(/^(Adult|Senior|Child|Infant)\s+\d+$/i);
    const finalProvisional = isNamed ? Boolean(modalGuest.isProvisional) : (modalGuest.isProvisional ?? true);

    const savedGuest: Guest = {
      id: modalGuest.id || Date.now(),
      first: firstName,
      last: lastName,
      preferredName: modalGuest.preferredName?.trim() || `${firstName} ${lastName}`,
      nationality: modalCountrySearch || modalGuest.nationality || state.client.country || '🇿🇦 South Africa',
      country: modalCountrySearch || modalGuest.country || state.client.country || '🇿🇦 South Africa',
      age: modalGuest.age || 'Adult',
      exactAge: modalGuest.exactAge,
      dob: modalGuest.dob || '',
      passportNo: (modalGuest.passportNo || '').trim().toUpperCase(),
      passportExpiry: modalGuest.passportExpiry || '',
      relationshipToLead: modalGuest.relationshipToLead || (isMarkedLead ? 'Primary Contact' : 'Family Member'),
      individualEmail: (modalGuest.individualEmail || '').trim(),
      individualPhone: (modalGuest.individualPhone || '').trim(),
      languagesSpoken: modalGuest.languagesSpoken || ['English'],
      isLead: isMarkedLead,
      isProvisional: finalProvisional,
      provisionalLabel: finalProvisional ? `${firstName} ${lastName} (Provisional)` : undefined,
      notes: modalGuest.notes || '',
      customFoodRequirements: modalGuest.customFoodRequirements || [],
      customAccessibilityRequirements: modalGuest.customAccessibilityRequirements || [],
      customAccommodationRequirements: modalGuest.customAccommodationRequirements || [],
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
      attachments: modalGuest.attachments || [],
      emergencyContactName: modalGuest.emergencyContactName,
      emergencyContactPhone: modalGuest.emergencyContactPhone,
      emergencyContactRelation: modalGuest.emergencyContactRelation,
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
      ]
    };

    // Single Lead Rule: if newly saved guest is marked as lead, unmark all other guests
    let updatedRoster: Guest[];
    if (modalGuest.id) {
      updatedRoster = state.guests.map(g => {
        if (g.id === savedGuest.id) return savedGuest;
        if (isMarkedLead) return { ...g, isLead: false };
        return g;
      });
    } else {
      const current = isMarkedLead 
        ? state.guests.map(g => ({ ...g, isLead: false })) 
        : state.guests;
      updatedRoster = [...current, savedGuest];
    }

    onUpdateState({ guests: updatedRoster });

    // Sync group contact details when lead contact changes or is created without destroying other travellers
    if (isMarkedLead) {
      onUpdateClient({
        name: state.client.name.trim() ? state.client.name : `${savedGuest.first} ${savedGuest.last} Party`,
        email: savedGuest.individualEmail || state.client.email,
        phone: savedGuest.individualPhone || state.client.phone,
        country: savedGuest.nationality || state.client.country
      });
    }

    if (keepOpen) {
      // Pre-populate next traveller with group defaults for consecutive entry without closing form
      const lead = isMarkedLead ? savedGuest : state.guests.find(g => g.isLead) || savedGuest;
      setModalGuest({
        first: '',
        last: lead.last,
        preferredName: '',
        nationality: lead.nationality || state.client.country || '',
        country: lead.country || state.client.country || '',
        age: 'Adult',
        relationshipToLead: 'Family Member',
        languagesSpoken: lead.languagesSpoken || ['English'],
        isLead: false,
        isProvisional: false,
        emergencyContactName: `${lead.first} ${lead.last}`,
        emergencyContactPhone: lead.individualPhone || state.client.phone || '',
        emergencyContactRelation: 'Lead Contact',
        notes: ''
      });
      setModalCountrySearch(lead.nationality || state.client.country || '');
    } else {
      closeModal();
    }
  };

  const handleSafeRemovePrompt = (g: Guest) => {
    const assignedFlights = state.flights.filter(f => f.paxIds?.includes(g.id));
    const assignedTransfers = state.transfers.filter(t => t.paxIds?.includes(g.id));
    const assignedRooms = state.rooms.filter(r => r.guestIds?.includes(g.id) || r.allocatedRooms?.some(ar => ar.guestIds?.includes(g.id)));
    const assignedActivities = state.activities.filter(a => a.paxIds?.includes(g.id));

    const totalAssignments = assignedFlights.length + assignedTransfers.length + assignedRooms.length + assignedActivities.length;

    if (totalAssignments > 0 || g.isLead) {
      setGuestToRemove(g);
    } else {
      onRemoveGuest(g.id);
    }
  };

  // Option 1: Quick Add (Quantity Controls) Submit Handler
  const handleQuickAddSubmit = () => {
    const totalNew = qaAdults + qaElderly + qaChildren + qaInfants;
    if (totalNew <= 0) {
      setQaError('Please specify at least one quantity for Adults, Seniors, Children or Infants.');
      return;
    }
    setQaError('');

    const lead = state.guests.find(g => g.isLead) || state.guests[0];
    const leadId = lead?.id;
    const currentList = [...state.guests];
    let newIdBase = Date.now();

    const createProvisionalBatch = (count: number, ageCategory: 'Adult' | 'Elderly' | 'Child' | 'Infant', baseLabel: string) => {
      const existingCount = currentList.filter(g => g.age === ageCategory).length;
      for (let i = 1; i <= count; i++) {
        const num = existingCount + i;
        const pGuest: Guest = {
          id: newIdBase++,
          first: baseLabel,
          last: `${num}`,
          preferredName: `${baseLabel} ${num}`,
          nationality: lead?.nationality || state.client.country || '🇿🇦 South Africa',
          country: lead?.country || state.client.country || '🇿🇦 South Africa',
          age: ageCategory,
          isLead: currentList.length === 0 && i === 1,
          isProvisional: true,
          provisionalLabel: `${baseLabel} ${num} (Provisional)`,
          leadContactId: leadId,
          relationshipToLead: lead ? 'Family Member' : 'Primary Contact',
          languagesSpoken: lead?.languagesSpoken || ['English'],
          notes: 'Provisional traveller added via Quick Add. Details pending.',
          customFoodRequirements: [],
          customAccessibilityRequirements: [],
          customAccommodationRequirements: [],
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
          preferencesInterests: [],
          diet: [],
          mob: [],
          med: [],
          pref: []
        };
        currentList.push(pGuest);
      }
    };

    if (qaAdults > 0) createProvisionalBatch(qaAdults, 'Adult', 'Adult');
    if (qaElderly > 0) createProvisionalBatch(qaElderly, 'Elderly', 'Senior');
    if (qaChildren > 0) createProvisionalBatch(qaChildren, 'Child', 'Child');
    if (qaInfants > 0) createProvisionalBatch(qaInfants, 'Infant', 'Infant');

    onUpdateState({ guests: currentList });
    setQuickAddOpen(false);
    setQaAdults(0);
    setQaElderly(0);
    setQaChildren(0);
    setQaInfants(0);
  };

  // Quick Preset Templates (Secondary option)
  const handleApplyPreset = (type: 'couple' | 'family' | 'solo' | 'group8') => {
    setShowPresetsMenu(false);
    const presets: Record<string, Guest[]> = {
      couple: [
        { 
          id: 1, first: 'Arthur', last: 'Pendelton', age: 'Adult', nationality: '🇬🇧 United Kingdom', country: '🇬🇧 United Kingdom', isLead: true, notes: 'Lead traveller', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['King Bed', 'Quiet Room'], preferencesTransport: ['Front Seat'], preferencesInterests: ['Wine', 'Wellness']
        },
        { 
          id: 2, first: 'Guinevere', last: 'Pendelton', age: 'Adult', nationality: '🇬🇧 United Kingdom', country: '🇬🇧 United Kingdom', isLead: false, notes: 'Anniversary celebration', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: ['Vegetarian'], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['King Bed', 'Garden View'], preferencesTransport: ['Window Seat'], preferencesInterests: ['Wildlife', 'Photography']
        }
      ],
      family: [
        { 
          id: 1, first: 'Michael', last: 'Vance', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: true, notes: 'Lead contact', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['King Bed'], preferencesTransport: ['Air Conditioning'], preferencesInterests: ['Wildlife']
        },
        { 
          id: 2, first: 'Sarah', last: 'Vance', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: ['Gluten Free'], dietaryPreferences: [],
          preferencesAccommodation: ['King Bed'], preferencesTransport: ['Extra Leg Room'], preferencesInterests: ['Wellness']
        },
        { 
          id: 3, first: 'Chloe', last: 'Vance', age: 'Teen', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['Twin Beds'], preferencesTransport: ['Wi-Fi'], preferencesInterests: ['Adventure']
        },
        { 
          id: 4, first: 'Toby', last: 'Vance', age: 'Child', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: ['Child Meals'],
          preferencesAccommodation: ['Twin Beds'], preferencesTransport: ['Child Seat Required'], preferencesInterests: ['Wildlife']
        }
      ],
      solo: [
        { 
          id: 1, first: 'Helena', last: 'Rostova', age: 'Adult', nationality: '🇨🇦 Canada', country: '🇨🇦 Canada', isLead: true, notes: 'Private custom tour', languagesSpoken: ['English'],
          accessibilityMobility: [], accessibilityVision: [], accessibilityHearing: [], medicalOperationalNotes: '',
          dietaryReligious: [], dietaryLifestyle: [], dietaryMedical: [], dietaryPreferences: [],
          preferencesAccommodation: ['Quiet Room', 'High Floor'], preferencesTransport: ['Window Seat'], preferencesInterests: ['Photography', 'Bird Watching']
        }
      ],
      group8: [
        { id: 1, first: 'John', last: 'Smith', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: true, notes: '', languagesSpoken: ['English'] },
        { id: 2, first: 'Jane', last: 'Smith', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 3, first: 'Robert', last: 'Jones', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 4, first: 'Alice', last: 'Jones', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 5, first: 'David', last: 'Miller', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 6, first: 'Emily', last: 'Miller', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 7, first: 'James', last: 'Davis', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] },
        { id: 8, first: 'Mary', last: 'Davis', age: 'Adult', nationality: '🇺🇸 United States', country: '🇺🇸 United States', isLead: false, notes: '', languagesSpoken: ['English'] }
      ]
    };

    if (presets[type]) {
      onUpdateState({ guests: presets[type] });
      if (!state.client.name.trim() && presets[type][0]) {
        onUpdateClient({ 
          name: `${presets[type][0].first} ${presets[type][0].last} Party`,
          country: presets[type][0].nationality || presets[type][0].country
        });
      }
    }
  };

  const filteredModalCountries = modalCountrySearch.trim()
    ? COUNTRIES.filter(c => c.substring(4).toLowerCase().includes(modalCountrySearch.toLowerCase().trim())).slice(0, 8)
    : [];

  // Context-Aware Checklist Logic (Distinguishes Complete, Not Configured, and Required/Missing)
  const isAgentSource = state.source === 'agent';
  const hasAgentSelected = isAgentSource ? Boolean(state.agent?.id) : true;
  const isMultiDay = state.client.tripType === 'multi';
  const hasRooms = state.rooms.length > 0;
  const hasFlights = state.flights.length > 0;
  const hasExperiences = state.activities.length > 0;
  const hasTransfers = state.transfers.length > 0;

  return (
    <div className="space-y-5 max-w-[1380px] mx-auto pb-12 text-slate-900">
      
      {/* 1. PRIMARY SECTION (TOP VISUAL HIERARCHY): WHO IS TRAVELLING? */}
      <section className="bg-white rounded-md border border-slate-200 p-5 md:p-6 space-y-5">
        
        {/* Top Header Row with Clear Question & Primary + Add Traveller Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-[#D4AF37]">
              <Users size={14} className="text-[#D4AF37]" />
              <span>WHO IS TRAVELLING?</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#10233F] font-sans">
                {totalTravellers} {totalTravellers === 1 ? 'Traveller' : 'Travellers'}
              </h1>

              {totalTravellers > 0 && (
                <span className="text-xs font-semibold text-gray-500">
                  {adultsCount} Adult{adultsCount !== 1 ? 's' : ''}
                  {teensCount > 0 && ` • ${teensCount} Teen${teensCount !== 1 ? 's' : ''}`}
                  {childrenCount > 0 && ` • ${childrenCount} Child${childrenCount !== 1 ? 'ren' : ''}`}
                  {infantsCount > 0 && ` • ${infantsCount} Infant${infantsCount !== 1 ? 's' : ''}`}
                </span>
              )}
            </div>
            
            <p className="text-xs text-gray-500">
              The traveller roster is the single source of truth for tour party size, rooming allocations, and vouchers.
            </p>
          </div>

          {/* Primary Prominent Action: ADD TRAVELLER & QUICK ADD */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddGuest}
              className="px-4 py-2.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.6} />
              <span>Add traveller</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="px-3.5 py-2.5 rounded-md bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-medium transition flex items-center gap-2 cursor-pointer"
              title="Quick Add travellers by quantities (Adults, Elderly, Children, Infants)"
            >
              <Users size={16} className="text-amber-700" />
              <span>Add by number</span>
            </button>



            {/* Secondary Preset Templates (not competing) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresetsMenu(!showPresetsMenu)}
                className="px-3.5 py-2.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition"
                title="Populate test party presets"
              >
                Quick Presets
              </button>

              {showPresetsMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in">
                  <span className="text-[10px] font-bold uppercase text-gray-400 px-2 py-1 block">Populate Party</span>
                  <button type="button" onClick={() => handleApplyPreset('couple')} className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-gray-100 font-medium text-gray-700">Couple (2 Adults)</button>
                  <button type="button" onClick={() => handleApplyPreset('family')} className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-gray-100 font-medium text-gray-700">Family (2A + 2C)</button>
                  <button type="button" onClick={() => handleApplyPreset('solo')} className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-gray-100 font-medium text-gray-700">Solo Traveller</button>
                  <button type="button" onClick={() => handleApplyPreset('group8')} className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-gray-100 font-medium text-gray-700">Group of 8</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TRAVELLER ROSTER (Dominant visual content on first screen!) */}
        {totalTravellers === 0 ? (
          <div className="text-center py-10 px-4 bg-white border border-slate-200 rounded-md space-y-3">
            <div className="text-slate-500 flex items-center justify-center mx-auto">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">No travellers registered yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-0.5">
                Click <strong className="text-emerald-700">+ Add Traveller</strong> above to begin building this booking.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* GROUP HIERARCHY & STRUCTURE PANEL (MASTER DIRECTIVE SECTION 2.B) */}
            <div className="bg-white border border-slate-200 rounded-md p-4 md:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-600">
                      Trip {state.ref || 'VT-2026-001'}
                    </span>
                    <span className="text-sm text-slate-600">
                      Traveller roster
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-900 mt-1 flex flex-wrap items-center gap-2">
                    <span>Lead traveller:</span>
                    <span>{leadGuest ? `${leadGuest.first} ${leadGuest.last}` : (state.client.name || 'Not selected')}</span>
                    {leadGuest?.isProvisional && <span className="text-xs font-normal text-amber-800">Name to be confirmed</span>}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {state.guests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowChangeLeadModal(true)}
                      className="px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium transition flex items-center gap-1.5 cursor-pointer"
                      title="Change the group lead person safely while preserving all other travellers"
                    >
                      <Crown size={14} className="text-amber-600" />
                      <span>Change Lead Person</span>
                    </button>
                  )}

                  {/* View Mode Switcher */}
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <button
                      type="button"
                      onClick={() => setViewMode('both')}
                      className={`px-2 py-1 rounded-md transition ${viewMode === 'both' ? 'bg-[#1A3326] text-white' : 'hover:bg-gray-100'}`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('hierarchy')}
                      className={`px-2 py-1 rounded-md transition ${viewMode === 'hierarchy' ? 'bg-[#1A3326] text-white' : 'hover:bg-gray-100'}`}
                    >
                      Hierarchy List
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      className={`px-2 py-1 rounded-md transition ${viewMode === 'cards' ? 'bg-[#1A3326] text-white' : 'hover:bg-gray-100'}`}
                    >
                      Cards
                    </button>
                  </div>
                </div>
              </div>

              {/* Organized Hierarchical Traveller List */}
              {(viewMode === 'both' || viewMode === 'hierarchy') && (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1 text-sm text-slate-700">
                    <span>{state.guests.length} travellers · {state.guests.filter(g => g.isLead).length} lead · {state.guests.filter(g => !g.isLead && !g.isProvisional).length} confirmed · {state.guests.filter(g => g.isProvisional).length} provisional</span>
                    <span className="text-xs text-slate-500">Edit a profile or check documents.</span>
                  </div>

                  <div className="bg-white border-t border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {state.guests.map((g, index) => {
                      // Check missing operational items
                      const missingItems: string[] = [];
                      if (g.isProvisional) missingItems.push('Name not confirmed');
                      if (!g.passportNo) missingItems.push('Passport number');
                      if (!g.passportExpiry) missingItems.push('Passport expiry');
                      if (!g.nationality && !g.country) missingItems.push('Nationality');
                      if (!g.individualEmail && !g.individualPhone && g.isLead) missingItems.push('Contact details');

                      const hasFlight = state.flights.some(f => f.paxIds?.includes(g.id));
                      const hasRoom = state.rooms.some(r => r.guestIds?.includes(g.id) || r.allocatedRooms?.some(ar => ar.guestIds?.includes(g.id)));
                      if (!hasFlight && state.flights.length > 0) missingItems.push('Flight not linked');
                      if (!hasRoom && state.rooms.length > 0) missingItems.push('Accommodation not linked');

                      return (
                        <div 
                          key={g.id}
                          className="px-3 py-4 flex flex-col md:flex-row md:items-center justify-between gap-x-6 gap-y-3 hover:bg-slate-50"
                        >
                          <div className="flex items-start gap-4 min-w-0">
                            <span className="text-xs font-mono font-bold text-gray-400 w-5 text-right shrink-0">
                              {index + 1}.
                            </span>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-[#10233F]">
                                  {g.first} {g.last}
                                </span>
                                <span className="text-xs text-slate-500">{g.isLead ? 'Lead traveller' : g.isProvisional ? 'Provisional traveller' : 'Traveller'}</span>
                                <span className="text-xs text-slate-500">{g.age || 'Adult'}</span>

                                {g.relationshipToLead && !g.isLead && (
                                  <span className="text-[11px] text-gray-500">
                                    ({g.relationshipToLead})
                                  </span>
                                )}
                              </div>

                              <p className={`mt-1 text-xs ${missingItems.length ? 'text-rose-700' : 'text-slate-500'}`}>
                                {missingItems.length ? `Needs attention: ${missingItems.join(' · ')}` : 'Profile details entered'}
                              </p>
                            </div>
                          </div>

                          {/* Row Action Buttons */}
                          <div className="flex flex-wrap items-center gap-4 lg:gap-5 self-start md:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditGuest(g, 'details')}
                              className="px-3 py-2 text-sm font-medium rounded-md bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition cursor-pointer"
                            >
                              {g.isProvisional ? 'Name Person / Edit' : 'Edit Profile'}
                            </button>



                            <button
                              type="button"
                              onClick={() => handleOpenEditGuest(g, 'audit')}
                              className="px-3 py-2 text-sm font-medium rounded-md bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition cursor-pointer"
                              title="Check missing information and operational readiness"
                            >
                              Audit
                            </button>

                            {!g.isLead && (
                              <button
                                type="button"
                                onClick={() => onSetLeadGuest(g.id)}
                                className="px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-50 border border-slate-300 transition cursor-pointer"
                                title="Make this person the group lead"
                              >
                                Make Lead
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleSafeRemovePrompt(g)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Safely remove traveller"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* EXPANDED CARDS GRID */}
            {(viewMode === 'both' || viewMode === 'cards') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {state.guests.map(g => (
                  <div 
                    key={g.id}
                    className={`p-4 rounded-xl border transition-all ${
                      g.isLead 
                        ? 'border-[#D4AF37] bg-yellow-50/20 shadow-xs ring-1 ring-[#D4AF37]/30' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {g.isLead && (
                            <span title="Primary Lead Contact" className="text-[#D4AF37]">
                              <Crown size={15} />
                            </span>
                          )}
                          <h3 className="font-bold text-[#10233F] text-sm truncate">
                            {g.first} {g.last} {g.preferredName ? `(${g.preferredName})` : ''}
                          </h3>
                        </div>
                        <span className="text-[11px] text-gray-500 block mt-0.5 truncate">
                          {g.nationality || g.country || 'Global Citizen'}
                        </span>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {g.age}
                      </span>
                    </div>

                    {/* Special Badges (Lead, Dietary, Accessibility) */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {g.isLead && (
                        <span className="text-[9px] bg-[#D4AF37]/20 text-[#1A3326] px-1.5 py-0.5 rounded font-bold">
                          ★ Lead
                        </span>
                      )}
                      {g.isProvisional && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-bold">
                          Provisional
                        </span>
                      )}
                      {g.dietaryMedical && g.dietaryMedical.length > 0 && (
                        <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-semibold">
                          Allergens
                        </span>
                      )}
                      {g.accessibilityMobility && g.accessibilityMobility.length > 0 && (
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                          Mobility
                        </span>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-[11px]">
                      <div>
                        {!g.isLead ? (
                          <button
                            type="button"
                            onClick={() => onSetLeadGuest(g.id)}
                            className="text-gray-500 hover:text-[#1A3326] font-semibold text-[11px] underline cursor-pointer"
                          >
                            Make Lead
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#D4AF37] font-bold uppercase">Lead Contact</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditGuest(g, 'details')}
                          className="text-[#1A3326] hover:text-[#D4AF37] font-bold text-[11px] cursor-pointer"
                        >
                          {g.isProvisional ? 'Name Person' : 'Edit'}
                        </button>

                        <span className="text-gray-200">|</span>
                        <button
                          type="button"
                          onClick={() => handleSafeRemovePrompt(g)}
                          className="text-rose-500 hover:text-rose-700 font-semibold text-[11px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Bulk Propagate Helpers */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-gray-500 border-t border-gray-100">
              <span>
                Lead Contact: <strong className="text-[#10233F]">{leadGuest ? `${leadGuest.first} ${leadGuest.last}` : 'Not assigned'}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const country = state.client.country || (leadGuest?.nationality) || '🇿🇦 South Africa';
                    const updated = state.guests.map(g => ({ ...g, country, nationality: country }));
                    onUpdateState({ guests: updated });
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-gray-700 transition cursor-pointer"
                >
                  Apply Country to All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (leadGuest) {
                      const phone = state.client.phone || leadGuest.emergencyContactPhone || '';
                      const updated = state.guests.map(g => ({
                        ...g,
                        emergencyContactName: `${leadGuest.first} ${leadGuest.last}`,
                        emergencyContactPhone: phone
                      }));
                      onUpdateState({ guests: updated });
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-gray-700 transition cursor-pointer"
                >
                  Copy Lead Contact to All
                </button>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* 2. SECONDARY BOOKING METADATA: GROUP & ROOMING ACTIONS */}
      <section className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Optional Group Name Inline Display & Edit */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group:</span>
            {isEditingGroupName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={groupNameInput}
                  onChange={e => setGroupNameInput(e.target.value)}
                  placeholder="e.g. Smith Family"
                  className="h-8 px-2.5 rounded-lg border border-gray-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    onUpdateClient({ name: groupNameInput.trim() });
                    setIsEditingGroupName(false);
                  }}
                  className="px-2.5 py-1 bg-[#1A3326] text-white rounded-lg text-xs font-bold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingGroupName(false)}
                  className="px-2 py-1 text-gray-500 text-xs hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#10233F]">
                  {state.client.name || defaultSuggestedName}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingGroupName(true)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                  title="Edit Group Name"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions: Optional Group Setup & Configure Rooming */}
          <div className="flex items-center gap-2.5">
            {/* Optional Collapsible Group Setup Toggle (never mandatory!) */}
            <button
              type="button"
              onClick={() => setShowOptionalGroupSetup(!showOptionalGroupSetup)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Sliders size={13} className="text-gray-500" />
              <span>Optional Group Setup</span>
              <ChevronDown size={13} className={`text-gray-400 transition-transform ${showOptionalGroupSetup ? 'rotate-180' : ''}`} />
            </button>

            {/* Configure Rooming Button -> Directly takes operator to RoomingView */}
            <button
              type="button"
              onClick={() => onNavigateTab?.('rooming')}
              className="px-4 py-1.5 rounded-xl bg-[#1A3326] hover:bg-[#12241b] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <span>Configure Rooming</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE OPTIONAL GROUP SETUP (Hidden by default, progressive disclosure) */}
        {showOptionalGroupSetup && (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 text-xs animate-in fade-in duration-150">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Optional Group Setup (Descriptive classification only)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-700 block">Party Classification</label>
                <select
                  value={groupMgmt.groupType}
                  onChange={e => handleUpdateGroupMgmt({ groupType: e.target.value as any })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs font-semibold"
                >
                  <option value="Couples">Couples</option>
                  <option value="Families">Families</option>
                  <option value="Friends">Friends Sharing</option>
                  <option value="Corporate">Corporate Group</option>
                  <option value="Incentive">Incentive Group</option>
                  <option value="Wedding">Weddings & Honeymoons</option>
                  <option value="VIP">VIP / Delegation</option>
                  <option value="Photography">Photography</option>
                  <option value="Other">Other Bespoke</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-700 block">General Sharing Preferences</label>
                <input
                  type="text"
                  value={groupMgmt.sharingPreferences}
                  onChange={e => handleUpdateGroupMgmt({ sharingPreferences: e.target.value })}
                  placeholder="e.g. Master suite for couple, separate twins for children"
                  className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs"
                />
              </div>
            </div>

            {/* Master Group & Booking Attachments */}
            <div className="pt-3 border-t border-slate-200">
              <AttachmentManager
                attachments={state.attachments || []}
                onAddAttachment={(item) => onUpdateState({
                  attachments: [...(state.attachments || []), item]
                })}
                onRemoveAttachment={(id) => onUpdateState({
                  attachments: (state.attachments || []).filter(a => a.id !== id)
                })}
                recordType="booking"
                recordId={state.ref}
                bookingRef={state.ref}
                title="Group & Booking Master Documents"
                description="Upload agency contracts, indemnity waivers, group travel insurance policies, or master quotes (PDF, JPEG, PNG, WebP up to 15MB)."
              />
            </div>
          </div>
        )}
      </section>

      {/* 3. TRIP DETAILS & SCHEDULE */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#D4AF37]" />
            <h2 className="text-sm font-bold text-gray-900 font-sans uppercase tracking-wider">Trip Details & Schedule</h2>
          </div>

          <div className="flex items-center gap-1.5">
            {state.client.isCustomDuration ? (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                Custom Duration Override
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Auto-Calculated Duration
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          
          {/* Column 1: Dates & Duration */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="trip-arrival-date" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                  Arrival Date
                </label>
                <input
                  id="trip-arrival-date"
                  type="date"
                  value={state.client.startDate}
                  onChange={e => handleDateChange('startDate', e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    isDateInverted ? 'border-rose-400 bg-rose-50/40' : 'border-gray-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="trip-departure-date" className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block">
                  Departure Date
                </label>
                <input
                  id="trip-departure-date"
                  type="date"
                  value={state.client.endDate}
                  onChange={e => handleDateChange('endDate', e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    isDateInverted ? 'border-rose-400 bg-rose-50/40' : 'border-gray-200'
                  }`}
                />
              </div>
            </div>

            {/* Duration Display + Adjust */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-bold uppercase text-[10px]">Tour Duration:</span>
                {!isEditingDuration ? (
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-[#10233F]">
                      {state.client.durationText || 'Select travel dates'}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomDays(state.client.customDays || 6);
                        setCustomNights(state.client.customNights || 5);
                        setIsEditingDuration(true);
                      }}
                      className="text-[10px] font-bold text-gray-500 hover:text-[#1A3326] underline"
                    >
                      Adjust
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRevertToAutoDuration}
                    className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={10} /> Auto-calculate from dates
                  </button>
                )}
              </div>

              {isEditingDuration && (
                <div className="flex items-center gap-2.5 pt-1 border-t border-gray-200 animate-in fade-in">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={customDays}
                      onChange={e => setCustomDays(Number(e.target.value))}
                      className="w-14 h-8 px-2 rounded-lg border border-gray-300 text-xs font-bold text-center"
                    />
                    <span className="text-xs font-semibold text-gray-600">Days</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={customNights}
                      onChange={e => setCustomNights(Number(e.target.value))}
                      className="w-14 h-8 px-2 rounded-lg border border-gray-300 text-xs font-bold text-center"
                    />
                    <span className="text-xs font-semibold text-gray-600">Nights</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyCustomDuration}
                    className="px-3 py-1 bg-[#1A3326] text-white rounded-lg text-xs font-bold hover:bg-[#12241b]"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Booking Channel (Source & Partner Agency) */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block mb-1.5">
                Booking Source
              </label>
              <div className="grid grid-cols-4 gap-1">
                {['direct', 'agent', 'referral', 'website'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onUpdateState({ source: s as any });
                      if (s !== 'agent') {
                        onUpdateState({ agent: { id: '', agencyName: '', contact: '', email: '', comm: '' } });
                      }
                    }}
                    className={`py-2 rounded-xl border text-center text-xs font-bold capitalize transition ${
                      state.source === s
                        ? 'border-[#D4AF37] bg-amber-50 text-[#1A3326]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {state.source === 'agent' && (
              <div className="space-y-1.5 pt-1 animate-in fade-in">
                <label className="text-[10px] text-gray-500 font-bold uppercase block">Partner Agency</label>
                <select
                  value={state.agent.id}
                  onChange={handleAgentSelect}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  <option value="">Select travel agency partner...</option>
                  {DB_DEFAULT.agents.map(ag => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} {ag.phone ? `(${ag.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="trip-type-select" className="text-[11px] text-slate-700 font-medium block mb-1">
                Tour type
              </label>
              <select
                id="trip-type-select"
                value={state.client.tourTypology || (state.client.tripType === 'transfer' ? 'airport_transfer' : state.client.tripType === 'day' ? 'full_day_tour' : 'multi_day_tour')}
                onChange={e => {
                  const tourTypology = e.target.value as NonNullable<AppState['client']['tourTypology']>;
                  const tripType = tourTypology.includes('transfer')
                    ? 'transfer'
                    : ['multi_day_tour', 'multi_day_safari', 'self_drive_itinerary'].includes(tourTypology)
                      ? 'multi'
                      : tourTypology === 'tailor_made_tour'
                        ? state.client.tripType
                        : 'day';
                  onUpdateClient({ tourTypology, tripType });
                }}
                className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm font-normal text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              >
                <option value="half_day_tour">Half-day tour (up to 5 hours)</option>
                <option value="full_day_tour">Full-day tour (up to 10 hours)</option>
                <option value="multi_day_tour">Multi-day tour / package</option>
                <option value="multi_day_safari">Multi-day safari</option>
                <option value="private_guided_tour">Private guided day tour</option>
                <option value="scheduled_shared_tour">Scheduled departure / shared tour</option>
                <option value="airport_transfer">Airport transfer (arrival or departure)</option>
                <option value="point_to_point_transfer">Point-to-point transfer</option>
                <option value="private_transfer">Private transfer</option>
                <option value="self_drive_itinerary">Self-drive tour / itinerary</option>
                <option value="tailor_made_tour">Tailor-made tour / package</option>
              </select>
            </div>
          </div>

          {/* Column 3: Priority, Status & Primary Contact */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider block mb-1.5">
                Priority & Status
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[
                  { key: 'hot', label: 'High' },
                  { key: 'pending', label: 'Medium' },
                  { key: 'exploratory', label: 'Low' }
                ].map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => onUpdateState({ priority: p.key as any })}
                    className={`py-1.5 rounded-lg border text-center text-xs font-bold transition ${
                      state.priority === p.key
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#1A3326]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1">
                {[
                  { key: 'draft', label: 'Enquiry' },
                  { key: 'quoted', label: 'Proposal' },
                  { key: 'confirmed', label: 'Confirmed' }
                ].map(st => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => onUpdateState({ status: st.key as TripStatus })}
                    className={`py-1.5 rounded-lg border text-center text-[10px] font-bold transition ${
                      (state.status || 'draft') === st.key
                        ? 'border-[#1A3326] bg-[#1A3326] text-white'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Contact Email & Phone */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={state.client.email}
                  onChange={e => onUpdateClient({ email: e.target.value })}
                  placeholder={leadGuest ? `${leadGuest.first.toLowerCase()}@example.com` : 'email@domain.com'}
                  className="w-full h-9 px-2.5 rounded-lg border border-gray-200 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={state.client.phone}
                  onChange={e => onUpdateClient({ phone: e.target.value })}
                  placeholder="+27 82 555 1234"
                  className="w-full h-9 px-2.5 rounded-lg border border-gray-200 text-xs"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. CONTEXT-AWARE BOOKING STATUS & ACTIONABLE CHECKLIST (Secondary, calm, not aggressive) */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Booking Status & Module Overview
            </h2>
          </div>
          <span className="text-[11px] text-gray-400">Click any item to navigate to that section</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          
          {/* Item 1: Travellers */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('guests')}
            className="p-2.5 rounded-xl border text-left transition bg-slate-50 border-slate-200 hover:border-gray-300"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Travellers</span>
            {totalTravellers > 0 ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                ✓ {totalTravellers} Registered
              </span>
            ) : (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                ⚠ Required
              </span>
            )}
          </button>

          {/* Item 2: Lead Contact */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('guests')}
            className="p-2.5 rounded-xl border text-left transition bg-slate-50 border-slate-200 hover:border-gray-300"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Lead Contact</span>
            {leadGuest ? (
              <span className="text-emerald-700 font-bold truncate block">
                ✓ {leadGuest.first} {leadGuest.last}
              </span>
            ) : totalTravellers > 0 ? (
              <span className="text-amber-700 font-bold">⚠ Select Lead</span>
            ) : (
              <span className="text-gray-400 font-medium">— Pending</span>
            )}
          </button>

          {/* Item 3: Travel Dates */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('guests')}
            className="p-2.5 rounded-xl border text-left transition bg-slate-50 border-slate-200 hover:border-gray-300"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Travel Dates</span>
            {hasDates && !isDateInverted ? (
              <span className="text-emerald-700 font-bold truncate block">
                ✓ {state.client.durationText}
              </span>
            ) : isDateInverted ? (
              <span className="text-rose-600 font-bold">⚠ Date Conflict</span>
            ) : (
              <span className="text-gray-500 font-medium">— Dates Pending</span>
            )}
          </button>

          {/* Item 4: Flights (Context-Aware: Optional, not an error!) */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('flights')}
            className="p-2.5 rounded-xl border text-left transition bg-slate-50 border-slate-200 hover:border-gray-300"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Flights</span>
            {hasFlights ? (
              <span className="text-emerald-700 font-bold">
                ✓ {state.flights.length} Logged
              </span>
            ) : (
              <span className="text-gray-400 font-medium">
                — Not configured
              </span>
            )}
          </button>

          {/* Item 5: Accommodation (Context-Aware: Required if Multi-Day, Not Required if Day Trip!) */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('rooming')}
            className="p-2.5 rounded-xl border text-left transition bg-slate-50 border-slate-200 hover:border-gray-300"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Accommodation</span>
            {hasRooms ? (
              <span className="text-emerald-700 font-bold">
                ✓ {state.rooms.length} Stays
              </span>
            ) : !isMultiDay ? (
              <span className="text-gray-400 font-medium">
                — Not required
              </span>
            ) : totalTravellers > 0 ? (
              <span className="text-amber-700 font-bold">
                ⚠ Rooming needed
              </span>
            ) : (
              <span className="text-gray-400 font-medium">
                — Not configured
              </span>
            )}
          </button>

          {/* Item 6: Experiences (Context-Aware: Optional/Not configured) */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('activities')}
            className="p-2.5 rounded-xl border text-left transition bg-slate-50 border-slate-200 hover:border-gray-300"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Experiences</span>
            {hasExperiences ? (
              <span className="text-emerald-700 font-bold">
                ✓ {state.activities.length} Added
              </span>
            ) : (
              <span className="text-gray-400 font-medium">
                — Not configured
              </span>
            )}
          </button>

          {/* Item 7: Operations / Ground (Context-Aware: Optional/Not configured) */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('transfers')}
            className="p-2.5 rounded-xl border text-left transition bg-slate-50 border-slate-200 hover:border-gray-300"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Ground Operations</span>
            {hasTransfers ? (
              <span className="text-emerald-700 font-bold">
                ✓ {state.transfers.length} Transfers
              </span>
            ) : (
              <span className="text-gray-400 font-medium">
                — Not configured
              </span>
            )}
          </button>

        </div>
      </section>

      {/* 5. FAST ADD TRAVELLER MODAL WITH PROGRESSIVE DISCLOSURE */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 border border-gray-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider block">Traveller Profile</span>
                <h3 className="font-bold text-[#10233F] text-base font-sans">
                  {modalGuest.id ? `Edit Traveller: ${modalGuest.first} ${modalGuest.last}` : 'Add Traveller'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-grow">
              
              {/* PRIMARY ESSENTIAL FIELDS (Takes 5 seconds!) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">First Name *</label>
                  <input
                    type="text"
                    value={modalGuest.first || ''}
                    onChange={e => setModalGuest({ ...modalGuest, first: e.target.value })}
                    placeholder="e.g. John"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Last Name *</label>
                  <input
                    type="text"
                    value={modalGuest.last || ''}
                    onChange={e => setModalGuest({ ...modalGuest, last: e.target.value })}
                    placeholder="e.g. Smith"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Age Category</label>
                  <select
                    value={modalGuest.age || 'Adult'}
                    onChange={e => setModalGuest({ ...modalGuest, age: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    <option value="Adult">Adult (18+)</option>
                    <option value="Elderly">Senior / Elderly</option>
                    <option value="Teen">Teenager (12 - 17)</option>
                    <option value="Child">Child (2 - 11)</option>
                    <option value="Infant">Infant (Under 2)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Nationality</label>
                  <input
                    type="text"
                    value={modalCountrySearch}
                    onChange={e => {
                      setModalCountrySearch(e.target.value);
                      setShowModalCountryDD(true);
                    }}
                    onFocus={() => setShowModalCountryDD(true)}
                    placeholder="Search country..."
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  {showModalCountryDD && filteredModalCountries.length > 0 && (
                    <div className="absolute bg-white border border-gray-200 rounded-xl shadow-lg mt-1 z-50 overflow-hidden max-w-xs">
                      {filteredModalCountries.map(c => (
                        <div
                          key={c}
                          onClick={() => {
                            setModalCountrySearch(c);
                            setShowModalCountryDD(false);
                          }}
                          className="px-3 py-1.5 text-xs hover:bg-gray-100 cursor-pointer font-medium"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Traveller Checkbox & Provisional Banner */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={modalGuest.isLead || false}
                    onChange={e => setModalGuest({ ...modalGuest, isLead: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1A3326] focus:ring-[#D4AF37]"
                  />
                  <span>Designate as Lead Contact for group vouchers and notifications</span>
                </label>

                {modalGuest.isProvisional && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle size={16} className="text-amber-700 shrink-0" />
                      <div className="min-w-0">
                        <strong className="block truncate">Provisional Record ({modalGuest.provisionalLabel || `${modalGuest.first} ${modalGuest.last}`})</strong>
                        <span className="text-[11px] text-amber-800">Assign confirmed passport name and details without losing existing assignments.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalGuest(prev => ({
                          ...prev,
                          isProvisional: false,
                          first: prev.first === 'Adult' || prev.first === 'Senior' || prev.first === 'Child' || prev.first === 'Infant' ? '' : prev.first,
                          last: prev.last && !isNaN(Number(prev.last)) ? '' : prev.last
                        }));
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer"
                    >
                      Promote to Confirmed
                    </button>
                  </div>
                )}
              </div>

              {/* PROGRESSIVE DISCLOSURE TOGGLE: MORE DETAILS */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAdvancedGuestDetails(!showAdvancedGuestDetails)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-gray-700 flex items-center justify-between transition cursor-pointer"
                >
                  <span>{showAdvancedGuestDetails ? '− Hide Additional Profile Details' : '+ View additional profile details'}</span>
                  <span className="text-[10px] text-gray-400 font-normal">Expanded Profile</span>
                </button>
              </div>

              {/* EXPANDABLE ADVANCED PROFILE DETAILS */}
              {showAdvancedGuestDetails && (
                <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in duration-150">
                  <div className="flex flex-nowrap items-center gap-8 md:gap-10 overflow-x-auto whitespace-nowrap border-b border-slate-200 text-xs font-medium text-slate-600">
                    <button
                      type="button"
                      onClick={() => setModalTab('details')}
                      className={`shrink-0 pb-3 px-2 border-b-2 transition cursor-pointer ${modalTab === 'details' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                      General
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalTab('audit')}
                      className={`shrink-0 pb-3 px-1 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${modalTab === 'audit' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                      <ShieldCheck size={12} />
                      <span>Readiness</span>
                      {(!modalGuest.passportNo || modalGuest.isProvisional) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab('dietary')}
                      className={`shrink-0 pb-3 px-1 border-b-2 transition cursor-pointer ${modalTab === 'dietary' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                      Dietary
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab('accessibility')}
                      className={`shrink-0 pb-3 px-1 border-b-2 transition cursor-pointer ${modalTab === 'accessibility' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                      Accessibility
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab('preferences')}
                      className={`shrink-0 pb-3 px-1 border-b-2 transition cursor-pointer ${modalTab === 'preferences' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                      Preferences
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab('documents')}
                      className={`shrink-0 pb-3 px-1 border-b-2 transition cursor-pointer ${modalTab === 'documents' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                      Documents
                    </button>
                  </div>

                  {modalTab === 'details' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Preferred / Call Name</label>
                          <input
                            type="text"
                            value={modalGuest.preferredName || ''}
                            onChange={e => setModalGuest({ ...modalGuest, preferredName: e.target.value })}
                            placeholder="e.g. Jack"
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Relationship to Lead</label>
                          <select
                            value={modalGuest.relationshipToLead || 'Family Member'}
                            onChange={e => setModalGuest({ ...modalGuest, relationshipToLead: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                          >
                            <option value="Primary Contact">Primary Contact</option>
                            <option value="Spouse or partner">Spouse or partner</option>
                            <option value="Child or dependent">Child or dependent</option>
                            <option value="Family member">Family member</option>
                            <option value="Friend">Friend</option>
                            <option value="Colleague">Colleague</option>
                            <option value="Other relationship">Other relationship</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Primary Language</label>
                          <select
                            value={modalGuest.languagesSpoken?.[0] || 'English'}
                            onChange={e => setModalGuest({ ...modalGuest, languagesSpoken: [e.target.value] })}
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs"
                          >
                            <option value="English">English</option>
                            <option value="Portuguese">Portuguese</option>
                            <option value="German">German</option>
                            <option value="French">French</option>
                            <option value="Spanish">Spanish</option>
                            <option value="Italian">Italian</option>
                          </select>
                        </div>
                      </div>

                      {/* Passport & Identity Section */}
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                          Travel Identity & Passport Records
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Date of Birth</label>
                            <input
                              type="date"
                              value={modalGuest.dob || ''}
                              onChange={e => setModalGuest({ ...modalGuest, dob: e.target.value })}
                              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Passport Number</label>
                            <input
                              type="text"
                              value={modalGuest.passportNo || ''}
                              onChange={e => setModalGuest({ ...modalGuest, passportNo: e.target.value })}
                              placeholder="e.g. FA892144"
                              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs font-mono font-bold uppercase"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Passport Expiry Date</label>
                            <input
                              type="date"
                              value={modalGuest.passportExpiry || ''}
                              onChange={e => setModalGuest({ ...modalGuest, passportExpiry: e.target.value })}
                              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Individual Contact Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Individual Email (Optional)</label>
                          <input
                            type="email"
                            value={modalGuest.individualEmail || ''}
                            onChange={e => setModalGuest({ ...modalGuest, individualEmail: e.target.value })}
                            placeholder="traveller@personal.com"
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Individual Mobile / WhatsApp (Optional)</label>
                          <input
                            type="text"
                            value={modalGuest.individualPhone || ''}
                            onChange={e => setModalGuest({ ...modalGuest, individualPhone: e.target.value })}
                            placeholder="+55 11 99999 1234"
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs"
                          />
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Emergency Contact Name</label>
                          <input
                            type="text"
                            value={modalGuest.emergencyContactName || ''}
                            onChange={e => setModalGuest({ ...modalGuest, emergencyContactName: e.target.value })}
                            placeholder="e.g. Maria Silva"
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Emergency Phone</label>
                          <input
                            type="text"
                            value={modalGuest.emergencyContactPhone || ''}
                            onChange={e => setModalGuest({ ...modalGuest, emergencyContactPhone: e.target.value })}
                            placeholder="+55 11 98888 5678"
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Relation</label>
                          <input
                            type="text"
                            value={modalGuest.emergencyContactRelation || ''}
                            onChange={e => setModalGuest({ ...modalGuest, emergencyContactRelation: e.target.value })}
                            placeholder="e.g. Sister, Lead"
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: READINESS AUDIT */}
                  {modalTab === 'audit' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <strong className="block text-gray-900">Operational Readiness Audit</strong>
                          <span className="text-[11px] text-gray-500">Checking documentation, personal records and assignment completeness.</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#1A3326] text-[#D4AF37] font-bold text-[10px] uppercase font-mono">
                          Viemma Ground OPS
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        {/* 1. Name & Identity */}
                        <div className="p-3 rounded-xl border flex items-center justify-between bg-white border-gray-200">
                          <div>
                            <span className="font-bold text-gray-800 block">Traveller Identity</span>
                            <span className="text-[11px] text-gray-500">
                              {modalGuest.isProvisional ? 'Provisional Record (Name pending confirmed passport identity)' : `Confirmed Identity (${modalGuest.first} ${modalGuest.last})`}
                            </span>
                          </div>
                          {modalGuest.isProvisional ? (
                            <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[11px]">
                              ⚠️ Needs Confirmation
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[11px]">
                              ✓ Confirmed
                            </span>
                          )}
                        </div>

                        {/* 2. Passport Record */}
                        <div className="p-3 rounded-xl border flex items-center justify-between bg-white border-gray-200">
                          <div>
                            <span className="font-bold text-gray-800 block">Passport & Travel Documentation</span>
                            <span className="text-[11px] text-gray-500">
                              {modalGuest.passportNo ? `Passport ${modalGuest.passportNo} (Exp: ${modalGuest.passportExpiry || 'No date'})` : 'No passport number on file'}
                            </span>
                          </div>
                          {modalGuest.passportNo ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[11px]">
                              ✓ Recorded
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md font-bold text-[11px]">
                              ⚠️ Missing Passport
                            </span>
                          )}
                        </div>

                        {/* 3. Emergency Contact */}
                        <div className="p-3 rounded-xl border flex items-center justify-between bg-white border-gray-200">
                          <div>
                            <span className="font-bold text-gray-800 block">Emergency Contact</span>
                            <span className="text-[11px] text-gray-500">
                              {modalGuest.emergencyContactName ? `${modalGuest.emergencyContactName} (${modalGuest.emergencyContactPhone || 'No phone'})` : 'No emergency contact specified'}
                            </span>
                          </div>
                          {modalGuest.emergencyContactName ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[11px]">
                              ✓ Recorded
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[11px]">
                              ⚠️ Missing Contact
                            </span>
                          )}
                        </div>

                        {/* 4. Dietary & Allergens */}
                        <div className="p-3 rounded-xl border flex items-center justify-between bg-white border-gray-200">
                          <div>
                            <span className="font-bold text-gray-800 block">Dietary & Medical Allergens</span>
                            <span className="text-[11px] text-gray-500">
                              {(modalGuest.dietaryMedical?.length || 0) + (modalGuest.customFoodRequirements?.length || 0) > 0 
                                ? `Specific requirements logged (${[...(modalGuest.dietaryMedical || []), ...(modalGuest.customFoodRequirements || []).map(x => x.name)].join(', ')})`
                                : 'Standard menu / No special allergens specified'}
                            </span>
                          </div>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-semibold text-[11px]">
                            {(modalGuest.dietaryMedical?.length || 0) > 0 ? 'Medical Alert' : 'Standard'}
                          </span>
                        </div>

                        {/* 5. Inbound / Outbound Flight Links */}
                        <div className="p-3 rounded-xl border flex items-center justify-between bg-white border-gray-200">
                          <div>
                            <span className="font-bold text-gray-800 block">Flight Links (Arrival & Departure)</span>
                            <span className="text-[11px] text-gray-500">
                              {state.flights.some(f => f.paxIds?.includes(modalGuest.id!))
                                ? `${state.flights.filter(f => f.paxIds?.includes(modalGuest.id!)).length} flight segments linked`
                                : 'No flights assigned'}
                            </span>
                          </div>
                          {state.flights.some(f => f.paxIds?.includes(modalGuest.id!)) ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[11px]">
                              ✓ Assigned
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[11px]">
                              ⚠️ Unassigned
                            </span>
                          )}
                        </div>

                        {/* 6. Room Allocation */}
                        <div className="p-3 rounded-xl border flex items-center justify-between bg-white border-gray-200">
                          <div>
                            <span className="font-bold text-gray-800 block">Hotel Room Allocation</span>
                            <span className="text-[11px] text-gray-500">
                              {state.rooms.some(r => r.guestIds?.includes(modalGuest.id!) || r.allocatedRooms?.some(ar => ar.guestIds?.includes(modalGuest.id!)))
                                ? 'Assigned to accommodation room'
                                : 'Not currently assigned to any room'}
                            </span>
                          </div>
                          {state.rooms.some(r => r.guestIds?.includes(modalGuest.id!) || r.allocatedRooms?.some(ar => ar.guestIds?.includes(modalGuest.id!))) ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[11px]">
                              ✓ Allocated
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[11px]">
                              ⚠️ Unallocated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {modalTab === 'dietary' && (
                    <div className="space-y-4">
                      {/* Standard Allergens */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Medical Allergens</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Gluten Free', 'Dairy Free', 'Nut Allergy', 'Shellfish Allergy', 'Egg Allergy'].map(item => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleModalTag('dietaryMedical', item)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer ${
                                modalGuest.dietaryMedical?.includes(item)
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Standard Lifestyle Diets */}
                      <div className="space-y-1.5 pt-2 border-t border-gray-100">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Lifestyle / Religious Diets</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Vegetarian', 'Vegan', 'Pescatarian', 'Halal', 'Kosher'].map(item => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleModalTag('dietaryLifestyle', item)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer ${
                                modalGuest.dietaryLifestyle?.includes(item)
                                  ? 'bg-[#1A3326] text-white border-[#1A3326]'
                                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* EXTENSIBLE CUSTOM FOOD REQUIREMENTS (Section 6.1 Requirement) */}
                      <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                            Add Custom Food / Allergy Requirement
                          </span>
                          <span className="text-[9px] text-gray-500">Free-text extensible</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={customFoodText}
                            onChange={e => setCustomFoodText(e.target.value)}
                            placeholder="e.g. Severe Sesame Allergy, No Raw Onion, Low Sodium"
                            className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-xs bg-white"
                          />
                          <div className="flex gap-1.5">
                            <select
                              value={customFoodCategory}
                              onChange={e => setCustomFoodCategory(e.target.value as any)}
                              className="h-9 px-2.5 rounded-lg border border-gray-300 text-xs bg-white font-semibold"
                            >
                              <option value="allergy">Allergy (Medical)</option>
                              <option value="preference">Preference (Lifestyle)</option>
                            </select>
                            <button
                              type="button"
                              onClick={handleAddCustomFoodReq}
                              className="px-3.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition shrink-0"
                            >
                              + Add
                            </button>
                          </div>
                        </div>

                        {modalGuest.customFoodRequirements && modalGuest.customFoodRequirements.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {modalGuest.customFoodRequirements.map(item => (
                              <span
                                key={item.id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                  item.type === 'allergy'
                                    ? 'bg-rose-100 border-rose-300 text-rose-900'
                                    : 'bg-emerald-100 border-emerald-300 text-emerald-900'
                                }`}
                              >
                                <span>{item.name} ({item.type === 'allergy' ? 'Medical' : 'Pref'})</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomFoodReq(item.id)}
                                  className="text-gray-400 hover:text-rose-700 font-bold ml-0.5 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {modalTab === 'accessibility' && (
                    <div className="space-y-4">
                      {/* Standard Mobility */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Mobility Support</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Wheelchair User', 'Step-Free Access', 'Walking Stick / Frame', 'Cannot Climb Stairs', 'Low-Step Vehicle Needed'].map(item => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleModalTag('accessibilityMobility', item)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer ${
                                modalGuest.accessibilityMobility?.includes(item)
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* EXTENSIBLE CUSTOM ACCESSIBILITY REQUIREMENTS (Section 6.2 Requirement) */}
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 block">
                          Add Custom Accessibility Requirement
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customAccessText}
                            onChange={e => setCustomAccessText(e.target.value)}
                            placeholder="e.g. Airport wheelchair assistance, Accessible roll-in shower"
                            className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomAccessReq}
                            className="px-3.5 py-1 bg-[#1A3326] hover:bg-[#12241b] text-white rounded-lg text-xs font-bold transition shrink-0"
                          >
                            + Add
                          </button>
                        </div>

                        {modalGuest.customAccessibilityRequirements && modalGuest.customAccessibilityRequirements.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {modalGuest.customAccessibilityRequirements.map(item => (
                              <span
                                key={item.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border bg-blue-50 border-blue-200 text-blue-900"
                              >
                                <span>{item.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomAccessReq(item.id)}
                                  className="text-gray-400 hover:text-rose-700 font-bold ml-0.5 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 pt-1 border-t border-gray-100">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block">Medical Operational Notes</label>
                        <input
                          type="text"
                          value={modalGuest.medicalOperationalNotes || ''}
                          onChange={e => setModalGuest({ ...modalGuest, medicalOperationalNotes: e.target.value })}
                          placeholder="e.g. CPAP power plug required; carries insulin needing refrigeration"
                          className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {modalTab === 'preferences' && (
                    <div className="space-y-4">
                      {/* Standard Comfort Badges */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Accommodation Comfort</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['King Bed', 'Twin Beds', 'Quiet Room', 'Ground Floor', 'Connecting Room'].map(item => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleModalTag('preferencesAccommodation', item)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer ${
                                modalGuest.preferencesAccommodation?.includes(item)
                                  ? 'bg-[#1A3326] text-white border-[#1A3326]'
                                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* EXTENSIBLE CUSTOM ACCOMMODATION REQUIREMENTS (Section 6.3 Requirement) */}
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 block">
                          Add Custom Accommodation Requirement
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customAccomText}
                            onChange={e => setCustomAccomText(e.target.value)}
                            placeholder="e.g. Early check-in requested (10:00 AM), Private villa with plunge pool"
                            className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomAccomReq}
                            className="px-3.5 py-1 bg-[#1A3326] hover:bg-[#12241b] text-white rounded-lg text-xs font-bold transition shrink-0"
                          >
                            + Add
                          </button>
                        </div>

                        {modalGuest.customAccommodationRequirements && modalGuest.customAccommodationRequirements.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {modalGuest.customAccommodationRequirements.map(item => (
                              <span
                                key={item.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border bg-emerald-50 border-emerald-200 text-emerald-900"
                              >
                                <span>{item.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomAccomReq(item.id)}
                                  className="text-gray-400 hover:text-rose-700 font-bold ml-0.5 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 pt-1 border-t border-gray-100">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block">Special Notes</label>
                        <input
                          type="text"
                          value={modalGuest.notes || ''}
                          onChange={e => setModalGuest({ ...modalGuest, notes: e.target.value })}
                          placeholder="e.g. Milestone 50th birthday celebration in Cape Town"
                          className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {modalTab === 'documents' && (
                    <div className="space-y-4">
                      <AttachmentManager
                        attachments={modalGuest.attachments || []}
                        onAddAttachment={(item) => setModalGuest(prev => ({
                          ...prev,
                          attachments: [...(prev.attachments || []), item]
                        }))}
                        onRemoveAttachment={(id) => setModalGuest(prev => ({
                          ...prev,
                          attachments: (prev.attachments || []).filter(a => a.id !== id)
                        }))}
                        recordType="guest"
                        recordId={modalGuest.id || Date.now()}
                        bookingRef={state.ref}
                        title="Traveller Passports, Visas & Medical Clearances"
                        description="Upload passport scan copies, entry visas, travel insurance certificates, or medical clearance letters (PDF, JPEG, PNG, WebP up to 15MB)."
                      />
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveModalGuest(true)}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-[#1A3326] border border-amber-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                title="Save this traveller and immediately add another without closing"
              >
                Save & Add Another
              </button>
              <button
                type="button"
                onClick={() => handleSaveModalGuest(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer"
              >
                Save Traveller
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QUICK ADD MODAL (Option 1: Quantity Controls) */}
      {quickAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl border border-amber-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#10233F]">Quick Add Travellers</h3>
                  <p className="text-xs text-gray-500">Add provisional group composition before collecting full names.</p>
                </div>
              </div>
              <button onClick={() => setQuickAddOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed font-medium">
                Specify quantities to generate individual provisional traveller records (e.g. Adult 1, Child 1) linked to the lead contact. Each person can be named and assigned independently:
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5">
                  <span className="font-extrabold text-gray-800 block">Adults (18+)</span>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setQaAdults(Math.max(0, qaAdults - 1))} className="w-8 h-8 rounded-xl bg-white border border-gray-300 font-bold text-gray-700 cursor-pointer">-</button>
                    <span className="text-base font-black text-[#10233F]">{qaAdults}</span>
                    <button type="button" onClick={() => setQaAdults(qaAdults + 1)} className="w-8 h-8 rounded-xl bg-[#1A3326] text-white font-bold cursor-pointer">+</button>
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5">
                  <span className="font-extrabold text-gray-800 block">Elderly / Seniors</span>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setQaElderly(Math.max(0, qaElderly - 1))} className="w-8 h-8 rounded-xl bg-white border border-gray-300 font-bold text-gray-700 cursor-pointer">-</button>
                    <span className="text-base font-black text-[#10233F]">{qaElderly}</span>
                    <button type="button" onClick={() => setQaElderly(qaElderly + 1)} className="w-8 h-8 rounded-xl bg-[#1A3326] text-white font-bold cursor-pointer">+</button>
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5">
                  <span className="font-extrabold text-gray-800 block">Children (2 - 11)</span>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setQaChildren(Math.max(0, qaChildren - 1))} className="w-8 h-8 rounded-xl bg-white border border-gray-300 font-bold text-gray-700 cursor-pointer">-</button>
                    <span className="text-base font-black text-[#10233F]">{qaChildren}</span>
                    <button type="button" onClick={() => setQaChildren(qaChildren + 1)} className="w-8 h-8 rounded-xl bg-[#1A3326] text-white font-bold cursor-pointer">+</button>
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5">
                  <span className="font-extrabold text-gray-800 block">Infants (Under 2)</span>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setQaInfants(Math.max(0, qaInfants - 1))} className="w-8 h-8 rounded-xl bg-white border border-gray-300 font-bold text-gray-700 cursor-pointer">-</button>
                    <span className="text-base font-black text-[#10233F]">{qaInfants}</span>
                    <button type="button" onClick={() => setQaInfants(qaInfants + 1)} className="w-8 h-8 rounded-xl bg-[#1A3326] text-white font-bold cursor-pointer">+</button>
                  </div>
                </div>
              </div>

              {qaError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
                  {qaError}
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center justify-between font-bold">
                <span>Total additional travellers to add:</span>
                <span className="text-base text-amber-950 font-black">{qaAdults + qaElderly + qaChildren + qaInfants}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  setQaError('');
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickAddSubmit}
                disabled={qaAdults + qaElderly + qaChildren + qaInfants === 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
              >
                Add {qaAdults + qaElderly + qaChildren + qaInfants} Travellers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE LEAD PERSON CONFIRMATION MODAL */}
      {showChangeLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl border border-amber-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#10233F]">Change Lead Person</h3>
                  <p className="text-xs text-gray-500">Trip {state.ref || 'VT-2026-001'} Primary Representative</p>
                </div>
              </div>
              <button onClick={() => setShowChangeLeadModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600 leading-relaxed">
                Select the group member to designate as the primary representative. All other travellers, preferences, and individual operational assignments will remain strictly preserved:
              </p>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {state.guests.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      onSetLeadGuest(g.id);
                      setShowChangeLeadModal(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      g.isLead
                        ? 'border-[#D4AF37] bg-yellow-50/40 ring-1 ring-[#D4AF37]/50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${g.isLead ? 'bg-[#1A3326] text-[#D4AF37]' : 'bg-gray-100 text-gray-700'}`}>
                        {g.isLead ? '★' : (g.first[0] || 'T')}
                      </div>
                      <div>
                        <span className="font-bold text-[#10233F] block">{g.first} {g.last}</span>
                        <span className="text-[11px] text-gray-500">{g.nationality || g.country || 'Global Citizen'} • {g.age}</span>
                      </div>
                    </div>
                    {g.isLead ? (
                      <span className="text-[10px] uppercase font-bold text-[#D4AF37] bg-[#1A3326] px-2 py-0.5 rounded">
                        Current Lead
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#1A3326] underline">
                        Make Lead
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowChangeLeadModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAFE REMOVAL CONFIRMATION MODAL */}
      {guestToRemove && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl border border-rose-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Remove Traveller</h3>
                  <p className="text-xs text-gray-500">{guestToRemove.first} {guestToRemove.last}</p>
                </div>
              </div>
              <button onClick={() => setGuestToRemove(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <p>
                Are you sure you want to remove <strong className="text-gray-900">{guestToRemove.first} {guestToRemove.last}</strong> from Trip {state.ref || 'VT-2026-001'}?
              </p>

              {guestToRemove.isLead && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold">
                  ⚠️ This person is currently designated as the Group Lead Contact. Removing them will safely promote the next group member to Lead Contact.
                </div>
              )}

              {/* Assignments breakdown */}
              {(() => {
                const assignedF = state.flights.filter(f => f.paxIds?.includes(guestToRemove.id));
                const assignedT = state.transfers.filter(t => t.paxIds?.includes(guestToRemove.id));
                const assignedR = state.rooms.filter(r => r.guestIds?.includes(guestToRemove.id) || r.allocatedRooms?.some(ar => ar.guestIds?.includes(guestToRemove.id)));
                const assignedA = state.activities.filter(a => a.paxIds?.includes(guestToRemove.id));

                if (assignedF.length > 0 || assignedT.length > 0 || assignedR.length > 0 || assignedA.length > 0) {
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <span className="font-bold text-gray-700 block">Active Operational Assignments to be Unlinked:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-600 text-[11px]">
                        {assignedF.length > 0 && <li>{assignedF.length} Flight segment(s)</li>}
                        {assignedT.length > 0 && <li>{assignedT.length} Ground transfer(s)</li>}
                        {assignedR.length > 0 && <li>{assignedR.length} Accommodation room(s)</li>}
                        {assignedA.length > 0 && <li>{assignedA.length} Scheduled activity(ies)</li>}
                      </ul>
                      <p className="text-[10px] text-gray-500 pt-1">
                        All unassigned services will remain intact for the other group travellers.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setGuestToRemove(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveGuest(guestToRemove.id);
                  setGuestToRemove(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};