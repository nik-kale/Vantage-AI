/**
 * Secure storage utilities with encryption support
 */

import { logger } from "./logger";

// Helper for IndexedDB key storage
class KeyStore {
  private dbName = "vantage-keystore";
  private storeName = "keys";
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (typeof indexedDB === "undefined") return; // No IndexedDB

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onerror = () => {
        logger.warn("SecureStorage: Failed to open IndexedDB", request.error);
        resolve(); // Continue without DB (will fail later or fallback)
      };
    });
  }

  async getKey(id: string): Promise<CryptoKey | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readonly");
      const req = tx.objectStore(this.storeName).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async setKey(id: string, key: CryptoKey): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readwrite");
      const req = tx.objectStore(this.storeName).put(key, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

/**
 * Secure storage wrapper using Web Crypto API
 */
export class SecureStorage {
  private prefix: string;
  private keyPromise: Promise<CryptoKey | string>; // CryptoKey for AES, string for XOR
  private keyStore = new KeyStore();
  private useWebCrypto: boolean;

  constructor(prefix: string = "vantage") {
    this.prefix = prefix;
    this.useWebCrypto = !!(typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined');
    this.keyPromise = this.initKey();
  }

  private async initKey(): Promise<CryptoKey | string> {
    if (this.useWebCrypto) {
      try {
        await this.keyStore.init();
        let key = await this.keyStore.getKey("master-key");
        if (!key) {
          key = await crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            false, // non-extractable from memory (though we store it in IDB)
            ["encrypt", "decrypt"]
          );
          await this.keyStore.setKey("master-key", key);
        }
        return key;
      } catch (e) {
        logger.warn("SecureStorage: Web Crypto init failed, falling back to XOR", e);
        this.useWebCrypto = false;
      }
    }
    
    // Fallback key generation for XOR
    return this.generateXorKey();
  }

  private generateXorKey(): string {
    if (typeof crypto !== 'undefined') {
       return Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
    return Math.random().toString(36).substring(2);
  }

  private getStorageKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async set(key: string, value: any): Promise<void> {
    try {
      const encryptionKey = await this.keyPromise;
      const serialized = JSON.stringify(value);

      if (this.useWebCrypto && typeof encryptionKey !== 'string') {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const data = new TextEncoder().encode(serialized);
        const encrypted = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          encryptionKey as CryptoKey,
          data
        );
        
        const storageValue = JSON.stringify({
          alg: "aes-gcm",
          iv: this.arrayBufferToBase64(iv),
          data: this.arrayBufferToBase64(encrypted)
        });
        localStorage.setItem(this.getStorageKey(key), storageValue);
      } else {
        // Fallback XOR
        const encrypted = this.xorEncrypt(serialized, encryptionKey as string);
        localStorage.setItem(this.getStorageKey(key), encrypted);
      }
    } catch (error) {
      logger.error("SecureStorage: Failed to set item", error);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(this.getStorageKey(key));
      if (!stored) return null;

      const encryptionKey = await this.keyPromise;

      if (this.useWebCrypto && typeof encryptionKey !== 'string') {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.alg === "aes-gcm") {
            const iv = this.base64ToArrayBuffer(parsed.iv);
            const data = this.base64ToArrayBuffer(parsed.data);
            const decrypted = await crypto.subtle.decrypt(
              { name: "AES-GCM", iv },
              encryptionKey as CryptoKey,
              data
            );
            const text = new TextDecoder().decode(decrypted);
            return JSON.parse(text) as T;
          }
        } catch (e) {
          // If JSON parse fails or alg mismatch, try XOR fallback (migration path)
        }
      }

      // Fallback XOR or legacy format
      const decrypted = this.xorDecrypt(stored, encryptionKey as string);
      return JSON.parse(decrypted) as T;

    } catch (error) {
      logger.error("SecureStorage: Failed to get item", error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.getStorageKey(key));
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(`${this.prefix}:`)) {
        localStorage.removeItem(key);
      }
    }
  }

  // Utilities
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private xorEncrypt(text: string, key: string): string {
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  private xorDecrypt(encrypted: string, key: string): string {
    // If key is object (CryptoKey) but we fell back here, we need a string key.
    // This shouldn't happen if logic is correct, but let's handle it.
    const keyStr = typeof key === 'string' ? key : "fallback-key";
    try {
      const text = atob(encrypted);
      let result = "";
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length));
      }
      return result;
    } catch (e) {
      return "";
    }
  }
}

/**
 * Session storage wrapper (ephemeral, no encryption needed)
 */
export class SessionStore {
  private prefix: string;

  constructor(prefix: string = "vantage") {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  set(key: string, value: any): void {
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      logger.error("SessionStore: Failed to set item", error);
    }
  }

  get<T = any>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      logger.error("SessionStore: Failed to get item", error);
      return null;
    }
  }

  remove(key: string): void {
    sessionStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.startsWith(`${this.prefix}:`)) {
        sessionStorage.removeItem(key);
      }
    }
  }
}
