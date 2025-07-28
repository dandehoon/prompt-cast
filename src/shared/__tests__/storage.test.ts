import { ChromeStorage } from '../storage';
import { UserPreferences } from '../types';
import { logger } from '../logger';

describe('ChromeStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPreferences', () => {
    it('should return user preferences when they exist', async () => {
      const mockPreferences: UserPreferences = {
        services: {
          chatgpt: { enabled: true },
          claude: { enabled: false },
        },
      };

      (chrome.storage.sync.get as jest.Mock).mockResolvedValue({
        userPreferences: mockPreferences,
      });

      const result = await ChromeStorage.getUserPreferences();

      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['userPreferences']);
      expect(result).toEqual(mockPreferences);
    });

    it('should return null when no preferences exist', async () => {
      (chrome.storage.sync.get as jest.Mock).mockResolvedValue({});

      const result = await ChromeStorage.getUserPreferences();

      expect(result).toBeNull();
    });

    it('should return null and log error on failure', async () => {
      const loggerSpy = jest.spyOn(logger, 'error').mockImplementation();
      (chrome.storage.sync.get as jest.Mock).mockRejectedValue(
        new Error('Storage error'),
      );

      const result = await ChromeStorage.getUserPreferences();

      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to load user preferences:',
        expect.any(Error),
      );

      loggerSpy.mockRestore();
    });
  });

  describe('saveUserPreferences', () => {
    it('should save user preferences successfully', async () => {
      const mockPreferences: UserPreferences = {
        services: {
          chatgpt: { enabled: true },
        },
      };

      (chrome.storage.sync.set as jest.Mock).mockResolvedValue(undefined);

      await ChromeStorage.saveUserPreferences(mockPreferences);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        userPreferences: mockPreferences,
      });
    });

    it('should throw error on save failure', async () => {
      const loggerSpy = jest.spyOn(logger, 'error').mockImplementation();
      const mockPreferences: UserPreferences = { services: {} };
      const error = new Error('Save failed');

      (chrome.storage.sync.set as jest.Mock).mockRejectedValue(error);

      await expect(
        ChromeStorage.saveUserPreferences(mockPreferences),
      ).rejects.toThrow(error);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to save user preferences:',
        error,
      );

      loggerSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear storage successfully', async () => {
      (chrome.storage.sync.clear as jest.Mock).mockResolvedValue(undefined);

      await ChromeStorage.clear();

      expect(chrome.storage.sync.clear).toHaveBeenCalled();
    });

    it('should throw error on clear failure', async () => {
      const loggerSpy = jest.spyOn(logger, 'error').mockImplementation();
      const error = new Error('Clear failed');

      (chrome.storage.sync.clear as jest.Mock).mockRejectedValue(error);

      await expect(ChromeStorage.clear()).rejects.toThrow(error);
      expect(loggerSpy).toHaveBeenCalledWith('Failed to clear storage:', error);

      loggerSpy.mockRestore();
    });
  });
});
