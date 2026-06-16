# osu!idle Score Extractor

A Chrome extension that extracts score data from osu!idle game results and exports it for analysis and tracking.

## 🎯 Extension Capabilities

**Data Extraction**

- Automatically parses XP gains across 11 distinct skills present in the game.
- Captures song metadata including artist name, difficulty, and duration

**Dual Export Formats**

- **Preview Format**: Human-readable display showing each skill's XP gains and total XP earned
- **Full Format**: Tab-separated values optimized for spreadsheet import and data analysis

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
5. Data is automatically copied to clipboard in full format (with preview displayed)

## 📁 Project Structure

```
├── content/content.js          # Data extraction and formatting logic
├── popup/
│   ├── popup.html             # Extension UI markup
│   ├── popup.js               # UI interaction handling
│   └── popup.css              # Styling
├── background/background.js    # Service worker for clipboard fallback
├── icons/                      # Extension icons
└── manifest.json              # Chrome extension configuration
```

See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for detailed technical documentation.
