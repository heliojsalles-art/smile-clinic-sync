const API_BASE = 'https://www.ganesha.vip/api/clinic';

interface SyncData {
  patients: unknown[];
  appointments: unknown[];
  templates: unknown;
  settings: unknown;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;

type SyncStatusListener = (status: 'idle' | 'syncing' | 'success' | 'error', message?: string) => void;
const listeners: Set<SyncStatusListener> = new Set();

function notifyListeners(status: 'idle' | 'syncing' | 'success' | 'error', message?: string) {
  listeners.forEach(fn => fn(status, message));
}

export function onSyncStatus(listener: SyncStatusListener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function pushData(data: SyncData): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;
  notifyListeners('syncing');
  try {
    const res = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    notifyListeners('success', 'Dados sincronizados');
    return true;
  } catch (err) {
    console.error('Sync push error:', err);
    notifyListeners('error', 'Falha ao sincronizar');
    return false;
  } finally {
    isSyncing = false;
  }
}

export async function pullData(): Promise<SyncData | null> {
  notifyListeners('syncing');
  try {
    const res = await fetch(`${API_BASE}/sync`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    notifyListeners('success', 'Dados baixados do servidor');
    return data;
  } catch (err) {
    console.error('Sync pull error:', err);
    notifyListeners('error', 'Falha ao baixar dados');
    return null;
  }
}

/** Debounced auto-sync — chamada a cada mudança de estado */
export function schedulePush(data: SyncData) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    pushData(data);
  }, 2000); // espera 2s de inatividade antes de enviar
}
