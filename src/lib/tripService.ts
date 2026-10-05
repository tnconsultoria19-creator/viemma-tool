import { doc, onSnapshot, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, isCloudConnected, handleFirestoreError, OperationType } from './firebase';
import { AppState, TripChangeLogEntry } from '../types';
import { INITIAL_TRIPS } from '../data/sampleTrips';
import { syncProjectionsToFirestore } from './shareService';

// Multi-window / multi-tab synchronization bus
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('viemma_trip_sync_bus')
  : null;

// Debounce timer map
const debounceTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Subscribe to real-time updates for a single trip by reference ID
 */
export function subscribeToTrip(
  tripId: string,
  onUpdate: (trip: AppState) => void,
  onError?: (err: unknown) => void
): () => void {
  // Check localStorage first
  const localListStr = localStorage.getItem('viemma_trips_list');
  if (localListStr) {
    try {
      const list = JSON.parse(localListStr) as AppState[];
      const found = list.find(t => t.ref === tripId || t.id === tripId);
      if (found) onUpdate(found);
    } catch {
      // ignore
    }
  }

  // Multi-tab sync listener
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'TRIP_UPDATED' && event.data?.tripId === tripId) {
      if (event.data.trip) {
        onUpdate(event.data.trip);
      }
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleBroadcast);
  }

  // If cloud Firestore is available, attach live onSnapshot
  let unsubscribeFirestore = () => {};
  if (db && isCloudConnected) {
    try {
      const docRef = doc(db, 'trips', tripId);
      unsubscribeFirestore = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as AppState;
            onUpdate(data);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `trips/${tripId}`);
          if (onError) onError(error);
        }
      );
    } catch (e) {
      console.warn('Firestore subscription initialized in local mode:', e);
    }
  }

  // Return teardown function
  return () => {
    unsubscribeFirestore();
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleBroadcast);
    }
  };
}

/**
 * Persist trip updates with optimistic caching, debounced Firestore write, and multi-window broadcast
 */
export async function saveTripToCloud(
  trip: AppState,
  options: { immediate?: boolean; changeDescription?: string; author?: string } = {}
): Promise<void> {
  const tripId = trip.ref || trip.id || 'VT-2026-9999';

  // 1. Optimistic Local Storage Sync
  try {
    localStorage.setItem('viemma_workspace_state', JSON.stringify(trip));
    const listStr = localStorage.getItem('viemma_trips_list');
    let list: AppState[] = listStr ? JSON.parse(listStr) : INITIAL_TRIPS;
    const idx = list.findIndex(t => t.ref === trip.ref || t.id === trip.id);
    if (idx >= 0) {
      list[idx] = trip;
    } else {
      list = [trip, ...list];
    }
    localStorage.setItem('viemma_trips_list', JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to update local storage:', err);
  }

  // 2. Broadcast to other open browser tabs / contexts immediately
  if (syncChannel) {
    syncChannel.postMessage({
      type: 'TRIP_UPDATED',
      tripId,
      trip,
      timestamp: Date.now()
    });
  }

  // 3. Debounced Cloud Write
  const executeCloudWrite = async () => {
    if (!db || !isCloudConnected) return;

    try {
      // Append change log if description provided
      const updatedTrip = { ...trip };
      if (options.changeDescription) {
        const newLog: TripChangeLogEntry = {
          id: `log_${Date.now()}`,
          version: (trip.version || 1) + 1,
          timestamp: new Date().toISOString(),
          author: options.author || trip.consultant || 'Operations Lead',
          category: 'Publishing',
          action: 'State Update',
          description: options.changeDescription
        };
        updatedTrip.changeLog = [newLog, ...(trip.changeLog || [])];
        updatedTrip.version = (trip.version || 1) + 1;
      }

      const docRef = doc(db, 'trips', tripId);
      await setDoc(docRef, updatedTrip, { merge: true });

      // Automatically synchronize client, agent, and ops share projections to Firestore
      await syncProjectionsToFirestore(updatedTrip);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}`);
    }
  };

  if (options.immediate) {
    if (debounceTimers[tripId]) clearTimeout(debounceTimers[tripId]);
    await executeCloudWrite();
  } else {
    if (debounceTimers[tripId]) clearTimeout(debounceTimers[tripId]);
    debounceTimers[tripId] = setTimeout(executeCloudWrite, 400);
  }
}

/**
 * Fetch a single trip by ID from Cloud Firestore or Local Fallback
 */
export async function getTripById(tripId: string): Promise<AppState | null> {
  if (db && isCloudConnected) {
    try {
      const docRef = doc(db, 'trips', tripId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as AppState;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}`);
    }
  }

  // Fallback to local storage or INITIAL_TRIPS
  const localListStr = localStorage.getItem('viemma_trips_list');
  if (localListStr) {
    try {
      const list = JSON.parse(localListStr) as AppState[];
      const found = list.find(t => t.ref === tripId || t.id === tripId);
      if (found) return found;
    } catch {
      // ignore
    }
  }

  return INITIAL_TRIPS.find(t => t.ref === tripId || t.id === tripId) || null;
}

/**
 * Fetch all trips from Cloud Firestore or Local Storage
 */
export async function listAllTrips(): Promise<AppState[]> {
  if (db && isCloudConnected) {
    try {
      const tripsCol = collection(db, 'trips');
      const snap = await getDocs(tripsCol);
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as AppState);
      } else {
        // Cloud is empty, seed initial trips to cloud
        await seedInitialTripsToCloud();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'trips');
    }
  }

  // Fallback to local storage or INITIAL_TRIPS
  const localListStr = localStorage.getItem('viemma_trips_list');
  if (localListStr) {
    try {
      const list = JSON.parse(localListStr) as AppState[];
      if (list && list.length > 0) return list;
    } catch {
      // ignore
    }
  }

  return INITIAL_TRIPS;
}

/**
 * Seed initial sample trips to Cloud Firestore
 */
export async function seedInitialTripsToCloud(): Promise<void> {
  if (!db || !isCloudConnected) return;
  try {
    for (const trip of INITIAL_TRIPS) {
      const tripId = trip.ref || trip.id;
      const docRef = doc(db, 'trips', tripId);
      await setDoc(docRef, trip, { merge: true });
    }
    console.info("⚡ Seeded sample trips to Cloud Firestore.");
  } catch (err) {
    console.warn("Could not seed initial trips to Cloud Firestore:", err);
  }
}
