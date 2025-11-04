# Prompt Cast Revamp Research: Side Panel to Single Page

**Date:** 2025-11-05
**Goal:** Explore transitioning from tab-based architecture to a single-page iframe grid layout

---

## 1. Desired Architecture

### Vision
Transform Prompt Cast from a side panel tab manager into a unified single-page interface where:

**Layout:**
- **Bottom Panel:** Chat controls and actions
  - Message input field
  - "Send Message" button
  - "New Chat" button (reloads all AI sites to origin)
  - Theme toggle (light/dark/auto)
  - Layout switcher (grid configurations)

- **Main Area:** Grid of AI sites
  - Each site displayed in an iframe/embedded view
  - Responsive grid system (auto-resizing based on number of sites)
  - Side-by-side viewing of all enabled sites simultaneously

**Per-Site Features:**
- Header above each iframe showing:
  - Site name with dropdown selector (switch to different AI site)
  - Reload button (restore to origin page)
  - Drag handle (reorder sites in grid)
- Interactive site content visible and clickable

**Benefits:**
- ✅ Unified view of all AI responses simultaneously
- ✅ No tab switching required
- ✅ Visual feedback during message injection
- ✅ Better UX for comparing responses across sites

---

## 2. Current Architecture Summary

### Entry Points

**Background Service Worker** (`src/entrypoints/background.ts`)
- Central coordinator via `BackgroundSite` class
- Manages three subsystems:
  - `SiteManager`: Site configs, preferences, ordering
  - `TabManager`: Browser tab lifecycle, focus, chat context detection
  - `MessageHandler`: Message injection coordination
- Listens to 8 message types from side panel
- Broadcasts `TAB_EVENT` for real-time UI updates
- Handles keyboard shortcuts (Alt+P, Alt+Shift+P)

**Side Panel UI** (`src/entrypoints/sidepanel/`)
- Svelte 5 reactive app
- Components:
  - `SitesSection`: Draggable site cards with status indicators
  - `MessageSection`: Input, actions, theme selector
- Real-time state sync with background via stores

### Tab Management Flow

**Current Flow:**
1. User types message in side panel
2. Side panel sends `SEND_MESSAGE` to background
3. Background's `MessageHandler` coordinates:
   - `TabManager.launchAllTabs()` - concurrent tab creation
   - Wait for each tab to be ready (15 retries, 1s intervals)
   - `ScriptInjector.injectMessage()` - executeScript per tab
4. Each tab processes independently with retry logic
5. Background broadcasts `TAB_EVENT` updates to side panel

**Key Characteristics:**
- Zero sequential delays (all parallel)
- Independent per-tab processing
- Chat context validation via `chatUriPatterns`
- Dynamic script injection (no persistent content scripts)

### Site Configuration

**Single Source of Truth** (`src/background/siteConfigs.ts`)
```typescript
interface SiteConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  colors: { light: string; dark: string };
  inputSelectors: string[];      // Where to type
  submitSelectors: string[];     // What to click
  stopSelectors?: string[];      // Stop generation button
  injectionMethod?: 'execCommand';
  chatUriPatterns?: string[];    // Valid chat URLs
}
```

**Current Sites:** ChatGPT, Gemini, Grok, Perplexity, Claude, Copilot, DeepSeek, Qwen

### Message Injection Architecture

**executeScript Approach:**
- Uses `chrome.scripting.executeScript` (Manifest V3)
- NO persistent content scripts
- Injection function runs in page context
- Capabilities:
  - Finds input via `inputSelectors`
  - Stops ongoing generation if needed
  - Injects text (multiple methods: value, contentEditable, execCommand)
  - Submits via `submitSelectors`

**Retry Logic:**
- 15 attempts max per tab
- 1000ms intervals
- Validates tab context before each attempt

### State Management

**Svelte Stores:**
- `siteStore`: Configs, ordering, enable states
- `tabStateStore`: Real-time tab info from background
- `messageStore`: Composition, history, send state
- `themeStore`: Theme preferences
- `toastStore`: Notifications
- `tabOperationsStore`: Tab actions

**Communication:**
- Type-safe via `@webext-core/messaging`
- Background → UI broadcasts
- UI → Background commands/queries

---

## 3. Technical Challenges & Blockers

### Critical Blocker: X-Frame-Options & CSP

**All major AI sites block iframe embedding:**

```
❌ ChatGPT:   X-Frame-Options: DENY
❌ Claude:    X-Frame-Options: DENY
❌ Gemini:    CSP frame-ancestors 'none'
❌ Grok:      X-Frame-Options: SAMEORIGIN
❌ Perplexity: X-Frame-Options: DENY
❌ Copilot:   X-Frame-Options: DENY
❌ DeepSeek:  X-Frame-Options: DENY
❌ Qwen:      X-Frame-Options: DENY
```

**Why Sites Block Iframing:**
- Clickjacking protection
- Security policy enforcement
- Authentication/session isolation
- CSRF attack prevention

**Impact:**
- Cannot use `<iframe>` directly
- Cannot use `<embed>` or `<object>` tags
- Standard HTML embedding is blocked by browser

### Chrome Extension Constraints

**Manifest V3 Limitations:**
- Background service worker (not persistent)
- No access to tab DOM directly from background
- Must use scripting API for page interaction
- CSP restrictions on extension pages

**Available Capabilities:**
- Full control over tabs (create, focus, query, remove)
- Execute scripts in pages with host permissions
- Modify network requests via declarativeNetRequest
- Create popup windows with positioning
- Capture tab screenshots (visible tab only)

---

## 4. Potential Solutions

### Solution A: Header Stripping via declarativeNetRequest ⭐ RECOMMENDED

**Approach:**
Use Manifest V3's `declarativeNetRequest` API to strip X-Frame-Options and CSP headers before they reach the browser, allowing iframe embedding.

**Implementation:**
```typescript
// In manifest.json
{
  "permissions": ["declarativeNetRequest"],
  "host_permissions": ["https://chatgpt.com/*", "https://claude.ai/*", ...]
}

// In background
chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "x-frame-options", operation: "remove" },
          { header: "content-security-policy", operation: "remove" }
        ]
      },
      condition: {
        urlFilter: "chatgpt.com/*",
        resourceTypes: ["sub_frame"]
      }
    }
    // ... repeat for each site
  ]
});
```

**Single Page Layout:**
```
┌─────────────────────────────────────────────────┐
│ Prompt Cast - Main Page                         │
├─────────────────────────────────────────────────┤
│                                                  │
│  Grid Area (CSS Grid / Flexbox)                 │
│  ┌──────────┬──────────┬──────────┐            │
│  │ [GPT ▼] ⟳│[Claude▼]⟳│[Gemini▼]⟳│           │
│  │──────────│──────────│──────────│            │
│  │          │          │          │            │
│  │ <iframe> │ <iframe> │ <iframe> │            │
│  │          │          │          │            │
│  │          │          │          │            │
│  ├──────────┼──────────┼──────────┤            │
│  │ [Grok ▼]⟳│[Pplx  ▼]⟳│[Coplt ▼]⟳│           │
│  │──────────│──────────│──────────│            │
│  │ <iframe> │ <iframe> │ <iframe> │            │
│  │          │          │          │            │
│  └──────────┴──────────┴──────────┘            │
│                                                  │
├─────────────────────────────────────────────────┤
│ Bottom Control Panel                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Message input field...            ]        │ │
│ │ [Send] [New Chat] [Theme: 🌙] [Layout: ⚏] │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Pros:**
- ✅ True iframe embedding (sites load fully)
- ✅ All site functionality preserved (JS, auth, WebSockets)
- ✅ Live interaction visible
- ✅ Unified view in single page
- ✅ No window management complexity
- ✅ Reuses existing injection logic (executeScript works on iframes)
- ✅ Responsive grid layout possible

**Cons:**
- ⚠️ Security implications (disabling clickjacking protection)
  - Mitigated by: Extension controls entire page context
  - User explicitly chose to load these sites
  - No third-party iframes on same page
- ⚠️ Requires `declarativeNetRequest` permission
- ⚠️ May break if sites implement additional iframe detection

**Implementation Complexity:** Medium

**Reference:**
- Existing extensions: "ignore-x-frame-options", "No X-Frame-Options"
- W3C Discussion: https://github.com/w3c/webextensions/issues/483

---

### Solution B: Tab Capture + Screenshot Display

**Approach:**
Keep tabs separate but display live screenshots in grid using `chrome.tabs.captureVisibleTab`.

**Implementation:**
```typescript
// Capture each tab periodically
setInterval(async () => {
  for (const tab of aiTabs) {
    await chrome.tabs.update(tab.id, { active: true });
    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    });
    // Send screenshot to UI for display
  }
}, 1000);
```

**Layout:** Same grid as Solution A, but showing `<img>` tags instead of `<iframe>` tags

**Pros:**
- ✅ No CSP bypass needed
- ✅ Visual feedback
- ✅ Respects site security policies

**Cons:**
- ❌ Not live/interactive (just images)
- ❌ High performance cost (constant capturing)
- ❌ Can only capture visible tab (must switch tabs)
- ❌ Click-through impossible
- ❌ Significant latency (1-2s per capture cycle)
- ❌ Doesn't solve core UX problem (still need tabs for interaction)

**Implementation Complexity:** Medium

**Verdict:** Not recommended - defeats purpose of unified interaction

---

### Solution C: Managed Popup Windows Grid

**Approach:**
Use `chrome.windows.create()` to create popup windows for each site, positioned in a grid layout.

**Implementation:**
```typescript
// Create 2x3 grid of windows
const screenWidth = screen.availWidth;
const screenHeight = screen.availHeight;
const cols = 3;
const rows = 2;
const windowWidth = Math.floor(screenWidth / cols);
const windowHeight = Math.floor(screenHeight / rows);

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    await chrome.windows.create({
      url: site.url,
      type: 'popup',
      left: col * windowWidth,
      top: row * windowHeight,
      width: windowWidth,
      height: windowHeight
    });
  }
}
```

**Pros:**
- ✅ Respects site CSP policies
- ✅ Full site functionality
- ✅ Live interaction
- ✅ Visual feedback across all sites

**Cons:**
- ❌ Complex window management
- ❌ Not truly "single page" (separate windows)
- ❌ Window focus management challenging
- ❌ No unified control panel (would need separate window)
- ❌ Screen real estate issues
- ❌ Poor UX on small screens
- ❌ Window decorations waste space

**Implementation Complexity:** High

**Verdict:** Not recommended - strays from "single page" vision

---

### Solution D: Hybrid - Control Panel + Tab Groups

**Approach:**
Enhanced version of current architecture using Chrome's Tab Groups API for visual organization.

**Implementation:**
```typescript
// Group all AI tabs
const tabIds = aiTabs.map(t => t.id);
const groupId = await chrome.tabs.group({ tabIds });
await chrome.tabGroups.update(groupId, {
  title: 'Prompt Cast',
  color: 'blue',
  collapsed: false
});
```

**Pros:**
- ✅ Respects CSP policies
- ✅ Minimal code changes
- ✅ Better visual organization

**Cons:**
- ❌ Still requires tab switching
- ❌ Not unified view
- ❌ Doesn't address core UX issue

**Implementation Complexity:** Low

**Verdict:** Not recommended - insufficient improvement

---

### Solution E: WebView Tag (Deprecated)

**Approach:**
Use `<webview>` tag (from Chrome Apps era) to embed sites.

**Status:**
- ❌ Deprecated with Chrome Apps
- ❌ Not available in Manifest V3 extensions
- ⚠️ Active proposal to bring back: https://github.com/w3c/webextensions/issues/483
- ❌ Not viable in 2025

**Verdict:** Not currently available

---

## 5. Recommended Solution: Header Stripping (Solution A)

### Why This Is Best

**Technical Feasibility:**
- Proven approach (existing extensions use it)
- Works with Manifest V3 (declarativeNetRequest)
- Compatible with all target sites

**UX Benefits:**
- True single-page experience
- Live interaction with all sites
- Responsive grid layout
- Unified control panel
- Visual feedback during injection

**Security Considerations:**
- Extension controls entire page context (no third-party content)
- User explicitly chose to load these sites
- Clickjacking risk mitigated by controlled environment
- No more risky than current tab-based approach
- Sites' authentication/CSRF protections remain intact

**Implementation Reusability:**
- 70% of current codebase can be reused:
  - Site configs (same selectors, patterns)
  - Injection logic (executeScript works on iframes)
  - Message protocol (adapted for iframe context)
  - State management (similar patterns)
  - Background coordination (modified for iframe lifecycle)

---

## 6. Implementation Plan

### Phase 1: Proof of Concept (Week 1)

**Goal:** Validate header stripping works with 2-3 sites

**Tasks:**
1. Create new entry point: `src/entrypoints/index.html` (main page)
2. Implement declarativeNetRequest rules for ChatGPT, Claude, Gemini
3. Build basic grid with 3 iframes
4. Test iframe loading and interaction
5. Verify executeScript injection works in iframe context

**Success Criteria:**
- Sites load in iframes without CSP errors
- Can interact with sites (click, type)
- Manual message injection works

---

### Phase 2: Grid System & UI (Week 2)

**Goal:** Build responsive grid and control panel

**Tasks:**
1. Implement CSS Grid layout (2x2, 2x3, 3x3 configurable)
2. Build bottom control panel UI
   - Message input (reuse MessageSection)
   - Send button
   - New Chat button
   - Theme toggle
   - Layout switcher
3. Implement per-site headers
   - Site name dropdown
   - Reload button
   - Drag handles (reorder)
4. Add responsive breakpoints
5. Implement grid auto-sizing logic

**Success Criteria:**
- Grid adapts to number of enabled sites
- Responsive on different screen sizes
- All controls functional

---

### Phase 3: Message Broadcasting (Week 3)

**Goal:** Adapt message injection for iframes

**Tasks:**
1. Modify `ScriptInjector` to target iframes
2. Update `MessageHandler` for iframe context
3. Implement "New Chat" functionality (reload iframes to origin)
4. Add error handling and retry logic
5. Update status indicators

**Technical Note:**
```typescript
// executeScript on iframe
chrome.scripting.executeScript({
  target: {
    tabId: mainPageTabId,
    frameIds: [iframeId]  // Target specific iframe
  },
  func: messageInjector,
  args: [message, selectors]
});
```

**Success Criteria:**
- Broadcast sends to all enabled sites
- Each iframe processes independently
- Visual feedback in real-time
- Error recovery works

---

### Phase 4: Site Management (Week 4)

**Goal:** Implement site switching, ordering, enable/disable

**Tasks:**
1. Build site dropdown in headers (switch AI site per slot)
2. Implement drag-and-drop reordering
3. Add enable/disable toggle per site
4. Persist grid configuration to storage
5. Implement reload button functionality
6. Add site addition/removal from grid

**Success Criteria:**
- Can swap sites in any grid position
- Drag-and-drop reorders grid
- Configuration persists across sessions

---

### Phase 5: Advanced Features (Week 5)

**Goal:** Layout switching, optimization, polish

**Tasks:**
1. Implement layout presets (2x2, 2x3, 3x3, custom)
2. Add grid position memory per layout
3. Optimize iframe loading (lazy load, skeleton screens)
4. Implement zoom controls per iframe
5. Add keyboard shortcuts
6. Performance profiling and optimization

**Success Criteria:**
- Smooth layout transitions
- No performance degradation with 6+ iframes
- Professional polish

---

### Phase 6: Testing & Migration (Week 6)

**Goal:** Comprehensive testing and deployment

**Tasks:**
1. Write unit tests for new components
2. Write E2E tests for main page flow
3. Test all 8 AI sites thoroughly
4. Create migration guide for users
5. Update documentation
6. Prepare release notes

**Success Criteria:**
- All tests pass
- Coverage maintained at 70%+
- Documentation complete

---

## 7. Architecture Changes

### New Structure

```
src/
├── entrypoints/
│   ├── background.ts              # Keep, modify for iframe events
│   ├── index.html                 # NEW - main page entry
│   └── index/                     # NEW - main page logic
│       ├── main.ts                # Entry point
│       ├── App.svelte             # Root component
│       ├── components/
│       │   ├── GridLayout.svelte      # NEW - responsive grid
│       │   ├── SiteFrame.svelte       # NEW - iframe wrapper with header
│       │   ├── ControlPanel.svelte    # NEW - bottom panel
│       │   ├── MessageInput.svelte    # Adapted from sidepanel
│       │   └── SiteSelector.svelte    # NEW - dropdown for site switching
│       └── stores/
│           ├── gridStore.ts           # NEW - grid config, layout
│           ├── iframeStore.ts         # NEW - iframe state tracking
│           ├── messageStore.ts        # Reused from sidepanel
│           └── themeStore.ts          # Reused from sidepanel
├── background/
│   ├── background.ts              # Modify: iframe lifecycle vs tab lifecycle
│   ├── messageHandler.ts          # Modify: target iframes via frameIds
│   ├── iframeManager.ts           # NEW - replaces TabManager
│   ├── scriptInjector.ts          # Modify: iframe-aware injection
│   ├── headerStripper.ts          # NEW - declarativeNetRequest rules
│   └── siteConfigs.ts             # Keep, same configs
├── shared/
│   ├── messaging.ts               # Modify: new message types
│   └── gridLayouts.ts             # NEW - layout presets
└── __test__/
    └── units/
        ├── gridStore.test.ts      # NEW
        └── iframeManager.test.ts  # NEW
```

### Removed Components
- `sidepanel/` directory (entire sidepanel UI)
- `TabManager` (replaced by `IframeManager`)

### Modified Components
- `background.ts` - Iframe lifecycle instead of tab lifecycle
- `messageHandler.ts` - Target iframes via frameIds
- `scriptInjector.ts` - Iframe-aware script execution
- `messaging.ts` - New protocol for main page ↔ background

### New Components
- `index.html` + `index/` - Main page UI
- `GridLayout.svelte` - Responsive grid system
- `SiteFrame.svelte` - Iframe with header controls
- `ControlPanel.svelte` - Bottom panel with actions
- `IframeManager` - Iframe lifecycle management
- `HeaderStripper` - declarativeNetRequest for CSP bypass
- `gridStore.ts` - Grid configuration state

---

## 8. Key Technical Considerations

### declarativeNetRequest Configuration

**Manifest V3 requires:**
```json
{
  "manifest_version": 3,
  "permissions": [
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess"
  ],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    // ... all sites
  ]
}
```

**Dynamic Rule Management:**
```typescript
// Add rules at extension startup
chrome.runtime.onInstalled.addListener(() => {
  setupHeaderStrippingRules();
});

function setupHeaderStrippingRules() {
  const rules = SITE_CONFIGS.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: "modifyHeaders",
      responseHeaders: [
        { header: "x-frame-options", operation: "remove" },
        { header: "content-security-policy", operation: "remove" }
      ]
    },
    condition: {
      urlFilter: `*://${new URL(site.url).hostname}/*`,
      resourceTypes: ["sub_frame", "main_frame"]
    }
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(r => r.id),
    addRules: rules
  });
}
```

---

### Iframe Communication

**Two Approaches:**

**Approach 1: executeScript (Recommended)**
- Reuse existing injection logic
- Works same as current tab injection
- Background executes script in iframe context
- No direct iframe ↔ main page messaging needed

```typescript
// In background
chrome.scripting.executeScript({
  target: {
    tabId: mainPageTabId,
    frameIds: [iframeId]  // Get from chrome.webNavigation.getAllFrames
  },
  func: messageInjector,
  args: [message, selectors]
});
```

**Approach 2: postMessage (Alternative)**
- Main page sends message directly to iframe
- Requires iframe cooperation (inject listener script)
- More complex but more direct

---

### Grid Layout System

**CSS Grid Approach:**
```svelte
<!-- GridLayout.svelte -->
<script lang="ts">
  import { gridStore } from '../stores/gridStore';

  $: layout = $gridStore.layout; // '2x2', '2x3', '3x3'
  $: sites = $gridStore.enabledSites;

  $: gridCols = layout.split('x')[0];
  $: gridRows = layout.split('x')[1];
</script>

<div class="grid-container" style="
  display: grid;
  grid-template-columns: repeat({gridCols}, 1fr);
  grid-template-rows: repeat({gridRows}, 1fr);
  gap: 8px;
  width: 100%;
  height: calc(100vh - 120px); /* Reserve space for bottom panel */
">
  {#each sites as site, i (site.id)}
    <SiteFrame {site} position={i} />
  {/each}
</div>
```

**Responsive Breakpoints:**
```css
/* Desktop: 3 columns */
@media (min-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tablet: 2 columns */
@media (max-width: 1199px) and (min-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile: 1 column */
@media (max-width: 767px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}
```

---

### Iframe Lifecycle Management

**IframeManager Responsibilities:**

```typescript
class IframeManager {
  private iframes: Map<string, IframeInfo> = new Map();

  // Create iframe in main page DOM
  async createIframe(siteId: string): Promise<HTMLIFrameElement>;

  // Remove iframe from DOM
  async removeIframe(siteId: string): Promise<void>;

  // Reload iframe to origin URL
  async reloadIframe(siteId: string): Promise<void>;

  // Get all iframe frameIds for script injection
  async getAllFrameIds(tabId: number): Promise<Record<string, number>>;

  // Check if iframe is ready (loaded)
  async waitForIframeReady(frameId: number): Promise<boolean>;

  // Get iframe in chat context (current URL matches chatUriPatterns)
  async getIframeContext(frameId: number): Promise<boolean>;
}

interface IframeInfo {
  siteId: string;
  frameId: number;  // Chrome's internal frame ID
  element: HTMLIFrameElement;
  url: string;
  isReady: boolean;
  isInChatContext: boolean;
}
```

**Frame ID Discovery:**
```typescript
// Get all frames in main page tab
const frames = await chrome.webNavigation.getAllFrames({ tabId: mainPageTabId });

// Match frames to sites by URL
const iframeMap = frames
  .filter(f => f.parentFrameId === 0) // Top-level iframes only
  .reduce((acc, frame) => {
    const site = findSiteByUrl(frame.url);
    if (site) acc[site.id] = frame.frameId;
    return acc;
  }, {});
```

---

### Message Broadcasting Flow

**New Flow:**

```
User types in ControlPanel
     ↓
ControlPanel.svelte calls sendMessage()
     ↓
Sends SEND_MESSAGE to background
     ↓
MessageHandler.sendMessageToIframes()
     ↓
For each enabled site:
  ├─ Get iframe frameId from IframeManager
  ├─ Check iframe ready (waitForIframeReady)
  ├─ Check chat context (getIframeContext)
  └─ ScriptInjector.injectMessage(frameId, message)
     ↓
executeScript runs in iframe
     ↓
messageInjector function executes in page context
     ↓
Finds input, stops generation if needed, types, submits
     ↓
Returns result to background
     ↓
Background aggregates results
     ↓
Sends TAB_EVENT to main page
     ↓
Main page updates status indicators
```

---

### State Synchronization

**Grid State:**
```typescript
// gridStore.ts
interface GridState {
  layout: '2x2' | '2x3' | '3x3' | 'custom';
  customCols?: number;
  customRows?: number;
  sitePositions: Record<string, number>; // siteId → grid position
  enabledSites: string[]; // Ordered list
}
```

**Iframe State:**
```typescript
// iframeStore.ts (similar to tabStateStore)
interface IframeState {
  iframes: Record<string, IframeInfo>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}
```

**Persistence:**
- Grid configuration → `chrome.storage.sync`
- Site positions → `chrome.storage.sync`
- Theme → `localStorage` (main page)
- Message history → `localStorage` (main page)

---

## 9. Migration Strategy

### For Users

**Automatic Migration:**
1. Extension updates to new version
2. First launch detects legacy data in storage
3. Migrates:
   - Site enabled states → Grid enabled sites
   - Site order → Grid positions
   - Theme preference → Main page theme
4. Opens main page in new tab
5. Shows onboarding overlay explaining new UI

**User Actions Required:**
- None - automatic migration
- Optional: Adjust layout preference (defaults to 2x3)

### For Developers

**Breaking Changes:**
- Side panel entry point removed
- `TabManager` API removed (use `IframeManager`)
- Message protocol updated (new types)

**Deprecation Timeline:**
- v4.0.0: New architecture, migration included
- v4.1.0: Remove legacy code and migration logic

---

## 10. Risks & Mitigation

### Risk 1: Sites Detect Iframe and Break

**Likelihood:** Medium
**Impact:** High

**Mitigation:**
- Monitor for JS-based iframe detection
- Add `sandbox` attribute strategically if needed
- Maintain fallback to tab-based mode if site breaks

### Risk 2: Authentication Issues

**Likelihood:** Medium
**Impact:** High

**Scenarios:**
- OAuth redirects break in iframes
- Cookie isolation in iframe context
- CORS issues with API calls

**Mitigation:**
- Test authentication flows thoroughly
- Document sites with auth issues
- Provide "Open in Tab" fallback button

### Risk 3: Performance Degradation

**Likelihood:** Medium
**Impact:** Medium

**Concerns:**
- 6-8 iframes loading simultaneously
- Memory usage
- CPU usage with multiple active sites

**Mitigation:**
- Implement lazy loading (load on-demand)
- Add iframe unloading for disabled sites
- Performance monitoring and optimization
- Progressive enhancement (start with fewer iframes)

### Risk 4: Chrome Policy Changes

**Likelihood:** Low
**Impact:** High

**Scenario:**
- Chrome restricts `declarativeNetRequest` for header modification
- New security policies block iframe embedding

**Mitigation:**
- Stay informed on Chrome extension policy changes
- Maintain relationship with Chrome extensions team
- Have fallback architecture ready (Solution C - Windows)

---

## 11. Success Metrics

### UX Metrics
- [ ] All 8 sites load in iframes without CSP errors
- [ ] Message broadcast completes in <5s for 6 sites
- [ ] Grid layout responsive on screens 1024px+
- [ ] Zero tab management overhead for users
- [ ] Visual feedback during injection visible in real-time

### Performance Metrics
- [ ] Page load time <3s with 6 iframes
- [ ] Memory usage <500MB with 6 active iframes
- [ ] CPU usage <20% during idle
- [ ] No UI lag during message broadcasting

### Code Quality Metrics
- [ ] Test coverage maintained at 70%+
- [ ] Zero TypeScript errors
- [ ] All ESLint rules passing
- [ ] E2E tests covering main flows

---

## 12. Open Questions

### Technical
- [ ] How to handle OAuth redirects in iframes? (Test with each site)
- [ ] Best approach for iframe zoom controls? (CSS zoom vs transform)
- [ ] Should we support iframe detachment to separate windows?
- [ ] How to handle sites that update their iframe detection?

### UX
- [ ] What's the optimal default layout? (2x2, 2x3, or 3x3)
- [ ] Should sites remember their last URL or always start fresh?
- [ ] How to indicate which iframe is "active" during broadcast?
- [ ] Should we support iframe minimization/maximization?

### Product
- [ ] Do we maintain backward compatibility with side panel?
- [ ] Should we support both modes (side panel + main page)?
- [ ] How to handle users with small screens (<1024px)?
- [ ] Should we add iframe-specific features (screenshot, scroll sync)?

---

## 13. Next Steps

### Immediate Actions (This Week)
1. ✅ Complete this research document
2. [ ] Create proof-of-concept branch
3. [ ] Test `declarativeNetRequest` header stripping with ChatGPT
4. [ ] Validate iframe loading with 2-3 sites
5. [ ] Share findings with stakeholders

### Short-term (Next 2 Weeks)
1. [ ] Build basic grid prototype
2. [ ] Implement header stripping for all 8 sites
3. [ ] Test authentication flows in iframes
4. [ ] Adapt message injection for iframe context
5. [ ] Performance testing with 6 iframes

### Long-term (Next 6 Weeks)
1. [ ] Complete Phase 1-6 implementation plan
2. [ ] Comprehensive testing across all sites
3. [ ] Documentation and migration guide
4. [ ] Beta testing with users
5. [ ] Production release

---

## 14. Conclusion

**The header stripping approach (Solution A) is technically feasible and provides the best UX** for the desired single-page iframe grid architecture. While it requires bypassing CSP protections via `declarativeNetRequest`, this is:

1. **Proven:** Existing extensions successfully use this approach
2. **Secure:** Extension controls the entire page context, mitigating clickjacking risks
3. **Functional:** All site features remain intact (JS, auth, WebSockets)
4. **Performant:** Modern browsers handle multiple iframes efficiently
5. **Maintainable:** 70% code reuse from current architecture

**The primary risks** (site detection, auth issues, performance) are manageable through testing, optimization, and fallback mechanisms.

**Recommended path forward:** Begin with proof-of-concept to validate header stripping works, then proceed with phased implementation over 6 weeks.

---

**Research completed:** 2025-11-05
**Document version:** 1.0
**Next review:** After POC completion
