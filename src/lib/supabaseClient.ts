import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Memory-only storage for auth sessions (doesn't persist across page reloads)
class MemoryStorage implements Storage {
  private data: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.data[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  clear(): void {
    this.data = {};
  }

  key(index: number): string | null {
    return Object.keys(this.data)[index] ?? null;
  }

  get length(): number {
    return Object.keys(this.data).length;
  }
}

// Use memory-only storage for auth sessions
// Sessions will NOT persist across page reloads
const memoryStorage = new MemoryStorage();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: memoryStorage,
    autoRefreshToken: false, // Disable auto-refresh to prevent token persistence
    persistSession: false, // Don't persist session to storage
  },
});