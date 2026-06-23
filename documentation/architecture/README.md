# Architecture

Overview of the osu-idle-score-extractor extension architecture.

## File Structure

```
osu-idle-score-extractor/
├── manifest.json                  # Browser-agnostic Manifest V3 manifest
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

| **Component**   | **Context**           | **Responsibilities**                                                                                                            |
| --------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `content.js`    | osu.idle page         | Extracts DOM data (map metadata, skill XP), queries IndexedDB for beatmap data                                                  |
| `popup.js`      | Extension popup       | Sends extraction request, receives result, renders UI (beatmap card + skill cards); manages settings view and character profile |
| `popup.html`    | Extension popup       | Static HTML shell with two views: main (extraction) and settings (character profile); dynamic content injected by `popup.js`    |
| `popup.css`     | Extension popup       | Dark theme, background image layering, skill card grid layout, settings panel and character card styles                         |
| `background.js` | Service worker        | Handles clipboard write fallback; fetches character data from osu!idle API and persists it to `chrome.storage.local`            |
| `manifest.json` | Browser runtime (MV3) | Declares permissions, content script rules, popup, icons; browser-specific fields injected at build time                        |

## Messaging Protocol

All communication between layers uses the Manifest V3 `chrome.runtime` messaging (compatible with both Chrome and Firefox):

```javascript
// popup.js → content.js - Extract score data from DOM on score page
chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_DATA' }, callback);

// content.js listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_DATA') {
    extractAll().then(sendResponse);

    return true; // keep channel open for async response
  }
});

// popup.js → background.js - Fetch character data from osu!idle api
chrome.runtime.sendMessage(
  { type: 'FETCH_CHARACTER_DATA', characterId },
  callback,
);

// background.js listener
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'FETCH_CHARACTER_DATA') {
    fetchAndStoreCharacterData(message.characterId)
      .then((data) => sendResponse({ success: true, ...data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true;
  }
});

// popup.js → background.js - Copy arbitrary data to clipboard
chrome.runtime.sendMessage({ type: 'COPY_TO_CLIPBOARD', text }, callback);
```

## IndexedDB Schema

The extension accesses the `beatmaps` database created by the osu.idle site (not by this extension).

| **Store** | **Key**                          | **Value**                                                                              |
| --------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| `meta`    | auto-increment (cursor iterated) | `{ id, artist, title, versions: [{ version, total_length, difficulty, background }] }` |
| `files`   | `"{beatmapSetId}/{filename}"`    | Raw `Blob` (background image)                                                          |

A single DB connection is opened per extraction and reused for both store queries.

## chrome.storage.local Schema

Character profile data is cached in `chrome.storage.local` by `background.js` after each successful API fetch:

| **Key**              | **Type**                                                           | **Description**                           |
| -------------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| `characterId`        | `number`                                                           | The user-configured osu!idle character ID |
| `characterName`      | `string`                                                           | In-game character name                    |
| `characterAvatarUrl` | `string`                                                           | URL to the character's osu! avatar        |
| `globalLevel`        | `number`                                                           | Overall character level                   |
| `skills`             | `Array<{ name, xp, xpToNext, level }>` (11 entries, one per skill) | Per-skill XP progress and level           |

`popup.js` reads this cache on startup to display the profile immediately before the API response arrives.

## osu!idle Character API

`background.js` fetches character data from:

```
GET https://api.osu.idle.rhythmgamers.net/v1/characters/{characterId}
```

The response is mapped to the internal skill format by `mapApiResponseToCharacterSkills()`, which reads fields like `accuracyXp`, `accuracyTotalXp`, `accuracyLevel` for each of the 11 skills.

## Data Flow

### Score Extraction

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

### Character Profile (Settings View)

1. On popup open, `popup.js` reads cached profile from `chrome.storage.local` and renders it immediately
2. `popup.js` sends `FETCH_CHARACTER_DATA` (with the stored character ID) to `background.js`
3. `background.js` fetches from the osu!idle character API, maps the response, stores it in `chrome.storage.local`, and sends the data back
4. `popup.js` updates the character card (avatar, name, global level) and re-renders per-skill progress bars
5. When the user edits the character ID input and blurs/presses Enter, steps 2–4 repeat with the new ID
