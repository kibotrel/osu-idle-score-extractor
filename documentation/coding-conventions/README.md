# Coding Conventions

Standards and patterns used throughout osu-idle-score-extractor.

## DOM Safety — No innerHTML

**All dynamic DOM construction must use safe DOM APIs.** This prevents XSS and satisfies the extension's Content Security Policy.

### Allowed

```javascript
const el = document.createElement('div');
el.textContent = untrustedValue; // safe text
el.className = 'skill-card';
parent.appendChild(el);

// Replacing children safely
parent.replaceChildren(...newChildren);
```

### Never use

```javascript
parent.innerHTML = `<div>${value}</div>`;  // XSS risk, CSP violation
el.outerHTML = something;
document.write(...);
```

## Async Patterns

### Message Passing (async response)

When a content script message handler needs to return a Promise result, `return true` is required to keep the channel open:

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_DATA') {
    extractAll()
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true; // REQUIRED — keeps the message channel open for the async response
  }
});
```

### IndexedDB — Single Connection

Open the `beatmaps` database once and reuse the connection for all store queries within a single extraction cycle. Do not open multiple connections.

```javascript
const db = await openDatabase('beatmaps');
const meta = await queryMetaStore(db, artistTitle);
const blob = await queryFilesStore(db, meta.id);
db.close();
```

## Naming Patterns

| **What**             | **Pattern**           | **Example**                                         |
| -------------------- | --------------------- | --------------------------------------------------- |
| Extraction functions | `extract{Thing}()`    | `extractSkills()`, `extractMapMeta()`               |
| Query functions      | `query{Thing}()`      | `queryBeatmapData()`                                |
| Format functions     | `format{Format}()`    | `formatFull()`                                      |
| Display functions    | `display{Thing}()`    | `displayStats()`                                    |
| Utility functions    | descriptive camelCase | `xpPerSec()`, `blobToDataURL()`, `formatDuration()` |
| Message type strings | SCREAMING_SNAKE_CASE  | `'EXTRACT_DATA'`                                    |

## Service Worker Constraints (background.js)

`background.js` runs as a Manifest V3 service worker. It has no access to:

- The DOM (`document` is undefined)
- `window` object
- Persistent globals (service worker can be killed and restarted at any time)

Code in `background.js` must be stateless and event-driven only.

## CSS Conventions

- Dark theme base: background `#0a0a0b`, text `#fafafa`
- CSS custom properties (`--color-*`) for theme tokens
- Background image layering: `position: relative` on card + `position: absolute` on `<img>` + `opacity: 0.3`
- `text-shadow` on text over background images for readability
- Grid layout for skill cards: 3-column via CSS Grid
- Yellow accent (`--color-yellow-400`) reserved for Total XP value only

## DOM Selector Reference

All selectors depend on osu.idle's HTML structure and must be verified if the site updates:

| **Element**              | **Selector**           | **Purpose**                              |
| ------------------------ | ---------------------- | ---------------------------------------- |
| Song title               | `.result__title`       | Extract "Artist - Title"                 |
| Beatmap version          | `.result__version`     | Extract version string                   |
| Skills container         | `.result__progression` | Parent of all skill rows                 |
| Individual skill row     | `.skillxp__row`        | Wrapper for one skill                    |
| Skill name               | `.skillxp__name`       | Text name of the skill                   |
| XP gain value            | `.skillxp__gain`       | Numeric XP value                         |
