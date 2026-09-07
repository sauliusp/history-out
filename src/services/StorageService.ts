export class StorageService {
  private static instance: StorageService;
  private pendingWrites = new Map<string, Promise<void>>();

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    // Missing settings and failed reads must remain distinguishable. Otherwise
    // a temporary read failure could cause defaults to overwrite saved settings.
    const result = await chrome.storage.local.get(key);
    return (result[key] as T | undefined) ?? null;
  }

  public async set<T>(key: string, value: T): Promise<void> {
    // Preserve the order of changes even when browser writes settle slowly.
    // A failed write must not prevent a later retry from reaching storage.
    const previous = this.pendingWrites.get(key) ?? Promise.resolve();
    const pending = previous.catch(() => {}).then(() => chrome.storage.local.set({ [key]: value }));
    this.pendingWrites.set(key, pending);
    try {
      await pending;
    } finally {
      if (this.pendingWrites.get(key) === pending) this.pendingWrites.delete(key);
    }
  }

  /** Read and mutate shared state under one lock across extension workspaces. */
  public async update<T>(key: string, mutate: (current: unknown) => T): Promise<T> {
    if (typeof navigator === 'undefined' || typeof navigator.locks?.request !== 'function') {
      const error = new Error('This browser cannot safely change saved views across open windows. Update your browser and try again.');
      error.name = 'StorageLockUnavailableError';
      throw error;
    }
    return navigator.locks.request(`historyout:storage:${key}`, async () => {
      const current = await this.get<unknown>(key);
      const next = mutate(current);
      await this.set(key, next);
      return next;
    });
  }
}
