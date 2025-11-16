/**
 * Secure storage utilities with encryption support
 */

/**
 * Simple XOR encryption for localStorage (basic obfuscation)
 * For production, consider using Web Crypto API for stronger encryption
 */
function xorEncrypt(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function xorDecrypt(encrypted: string, key: string): string {
  const text = atob(encrypted);
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Secure storage wrapper
 */
export class SecureStorage {
  private prefix: string;
  private encryptionKey: string;

  constructor(prefix: string = "vantage", encryptionKey?: string) {
    this.prefix = prefix;
    this.encryptionKey = encryptionKey || this.generateKey();
  }

  private generateKey(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  set(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = xorEncrypt(serialized, this.encryptionKey);
      localStorage.setItem(this.getKey(key), encrypted);
    } catch (error) {
      console.error("SecureStorage: Failed to set item", error);
    }
  }

  get<T = any>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(this.getKey(key));
      if (!encrypted) {
        return null;
      }
      const decrypted = xorDecrypt(encrypted, this.encryptionKey);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error("SecureStorage: Failed to get item", error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(`${this.prefix}:`)) {
        localStorage.removeItem(key);
      }
    }
  }

  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
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
      console.error("SessionStore: Failed to set item", error);
    }
  }

  get<T = any>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error("SessionStore: Failed to get item", error);
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
