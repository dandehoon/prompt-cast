import { UserPreferences } from './types';

export class ChromeStorage {
  /**
   * Get user preferences from Chrome storage
   */
  static async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const result = await chrome.storage.sync.get(['userPreferences']);
      return result.userPreferences || null;
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      return null;
    }
  }

  /**
   * Save user preferences to Chrome storage
   */
  static async saveUserPreferences(
    preferences: UserPreferences,
  ): Promise<void> {
    try {
      await chrome.storage.sync.set({ userPreferences: preferences });
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw error;
    }
  }

  /**
   * Clear all stored data
   */
  static async clear(): Promise<void> {
    try {
      await chrome.storage.sync.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }
}
