const extractButton = document.getElementById('btn-extract');
const statusMessage = document.getElementById('status-message');
const previewSection = document.getElementById('preview-section');
const dataPreview = document.getElementById('data-preview');
const copyFeedback = document.getElementById('copy-feedback');

let extractedText = '';

async function extractFromPage() {
  statusMessage.textContent = 'Extracting...';
  extractButton.disabled = true;

  let tabs;

  try {
    tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (err) {
    statusMessage.textContent = 'Could not access the active tab.';
    extractButton.disabled = false;

    return;
  }

  const tab = tabs.at(0);

  if (!tab?.id) {
    statusMessage.textContent = 'No active tab found.';
    extractButton.disabled = false;

    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    { type: 'EXTRACT_DATA' },
    async (response) => {
      extractButton.disabled = false;

      if (chrome.runtime.lastError) {
        statusMessage.textContent =
          'Content script not available on this page.';

        return;
      }

      if (!response?.success) {
        statusMessage.textContent = 'Extraction failed.';

        return;
      }

      extractedText = response.fullText ?? '';

      if (!extractedText) {
        statusMessage.textContent = 'No result screen found on this page.';

        return;
      }

      dataPreview.value = response.previewText ?? '';
      previewSection.hidden = false;
      copyFeedback.hidden = true;

      const skills = response.data?.skills ?? {};
      const active = Object.values(skills).filter((value) => value > 0).length;

      statusMessage.textContent = `Extracted — ${active} skill${
        active !== 1 ? 's' : ''
      } gained XP this round.`;

      await copyToClipboard();
    },
  );
}

async function copyToClipboard() {
  if (!extractedText) {
    return;
  }

  try {
    await navigator.clipboard.writeText(extractedText);

    copyFeedback.hidden = false;
    setTimeout(() => {
      copyFeedback.hidden = true;
    }, 2000);
  } catch (err) {
    chrome.runtime.sendMessage(
      { type: 'COPY_TO_CLIPBOARD', text: extractedText },
      (response) => {
        if (response?.success) {
          copyFeedback.hidden = false;
          setTimeout(() => {
            copyFeedback.hidden = true;
          }, 2000);
        } else {
          statusMessage.textContent = 'Failed to copy to clipboard.';
        }
      },
    );
  }
}

extractButton.addEventListener('click', extractFromPage);
