export const storage = {
  // Save value to localStorage
  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
      const raw = JSON.stringify(value);
      localStorage.setItem(key, raw);
    } catch (error) {
      console.error(`[storage:set] Failed to save key "${key}"`, error);
    }
  },

  // Read a value
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;

    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch (error) {
      console.error(`[storage:get] Failed to read key "${key}"`, error);
      return fallback;
    }
  },

  // Remove a value
  remove(key: string): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[storage:remove] Failed to remove key "${key}"`, error);
    }
  },

  // Clear all app data – optional
  clear(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.clear();
    } catch (error) {
      console.error("[storage:clear] Failed to clear storage", error);
    }
  },
};



// storage.set("members", membersArray);
// const members = storage.get<Member[]>("members", []);
// storage.remove("members");
// storage.clear();
