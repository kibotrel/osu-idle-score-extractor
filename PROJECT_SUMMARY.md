# osu! Idle XP Export - Project Summary

## Overview

A Chrome browser extension for **osu! Idle** (a rhythm game) that extracts XP (experience points) statistics from the game's score result screen and exports them to the clipboard for analysis and tracking.

**Target Site:** `https://osu.idle.rhythmgamers.net/*`

## Key Features

### 1. Data Extraction

- Scrapes XP gains from 11 different skills in the game
- Skills tracked: Accuracy, Stamina, Consistency, Reading, Concentration, Speed Jam, Speed, Coordination, Jack Speed, Memory, Release
- Extracts song metadata: artist name, title, version, duration

### 2. Dual Output Formats

- **Preview Format** (human-readable): Shows each skill's XP per second gain
  - Example: `Accuracy: 25.50 xp/s`
  - Includes total XP calculation
- **Full Format** (machine-readable): Tab-separated values for spreadsheets
  - Columns: Artist Title | Version | Duration | [11 skill XP values] | Total XP
  - All values are XP per second rates

### 3. Database Integration

- Queries IndexedDB's `beatmaps` database to look up beatmap metadata
- Uses beatmap metadata to calculate song duration
- Enables accurate XP/s rate calculation for each skill

### 4. Simple User Interface

- Extract button: Parses current page and displays preview
- Copy button: Copies formatted data to clipboard
- Live preview textarea showing extracted data
- Status messages for user feedback

## Architecture

### File Structure

```
osu-idle-xp-export/
├── manifest.json              # Chrome extension configuration (Manifest V3)
├── content/
│   └── content.js            # Content script (runs on osu.idle domain)
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup UI logic and event handlers
│   └── popup.css             # Popup styling
├── background/
│   └── background.js         # Background service worker
└── icons/                     # Extension icons (16, 32, 192, 512 px)
```

### Key Components

#### content.js (186 lines)

**Purpose:** Content script injected into osu.idle pages for data extraction

**Main Functions:**

- `extractMapMeta()` - Parses song title and version from DOM
- `extractSkills()` - Extracts XP gains for all 11 skills from result screen
- `queryBeatmapMeta(artistTitle)` - Queries IndexedDB for beatmap duration
- `formatPreview(data)` - Formats data for human-readable preview
- `formatFull(data)` - Formats data as tab-separated values
- `extractAll()` - Main async function coordinating all extraction steps

**Message Handler:** Listens for `EXTRACT_DATA` messages from popup

#### popup.js (96 lines)

**Purpose:** Handles popup UI interactions

**Main Functions:**

- `extractFromPage()` - Sends message to content script and processes response
- `copyToClipboard()` - Copies formatted data to clipboard with fallback mechanism

**Event Listeners:**

- Extract button click → `extractFromPage()`
- Copy button click → `copyToClipboard()`

#### popup.html (34 lines)

**Structure:**

- Header with extension title
- Status message display
- Data preview textarea
- Action buttons (Extract, Copy)
- Copy feedback message

## Technical Details

### DOM Selectors Used

- `.result__title` - Song title element
- `.result__version` - Beatmap version
- `.result__progression` - Skills container
- `.skillxp__row` - Individual skill XP row
- `.skillxp__name` - Skill name
- `.skillxp__gain` - XP gain amount

### IndexedDB Access

- Database name: `beatmaps`
- Object store: `meta`
- Query by: Artist - Title concatenation
- Returns: Beatmap metadata including `versions` array with `total_length`

### Permissions

- `activeTab` - Access active tab
- `scripting` - Execute content scripts
- `clipboardWrite` - Write to clipboard
- Host permission: `https://osu.idle.rhythmgamers.net/*`

## Data Flow

1. User visits osu.idle result page
2. User clicks "Extract" button in popup
3. Popup sends `EXTRACT_DATA` message to content script
4. Content script:
   - Extracts song metadata from DOM
   - Extracts skill XP data from DOM
   - Queries IndexedDB for beatmap duration
   - Returns formatted data
5. Popup displays preview and enables Copy button
6. User clicks "Copy" to copy full format data to clipboard

## Current Limitations

- Only works on osu.idle.rhythmgamers.net domain
- Requires result screen to be visible on page
- Depends on beatmap metadata being in IndexedDB (falls back to null duration if not found)
- XP/s calculation shows as plain XP if duration is unavailable

---

**Last Updated:** 2026-06-16
**Status:** Fully functional Chrome extension

## Important Notes for Future Sessions

⚠️ **AUTOMATIC DOCUMENTATION UPDATES**: This file is automatically updated whenever code modifications are made. Always refer to this file as the source of truth for the project's current state. Do not rely on outdated information—if you're unsure about any implementation details, check this file first.
