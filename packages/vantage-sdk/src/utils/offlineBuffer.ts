import type { EventContext } from "../types";

export interface OfflineBufferConfig {
  maxEvents?: number;
  maxAge?: number; // ms
}

export class OfflineBuffer {
  private dbName = "vantage-offline";
  private storeName = "events";
  private db: IDBDatabase | null = null;
  private config: Required<OfflineBufferConfig>;
  private isSupported: boolean;

  constructor(config: OfflineBufferConfig = {}) {
    this.config = {
      maxEvents: config.maxEvents ?? 1000,
      maxAge: config.maxAge ?? 24 * 60 * 60 * 1000 // 24 hours
    };
    this.isSupported = typeof indexedDB !== "undefined";
  }

  async init(): Promise<void> {
    if (!this.isSupported || this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        this.prune(); // Clean up old events on init
        resolve();
      };

      request.onerror = () => {
        console.warn("Vantage: Failed to open offline buffer DB");
        this.isSupported = false;
        resolve();
      };
    });
  }

  async add(event: EventContext): Promise<void> {
    if (!this.isSupported) return;
    if (!this.db) await this.init();
    if (!this.db) return;

    // Check count
    const count = await this.count();
    if (count >= this.config.maxEvents) {
      // Remove oldest
      await this.removeOldest();
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      store.add({ ...event, timestamp: event.timestamp || Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async popAll(): Promise<EventContext[]> {
    if (!this.isSupported) return [];
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const events = request.result;
        store.clear(); // Clear after reading
        resolve(events);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async count(): Promise<number> {
    return new Promise((resolve) => {
      if (!this.db) return resolve(0);
      const tx = this.db.transaction(this.storeName, "readonly");
      const req = tx.objectStore(this.storeName).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  }

  private async removeOldest(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const cursorReq = store.openCursor(); // Oldest first by default (keyPath autoIncrement)
      
      cursorReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          resolve();
        } else {
          resolve();
        }
      };
    });
  }

  private async prune(): Promise<void> {
    if (!this.db) return;
    const cutoff = Date.now() - this.config.maxAge;
    
    const tx = this.db.transaction(this.storeName, "readwrite");
    const store = tx.objectStore(this.storeName);
    const index = store.index("timestamp");
    const range = IDBKeyRange.upperBound(cutoff);
    
    const req = index.openCursor(range);
    
    req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
        }
    };
  }
}

