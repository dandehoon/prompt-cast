# Changelog

## [Unreleased]

## [3.1.0] - 2025-09-03

### Added

- **Real-time Tab Status Updates**: Site status changes (green/yellow/inactive) are now instant without delays
- **Active Tab Highlighting**: Site cards now highlight when their tab is currently active

### Changed

- **Improved Responsiveness**: Replaced polling with event-driven architecture for better performance
- **Enhanced Message Input**: Auto-resize now works when loading message history or clearing input
- **Better Site Compatibility**: Improved interaction with non-standard submit button elements

## [3.0.0] - 2025-09-02

### Added

- Centralized site management interface
- Auto-focus functionality for improved keyboard navigation
- **Drag-and-drop site reordering**: Users can now hold and drag site cards to reorder them
- **New AI Sites**: DeepSeek and Qwen AI support
- **Auto-Stop**: Automatically stops ongoing generation before sending new messages

### Changed

- Migrated from **Popup** to **Side Panel** interface for better workflow

## [2.2.0] - 2025-08-24

### Added

- **Keyboard Shortcuts**:
  - `Alt+P`: Open Prompt Cast popup
  - `Alt+Shift+P`: Close all AI site tabs instantly
- **Message History**: Navigate through previous messages using arrow keys (↑/↓)

### Changed

- Better tab management and message delivery reliability

## [2.1.0] - 2025-08-15

### Added

- Improved site and tab management performance
- Enhanced message delivery reliability
- Better error handling and retry logic

### Changed

- Faster tab launching and focusing
- More robust message injection system

## [2.0.0] - 2025-08-11

### Changed

- **Complete Extension Rebuild**: Rewritten using modern tech stack (WXT, Svelte 5, Vitest)
- **New UI Components**: Sites section with close all tabs functionality
- **Settings Panel**: Site toggles and theme selection
- **Theme Support**: Light, dark, and auto themes
- **Centralized State Management**: Improved store structure

## [1.1.1] - 2025-08-06

### Fixed

- Enhanced message handling with health checks and retries
- Better reliability for background processes

## [1.1.0] - 2025-08-06

### Added

- **New AI Sites**: Added Perplexity and Microsoft Copilot support
- **Prompt History Management**: Enhanced message history handling
- **Auto-Generated Site Configuration**: Simplified site management

### Changed

- Better logging system replacing console output
- Enhanced site configuration structure

## [1.0.1] - 2025-08-05

### Added

- **GitHub Workflows**: Automated version bump and release process
- **Enhanced Tab Management**: Better tab handling and last message storage
- **Improved Storage Logic**: Refined message storage system

### Changed

- Better storage handling and tab management
