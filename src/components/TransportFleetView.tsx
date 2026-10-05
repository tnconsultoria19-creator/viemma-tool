import React, { useState } from 'react';
import { AppState, Vehicle } from '../types';
import { Truck, Plus, Shield, CheckCircle, AlertTriangle, Wrench, X, User } from 'lucide-react';

interface TransportFleetViewProps {
  state: AppState;
  onUpdateState: (updated: Partial<AppState>) => void;
}

export const TransportFleetView: React.FC<TransportFleetViewProps> = ({ state, onUpdateState }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(state.vehicles || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Vehicle['type']>('Minibus / Quantum');
  const [registration, setRegistration] = useState('');
  const [capacity, setCapacity] = useState(13);
  const [luggageCapacity, setLuggageCapacity] = useState(13);
  const [status, setStatus] = useState<Vehicle['status']>('Available');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newVehicle: Vehicle = {
      id: editingVehicle ? editingVehicle.id : `veh_${Date.now()}`,
      name,
      type,
      registration,
      capacity,
      luggageCapacity,
      assignedDriverId: assignedDriverId || undefined,
      status,
      notes,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop'
    };

    const updatedList = editingVehicle
      ? vehicles.map(v => v.id === editingVehicle.id ? newVehicle : v)
      : [...vehicles, newVehicle];

    setVehicles(updatedList);
    onUpdateState({ vehicles: updatedList });
    closeModal();
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setName('');
    setType('Minibus / Quantum');
    setRegistration('');
    setCapacity(13);
    setLuggageCapacity(13);
    setStatus('Available');
    setAssignedDriverId('');
    setNotes('');
    setImageUrl('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setName(v.name);
    setType(v.type);
    setRegistration(v.registration);
    setCapacity(v.capacity);
    setLuggageCapacity(v.luggageCapacity);
    setStatus(v.status);
    setAssignedDriverId(v.assignedDriverId || '');
    setNotes(v.notes);
    setImageUrl(v.imageUrl || '');
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this vehicle from the fleet?')) {
      const updatedList = vehicles.filter(v => v.id !== id);
      setVehicles(updatedList);
      onUpdateState({ vehicles: updatedList });
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingVehicle(null);
  };

  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'Available':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center gap-1"><CheckCircle size={10} /> Available</span>;
      case 'Assigned':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100 flex items-center gap-1"><User size={10} /> Assigned</span>;
      case 'In Service':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100 flex items-center gap-1"><Truck size={10} /> In Service</span>;
      case 'Maintenance':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-100 flex items-center gap-1"><Wrench size={10} /> Maintenance</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">Inactive</span>;
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <Truck size={20} />
            </div>
            <h1 className="text-xl font-bold font-serif text-[#1A3326]">Transport Fleet Management</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">Manage luxury vehicles, capacity specifications, registrations, and fleet statuses.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#234433] text-xs font-bold transition shadow-xs flex items-center gap-2"
        >
          <Plus size={14} className="text-[#D4AF37]" /> Add Vehicle
        </button>
      </div>

      {/* Fleet Grid */}
      {vehicles.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
            <Truck size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800">No Vehicles Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">Add your first tour vehicle, Mercedes V-Class, or luxury Quantum to start dispatching operations.</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#1A3326] text-white text-xs font-bold hover:bg-[#234433] transition shadow-xs inline-flex items-center gap-2"
          >
            <Plus size={14} className="text-[#D4AF37]" /> + Add Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => {
            const assignedDriver = state.drivers?.find(d => d.id === v.assignedDriverId || d.name === v.assignedDriverId);
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div>
                  {/* Vehicle Image header */}
                  <div className="h-40 w-full relative bg-gray-100 overflow-hidden">
                    <img 
                      src={v.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop'} 
                      alt={v.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(v.status)}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {v.type}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{v.name}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">Reg: {v.registration || 'Pending'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 text-xs">
                      <div className="bg-gray-50 p-2 rounded-xl">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Capacity</span>
                        <span className="font-bold text-gray-800">{v.capacity} Passengers</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-xl">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Luggage</span>
                        <span className="font-bold text-gray-800">{v.luggageCapacity} Large Bags</span>
                      </div>
                    </div>

                    {assignedDriver && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/50 text-emerald-900 text-xs">
                        <User size={14} className="text-emerald-700 shrink-0" />
                        <span className="font-bold truncate">Assigned Driver: {assignedDriver.name}</span>
                      </div>
                    )}

                    {v.notes && (
                      <p className="text-xs text-gray-500 italic bg-gray-50/50 p-2 rounded-xl line-clamp-2">"{v.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
                  <button
                    onClick={() => openEditModal(v)}
                    className="text-xs font-bold text-[#1A3326] hover:underline"
                  >
                    Edit Vehicle
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
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
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Vehicle Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Quantum #4"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Vehicle Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  >
                    <option value="Minibus / Quantum">Minibus / Quantum</option>
                    <option value="Mercedes V-Class">Mercedes V-Class</option>
                    <option value="Luxury SUV">Luxury SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Coach">Coach</option>
                    <option value="4x4 Safari">4x4 Safari</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Registration</label>
                  <input
                    type="text"
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                    placeholder="CA 123-456"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Passenger Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Luggage Capacity</label>
                  <input
                    type="number"
                    value={luggageCapacity}
                    onChange={(e) => setLuggageCapacity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Service">In Service</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Assign Driver</label>
                  <select
                    value={assignedDriverId}
                    onChange={(e) => setAssignedDriverId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  >
                    <option value="">-- No Driver Assigned --</option>
                    {state.drivers?.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Vehicle Photo URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Internal Fleet Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions, insurance details, or equipment checklist..."
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
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
