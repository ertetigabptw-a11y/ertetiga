import {
  doc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Warga,
  RondaSchedule,
  PresensiRonda,
  DendaRondaEntry,
  KerjaBaktiEvent,
  SuratRT,
  Pengumuman,
  KeluhanWarga,
  TagihanWarga,
  PengeluaranKas,
  PemasukanKas,
  HutangRT,
  PiutangWargaLainnya,
  AppSettings,
  UserAccount,
  LaporanBukuKasBulanan,
} from '../types';

export interface SyncData {
  users?: UserAccount[];
  wargaList?: Warga[];
  rondaSchedules?: RondaSchedule[];
  presensiList?: PresensiRonda[];
  dendaRondaList?: DendaRondaEntry[];
  kerjaBaktiEvents?: KerjaBaktiEvent[];
  suratList?: SuratRT[];
  pengumumanList?: Pengumuman[];
  keluhanList?: KeluhanWarga[];
  tagihanList?: TagihanWarga[];
  pengeluaranList?: PengeluaranKas[];
  pemasukanList?: PemasukanKas[];
  hutangList?: HutangRT[];
  piutangLainnyaList?: PiutangWargaLainnya[];
  arsipLaporanBulanan?: LaporanBukuKasBulanan[];
  activePeriode?: string;
  settings?: AppSettings;
  version?: number;
  lastUpdated?: string;
  updatedBy?: string;
}

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastUpdatedBy: string | null;
  error: string | null;
}

const SYNC_DOC_PATH = 'sync_metadata';
const SYNC_DOC_ID = 'rt03_master_okt2026';

let isInternalUpdate = false;
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Set internal flag so incoming remote snapshot doesn't trigger an immediate echo back
 */
export function setInternalUpdateFlag(val: boolean) {
  isInternalUpdate = val;
}

/**
 * Push full or partial state to Firestore
 */
export async function pushStateToFirestore(
  data: SyncData,
  updaterRole: string = 'RT.03 Sistem'
): Promise<boolean> {
  if (isInternalUpdate) {
    return true;
  }

  try {
    const docRef = doc(db, SYNC_DOC_PATH, SYNC_DOC_ID);
    const cleanPayload: Record<string, any> = {
      ...data,
      lastUpdated: new Date().toISOString(),
      updatedBy: updaterRole,
      serverTimestamp: serverTimestamp(),
    };

    await setDoc(docRef, cleanPayload, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SYNC_DOC_PATH}/${SYNC_DOC_ID}`);
    return false;
  }
}

/**
 * Debounced push to avoid flooding Firestore during rapid edits
 */
export function debouncedPushToFirestore(data: SyncData, updaterRole: string = 'RT.03 Sistem', delayMs = 1200) {
  if (isInternalUpdate) return;
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);

  syncDebounceTimer = setTimeout(() => {
    pushStateToFirestore(data, updaterRole);
  }, delayMs);
}

/**
 * Subscribe to real-time changes across devices
 */
export function subscribeToFirestoreSync(
  initialFallbackData: SyncData,
  onRemoteData: (data: SyncData) => void,
  onStatusChange: (status: SyncStatus) => void
): () => void {
  const docRef = doc(db, SYNC_DOC_PATH, SYNC_DOC_ID);

  onStatusChange({
    isConnected: false,
    isSyncing: true,
    lastSyncTime: null,
    lastUpdatedBy: null,
    error: null,
  });

  // Verify server reachability once
  getDocFromServer(docRef)
    .then(snapshot => {
      if (!snapshot.exists()) {
        // First device online: seed Firestore with initial data
        console.log('Firebase Firestore: Seeding initial data for RT.03...');
        pushStateToFirestore(initialFallbackData, 'Inisialisasi Sistem Awal');
      }
    })
    .catch(err => {
      console.warn('Firebase initial server read check:', err?.message || err);
    });

  // Real-time listener for multi-device sync
  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as SyncData;
        const syncTimestamp = remoteData.lastUpdated || new Date().toISOString();
        const updatedBy = remoteData.updatedBy || 'Perangkat Lain';

        // Notify AppContext about remote data
        onRemoteData(remoteData);

        onStatusChange({
          isConnected: true,
          isSyncing: false,
          lastSyncTime: syncTimestamp,
          lastUpdatedBy: updatedBy,
          error: null,
        });
      } else {
        // Document does not exist yet; seed it
        pushStateToFirestore(initialFallbackData, 'Inisialisasi Sistem Awal');
        onStatusChange({
          isConnected: true,
          isSyncing: false,
          lastSyncTime: new Date().toISOString(),
          lastUpdatedBy: 'Inisialisasi Baru',
          error: null,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${SYNC_DOC_PATH}/${SYNC_DOC_ID}`);
      onStatusChange({
        isConnected: false,
        isSyncing: false,
        lastSyncTime: null,
        lastUpdatedBy: null,
        error: error.message || 'Koneksi Firestore terganggu',
      });
    }
  );

  return unsubscribe;
}
