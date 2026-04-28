import { USER_STORAGE_KEY, DEFAULT_USER_ID } from "../config/constants";

export interface User {
  id: string;
  name?: string;
}

/**
 * Utility for managing user sessions and local storage persistence.
 */
export const userManager = {
  /**
   * Retrieves the current user from local storage or returns the default user.
   */
  getCurrentUser: (): User => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) return { id: DEFAULT_USER_ID };
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error("Failed to parse user from storage:", error);
      return { id: DEFAULT_USER_ID };
    }
  },

  /**
   * Updates the current user in local storage.
   */
  setCurrentUser: (user: User): void => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  /**
   * Clears the user session.
   */
  clearUser: (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
  },
};
