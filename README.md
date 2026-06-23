# osu!idle Score Extractor

[![License](https://img.shields.io/github/license/kibotrel/osu-idle-score-extractor)](./LICENSE)
![GitHub contributors](https://img.shields.io/github/contributors/kibotrel/osu-idle-score-extractor)

A browser extension (Chrome & Firefox) that extracts XP statistics from osu!idle game result screens and exports them for analysis and tracking.

<div align="center">
  <img width="412" height="543" alt="extension user interface" src="https://github.com/user-attachments/assets/31561498-28d1-4306-8a1d-16a08f4e82f2" />
</div>

## 🎯 Extension Capabilities

**Data Extraction**

- Parses XP gains across 11 distinct skills
- Captures song metadata including artist name, title, version, difficulty rating, and duration and background image

**Character Profile**

- Fetches character data from the osu!idle API by character ID
- Displays character name, avatar (via osu! avatar server), and global level
- Shows per-skill level and XP progress bar for all 11 skills
- Persists character data in local extension storage for instant display on next open

**User Interface**

- Beatmap card with background image (sourced from IndexedDB), song title, version with star difficulty rating, and duration
- Skill cards grid showing XP per second for each active skill
- Total XP/s summary with highlighted display
- Settings panel (gear icon) for configuring your character ID and viewing your skill profile

### 🔐 Permissions & Access

- **activeTab**: Access to the currently open osu!idle page
- **scripting**: Injection of content scripts for data extraction
- **clipboardWrite**: Permission to copy extracted data to clipboard
- **storage**: Persisting character ID and profile data locally
- **Host Permissions**:
  - `https://osu.idle.rhythmgamers.net/*` — game pages and content script injection
  - `https://api.osu.idle.rhythmgamers.net/*` — character profile API
  - `https://a.ppy.sh/*` — osu! avatar images

## 🚀 Quick Start

1. Install the extension in [Chrome](https://chromewebstore.google.com/detail/osuidle-score-extractor/beifeckgfnepjdmolmbljbjfcenoibbo) or [Firefox](https://addons.mozilla.org/en-US/firefox/addon/osu-idle-score-extractor/)
2. Navigate to an osu!idle result page
3. Click the extension icon to open the popup
4. Click **Extract** to parse the result
5. Data is automatically copied to clipboard in full format

**Setting up your character profile (optional):**

1. Click the gear icon (⚙) in the popup header to open Settings
2. Enter your osu!idle character ID in the input field
3. Your character name, avatar, global level, and per-skill progress are loaded automatically and cached for subsequent opens

See [Installation & Setup](./documentation/installation/README.md) for detailed browser-specific installation instructions from sources.

## 📁 Project Structure

```
├── content/content.js          # Data extraction and formatting logic
├── popup/
│   ├── popup.html              # Extension UI markup
│   ├── popup.js                # UI interaction handling
│   └── popup.css               # Styling
├── background/background.js    # Service worker for clipboard fallback
├── icons/                      # Extension icons (16, 32, 192, 512 px)
├── build.sh                    # Build script for Chrome + Firefox distributions
└── manifest.json               # Browser-agnostic Manifest V3 configuration
```

See [documentation/](./documentation/README.md) for detailed technical documentation.
