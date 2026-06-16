const DEFAULT_SKILLS = {
  accuracy: 0,
  concentration: 0,
  consistency: 0,
  coordination: 0,
  jackspeed: 0,
  memory: 0,
  reading: 0,
  release: 0,
  speed: 0,
  speedjam: 0,
  stamina: 0,
};

const SKILL_ORDER = [
  'accuracy',
  'stamina',
  'consistency',
  'reading',
  'concentration',
  'speedjam',
  'speed',
  'coordination',
  'jackspeed',
  'memory',
  'release',
];

function extractMapMeta() {
  const titleElement = document.querySelector('.result__title');

  if (!titleElement) {
    return { artistTitle: null, version: null };
  }

  const artistTitle = Array.from(titleElement.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent.trim())
    .join('')
    .trim();
  const version =
    titleElement
      .querySelector('.result__version')
      ?.innerText?.replace(/^\[|\]$/g, '')
      .trim() ?? null;

  return { artistTitle, version };
}

function extractSkills() {
  const skills = { ...DEFAULT_SKILLS };
  const container = document.querySelector('.result__progression');

  if (!container) {
    return skills;
  }

  container.querySelectorAll('.skillxp__row').forEach((row) => {
    const name =
      row.querySelector('.skillxp__name')?.innerText?.trim().toLowerCase() ??
      '';
    const gainRaw =
      row.querySelector('.skillxp__gain')?.innerText?.trim() ?? '';
    const xp = parseInt(gainRaw.replace(/[^0-9]/g, ''), 10) || 0;

    if (name in skills) {
      skills[name] = xp;
    }
  });

  return skills;
}

function msToSeconds(ms) {
  return Math.round(ms / 1000);
}

function queryBeatmapMeta(artistTitle) {
  return new Promise((resolve) => {
    const request = indexedDB.open('beatmaps');

    request.onerror = () => resolve(null);
    request.onsuccess = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('meta')) {
        db.close();

        return resolve(null);
      }

      const transaction = db.transaction('meta', 'readonly');
      const store = transaction.objectStore('meta');
      const cursorRequest = store.openCursor();

      let found = null;

      cursorRequest.onsuccess = (e) => {
        const cursor = e.target.result;

        if (!cursor) {
          db.close();

          return resolve(found);
        }

        const record = cursor.value;
        const recordKey = `${record.artist} - ${record.title}`;

        if (recordKey === artistTitle) {
          found = record;
          db.close();

          return resolve(found);
        }

        cursor.continue();
      };

      cursorRequest.onerror = () => {
        db.close();
        resolve(null);
      };
    };
  });
}

function capitalize(name) {
  return name.at(0).toUpperCase() + name.slice(1);
}

function xpPerSec(xp, duration) {
  return duration ? (xp / duration).toFixed(2) : xp;
}

function formatPreview({ skills, duration }) {
  const active = Object.entries(skills).filter(([, xp]) => xp > 0);
  const lines = active.map(
    ([name, xp]) => `${capitalize(name)}: ${xpPerSec(xp, duration)} xp/s`,
  );
  const totalXP = active.reduce((sum, [, xp]) => sum + xp, 0);

  lines.push(`Total: ${xpPerSec(totalXP, duration)} xp/s`);

  return lines.join('\n');
}

function formatFull({ artistTitle, version, duration, skills }) {
  const skillValues = SKILL_ORDER.map((name) =>
    xpPerSec(skills[name] ?? 0, duration),
  );
  const totalXP = Object.values(skills).reduce((sum, xp) => sum + xp, 0);
  const total = xpPerSec(totalXP, duration);

  return [
    artistTitle ?? '',
    version ?? '',
    duration ?? '',
    ...skillValues,
    total,
  ].join('\t');
}

async function extractAll() {
  const { artistTitle, version } = extractMapMeta();
  const skills = extractSkills();

  let duration = null;

  if (artistTitle) {
    const record = await queryBeatmapMeta(artistTitle);

    if (record?.versions) {
      const match = record.versions.find((v) => v.version === version);

      if (match?.total_length != null) {
        duration = msToSeconds(match.total_length);
      }
    }
  }

  return { artistTitle, version, duration, skills };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_DATA') {
    extractAll().then((data) => {
      sendResponse({
        success: true,
        data,
        previewText: formatPreview(data),
        fullText: formatFull(data),
      });
    });
  }
  return true;
});
