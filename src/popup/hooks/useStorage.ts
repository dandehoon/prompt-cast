import { useState, useEffect, useCallback } from 'react';
import { ChromeStorage } from '../../shared/storage';
import { UserPreferences } from '../../shared/types';

export function useStorage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const prefs = await ChromeStorage.getUserPreferences();
      setPreferences(prefs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load preferences',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const savePreferences = useCallback(
    async (newPreferences: UserPreferences) => {
      try {
        setError(null);
        await ChromeStorage.saveUserPreferences(newPreferences);
        setPreferences(newPreferences);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to save preferences',
        );
        throw err;
      }
    },
    [],
  );

  const updateSiteEnabled = useCallback(
    async (siteId: string, enabled: boolean) => {
      const currentPrefs = preferences || { sites: {} };
      const newPreferences: UserPreferences = {
        ...currentPrefs,
        sites: {
          ...currentPrefs.sites,
          [siteId]: { enabled },
        },
      };
      await savePreferences(newPreferences);
    },
    [preferences, savePreferences],
  );

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    error,
    savePreferences,
    updateSiteEnabled,
    reload: loadPreferences,
  };
}
