# osu! Idle XP Export - Project Summary

## Overview

A Chrome browser extension for **osu! Idle** (a rhythm game) that extracts XP (experience points) statistics from the game's score result screen and exports them to the clipboard for analysis and tracking.

**Target Site:** `https://osu.idle.rhythmgamers.net/*`

## Key Features

### 1. Data Extraction

- Scrapes XP gains from 11 different skills in the game
- Skills tracked: Accuracy, Stamina, Consistency, Reading, Concentration, Speed Jam, Speed, Coordination, Jack Speed, Memory, Release
- Extracts song metadata: artist name, title, version, difficulty rating, duration

### 2. Export Format

- **Full Format** (machine-readable): Tab-separated values for spreadsheets
  - Columns: Artist Title | Version | Duration | [11 skill XP values] | Total XP
  - All values are XP per second rates
  - Automatically copied to clipboard on extraction

### 3. Database Integration

- Queries IndexedDB's `beatmaps` database (created by the osu.idle site) using a single connection
- Uses the `meta` object store to look up beatmap metadata (duration, difficulty, ID)
- Uses the `files` object store to retrieve beatmap background images stored as blobs
- Background images are converted to base64 data URLs for display in the popup

### 4. User Interface

- Extract button: Parses current page, displays skill cards, and auto-copies to clipboard
- **Beatmap card** with background image from IndexedDB, song title (bold), version with star difficulty rating, and duration
- Visual skill cards grid showing XP/s per active skill
- Total XP/s summary with highlighted display
- Status messages and copy feedback for user feedback

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

#### content.js (~242 lines)

**Purpose:** Content script injected into osu.idle pages for data extraction

**Main Functions:**

- `extractMapMeta()` - Parses song title and version from DOM
- `extractSkills()` - Extracts XP gains for all 11 skills from result screen
- `blobToDataURL(blob)` - Converts a Blob to a base64 data URL string via FileReader
- `queryBeatmapData(artistTitle)` - Queries IndexedDB in a single connection for both beatmap metadata (`meta` store) and background image blob (`files` store). Returns `{ record, backgroundBlob }`
- `xpPerSec(xp, duration)` - Calculates XP per second rate
- `formatFull(data)` - Formats data as tab-separated values
- `extractAll()` - Main async function coordinating all extraction steps; returns artistTitle, version, duration, difficulty, skills, and backgroundUrl

**Message Handler:** Listens for `EXTRACT_DATA` messages from popup

#### popup.js (~211 lines)

**Purpose:** Handles popup UI interactions

**Main Functions:**

- `extractFromPage()` - Sends message to content script, displays results, and auto-copies
- `displayStats(data)` - Renders beatmap card (background image, title, version with star difficulty, duration) and skill cards grid with total XP display
- `formatDuration(seconds)` - Formats seconds as `m:ss`
- `copyToClipboard()` - Copies formatted data to clipboard with background script fallback
- `showCopyFeedback(message)` - Shows temporary copy success feedback

**Event Listeners:**

- Extract button click → `extractFromPage()`

#### popup.html (~46 lines)

**Structure:**

- Header with extension title
- Status message paragraph (hidden when empty via CSS)
- Stats section with:
  - Song info card: background image (`<img>` from IndexedDB blob), song title, version + star difficulty rating, duration
  - Skill cards grid (3-column)
  - Total XP bar with yellow accent
- Extract button
- Copy feedback message

#### popup.css (~260 lines)

**Notable styling:**

- Dark theme (background `#0a0a0b`, text `#fafafa`)
- Song info card uses the beatmap background image at 30% opacity behind the text, with `position: relative` / `absolute` layering and `overflow: hidden`
- Song title, version, and duration have `text-shadow` for readability over the background image
- Star difficulty rating uses muted grey (`--color-primary-2`) with inline-flex alignment; yellow (`--color-yellow-400`) is used only for the Total XP value
- Version and duration displayed on the same row via flexbox `justify-content: space-between`

## Technical Details

### DOM Selectors Used

- `.result__title` - Song title element
- `.result__version` - Beatmap version
- `.result__progression` - Skills container
- `.skillxp__row` - Individual skill XP row
- `.skillxp__name` - Skill name
- `.skillxp__gain` - XP gain amount

### IndexedDB Access

- Database name: `beatmaps` (created by the osu.idle site, not by this extension)
- Object stores accessed:
  - `meta` - Beatmap metadata. Queried by cursor iteration matching `"${artist} - ${title}"`. Records contain `id`, `artist`, `title`, and `versions` array (each with `version`, `total_length`, `difficulty`, `background`)
  - `files` - Beatmap assets stored as blobs. Keys are `"{beatmapSetId}/{filename}"` (e.g., `1174308/bg.png`). Values are raw `Blob` objects
- Single DB connection is opened and reused for both `meta` and `files` queries
- Background blob lookup uses `IDBKeyRange.bound()` with the beatmap set ID prefix for efficient key range scanning

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
   - Extracts song metadata (artist-title, version) from DOM
   - Extracts skill XP data from DOM
   - Opens IndexedDB `beatmaps` database (single connection)
   - Queries `meta` store for matching beatmap record (duration, difficulty, ID)
   - Queries `files` store for background image blob using the record's ID as key prefix
   - Converts background blob to base64 data URL
   - Returns all extracted data to popup
5. Popup displays beatmap card with background image, skill cards, and total XP
6. Formatted data is auto-copied to clipboard

## Current Limitations

- Only works on osu.idle.rhythmgamers.net domain
- Requires result screen to be visible on page
- Depends on beatmap metadata being in IndexedDB (falls back to null duration if not found)
- XP/s calculation shows as plain XP if duration is unavailable
- Background image display falls back gracefully (hidden) if not found in IndexedDB
- Meta store lookup uses cursor iteration (no index on artist/title), which scales linearly with the number of stored beatmaps

---

**Last Updated:** 2026-06-17
**Status:** Fully functional Chrome extension

## Important Notes for Future Sessions

This file is automatically updated whenever code modifications are made. Always refer to this file as the source of truth for the project's current state. Do not rely on outdated information -- if you're unsure about any implementation details, check this file first.
