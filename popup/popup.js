const extractButton = document.getElementById('btn-extract');
const mainElement = document.querySelector('#view-main main');
const statsSection = document.getElementById('stats-section');
const viewport = document.getElementById('viewport');
const settingsButton = document.getElementById('btn-settings');
const backButton = document.getElementById('btn-back');

const profileSkillsContainer = document.getElementById('profile-skills');
const characterCard = document.getElementById('character-card');
const characterNameElement = document.getElementById('character-name');
const characterAvatarElement = document.getElementById('character-avatar');
const characterAvatarPlaceholder = document.getElementById(
  'character-avatar-placeholder',
);
const characterGlobalLevelElement = document.getElementById(
  'character-global-level',
);

let statusMessageElement = null;
let characterSkills = [];

function formatXp(value) {
  return value.toLocaleString('en-US').replace(/,/g, ' ');
}

function renderCharacterSkills() {
  profileSkillsContainer.replaceChildren();

  characterSkills.forEach((skill) => {
    const card = document.createElement('div');
    const header = document.createElement('div');
    const skillNameElement = document.createElement('span');
    const levelElement = document.createElement('span');
    const track = document.createElement('div');
    const fill = document.createElement('div');

    const percent = skill.xpToNext > 0 ? (skill.xp / skill.xpToNext) * 100 : 0;

    card.className = 'profile-skill';
    card.title =
      formatXp(skill.xp) +
      ' / ' +
      formatXp(skill.xpToNext) +
      ' XP to next level';

    header.className = 'profile-skill__header';

    skillNameElement.className = 'profile-skill__name';
    skillNameElement.textContent = skill.name;

    levelElement.className = 'profile-skill__level';
    levelElement.textContent = String(skill.level);

    header.appendChild(skillNameElement);
    header.appendChild(levelElement);

    track.className = 'profile-skill__track';
    fill.className = 'profile-skill__fill';
    fill.style.width = percent.toFixed(2) + '%';

    track.appendChild(fill);
    card.appendChild(header);
    card.appendChild(track);
    profileSkillsContainer.appendChild(card);
  });
}

function renderCharacterCard(name, avatarUrl, globalLevel) {
  characterNameElement.textContent = name || 'Character not found';
  characterNameElement.classList.toggle('character-name--not-found', !name);

  if (globalLevel != null) {
    characterGlobalLevelElement.textContent = `Lv. ${globalLevel}`;
    characterGlobalLevelElement.hidden = false;
  } else {
    characterGlobalLevelElement.hidden = true;
  }

  if (avatarUrl) {
    characterAvatarElement.src = avatarUrl;
    characterAvatarElement.hidden = false;
    characterAvatarPlaceholder.hidden = true;
  } else {
    characterAvatarElement.hidden = true;
    characterAvatarPlaceholder.hidden = false;
  }
}

const viewMain = document.getElementById('view-main');
const viewSettings = document.getElementById('view-settings');
const characterIdInput = document.getElementById('input-character-id');

function setViewportHeight(view) {
  requestAnimationFrame(() => {
    viewport.style.height = view.scrollHeight + 'px';
  });
}

function navigateTo(showSettings) {
  viewport.classList.toggle('show-settings', showSettings);
  setViewportHeight(showSettings ? viewSettings : viewMain);
}

settingsButton.addEventListener('click', () => navigateTo(true));
backButton.addEventListener('click', () => navigateTo(false));

async function saveCharacterId() {
  let id = parseInt(characterIdInput.value, 10);

  if (!id || Number.isNaN(id)) {
    id = 0;
  }

  await chrome.storage.local.set({ characterId: id });

  try {
    const result = await requestProfileDataFromBackground(id);

    characterSkills = result.skills;
    renderCharacterCard(
      result.characterName,
      result.characterAvatarUrl,
      result.globalLevel,
    );
  } catch {
    // Keep whatever is currently rendered.
  }

  renderCharacterSkills();
  setViewportHeight(viewSettings);
}

characterIdInput.addEventListener('blur', saveCharacterId);

characterIdInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    characterIdInput.blur();
  }
});

function setStatus(text) {
  if (!text) {
    if (statusMessageElement) {
      statusMessageElement.remove();
      statusMessageElement = null;
    }

    return;
  }

  if (!statusMessageElement) {
    statusMessageElement = document.createElement('p');
    statusMessageElement.id = 'status-message';
    mainElement.insertBefore(statusMessageElement, statsSection);
  }
  statusMessageElement.textContent = text;
}

const songBackground = document.getElementById('song-background');
const songTitle = document.getElementById('song-title');
const songVersion = document.getElementById('song-version');
const songDuration = document.getElementById('song-duration');
const skillsGrid = document.getElementById('skills-grid');
const totalXpDiv = document.getElementById('total-xp');
const totalXpValue = document.getElementById('total-value');
const copyFeedback = document.getElementById('copy-feedback');

let extractedText = '';

async function extractFromPage() {
  setStatus('Extracting...');

  let tabs;

  try {
    tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (err) {
    setStatus('Could not access the active tab.');

    return;
  }

  const tab = tabs.at(0);

  if (!tab?.id) {
    setStatus('No active tab found.');

    return;
  }

  const timeout = setTimeout(() => {
    setStatus('Extraction timed out. Try reloading the page.');
  }, 5000);

  function handleExtractResponse(response) {
    clearTimeout(timeout);

    if (chrome.runtime.lastError) {
      setStatus('Content script not available. Try reloading the page.');
      setViewportHeight(viewMain);

      return;
    }

    if (!response?.success) {
      setStatus('Extraction failed.');
      setViewportHeight(viewMain);

      return;
    }

    const hasSkills = Object.values(response.data.skills).some((xp) => xp > 0);

    if (!hasSkills) {
      setStatus('No result screen found on this page.');
      setViewportHeight(viewMain);

      return;
    }

    extractedText = response.fullText ?? '';

    statsSection.hidden = false;
    copyFeedback.hidden = true;

    displayStats(response.data);
    setStatus('');
    setViewportHeight(viewMain);

    copyToClipboard();
  }

  chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_DATA' }, (response) => {
    if (chrome.runtime.lastError) {
      clearTimeout(timeout);
      setStatus('Content script not available. Try reloading the page.');
      setViewportHeight(viewMain);

      return;
    }

    handleExtractResponse(response);
  });
}

function xpPerSec(xp, duration) {
  return duration ? (xp / duration).toFixed(2) : xp;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return `${m}:${String(s).padStart(2, '0')}`;
}

function displayStats(data) {
  const {
    artistTitle,
    backgroundUrl,
    difficulty,
    duration,
    skillOrder,
    skills,
    version,
  } = data;

  if (backgroundUrl) {
    songBackground.src = backgroundUrl;
    songBackground.hidden = false;
  } else {
    songBackground.hidden = true;
  }

  songTitle.textContent = artistTitle || 'Unknown Song';
  songVersion.replaceChildren();

  if (version) {
    songVersion.appendChild(document.createTextNode(version + ' '));
  }
  if (difficulty != null) {
    const diffSpan = document.createElement('span');
    const star = document.createElement('span');

    diffSpan.className = 'song-difficulty';
    star.className = 'star';
    star.textContent = '\u2605';
    diffSpan.appendChild(star);
    diffSpan.appendChild(document.createTextNode(difficulty.toFixed(2)));
    songVersion.appendChild(diffSpan);
  }
  songDuration.textContent = duration ? formatDuration(duration) : '';
  skillsGrid.replaceChildren();

  skillOrder.forEach((skillName) => {
    const xp = skills[skillName] ?? 0;

    if (xp > 0) {
      const card = document.createElement('div');
      const name = document.createElement('p');
      const value = document.createElement('p');
      const unit = document.createElement('span');

      card.className = 'skill-card';
      name.className = 'skill-name';
      name.textContent = skillName;
      value.className = 'skill-value';
      value.appendChild(document.createTextNode(xpPerSec(xp, duration)));
      unit.className = 'unit';
      unit.textContent = '/s';
      value.appendChild(unit);

      card.appendChild(name);
      card.appendChild(value);
      skillsGrid.appendChild(card);
    }
  });

  const totalXP = Object.values(skills).reduce((sum, xp) => sum + xp, 0);
  const totalUnit = document.createElement('span');

  totalXpValue.replaceChildren();
  totalXpValue.appendChild(
    document.createTextNode(xpPerSec(totalXP, duration)),
  );
  totalUnit.className = 'unit';
  totalUnit.textContent = '/s';
  totalXpValue.appendChild(totalUnit);
  totalXpDiv.hidden = false;
}

async function copyToClipboard() {
  if (!extractedText) {
    return;
  }

  try {
    await navigator.clipboard.writeText(extractedText);
    showCopyFeedback('Copied to clipboard!');
  } catch (err) {
    chrome.runtime.sendMessage(
      { type: 'COPY_TO_CLIPBOARD', text: extractedText },
      (response) => {
        if (response?.success) {
          showCopyFeedback('Copied to clipboard!');
        } else {
          setStatus('Failed to copy to clipboard.');
        }
      },
    );
  }
}

function showCopyFeedback(message) {
  copyFeedback.textContent = message;
  copyFeedback.hidden = false;
  setViewportHeight(viewMain);
  setTimeout(() => {
    copyFeedback.hidden = true;
    setViewportHeight(viewMain);
  }, 2000);
}

extractButton.addEventListener('click', extractFromPage);

function requestProfileDataFromBackground(characterId) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'FETCH_CHARACTER_DATA', characterId },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));

          return;
        }

        if (response?.success) {
          resolve({
            characterId: response.characterId ?? null,
            characterName: response.characterName ?? null,
            characterAvatarUrl: response.characterAvatarUrl ?? null,
            skills: response.skills,
            globalLevel: response.globalLevel ?? null,
          });
        } else {
          reject(new Error(response?.error ?? 'Unknown error'));
        }
      },
    );
  });
}

async function init() {
  const stored = await chrome.storage.local.get([
    'characterId',
    'characterAvatarUrl',
    'characterName',
    'skills',
    'globalLevel',
  ]);
  const characterId = stored.characterId ?? 0;

  if (characterId) {
    characterIdInput.value = characterId;
  }

  characterSkills = stored.skills ?? [];
  renderCharacterCard(
    stored.characterName ?? null,
    stored.characterAvatarUrl ?? null,
    stored.globalLevel ?? null,
  );
  renderCharacterSkills();

  try {
    const result = await requestProfileDataFromBackground(characterId);

    characterSkills = result.skills;
    renderCharacterCard(
      result.characterName,
      result.characterAvatarUrl,
      result.globalLevel,
    );
  } catch {
    // Keep whatever is currently rendered.
  }

  renderCharacterSkills();
  setViewportHeight(viewMain);
}

init();
