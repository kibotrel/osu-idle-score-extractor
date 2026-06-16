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

function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function queryBeatmapData(artistTitle) {
  return new Promise((resolve) => {
    const request = indexedDB.open('beatmaps');

    request.onerror = () => resolve({ record: null, backgroundBlob: null });
    request.onsuccess = (event) => {
      const db = event.target.result;
      const stores = db.objectStoreNames;
      const hasMeta = stores.contains('meta');
      const hasFiles = stores.contains('files');

      if (!hasMeta) {
        db.close();

        return resolve({ record: null, backgroundBlob: null });
      }

      const metaTransaction = db.transaction('meta', 'readonly');
      const metaStore = metaTransaction.objectStore('meta');
      const cursorRequest = metaStore.openCursor();

      cursorRequest.onsuccess = (e) => {
        const cursor = e.target.result;

        if (!cursor) {
          db.close();

          return resolve({ record: null, backgroundBlob: null });
        }

        const record = cursor.value;
        const recordKey = `${record.artist} - ${record.title}`;

        if (recordKey !== artistTitle) {
          return cursor.continue();
        }

        if (!hasFiles || record.id == null) {
          db.close();

          return resolve({ record, backgroundBlob: null });
        }

        const filesTransaction = db.transaction('files', 'readonly');
        const filesStore = filesTransaction.objectStore('files');
        const prefix = `${record.id}/`;
        const range = IDBKeyRange.bound(prefix, prefix + '\uffff');
        const filesCursor = filesStore.openCursor(range);

        filesCursor.onsuccess = (cursorEvent) => {
          const fileCursor = cursorEvent.target.result;

          if (!fileCursor) {
            db.close();

            return resolve({ record, backgroundBlob: null });
          }

          const key = fileCursor.key;

          if (typeof key === 'string' && /\.(png|jpe?g|gif|webp)$/i.test(key)) {
            const blob = fileCursor.value;

            db.close();

            return resolve({
              record,
              backgroundBlob: blob instanceof Blob ? blob : null,
            });
          }

          fileCursor.continue();
        };

        filesCursor.onerror = () => {
          db.close();
          resolve({ record, backgroundBlob: null });
        };
      };

      cursorRequest.onerror = () => {
        db.close();
        resolve({ record: null, backgroundBlob: null });
      };
    };
  });
}

function xpPerSec(xp, duration) {
  return duration ? (xp / duration).toFixed(2) : xp;
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
  let difficulty = null;
  let backgroundUrl = null;

  if (artistTitle) {
    const { record, backgroundBlob } = await queryBeatmapData(artistTitle);

    if (record?.versions) {
      const match = record.versions.find((v) => v.version === version);

      if (match?.total_length != null) {
        duration = msToSeconds(match.total_length);
      }

      if (match?.difficulty != null) {
        difficulty = match.difficulty;
      }
    }

    if (backgroundBlob) {
      backgroundUrl = await blobToDataURL(backgroundBlob);
    }
  }

  return { artistTitle, version, duration, difficulty, skills, backgroundUrl };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_DATA') {
    extractAll()
      .then((data) => {
        sendResponse({
          success: true,
          data,
          fullText: formatFull(data),
        });
      })
      .catch(() => {
        sendResponse({ success: false });
      });
  }
  return true;
});
