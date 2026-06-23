const extractButton = document.getElementById('btn-extract');
const mainElement = document.querySelector('main');
const statsSection = document.getElementById('stats-section');

let statusMessageElement = null;

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
  setTimeout(() => {
    copyFeedback.hidden = true;
  }, 2000);
}

extractButton.addEventListener('click', extractFromPage);
