const status = document.getElementById('status');

const SAVED_PAGES = [
  { host: 'linkedin.com', path: /\/my-items\//, hint: 'linkedin.com/my-items/saved-posts/' },
  { host: 'instagram.com', path: /\/saved\//, hint: 'instagram.com/<you>/saved/all-posts/' },
];

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'progress') status.textContent = `Loading… ${msg.count} posts found`;
});

document.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const site = SAVED_PAGES.find((s) => tab?.url?.includes(s.host));
    if (!site) {
      status.textContent = 'Open your LinkedIn or Instagram saved items page first.';
      return;
    }
    if (!site.path.test(new URL(tab.url).pathname)) {
      status.textContent = `Go to ${site.hint} first.`;
      return;
    }
    document.querySelectorAll('button').forEach((b) => (b.disabled = true));
    status.textContent = 'Scrolling to load all saves…';
    try {
      const res = await chrome.tabs.sendMessage(tab.id, {
        action: 'export',
        format: btn.dataset.format,
      });
      status.textContent = res?.ok
        ? `Done — exported ${res.count} posts.`
        : `Not on a saved-items page (${site.hint}).`;
    } catch {
      status.textContent = 'Could not reach the page. Reload the tab and try again.';
    }
    document.querySelectorAll('button').forEach((b) => (b.disabled = false));
  });
});
