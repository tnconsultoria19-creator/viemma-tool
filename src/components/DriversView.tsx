import React, { useState } from 'react';
import { AppState, Driver } from '../types';
import { Users, Plus, Phone, Mail, Shield, CheckCircle, Clock, X, Truck, Award, AlertTriangle, Calendar, Check, AlertCircle } from 'lucide-react';

interface DriversViewProps {
  state: AppState;
  onUpdateState: (updated: Partial<AppState>) => void;
}

export const DriversView: React.FC<DriversViewProps> = ({ state, onUpdateState }) => {
  const [drivers, setDrivers] = useState<Driver[]>(state.drivers || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [prdpExpiryDate, setPrdpExpiryDate] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [status, setStatus] = useState<Driver['status']>('Available');
  const [operationalAvailability, setOperationalAvailability] = useState<Driver['operationalAvailability']>('Full-time');
  const [profileStatus, setProfileStatus] = useState<Driver['profileStatus']>('Active');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const getPrdpStatus = (expiryDate?: string) => {
    if (!expiryDate) {
      return { 
        status: 'none' as const, 
        label: 'PrDP Not Recorded', 
        badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: <Clock size={11} className="text-gray-400" />
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate + 'T00:00:00');
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'expired' as const, 
        label: `PrDP Expired (${Math.abs(diffDays)}d ago)`, 
        badgeClass: 'bg-red-50 text-red-800 border-red-200 font-bold',
        icon: <AlertCircle size={11} className="text-red-600" />
      };
    }
    if (diffDays <= 45) {
      return { 
        status: 'expiring' as const, 
        label: `PrDP Expiring Soon (${diffDays}d)`, 
        badgeClass: 'bg-amber-50 text-amber-900 border-amber-200 font-bold',
        icon: <AlertTriangle size={11} className="text-amber-600" />
      };
    }
    return { 
      status: 'valid' as const, 
      label: `PrDP Valid (Exp: ${expiryDate})`, 
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
      icon: <CheckCircle size={11} className="text-emerald-600" />
    };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDriver: Driver = {
      id: editingDriver ? editingDriver.id : `drv_${Date.now()}`,
      name: name.trim(),
      preferredName: preferredName.trim() || undefined,
      phone: phone.trim(),
      email: email.trim(),
      prdpExpiryDate: prdpExpiryDate || undefined,
      assignedVehicleId: assignedVehicleId || undefined,
      operationalAvailability: operationalAvailability || 'Full-time',
      status,
      profileStatus: profileStatus || 'Active',
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      notes: notes.trim(),
      photoUrl: photoUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'
    };

    const updatedList = editingDriver
      ? drivers.map(d => d.id === editingDriver.id ? newDriver : d)
      : [...drivers, newDriver];

    setDrivers(updatedList);
    onUpdateState({ drivers: updatedList });
    closeModal();
  };

  const openAddModal = () => {
    setEditingDriver(null);
    setName('');
    setPreferredName('');
    setPhone('');
    setEmail('');
    setPrdpExpiryDate('');
    setAssignedVehicleId('');
    setStatus('Available');
    setOperationalAvailability('Full-time');
    setProfileStatus('Active');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setNotes('');
    setPhotoUrl('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (d: Driver) => {
    setEditingDriver(d);
    setName(d.name);
    setPreferredName(d.preferredName || '');
    setPhone(d.phone);
    setEmail(d.email);
    setPrdpExpiryDate(d.prdpExpiryDate || '');
    setAssignedVehicleId(d.assignedVehicleId || '');
    setStatus(d.status);
    setOperationalAvailability(d.operationalAvailability || 'Full-time');
    setProfileStatus(d.profileStatus || 'Active');
    setEmergencyContactName(d.emergencyContactName || '');
    setEmergencyContactPhone(d.emergencyContactPhone || '');
    setNotes(d.notes);
    setPhotoUrl(d.photoUrl || '');
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this driver from the fleet directory?')) {
      const updatedList = drivers.filter(d => d.id !== id);
      setDrivers(updatedList);
      onUpdateState({ drivers: updatedList });
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingDriver(null);
  };

  const getStatusBadge = (status: Driver['status']) => {
    switch (status) {
      case 'Available':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center gap-1"><CheckCircle size={10} /> Available</span>;
      case 'Assigned':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100 flex items-center gap-1"><Truck size={10} /> Assigned</span>;
      case 'Off Duty':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 flex items-center gap-1"><Clock size={10} /> Off Duty</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-800">Unavailable</span>;
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <Users size={20} />
            </div>
            <h1 className="text-xl font-bold font-serif text-[#1A3326]">Professional Chauffeur & Driver Directory</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage professional drivers, PrDP compliance certifications, contact details, assigned vehicles, and operational duty statuses.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#234433] text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Plus size={14} className="text-[#D4AF37]" /> Add Professional Driver
        </button>
      </div>

      {/* Drivers Grid */}
      {drivers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
            <Users size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800">No Drivers Registered</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Add professional drivers with valid PrDP certifications and assigned vehicles to dispatch them to upcoming guest itineraries.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#1A3326] text-white text-xs font-bold hover:bg-[#234433] transition shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} className="text-[#D4AF37]" /> + Add Driver
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((d) => {
            const assignedVehicle = state.vehicles?.find(v => v.id === d.assignedVehicleId || v.name === d.assignedVehicleId);
            const prdpInfo = getPrdpStatus(d.prdpExpiryDate);

            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={d.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'} 
                      alt={d.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900">{d.name}</h3>
                        {d.preferredName && (
                          <span className="text-[10px] text-gray-400 font-medium italic">({d.preferredName})</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Driver profile</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(d.status)}
                    {d.profileStatus && d.profileStatus !== 'Active' && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                        {d.profileStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* PrDP & Certification Banner */}
                <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${prdpInfo.badgeClass}`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Shield size={13} className="shrink-0" />
                    <span className="truncate">
                      {d.prdpExpiryDate ? `PrDP expiry: ${d.prdpExpiryDate}` : 'PrDP expiration date not recorded'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-[10px]">
                    {prdpInfo.icon}
                    <span>{prdpInfo.label}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={14} className="text-emerald-700 shrink-0" />
                    <span className="font-medium">{d.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail size={14} className="text-emerald-700 shrink-0" />
                    <span className="font-medium truncate">{d.email || 'No email'}</span>
                  </div>

                  {assignedVehicle && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 text-emerald-900 text-[11px]">
                      <Truck size={14} className="text-emerald-700 shrink-0" />
                      <span className="font-bold truncate">Assigned Vehicle: {assignedVehicle.name}</span>
                    </div>
                  )}

                  {d.operationalAvailability && (
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span>Availability:</span>
                      <span className="font-semibold text-[#1A3326] bg-emerald-50 px-2 py-0.5 rounded-md">
                        {d.operationalAvailability}
                      </span>
                    </div>
                  )}

                  {d.emergencyContactName && (
                    <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-xl">
                      <span className="font-bold text-gray-700">Emergency:</span> {d.emergencyContactName} {d.emergencyContactPhone && `(${d.emergencyContactPhone})`}
                    </div>
                  )}

                  {d.notes && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 italic pt-1">
                      "{d.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <button
                    onClick={() => openEditModal(d)}
                    className="text-xs font-bold text-[#1A3326] hover:underline cursor-pointer"
                  >
                    Edit Driver Profile
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#FAF9F6]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#1A3326]">
                    {editingDriver ? 'Edit Driver & Chauffeur Profile' : 'Register New Professional Driver'}
                  </h3>
                  <p className="text-xs text-gray-500">Professional Driving Permit (PrDP) & Operator Roster</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* SECTION: Identity & Contact */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#1A3326] uppercase tracking-wider border-b pb-1">
                  1. Driver Identity & Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sipho Khumalo"
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Preferred Name / Callsign</label>
                    <input
                      type="text"
                      value={preferredName}
                      onChange={(e) => setPreferredName(e.target.value)}
                      placeholder="e.g. Sipho"
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Phone Number (Direct / WhatsApp)</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+27 60 555 1234"
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sipho@viemmatours.com"
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: PrDP Expiration & Compliance */}
              <div className="space-y-3 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className="text-emerald-800" />
                  <h4 className="text-[11px] font-bold text-[#1A3326] uppercase tracking-wider">2. PrDP Expiration & Compliance</h4>
                </div>
                <div className="space-y-1 max-w-sm">
                  <label className="font-bold text-gray-700">PrDP / PDP Expiration Date</label>
                  <input type="date" value={prdpExpiryDate} onChange={(e) => setPrdpExpiryDate(e.target.value)} className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-white" />
                  <p className="text-[10px] text-gray-500">The expiry date powers the valid, expiring-soon and expired status indicators.</p>
                </div>
              </div>

              {/* SECTION: Fleet Assignment & Operations */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#1A3326] uppercase tracking-wider border-b pb-1">
                  3. Operational Duty & Fleet Assignment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Duty Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                    >
                      <option value="Available">Available</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Availability</label>
                    <select
                      value={operationalAvailability}
                      onChange={(e) => setOperationalAvailability(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="On-Call">On-Call</option>
                      <option value="Weekend Only">Weekend Only</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Profile Status</label>
                    <select
                      value={profileStatus}
                      onChange={(e) => setProfileStatus(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending Verification">Pending Verification</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Assign Dedicated Vehicle</label>
                  <select
                    value={assignedVehicleId}
                    onChange={(e) => setAssignedVehicleId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  >
                    <option value="">-- No Dedicated Vehicle (Dispatch on demand) --</option>
                    {state.vehicles?.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.registration || v.capacity + ' seats'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION: Emergency & Notes */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#1A3326] uppercase tracking-wider border-b pb-1">
                  4. Emergency Contact & Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Nomusa Khumalo (Spouse)"
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Emergency Contact Phone</label>
                    <input
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="+27 83 555 9911"
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Profile Photo URL</label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Certifications, Language & Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="First Aid Level 2, Advanced Defensive Driving, fluent in English, Portuguese & Zulu..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1A3326] text-white font-bold hover:bg-[#234433] transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} className="text-[#D4AF37]" /> Save Driver Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
