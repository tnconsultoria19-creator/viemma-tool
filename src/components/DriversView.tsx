import React, { useState } from 'react';
import { AppState, Driver } from '../types';
import { Users, Plus, Phone, Mail, Shield, CheckCircle, Clock, X, Truck, Award } from 'lucide-react';

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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [status, setStatus] = useState<Driver['status']>('Available');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDriver: Driver = {
      id: editingDriver ? editingDriver.id : `drv_${Date.now()}`,
      name,
      phone,
      email,
      licenseNo,
      assignedVehicleId: assignedVehicleId || undefined,
      status,
      emergencyContactName,
      emergencyContactPhone,
      notes,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'
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
    setPhone('');
    setEmail('');
    setLicenseNo('');
    setAssignedVehicleId('');
    setStatus('Available');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setNotes('');
    setPhotoUrl('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (d: Driver) => {
    setEditingDriver(d);
    setName(d.name);
    setPhone(d.phone);
    setEmail(d.email);
    setLicenseNo(d.licenseNo);
    setAssignedVehicleId(d.assignedVehicleId || '');
    setStatus(d.status);
    setEmergencyContactName(d.emergencyContactName || '');
    setEmergencyContactPhone(d.emergencyContactPhone || '');
    setNotes(d.notes);
    setPhotoUrl(d.photoUrl || '');
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this driver?')) {
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
            <h1 className="text-xl font-bold font-serif text-[#1A3326]">Driver & Operator Directory</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">Manage professional drivers, guide certifications, contact numbers, and duty statuses.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#234433] text-xs font-bold transition shadow-xs flex items-center gap-2"
        >
          <Plus size={14} className="text-[#D4AF37]" /> Add Driver
        </button>
      </div>

      {/* Drivers Grid */}
      {drivers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
            <Users size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800">No Drivers Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">Add professional drivers and guides to assign them to upcoming transfers and itineraries.</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#1A3326] text-white text-xs font-bold hover:bg-[#234433] transition shadow-xs inline-flex items-center gap-2"
          >
            <Plus size={14} className="text-[#D4AF37]" /> + Add Driver
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((d) => {
            const assignedVehicle = state.vehicles?.find(v => v.id === d.assignedVehicleId || v.name === d.assignedVehicleId);
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={d.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'} 
                      alt={d.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-100"
                    />
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{d.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">Lic: {d.licenseNo || 'PDP Certified'}</p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(d.status)}
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
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 text-emerald-900">
                      <Truck size={14} className="text-emerald-700 shrink-0" />
                      <span className="font-bold truncate">Assigned Vehicle: {assignedVehicle.name}</span>
                    </div>
                  )}
                  {d.emergencyContactName && (
                    <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-xl">
                      <span className="font-bold text-gray-700">Emergency:</span> {d.emergencyContactName} ({d.emergencyContactPhone})
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <button
                    onClick={() => openEditModal(d)}
                    className="text-xs font-bold text-[#1A3326] hover:underline"
                  >
                    Edit Driver
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-xs font-bold text-red-600 hover:underline"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold font-serif text-[#1A3326]">
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Driver Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Michael Khumalo"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27 82 555 0147"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="michael@viemmatours.com"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">License / PDP No.</label>
                  <input
                    type="text"
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                    placeholder="PDP-983214"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Assign Vehicle</label>
                  <select
                    value={assignedVehicleId}
                    onChange={(e) => setAssignedVehicleId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  >
                    <option value="">-- No Vehicle Assigned --</option>
                    {state.vehicles?.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.registration})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Nomusa Khumalo"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1.5">
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

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Profile Photo URL</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Notes & Certifications</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="First aid certified, fluent in English & Zulu..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1A3326] text-white font-bold hover:bg-[#234433] transition shadow-xs"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
