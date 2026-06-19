# Architecture

Overview of the osu-idle-score-extractor extension architecture.

## File Structure

```
osu-idle-score-extractor/
├── manifest.json                  # Browser-agnostic MV3 manifest
├── build.sh                       # Build script producing Chrome + Firefox zips
├── content/
│   └── content.js                 # Content script — DOM extraction + IndexedDB queries
├── popup/
│   ├── popup.html                 # Popup HTML structure
│   ├── popup.js                   # Popup UI logic and event handlers
│   └── popup.css                  # Popup styling (dark theme)
├── background/
│   └── background.js              # Background service worker — clipboard fallback
├── icons/                         # Extension icons (16, 32, 192, 512 px)
├── builds/                        # Build output (zip files, gitignored)
└── documentation/                 # This folder
```

## Component Roles

| **Component**   | **Context**     | **Responsibilities**                                                                                     |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| `content.js`    | osu.idle page   | Extracts DOM data (map metadata, skill XP), queries IndexedDB for beatmap data                           |
| `popup.js`      | Extension popup | Sends extraction request, receives result, renders UI (beatmap card + skill cards)                       |
| `popup.html`    | Extension popup | Static HTML shell; dynamic content injected by `popup.js`                                                |
| `popup.css`     | Extension popup | Dark theme, background image layering, skill card grid layout                                            |
| `background.js` | Service worker  | Handles clipboard write fallback when popup cannot access clipboard directly                             |
| `manifest.json` | Browser runtime | Declares permissions, content script rules, popup, icons; browser-specific fields injected at build time |

## Messaging Protocol

All communication between layers uses `chrome.runtime` messaging:

```javascript
// popup.js → content.js
chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_DATA' }, callback);

// content.js listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_DATA') {
    extractAll().then(sendResponse);
    return true; // keep channel open for async response
  }
});
```

## IndexedDB Schema

The extension accesses the `beatmaps` database created by the osu.idle site (not by this extension).

| **Store** | **Key**                          | **Value**                                                                              |
| --------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| `meta`    | auto-increment (cursor iterated) | `{ id, artist, title, versions: [{ version, total_length, difficulty, background }] }` |
| `files`   | `"{beatmapSetId}/{filename}"`    | Raw `Blob` (background image)                                                          |

A single DB connection is opened per extraction and reused for both store queries.

## Data Flow

1. User visits osu.idle result page
2. User clicks "Extract" button in popup
3. Popup sends `EXTRACT_DATA` message to content script
4. Content script:
   - Extracts song metadata (artist-title, version) from DOM using selectors (`.result__title`, `.result__version`)
   - Extracts skill XP data from `.result__progression` container
   - Opens IndexedDB `beatmaps` database (single connection)
   - Queries `meta` store for matching beatmap record using cursor iteration on `"${artist} - ${title}"`
   - Queries `files` store for background image blob using `IDBKeyRange.bound()` with beatmap set ID as key prefix
   - Converts background blob to base64 data URL using FileReader
   - Returns all extracted data to popup
5. Popup displays beatmap card with background image, skill cards grid, and total XP
6. Formatted tab-separated data is auto-copied to clipboard


