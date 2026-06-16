chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'COPY_TO_CLIPBOARD') {
    const text = message.text ?? '';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      if (!tab?.id) {
        sendResponse({ success: false, error: 'Aucun onglet actif' });

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
