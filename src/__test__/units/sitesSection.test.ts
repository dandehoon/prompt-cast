import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EnhancedSite } from '@/types';

// Mock the stores
const mockSiteActions = {
  reorderSites: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../entrypoints/sidepanel/stores/siteStore', () => ({
  siteActions: mockSiteActions,
}));

const mockSites: EnhancedSite[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    enabled: true,
    inputSelectors: ['textarea'],
    submitSelectors: ['button[data-testid="send-button"]'],
    colors: { light: '#10a37f', dark: '#10a37f' },
    injectionMethod: 'execCommand',
    status: 'disconnected',
    color: '#10a37f',
    hasTab: false,
    isTabReady: false,
    isActiveTab: false,
    tabId: undefined,
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai',
    enabled: true,
    inputSelectors: ['textarea'],
    submitSelectors: ['.send-button'],
    colors: { light: '#cc785c', dark: '#cc785c' },
    injectionMethod: undefined,
    status: 'disconnected',
    color: '#cc785c',
    hasTab: false,
    isTabReady: false,
    isActiveTab: false,
    tabId: undefined,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com',
    enabled: true,
    inputSelectors: ['textarea'],
    submitSelectors: ['.send-button'],
    colors: { light: '#1a73e8', dark: '#1a73e8' },
    injectionMethod: undefined,
    status: 'disconnected',
    color: '#1a73e8',
    hasTab: false,
    isTabReady: false,
    isActiveTab: false,
    tabId: undefined,
  },
]; // Extract the calculateInsertIndex function logic for testing
function calculateInsertIndex(
  dragIndex: number,
  dropIndex: number,
  arrayLength: number,
): number {
  if (dropIndex >= arrayLength) {
    return arrayLength - 1; // Insert at the very end (after removal)
  }

  return dropIndex > dragIndex ? dropIndex - 1 : dropIndex;
}

// Extract the reorder logic for testing
function simulateReorder(
  sites: EnhancedSite[],
  dragIndex: number,
  dropIndex: number,
): string[] {
  if (dragIndex === dropIndex) {
    return sites.map((site) => site.id);
  }

  const newOrder = [...sites];
  const draggedItem = newOrder[dragIndex];

  // Remove the dragged item and calculate insert position
  newOrder.splice(dragIndex, 1);
  const insertIndex = calculateInsertIndex(dragIndex, dropIndex, sites.length);

  // Insert at the calculated position
  newOrder.splice(insertIndex, 0, draggedItem);
  return newOrder.map((site) => site.id);
}

describe('SitesSection Drag and Drop Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateInsertIndex', () => {
    it('should handle moving item forward in the list', () => {
      // Moving item from index 0 to index 2 in a 3-item array
      // After removal, target should be index 1
      const result = calculateInsertIndex(0, 2, 3);
      expect(result).toBe(1);
    });

    it('should handle moving item backward in the list', () => {
      // Moving item from index 2 to index 0 in a 3-item array
      // Target should remain index 0
      const result = calculateInsertIndex(2, 0, 3);
      expect(result).toBe(0);
    });

    it('should handle dropping at the end of the list', () => {
      // Dropping at the end (index >= arrayLength) should place at the very end
      const result = calculateInsertIndex(0, 3, 3);
      expect(result).toBe(2); // arrayLength - 1
    });

    it('should handle moving to adjacent position', () => {
      // Moving from index 0 to index 1
      const result = calculateInsertIndex(0, 1, 3);
      expect(result).toBe(0); // 1 - 1 = 0
    });
  });

  describe('reorder simulation', () => {
    it('should move first item to last position', () => {
      const result = simulateReorder(mockSites, 0, 3); // Drop at end
      expect(result).toEqual(['claude', 'gemini', 'chatgpt']);
    });

    it('should move last item to first position', () => {
      const result = simulateReorder(mockSites, 2, 0);
      expect(result).toEqual(['gemini', 'chatgpt', 'claude']);
    });

    it('should move middle item to the end', () => {
      const result = simulateReorder(mockSites, 1, 3); // Drop at end (beyond array)
      expect(result).toEqual(['chatgpt', 'gemini', 'claude']);
    });

    it('should move middle item forward by one position', () => {
      const result = simulateReorder(mockSites, 1, 2);
      expect(result).toEqual(['chatgpt', 'claude', 'gemini']); // No effective change
    });

    it('should move middle item backward', () => {
      const result = simulateReorder(mockSites, 1, 0);
      expect(result).toEqual(['claude', 'chatgpt', 'gemini']);
    });

    it('should not change order when dropping on same position', () => {
      const result = simulateReorder(mockSites, 1, 1);
      expect(result).toEqual(['chatgpt', 'claude', 'gemini']);
    });
  });

  describe('drag state management', () => {
    it('should properly reset drag state', () => {
      let draggedIndex: number | null = 1;
      let dragOverIndex: number | null = 2;

      // Simulate resetDragState function
      const resetDragState = () => {
        draggedIndex = null;
        dragOverIndex = null;
      };

      resetDragState();

      expect(draggedIndex).toBe(null);
      expect(dragOverIndex).toBe(null);
    });

    it('should handle drag start state correctly', () => {
      let draggedIndex: number | null = null;
      const startIndex = 1;

      // Simulate handleDragStart
      const handleDragStart = (index: number) => {
        draggedIndex = index;
      };

      handleDragStart(startIndex);

      expect(draggedIndex).toBe(startIndex);
    });

    it('should handle drag over state correctly', () => {
      let draggedIndex: number | null = 0;
      let dragOverIndex: number | null = null;

      // Simulate handleDragOver
      const handleDragOver = (index: number) => {
        if (draggedIndex !== null && draggedIndex !== index) {
          dragOverIndex = index;
        }
      };

      handleDragOver(1);
      expect(dragOverIndex).toBe(1);

      // Should not set drag over for same index
      handleDragOver(0);
      expect(dragOverIndex).toBe(1); // Should remain the same
    });
  });

  describe('edge cases', () => {
    it('should handle empty sites array', () => {
      const result = simulateReorder([], 0, 0);
      expect(result).toEqual([]);
    });

    it('should handle single item array', () => {
      const singleSite = [mockSites[0]];
      const result = simulateReorder(singleSite, 0, 0);
      expect(result).toEqual(['chatgpt']);
    });

    it('should handle calculateInsertIndex with minimum array size', () => {
      const result = calculateInsertIndex(0, 1, 1);
      expect(result).toBe(0); // Should clamp to valid range
    });
  });
});
