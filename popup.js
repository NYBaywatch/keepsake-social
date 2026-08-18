const status = document.getElementById('status');

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'progress') status.textContent = `Loading… ${msg.count} posts found`;
});

document.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url?.includes('linkedin.com/my-items')) {
      status.textContent = 'Open your LinkedIn My Items page first.';
      return;
    }
    document.querySelectorAll('button').forEach((b) => (b.disabled = true));
    status.textContent = 'Scrolling to load all saves…';
    try {
      const res = await chrome.tabs.sendMessage(tab.id, {
        action: 'export',
        format: btn.dataset.format,
      });
      status.textContent = res?.ok ? `Done — exported ${res.count} posts.` : 'Export failed.';
    } catch {
      status.textContent = 'Could not reach the page. Reload the LinkedIn tab and try again.';
    }
    document.querySelectorAll('button').forEach((b) => (b.disabled = false));
  });
});
