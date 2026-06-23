const CHARACTER_API_URL = `https://api.osu.idle.rhythmgamers.net/v1/characters`;

const SKILL_API_KEYS = [
  { name: 'Accuracy', key: 'accuracy' },
  { name: 'Speed', key: 'speed' },
  { name: 'Stamina', key: 'stamina' },
  { name: 'Jack Speed', key: 'jackspeed' },
  { name: 'Coordination', key: 'coordination' },
  { name: 'Release', key: 'release' },
  { name: 'Reading', key: 'reading' },
  { name: 'Consistency', key: 'consistency' },
  { name: 'Concentration', key: 'concentration' },
  { name: 'Speed Jam', key: 'speedjam' },
  { name: 'Memory', key: 'memory' },
];

const DEFAULT_CHARACTER_SKILLS = [
  { name: 'Accuracy', xp: 0, xpToNext: 0, level: 0 },
  { name: 'Speed', xp: 0, xpToNext: 0, level: 0 },
  { name: 'Stamina', xp: 0, xpToNext: 0, level: 0 },
  { name: 'Jack Speed', xp: 0, xpToNext: 0, level: 0 },
  { name: 'Coordination', xp: 0, xpToNext: 0, level: 0 },
  { name: 'Release', xp: 0, xpToNext: 0, level: 0 },
  { name: 'Reading', xp: 0, xpToNext: 0, level: 0 },
  { name: 'Consistency', xp: 0, xpToNext: 0, level: 0 },
  { name: 'Concentration', xp: 0, xpToNext: 0, level: 0 },
  { name: 'Speed Jam', xp: 0, xpToNext: 0, level: 0 },
  { name: 'Memory', xp: 0, xpToNext: 0, level: 0 },
];

function mapApiResponseToCharacterSkills(data) {
  return SKILL_API_KEYS.map(({ name, key }) => {
    const xp = data[key + 'Xp'] ?? 0;
    const totalXp = data[key + 'TotalXp'] ?? 0;
    const level = data[key + 'Level'] ?? 0;

    return { name, xp, xpToNext: totalXp, level };
  });
}

async function fetchAndStoreCharacterData(characterId) {
  const characterData = {
    characterId,
    characterName: '',
    characterAvatarUrl: '',
    skills: DEFAULT_CHARACTER_SKILLS,
    globalLevel: 0,
  };

  if (!characterId) {
    await chrome.storage.local.set(characterData);

    return characterData;
  }

  const response = await fetch(`${CHARACTER_API_URL}/${characterId}`);

  if (!response.ok) {
    return characterData;
  }

  const data = await response.json();
  const skills = mapApiResponseToCharacterSkills(data);
  const characterName = data.name ?? '';
  const characterAvatarUrl = data.avatarUrl ?? '';
  const globalLevel = data.overallLevel ?? 0;

  await chrome.storage.local.set({
    characterId,
    characterName,
    characterAvatarUrl,
    skills,
    globalLevel,
  });

  return {
    characterId,
    characterName,
    characterAvatarUrl,
    skills,
    globalLevel,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'FETCH_CHARACTER_DATA') {
    const characterId = message.characterId ?? null;

    fetchAndStoreCharacterData(characterId)
      .then(({ skills, characterName, characterAvatarUrl, globalLevel }) =>
        sendResponse({
          success: true,
          skills,
          characterName,
          characterAvatarUrl,
          globalLevel,
        }),
      )
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  if (message.type === 'COPY_TO_CLIPBOARD') {
    const text = message.text ?? '';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs.at(0);

      if (!tab?.id) {
        sendResponse({ success: false, error: 'No active tab' });

        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: (textToCopy) => {
            return navigator.clipboard
              .writeText(textToCopy)
              .then(() => true)
              .catch(() => false);
          },
          args: [text],
        },
        (results) => {
          const success = results?.[0]?.result === true;

          sendResponse({ success });
        },
      );
    });

    return true;
  }
});
