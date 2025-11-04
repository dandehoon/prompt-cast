# Prompt Cast Design System & Style Guide

**Version:** 1.0
**Last Updated:** 2025-11-05
**Framework:** Svelte 5 + Tailwind CSS + CSS Custom Properties

---

## Overview

Prompt Cast uses a **CSS Custom Properties-based design system** that provides consistent theming across light and dark modes. The system is built on three layers:

1. **CSS Custom Properties** (`--pc-*` variables) - Foundation theme tokens
2. **Utility Classes** (`.pc-*` classes) - Reusable component patterns
3. **Tailwind CSS** - Layout and spacing utilities

**Design Philosophy:**
- **Minimal & Clean**: Reduced visual noise, focus on content
- **Accessible**: High contrast ratios, keyboard navigation, ARIA labels
- **Responsive**: Adapts to side panel constraints
- **Themeable**: Automatic light/dark mode with system preference support

---

## Color Palette

### Design Approach
Colors are organized into **functional categories** rather than arbitrary names, ensuring consistency and predictability. All colors are defined as CSS custom properties with automatic light/dark theme switching.

### Background Colors

#### Light Theme
```css
--pc-bg-primary:    #f5f7fa   /* Main app background */
--pc-bg-secondary:  #edf2f7   /* Secondary surfaces */
--pc-bg-card:       #ffffff   /* Card/panel backgrounds */
--pc-bg-hover:      #e2e8f0   /* Hover state backgrounds */
--pc-bg-active:     #e2e8f0   /* Active/selected backgrounds */
```

#### Dark Theme
```css
--pc-bg-primary:    #222      /* Main app background */
--pc-bg-secondary:  #2f2f2f   /* Secondary surfaces */
--pc-bg-tertiary:   #3a3a3a   /* Additional depth layer */
--pc-bg-card:       #2f2f2f   /* Card/panel backgrounds */
--pc-bg-hover:      #404040   /* Hover state backgrounds */
--pc-bg-active:     #444      /* Active/selected backgrounds */
--pc-bg-input:      #444      /* Input field backgrounds */
```

**Usage Guidelines:**
- `bg-primary`: Main app container background
- `bg-secondary`: Section/area backgrounds (unused in current implementation)
- `bg-card`: Individual components (cards, inputs, buttons)
- `bg-hover`: Temporary hover feedback
- `bg-active`: Persistent active/selected state (e.g., active tab card)

---

### Text Colors

#### Light Theme
```css
--pc-text-primary:   #1e293b   /* Primary text, headings */
--pc-text-secondary: #475569   /* Secondary text, labels */
--pc-text-muted:     #64748b   /* Placeholder, hints */
--pc-text-disabled:  #94a3b8   /* Disabled state text */
--pc-text-inverted:  #ffffff   /* Text on dark backgrounds */
```

#### Dark Theme
```css
--pc-text-primary:   #ffffff   /* Primary text, headings */
--pc-text-secondary: #e0e0e0   /* Secondary text, labels */
--pc-text-muted:     #a0a0a0   /* Placeholder, hints */
--pc-text-disabled:  #666666   /* Disabled state text */
--pc-text-inverted:  #ffffff   /* Text on dark backgrounds */
```

**Usage Guidelines:**
- `text-primary`: Main content, headings, labels (use `.pc-text-primary` or `style:color="var(--pc-text-primary)"`)
- `text-secondary`: Supporting text, icon colors (action buttons, drag handles)
- `text-muted`: Placeholders, status messages, non-critical info
- `text-disabled`: Disabled buttons, inactive elements
- `text-inverted`: Button text on colored backgrounds

**Contrast Ratios:**
- Primary text: **AAA compliant** (≥7:1 on background)
- Secondary text: **AA compliant** (≥4.5:1 on background)

---

### Border Colors

#### Light Theme
```css
--pc-border:        #d1d7db   /* Default borders */
--pc-border-hover:  #b4bcc2   /* Hover state borders */
--pc-border-focus:  #8b92a5   /* Focus state borders */
```

#### Dark Theme
```css
--pc-border:        #404040   /* Default borders */
--pc-border-hover:  #525252   /* Hover state borders */
--pc-border-focus:  #666666   /* Focus state borders */
```

**Usage Guidelines:**
- All borders should be `1px solid` with appropriate border color variable
- Cards: Use `--pc-border` by default, `--pc-border-hover` on hover
- Focus rings: Use `--pc-border-focus` or `--pc-focus` (see Shadows & Elevation)

---

### Accent Colors

```css
/* Both themes */
--pc-accent:        #3b82f6   /* Primary blue accent */
--pc-accent-hover:  #2563eb   /* Hover state accent */
--pc-accent-light:  #dbeafe   /* Light theme: tint */
                    rgba(59, 130, 246, 0.1)  /* Dark theme: transparent overlay */
--pc-focus:         rgba(59, 130, 246, 0.5)  /* Focus ring color */
```

**Usage:**
- Primary action buttons (Send button)
- Links and interactive elements
- Loading spinners
- Focus indicators

---

### Status Colors

```css
/* Semantic colors (consistent across themes) */
--pc-success:       #10b981   /* Green - success, connected */
--pc-success-light: #d1fae5   /* Light theme only */

--pc-warning:       #f59e0b   /* Amber - warnings, loading */
--pc-warning-light: #fef3c7   /* Light theme only */

--pc-error:         #ef4444   /* Red - errors, disconnected */
--pc-error-light:   #fee2e2   /* Light theme only */

--pc-info:          #3b82f6   /* Blue - informational */
--pc-info-light:    #dbeafe   /* Light theme only */
```

**Usage:**
- Success: Connected status indicators, successful operations
- Warning: Loading states, pending operations
- Error: Disconnected status, failed operations, close buttons
- Info: Informational messages, neutral notifications

**Status Indicators (2px circles):**
```css
.pc-status-connected    → --pc-success
.pc-status-loading      → --pc-info-light (yellow-ish for visibility)
.pc-status-error        → --pc-error
.pc-status-disconnected → --pc-text-disabled (gray)
```

---

### Site-Specific Colors

Each AI site has brand-specific colors defined in `src/background/siteConfigs.ts`:

| Site       | Light Color | Dark Color | Usage               |
|------------|-------------|------------|---------------------|
| ChatGPT    | `#14ba91`   | `#10a37f`  | Site logo circle    |
| Gemini     | `#4285f4`   | `#4285f4`  | Google blue         |
| Grok       | `#d55b5b`   | `#d55b5b`  | Red accent          |
| Perplexity | `#31b8c6`   | `#31b8c6`  | Cyan accent         |
| Claude     | `#cc785c`   | `#cc785c`  | Terracotta          |
| Copilot    | `#d84a12`   | `#d84a12`  | Orange accent       |
| DeepSeek   | `#5c6bc0`   | `#3f51b5`  | Indigo (light/dark) |
| Qwen       | `#4C68F6`   | `#4C68F6`  | Blue accent         |

**Usage:**
- Applied to `.site-logo` circle via inline style: `style="background-color: {site.color};"`
- Theme-aware: Automatically switches between light/dark variants

---

### Interactive States

```css
/* Light theme */
--pc-interactive-hover:  rgba(0, 0, 0, 0.06)   /* Subtle overlay on hover */
--pc-interactive-active: rgba(0, 0, 0, 0.12)   /* Stronger overlay on active */

/* Dark theme: Uses --pc-bg-hover and --pc-bg-active instead */
```

**Usage:**
- Transparent overlays for subtle interactive feedback
- Currently **unused** in implementation (using solid bg colors instead)

---

## Typography

### Font Family

```css
font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
```

**Hierarchy:**
1. **Inter** - Primary font (must be loaded separately or use system fallback)
2. **system-ui** - Platform native font (macOS: SF Pro, Windows: Segoe UI)
3. **Avenir, Helvetica, Arial** - Classic fallbacks
4. **sans-serif** - Generic fallback

**Font Loading:**
- No explicit `@font-face` declaration in current code
- Relies on system fonts for performance
- Consider adding Inter via CDN or local files for brand consistency

---

### Font Sizes

| Size Class   | CSS Value  | Pixels (16px base) | Usage                          |
|--------------|------------|--------------------|--------------------------------|
| `text-xs`    | `0.75rem`  | 12px               | Status messages, fine print    |
| `text-sm`    | `0.875rem` | 14px               | Labels, site names, buttons    |
| `text-base`  | `1rem`     | 16px               | Body text (default)            |
| Custom       | `1.1em`    | ~17.6px            | Message input textarea only    |

**Implementation Notes:**
- Message input uses custom `font-size: 1.1em` for better readability (`MessageInput.svelte:126`)
- All other text uses Tailwind's `text-sm` (14px) for compact side panel UI
- No large headings (`text-lg`, `text-xl`) used in current design

---

### Font Weights

| Weight Class   | CSS Value | Usage                               |
|----------------|-----------|-------------------------------------|
| `font-medium`  | `500`     | All text (labels, buttons, headings)|

**Implementation Notes:**
- Only `font-medium` is used throughout the entire UI
- No bold (`font-bold: 700`) or light (`font-light: 300`) weights
- Consistent weight creates visual harmony and reduces hierarchy complexity

---

### Font Styling Patterns

**Labels:**
```svelte
<label class="block text-sm font-medium" style:color="var(--pc-text-primary)">
  Compose
</label>
```

**Site Names:**
```svelte
<span class="text-sm font-medium pc-text-primary truncate">
  {site.name}
</span>
```

**Headings:**
```svelte
<h2 class="text-sm font-medium" style="color: var(--pc-text-primary);">
  Sites
</h2>
```

**Status Text:**
```svelte
<span class="text-xs opacity-70" style:color="var(--pc-text-secondary)">
  {statusMessage}
</span>
```

---

### Text Utilities

**Truncation:**
```svelte
<span class="truncate">...</span>  <!-- Ellipsis overflow -->
```

**Line Breaks:**
```svelte
<span class="whitespace-pre-line break-words">...</span>  <!-- Preserve line breaks -->
```

**Opacity:**
```svelte
<span class="opacity-70">...</span>  <!-- 70% opacity for subtle text -->
```

---

## Spacing System

### Design Philosophy
Spacing follows **Tailwind's 0.25rem (4px) base scale** with frequent use of smaller increments for compact side panel design.

---

### Padding Scale

| Class  | Value     | Pixels | Usage                                    |
|--------|-----------|--------|------------------------------------------|
| `p-1`  | `0.25rem` | 4px    | Icon button padding                      |
| `p-2`  | `0.5rem`  | 8px    | Compact padding (top/bottom sections)    |
| `p-3`  | `0.75rem` | 12px   | Card padding, input padding              |
| `p-4`  | `1rem`    | 16px   | Section padding (main, footer)           |

**Directional Padding:**
```css
pt-2   /* padding-top: 0.5rem (8px) */
pb-2   /* padding-bottom: 0.5rem (8px) */
px-4   /* padding-left/right: 1rem (16px) */
py-2   /* padding-top/bottom: 0.5rem (8px) */
```

**Component Examples:**
```svelte
<!-- Site Card -->
<div class="pc-card p-3 h-14">...</div>

<!-- Main Section -->
<main class="p-4 pt-2 pb-2 space-y-4">...</main>

<!-- Footer -->
<footer class="p-4 pt-2 pb-2 space-y-2">...</footer>

<!-- Button -->
<button class="px-4 py-2">...</button>
```

---

### Margin Scale

| Class   | Value     | Pixels | Usage                              |
|---------|-----------|--------|------------------------------------|
| `mb-1`  | `0.25rem` | 4px    | Small bottom margin (labels)       |
| `mt-2`  | `0.5rem`  | 8px    | Section top margin                 |
| `ml-3`  | `0.75rem` | 12px   | Left margin (toggle switch)        |
| `mr-2`  | `0.5rem`  | 8px    | Right margin (drag handle)         |

**Usage:**
- **Margins are rare** in the design - spacing is primarily handled via **flex gaps** and **padding**
- Used mainly for fine-tuning alignment

---

### Gap Scale (Flexbox/Grid)

| Class       | Value      | Pixels | Usage                                |
|-------------|------------|--------|--------------------------------------|
| `gap-2`     | `0.5rem`   | 8px    | Site card grid gaps                  |
| `gap-0.25rem` | `0.25rem` | 4px   | Action button groups (custom value)  |
| `space-x-2` | `0.5rem`   | 8px    | Horizontal spacing (flexbox)         |
| `space-x-3` | `0.75rem`  | 12px   | Horizontal spacing (site card items) |
| `space-y-2` | `0.5rem`   | 8px    | Vertical spacing (footer items)      |
| `space-y-4` | `1rem`     | 16px   | Vertical spacing (main sections)     |

**Component Examples:**
```svelte
<!-- Action Button Group -->
<div class="actions-container" style="gap: 0.25rem;">
  <button class="action-btn">...</button>
  <button class="action-btn">...</button>
</div>

<!-- Site Card Content -->
<div class="flex items-center space-x-3">
  <div class="site-logo">...</div>
  <span>Site Name</span>
  <div class="status">...</div>
</div>

<!-- Section Spacing -->
<main class="space-y-4">
  <SitesSection />
  <!-- 16px gap automatically applied -->
</main>
```

---

### Custom Spacing Values

For fine-grained control, use custom values:

```svelte
<!-- Custom Gap (Actions.svelte) -->
<div class="actions-container" style="display: flex; gap: 0.25rem;">

<!-- Custom Padding (Drag Handle) -->
<div class="drag-handle mr-2 p-1">

<!-- Custom Height (Drop Zone) -->
<div class="drop-zone" style="height: 8px;">
```

---

### Spacing Consistency Rules

1. **Use gaps over margins** for component spacing (flex/grid gaps)
2. **Use padding for internal spacing** (within components)
3. **Use margins sparingly** for fine-tuning only
4. **Stick to 4px increments** (0.25rem, 0.5rem, 0.75rem, 1rem)

---

## Component Styles

### Cards

**Base Card Style:**
```css
.pc-card {
  background-color: var(--pc-bg-card);
  border: 1px solid var(--pc-border);
  border-radius: 0.5rem;  /* 8px */
}

.pc-card:hover {
  border-color: var(--pc-border-hover);
  background-color: var(--pc-bg-hover);
}
```

**Site Card Variants:**
```svelte
<div class="pc-card p-3 h-14"
     class:active-tab={isActiveTab}
     class:site-disabled={!site.enabled}>
  <!-- Card content -->
</div>
```

**State Classes:**
```css
/* Active Tab (selected site) */
.pc-card.active-tab {
  background-color: var(--pc-bg-active);
  border-color: var(--pc-text-disabled);
}

/* Disabled Site */
.site-disabled {
  opacity: 0.3;  /* Entire card faded */
}

.site-disabled .site-logo {
  filter: grayscale(1);  /* Convert color to grayscale */
  opacity: 0.3;
}

/* Press Feedback */
.pc-card:active:not(.site-disabled) {
  transform: scale(0.99);  /* Subtle press effect */
}
```

---

### Buttons

#### Primary Button (Send Button)

```svelte
<button class="w-full px-4 py-2 rounded-lg text-sm font-medium"
        class:btn-normal={!loading && !disabled}
        class:btn-disabled={disabled}>
  Send
</button>
```

```css
.btn-normal {
  background-color: var(--pc-accent);
  color: var(--pc-text-inverted);
}

.btn-normal:hover {
  background-color: var(--pc-accent-hover);
}

.btn-disabled {
  background-color: var(--pc-text-disabled);
  color: var(--pc-text-inverted);
  cursor: not-allowed;
}
```

---

#### Action Buttons (Icon Buttons)

**Structure:**
```svelte
<button class="action-btn" disabled={!hasNavigationTabs}>
  <svg class="w-5 h-5" fill="currentColor">...</svg>
</button>
```

**Styles:**
```css
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;   /* 28px */
  height: 1.75rem;  /* 28px */
  padding: 0.25rem; /* 4px */
  border: 1px solid transparent;
  border-radius: 0.5rem;  /* 8px */
  background: transparent;
  color: var(--pc-text-secondary);
  cursor: pointer;
  opacity: 0.6;
}

.action-btn:hover:not(:disabled) {
  background: var(--pc-bg-hover);
  border-color: var(--pc-border);
  opacity: 0.8;
}

.action-btn:active:not(:disabled) {
  transform: scale(0.9);  /* Press feedback */
  background: var(--pc-bg-active);
  border-color: var(--pc-border-hover);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
```

**Icon Sizes:**
- Navigation buttons: `w-5 h-5` (20px)
- Theme selector: `14px × 14px` (custom size)
- Close button: `w-3 h-3` (12px)
- Toggle buttons: `w-4 h-4` (16px)

---

#### Toggle Buttons (Enable/Disable All)

```svelte
<button class="toggle-btn" disabled={isTogglingAll}>
  <svg class="w-4 h-4" fill="none" stroke="currentColor">...</svg>
</button>
```

```css
.toggle-btn {
  /* Same as .action-btn, just a semantic alias */
  width: 1.75rem;
  height: 1.75rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
  color: var(--pc-text-secondary);
  opacity: 0.6;
}
```

---

### Toggle Switches

**Custom Checkbox Switch:**
```svelte
<input type="checkbox" class="sr-only peer" checked={site.enabled} id="site-checkbox-{site.id}">
<label for="site-checkbox-{site.id}"
       class="cursor-pointer block w-11 h-6 rounded-full
              peer-focus:outline-none
              peer-checked:after:translate-x-full
              after:content-['']
              after:absolute after:top-[2px] after:left-[2px]
              after:rounded-full after:h-5 after:w-5
              after:transition-all pc-checkbox"
       style="background-color: {site.enabled ? 'var(--pc-success)' : 'var(--pc-border)'};">
</label>
```

**Breakdown:**
- **Checkbox:** Hidden with `.sr-only` (screen reader only)
- **Label:** Styled as toggle track (44px × 24px)
- **Background:** Green when enabled (`--pc-success`), gray when disabled (`--pc-border`)
- **Knob:** `::after` pseudo-element (20px circle), slides via `translate-x-full`
- **Focus State:** Handled by `peer-focus:outline-none` and browser defaults

**Styles:**
```css
label:hover {
  transform: scale(1.01);  /* Subtle scale on hover */
}

label:active {
  transform: scale(0.99);  /* Press feedback */
}

.peer:checked + label::after,
.peer:not(:checked) + label::after {
  background-color: var(--pc-text-inverted);  /* White knob */
}

.site-disabled .pc-checkbox {
  opacity: 0.8;  /* Less fade than rest of card */
}
```

---

### Input Fields

**Message Input (Textarea):**
```svelte
<textarea id="message-input"
          class="w-full min-h-20 p-3 rounded-lg resize-none overflow-y-auto"
          style:background-color="var(--pc-bg-card)"
          style:border="1px solid var(--pc-border)"
          style:color="var(--pc-text-primary)">
</textarea>
```

```css
#message-input {
  font-size: 1.1em;  /* Larger text for readability */
}

#message-input:focus {
  outline: none;  /* Remove default outline */
}

#message-input::placeholder {
  color: var(--pc-text-muted);
}
```

**Auto-Resize Behavior:**
- Dynamically adjusts height based on content (see `MessageInput.svelte:31-43`)
- Max height: 15 lines (~300px)
- Scrolls vertically beyond max height

---

### Icons & SVGs

**Icon Color:**
```svelte
<svg fill="currentColor">...</svg>  <!-- Inherits text color -->
```

**Icon Sizing:**
```svelte
<svg class="w-4 h-4">...</svg>   <!-- 16px (status icons) -->
<svg class="w-5 h-5">...</svg>   <!-- 20px (navigation buttons) -->
<svg class="w-2.5 h-2.5">...</svg>  <!-- 10px (status indicator icons) -->
```

**Opacity for Icons:**
```css
.drag-handle {
  color: var(--pc-text-secondary);
  opacity: 0.6;  /* Default subtle appearance */
}

.drag-handle:hover {
  opacity: 0.8;  /* More visible on hover */
}

.drag-handle:active {
  opacity: 1;  /* Full opacity when dragging */
}
```

---

### Status Indicators

**Site Status Dots (2px circles):**
```svelte
<div class="w-2 h-2 rounded-full pc-status"
     class:pc-status-connected={site.status === SITE_STATUS.CONNECTED}
     class:pc-status-loading={site.status === SITE_STATUS.LOADING}
     class:pc-status-error={site.status === SITE_STATUS.ERROR}
     class:pc-status-disconnected={site.status === SITE_STATUS.DISCONNECTED}>
</div>
```

```css
.pc-status-connected    { background-color: var(--pc-success); }
.pc-status-loading      { background-color: var(--pc-info-light); }
.pc-status-error        { background-color: var(--pc-error); }
.pc-status-disconnected { background-color: var(--pc-text-disabled); }

.site-disabled .pc-status {
  opacity: 0.5;  /* Fade status on disabled sites */
}
```

**Loading Spinner:**
```svelte
<div class="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
     style:border-color="var(--pc-accent)">
</div>
```

---

### Site Logo Circles

```svelte
<div class="w-4 h-4 rounded-full site-logo"
     style="background-color: {site.color};">
</div>
```

**States:**
```css
.site-disabled .site-logo {
  filter: grayscale(1);  /* Convert to grayscale */
  opacity: 0.3;          /* Fade out */
}
```

---

## Shadows & Elevation

### Shadow Scale

```css
/* Light Theme */
--pc-shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
--pc-shadow-md: 0 4px 8px -2px rgba(0, 0, 0, 0.12);
--pc-shadow-lg: 0 12px 24px -4px rgba(0, 0, 0, 0.15);

/* Dark Theme */
--pc-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--pc-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4),
                0 2px 4px -1px rgba(0, 0, 0, 0.3);
--pc-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5),
                0 4px 6px -2px rgba(0, 0, 0, 0.4);
```

### Elevation Levels

| Level | Variable       | Usage                          | Example           |
|-------|----------------|--------------------------------|-------------------|
| 0     | None           | Flat surfaces (default)        | Site cards        |
| 1     | `--pc-shadow-sm` | Subtle elevation             | (Unused currently)|
| 2     | `--pc-shadow-md` | Moderate elevation           | (Unused currently)|
| 3     | `--pc-shadow-lg` | High elevation (modals)      | (Unused currently)|

**Current Implementation:**
- **No shadows used** in the current design
- Cards use **borders only** for definition
- Elevation communicated through **background color changes** on hover/active states

**Utility Classes (Available but Unused):**
```css
.pc-shadow-sm { box-shadow: var(--pc-shadow-sm); }
.pc-shadow-md { box-shadow: var(--pc-shadow-md); }
.pc-shadow-lg { box-shadow: var(--pc-shadow-lg); }
```

---

### Focus Rings

```css
.pc-focus-ring {
  box-shadow: 0 0 0 2px var(--pc-focus);
}

/* Alternative: Browser default + custom color */
input:focus {
  outline: 2px solid var(--pc-focus);
  outline-offset: 2px;
}
```

**Current Implementation:**
- Message input uses `outline: none` and no visible focus ring
- Checkbox toggles use browser default focus behavior (`peer-focus:outline-none`)
- Consider adding focus rings for accessibility in future iterations

---

## Animations & Transitions

### Defined Animations

**Fade In (Tailwind config):**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

**Spin (Tailwind default):**
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

**Usage:**
```svelte
<!-- Loading Spinner -->
<div class="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"></div>
```

---

### Transform Transitions

**Scale Effects:**
```css
/* Button Press (smaller) */
button:active {
  transform: scale(0.9);  /* 90% size */
}

/* Card Press (subtle) */
.pc-card:active {
  transform: scale(0.99);  /* 99% size */
}

/* Toggle Hover (larger) */
label:hover {
  transform: scale(1.01);  /* 101% size */
}
```

**Translation Effects:**
```css
/* Toggle Switch Knob */
.peer:checked + label::after {
  transform: translate-x-full;  /* Slide to right */
}
```

---

### Opacity Transitions

**Icon Opacity States:**
```css
.action-btn {
  opacity: 0.6;  /* Default resting state */
}

.action-btn:hover {
  opacity: 0.8;  /* Hover state */
}

.action-btn:disabled {
  opacity: 0.3;  /* Disabled state */
}

.drag-handle {
  opacity: 0.6;
}

.drag-handle:hover {
  opacity: 0.8;
}

.drag-handle:active {
  opacity: 1;  /* Full opacity when actively dragging */
}
```

**Component Opacity:**
```css
.site-disabled {
  opacity: 0.3;  /* Fade entire disabled site card */
}

.dragging {
  opacity: 0.75;  /* Semi-transparent while dragging */
}
```

---

### Transition Properties

**Implicit Transitions:**
- Most transitions are **implicit** (browser defaults) - no explicit `transition` property defined
- Allows instant feedback for scale/opacity changes

**Explicit Transitions (Pseudo-elements):**
```css
.peer-checked:after {
  transition-all: /* Smooth slide for toggle knob */
}
```

**Recommended Addition (for smoother interactions):**
```css
.action-btn {
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.pc-card {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
```

---

## Border Radius

### Radius Scale

| Size         | Value       | Pixels | Usage                          |
|--------------|-------------|--------|--------------------------------|
| `rounded-lg` | `0.5rem`    | 8px    | Cards, buttons, inputs, action buttons |
| `rounded-full` | `9999px` | Full   | Circles (status dots, toggle switch) |

**Consistency:**
- **All rectangular elements** use `0.5rem` (8px)
- **All circular elements** use `rounded-full`
- No other radius values used

**Examples:**
```svelte
<!-- Card -->
<div class="pc-card rounded-lg">
  <!-- 8px corners, defined in .pc-card class -->
</div>

<!-- Button -->
<button class="rounded-lg">
  <!-- 8px corners -->
</button>

<!-- Status Dot -->
<div class="rounded-full">
  <!-- Perfect circle -->
</div>

<!-- Toggle Switch Track -->
<label class="rounded-full">
  <!-- Pill shape -->
</label>
```

---

## Opacity & Transparency

### Opacity Scale

| Value  | Percentage | Usage                              |
|--------|------------|------------------------------------|
| `0.3`  | 30%        | Disabled elements, inactive states |
| `0.5`  | 50%        | Disabled status indicators         |
| `0.6`  | 60%        | Default icon/action button opacity |
| `0.7`  | 70%        | Status message text                |
| `0.75` | 75%        | Dragging element                   |
| `0.8`  | 80%        | Hovered icons/buttons, checkboxes  |
| `1.0`  | 100%       | Active drag handles, primary content |

### Component Opacity Patterns

**Action Buttons:**
```css
Default: 0.6  →  Hover: 0.8  →  Disabled: 0.3
```

**Drag Handles:**
```css
Default: 0.6  →  Hover: 0.8  →  Active: 1.0
```

**Site Cards:**
```css
Enabled: 1.0  →  Disabled: 0.3 (entire card)
```

**Status Dots:**
```css
Enabled site: 1.0  →  Disabled site: 0.5
```

**Toggle Switches:**
```css
Enabled card: 1.0  →  Disabled card: 0.8 (less fade than rest)
```

---

### Transparency (RGBA Colors)

**Focus Rings:**
```css
--pc-focus: rgba(59, 130, 246, 0.5);  /* 50% blue */
```

**Dark Theme Accent Light:**
```css
--pc-accent-light: rgba(59, 130, 246, 0.1);  /* 10% blue overlay */
```

**Interactive States (Light Theme):**
```css
--pc-interactive-hover:  rgba(0, 0, 0, 0.06);   /* 6% black */
--pc-interactive-active: rgba(0, 0, 0, 0.12);   /* 12% black */
```

**Shadows:**
```css
rgba(0, 0, 0, 0.08)   /* Light theme shadow (8% opacity) */
rgba(0, 0, 0, 0.3)    /* Dark theme shadow (30% opacity) */
```

---

## Common Tailwind CSS Usage

### Layout Patterns

**Flexbox:**
```svelte
<!-- Horizontal Layout with Centered Items -->
<div class="flex items-center justify-between">
  <div>Left</div>
  <div>Right</div>
</div>

<!-- Vertical Layout (Full Height) -->
<div class="flex flex-col h-full">
  <main class="flex-1">Content</main>
  <footer>Footer</footer>
</div>

<!-- Horizontal Spacing Between Items -->
<div class="flex items-center space-x-3">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

**Grid:**
```svelte
<!-- Single Column Grid with Gaps -->
<div class="grid grid-cols-1 gap-2">
  {#each items as item}
    <div>{item}</div>
  {/each}
</div>
```

---

### Sizing

**Width:**
```svelte
<div class="w-full">Full width</div>
<div class="w-11">44px (toggle switch)</div>
<div class="w-4">16px (icon)</div>
<div class="w-2">8px (status dot)</div>
```

**Height:**
```svelte
<div class="h-full">Full height</div>
<div class="h-14">56px (site card)</div>
<div class="h-6">24px (toggle switch)</div>
<div class="min-h-20">Min 80px (textarea)</div>
```

---

### Typography

**Text Size + Weight:**
```svelte
<span class="text-xs">12px text</span>
<span class="text-sm font-medium">14px medium text</span>
```

**Text Overflow:**
```svelte
<span class="truncate">Long text that gets ellipsis...</span>
<span class="whitespace-pre-line break-words">Preserve line breaks</span>
```

---

### Conditional Classes (Svelte)

**Dynamic Classes:**
```svelte
<div class="pc-card"
     class:active-tab={isActiveTab}
     class:site-disabled={!site.enabled}>
</div>
```

Compiles to:
```html
<!-- When isActiveTab = true, site.enabled = true -->
<div class="pc-card active-tab"></div>

<!-- When isActiveTab = false, site.enabled = false -->
<div class="pc-card site-disabled"></div>
```

---

### Utility Combinations

**Button Pattern:**
```svelte
<button class="w-full px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">
  Submit
</button>
```

**Card Pattern:**
```svelte
<div class="pc-card p-3 h-14 cursor-pointer">
  Card Content
</div>
```

**Action Button Pattern:**
```svelte
<button class="flex items-center justify-center w-7 h-7 p-1 rounded-lg">
  <svg class="w-4 h-4">...</svg>
</button>
```

---

## Example Component Reference Designs

### 1. Site Card Component

**Full Implementation:**
```svelte
<div
  class="pc-card p-3 h-14"
  class:cursor-pointer={site.enabled}
  class:active-tab={isActiveTab}
  class:site-disabled={!site.enabled}
  onclick={handleCardClick}
  role="button"
  tabindex="0"
>
  <div class="flex items-center justify-between h-full">
    <!-- Drag Handle -->
    <div class="drag-handle flex-shrink-0 mr-2 p-1">
      <svg width="8" height="16" viewBox="0 0 8 16">
        <circle cx="2" cy="3" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="6" cy="3" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="2" cy="8" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="6" cy="8" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="2" cy="13" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="6" cy="13" r="1" fill="currentColor" opacity="0.4" />
      </svg>
    </div>

    <!-- Content Area -->
    <div class="flex items-center space-x-3 min-w-0 flex-1">
      <!-- Site Logo -->
      <div
        class="w-4 h-4 rounded-full site-logo flex-shrink-0"
        style="background-color: {site.color};"
      ></div>

      <!-- Site Name -->
      <span class="text-sm font-medium pc-text-primary truncate flex-1">
        {site.name}
      </span>

      <!-- Status Indicator -->
      <div
        class="w-2 h-2 rounded-full flex-shrink-0 pc-status"
        class:pc-status-connected={site.status === SITE_STATUS.CONNECTED}
        class:pc-status-loading={site.status === SITE_STATUS.LOADING}
        class:pc-status-error={site.status === SITE_STATUS.ERROR}
        class:pc-status-disconnected={site.status === SITE_STATUS.DISCONNECTED}
      ></div>
    </div>

    <!-- Toggle Switch -->
    <div class="relative inline-flex items-center flex-shrink-0 ml-3">
      <input
        type="checkbox"
        class="sr-only peer"
        checked={site.enabled}
        id="site-checkbox-{site.id}"
        onchange={handleToggle}
      />
      <label
        for="site-checkbox-{site.id}"
        class="cursor-pointer block w-11 h-6 rounded-full
               peer-focus:outline-none
               peer-checked:after:translate-x-full
               after:content-['']
               after:absolute after:top-[2px] after:left-[2px]
               after:rounded-full after:h-5 after:w-5
               after:transition-all"
        style="background-color: {site.enabled
          ? 'var(--pc-success)'
          : 'var(--pc-border)'};"
      ></label>
    </div>
  </div>
</div>

<style>
  .drag-handle {
    color: var(--pc-text-secondary);
    cursor: grab;
    opacity: 0.6;
  }

  .drag-handle:hover,
  .pc-card:hover .drag-handle {
    opacity: 0.8;
  }

  .drag-handle:active {
    opacity: 1;
  }

  .site-disabled {
    opacity: 0.3;
  }

  .site-disabled .site-logo {
    filter: grayscale(1);
    opacity: 0.3;
  }

  .pc-card.active-tab {
    background-color: var(--pc-bg-active);
    border-color: var(--pc-text-disabled);
  }

  .pc-card:active:not(.site-disabled) {
    transform: scale(0.99);
  }

  .peer:checked + label::after,
  .peer:not(:checked) + label::after {
    background-color: var(--pc-text-inverted);
  }
</style>
```

---

### 2. Action Button Component

**Full Implementation:**
```svelte
<button
  onclick={handleAction}
  disabled={!hasItems}
  class="action-btn"
  title="Action description"
  aria-label="Action description"
>
  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fill-rule="evenodd"
      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
      clip-rule="evenodd"
    />
  </svg>
</button>

<style>
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0.25rem;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--pc-text-secondary);
    cursor: pointer;
    opacity: 0.6;
  }

  .action-btn:hover:not(:disabled) {
    background: var(--pc-bg-hover);
    border-color: var(--pc-border);
    opacity: 0.8;
  }

  .action-btn:active:not(:disabled) {
    transform: scale(0.9);
    background: var(--pc-bg-active);
    border-color: var(--pc-border-hover);
  }

  .action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
```

---

### 3. Primary Button (Send Button)

**Full Implementation:**
```svelte
<button
  id="send-message-button"
  onclick={handleSend}
  disabled={!hasMessage}
  class="w-full px-4 py-2 rounded-lg text-sm font-medium"
  class:cursor-pointer={!disabled}
  class:btn-disabled={disabled}
  class:btn-normal={!loading && !disabled}
>
  Send
</button>

<style>
  .btn-disabled {
    background-color: var(--pc-text-disabled);
    color: var(--pc-text-inverted);
    cursor: not-allowed;
  }

  .btn-normal {
    background-color: var(--pc-accent);
    color: var(--pc-text-inverted);
  }

  .btn-normal:hover {
    background-color: var(--pc-accent-hover);
  }
</style>
```

---

### 4. Message Input (Auto-Resize Textarea)

**Full Implementation:**
```svelte
<div class="space-y-2">
  <label
    for="message-input"
    class="block text-sm font-medium"
    style:color="var(--pc-text-primary)"
  >
    Compose
  </label>

  <textarea
    id="message-input"
    bind:this={messageInputRef}
    value={message}
    oninput={handleInput}
    onkeydown={handleKeyDown}
    placeholder="Enter your prompt..."
    class="w-full min-h-20 p-3 rounded-lg resize-none overflow-y-auto"
    style:background-color="var(--pc-bg-card)"
    style:border="1px solid var(--pc-border)"
    style:color="var(--pc-text-primary)"
  ></textarea>
</div>

<style>
  #message-input {
    font-size: 1.1em;
  }

  #message-input:focus {
    outline: none;
  }

  #message-input::placeholder {
    color: var(--pc-text-muted);
  }
</style>
```

**Auto-Resize Logic:**
```typescript
function autoResize(target: HTMLTextAreaElement) {
  target.style.height = 'auto';
  const scrollHeight = target.scrollHeight;
  const maxHeight = 20 * 15; // 15 lines max

  if (scrollHeight <= maxHeight) {
    target.style.height = `${scrollHeight}px`;
  } else {
    target.style.height = `${maxHeight}px`;
  }
}
```

---

### 5. Loading Spinner

**Full Implementation:**
```svelte
{#if loading}
  <div
    class="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
    style:border-color="var(--pc-accent)"
  ></div>
{/if}
```

**Variants:**
```svelte
<!-- Small (16px) -->
<div class="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"></div>

<!-- Medium (20px) -->
<div class="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full"></div>

<!-- Error Color -->
<div class="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
     style:border-color="var(--pc-error)"></div>
```

---

### 6. Status Indicator with Icon

**Full Implementation:**
```svelte
<div class="flex items-center space-x-2">
  {#if statusIcon === 'loading'}
    <div
      class="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
      style:border-color="var(--pc-accent)"
    ></div>
  {:else if statusIcon === 'success'}
    <div
      class="w-4 h-4 rounded-full flex items-center justify-center"
      style:background-color="var(--pc-success)"
    >
      <svg
        class="w-2.5 h-2.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        style:color="var(--pc-text-inverted)"
      >
        <path
          fill-rule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  {:else if statusIcon === 'error'}
    <div
      class="w-4 h-4 rounded-full flex items-center justify-center"
      style:background-color="var(--pc-error)"
    >
      <svg
        class="w-2.5 h-2.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        style:color="var(--pc-text-inverted)"
      >
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  {/if}

  <span
    class="text-xs opacity-70"
    style:color="var(--pc-text-secondary)"
  >
    {statusMessage}
  </span>
</div>
```

---

## Design Tokens Summary

### Quick Reference Table

| Category            | Token Example              | Light Value | Dark Value  |
|---------------------|----------------------------|-------------|-------------|
| **Backgrounds**     | `--pc-bg-primary`          | `#f5f7fa`   | `#222`      |
|                     | `--pc-bg-card`             | `#ffffff`   | `#2f2f2f`   |
|                     | `--pc-bg-hover`            | `#e2e8f0`   | `#404040`   |
| **Text**            | `--pc-text-primary`        | `#1e293b`   | `#ffffff`   |
|                     | `--pc-text-secondary`      | `#475569`   | `#e0e0e0`   |
|                     | `--pc-text-muted`          | `#64748b`   | `#a0a0a0`   |
| **Borders**         | `--pc-border`              | `#d1d7db`   | `#404040`   |
| **Accent**          | `--pc-accent`              | `#3b82f6`   | `#3b82f6`   |
| **Status**          | `--pc-success`             | `#10b981`   | `#10b981`   |
|                     | `--pc-error`               | `#ef4444`   | `#ef4444`   |
| **Spacing**         | `p-3` (card padding)       | `12px`      | `12px`      |
|                     | `gap-2` (grid gap)         | `8px`       | `8px`       |
| **Border Radius**   | `rounded-lg`               | `8px`       | `8px`       |
| **Typography**      | `text-sm font-medium`      | `14px/500`  | `14px/500`  |
| **Opacity**         | Icon default               | `0.6`       | `0.6`       |
|                     | Disabled element           | `0.3`       | `0.3`       |

---

## Best Practices

### 1. **Always Use CSS Variables for Colors**
```svelte
<!-- ✅ Correct -->
<div style="color: var(--pc-text-primary);">Text</div>
<div class="pc-text-primary">Text</div>

<!-- ❌ Incorrect -->
<div style="color: #1e293b;">Text</div>
```

### 2. **Prefer Utility Classes Over Inline Styles**
```svelte
<!-- ✅ Correct -->
<div class="flex items-center space-x-3">

<!-- ❌ Incorrect -->
<div style="display: flex; align-items: center; gap: 12px;">
```

### 3. **Use Semantic Color Names**
```svelte
<!-- ✅ Correct -->
style:background-color="var(--pc-success)"

<!-- ❌ Incorrect -->
style:background-color="#10b981"
```

### 4. **Maintain Consistent Spacing Scale**
```svelte
<!-- ✅ Correct (4px increments) -->
<div class="p-3 gap-2 mb-1">

<!-- ❌ Incorrect (arbitrary values) -->
<div style="padding: 13px; gap: 7px; margin-bottom: 3px;">
```

### 5. **Use `flex-shrink-0` for Icons and Status Indicators**
```svelte
<!-- ✅ Correct (prevents squishing) -->
<div class="w-4 h-4 flex-shrink-0">Icon</div>

<!-- ❌ Incorrect (may shrink in flex containers) -->
<div class="w-4 h-4">Icon</div>
```

### 6. **Always Provide `aria-label` for Icon-Only Buttons**
```svelte
<!-- ✅ Correct -->
<button aria-label="Close all tabs" title="Close all tabs">
  <svg>...</svg>
</button>

<!-- ❌ Incorrect -->
<button>
  <svg>...</svg>
</button>
```

### 7. **Use Conditional Classes for State Management**
```svelte
<!-- ✅ Correct (Svelte reactive classes) -->
<div class:active-tab={isActiveTab}>

<!-- ❌ Incorrect (manual string concatenation) -->
<div class={isActiveTab ? 'active-tab' : ''}>
```

### 8. **Disable Animations for Disabled Elements**
```css
/* ✅ Correct */
.action-btn:active:not(:disabled) {
  transform: scale(0.9);
}

/* ❌ Incorrect */
.action-btn:active {
  transform: scale(0.9);  /* Triggers on disabled buttons */
}
```

---

## Accessibility Checklist

- [ ] **Color Contrast:** All text meets WCAG AA (4.5:1) or AAA (7:1) ratios
- [ ] **Focus Indicators:** Visible focus rings on all interactive elements
- [ ] **Keyboard Navigation:** All actions accessible via keyboard
- [ ] **ARIA Labels:** Icon-only buttons have `aria-label` attributes
- [ ] **Semantic HTML:** Use `<button>`, `<label>`, `<input>` appropriately
- [ ] **Screen Reader Support:** Hidden checkboxes use `sr-only` class
- [ ] **Disabled States:** Clear visual distinction (opacity 0.3, cursor not-allowed)

---

## Migration from Current to Revamp

When implementing the iframe-based revamp, maintain these design patterns:

### Colors ✅ Keep
- All CSS custom properties
- Light/dark theme system
- Site-specific colors

### Typography ✅ Keep
- Font family stack
- Font sizes (text-sm, text-xs)
- Font weight (font-medium only)

### Spacing ✅ Keep
- 4px base scale (0.25rem increments)
- Padding patterns (p-3 for cards, p-4 for sections)
- Gap system (gap-2, space-x-3)

### Components 🔄 Adapt
- **Card styles** → Apply to iframe wrappers
- **Action buttons** → Reuse for iframe controls (reload, site selector)
- **Toggle switches** → Adapt for layout selector, site enable/disable

### New Components 🆕 Add
- **Grid Layout Container** (CSS Grid for iframe positioning)
- **Iframe Header** (site name dropdown, reload button)
- **Bottom Control Panel** (message input, actions)
- **Layout Switcher** (2x2, 2x3, 3x3 presets)

### Shadows 🆕 Consider Adding
- Add subtle elevation to iframe containers for depth
- Use `--pc-shadow-sm` for iframe wrappers

---

## Conclusion

This style guide provides a **complete, production-ready design system** for Prompt Cast. Key strengths:

1. **Consistency:** CSS custom properties ensure theme coherence
2. **Simplicity:** Minimal complexity (one font weight, one border radius)
3. **Accessibility:** High contrast, keyboard navigation, ARIA support
4. **Scalability:** Token-based system adapts to new components
5. **Performance:** Utility-first approach minimizes CSS bloat

For questions or suggestions, reference the source files:
- `src/entrypoints/sidepanel/app.css` - Theme variables
- `src/entrypoints/sidepanel/common.css` - Utility classes
- Component files in `src/entrypoints/sidepanel/components/` - Implementation examples

---

**Last Updated:** 2025-11-05
**Maintained By:** Prompt Cast Team
**Version:** 1.0
