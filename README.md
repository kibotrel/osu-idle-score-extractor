# osu!idle Score Extractor

[![License](https://img.shields.io/github/license/kibotrel/osu-idle-score-extractor)](./LICENSE)
![GitHub contributors](https://img.shields.io/github/contributors/kibotrel/osu-idle-score-extractor)

A Chrome extension that extracts XP statistics from osu!idle game result screens and exports them for analysis and tracking.

<div align="center">
  <img width="412" height="543" alt="extension user interface" src="https://github.com/user-attachments/assets/31561498-28d1-4306-8a1d-16a08f4e82f2" />
</div>

## 🎯 Extension Capabilities

**Data Extraction**

- Parses XP gains across 11 distinct skills
- Captures song metadata including artist name, title, version, difficulty rating, and duration and background image

**User Interface**

- Beatmap card with background image (sourced from IndexedDB), song title, version with star difficulty rating, and duration
- Skill cards grid showing XP per second for each active skill
- Total XP/s summary with highlighted display

### 🔐 Permissions & Access

- **activeTab**: Access to the currently open osu!idle page
- **scripting**: Injection of content scripts for data extraction
- **clipboardWrite**: Permission to copy extracted data to clipboard
- **Host Permissions**: Full access to `https://osu.idle.rhythmgamers.net/*`

## 🚀 Quick Start

1. Install the extension in Chrome
2. Navigate to an osu!idle result page
3. Click the extension icon to open the popup
4. Click **Extract** to parse the result
5. Data is automatically copied to clipboard in full format

## 📁 Project Structure

```
├── content/content.js          # Data extraction and formatting logic
├── popup/
│   ├── popup.html              # Extension UI markup
│   ├── popup.js                # UI interaction handling
│   └── popup.css               # Styling
├── background/background.js    # Service worker for clipboard fallback
├── icons/                      # Extension icons (16, 32, 192, 512 px)
└── manifest.json               # Chrome extension configuration (Manifest V3)
```

See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for detailed technical documentation.
