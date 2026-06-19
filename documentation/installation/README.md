# Installation & Setup

How to load, build, and test osu-idle-score-extractor locally.

## Prerequisites

- `jq` installed (required by `build.sh` for JSON manipulation)
- A Chromium-based browser or Firefox for testing
- Access to `https://osu.idle.rhythmgamers.net/` for live testing

## Load Unpacked (Development)

### Chrome

1. Open `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the project root directory (where `manifest.json` is located)
5. The extension appears in the toolbar

### Firefox

1. Open `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on...**
4. Navigate to the project root and select `manifest.json`
5. The extension appears in the toolbar

> [!NOTE]
> Firefox temporary add-ons are removed when the browser restarts. Reload via `about:debugging` after each restart.

## Build for Distribution

Run the build script from the project root:

```bash
./build.sh
```

This produces:

- `builds/{version}-chrome.zip` — Chrome Web Store ready
- `builds/{version}-firefox.zip` — Firefox Add-ons (AMO) ready

The version is read from `manifest.json`. Ensure `jq` is installed before running.

## Testing the Extension

1. Navigate to `https://osu.idle.rhythmgamers.net/`
2. Play a song and reach the result screen
3. Click the extension icon in the toolbar to open the popup
4. Click **Extract** — skill cards and beatmap info should render

## Reloading After Code Changes

### Chrome

- Go to `chrome://extensions/` and click the **↺ Reload** button on the extension card
- If you changed `content.js`, also refresh the osu.idle tab after reloading

### Firefox

- Go to `about:debugging` → **This Firefox** → click **Reload** on the extension entry
- Refresh the osu.idle tab after reloading
