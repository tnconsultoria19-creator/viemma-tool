import React, { useState, useMemo } from 'react';
import { AppState, Activity, Guide, AttachmentItem, TravellerGroup } from '../types';
import { DB_DEFAULT } from '../dbDefaults';
import { DEFAULT_EXPERIENCES } from '../data/libraryDefaults';
import { AttachmentManager } from './AttachmentManager';
import { 
  Route, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Users, 
  Clock, 
  Compass, 
  Info,
  Calendar,
  Tag,
  AlertCircle,
  Phone,
  CloudSun,
  ShieldCheck,
  Camera,
  Layers,
  HelpCircle,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  Upload,
  Sparkles,
  Search,
  Copy,
  ArrowRight,
  ExternalLink,
  Filter,
  CheckCircle2,
  Sun,
  Sunset,
  Moon,
  SlidersHorizontal,
  Eye,
  BookOpen
} from 'lucide-react';

interface ActivitiesViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onAddActivity: (act: Activity) => void;
  onRemoveActivity: (id: number) => void;
  onUpdateActivity: (id: number, updates: Partial<Activity>) => void;
}

// Shared scheduling helpers: validate clock values and derive ends from stated durations.
const parseClockMinutes = (time?: string): number | null => {
  const match = (time || '').trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const parseDurationMinutes = (duration?: string): number | null => {
  const source = (duration || '').trim();
  if (!source) return null;
  const pattern = /(\d+(?:\.\d+)?)\s*(days?|d|hours?|hrs?|h|minutes?|mins?|m)\b/gi;
  let total = 0;
  let found = false;
  for (const match of source.matchAll(pattern)) {
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier = unit.startsWith('d') ? 1440
      : unit.startsWith('h') ? 60
      : 1;
    if (Number.isFinite(amount) && amount > 0) {
      total += amount * multiplier;
      found = true;
    }
  }
  return found ? Math.round(total) : null;
};

const deriveEndTime = (startTime: string, duration?: string): string => {
  const start = parseClockMinutes(startTime);
  const durationMinutes = parseDurationMinutes(duration);
  if (start === null || durationMinutes === null) return '';
  const end = start + durationMinutes;
  // This planner currently schedules within a single calendar day; do not silently wrap overnight.
  if (end >= 1440) return '';
  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
};

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  state,
  onUpdateState,
  onAddActivity,
  onRemoveActivity,
  onUpdateActivity
}) => {
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [aForm, setAForm] = useState<Partial<Activity>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'operational' | 'pricing' | 'pax' | 'attachments'>('basic');
  const [expandedActivityIds, setExpandedActivityIds] = useState<number[]>([]);
  const [activityValidationError, setActivityValidationError] = useState<string | null>(null);

  // Daily Programme & Activity Selection States
  const [viewMode, setViewMode] = useState<'daily' | 'dayfocus' | 'table' | 'participant'>('daily');
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'ALL'>('ALL');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [catalogDestination, setCatalogDestination] = useState('');
  const [catalogTargetDay, setCatalogTargetDay] = useState<number>(1);
  const [catalogTargetSlot, setCatalogTargetSlot] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Full Day'>('Morning');
  const [assigningActivityId, setAssigningActivityId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingDayTitleId, setEditingDayTitleId] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupManagerOpen, setGroupManagerOpen] = useState((state.namedGroups || []).length === 0);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [catalogTargetGroupIds, setCatalogTargetGroupIds] = useState<string[]>([]);
  const namedGroups = state.namedGroups || [];
  // Day titles are stored on the trip so they survive navigation and reloads.
  const customDayTitles = state.dayTitles || {};

  const getGroupRoster = (groupIds: string[]): number[] =>
    Array.from(new Set(namedGroups.filter(g => groupIds.includes(g.id)).flatMap(g => g.memberIds || [])));

  const countsForRoster = (paxIds: number[]) => {
    const adults = state.guests.filter(g => paxIds.includes(g.id) && g.age !== 'Child' && g.age !== 'Infant').length;
    const children = state.guests.filter(g => paxIds.includes(g.id) && (g.age === 'Child' || g.age === 'Infant')).length;
    return { adults, children };
  };

  const totalForRoster = (activity: Partial<Activity>, paxIds: number[]) => {
    if (activity.isFree) return 0;
    if (Number(activity.flat) > 0) return Number(activity.flat);
    const counts = countsForRoster(paxIds);
    return (Number(activity.pAdult) || 0) * counts.adults + (Number(activity.pChild) || 0) * counts.children;
  };

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) {
      setToastMessage('Enter a name for the traveller group.');
      return;
    }
    if (namedGroups.some(g => g.name.trim().toLowerCase() === name.toLowerCase())) {
      setToastMessage('A group with that name already exists.');
      return;
    }
    const group: TravellerGroup = {
      id: `group_${Date.now()}`,
      name,
      color: '#1A3326',
      memberIds: []
    };
    onUpdateState({ namedGroups: [...namedGroups, group] });
    setNewGroupName('');
    setSelectedGroupFilter(group.id);
    setCatalogTargetGroupIds(current => [...new Set([...current, group.id])]);
    setToastMessage(`Created group “${name}”. Select its members below.`);
  };

  const handleUpdateGroupMembers = (groupId: string, memberId: number, checked: boolean) => {
    const nextGroups = namedGroups.map(group => {
      if (group.id !== groupId) return group;
      const memberIds = checked
        ? Array.from(new Set([...(group.memberIds || []), memberId]))
        : (group.memberIds || []).filter(id => id !== memberId);
      return { ...group, memberIds, leaderId: !checked && group.leaderId === memberId ? undefined : group.leaderId };
    });
    const nextActivities = state.activities.map(activity => {
      const assignedGroupIds = activity.groupIds || [];
      if (!assignedGroupIds.includes(groupId)) return activity;
      const memberIdsForAssignedGroups: number[] = nextGroups
        .filter((g: TravellerGroup) => assignedGroupIds.includes(g.id))
        .flatMap((g: TravellerGroup) => g.memberIds || []);
      const paxIds: number[] = Array.from(new Set<number>(memberIdsForAssignedGroups));
      const counts = countsForRoster(paxIds);
      return {
        ...activity,
        paxIds,
        nAdult: counts.adults,
        nChild: counts.children,
        total: totalForRoster(activity, paxIds),
        updatedAt: new Date().toISOString()
      };
    });
    onUpdateState({ namedGroups: nextGroups, activities: nextActivities });
  };

  const handleUpdateGroupLeader = (groupId: string, leaderValue: string) => {
    const leaderId = leaderValue ? Number(leaderValue) : undefined;
    onUpdateState({
      namedGroups: namedGroups.map(group => group.id === groupId
        ? { ...group, leaderId: leaderId && (group.memberIds || []).includes(leaderId) ? leaderId : undefined }
        : group)
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = namedGroups.find(g => g.id === groupId);
    if (!group) return;
    if (typeof window !== 'undefined' && !window.confirm(`Delete “${group.name}”? Existing activity participant lists will be preserved.`)) return;
    const remainingGroups = namedGroups.filter(g => g.id !== groupId);
    const updatedActivities = state.activities.map(activity => {
      const oldGroupIds = activity.groupIds || [];
      const remainingGroupIds = oldGroupIds.filter(id => id !== groupId);
      // If an activity still belongs to other named groups, recalculate the roster from those
      // groups. If the deleted group was its only named assignment, preserve the saved roster.
      if (oldGroupIds.includes(groupId) && remainingGroupIds.length > 0) {
        const memberIds: number[] = remainingGroups
          .filter(g => remainingGroupIds.includes(g.id))
          .flatMap(g => g.memberIds || []);
        const paxIds = Array.from(new Set<number>(memberIds));
        const counts = countsForRoster(paxIds);
        return {
          ...activity,
          groupIds: remainingGroupIds,
          paxIds,
          nAdult: counts.adults,
          nChild: counts.children,
          total: totalForRoster(activity, paxIds),
          updatedAt: new Date().toISOString()
        };
      }
      return { ...activity, groupIds: remainingGroupIds };
    });
    onUpdateState({
      namedGroups: remainingGroups,
      activities: updatedActivities
    });
    setSelectedGroupFilter(current => current === groupId ? 'ALL' : current);
    setCatalogTargetGroupIds(current => current.filter(id => id !== groupId));
  };

  const matchesSelectedGroup = (activity: Activity, groupId = selectedGroupFilter) => {
    if (groupId === 'ALL') return true;
    if (groupId === 'UNASSIGNED') return !(activity.groupIds || []).length;
    const group = namedGroups.find(g => g.id === groupId);
    if (!group) return false;
    if (activity.groupIds?.length) return activity.groupIds.includes(groupId);
    return (activity.paxIds || []).some(id => (group.memberIds || []).includes(id));
  };

  const visibleActivities = state.activities.filter(activity => matchesSelectedGroup(activity));

  const handleToggleFormGroup = (groupId: string, checked: boolean) => {
    const currentGroupIds = aForm.groupIds || [];
    const groupIds = checked
      ? Array.from(new Set([...currentGroupIds, groupId]))
      : currentGroupIds.filter(id => id !== groupId);
    const paxIds = getGroupRoster(groupIds);
    const counts = countsForRoster(paxIds);
    setAForm({
      ...aForm,
      groupIds,
      paxIds,
      nAdult: counts.adults,
      nChild: counts.children,
      total: totalForRoster(aForm, paxIds)
    });
  };

  const guides = state.guides?.length ? state.guides : DB_DEFAULT.guides as Guide[];

  // Calculate total days of trip
  const tripDaysCount = useMemo(() => {
    let days = 6;
    if (state.client?.startDate && state.client?.endDate) {
      const s = new Date(state.client.startDate);
      const e = new Date(state.client.endDate);
      const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) days = diff;
    }
    const maxActDay = state.activities?.length ? Math.max(...state.activities.map(a => a.day || 1)) : 1;
    return Math.max(days, maxActDay);
  }, [state.client?.startDate, state.client?.endDate, state.activities]);

  const getDayFormattedDate = (dayNum: number) => {
    if (!state.client?.startDate) return `Day ${dayNum}`;
    const d = new Date(state.client.startDate);
    d.setDate(d.getDate() + (dayNum - 1));
    if (isNaN(d.getTime())) return `Day ${dayNum}`;
    return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDayIsoDate = (dayNum: number) => {
    if (!state.client?.startDate) return '';
    const d = new Date(state.client.startDate);
    d.setDate(d.getDate() + (dayNum - 1));
    return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
  };

  // Catalogue source (merging ExperienceLibrary with default catalog)
  const catalogueList = useMemo(() => {
    const list = state.experienceLibrary && state.experienceLibrary.length > 0 
      ? state.experienceLibrary 
      : DEFAULT_EXPERIENCES;
    return list;
  }, [state.experienceLibrary]);

  const filteredCatalogItems = useMemo(() => {
    return catalogueList.filter(item => {
      const matchesSearch = !catalogSearch || 
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (item.shortDescription || '').toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesCategory = !catalogCategory || item.category === catalogCategory;
      const matchesDest = !catalogDestination || item.destination === catalogDestination;
      return matchesSearch && matchesCategory && matchesDest;
    });
  }, [catalogueList, catalogSearch, catalogCategory, catalogDestination]);

  const catalogCategories = useMemo(() => {
    return Array.from(new Set(catalogueList.map(item => item.category).filter(Boolean)));
  }, [catalogueList]);

  const catalogDestinations = useMemo(() => {
    return Array.from(new Set(catalogueList.map(item => item.destination).filter(Boolean)));
  }, [catalogueList]);

  // Fast Actions
  const handleQuickStatusChange = (activityId: number, status: Activity['status']) => {
    onUpdateActivity(activityId, { status });
    setToastMessage(`Excursion status updated to "${status}"`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleMoveActivityToDay = (activityId: number, newDay: number) => {
    const newDate = getDayIsoDate(newDay);
    onUpdateActivity(activityId, {
      day: newDay,
      date: newDate
    });
    setToastMessage(`Moved excursion to Day ${newDay} (${getDayFormattedDate(newDay)})`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDuplicateActivity = (a: Activity, targetDayNum?: number) => {
    const destDay = targetDayNum || a.day;
    const cloned: Activity = {
      ...a,
      id: Date.now(),
      day: destDay,
      date: getDayIsoDate(destDay),
      name: `${a.name} (Copy)`,
      status: 'Planned'
    };
    onAddActivity(cloned);
    setToastMessage(`Duplicated excursion to Day ${destDay}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickAssignTravellers = (activityId: number, paxIds: number[]) => {
    const act = state.activities.find(a => a.id === activityId);
    if (!act) return;
    
    const adCount = state.guests.filter(g => paxIds.includes(g.id) && g.age !== 'Child' && g.age !== 'Infant').length;
    const chCount = state.guests.filter(g => paxIds.includes(g.id) && (g.age === 'Child' || g.age === 'Infant')).length;
    
    let newTotal = act.total;
    if (!act.isFree && !act.flat) {
      newTotal = (act.pAdult * adCount) + (act.pChild * chCount);
    }
    
    onUpdateActivity(activityId, {
      paxIds,
      groupIds: [],
      nAdult: adCount,
      nChild: chCount,
      total: newTotal,
      updatedAt: new Date().toISOString()
    });
    setToastMessage(`Updated participant roster (${paxIds.length} travellers assigned)`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleQuickAssignGroup = (activityId: number, groupId: string) => {
    const activity = state.activities.find(a => a.id === activityId);
    if (!activity) return;
    const currentIds = activity.groupIds || [];
    const nextIds = currentIds.includes(groupId) ? currentIds.filter(id => id !== groupId) : [...currentIds, groupId];
    const paxIds = getGroupRoster(nextIds);
    const counts = countsForRoster(paxIds);
    onUpdateActivity(activityId, {
      groupIds: nextIds,
      paxIds,
      nAdult: counts.adults,
      nChild: counts.children,
      total: totalForRoster(activity, paxIds),
      updatedAt: new Date().toISOString()
    });
    setToastMessage(nextIds.length
      ? `Assigned ${nextIds.map(id => namedGroups.find(g => g.id === id)?.name).filter(Boolean).join(', ')} to “${activity.name}”.`
      : `Removed named group assignments from “${activity.name}”.`);
  };

  const handleAddFromCatalog = (catalogItem: any, targetDayNum: number, slot: 'Morning' | 'Afternoon' | 'Evening' | 'Full Day', targetGroupIds: string[] = []) => {
    const slotTimes: Record<string, { start: string; end: string; pickup: string }> = {
      'Morning': { start: '09:00', end: '12:30', pickup: '08:30' },
      'Afternoon': { start: '14:00', end: '17:30', pickup: '13:30' },
      'Evening': { start: '18:30', end: '21:30', pickup: '18:00' },
      'Full Day': { start: '08:30', end: '17:00', pickup: '08:00' },
    };

    const times = slotTimes[slot] || slotTimes['Morning'];
    const durationEndTime = deriveEndTime(times.start, catalogItem.duration);
    const scheduledEndTime = durationEndTime || times.end;
    // Preserve explicit zero prices; missing values remain visibly unpriced until confirmed.
    const priceAd = Number(catalogItem.priceAdult ?? catalogItem.adPrice ?? 0);
    const priceCh = Number(catalogItem.priceChild ?? catalogItem.chPrice ?? Math.round(priceAd * 0.5));
    const assignedGroupIds = Array.from(new Set(targetGroupIds)).filter(id => namedGroups.some(g => g.id === id));
    const paxIds = getGroupRoster(assignedGroupIds);
    const counts = countsForRoster(paxIds);
    const calculatedTotal = (priceAd * counts.adults) + (priceCh * counts.children);

    const newActivity: Activity = {
      id: Date.now(),
      day: targetDayNum,
      date: getDayIsoDate(targetDayNum),
      slot: slot,
      name: catalogItem.name,
      desc: catalogItem.shortDescription || catalogItem.luxuryDescription || catalogItem.desc || '',
      pickup: times.pickup,
      start: times.start,
      endTime: scheduledEndTime,
      dur: catalogItem.duration || '',
      venue: catalogItem.location || '',
      pickupLoc: catalogItem.pickupLoc || catalogItem.pickupLocation || '',
      responsiblePerson: catalogItem.responsiblePerson || '',
      status: 'Planned',
      conf: '',
      supplier: catalogItem.supplier || '',
      supPhone: catalogItem.supplierPhone || catalogItem.supPhone || '',
      paxIds,
      groupIds: assignedGroupIds,
      pAdult: priceAd,
      pChild: priceCh,
      nAdult: counts.adults,
      nChild: counts.children,
      flat: 0,
      total: calculatedTotal,
      inc: catalogItem.inclusions || [],
      backup: catalogItem.backupPlan || catalogItem.backup || '',
      notes: catalogItem.destination ? `Curated from Viemma Experience Catalog. Destination: ${catalogItem.destination}.` : 'Curated from Viemma Experience Catalog.',
      isFree: false,
      heroImage: catalogItem.featuredImage || catalogItem.images?.[0] || '',
      gallery: catalogItem.images || [],
      difficulty: catalogItem.difficulty || '',
      suitableAges: catalogItem.suitableAges || '',
      accessibility: catalogItem.accessibility || [],
      weatherDependency: catalogItem.weatherDependency || '',
      dropoffLoc: catalogItem.dropoffLoc || '',
      excluded: catalogItem.excluded || [],
      packingAdvice: catalogItem.packingAdvice || '',
      dressCode: catalogItem.dressCode || '',
      safetyNotes: catalogItem.safetyNotes || '',
      photographyOpportunities: catalogItem.photographyOpportunities || '',
      seasonalAvailability: catalogItem.seasonalAvailability || '',
      faqs: catalogItem.faqs || [],
      guideNotes: catalogItem.guideNotes || ''
    };

    onAddActivity(newActivity);
    setAssigningActivityId(newActivity.id);
    setToastMessage(`Added "${catalogItem.name}" to Day ${targetDayNum}. Assign the participating travellers to complete setup.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleActivityExpand = (id: number) => {
    setExpandedActivityIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getActivityConflicts = (a: Activity): string[] => {
    const issues: string[] = [];
    const actDate = a.date || getDayIsoDate(a.day);
    
    const parseMins = parseClockMinutes;
    const aStart = parseMins(a.start);
    const aDuration = parseDurationMinutes(a.dur);
    const aEnd = a.endTime
      ? parseMins(a.endTime)
      : (aStart !== null && aDuration !== null ? aStart + aDuration : null);

    if (aStart === null) {
      issues.push('Missing or invalid start time (format HH:MM).');
    }
    if (aStart !== null && aEnd === null) {
      issues.push('Add an end time or a valid duration before schedule conflicts can be checked.');
    }
    if (aStart !== null && aEnd !== null && aEnd < aStart) {
      issues.push(`Invalid times: End time (${a.endTime}) cannot be earlier than start time (${a.start}).`);
    }

    if (state.client?.startDate && state.client?.endDate && actDate) {
      if (actDate < state.client.startDate || actDate > state.client.endDate) {
        issues.push(`Scheduled date (${actDate}) is outside trip dates (${state.client.startDate} to ${state.client.endDate}).`);
      }
    }

    if (aStart !== null && aEnd !== null) {
      for (const other of state.activities) {
        if (other.id === a.id || other.status === 'Cancelled') continue;
        const otherDate = other.date || getDayIsoDate(other.day);
        const sameDay = actDate && otherDate
          ? actDate === otherDate
          : a.day === other.day;

        if (sameDay) {
          const oStart = parseMins(other.start);
          const otherDuration = parseDurationMinutes(other.dur);
          const oEnd = other.endTime
            ? parseMins(other.endTime)
            : (oStart !== null && otherDuration !== null ? oStart + otherDuration : null);

          if (oStart !== null && oEnd !== null) {
            const hasTimeOverlap = aStart < oEnd && aEnd > oStart;

            const aPax = a.paxIds || [];
            const otherPax = other.paxIds || [];
            const overlappingPax = aPax.filter(id => otherPax.includes(id));

            const aGroups = a.groupIds || [];
            const oGroups = other.groupIds || [];
            const explicitGroupOverlap = aGroups.some(gid => oGroups.includes(gid));
            const missingGroupContext = aGroups.length === 0 || oGroups.length === 0;
            // Different named groups may run parallel. If one record lacks a group or traveller roster,
            // treat it as a potential conflict until the assignment is made explicit.
            const participantConflict = overlappingPax.length > 0
              || explicitGroupOverlap
              || (missingGroupContext && (aPax.length === 0 || otherPax.length === 0));

            if (hasTimeOverlap && participantConflict) {
              if (overlappingPax.length > 0) {
                const names = state.guests.filter(g => overlappingPax.includes(g.id)).map(g => `${g.first} ${g.last}`).join(', ');
                issues.push(`Traveller double-booked: ${names} assigned to simultaneous activities ("${a.name}" and "${other.name}").`);
              } else {
                issues.push(`Overlaps with "${other.name}" (${other.start}${other.endTime ? `–${other.endTime}` : ''}) on Day ${other.day}`);
              }
            }

            // Guide conflict check
            const aGuide = (a.responsiblePerson || a.guideName || a.guideId || '').trim().toLowerCase();
            const oGuide = (other.responsiblePerson || other.guideName || other.guideId || '').trim().toLowerCase();
            if (hasTimeOverlap && aGuide && oGuide && aGuide === oGuide) {
              issues.push(`Guide conflict: Guide "${a.responsiblePerson || a.guideName}" double-booked on "${a.name}" and "${other.name}".`);
            }

            // Driver conflict check
            const aDriver = (a.driverName || a.driverId || '').trim().toLowerCase();
            const oDriver = (other.driverName || other.driverId || '').trim().toLowerCase();
            if (hasTimeOverlap && aDriver && oDriver && aDriver === oDriver) {
              issues.push(`Driver conflict: Driver "${a.driverName}" double-booked on "${a.name}" and "${other.name}".`);
            }

            // Vehicle conflict check
            const aVehicle = (a.vehicleName || a.vehicleId || '').trim().toLowerCase();
            const oVehicle = (other.vehicleName || other.vehicleId || '').trim().toLowerCase();
            if (hasTimeOverlap && aVehicle && oVehicle && aVehicle === oVehicle) {
              issues.push(`Vehicle conflict: Vehicle "${a.vehicleName}" double-booked on "${a.name}" and "${other.name}".`);
            }

            // Insufficient transfer time between different venues
            if (a.venue && other.venue && a.venue.trim().toLowerCase() !== other.venue.trim().toLowerCase()) {
              if (aStart >= oEnd && (aStart - oEnd) < 30) {
                issues.push(`Insufficient transfer time: Only ${aStart - oEnd}m between "${other.name}" (${other.venue}) and "${a.name}" (${a.venue}). Minimum 30m transfer recommended.`);
              } else if (oStart >= aEnd && (oStart - aEnd) < 30) {
                issues.push(`Insufficient transfer time: Only ${oStart - aEnd}m between "${a.name}" (${a.venue}) and "${other.name}" (${other.venue}). Minimum 30m transfer recommended.`);
              }
            }
          }
        }
      }

      // Check against Ground Transfers
      const activityPax = a.paxIds || [];
      for (const tr of state.transfers) {
        if (tr.status === 'Cancelled') continue;
        const transferPax = tr.paxIds || [];
        const transferPassengerOverlap = activityPax.length === 0 || transferPax.length === 0
          || transferPax.some(id => activityPax.includes(id));
        if (actDate && tr.date === actDate && transferPassengerOverlap) {
          const trTime = parseMins(tr.time);
          if (trTime !== null) {
            if (trTime > aStart && trTime < aEnd) {
              issues.push(`Transfer "${tr.type}" (${tr.time}) scheduled during excursion.`);
            } else if (Math.abs(trTime - aEnd) < 25) {
              issues.push(`Tight turnaround: Transfer at ${tr.time} departs within 25 min of activity end.`);
            }
          }
        }
      }
    }

    return issues;
  };

  const handleOpenAddForm = () => {
    // Start from an empty activity record. Operational details must be confirmed for this trip.
    setAForm({
      day: 1,
      date: state.client?.startDate || '',
      slot: 'Morning',
      name: '',
      desc: '',
      pickup: '',
      start: '',
      endTime: '',
      dur: '',
      venue: '',
      pickupLoc: '',
      responsiblePerson: '',
      status: 'Draft',
      conf: '',
      supplier: '',
      supPhone: '',
      paxIds: [],
      groupIds: [],
      pAdult: 0,
      pChild: 0,
      nAdult: 0,
      nChild: 0,
      flat: 0,
      total: 0,
      inc: [],
      backup: '',
      notes: '',
      isFree: false,
      heroImage: '',
      gallery: [],
      difficulty: '',
      suitableAges: '',
      accessibility: [],
      weatherDependency: '',
      dropoffLoc: '',
      excluded: [],
      packingAdvice: '',
      dressCode: '',
      safetyNotes: '',
      photographyOpportunities: '',
      seasonalAvailability: '',
      faqs: [],
      guideNotes: '',
      guideId: '',
      guideName: '',
      guidePhone: '',
      guideSourceAgentId: '',
      guideSourceAgentName: '',
      attachments: []
    });
    setActiveTab('basic');
    setEditingActivityId(-1);
  };

  const handleEditActivity = (a: Activity) => {
    setAForm({ 
      ...a,
      date: a.date || state.client?.startDate || '',
      endTime: a.endTime || '',
      venue: a.venue || a.pickupLoc || '',
      responsiblePerson: a.responsiblePerson || a.guideName || '',
      status: a.status || 'Planned',
      difficulty: a.difficulty || '',
      suitableAges: a.suitableAges || '',
      accessibility: a.accessibility || [],
      weatherDependency: a.weatherDependency || '',
      dropoffLoc: a.dropoffLoc || '',
      excluded: a.excluded || [],
      packingAdvice: a.packingAdvice || '',
      dressCode: a.dressCode || '',
      safetyNotes: a.safetyNotes || '',
      photographyOpportunities: a.photographyOpportunities || '',
      seasonalAvailability: a.seasonalAvailability || '',
      faqs: a.faqs || [],
      guideNotes: a.guideNotes || a.notes || '',
      guideId: a.guideId || '',
      guideName: a.guideName || '',
      guidePhone: a.guidePhone || '',
      guideSourceAgentId: a.guideSourceAgentId || '',
      guideSourceAgentName: a.guideSourceAgentName || ''
    });
    setActiveTab('basic');
    setEditingActivityId(a.id);
  };

  const handleDbPrefill = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const item = DB_DEFAULT.activities.find(a => a.name === val);
    if (item) {
      const adCount = state.guests.filter(g => g.age !== 'Child' && g.age !== 'Infant').length;
      const chCount = state.guests.filter(g => g.age === 'Child' || g.age === 'Infant').length;
      const calcTotal = (item.adPrice * adCount) + (item.chPrice * chCount);

      setAForm({
        ...aForm,
        name: item.name,
        desc: item.desc,
        pAdult: item.adPrice,
        pChild: item.chPrice,
        nAdult: adCount,
        nChild: chCount,
        total: calcTotal,
        supplier: item.name,
        difficulty: 'Easy',
        weatherDependency: item.name.includes("Mountain") ? 'High' : 'Medium',
        inc: ["Entrance Fees", "Viemma Bottled Water"],
        excluded: ["Lunch", "Guide tips"]
      });
    }
  };

  const handleRecalculateCost = (updatedForm: Partial<Activity>) => {
    const form = { ...aForm, ...updatedForm };
    let total = 0;
    if (form.isFree) {
      total = 0;
    } else if (Number(form.flat) > 0) {
      total = Number(form.flat);
    } else {
      total = ((Number(form.pAdult) || 0) * (Number(form.nAdult) || 0)) +
              ((Number(form.pChild) || 0) * (Number(form.nChild) || 0));
    }
    setAForm({ ...form, total });
  };

  const handleSaveActivity = () => {
    setActivityValidationError(null);
    if (!aForm.name?.trim()) {
      setActivityValidationError('Activity name is required.');
      return;
    }

    const savedActivity: Activity = {
      id: aForm.id || Date.now(),
      day: Number(aForm.day) || 1,
      date: aForm.date || '',
      slot: aForm.slot || 'Morning',
      name: aForm.name.trim(),
      desc: aForm.desc || '',
      pickup: aForm.pickup || '',
      start: aForm.start || '',
      endTime: aForm.endTime || '',
      dur: aForm.dur || '',
      venue: aForm.venue || '',
      pickupLoc: aForm.pickupLoc || '',
      responsiblePerson: aForm.responsiblePerson || '',
      status: aForm.status || 'Planned',
      conf: aForm.conf || '',
      supplier: aForm.supplier || '',
      supPhone: aForm.supPhone || '',
      paxIds: aForm.paxIds || [],
      groupIds: aForm.groupIds || [],
      category: aForm.category || '',
      driverId: aForm.driverId || '',
      driverName: aForm.driverName || '',
      vehicleId: aForm.vehicleId || '',
      vehicleName: aForm.vehicleName || '',
      destination: aForm.destination || '',
      voucherRef: aForm.voucherRef || '',
      clientDescription: aForm.clientDescription || '',
      costSupplier: Number(aForm.costSupplier) || 0,
      sellingPrice: Number(aForm.sellingPrice) || 0,
      createdAt: aForm.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pAdult: Number(aForm.pAdult) || 0,
      pChild: Number(aForm.pChild) || 0,
      nAdult: Number(aForm.nAdult) || 0,
      nChild: Number(aForm.nChild) || 0,
      flat: Number(aForm.flat) || 0,
      total: Number(aForm.total) || 0,
      inc: aForm.inc || [],
      backup: aForm.backup || '',
      notes: aForm.notes || '',
      isFree: aForm.isFree || false,

      // Operational Knowledge fields
      heroImage: aForm.heroImage || '',
      gallery: aForm.gallery || [],
      difficulty: aForm.difficulty || 'Easy',
      suitableAges: aForm.suitableAges || 'All Ages',
      accessibility: aForm.accessibility || [],
      weatherDependency: aForm.weatherDependency || 'Low',
      dropoffLoc: aForm.dropoffLoc || '',
      excluded: aForm.excluded || [],
      packingAdvice: aForm.packingAdvice || '',
      dressCode: aForm.dressCode || '',
      safetyNotes: aForm.safetyNotes || '',
      photographyOpportunities: aForm.photographyOpportunities || '',
      seasonalAvailability: aForm.seasonalAvailability || '',
      faqs: aForm.faqs || [],
      guideNotes: aForm.guideNotes || '',
      guideId: aForm.guideId || '',
      guideName: aForm.guideName || '',
      guidePhone: aForm.guidePhone || '',
      guideSourceAgentId: aForm.guideSourceAgentId || '',
      guideSourceAgentName: aForm.guideSourceAgentName || '',
      attachments: aForm.attachments || []
    };

    if (editingActivityId === -1) {
      onAddActivity(savedActivity);
    } else {
      onUpdateActivity(savedActivity.id, savedActivity);
    }
    setEditingActivityId(null);
    setAForm({});
    setActivityValidationError(null);
  };

  const togglePassengerSelection = (paxId: number) => {
    const list = aForm.paxIds ? [...aForm.paxIds] : [];
    let updated: number[];
    if (list.includes(paxId)) {
      updated = list.filter(id => id !== paxId);
    } else {
      updated = [...list, paxId];
    }
    handleRecalculateCost({ paxIds: updated });
  };

  const toggleIncSelection = (inc: string) => {
    const list = aForm.inc ? [...aForm.inc] : [];
    const updated = list.includes(inc) ? list.filter(x => x !== inc) : [...list, inc];
    setAForm({ ...aForm, inc: updated });
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Title Header with Mode Switcher and Quick Actions */}
      <div className="space-y-4 p-5 md:p-6 bg-white/95 backdrop-blur-md border border-white/80 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#D4AF37] flex items-center gap-1.5 bg-[#1A3326] px-3 py-1 rounded-lg">
                <Compass size={13} /> EXCURSIONS & DAILY PROGRAMME
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {state.ref || 'VT-2026-001'} • {tripDaysCount} Itinerary Days • {state.activities?.filter(a => a.status !== 'Cancelled').length || 0} Scheduled Activities
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#10233F] font-sans">
              Daily Activity Programme & Excursions
            </h1>
            <p className="text-slate-600 max-w-3xl text-xs md:text-sm leading-relaxed">
              Curate and organise activities across daily schedules, assign participant groups, resolve operational conflicts, and build the verified itinerary for participants.
            </p>
          </div>

          {editingActivityId === null && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button 
                onClick={() => setIsCatalogOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4AF37] text-[#1A3326] hover:bg-[#c29d2b] text-xs font-black shadow-md hover:scale-102 active:scale-95 transition cursor-pointer"
                title="Browse and select activities from curated DMC library"
              >
                <Sparkles size={14} />
                <span>Select from Catalogue</span>
              </button>

              <button 
                onClick={handleOpenAddForm} 
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-bold shadow-md hover:scale-102 active:scale-95 transition cursor-pointer"
                title="Create a custom bespoke excursion from scratch"
              >
                <Plus size={14} />
                <span>+ Custom Outing</span>
              </button>
            </div>
          )}
        </div>

        {/* View Mode Tabs & Day Selector Bar */}
        {editingActivityId === null && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-gray-200">
              {/* View Modes */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'daily'
                      ? 'bg-[#1A3326] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
                  }`}
                >
                  <Calendar size={13} />
                  <span>Daily Programme</span>
                </button>
                <button
                  onClick={() => setViewMode('participant')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'participant'
                      ? 'bg-[#1A3326] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
                  }`}
                >
                  <BookOpen size={13} />
                  <span>Participant View</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'table'
                      ? 'bg-[#1A3326] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
                  }`}
                >
                  <SlidersHorizontal size={13} />
                  <span>Master Register</span>
                </button>
              </div>

              {/* Quick Info & Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  👥 <strong>{state.guests.length}</strong> Total Travellers
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  💰 Activities Valuation: <strong className="text-[#1A3326]">R {visibleActivities.reduce((sum, a) => sum + (a.isFree || a.status === 'Cancelled' ? 0 : a.total), 0).toLocaleString()}</strong>
                </span>
              </div>
            </div>

            {/* Persistent named group management and programme scope */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <label className="text-xs font-bold text-slate-700" htmlFor="viemma-group-filter">Programme view</label>
                  <select
                    id="viemma-group-filter"
                    value={selectedGroupFilter}
                    onChange={e => setSelectedGroupFilter(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 min-w-[190px]"
                  >
                    <option value="ALL">All traveller groups</option>
                    {namedGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name} ({group.memberIds.length} travellers)</option>
                    ))}
                    <option value="UNASSIGNED">Unassigned activities</option>
                  </select>
                  <span className="text-[11px] text-slate-500">{namedGroups.length} groups · {state.guests.length} travellers</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGroupManagerOpen(open => !open)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold"
                >
                  <Users size={14} />
                  {groupManagerOpen ? 'Hide Group Manager' : 'Manage Traveller Groups'}
                  {groupManagerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
              {groupManagerOpen && (
                <div className="border-t border-slate-100 pt-3 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateGroup(); } }}
                      placeholder="New group name, e.g. Group A / Family Smith"
                      className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-800"
                      aria-label="New traveller group name"
                    />
                    <button
                      type="button"
                      onClick={handleCreateGroup}
                      className="h-10 px-4 rounded-xl bg-[#1A3326] text-white text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Plus size={13} /> Create Group
                    </button>
                  </div>
                  {namedGroups.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                      No traveller groups yet. Create a group, then select which travellers belong to it.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {namedGroups.map(group => (
                        <section key={group.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{group.name}</h3>
                              <p className="text-[11px] text-slate-500">{group.memberIds.length} traveller(s) · {state.activities.filter(a => (a.groupIds || []).includes(group.id) && a.status !== 'Cancelled').length} active activities</p>
                            </div>
                            <button type="button" onClick={() => handleDeleteGroup(group.id)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-700 border border-rose-200 hover:bg-rose-50">Delete Group</button>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Group leader</label>
                            <select
                              value={group.leaderId && group.memberIds.includes(group.leaderId) ? String(group.leaderId) : ''}
                              onChange={e => handleUpdateGroupLeader(group.id, e.target.value)}
                              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                            >
                              <option value="">No group leader selected</option>
                              {state.guests.filter(g => group.memberIds.includes(g.id)).map(guest => (
                                <option key={guest.id} value={guest.id}>{guest.first} {guest.last}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Group members</p>
                            {state.guests.length === 0 ? (
                              <p className="text-xs text-slate-500">Add travellers in the Clients module first.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                                {state.guests.map(guest => (
                                  <label key={guest.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-700">
                                    <input
                                      type="checkbox"
                                      checked={group.memberIds.includes(guest.id)}
                                      onChange={e => handleUpdateGroupMembers(group.id, guest.id, e.target.checked)}
                                      className="accent-[#1A3326]"
                                    />
                                    <span className="min-w-0 truncate">{guest.first} {guest.last}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Day Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
              <button
                onClick={() => setSelectedDayFilter('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  selectedDayFilter === 'ALL'
                    ? 'bg-[#1A3326] text-white shadow-xs ring-2 ring-[#D4AF37]'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>All Days ({tripDaysCount} Days)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedDayFilter === 'ALL' ? 'bg-[#D4AF37] text-[#1A3326]' : 'bg-gray-100 text-gray-600'}`}>
                  {visibleActivities.length}
                </span>
              </button>

              {Array.from({ length: tripDaysCount }).map((_, idx) => {
                const dayNum = idx + 1;
                const isSelected = selectedDayFilter === dayNum;
                const dayActs = state.activities.filter(a => a.day === dayNum && matchesSelectedGroup(a));
                const hasConflicts = dayActs.some(a => getActivityConflicts(a).length > 0);

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDayFilter(dayNum)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#1A3326] text-white shadow-xs ring-2 ring-[#D4AF37]'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>Day {dayNum}</span>
                    <span className="text-[10px] font-medium text-gray-400">
                      {getDayFormattedDate(dayNum)}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-[#D4AF37] text-[#1A3326]' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {dayActs.length}
                    </span>
                    {hasConflicts && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Schedule warning on this day" />
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  const newEnd = new Date(state.client?.startDate || new Date());
                  newEnd.setDate(newEnd.getDate() + tripDaysCount);
                  const endStr = newEnd.toISOString().split('T')[0];
                  onUpdateState({
                    client: {
                      ...state.client,
                      endDate: endStr,
                      durationText: `${tripDaysCount + 1} Days / ${tripDaysCount} Nights`
                    }
                  });
                  setToastMessage(`Extended itinerary to ${tripDaysCount + 1} Days`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-3 py-2 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400 bg-white/50 text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1"
                title="Add an extra day to this itinerary"
              >
                <Plus size={13} />
                <span>Add Day</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED WORKSPACE FORM */}
      {editingActivityId !== null && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A3326] to-[#224433] text-white p-6 md:p-8 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block mb-1">Interactive Catalog Dispatch</span>
              <h2 className="text-xl md:text-2xl font-bold font-sans flex items-center gap-2">
                <Compass size={20} className="text-[#D4AF37]" />
                {editingActivityId === -1 ? 'Configure Excursion Object' : 'Update Excursion Object'}
              </h2>
            </div>
            <div className="flex gap-3 text-xs">
              <button 
                onClick={() => setEditingActivityId(null)} 
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveActivity} 
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#1A3326] hover:bg-[#b89528] font-bold shadow-sm hover:translate-y-[-1px] transition-all"
              >
                Save Outing Rules
              </button>
            </div>
          </div>

          {/* Modal Tabs inside Excursion form */}
          <div className="flex border-b border-gray-100 px-8 bg-white overflow-x-auto text-xs font-bold text-gray-500 shrink-0">
            <button 
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${activeTab === 'basic' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
            >
              1. Basic Excursion
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('operational')}
              className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${activeTab === 'operational' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
            >
              2. Operational Knowledge
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${activeTab === 'pricing' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
            >
              3. Supplier & Pricing
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('pax')}
              className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${activeTab === 'pax' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
            >
              4. Traveler Alignment
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`py-3.5 px-4 border-b-2 -mb-px transition-all ${activeTab === 'attachments' ? 'border-[#D4AF37] text-[#1A3326]' : 'border-transparent hover:text-gray-950'}`}
            >
              5. Documents & Vouchers
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-gray-50/50">
            
            {/* TAB 1: BASIC OUTING DETAILS */}
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider flex items-center gap-2"><Users size={14} className="text-[#D4AF37]" /> Traveller Group Assignment</h3>
                    <span className="text-[11px] text-slate-500">{(aForm.groupIds || []).length} group(s) selected</span>
                  </div>
                  {namedGroups.length === 0 ? (
                    <p className="text-xs text-slate-600">No named groups exist yet. Use “Manage Traveller Groups” above to create groups and assign travellers.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {namedGroups.map(group => (
                        <label key={group.id} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={(aForm.groupIds || []).includes(group.id)} onChange={e => handleToggleFormGroup(group.id, e.target.checked)} className="mt-0.5 accent-[#1A3326]" />
                          <span className="min-w-0"><strong className="block text-slate-900">{group.name}</strong><span className="text-[11px] text-slate-500">{group.memberIds.length} member(s)</span></span>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">Selecting groups assigns their current members. Individual traveller changes replace the named-group assignment for this activity.</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-500/5 to-yellow-500/10 rounded-[20px] p-6 border border-[#D4AF37]/20 shadow-xs space-y-3">
                  <label className="text-[11px] text-[#1A3326] font-bold uppercase tracking-wider block">Autofill from Master Experience Presets (Optional)</label>
                  <select 
                    onChange={handleDbPrefill}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-[#D4AF37] focus:ring-1 transition"
                  >
                    <option value="">Select an experience preset...</option>
                    {DB_DEFAULT.activities.map(a => (
                      <option key={a.id} value={a.name}>{a.name} — standard Net Adult: R{a.adPrice}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Calendar size={14} className="text-[#D4AF37]" /> Core Outing Timeline
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Itinerary Day Number</label>
                      <input 
                        type="number" 
                        value={aForm.day || 1}
                        onChange={e => setAForm({ ...aForm, day: Number(e.target.value) })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Scheduled Date</label>
                      <input 
                        type="date" 
                        value={aForm.date || ''}
                        onChange={e => setAForm({ ...aForm, date: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Time Slot Block</label>
                      <select 
                        value={aForm.slot || 'Morning'}
                        onChange={e => setAForm({ ...aForm, slot: e.target.value as any })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                      >
                        <option value="Morning">Morning Excursion</option>
                        <option value="Afternoon">Afternoon Excursion</option>
                        <option value="Evening">Evening Safari Sunset</option>
                        <option value="Full Day">Full Day Epic Expedition</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Operation Dispatch Status</label>
                      <select 
                        value={aForm.status || 'Planned'}
                        onChange={e => setAForm({ ...aForm, status: e.target.value as any })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                      >
                        <option value="Planned">Planned / Proposed</option>
                        <option value="Requested">Requested (Awaiting supplier response)</option>
                        <option value="Confirmed">Confirmed & Voucher Dispatched</option>
                        <option value="Completed">Completed</option>
                        <option value="Postponed">Postponed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-4">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Excursion Activity Label</label>
                      <input 
                        type="text" 
                        value={aForm.name || ''} 
                        onChange={e => setAForm({ ...aForm, name: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                        placeholder="e.g. Table Mountain Scenic Cableway Tour" 
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-4">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Brief Description</label>
                      <input 
                        type="text" 
                        value={aForm.desc || ''} 
                        onChange={e => setAForm({ ...aForm, desc: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                        placeholder="e.g. Return tickets to the crest of Table Mountain, Cape Town guide included." 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Clock size={14} className="text-[#D4AF37]" /> Logistics Timing, Venue & Responsible Operations
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Vehicle Pickup Time</label>
                      <input 
                        type="text" 
                        value={aForm.pickup || ''} 
                        onChange={e => setAForm({ ...aForm, pickup: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                        placeholder="09:00" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Start Time</label>
                      <input 
                        type="text" 
                        value={aForm.start || ''} 
                        onChange={e => setAForm({ ...aForm, start: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                        placeholder="09:30" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">End / Finish Time</label>
                      <input 
                        type="text" 
                        value={aForm.endTime || ''} 
                        onChange={e => setAForm({ ...aForm, endTime: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                        placeholder="12:30" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Duration</label>
                      <input 
                        type="text" 
                        value={aForm.dur || ''} 
                        onChange={e => setAForm({ ...aForm, dur: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition" 
                        placeholder="e.g. 3 hours"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Activity Venue / Facility</label>
                      <input 
                        type="text" 
                        value={aForm.venue || ''} 
                        onChange={e => setAForm({ ...aForm, venue: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition" 
                        placeholder="e.g. Table Mountain Summit Station, Cape Town" 
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Responsible Person / Lead Guide</label>
                      <input 
                        type="text" 
                        value={aForm.responsiblePerson || ''} 
                        onChange={e => setAForm({ ...aForm, responsiblePerson: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition" 
                        placeholder="e.g. Sipho Ndlovu (Lead Guide / Tour Leader)" 
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-4">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Detailed Pickup Point</label>
                      <input 
                        type="text" 
                        value={aForm.pickupLoc || ''} 
                        onChange={e => setAForm({ ...aForm, pickupLoc: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition" 
                        placeholder="e.g. Hotel Main Lobby"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OPERATIONAL KNOWLEDGE OBJECT */}
            {activeTab === 'operational' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Compass size={14} className="text-[#D4AF37]" /> Curated Excursion Knowledge Specs
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Physical Difficulty Level</label>
                      <select 
                        value={aForm.difficulty || 'Easy'}
                        onChange={e => setAForm({ ...aForm, difficulty: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37]"
                      >
                        <option value="Easy">Easy (Gently walking)</option>
                        <option value="Moderate">Moderate (Stairs / uneven ground)</option>
                        <option value="Strenuous">Strenuous (Long hikes / high altitude)</option>
                        <option value="N/A">N/A (Scenic drive / vehicle only)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Suitable Age Groups</label>
                      <input 
                        type="text" 
                        value={aForm.suitableAges || 'All Ages'}
                        onChange={e => setAForm({ ...aForm, suitableAges: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:border-[#D4AF37]"
                        placeholder="e.g. All Ages, 12+ recommended"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Weather Dependency Alert</label>
                      <select 
                        value={aForm.weatherDependency || 'Low'}
                        onChange={e => setAForm({ ...aForm, weatherDependency: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37]"
                      >
                        <option value="Low">Low (Operates rain or shine)</option>
                        <option value="Medium">Medium (Strong winds or rain can hinder)</option>
                        <option value="High (Wind & Cloud Cover dependent)">High (Full weather dependent, require backup)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Expected Drop-off Location</label>
                      <input 
                        type="text" 
                        value={aForm.dropoffLoc || ''}
                        onChange={e => setAForm({ ...aForm, dropoffLoc: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800"
                        placeholder="e.g. Return to lodging lobby, drop-off at Waterfront Restaurant"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Seasonal Excursion Availability</label>
                      <input 
                        type="text" 
                        value={aForm.seasonalAvailability || 'Year-round'}
                        onChange={e => setAForm({ ...aForm, seasonalAvailability: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-800"
                        placeholder="e.g. Year-round, September to March (Whales)"
                      />
                    </div>
                  </div>
                </div>

                {/* Excursion Logistics Specifics */}
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#D4AF37]" /> Packing Advice, Safety & Dress Codes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Luxury Packing Advice</label>
                      <textarea 
                        value={aForm.packingAdvice || ''}
                        onChange={e => setAForm({ ...aForm, packingAdvice: e.target.value })}
                        rows={2}
                        className="w-full p-3 rounded-lg border border-gray-200 text-xs focus:border-[#D4AF37]"
                        placeholder="Windbreaker, sunblock, comfortable closed walking shoes..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Dress Code Etiquette</label>
                      <textarea 
                        value={aForm.dressCode || ''}
                        onChange={e => setAForm({ ...aForm, dressCode: e.target.value })}
                        rows={2}
                        className="w-full p-3 rounded-lg border border-gray-200 text-xs focus:border-[#D4AF37]"
                        placeholder="Casual outdoor safari, smart casual, active hiking dress..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Photography Advice & Opportunities</label>
                      <textarea 
                        value={aForm.photographyOpportunities || ''}
                        onChange={e => setAForm({ ...aForm, photographyOpportunities: e.target.value })}
                        rows={2}
                        className="w-full p-3 rounded-lg border border-gray-200 text-xs focus:border-[#D4AF37]"
                        placeholder="Perfect for sunset zoom lenses, wildlife close-ups..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Wilderness Safety Instructions</label>
                      <textarea 
                        value={aForm.safetyNotes || ''}
                        onChange={e => setAForm({ ...aForm, safetyNotes: e.target.value })}
                        rows={2}
                        className="w-full p-3 rounded-lg border border-gray-200 text-xs focus:border-[#D4AF37]"
                        placeholder="Demarcated path rules, baboon safety guidelines, keep hydrated..."
                      />
                    </div>
                  </div>
                </div>

                {/* Guide Assignment */}
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-5">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Users size={14} className="text-[#D4AF37]" /> Guide Assignment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Assigned Guide</label>
                      <select
                        value={aForm.guideId || ''}
                        onChange={e => {
                          const guide = guides.find(g => g.id === e.target.value);
                          setAForm({
                            ...aForm,
                            guideId: guide?.id || '',
                            guideName: guide?.name || '',
                            guidePhone: guide?.phone || '',
                            guideSourceAgentId: guide?.sourceAgentId || '',
                            guideSourceAgentName: guide?.sourceAgentName || ''
                          });
                        }}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-[#D4AF37] transition"
                      >
                        <option value="">Select guide...</option>
                        {guides.map(guide => (
                          <option key={guide.id} value={guide.id}>
                            {guide.name} — {guide.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Guide Contact</label>
                        <div className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-slate-50 flex items-center text-xs font-semibold text-gray-700">
                          {aForm.guidePhone || 'Select a guide'}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Source Agent / Agency</label>
                        <div className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-slate-50 flex items-center text-xs font-semibold text-gray-700">
                          {aForm.guideSourceAgentName || 'Not assigned'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Specific Guide Notes */}
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <FileText size={14} className="text-[#D4AF37]" /> Role-Specific Guide Coordination Notes (Internal)
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    These notes remain strictly internal and are visible exclusively to driver-guides and tour escorts for pristine on-site concierge execution.
                  </p>
                  <textarea 
                    value={aForm.guideNotes || ''} 
                    onChange={e => setAForm({ ...aForm, guideNotes: e.target.value })}
                    className="w-full p-4 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#D4AF37] text-[#1A3326]"
                    placeholder="e.g. Ensure the guide coordinates bypass queue tickets, client has knee issue so suggest elevator boarding..."
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: SUPPLIER & PRICING */}
            {activeTab === 'pricing' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Users size={14} className="text-[#D4AF37]" /> Supplier Contact Dossier
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Contracted Supplier Name</label>
                      <input 
                        type="text" 
                        value={aForm.supplier || ''} 
                        onChange={e => setAForm({ ...aForm, supplier: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                        placeholder="e.g. Table Mountain Co." 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Emergency Supplier Phone Hotline</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <Phone size={12} />
                        </span>
                        <input 
                          type="text" 
                          value={aForm.supPhone || ''} 
                          onChange={e => setAForm({ ...aForm, supPhone: e.target.value })}
                          className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition"
                          placeholder="+27 21 424 8408" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider flex items-center gap-2">
                      <Tag size={14} className="text-[#D4AF37]" /> Financial Rates & Ticket Surcharges
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={aForm.isFree || false} 
                        onChange={e => handleRecalculateCost({ isFree: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-[#D4AF37]" 
                      />
                      <span>Complimentary / Free Spot</span>
                    </label>
                  </div>

                  {!aForm.isFree && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Net Adult Rate (R)</label>
                        <input 
                          type="number" 
                          value={aForm.pAdult || 0} 
                          onChange={e => handleRecalculateCost({ pAdult: Number(e.target.value) })}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37]" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Linked Adults Count</label>
                        <input 
                          type="number" 
                          value={aForm.nAdult || 0} 
                          onChange={e => handleRecalculateCost({ nAdult: Number(e.target.value) })}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37]" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Net Child Rate (R)</label>
                        <input 
                          type="number" 
                          value={aForm.pChild || 0} 
                          onChange={e => handleRecalculateCost({ pChild: Number(e.target.value) })}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37]" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Linked Children Count</label>
                        <input 
                          type="number" 
                          value={aForm.nChild || 0} 
                          onChange={e => handleRecalculateCost({ nChild: Number(e.target.value) })}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37]" 
                        />
                      </div>

                      <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-[11px] text-gray-500 font-bold uppercase block">Flat Bulk Group Rate Override (R)</label>
                        <input 
                          type="number" 
                          value={aForm.flat || 0} 
                          onChange={e => handleRecalculateCost({ flat: Number(e.target.value) })}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37]" 
                          placeholder="e.g. flat R 5000 for whole vehicle"
                        />
                      </div>

                      <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-[11px] text-gray-500 font-bold uppercase block text-[#1A3326]">Total Valuation Net Sum</label>
                        <div className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-emerald-50 text-[#1A3326] font-bold flex items-center text-xs">
                          R {(aForm.total || 0).toLocaleString()} Net Cost
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exclusions and Inclusions */}
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Layers size={14} className="text-[#D4AF37]" /> Contract Inclusions & Exclusions
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">DMC Included Items</label>
                      <div className="flex flex-wrap gap-2">
                        {["Entrance Tickets", "Chartered Vehicle Transfers", "Bottled Water", "English Driver-Guide", "French Private Escort", "Gourmet Lunch Box", "Wine Tasting Fees"].map(inc => {
                          const isSelected = aForm.inc?.includes(inc) || false;
                          return (
                            <span 
                              key={inc}
                              onClick={() => toggleIncSelection(inc)}
                              className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer select-none transition ${
                                isSelected ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' : 'bg-white border-gray-100 text-gray-500'
                              }`}
                            >
                              {inc}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] text-gray-500 font-bold uppercase block">Items Excluded (Custom lists)</label>
                      <input 
                        type="text" 
                        value={aForm.excluded?.join(', ') || ''}
                        onChange={e => setAForm({ ...aForm, excluded: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#D4AF37]"
                        placeholder="e.g. Lunch, Gratuities, Alcoholic drinks (comma separated)"
                      />
                    </div>
                  </div>
                </div>

                {/* Backup / Plan B contingency */}
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block text-amber-700">Contingency Plan B / Weather Backup Rules</label>
                  <textarea 
                    value={aForm.backup || ''} 
                    onChange={e => setAForm({ ...aForm, backup: e.target.value })}
                    rows={2}
                    className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-amber-500"
                    placeholder="If extreme wind conditions occur Table Mountain closes; automatically redirect passengers to Kirstenbosch Gardens Guided Walks."
                  />
                </div>
              </div>
            )}

            {/* TAB 4: PASSENGER ALIGNMENT */}
            {activeTab === 'pax' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Users size={14} className="text-[#D4AF37]" /> Map Registered Travelers to Excursion
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Allocate travelers from the group roster to this guided excursion for operations manifestation sheets.
                  </p>

                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {state.guests.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">No travelers listed in main roster.</span>
                    ) : (
                      state.guests.map(g => {
                        const isSelected = aForm.paxIds?.includes(g.id) || false;
                        return (
                          <span 
                            key={g.id} 
                            onClick={() => togglePassengerSelection(g.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border select-none transition duration-150 flex items-center gap-1.5 hover:translate-y-[-1px] ${
                              isSelected 
                                ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' 
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {isSelected && <Check size={12} className="text-[#D4AF37]" />}
                            {g.first} {g.last} ({g.age})
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SUPPORTING DOCUMENTS & ATTACHMENTS */}
            {activeTab === 'attachments' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-4">
                  <AttachmentManager
                    attachments={aForm.attachments || []}
                    onAddAttachment={(item) => setAForm(prev => ({
                      ...prev,
                      attachments: [...(prev.attachments || []), item]
                    }))}
                    onRemoveAttachment={(id) => setAForm(prev => ({
                      ...prev,
                      attachments: (prev.attachments || []).filter(a => a.id !== id)
                    }))}
                    recordType="activity"
                    recordId={aForm.id || Date.now()}
                    bookingRef={state.ref}
                    title="Excursion Vouchers, Permits & Safety Briefs"
                    description="Upload excursion ticket vouchers, park entry permits, wine cellar booking confirmations, or safety waivers (PDF, JPEG, PNG, WebP up to 15MB)."
                  />
                </div>
              </div>
            )}

          </div>

          {/* Sticky footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3.5">
            <button 
              onClick={() => setEditingActivityId(null)} 
              className="px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-sm transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveActivity} 
              className="px-6 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-extrabold shadow-md hover:translate-y-[-1px] transition duration-150"
            >
              Save Outing Rules
            </button>
          </div>

        </div>
      )}
      {/* MAIN PROGRAMME WORKSPACE */}
      {editingActivityId === null && (
        <div className="space-y-8">

          {/* EMPTY STATE */}
          {visibleActivities.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-[28px] shadow-sm max-w-xl mx-auto w-full p-8 space-y-5 animate-in zoom-in-95">
              <div className="w-18 h-18 bg-emerald-50 text-[#1A3326] rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                <Compass size={32} className="text-[#D4AF37]" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest block">Itinerary Programme Empty</span>
                <h3 className="font-extrabold text-gray-900 text-lg">No Daily Activities Scheduled</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Build the travel experience by selecting signature excursions from the curated DMC library or crafting bespoke daily outings.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button 
                  onClick={() => setIsCatalogOpen(true)}
                  className="px-5 py-2.5 bg-[#D4AF37] text-[#1A3326] rounded-xl text-xs font-black shadow-md hover:bg-[#c29d2b] transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles size={14} />
                  <span>Select from Curated Catalogue</span>
                </button>
                <button 
                  onClick={handleOpenAddForm} 
                  className="px-5 py-2.5 bg-[#1A3326] text-white rounded-xl text-xs font-bold shadow hover:bg-[#12241b] transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus size={14} />
                  <span>Configure Custom Outing</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. DAILY PROGRAMME VIEW (Chronological Day-by-Day Cards) */}
              {viewMode === 'daily' && (
                <div className="space-y-8">
                  {Array.from({ length: tripDaysCount }).map((_, idx) => {
                    const dayNum = idx + 1;
                    if (selectedDayFilter !== 'ALL' && selectedDayFilter !== dayNum) return null;

                    const dayActs = state.activities
                      .filter(a => a.day === dayNum && matchesSelectedGroup(a))
                      .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'));

                    const dayIsoDate = getDayIsoDate(dayNum);
                    const dayFlights = state.flights.filter(f => f.date === dayIsoDate);
                    const dayTransfers = state.transfers.filter(t => t.date === dayIsoDate);
                    const dayTotalValuation = dayActs.reduce((sum, a) => sum + (a.isFree || a.status === 'Cancelled' ? 0 : a.total), 0);
                    const dayFocusTitle = customDayTitles[dayNum] || `Day ${dayNum} Programme`;

                    return (
                      <div 
                        key={dayNum} 
                        className="bg-white rounded-[26px] border border-gray-200/90 shadow-sm overflow-hidden transition-all duration-200 hover:border-gray-300"
                      >
                        {/* Day Header Strip */}
                        <div className="bg-gradient-to-r from-slate-900 via-[#1A3326] to-[#12241b] text-white p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-13 h-13 rounded-2xl bg-[#D4AF37] text-[#1A3326] font-black flex flex-col items-center justify-center shrink-0 shadow-md">
                              <span className="text-[10px] uppercase tracking-wider leading-none">DAY</span>
                              <span className="text-xl leading-none mt-0.5">{dayNum}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold text-[#D4AF37]">
                                  📅 {getDayFormattedDate(dayNum)}
                                </span>
                                <span className="text-gray-400 text-xs">•</span>
                                <span className="text-[11px] text-gray-300 font-medium">
                                  {dayActs.length} {dayActs.length === 1 ? 'activity' : 'activities'} scheduled
                                </span>
                                {dayTotalValuation > 0 && (
                                  <>
                                    <span className="text-gray-400 text-xs">•</span>
                                    <span className="text-[11px] text-emerald-300 font-bold">
                                      R {dayTotalValuation.toLocaleString()} day total
                                    </span>
                                  </>
                                )}
                              </div>
                              
                              {/* Day Title / Focus Editing */}
                              {editingDayTitleId === dayNum ? (
                                <div className="flex items-center gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={customDayTitles[dayNum] || ''}
                                    onChange={(e) => onUpdateState({ dayTitles: { ...(state.dayTitles || {}), [dayNum]: e.target.value } })}
                                    className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm font-bold border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => setEditingDayTitleId(null)}
                                    className="px-2.5 py-1 bg-[#D4AF37] text-[#1A3326] text-xs font-bold rounded-lg"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 group">
                                  <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                                    {dayFocusTitle}
                                  </h3>
                                  <button
                                    onClick={() => setEditingDayTitleId(dayNum)}
                                    className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition p-1"
                                    title="Edit daily theme title"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Day Actions */}
                          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                            <button
                              onClick={() => {
                                setCatalogTargetDay(dayNum);
                                setIsCatalogOpen(true);
                              }}
                              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/15 cursor-pointer active:scale-95"
                              title={`Select experience for Day ${dayNum} from catalogue`}
                            >
                              <Sparkles size={13} className="text-[#D4AF37]" />
                              <span>+ Browse Catalogue</span>
                            </button>
                            <button
                              onClick={() => {
                                const targetDate = getDayIsoDate(dayNum);
                                setAForm({
                                  day: dayNum,
                                  date: targetDate,
                                  slot: 'Morning',
                                  name: '',
                                  desc: '',
                                  start: '09:00',
                                  endTime: '12:00',
                                  dur: '3 hours',
                                  status: 'Planned',
                                  paxIds: state.guests.map(g => g.id),
                                  venue: '',
                                  responsiblePerson: 'Lead Guide'
                                });
                                setEditingActivityId(-1);
                              }}
                              className="px-3 py-2 rounded-xl bg-[#D4AF37] text-[#1A3326] text-xs font-black transition flex items-center gap-1.5 shadow-sm hover:bg-[#c29d2b] cursor-pointer active:scale-95"
                              title={`Add custom activity to Day ${dayNum}`}
                            >
                              <Plus size={13} />
                              <span>+ Custom Outing</span>
                            </button>
                          </div>
                        </div>

                        {/* Daily Logistics Context Ribbon (Transfers & Flights on this day) */}
                        {(dayFlights.length > 0 || dayTransfers.length > 0) && (
                          <div className="bg-slate-50 border-b border-gray-200 px-5 md:px-6 py-2.5 flex flex-wrap items-center gap-4 text-xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                              Integrated Daily Logistics:
                            </span>
                            {dayFlights.map(f => (
                              <span key={f.id} className="bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5">
                                ✈️ {f.airline} {f.flightNo} ({f.from} → {f.to} • {f.depTime || 'TBD'})
                              </span>
                            ))}
                            {dayTransfers.map(t => (
                              <span key={t.id} className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5">
                                🚗 {t.type} at {t.time} ({t.from} → {t.to})
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Activities List inside this Day */}
                        <div className="p-5 md:p-6 space-y-4">
                          {dayActs.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-gray-200 space-y-3">
                              <p className="text-xs text-gray-500 font-medium">No experiences scheduled for Day {dayNum}.</p>
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setCatalogTargetDay(dayNum);
                                    setIsCatalogOpen(true);
                                  }}
                                  className="text-xs font-bold text-[#1A3326] bg-white border border-gray-200 hover:border-[#D4AF37] px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-2xs"
                                >
                                  <Sparkles size={12} className="text-[#D4AF37]" />
                                  <span>Select from Curated Catalogue</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            dayActs.map(a => {
                              const isExpanded = expandedActivityIds.includes(a.id);
                              const assignedPax = state.guests.filter(g => a.paxIds?.includes(g.id));
                              const conflicts = getActivityConflicts(a);

                              return (
                                <div 
                                  key={a.id} 
                                  className="bg-white rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden relative"
                                >
                                  {/* Left slot indicator strip */}
                                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                                    a.slot === 'Morning' ? 'bg-amber-400' :
                                    a.slot === 'Lunch' ? 'bg-emerald-500' :
                                    a.slot === 'Afternoon' ? 'bg-orange-400' :
                                    a.slot === 'Evening' ? 'bg-indigo-600' : 'bg-slate-800'
                                  }`} />

                                  <div className="p-5 md:p-6 space-y-4 pl-6">
                                    {/* Top Bar: Time, Slot, Status Dropdown, and Actions */}
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {/* Time Badge */}
                                          <span className="font-mono font-bold text-xs bg-slate-100 text-[#1A3326] px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                                            <Clock size={12} className="text-[#D4AF37]" />
                                            {a.start || 'TBD'}{a.endTime ? ` – ${a.endTime}` : ''}
                                            {a.dur && <span className="text-gray-400 text-[10px]">({a.dur})</span>}
                                          </span>

                                          {/* Slot Pill */}
                                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#D4AF37] bg-[#1A3326] px-2.5 py-0.5 rounded-md">
                                            {a.slot}
                                          </span>

                                          {/* 1-Click Status Selector Dropdown */}
                                          <select
                                            value={a.status || 'Planned'}
                                            onChange={(e) => handleQuickStatusChange(a.id, e.target.value as any)}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none transition ${
                                              a.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                              a.status === 'Completed' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                              a.status === 'Requested' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                              a.status === 'Postponed' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                                              a.status === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-300 line-through' :
                                              'bg-slate-100 text-slate-700 border-slate-300'
                                            }`}
                                          >
                                            <option value="Planned">Planned</option>
                                            <option value="Requested">Requested</option>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Postponed">Postponed</option>
                                            <option value="Cancelled">Cancelled</option>
                                          </select>

                                          {a.weatherDependency && a.weatherDependency.toLowerCase().includes('high') && (
                                            <span className="text-[9px] bg-sky-50 text-sky-800 border border-sky-100 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                              <CloudSun size={10} /> Weather Sensitive
                                            </span>
                                          )}
                                        </div>

                                        <h4 className="font-extrabold text-gray-950 text-base font-sans mt-1">
                                          {a.name}
                                        </h4>
                                        {(a.groupIds || []).length > 0 && (
                                          <div className="flex flex-wrap gap-1.5 mt-1">
                                            {(a.groupIds || []).map(id => namedGroups.find(g => g.id === id)).filter(Boolean).map(group => (
                                              <span key={group!.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                                                <Users size={10} /> {group!.name}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        <p className="text-gray-600 text-xs leading-relaxed max-w-3xl">
                                          {a.desc}
                                        </p>
                                      </div>

                                      {/* Commercial Valuation & Card Actions */}
                                      <div className="flex items-center gap-3 shrink-0 self-end lg:self-start">
                                        <div className="text-right">
                                          <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block">Net Cost</span>
                                          <strong className="block text-sm font-black text-[#1A3326]">
                                            {a.isFree ? 'Complimentary' : `R ${a.total.toLocaleString()}`}
                                          </strong>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          {/* Move to another day dropdown */}
                                          <div className="flex items-center gap-1 text-[11px] bg-slate-50 border border-gray-200 px-2 py-1 rounded-xl">
                                            <span className="text-gray-400 font-bold uppercase text-[9px]">Day:</span>
                                            <select
                                              value={a.day}
                                              onChange={(e) => handleMoveActivityToDay(a.id, Number(e.target.value))}
                                              className="bg-transparent font-bold text-[#1A3326] cursor-pointer focus:outline-none"
                                            >
                                              {Array.from({ length: tripDaysCount }).map((_, i) => (
                                                <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                                              ))}
                                            </select>
                                          </div>

                                          {/* Duplicate Button */}
                                          <button
                                            onClick={() => handleDuplicateActivity(a)}
                                            className="w-8 h-8 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition shadow-2xs cursor-pointer"
                                            title="Duplicate to another day"
                                          >
                                            <Copy size={13} />
                                          </button>

                                          {/* Edit Details Button */}
                                          <button 
                                            onClick={() => handleEditActivity(a)} 
                                            className="w-8 h-8 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition shadow-2xs cursor-pointer"
                                            title="Edit complete excursion specifications"
                                          >
                                            <Edit3 size={13} />
                                          </button>

                                          {/* Delete Button */}
                                          <button 
                                            onClick={() => onRemoveActivity(a.id)} 
                                            className="w-8 h-8 rounded-xl border border-rose-100 bg-rose-50/20 text-rose-500 hover:text-white hover:bg-rose-500 flex items-center justify-center transition shadow-2xs cursor-pointer"
                                            title="Remove excursion"
                                          >
                                            <Trash2 size={13} />
                                          </button>

                                          {/* Expand Details Toggle */}
                                          <button 
                                            onClick={() => toggleActivityExpand(a.id)}
                                            className="w-8 h-8 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition shadow-2xs cursor-pointer"
                                            title="Toggle operational specifications"
                                          >
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Conflict Warning Alerts */}
                                    {conflicts.length > 0 && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
                                        <div className="font-bold text-amber-900 flex items-center gap-1.5">
                                          <AlertCircle size={14} className="text-amber-700" />
                                          <span>Schedule Conflict or Tight Turnaround Detected</span>
                                        </div>
                                        <ul className="list-disc list-inside text-amber-800 text-[11px] space-y-0.5 pl-1">
                                          {conflicts.map((msg, i) => (
                                            <li key={i}>{msg}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Operational Strip: Venue, Guide, Supplier */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-gray-100 text-xs">
                                      <div>
                                        <span className="text-[9px] uppercase text-gray-400 font-bold block">Venue / Site</span>
                                        <strong className="text-gray-900 font-bold truncate block">{a.venue || a.pickupLoc || 'TBD'}</strong>
                                      </div>
                                      <div>
                                        <span className="text-[9px] uppercase text-gray-400 font-bold block">Pickup Location</span>
                                        <strong className="text-gray-900 font-bold truncate block">{a.pickupLoc || 'Hotel Lobby'}</strong>
                                      </div>
                                      <div>
                                        <span className="text-[9px] uppercase text-gray-400 font-bold block">Responsible Lead</span>
                                        <strong className="text-gray-900 font-bold truncate block">{a.responsiblePerson || 'Assigned Guide'}</strong>
                                      </div>
                                      <div>
                                        <span className="text-[9px] uppercase text-gray-400 font-bold block">Supplier</span>
                                        <strong className="text-gray-900 font-bold truncate block">{a.supplier || 'DMC Partner'}</strong>
                                      </div>
                                    </div>

                                    {/* Participant Assignment Strip */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100 text-xs">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                                          Assigned Group Manifest ({assignedPax.length}/{state.guests.length}):
                                        </span>
                                        {assignedPax.length === 0 ? (
                                          <span className="text-rose-500 font-bold italic text-[11px]">No travellers assigned</span>
                                        ) : (
                                          assignedPax.map(gp => (
                                            <span 
                                              key={gp.id} 
                                              className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[10px]"
                                            >
                                              {gp.first} {gp.last}
                                            </span>
                                          ))
                                        )}
                                      </div>

                                      {/* Fast Traveller Assignment Trigger */}
                                      <button
                                        onClick={() => setAssigningActivityId(a.id)}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-[11px] flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                                        title="Quickly assign or exclude travellers from this excursion"
                                      >
                                        <Users size={12} className="text-[#D4AF37]" />
                                        <span>Assign Group ({assignedPax.length}/{state.guests.length})</span>
                                      </button>
                                    </div>

                                    {/* Expanded Operational Specifications */}
                                    {isExpanded && (
                                      <div className="space-y-4 pt-4 border-t border-gray-100 text-xs animate-in fade-in duration-200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                          <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 space-y-1">
                                            <span className="text-[9px] uppercase text-gray-400 font-bold block">Difficulty & Suitability</span>
                                            <strong className="text-[#1A3326] block">Level: {a.difficulty || 'Easy'}</strong>
                                            <span className="text-gray-500 block">Ages: {a.suitableAges || 'All Ages'}</span>
                                          </div>
                                          <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 space-y-1">
                                            <span className="text-[9px] uppercase text-gray-400 font-bold block">Supplier Hotline</span>
                                            <strong className="text-[#1A3326] block">{a.supplier || 'DMC Partner'}</strong>
                                            <span className="text-gray-500 block">Phone: {a.supPhone || '+27 21 555 0100'}</span>
                                          </div>
                                          <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 space-y-1">
                                            <span className="text-[9px] uppercase text-gray-400 font-bold block">Drop-Off Destination</span>
                                            <strong className="text-[#1A3326] block truncate">{a.dropoffLoc || 'Return to Hotel Lobby'}</strong>
                                            <span className="text-gray-500 block">Season: {a.seasonalAvailability || 'Year-round'}</span>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div className="bg-amber-50/30 p-3 rounded-xl border border-amber-200/50 space-y-1">
                                            <span className="text-[9px] uppercase font-bold text-amber-800 block">Packing Advice</span>
                                            <p className="text-gray-700 font-medium leading-relaxed">{a.packingAdvice || 'Standard luxury outdoor apparel advised.'}</p>
                                          </div>
                                          <div className="bg-amber-50/30 p-3 rounded-xl border border-amber-200/50 space-y-1">
                                            <span className="text-[9px] uppercase font-bold text-amber-800 block">Photography Highlights</span>
                                            <p className="text-gray-700 font-medium leading-relaxed">{a.photographyOpportunities || 'Spectacular scenic and wildlife captures.'}</p>
                                          </div>
                                        </div>

                                        {/* Inclusions & Exclusions */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <span className="text-[9px] uppercase font-black text-emerald-800 block mb-1">Contracted Inclusions:</span>
                                            <div className="flex flex-wrap gap-1">
                                              {a.inc && a.inc.length > 0 ? (
                                                a.inc.map(i => <span key={i} className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">{i}</span>)
                                              ) : (
                                                <span className="text-gray-400 italic">Standard inclusions apply</span>
                                              )}
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-[9px] uppercase font-black text-rose-800 block mb-1">Exclusions:</span>
                                            <div className="flex flex-wrap gap-1">
                                              {a.excluded && a.excluded.length > 0 ? (
                                                a.excluded.map(i => <span key={i} className="bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">{i}</span>)
                                              ) : (
                                                <span className="text-gray-400 italic">No specific exclusions logged</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Weather Contingency Plan B */}
                                        {a.backup && (
                                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                                            <span className="text-[9px] uppercase font-bold text-amber-800 block">Weather Contingency Plan B:</span>
                                            <p className="text-gray-700 font-medium leading-relaxed">{a.backup}</p>
                                          </div>
                                        )}

                                        {/* Guide Internal Protocols */}
                                        {a.guideNotes && (
                                          <div className="bg-yellow-50/60 border border-yellow-200 p-3.5 rounded-xl text-[11px] text-gray-700 italic space-y-1">
                                            <strong className="text-xs text-[#1A3326] font-bold block not-italic flex items-center gap-1.5">
                                              <FileText size={13} /> Guide Protocols (Internal only):
                                            </strong>
                                            <p className="leading-relaxed not-italic">{a.guideNotes}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. PARTICIPANT DAY PROGRAMME VIEW (Clean, editorial client sequence) */}
              {viewMode === 'participant' && (
                <div className="space-y-6">
                  <div className="bg-[#1A3326] text-white p-6 rounded-3xl space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest block">Client Presentation View</span>
                    <h2 className="text-2xl font-bold font-serif">{state.client?.name || 'Valued Guests'} — Daily Journey Itinerary</h2>
                    <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                      This sequence shows the verified day-by-day experience as presented to participants in their digital dossier and client editorial pages.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {Array.from({ length: tripDaysCount }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const dayActs = state.activities
                        .filter(a => a.day === dayNum && a.status !== 'Cancelled' && matchesSelectedGroup(a))
                        .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'));

                      return (
                        <div key={dayNum} className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-sm">
                          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <span className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#1A3326] font-black flex items-center justify-center text-sm">
                              D{dayNum}
                            </span>
                            <div>
                              <h3 className="font-extrabold text-gray-900 text-lg">
                                {customDayTitles[dayNum] || `Day ${dayNum} Experience`}
                              </h3>
                              <span className="text-xs text-gray-400 font-mono">
                                {getDayFormattedDate(dayNum)}
                              </span>
                            </div>
                          </div>

                          {dayActs.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Day at leisure or in scenic transit.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {dayActs.map(a => (
                                <div key={a.id} className="rounded-2xl border border-gray-100 bg-slate-50 overflow-hidden flex flex-col justify-between">
                                  {a.heroImage && (
                                    <div className="h-44 w-full overflow-hidden relative">
                                      <img src={a.heroImage} alt={a.name} className="w-full h-full object-cover" />
                                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#D4AF37]">
                                        {a.slot} • {a.start}
                                      </div>
                                    </div>
                                  )}
                                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                      <h4 className="font-bold text-gray-900 text-sm">{a.name}</h4>
                                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{a.desc}</p>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                                      <span>📍 {a.venue || a.pickupLoc}</span>
                                      <span>👥 {a.paxIds?.length ?? state.guests.length} Guests</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. MASTER REGISTER TABLE VIEW */}
              {viewMode === 'table' && (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Master Outing Ledger</h3>
                      <p className="text-xs text-gray-500">Operational matrix tracking all scheduled excursions across all trip days.</p>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-xl text-gray-700">
                      Total: {visibleActivities.length} Records
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">Day</th>
                          <th className="py-3.5 px-4">Time</th>
                          <th className="py-3.5 px-4">Excursion Title</th>
                          <th className="py-3.5 px-4">Venue</th>
                          <th className="py-3.5 px-4">Responsible</th>
                          <th className="py-3.5 px-4">Pax</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Cost (ZAR)</th>
                          <th className="py-3.5 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {visibleActivities.sort((a, b) => a.day - b.day || (a.start || '').localeCompare(b.start || '')).map(a => (
                          <tr key={a.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-bold text-[#1A3326]">Day {a.day}</td>
                            <td className="py-3 px-4 font-mono font-bold text-gray-900">{a.start || 'TBD'}</td>
                            <td className="py-3 px-4 font-bold text-gray-900">{a.name}</td>
                            <td className="py-3 px-4 text-gray-600 truncate max-w-[150px]">{a.venue || a.pickupLoc || 'TBD'}</td>
                            <td className="py-3 px-4 text-gray-600">{a.responsiblePerson || 'Guide'}</td>
                            <td className="py-3 px-4">
                              <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                {a.paxIds?.length ?? state.guests.length}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={a.status}
                                onChange={(e) => handleQuickStatusChange(a.id, e.target.value as any)}
                                className="text-[10px] font-bold p-1 rounded border bg-white cursor-pointer"
                              >
                                <option value="Planned">Planned</option>
                                <option value="Requested">Requested</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Completed">Completed</option>
                                <option value="Postponed">Postponed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-gray-950 font-mono">
                              R {a.total.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEditActivity(a)}
                                  className="p-1.5 text-gray-400 hover:text-gray-900 transition"
                                  title="Edit excursion"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => onRemoveActivity(a.id)}
                                  className="p-1.5 text-rose-400 hover:text-rose-600 transition"
                                  title="Remove excursion"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* CURATED EXPERIENCE CATALOGUE SLIDE-OVER DRAWER */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95">
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-slate-900 to-[#1A3326] text-white p-6 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest block">
                  Curated DMC Catalogue
                </span>
                <h3 className="text-xl font-bold font-serif flex items-center gap-2">
                  <Sparkles size={20} className="text-[#D4AF37]" />
                  Select & Schedule Experiences
                </h3>
                <p className="text-xs text-gray-300">
                  Select hand-picked Southern African excursions directly into your trip itinerary programme.
                </p>
              </div>
              <button 
                onClick={() => setIsCatalogOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter & Target Day Strip */}
            <div className="p-4 bg-slate-50 border-b border-gray-200 shrink-0 space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search safari, cableway, winery, cruise, penguins..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Target Day Selector */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                  <span className="text-[11px] font-bold text-gray-600 uppercase">Target Day:</span>
                  <select
                    value={catalogTargetDay}
                    onChange={(e) => setCatalogTargetDay(Number(e.target.value))}
                    className="px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-[#1A3326] focus:outline-none focus:border-[#D4AF37]"
                  >
                    {Array.from({ length: tripDaysCount }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Day {i + 1} ({getDayFormattedDate(i + 1)})
                      </option>
                    ))}
                  </select>

                  {/* Target Slot Selector */}
                  <select
                    value={catalogTargetSlot}
                    onChange={(e) => setCatalogTargetSlot(e.target.value as any)}
                    className="px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-[#1A3326] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Full Day">Full Day</option>
                  </select>
                </div>
              </div>

              {namedGroups.length > 0 && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Assign this experience to groups</p>
                  <div className="flex flex-wrap gap-2">
                    {namedGroups.map(group => (
                      <label key={group.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <input type="checkbox" checked={catalogTargetGroupIds.includes(group.id)} onChange={e => setCatalogTargetGroupIds(current => e.target.checked ? Array.from(new Set([...current, group.id])) : current.filter(id => id !== group.id))} className="accent-[#1A3326]" />
                        <span>{group.name}</span><span className="text-[10px] text-slate-500">({group.memberIds.length})</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">Selected group members will be assigned to the activity. Leave groups unchecked to assign individuals afterward.</p>
                </div>
              )}

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setCatalogCategory('')}
                  className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                    !catalogCategory ? 'bg-[#1A3326] text-white shadow-2xs' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {catalogCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      catalogCategory === cat ? 'bg-[#1A3326] text-white shadow-2xs' : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalogItems.map(item => (
                <div 
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-4 hover:shadow-md transition-all hover:border-[#D4AF37]/50 group"
                >
                  <div className="w-28 h-28 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative">
                    <img 
                      src={item.featuredImage || item.images?.[0]} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                      R{item.priceAdult ?? (item as any).adPrice ?? 0}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-extrabold uppercase text-[#D4AF37] tracking-wider truncate">
                          {item.destination} • {item.category}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400 font-medium">{item.duration}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs leading-snug line-clamp-1">{item.name}</h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {item.shortDescription || item.luxuryDescription || (item as any).desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono font-bold text-[#1A3326]">
                        R{item.priceAdult ?? (item as any).adPrice ?? 0} ad / R{item.priceChild ?? (item as any).chPrice ?? 0} ch
                      </span>
                      <button
                        onClick={() => {
                          handleAddFromCatalog(item, catalogTargetDay, catalogTargetSlot, catalogTargetGroupIds);
                          setIsCatalogOpen(false);
                          setCatalogTargetGroupIds([]);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#1A3326] text-white hover:bg-[#12241b] text-[11px] font-bold flex items-center gap-1 transition shadow-2xs active:scale-95 cursor-pointer"
                        title={`Add to Day ${catalogTargetDay} (${catalogTargetSlot})`}
                      >
                        <Plus size={12} />
                        <span>Add to Day {catalogTargetDay}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredCatalogItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 text-xs">
                  No matching experiences found in curated catalogue.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAST TRAVELLER ASSIGNMENT MODAL */}
      {assigningActivityId !== null && (() => {
        const act = state.activities.find(a => a.id === assigningActivityId);
        if (!act) return null;

        const currentPaxIds = act.paxIds || [];
        const isAllSelected = currentPaxIds.length === state.guests.length;
        const adultsOnlyIds = state.guests.filter(g => g.age !== 'Child' && g.age !== 'Infant').map(g => g.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95">
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider block">
                    Participant Manifest Assignment
                  </span>
                  <h3 className="text-base font-bold text-gray-900 leading-snug">{act.name}</h3>
                  <span className="text-xs text-gray-400 font-mono">
                    Day {act.day} • {act.start || 'TBD'} • {currentPaxIds.length} Travellers Assigned
                  </span>
                </div>
                <button
                  onClick={() => setAssigningActivityId(null)}
                  className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              {/* Quick Select Presets */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Quick Presets</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickAssignTravellers(act.id, state.guests.map(g => g.id))}
                    className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-[11px] text-center"
                  >
                    All Guests
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAssignTravellers(act.id, adultsOnlyIds)}
                    className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-[11px] text-center"
                  >
                    Adults Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAssignTravellers(act.id, state.guests.filter(g => g.age === 'Child' || g.age === 'Infant').map(g => g.id))}
                    className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-[11px] text-center"
                  >
                    Kids Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAssignTravellers(act.id, [])}
                    className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-[11px] text-center"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {namedGroups.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assign by named group</label>
                  <div className="flex flex-wrap gap-2">
                    {namedGroups.map(group => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleQuickAssignGroup(act.id, group.id)}
                        className={`px-3 py-2 rounded-lg border text-[11px] font-bold transition ${(act.groupIds || []).includes(group.id) ? 'bg-[#1A3326] text-white border-[#1A3326]' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                        title={`Assign ${group.memberIds.length} members from ${group.name}`}
                      >
                        {group.name} ({group.memberIds.length})
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">Choose one or more groups. The traveller roster is recalculated from their current membership.</p>
                </div>
              )}

              {/* Travellers Checkboxes */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Individual Guests</label>
                {state.guests.map(guest => {
                  const isAssigned = currentPaxIds.includes(guest.id);
                  const hasMobilityAlert = guest.mob && guest.mob.length > 0 && act.difficulty === 'Strenuous';

                  return (
                    <label 
                      key={guest.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isAssigned 
                          ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950 font-bold' 
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => {
                            const updated = isAssigned 
                              ? currentPaxIds.filter(id => id !== guest.id)
                              : [...currentPaxIds, guest.id];
                            handleQuickAssignTravellers(act.id, updated);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{guest.first} {guest.last}</span>
                            {guest.isLead && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">Lead</span>
                            )}
                            <span className="text-[9px] text-gray-400 font-medium">({guest.age})</span>
                          </div>
                          {hasMobilityAlert && (
                            <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                              ⚠️ Mobility note: {guest.mob?.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">
                        {guest.age === 'Child' || guest.age === 'Infant' ? `R${act.pChild}` : `R${act.pAdult}`}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Headcount & Valuation Summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Updated Valuation</span>
                  <strong className="text-sm font-black text-[#1A3326]">R {act.total.toLocaleString()}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningActivityId(null)}
                  className="px-5 py-2 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Done & Save
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A3326] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#D4AF37]/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
            <Route size={16} />
          </div>
          <div>
            <span className="text-xs font-bold block">{toastMessage}</span>
            <span className="text-[10px] text-gray-300">Synchronized with master workspace.</span>
          </div>
        </div>
      )}

    </div>
  );
};
