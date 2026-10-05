import React, { useState } from 'react';
import { AppState, Room, AllocatedRoom } from '../types';
import { DB_DEFAULT, ROOM_TYPE_OPTIONS, MEAL_PLAN_OPTIONS, ROOM_REQUEST_OPTIONS } from '../dbDefaults';
import { 
  Hotel, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Users, 
  ShieldAlert, 
  Calendar, 
  Info,
  Compass,
  Clock,
  Tag,
  Briefcase,
  AlertCircle,
  ArrowRight,
  MapPin,
  Sparkles,
  Layers,
  Activity,
  Bed,
  Phone,
  Eye,
  Heart,
  FileText,
  X
} from 'lucide-react';

interface RoomingViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onAddRoom: (r: Room) => void;
  onRemoveRoom: (id: number) => void;
  onUpdateRoom: (id: number, updates: Partial<Room>) => void;
}

export const RoomingView: React.FC<RoomingViewProps> = ({
  state,
  onUpdateState,
  onAddRoom,
  onRemoveRoom,
  onUpdateRoom
}) => {
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [rForm, setRForm] = useState<Partial<Room>>({});
  const [showQuickBook, setShowQuickBook] = useState(false);

  // Sub-state for creating/editing an allocated room inside the active Stay Form
  const [showRoomAllocModal, setShowRoomAllocModal] = useState(false);
  const [editingAllocRoomIndex, setEditingAllocRoomIndex] = useState<number | null>(null);
  const [allocRoomForm, setAllocRoomForm] = useState<Partial<AllocatedRoom>>({});

  // Quick Book sub-form presets
  const [qbHotel, setQbHotel] = useState("The Silo Hotel (Cape Town)");
  const [qbRoomType, setQbRoomType] = useState("Deluxe Suite");
  const [qbMeal, setQbMeal] = useState("B&B");
  const [qbGuestsCount, setQbGuestsCount] = useState(2);
  const [qbRate, setQbRate] = useState(14500);

  const handleOpenAddForm = () => {
    setRForm({
      hotel: 'The Silo Hotel (Cape Town)',
      conf: '',
      pay: 'Unpaid',
      cin: state.client.startDate || '',
      cout: state.client.endDate || '',
      nights: calcNights(state.client.startDate || '', state.client.endDate || ''),
      guestIds: state.guests.map(g => g.id), // defaults to all
      rate: 12000,
      supp: 0,
      reqs: [],
      notes: '',
      // Smart rooming defaults
      allocatedRooms: [
        {
          id: Date.now(),
          roomName: 'Master Suite 101',
          roomType: 'Deluxe Suite',
          occupancy: 'Couple',
          maxOccupancy: 2,
          adults: 2,
          children: 0,
          price: 12000,
          currency: 'ZAR',
          mealBasis: 'B&B',
          isAccessible: false,
          isInterleading: false,
          hasPrivatePool: true,
          hasBalcony: true,
          view: 'Ocean & Waterfront',
          smokingPolicy: 'Non-smoking',
          specialBenefits: 'Complimentary champagne setup.',
          internalNotes: 'VIP check-in arrangements.',
          guestIds: state.guests.slice(0, 2).map(g => g.id)
        }
      ],
      gpsLocation: '-33.9015, 18.4239',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      amenities: ['Spa', 'Gym', 'Pool', 'Wi-Fi'],
      restaurants: ['The Granary Café', 'The Willaston Bar'],
      spa: true,
      gym: true,
      pool: true,
      wifi: true,
      accessibilityFeatures: ['Elevator Access', 'Ground Level Common Areas'],
      childFriendly: true,
      sustainabilityRating: '5-Star Green Eco-certified',
      emergencyContact: 'Silo Front Desk / Duty Manager',
      nightManager: '+27 21 061 1600',
      cancellationPolicy: '30 Days 100% refund, inside 14 Days 100% cancellation penalty.',
      internalNotesHotel: 'Dispatch custom Viemma Tours fruit basket and flower setup upon check-in.'
    });
    setEditingRoomId(-1);
  };

  const handleEditRoom = (r: Room) => {
    setRForm({ 
      ...r,
      // fallback initialization if they were missing
      allocatedRooms: r.allocatedRooms || [],
      gpsLocation: r.gpsLocation || '-33.9015, 18.4239',
      checkInTime: r.checkInTime || '14:00',
      checkOutTime: r.checkOutTime || '11:00',
      amenities: r.amenities || ['Spa', 'Pool', 'Wi-Fi'],
      restaurants: r.restaurants || ['Main Dinning Room'],
      spa: r.spa ?? true,
      gym: r.gym ?? true,
      pool: r.pool ?? true,
      wifi: r.wifi ?? true,
      accessibilityFeatures: r.accessibilityFeatures || [],
      childFriendly: r.childFriendly ?? true,
      sustainabilityRating: r.sustainabilityRating || 'Standard Luxury Rating',
      emergencyContact: r.emergencyContact || 'Property Front Desk',
      nightManager: r.nightManager || '',
      cancellationPolicy: r.cancellationPolicy || 'Standard hotel cancel policy',
      internalNotesHotel: r.internalNotesHotel || r.notes || ''
    });
    setEditingRoomId(r.id);
  };

  const calcNights = (cin: string, cout: string) => {
    if (!cin || !cout) return 1;
    const d1 = new Date(cin);
    const d2 = new Date(cout);
    if (d2 <= d1) return 1;
    return Math.round((d2.getTime() - d1.getTime()) / 86400000);
  };

  const handleCinCoutChange = (field: 'cin' | 'cout', val: string) => {
    const cin = field === 'cin' ? val : rForm.cin || '';
    const cout = field === 'cout' ? val : rForm.cout || '';
    const nights = calcNights(cin, cout);
    setRForm({ ...rForm, [field]: val, nights });
  };

  const handleSaveRoom = () => {
    if (!rForm.hotel) {
      alert('Hotel Property Name is required.');
      return;
    }

    // Auto calculate retail sum from allocated rooms if present
    let totalRoomPrice = rForm.rate || 0;
    if (rForm.allocatedRooms && rForm.allocatedRooms.length > 0) {
      totalRoomPrice = rForm.allocatedRooms.reduce((acc, rm) => acc + (rm.price || 0), 0);
    }

    const savedRoom: Room = {
      id: rForm.id || Date.now(),
      hotel: rForm.hotel,
      conf: rForm.conf || '',
      pay: rForm.pay || 'Unpaid',
      roomType: rForm.allocatedRooms?.[0]?.roomType || rForm.roomType || 'Standard',
      bed: rForm.allocatedRooms?.[0]?.roomName || rForm.bed || 'King',
      meal: rForm.allocatedRooms?.[0]?.mealBasis || rForm.meal || 'B&B',
      cin: rForm.cin || '',
      cout: rForm.cout || '',
      nights: Number(rForm.nights) || 1,
      guestIds: rForm.allocatedRooms 
        ? Array.from(new Set(rForm.allocatedRooms.flatMap(rm => rm.guestIds))) 
        : rForm.guestIds || [],
      rate: totalRoomPrice,
      supp: Number(rForm.supp) || 0,
      reqs: rForm.reqs || [],
      notes: rForm.notes || '',

      // Expanded Operational Properties
      allocatedRooms: rForm.allocatedRooms || [],
      gpsLocation: rForm.gpsLocation || '',
      checkInTime: rForm.checkInTime || '',
      checkOutTime: rForm.checkOutTime || '',
      amenities: rForm.amenities || [],
      restaurants: rForm.restaurants || [],
      spa: rForm.spa || false,
      gym: rForm.gym || false,
      pool: rForm.pool || false,
      wifi: rForm.wifi || false,
      accessibilityFeatures: rForm.accessibilityFeatures || [],
      childFriendly: rForm.childFriendly || false,
      sustainabilityRating: rForm.sustainabilityRating || '',
      emergencyContact: rForm.emergencyContact || '',
      nightManager: rForm.nightManager || '',
      cancellationPolicy: rForm.cancellationPolicy || '',
      internalNotesHotel: rForm.internalNotesHotel || ''
    };

    if (editingRoomId === -1) {
      onAddRoom(savedRoom);
    } else {
      onUpdateRoom(savedRoom.id, savedRoom);
    }
    setEditingRoomId(null);
    setRForm({});
  };

  // QUICK BOOK INTEGRATION
  const handleQuickBookSave = () => {
    if (!state.client.startDate || !state.client.endDate) {
      alert("Please establish trip start/end dates in the Intake section first.");
      return;
    }
    const cin = state.client.startDate;
    const cout = state.client.endDate;
    const nights = calcNights(cin, cout);

    const selectedGuestsIds = state.guests.slice(0, qbGuestsCount).map(g => g.id);

    const newR: Room = {
      id: Date.now(),
      hotel: qbHotel,
      conf: `QB-${Math.floor(10000 + Math.random() * 90000)}`,
      pay: 'Deposit Paid',
      roomType: qbRoomType,
      bed: 'King Bed',
      meal: qbMeal,
      cin,
      cout,
      nights,
      guestIds: selectedGuestsIds,
      rate: qbRate,
      supp: 0,
      reqs: ["Quiet Side"],
      notes: "Auto-provisioned via DMC Quick Booking Desk.",
      allocatedRooms: [
        {
          id: Date.now() + 1,
          roomName: `${qbRoomType} Booking`,
          roomType: qbRoomType,
          occupancy: qbGuestsCount === 2 ? 'Couple' : 'Friends sharing',
          maxOccupancy: qbGuestsCount,
          adults: qbGuestsCount,
          children: 0,
          price: qbRate,
          currency: 'ZAR',
          mealBasis: qbMeal,
          isAccessible: false,
          isInterleading: false,
          hasPrivatePool: false,
          hasBalcony: true,
          view: 'Standard Panoramic View',
          smokingPolicy: 'Non-smoking',
          specialBenefits: 'DMC priority room allocation',
          internalNotes: 'Urgent confirmed operations dispatch.',
          guestIds: selectedGuestsIds
        }
      ],
      gpsLocation: '-33.9015, 18.4239',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      spa: true,
      gym: true,
      pool: true,
      wifi: true,
      amenities: ['Pool', 'Wi-Fi'],
      accessibilityFeatures: [],
      emergencyContact: 'Hotel Duty Manager',
      internalNotesHotel: 'Check dietary profile matches on check-in card.'
    };

    onAddRoom(newR);
    setShowQuickBook(false);
  };

  // Allocate Room Form Helpers
  const handleOpenAllocRoomModal = (index?: number) => {
    if (index !== undefined && rForm.allocatedRooms?.[index]) {
      setAllocRoomForm({ ...rForm.allocatedRooms[index] });
      setEditingAllocRoomIndex(index);
    } else {
      setAllocRoomForm({
        id: Date.now(),
        roomName: `Suite Room ${rForm.allocatedRooms ? rForm.allocatedRooms.length + 1 : 1}`,
        roomType: 'Deluxe Suite',
        occupancy: 'Couple',
        maxOccupancy: 2,
        adults: 2,
        children: 0,
        price: 8500,
        currency: 'ZAR',
        mealBasis: 'B&B',
        isAccessible: false,
        isInterleading: false,
        hasPrivatePool: false,
        hasBalcony: true,
        view: 'Garden View',
        smokingPolicy: 'Non-smoking',
        specialBenefits: '',
        internalNotes: '',
        guestIds: []
      });
      setEditingAllocRoomIndex(null);
    }
    setShowRoomAllocModal(true);
  };

  const handleSaveAllocRoom = () => {
    if (!allocRoomForm.roomName) {
      alert('Room Name/Label is required.');
      return;
    }

    const currentRooms = rForm.allocatedRooms ? [...rForm.allocatedRooms] : [];
    const savedRoom: AllocatedRoom = {
      id: allocRoomForm.id || Date.now(),
      roomName: allocRoomForm.roomName,
      roomType: allocRoomForm.roomType || 'Standard',
      occupancy: allocRoomForm.occupancy || 'Couple',
      maxOccupancy: Number(allocRoomForm.maxOccupancy) || 2,
      adults: Number(allocRoomForm.adults) || 2,
      children: Number(allocRoomForm.children) || 0,
      price: Number(allocRoomForm.price) || 0,
      currency: allocRoomForm.currency || 'ZAR',
      mealBasis: allocRoomForm.mealBasis || 'B&B',
      isAccessible: allocRoomForm.isAccessible || false,
      isInterleading: allocRoomForm.isInterleading || false,
      hasPrivatePool: allocRoomForm.hasPrivatePool || false,
      hasBalcony: allocRoomForm.hasBalcony || false,
      view: allocRoomForm.view || 'Bush View',
      smokingPolicy: allocRoomForm.smokingPolicy || 'Non-smoking',
      specialBenefits: allocRoomForm.specialBenefits || '',
      internalNotes: allocRoomForm.internalNotes || '',
      guestIds: allocRoomForm.guestIds || []
    };

    if (editingAllocRoomIndex !== null) {
      currentRooms[editingAllocRoomIndex] = savedRoom;
    } else {
      currentRooms.push(savedRoom);
    }

    setRForm({ ...rForm, allocatedRooms: currentRooms });
    setShowRoomAllocModal(false);
    setAllocRoomForm({});
    setEditingAllocRoomIndex(null);
  };

  const handleRemoveAllocRoom = (index: number) => {
    if (confirm("Remove this room allocation?")) {
      const currentRooms = rForm.allocatedRooms ? [...rForm.allocatedRooms] : [];
      currentRooms.splice(index, 1);
      setRForm({ ...rForm, allocatedRooms: currentRooms });
    }
  };

  const toggleAllocRoomGuest = (gId: number) => {
    const list = allocRoomForm.guestIds ? [...allocRoomForm.guestIds] : [];
    const updated = list.includes(gId) ? list.filter(id => id !== gId) : [...list, gId];
    setAllocRoomForm({ ...allocRoomForm, guestIds: updated });
  };

  const toggleStayAmenity = (amenity: string) => {
    const list = rForm.amenities ? [...rForm.amenities] : [];
    const updated = list.includes(amenity) ? list.filter(a => a !== amenity) : [...list, amenity];
    setRForm({ ...rForm, amenities: updated });
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
            <Hotel size={14} /> ACCOMMODATION CONTROL CORRIDOR
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Lodging Properties & Room Allocations</h1>
          <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">
            Link 5-Star luxury properties, private reserves, and wilderness bush camps. Configure intelligent room types, occupancy capacities, and specific layout configurations.
          </p>
        </div>
        
        {editingRoomId === null && (
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setShowQuickBook(!showQuickBook)} 
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#D4AF37] text-[#1A3326] bg-yellow-50 hover:bg-yellow-100 text-xs font-bold shadow-sm transition"
            >
              <Briefcase size={14} className="text-[#D4AF37]" /> Quick booking Desk
            </button>
            <button 
              onClick={handleOpenAddForm} 
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-bold shadow-md hover:translate-y-[-1px] transition duration-150"
            >
              <Plus size={14} /> Link Luxury Stay
            </button>
          </div>
        )}
      </div>

      {/* QUICK BOOK PANEL */}
      {showQuickBook && (
        <div className="bg-gradient-to-br from-[#1A3326] to-[#12241b] text-white rounded-[24px] p-6 md:p-8 shadow-xl border border-[#D4AF37]/20 space-y-6 animate-in slide-in-from-top duration-300 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block mb-1">Instant Preset Provisioning</span>
              <h3 className="text-lg md:text-xl font-bold font-sans flex items-center gap-2">
                <Hotel size={18} className="text-[#D4AF37]" /> Quick Booking Desk
              </h3>
            </div>
            <button onClick={() => setShowQuickBook(false)} className="text-xs text-gray-400 hover:text-white underline">Dismiss</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 text-xs">
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-gray-300 font-semibold uppercase tracking-wider block">Hotel Property</label>
              <select 
                value={qbHotel} 
                onChange={e => setQbHotel(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-1 focus:ring-[#D4AF37] transition font-medium"
              >
                {DB_DEFAULT.hotels.map(h => (
                  <option key={h.id} value={h.name} className="text-[#1A3326] font-medium">{h.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold uppercase tracking-wider block">Room Tier</label>
              <select 
                value={qbRoomType} 
                onChange={e => setQbRoomType(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-1 focus:ring-[#D4AF37] transition font-medium"
              >
                <option value="Deluxe Suite" className="text-[#1A3326]">Deluxe Suite</option>
                <option value="Superior Villa" className="text-[#1A3326]">Superior Villa</option>
                <option value="Presidential Suite" className="text-[#1A3326]">Presidential Suite</option>
                <option value="Safari Tent Lodge" className="text-[#1A3326]">Safari Tent Lodge</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold uppercase tracking-wider block">Meal Basis</label>
              <select 
                value={qbMeal} 
                onChange={e => setQbMeal(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-1 focus:ring-[#D4AF37] transition font-medium"
              >
                <option value="B&B" className="text-[#1A3326]">Bed & Breakfast</option>
                <option value="Half Board" className="text-[#1A3326]">Half Board (HB)</option>
                <option value="Full Board" className="text-[#1A3326]">Full Board (Inclusive)</option>
                <option value="All Inclusive" className="text-[#1A3326]">All Inclusive (Premium)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold uppercase tracking-wider block">Mapped Guests</label>
              <select 
                value={qbGuestsCount} 
                onChange={e => setQbGuestsCount(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-1 focus:ring-[#D4AF37] transition font-medium"
              >
                <option value={1} className="text-[#1A3326]">1 Guest</option>
                <option value={2} className="text-[#1A3326]">2 Guests (Double)</option>
                <option value={3} className="text-[#1A3326]">3 Guests</option>
                <option value={4} className="text-[#1A3326]">4 Guests</option>
                <option value={state.guests.length} className="text-[#1A3326]">All ({state.guests.length}) Guests</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold uppercase tracking-wider block">Nightly Net Rate (R)</label>
              <input 
                type="number" 
                value={qbRate} 
                onChange={e => setQbRate(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-1 focus:ring-[#D4AF37] transition font-bold" 
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button 
              onClick={handleQuickBookSave} 
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#D4AF37] text-[#1A3326] hover:bg-[#b89528] text-xs font-bold shadow-md hover:translate-y-[-1px] transition-all"
            >
              Link Instant Accommodation Room
            </button>
          </div>
        </div>
      )}

      {/* DETAILED WORKSPACE FORM */}
      {editingRoomId !== null && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A3326] to-[#224433] text-white p-6 md:p-8 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block mb-1">Interactive Property Rooming</span>
              <h2 className="text-xl md:text-2xl font-bold font-sans flex items-center gap-2">
                <Hotel size={20} className="text-[#D4AF37]" />
                {editingRoomId === -1 ? 'Link Luxury Stay Property' : 'Update Stay Property'}
              </h2>
            </div>
            <div className="flex gap-3 text-xs">
              <button 
                onClick={() => setEditingRoomId(null)} 
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveRoom} 
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#1A3326] hover:bg-[#b89528] font-bold shadow-sm hover:translate-y-[-1px] transition-all"
              >
                Save Stay Rules
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-gray-50/50">
            
            {/* GROUP 1: Property Operational Information */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Compass size={14} className="text-[#D4AF37]" /> Property Knowledge Object
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Property Hotel Name</label>
                  <input 
                    type="text" 
                    value={rForm.hotel || ''} 
                    onChange={e => setRForm({ ...rForm, hotel: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                    placeholder="e.g. The Silo Hotel"
                    list="hotels-list"
                  />
                  <datalist id="hotels-list">
                    {DB_DEFAULT.hotels.map(h => <option key={h.id} value={h.name} />)}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Property confirmation voucher ID</label>
                  <input 
                    type="text" 
                    value={rForm.conf || ''} 
                    onChange={e => setRForm({ ...rForm, conf: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 uppercase focus:border-[#D4AF37] transition duration-200" 
                    placeholder="SIL-77621B" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">GPS Coordinates</label>
                  <input 
                    type="text" 
                    value={rForm.gpsLocation || ''} 
                    onChange={e => setRForm({ ...rForm, gpsLocation: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="e.g. -33.9015, 18.4239" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Standard Check-In Time</label>
                  <input 
                    type="text" 
                    value={rForm.checkInTime || '14:00'} 
                    onChange={e => setRForm({ ...rForm, checkInTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="e.g. 14:00" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Standard Check-Out Time</label>
                  <input 
                    type="text" 
                    value={rForm.checkOutTime || '11:00'} 
                    onChange={e => setRForm({ ...rForm, checkOutTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="e.g. 11:00" 
                  />
                </div>

              </div>
            </div>

            {/* GROUP 2: Booking Schedule */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Calendar size={14} className="text-[#D4AF37]" /> Stay Schedule & Duration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Check-in Date</label>
                  <input 
                    type="date" 
                    value={rForm.cin || ''} 
                    onChange={e => handleCinCoutChange('cin', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Check-out Date</label>
                  <input 
                    type="date" 
                    value={rForm.cout || ''} 
                    onChange={e => handleCinCoutChange('cout', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Total Stayout Nights</label>
                  <div className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-[#1A3326] bg-emerald-50/50 flex items-center justify-between">
                    <span>Nights Logged:</span>
                    <strong>{rForm.nights} Nights</strong>
                  </div>
                </div>

              </div>
            </div>

            {/* INTELLIGENT ROOM ALLOCATION DESK */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider flex items-center gap-2">
                  <Layers size={14} className="text-[#D4AF37]" /> Intelligent Room Allocations
                </h3>
                <button 
                  type="button"
                  onClick={() => handleOpenAllocRoomModal()}
                  className="px-3.5 py-1.5 rounded-xl bg-yellow-50 text-[#1A3326] border border-[#D4AF37]/30 hover:bg-yellow-100 text-[10px] font-bold transition flex items-center gap-1"
                >
                  <Plus size={10} /> Add Room Allocation
                </button>
              </div>

              {(!rForm.allocatedRooms || rForm.allocatedRooms.length === 0) ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                  <span className="text-xs text-gray-400 italic block">No specific room allocations registered. Click 'Add Room Allocation' to configure.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rForm.allocatedRooms.map((rm, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-gray-200 rounded-2xl relative space-y-3 hover:border-gray-300 transition duration-150">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-black uppercase text-[#D4AF37]">{rm.roomType} • {rm.mealBasis}</span>
                          <h4 className="font-bold text-gray-950 text-xs">{rm.roomName}</h4>
                        </div>
                        <div className="flex gap-1.5">
                          <button 
                            type="button"
                            onClick={() => handleOpenAllocRoomModal(idx)}
                            className="p-1 rounded bg-white border border-gray-200 text-gray-500 hover:text-gray-900"
                            title="Edit allocation"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRemoveAllocRoom(idx)}
                            className="p-1 rounded bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white"
                            title="Remove allocation"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-500">
                        <span>Capacity: <strong className="text-gray-800">{rm.adults}A / {rm.children}C</strong></span>
                        <span>View: <strong className="text-gray-800">{rm.view}</strong></span>
                        <span>Bed Configuration: <strong className="text-gray-800">{rm.occupancy}</strong></span>
                        <span>Smoking: <strong className="text-gray-800">{rm.smokingPolicy}</strong></span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {rm.isAccessible && <span className="text-[8px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded uppercase">Accessible</span>}
                        {rm.isInterleading && <span className="text-[8px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded uppercase">Interleading</span>}
                        {rm.hasPrivatePool && <span className="text-[8px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Private Pool</span>}
                        {rm.hasBalcony && <span className="text-[8px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded uppercase">Balcony</span>}
                      </div>

                      <div className="border-t border-gray-200 pt-2 text-[10px] space-y-1">
                        <div>
                          <span className="text-gray-400 font-bold uppercase text-[9px] block">Assigned Travelers:</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {rm.guestIds.length === 0 ? (
                              <span className="text-rose-500 italic text-[9px]">Unassigned Room!</span>
                            ) : (
                              state.guests.filter(g => rm.guestIds.includes(g.id)).map(g => (
                                <span key={g.id} className="bg-white border border-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-semibold">{g.first} {g.last}</span>
                              ))
                            )}
                          </div>
                        </div>
                        {rm.internalNotes && (
                          <div className="text-[9px] text-gray-500 italic mt-1 bg-yellow-50/50 p-1.5 rounded">
                            {rm.internalNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GROUP 3: Settlement Status */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Clock size={14} className="text-[#D4AF37]" /> Stay Settlement & Voucher Options
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Settlement Status</label>
                  <select 
                    value={rForm.pay || 'Unpaid'}
                    onChange={e => setRForm({ ...rForm, pay: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                  >
                    <option value="Unpaid">Unpaid / Awaiting Voucher</option>
                    <option value="Deposit Paid">Deposit Paid (DMC Hold)</option>
                    <option value="Fully Paid">Fully Vouchered / Pre-paid</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Property Eco/Sustainability Rating</label>
                  <input 
                    type="text" 
                    value={rForm.sustainabilityRating || ''} 
                    onChange={e => setRForm({ ...rForm, sustainabilityRating: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="e.g. Fair Trade Tourism certified, Carbon Neutral lodge" 
                  />
                </div>

              </div>
            </div>

            {/* GROUP 4: Emergency Contacts & Cancellation Rules */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <ShieldAlert size={14} className="text-[#D4AF37]" /> Emergency Coordination & Cancellation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Property Emergency Contact Name</label>
                  <input 
                    type="text" 
                    value={rForm.emergencyContact || ''} 
                    onChange={e => setRForm({ ...rForm, emergencyContact: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="Duty Manager / Front Desk" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Night Manager / Hotline Phone</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Phone size={12} />
                    </span>
                    <input 
                      type="text" 
                      value={rForm.nightManager || ''} 
                      onChange={e => setRForm({ ...rForm, nightManager: e.target.value })}
                      className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                      placeholder="+27 21 061 1600" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Emergency Coordinates / Heliport</label>
                  <input 
                    type="text" 
                    value={rForm.gpsLocation || ''} 
                    disabled
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 text-gray-400"
                    placeholder="Locked GPS Location" 
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block text-rose-600">Cancellation Policy & Penalty Rules</label>
                  <textarea 
                    value={rForm.cancellationPolicy || ''} 
                    onChange={e => setRForm({ ...rForm, cancellationPolicy: e.target.value })}
                    rows={2}
                    className="w-full p-3.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37] transition"
                    placeholder="Detail specific DMC-hotel contracted cancellation rules..."
                  />
                </div>
              </div>
            </div>

            {/* GROUP 5: Operational Notes (Role Specific) */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <FileText size={14} className="text-[#D4AF37]" /> Role-Specific Hotel Operational Notes (Internal)
              </h3>
              <p className="text-[11px] text-gray-400">
                These notes remain strictly internal and are dispatched exclusively to hotel management for ground execution. They never appear in the client-facing itinerary.
              </p>
              <textarea 
                value={rForm.internalNotesHotel || ''} 
                onChange={e => setRForm({ ...rForm, internalNotesHotel: e.target.value })}
                className="w-full p-4 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#D4AF37] transition text-[#1A3326]"
                placeholder="e.g. VIP client honeymoon champagne set up, check dietary profile allergen matching on card..."
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

          </div>

          {/* Sticky footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3.5">
            <button 
              onClick={() => setEditingRoomId(null)} 
              className="px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-sm transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveRoom} 
              className="px-6 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-extrabold shadow-md hover:translate-y-[-1px] transition duration-150"
            >
              Save Stay Rules
            </button>
          </div>

        </div>
      )}

      {/* REGISTERED STAYS & ALLOCATIONS GRID */}
      <div className="space-y-6">
        {state.rooms.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-[24px] shadow-sm max-w-lg mx-auto w-full space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-50 text-[#065f46] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Hotel size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 text-sm">No Luxury Property Stays Added</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Connect property reservations, lodging, safari wilderness camps and custom room allocations.
              </p>
            </div>
            <button 
              onClick={handleOpenAddForm} 
              className="px-4 py-2.5 bg-[#1A3326] text-white rounded-xl text-xs font-bold shadow hover:bg-[#12241b] transition"
            >
              Configure First Luxury Stay
            </button>
          </div>
        ) : (
          state.rooms.map(r => {
            const hasAllocations = r.allocatedRooms && r.allocatedRooms.length > 0;
            // Total cost is sum of allocated rooms or flat stay rate
            const totalCost = hasAllocations 
              ? r.allocatedRooms!.reduce((sum, rm) => sum + (rm.price || 0), 0)
              : r.rate || 0;

            const assignedPaxIds = hasAllocations 
              ? Array.from(new Set(r.allocatedRooms!.flatMap(rm => rm.guestIds)))
              : r.guestIds || [];

            const assignedPax = state.guests.filter(g => assignedPaxIds.includes(g.id));

            return (
              <div 
                key={r.id} 
                className="bg-white rounded-[24px] border border-gray-100 shadow-xs hover:shadow-sm transition-all duration-300 relative overflow-hidden p-6 md:p-8"
              >
                {/* Gold-lined indicator bar */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D4AF37]" />

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-gray-100 pb-5 mb-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#065f46] flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                      <Hotel size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-[#1A3326] text-white px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          DMC CONTRACTED PROPOSAL
                        </span>
                        {r.sustainabilityRating && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded border border-emerald-100 font-semibold flex items-center gap-1">
                            <Sparkles size={10} /> Eco Certified
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-gray-950 text-lg mt-1 font-sans">{r.hotel}</h3>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 font-medium mt-1">
                        <span className="flex items-center gap-1"><MapPin size={11} className="text-gray-400" /> GPS: {r.gpsLocation || 'No coordinates locked'}</span>
                        <span className="flex items-center gap-1"><Clock size={11} className="text-gray-400" /> Check-in: {r.checkInTime || '14:00'} • Check-out: {r.checkOutTime || '11:00'}</span>
                        <span className="flex items-center gap-1 font-mono text-[10px]">Conf Reference: <strong className="text-gray-900">{r.conf || 'PENDING'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end lg:self-start">
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Pre-computed Valuation</span>
                      <strong className="block text-lg font-black text-[#1A3326]">R {(totalCost * r.nights).toLocaleString()}</strong>
                      <span className="text-[9px] text-gray-500 font-medium block">R {totalCost.toLocaleString()} per Night / {r.nights} Nights</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleEditRoom(r)} 
                        className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 flex items-center justify-center transition shadow-xs"
                        title="Edit Stay"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => onRemoveRoom(r.id)} 
                        className="w-9 h-9 rounded-xl border border-rose-100 bg-rose-50/20 text-rose-500 hover:text-white hover:bg-rose-500 flex items-center justify-center transition shadow-xs"
                        title="Remove Stay"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Allocated Rooms Sub-Section */}
                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 block">Allocated Room Dossiers ({r.allocatedRooms?.length || 0})</span>
                  
                  {!hasAllocations ? (
                    <div className="p-4 bg-slate-50 border border-gray-100 rounded-2xl text-center text-xs text-gray-400 italic">
                      No intelligent room allocations. Click edit to register details.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {r.allocatedRooms!.map((rm, idx) => {
                        const rPax = state.guests.filter(g => rm.guestIds.includes(g.id));
                        return (
                          <div key={idx} className="p-4 rounded-2xl bg-slate-50/50 border border-gray-100 hover:bg-slate-50 transition duration-150 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[8px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded uppercase font-bold">{rm.roomType}</span>
                                  <h4 className="font-bold text-gray-950 text-xs mt-1">{rm.roomName}</h4>
                                </div>
                                <span className="font-bold text-[11px] text-[#1A3326]">R {rm.price.toLocaleString()}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-gray-500 font-semibold">
                                <span>Meal: <strong className="text-[#1A3326] font-bold">{rm.mealBasis}</strong></span>
                                <span>View: <strong className="text-gray-700 font-bold">{rm.view}</strong></span>
                                <span>Max Pax: <strong className="text-gray-700 font-bold">{rm.maxOccupancy} Max</strong></span>
                                <span>Style: <strong className="text-gray-700 font-bold">{rm.occupancy}</strong></span>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {rm.isAccessible && <span className="text-[8px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded uppercase">Accessible</span>}
                                {rm.isInterleading && <span className="text-[8px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded uppercase">Interleading</span>}
                                {rm.hasPrivatePool && <span className="text-[8px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Private Pool</span>}
                                {rm.hasBalcony && <span className="text-[8px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded uppercase">Balcony</span>}
                              </div>
                            </div>

                            <div className="border-t border-gray-100 pt-3 mt-3 text-[10px]">
                              <span className="text-gray-400 uppercase text-[9px] block mb-1">Lodged Travelers:</span>
                              {rPax.length === 0 ? (
                                <span className="text-rose-500 italic text-[9px]">Unassigned Room!</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {rPax.map(gp => (
                                    <span key={gp.id} className="bg-white border border-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-semibold">{gp.first} {gp.last}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Operations Emergency Guidelines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100 text-[11px]">
                  <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block mb-1">Stay Emergency Hotline</span>
                    <strong className="text-[#1A3326] block">{r.emergencyContact || 'Duty Desk Manager'}</strong>
                    <span className="text-gray-500 font-medium">{r.nightManager || 'No phone registered'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block mb-1">Contract Cancellation Policy</span>
                    <p className="text-gray-600 font-medium leading-relaxed max-h-[50px] overflow-y-auto pr-1">
                      {r.cancellationPolicy || 'Standard hotel cancel rules apply.'}
                    </p>
                  </div>
                </div>

                {/* Role Specific Internal Notes */}
                {r.internalNotesHotel && (
                  <div className="bg-yellow-50/50 border border-[#D4AF37]/15 p-4 rounded-xl text-[11px] text-gray-600 mt-4 italic space-y-1">
                    <strong className="text-xs text-[#1A3326] font-bold block not-italic">Viemma Operations Dispatch Notes (Internal only):</strong>
                    <p className="leading-relaxed">{r.internalNotesHotel}</p>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* ALLOCATED ROOM MODAL (Progressive disclosure popup inside Stay Form) */}
      {showRoomAllocModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[120] p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] uppercase font-black text-[#D4AF37] block">Lodge Allocation Editor</span>
                <h3 className="font-bold text-[#1A3326] text-sm">
                  {editingAllocRoomIndex !== null ? 'Modify Allocated Room Configuration' : 'Create New Room Allocation'}
                </h3>
              </div>
              <button onClick={() => setShowRoomAllocModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-grow">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block">Room Name / Label</label>
                  <input 
                    type="text" 
                    value={allocRoomForm.roomName || ''}
                    onChange={e => setAllocRoomForm({ ...allocRoomForm, roomName: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-[#D4AF37] text-xs font-semibold"
                    placeholder="e.g. East Bush Villa"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block">Room Type Tier</label>
                  <select 
                    value={allocRoomForm.roomType || 'Standard'}
                    onChange={e => setAllocRoomForm({ ...allocRoomForm, roomType: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                  >
                    {ROOM_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block">Sharing Configuration</label>
                  <select 
                    value={allocRoomForm.occupancy || 'Couple'}
                    onChange={e => setAllocRoomForm({ ...allocRoomForm, occupancy: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                  >
                    <option value="Couple">Couple (1 King Bed)</option>
                    <option value="Friends sharing">Friends Sharing (Twin Beds)</option>
                    <option value="Family sharing">Family Sharing (King + Bunk)</option>
                    <option value="Single Supplement">Single Supplement</option>
                    <option value="Guide Room">Guide Accommodation</option>
                    <option value="Driver Room">Driver Accommodation</option>
                    <option value="Staff lodging">Staff Lodging</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block">Max Occupancy</label>
                  <input 
                    type="number" 
                    value={allocRoomForm.maxOccupancy || 2}
                    onChange={e => setAllocRoomForm({ ...allocRoomForm, maxOccupancy: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block">Adults Count</label>
                  <input 
                    type="number" 
                    value={allocRoomForm.adults || 2}
                    onChange={e => setAllocRoomForm({ ...allocRoomForm, adults: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block">Children Count</label>
                  <input 
                    type="number" 
                    value={allocRoomForm.children || 0}
                    onChange={e => setAllocRoomForm({ ...allocRoomForm, children: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block">Net Price per Night</label>
                  <input 
                    type="number" 
                    value={allocRoomForm.price || 0}
                    onChange={e => setAllocRoomForm({ ...allocRoomForm, price: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block">Meal Basis</label>
                  <select 
                    value={allocRoomForm.mealBasis || 'B&B'}
                    onChange={e => setAllocRoomForm({ ...allocRoomForm, mealBasis: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                  >
                    {MEAL_PLAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block">Room View</label>
                  <input 
                    type="text" 
                    value={allocRoomForm.view || ''}
                    onChange={e => setAllocRoomForm({ ...allocRoomForm, view: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-xs font-semibold"
                    placeholder="e.g. Lagoon & Mountain view"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Layout Features</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border border-gray-100 rounded-lg bg-slate-50/50 hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      checked={allocRoomForm.isAccessible || false}
                      onChange={e => setAllocRoomForm({ ...allocRoomForm, isAccessible: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span>Accessible Layout</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border border-gray-100 rounded-lg bg-slate-50/50 hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      checked={allocRoomForm.isInterleading || false}
                      onChange={e => setAllocRoomForm({ ...allocRoomForm, isInterleading: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span>Interleading Rooms</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border border-gray-100 rounded-lg bg-slate-50/50 hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      checked={allocRoomForm.hasPrivatePool || false}
                      onChange={e => setAllocRoomForm({ ...allocRoomForm, hasPrivatePool: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span>Private Plunge Pool</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border border-gray-100 rounded-lg bg-slate-50/50 hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      checked={allocRoomForm.hasBalcony || false}
                      onChange={e => setAllocRoomForm({ ...allocRoomForm, hasBalcony: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span>Outdoor Balcony</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Assign Travelers to Room</span>
                <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-1 bg-slate-50 rounded-lg border border-gray-100">
                  {state.guests.length === 0 ? (
                    <span className="text-[10px] text-gray-400 italic">No travelers listed in main roster yet.</span>
                  ) : (
                    state.guests.map(g => {
                      const isSelected = allocRoomForm.guestIds?.includes(g.id);
                      return (
                        <span 
                          key={g.id}
                          onClick={() => toggleAllocRoomGuest(g.id)}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold cursor-pointer select-none transition ${
                            isSelected ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-200 text-gray-500'
                          }`}
                        >
                          {g.first} {g.last} ({g.age})
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase block">Room Special Benefits & Housekeeping notes</label>
                <input 
                  type="text" 
                  value={allocRoomForm.internalNotes || ''}
                  onChange={e => setAllocRoomForm({ ...allocRoomForm, internalNotes: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-[#D4AF37]"
                  placeholder="e.g. Honeymoon setup requested, extra towels, near the main dining room..."
                />
              </div>

            </div>

            <div className="p-5 border-t border-gray-100 bg-slate-50 shrink-0 flex justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => setShowRoomAllocModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[11px] font-bold text-gray-600 transition"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveAllocRoom}
                className="px-4 py-2 bg-[#1A3326] text-white rounded-lg text-[11px] font-bold hover:bg-[#12241b] transition shadow"
              >
                Save Room Allocation
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
