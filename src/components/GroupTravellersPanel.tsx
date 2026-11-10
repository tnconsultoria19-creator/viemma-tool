import React, { useState } from 'react';
import { TripGroupStructure, TravellerRecord } from '../utils/argonDomainModel';
import { OperationalStatusPill } from './ui/OperationalStatusPill';
import { Trash2, UserPlus, CheckSquare, Square, Undo2 } from 'lucide-react';

interface GroupTravellersPanelProps {
  group: TripGroupStructure;
  onUpdateGroup: (nextGroup: TripGroupStructure) => void;
  onAssignTravellersToService?: (serviceType: 'flight' | 'room' | 'activity', travellerIds: string[]) => void;
}

export const GroupTravellersPanel: React.FC<GroupTravellersPanelProps> = ({
  group,
  onUpdateGroup,
  onAssignTravellersToService,
}) => {
  const [selectedTravellerIds, setSelectedTravellerIds] = useState<string[]>([]);
  const [lastDeletedSnapshot, setLastDeletedSnapshot] = useState<{
    group: TripGroupStructure;
    message: string;
    timeoutId: NodeJS.Timeout;
  } | null>(null);

  const toggleSelectAll = () => {
    if (selectedTravellerIds.length === group.travellers.length) {
      setSelectedTravellerIds([]);
    } else {
      setSelectedTravellerIds(group.travellers.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedTravellerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteTraveller = (id: string) => {
    const travellerToDelete = group.travellers.find((t) => t.id === id);
    if (!travellerToDelete) return;

    if (lastDeletedSnapshot) {
      clearTimeout(lastDeletedSnapshot.timeoutId);
    }

    const nextTravellers = group.travellers.filter((t) => t.id !== id);
    const nextGroup = { ...group, travellers: nextTravellers };

    const timeoutId = setTimeout(() => {
      setLastDeletedSnapshot(null);
    }, 10000);

    setLastDeletedSnapshot({
      group,
      message: `Removed ${travellerToDelete.fullName}. Service links updated.`,
      timeoutId,
    });

    onUpdateGroup(nextGroup);
    setSelectedTravellerIds((prev) => prev.filter((item) => item !== id));
  };

  const handleUndoDelete = () => {
    if (!lastDeletedSnapshot) return;
    clearTimeout(lastDeletedSnapshot.timeoutId);
    onUpdateGroup(lastDeletedSnapshot.group);
    setLastDeletedSnapshot(null);
  };

  return (
    <div className="space-y-4 relative">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            {selectedTravellerIds.length === group.travellers.length && group.travellers.length > 0 ? (
              <CheckSquare size={16} className="text-emerald-700" />
            ) : (
              <Square size={16} className="text-slate-400" />
            )}
            <span>Select All ({group.travellers.length})</span>
          </button>
        </div>

        {/* Selected Counter */}
        {selectedTravellerIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg">
            <span className="font-bold">{selectedTravellerIds.length} Selected</span>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              onClick={() => onAssignTravellersToService?.('flight', selectedTravellerIds)}
              className="hover:underline font-medium text-emerald-300"
            >
              Assign Flight
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onAssignTravellersToService?.('room', selectedTravellerIds)}
              className="hover:underline font-medium text-sky-300"
            >
              Assign Room
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onAssignTravellersToService?.('activity', selectedTravellerIds)}
              className="hover:underline font-medium text-amber-300"
            >
              Assign Activity
            </button>
          </div>
        )}
      </div>

      {/* Travellers List */}
      <div className="space-y-2">
        {group.travellers.map((traveller) => {
          const isSelected = selectedTravellerIds.includes(traveller.id);
          return (
            <div
              key={traveller.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                isSelected ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleSelectOne(traveller.id)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {isSelected ? <CheckSquare size={16} className="text-emerald-700" /> : <Square size={16} />}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">
                      {traveller.fullName}
                    </span>
                    {traveller.isLead && (
                      <span className="text-[10px] uppercase font-bold font-mono px-1.5 py-0.5 rounded bg-slate-900 text-white">
                        Lead Contact
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{traveller.category}</span>
                    <span>•</span>
                    <span>{traveller.nationality || 'Nationality TBC'}</span>
                    {traveller.email && (
                      <>
                        <span>•</span>
                        <span>{traveller.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <OperationalStatusPill
                  tier={traveller.missingFields.length > 0 ? 'critical' : traveller.isProvisional ? 'provisional' : 'confirmed'}
                  label={traveller.missingFields.length > 0 ? `${traveller.missingFields.length} Missing` : traveller.isProvisional ? 'Provisional' : 'Verified'}
                />

                {!traveller.isLead && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTraveller(traveller.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Remove traveller"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 10-Second Undo Toast */}
      {lastDeletedSnapshot && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
          <span className="text-xs font-medium">{lastDeletedSnapshot.message}</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer"
          >
            <Undo2 size={13} />
            <span>Undo (10s)</span>
          </button>
        </div>
      )}
    </div>
  );
};
